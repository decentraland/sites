import { act, renderHook } from '@testing-library/react'
import type { AuthIdentity } from '@dcl/crypto'
import { useCreateEventForm } from './useCreateEventForm'
import type { CreateEventFormState } from './useCreateEventForm'

const mockCreateEvent = jest.fn()
const mockUploadPoster = jest.fn()
const mockUploadPosterVertical = jest.fn()
const mockUnwrap = jest.fn()

let mockUseAuthIdentityReturn: { identity: AuthIdentity | undefined }

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('../features/whats-on-events', () => ({
  useCreateEventMutation: () => [mockCreateEvent],
  useUploadPosterMutation: () => [mockUploadPoster],
  useUploadPosterVerticalMutation: () => [mockUploadPosterVertical]
}))

jest.mock('./useAuthIdentity', () => ({
  useAuthIdentity: () => mockUseAuthIdentityReturn
}))

type FormOverrides = Partial<Record<keyof CreateEventFormState, string>>

function buildValidFormFields(overrides: FormOverrides = {}) {
  const defaults = {
    name: 'Cool event',
    description: 'Something to do',
    startDate: '2030-01-01',
    startTime: '10:00',
    endDate: '2030-01-01',
    endTime: '12:00',
    coordX: '20',
    coordY: '10',
    email: 'host@example.com'
  } satisfies FormOverrides
  return { ...defaults, ...overrides }
}

function fillValidForm(setField: ReturnType<typeof useCreateEventForm>['setField'], overrides: FormOverrides = {}) {
  const values = buildValidFormFields(overrides)
  act(() => {
    setField('name', values.name)
    setField('description', values.description)
    setField('startDate', values.startDate)
    setField('startTime', values.startTime)
    setField('endDate', values.endDate)
    setField('endTime', values.endTime)
    setField('coordX', values.coordX)
    setField('coordY', values.coordY)
    setField('email', values.email)
  })
}

describe('useCreateEventForm', () => {
  let mockIdentity: AuthIdentity

  beforeEach(() => {
    mockIdentity = { authChain: [{ payload: '0xabc' }] } as unknown as AuthIdentity
    mockUseAuthIdentityReturn = { identity: mockIdentity }
    mockCreateEvent.mockReturnValue({ unwrap: () => mockUnwrap() })
    mockUploadPoster.mockReturnValue({ unwrap: () => Promise.resolve({ url: 'https://cdn/test.png' }) })
    mockUploadPosterVertical.mockReturnValue({ unwrap: () => Promise.resolve({ url: 'https://cdn/vertical.png' }) })
    mockUnwrap.mockResolvedValue({ ok: true, data: { id: 'ev-1' } })
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: jest.fn(() => 'blob:preview') })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: jest.fn() })
  })

  afterEach(() => {
    delete (URL as unknown as Record<string, unknown>).createObjectURL

    delete (URL as unknown as Record<string, unknown>).revokeObjectURL
    jest.resetAllMocks()
  })

  describe('when initialized', () => {
    it('should expose a blank form and surface required-field errors on submit', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      expect(result.current.form.name).toBe('')
      expect(result.current.errors).toEqual({})

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockCreateEvent).not.toHaveBeenCalled()
      expect(result.current.errors.name).toBe('create_event.error_required')
      expect(result.current.errors.description).toBe('create_event.error_required')
    })
  })

  describe('when setField is called with a valid value', () => {
    it('should update the form state', () => {
      const { result } = renderHook(() => useCreateEventForm())

      act(() => {
        result.current.setField('name', 'My Event')
      })

      expect(result.current.form.name).toBe('My Event')
    })
  })

  describe('when setField is called with a key that has a pre-existing error', () => {
    it('should clear the error for that key', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField, { name: '' })
      await act(async () => {
        await result.current.handleSubmit()
      })
      expect(result.current.errors.name).toBe('create_event.error_required')

      act(() => {
        result.current.setField('name', 'New name')
      })

      expect(result.current.errors.name).toBeUndefined()
    })
  })

  describe('when a required field is left empty', () => {
    it('should report the required error for that field', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField, { description: '' })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.errors.description).toBe('create_event.error_required')
    })
  })

  describe('when the email format is invalid', () => {
    it('should report the invalid-email error', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField, { email: 'not-an-email' })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.errors.email).toBe('create_event.error_invalid_email')
    })
  })

  describe('when repeat is enabled and a valid end date is provided', () => {
    it('should include recurrent fields in the payload', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField)
      act(() => {
        result.current.setField('repeatEnabled', true)
        result.current.setField('frequency', 'every_week')
        result.current.setField('repeatEndDate', '2030-02-01')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            recurrent: true,
            recurrent_frequency: 'WEEKLY',
            recurrent_until: expect.stringContaining('2030-02-01')
          })
        })
      )
    })
  })

  describe('when all required fields are filled with valid values', () => {
    it('should submit without validation errors', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField)

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.errors).toEqual({})
      expect(mockCreateEvent).toHaveBeenCalled()
    })
  })

  describe('when the name exceeds 150 characters', () => {
    it('should report the name length error on submit', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField, { name: 'x'.repeat(151) })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.errors.name).toBe('create_event.error_name_too_long')
    })
  })

  describe('when the description exceeds 5000 characters', () => {
    it('should report the description length error on submit', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField, { description: 'y'.repeat(5001) })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.errors.description).toBe('create_event.error_description_too_long')
    })
  })

  describe('when the end time is before the start time', () => {
    it('should report the end-before-start error', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField, {
        startDate: '2030-01-01',
        startTime: '14:00',
        endDate: '2030-01-01',
        endTime: '12:00'
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.errors.endDate).toBe('create_event.error_end_before_start')
    })
  })

  describe('when the duration exceeds 24 hours', () => {
    it('should report the duration error', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField, {
        startDate: '2030-01-01',
        startTime: '10:00',
        endDate: '2030-01-03',
        endTime: '10:00'
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.errors.endDate).toBe('create_event.error_duration_too_long')
    })
  })

  describe('when the coordinates are out of range', () => {
    it('should report both coordX and coordY errors', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField, { coordX: '999', coordY: '-999' })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.errors.coordX).toBe('create_event.error_coord_x_range')
      expect(result.current.errors.coordY).toBe('create_event.error_coord_y_range')
    })
  })

  describe('when the location is world but no world is selected', () => {
    it('should report the world required error and keep the form invalid', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField)
      act(() => {
        result.current.setField('location', 'world')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.errors.world).toBe('create_event.error_required')
    })
  })

  describe('when repeat is enabled without an end date', () => {
    it('should report the repeatEndDate required error', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField)
      act(() => {
        result.current.setField('repeatEnabled', true)
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.errors.repeatEndDate).toBe('create_event.error_required')
    })
  })

  describe('when handleImageSelect receives an unsupported file type', () => {
    it('should surface the invalid type error and not call uploadPoster', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      const file = new File(['x'], 'a.bmp', { type: 'image/bmp' })

      await act(async () => {
        await result.current.handleImageSelect(file)
      })

      expect(result.current.form.imageError).toBe('create_event.error_invalid_image_type')
      expect(mockUploadPoster).not.toHaveBeenCalled()
    })
  })

  describe('when handleImageSelect receives a file larger than 500kb', () => {
    it('should surface the too-large error', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      const oversized = new File([new Uint8Array(600 * 1024)], 'big.png', { type: 'image/png' })

      await act(async () => {
        await result.current.handleImageSelect(oversized)
      })

      expect(result.current.form.imageError).toBe('create_event.error_image_too_large')
    })
  })

  describe('when handleImageSelect succeeds', () => {
    it('should store the uploaded url in form state', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      const file = new File(['x'], 'valid.png', { type: 'image/png' })

      await act(async () => {
        await result.current.handleImageSelect(file)
      })

      expect(mockUploadPoster).toHaveBeenCalledWith({ file, identity: mockIdentity })
      expect(result.current.form.imageUrl).toBe('https://cdn/test.png')
      expect(result.current.form.isUploadingImage).toBe(false)
    })
  })

  describe('when handleImageSelect upload fails', () => {
    beforeEach(() => {
      mockUploadPoster.mockReturnValue({ unwrap: () => Promise.reject(new Error('boom')) })
    })

    it('should surface the upload-failed error', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      const file = new File(['x'], 'valid.png', { type: 'image/png' })

      await act(async () => {
        await result.current.handleImageSelect(file)
      })

      expect(result.current.form.imageError).toBe('create_event.error_upload_failed')
    })
  })

  describe('when handleImageSelect is called without an authenticated identity', () => {
    beforeEach(() => {
      mockUseAuthIdentityReturn = { identity: undefined }
    })

    it('should surface the upload-failed error and skip the upload call', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      const file = new File(['x'], 'valid.png', { type: 'image/png' })

      await act(async () => {
        await result.current.handleImageSelect(file)
      })

      expect(mockUploadPoster).not.toHaveBeenCalled()
      expect(result.current.form.imageError).toBe('create_event.error_upload_failed')
    })
  })

  describe('when handleVerticalImageSelect is called without an authenticated identity', () => {
    beforeEach(() => {
      mockUseAuthIdentityReturn = { identity: undefined }
    })

    it('should surface the upload-failed error and skip the upload call', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      const file = new File(['x'], 'v.png', { type: 'image/png' })

      await act(async () => {
        await result.current.handleVerticalImageSelect(file)
      })

      expect(mockUploadPosterVertical).not.toHaveBeenCalled()
      expect(result.current.form.verticalImageError).toBe('create_event.error_upload_failed')
    })
  })

  describe('when handleVerticalImageSelect receives a gif', () => {
    it('should reject the gif (vertical only accepts png/jpeg)', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      const gif = new File(['x'], 'v.gif', { type: 'image/gif' })

      await act(async () => {
        await result.current.handleVerticalImageSelect(gif)
      })

      expect(result.current.form.verticalImageError).toBe('create_event.error_invalid_vertical_image_type')
      expect(mockUploadPosterVertical).not.toHaveBeenCalled()
    })
  })

  describe('when handleVerticalImageSelect receives a file larger than 500kb', () => {
    it('should surface the too-large error', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      const oversized = new File([new Uint8Array(600 * 1024)], 'big.png', { type: 'image/png' })

      await act(async () => {
        await result.current.handleVerticalImageSelect(oversized)
      })

      expect(result.current.form.verticalImageError).toBe('create_event.error_image_too_large')
    })
  })

  describe('when handleVerticalImageSelect succeeds', () => {
    it('should store the uploaded vertical url and clear the uploading flag', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      const file = new File(['x'], 'v.png', { type: 'image/png' })

      await act(async () => {
        await result.current.handleVerticalImageSelect(file)
      })

      expect(mockUploadPosterVertical).toHaveBeenCalledWith({ file, identity: mockIdentity })
      expect(result.current.form.verticalImageUrl).toBe('https://cdn/vertical.png')
      expect(result.current.form.isUploadingVerticalImage).toBe(false)
    })
  })

  describe('when the vertical upload fails', () => {
    beforeEach(() => {
      mockUploadPosterVertical.mockReturnValue({ unwrap: () => Promise.reject(new Error('nope')) })
    })

    it('should surface the upload-failed error', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      const file = new File(['x'], 'v.png', { type: 'image/png' })

      await act(async () => {
        await result.current.handleVerticalImageSelect(file)
      })

      expect(result.current.form.verticalImageError).toBe('create_event.error_upload_failed')
    })
  })

  describe('when handleVerticalImageRemove is called after a successful upload', () => {
    it('should clear the vertical image state', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      const file = new File(['x'], 'v.png', { type: 'image/png' })

      await act(async () => {
        await result.current.handleVerticalImageSelect(file)
      })

      act(() => {
        result.current.handleVerticalImageRemove()
      })

      expect(result.current.form.verticalImage).toBeNull()
      expect(result.current.form.verticalImageUrl).toBeNull()
      expect(result.current.form.verticalImageError).toBeNull()
    })
  })

  describe('when handleImageRemove is called', () => {
    it('should clear the image state', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      const file = new File(['x'], 'valid.png', { type: 'image/png' })

      await act(async () => {
        await result.current.handleImageSelect(file)
      })

      act(() => {
        result.current.handleImageRemove()
      })

      expect(result.current.form.image).toBeNull()
      expect(result.current.form.imageUrl).toBeNull()
    })
  })

  describe('when handleSubmit succeeds', () => {
    it('should call createEvent with the mapped payload', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField)

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            name: 'Cool event',
            x: 20,
            y: 10,
            contact: 'host@example.com',
            categories: []
          }),
          identity: mockIdentity
        })
      )
    })

    it('should invoke the onSuccess callback', async () => {
      const onSuccess = jest.fn()
      const { result } = renderHook(() => useCreateEventForm({ onSuccess }))

      fillValidForm(result.current.setField)

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })
  })

  describe('when handleSubmit hits a server error', () => {
    beforeEach(() => {
      mockUnwrap.mockRejectedValue({ status: 400, data: { error: 'too long', code: 'bad_request' } })
    })

    it('should set the generic submit error and not call onSuccess', async () => {
      const onSuccess = jest.fn()
      const { result } = renderHook(() => useCreateEventForm({ onSuccess }))

      fillValidForm(result.current.setField)

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.errors.submit).toBe('create_event.error_submit')
      expect(onSuccess).not.toHaveBeenCalled()
    })
  })

  describe('when handleSubmit is invoked without an identity', () => {
    beforeEach(() => {
      mockUseAuthIdentityReturn = { identity: undefined }
    })

    it('should not call createEvent', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField)

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockCreateEvent).not.toHaveBeenCalled()
    })
  })

  describe('when the location is world and a world is selected', () => {
    it('should submit with world=true, server=<name>, and coords forced to 0', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField, { coordX: '5', coordY: '7' })
      act(() => {
        result.current.setField('location', 'world')
        result.current.setField('world', 'my-world.dcl.eth')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            x: 0,
            y: 0,
            world: true,
            server: 'my-world.dcl.eth'
          })
        })
      )
    })
  })

  describe('when a community is selected', () => {
    it('should include community_id in the payload', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField)
      act(() => {
        result.current.setField('communityId', 'community-42')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ community_id: 'community-42' })
        })
      )
    })
  })
})
