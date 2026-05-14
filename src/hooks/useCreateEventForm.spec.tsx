import { act, renderHook } from '@testing-library/react'
import type { AuthIdentity } from '@dcl/crypto'
import type { EventEntry } from '../features/events'
import { useCreateEventForm } from './useCreateEventForm'
import type { CreateEventFormState } from './useCreateEventForm.types'

const mockCreateEvent = jest.fn()
const mockUpdateEvent = jest.fn()
const mockUploadPoster = jest.fn()
const mockUploadPosterVertical = jest.fn()
const mockUnwrap = jest.fn()
const mockUpdateUnwrap = jest.fn()
const mockCaptureException = jest.fn()

let mockUseAuthIdentityReturn: { identity: AuthIdentity | undefined }

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('@sentry/browser', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args)
}))

jest.mock('../features/events', () => ({
  useCreateEventMutation: () => [mockCreateEvent],
  useUpdateEventMutation: () => [mockUpdateEvent],
  useUploadPosterMutation: () => [mockUploadPoster],
  useUploadPosterVerticalMutation: () => [mockUploadPosterVertical]
}))

function buildInitialEvent(overrides: Partial<EventEntry> = {}): EventEntry {
  return {
    id: 'ev-42',
    name: 'Existing event',
    description: 'Existing description',
    image: 'https://cdn/existing.png',
    image_vertical: 'https://cdn/existing-vertical.png',
    start_at: '2030-03-15T14:00:00.000Z',
    finish_at: '2030-03-15T16:00:00.000Z',
    duration: 2 * 60 * 60 * 1000,
    x: 5,
    y: 6,
    world: false,
    server: null,
    community_id: null,
    contact: 'owner@example.com',
    recurrent: false,
    user: '0xabc',
    ...overrides
  } as unknown as EventEntry
}

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
    duration: '02:00',
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
    setField('duration', values.duration)
    setField('coordX', values.coordX)
    setField('coordY', values.coordY)
    setField('email', values.email)
    setField('imageUrl', 'https://cdn/test.png')
    setField('imagePreviewUrl', 'https://cdn/test.png')
  })
}

let mockImageWidth = 716
let mockImageHeight = 1814
let mockImageShouldFail = false

class MockImage {
  public naturalWidth = 0
  public naturalHeight = 0
  public onload: (() => void) | null = null
  public onerror: (() => void) | null = null
  set src(_url: string) {
    setTimeout(() => {
      if (mockImageShouldFail) {
        this.onerror?.()
      } else {
        this.naturalWidth = mockImageWidth
        this.naturalHeight = mockImageHeight
        this.onload?.()
      }
    }, 0)
  }
}

const originalImage = global.Image

describe('useCreateEventForm', () => {
  let mockIdentity: AuthIdentity

  beforeEach(() => {
    mockIdentity = { authChain: [{ payload: '0xabc' }] } as unknown as AuthIdentity
    mockUseAuthIdentityReturn = { identity: mockIdentity }
    mockCreateEvent.mockReturnValue({ unwrap: () => mockUnwrap() })
    mockUpdateEvent.mockReturnValue({ unwrap: () => mockUpdateUnwrap() })
    mockUploadPoster.mockReturnValue({ unwrap: () => Promise.resolve({ url: 'https://cdn/test.png' }) })
    mockUploadPosterVertical.mockReturnValue({ unwrap: () => Promise.resolve({ url: 'https://cdn/vertical.png' }) })
    mockUnwrap.mockResolvedValue({ ok: true, data: { id: 'ev-1' } })
    mockUpdateUnwrap.mockResolvedValue({ ok: true, data: { id: 'ev-42' } })
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: jest.fn(() => 'blob:preview') })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: jest.fn() })
    mockImageWidth = 716
    mockImageHeight = 1814
    mockImageShouldFail = false
    ;(global as unknown as { Image: unknown }).Image = MockImage
  })

  afterEach(() => {
    delete (URL as unknown as Record<string, unknown>).createObjectURL

    delete (URL as unknown as Record<string, unknown>).revokeObjectURL
    ;(global as unknown as { Image: unknown }).Image = originalImage
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
            recurrent_interval: 1,
            recurrent_until: expect.stringContaining('2030-02-01')
          })
        })
      )
    })
  })

  describe('when repeat is enabled and a custom interval is provided', () => {
    it('should include the interval in the payload', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField)
      act(() => {
        result.current.setField('repeatEnabled', true)
        result.current.setField('frequency', 'every_week')
        result.current.setField('repeatInterval', '2')
        result.current.setField('repeatEndDate', '2030-02-01')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            recurrent_frequency: 'WEEKLY',
            recurrent_interval: 2
          })
        })
      )
    })
  })

  describe('when repeat is enabled with a non-integer interval', () => {
    it('should report the interval invalid error', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField)
      act(() => {
        result.current.setField('repeatEnabled', true)
        result.current.setField('repeatInterval', '1.5')
        result.current.setField('repeatEndDate', '2030-02-01')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.errors.repeatInterval).toBe('create_event.error_repeat_interval_invalid')
      expect(mockCreateEvent).not.toHaveBeenCalled()
    })
  })

  describe('when repeat is enabled with an out-of-range interval', () => {
    it('should report the interval invalid error', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField)
      act(() => {
        result.current.setField('repeatEnabled', true)
        result.current.setField('repeatInterval', '999')
        result.current.setField('repeatEndDate', '2030-02-01')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.errors.repeatInterval).toBe('create_event.error_repeat_interval_invalid')
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

  describe('when the duration value is not a valid HH:MM string', () => {
    it('should report the duration invalid error', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField, { duration: 'abc' })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.errors.duration).toBe('create_event.error_duration_invalid')
    })
  })

  describe('when the duration exceeds 24 hours', () => {
    it('should report the duration-too-long error', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField, { duration: '25:00' })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(result.current.errors.duration).toBe('create_event.error_duration_too_long')
    })
  })

  describe('when a valid duration is provided', () => {
    it('should submit with duration in milliseconds', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField, { duration: '03:30' })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            duration: (3 * 60 + 30) * 60 * 1000
          })
        })
      )
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

      expect(result.current.form.imageError).toBe('invalid_image_type')
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

      expect(result.current.form.imageError).toBe('image_too_large')
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

      expect(result.current.form.imageError).toBe('upload_failed')
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
      expect(result.current.form.imageError).toBe('upload_failed')
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
      expect(result.current.form.verticalImageError).toBe('upload_failed')
    })
  })

  describe('when handleVerticalImageSelect receives a gif', () => {
    it('should reject the gif (vertical only accepts png/jpeg)', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      const gif = new File(['x'], 'v.gif', { type: 'image/gif' })

      await act(async () => {
        await result.current.handleVerticalImageSelect(gif)
      })

      expect(result.current.form.verticalImageError).toBe('invalid_vertical_image_type')
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

      expect(result.current.form.verticalImageError).toBe('image_too_large')
    })
  })

  describe('when the vertical image dimensions do not match 716x1814', () => {
    beforeEach(() => {
      mockImageWidth = 500
      mockImageHeight = 500
    })

    it('should surface the vertical-dimensions error and not call uploadPosterVertical', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      const file = new File(['x'], 'v.png', { type: 'image/png' })

      await act(async () => {
        await result.current.handleVerticalImageSelect(file)
      })

      expect(result.current.form.verticalImageError).toBe('vertical_image_dimensions')
      expect(mockUploadPosterVertical).not.toHaveBeenCalled()
    })
  })

  describe('when the vertical image fails to decode', () => {
    beforeEach(() => {
      mockImageShouldFail = true
    })

    it('should surface the decode error and report it to Sentry so the user retries with a different file', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      const file = new File(['x'], 'v.png', { type: 'image/png' })

      await act(async () => {
        await result.current.handleVerticalImageSelect(file)
      })

      expect(result.current.form.verticalImageError).toBe('vertical_image_decode')
      expect(mockUploadPosterVertical).not.toHaveBeenCalled()
      expect(mockCaptureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ tags: expect.objectContaining({ feature: 'create_event', step: 'vertical_image_decode' }) })
      )
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

      expect(result.current.form.verticalImageError).toBe('upload_failed')
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

  describe('when handleSubmit succeeds with location land', () => {
    it('should send an explicit `world: false` so PATCHing an existing world-flagged event clears the stale flag', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField)

      await act(async () => {
        await result.current.handleSubmit()
      })

      const [createCall] = mockCreateEvent.mock.calls
      const payload = (createCall[0] as { payload: Record<string, unknown> }).payload

      expect(payload.world).toBe(false)
      expect(payload.server).toBeNull()
    })
  })

  describe('when handleSubmit succeeds with location world', () => {
    it('should send `world: true` and the chosen server name as the world value', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField)
      act(() => {
        result.current.setField('location', 'world')
        result.current.setField('world', 'foo.dcl.eth')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      const [createCall] = mockCreateEvent.mock.calls
      const payload = (createCall[0] as { payload: Record<string, unknown> }).payload

      expect(payload.world).toBe(true)
      expect(payload.server).toBe('foo.dcl.eth')
    })
  })

  describe('when editing an existing event with stale `world: true` and switching back to land', () => {
    let initialEvent: EventEntry

    beforeEach(() => {
      initialEvent = buildInitialEvent({ world: true, server: null, x: -77, y: 77 })
    })

    it('should load the form as land so the owner can save without re-entering coords', () => {
      const { result } = renderHook(() => useCreateEventForm({ initialEvent }))

      expect(result.current.form.location).toBe('land')
      expect(result.current.form.coordX).toBe('-77')
      expect(result.current.form.coordY).toBe('77')
    })

    it('should PATCH with an explicit `world: false` so the backend clears the stale flag', async () => {
      const { result } = renderHook(() => useCreateEventForm({ initialEvent }))

      await act(async () => {
        await result.current.handleSubmit()
      })

      const [updateCall] = mockUpdateEvent.mock.calls
      const payload = (updateCall[0] as { payload: Record<string, unknown> }).payload

      expect(payload.world).toBe(false)
      expect(payload.server).toBeNull()
      expect(payload.x).toBe(-77)
      expect(payload.y).toBe(77)
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

    it('should surface the not-signed-in submit error and not call createEvent', async () => {
      const { result } = renderHook(() => useCreateEventForm())

      fillValidForm(result.current.setField)

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockCreateEvent).not.toHaveBeenCalled()
      expect(result.current.errors.submit).toBe('create_event.error_not_signed_in')
    })
  })

  describe('when handleSubmit is invoked while an image upload is in flight', () => {
    it('should not call createEvent so the payload does not ship with a null imageUrl', async () => {
      let resolveUpload: ((value: { url: string }) => void) | null = null
      mockUploadPoster.mockReturnValueOnce({
        unwrap: () =>
          new Promise<{ url: string }>(resolve => {
            resolveUpload = resolve
          })
      })

      const { result } = renderHook(() => useCreateEventForm())
      fillValidForm(result.current.setField)

      const file = new File(['x'], 'valid.png', { type: 'image/png' })
      let pendingSelect: Promise<void> | null = null
      act(() => {
        pendingSelect = result.current.handleImageSelect(file)
      })
      expect(result.current.form.isUploadingImage).toBe(true)

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockCreateEvent).not.toHaveBeenCalled()

      await act(async () => {
        resolveUpload?.({ url: 'https://cdn/test.png' })
        await pendingSelect
      })
    })
  })

  describe('when handleSubmit is invoked with a persistent image error', () => {
    it('should not call createEvent so the user fixes the image first', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      fillValidForm(result.current.setField)

      const oversized = new File([new Uint8Array(600 * 1024)], 'big.png', { type: 'image/png' })
      await act(async () => {
        await result.current.handleImageSelect(oversized)
      })
      expect(result.current.form.imageError).toBe('image_too_large')

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockCreateEvent).not.toHaveBeenCalled()
    })
  })

  describe('when handleSubmit is invoked while the vertical image upload is in flight', () => {
    it('should not call createEvent so the payload does not ship with a null verticalImageUrl', async () => {
      let resolveUpload: ((value: { url: string }) => void) | null = null
      mockUploadPosterVertical.mockReturnValueOnce({
        unwrap: () =>
          new Promise<{ url: string }>(resolve => {
            resolveUpload = resolve
          })
      })

      const { result } = renderHook(() => useCreateEventForm())
      fillValidForm(result.current.setField)

      const file = new File(['x'], 'v.png', { type: 'image/png' })
      let pendingSelect: Promise<void> | null = null
      await act(async () => {
        pendingSelect = result.current.handleVerticalImageSelect(file)
        // let the async dimension check resolve and the state flip to uploading
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      expect(result.current.form.isUploadingVerticalImage).toBe(true)

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockCreateEvent).not.toHaveBeenCalled()

      await act(async () => {
        resolveUpload?.({ url: 'https://cdn/vertical.png' })
        await pendingSelect
      })
    })
  })

  describe('when handleSubmit is invoked with a persistent vertical image error', () => {
    it('should not call createEvent so the user fixes the vertical cover first', async () => {
      const { result } = renderHook(() => useCreateEventForm())
      fillValidForm(result.current.setField)

      const oversized = new File([new Uint8Array(600 * 1024)], 'big.png', { type: 'image/png' })
      await act(async () => {
        await result.current.handleVerticalImageSelect(oversized)
      })
      expect(result.current.form.verticalImageError).toBe('image_too_large')

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

  describe('when initialCommunityId is provided in create mode', () => {
    it('should pre-fill communityId in the form state', () => {
      const { result } = renderHook(() => useCreateEventForm({ initialCommunityId: 'community-from-url' }))

      expect(result.current.form.communityId).toBe('community-from-url')
    })

    it('should ship the pre-filled community_id in the create payload', async () => {
      const { result } = renderHook(() => useCreateEventForm({ initialCommunityId: 'community-from-url' }))

      fillValidForm(result.current.setField)

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ community_id: 'community-from-url' })
        })
      )
    })

    it('should be ignored when initialEvent is also provided so edit mode keeps the event community', () => {
      const initialEvent = buildInitialEvent({ community_id: 'event-community' })
      const { result } = renderHook(() => useCreateEventForm({ initialEvent, initialCommunityId: 'url-community' }))

      expect(result.current.form.communityId).toBe('event-community')
    })
  })

  describe('when initialEvent is provided (edit mode)', () => {
    it('should expose mode="edit" and hydrate form fields from the event', () => {
      const initialEvent = buildInitialEvent()
      const { result } = renderHook(() => useCreateEventForm({ initialEvent }))

      expect(result.current.mode).toBe('edit')
      expect(result.current.form.name).toBe('Existing event')
      expect(result.current.form.description).toBe('Existing description')
      expect(result.current.form.coordX).toBe('5')
      expect(result.current.form.coordY).toBe('6')
      expect(result.current.form.email).toBe('owner@example.com')
      expect(result.current.form.duration).toBe('02:00')
    })

    it('should call updateEvent (not createEvent) with the eventId and mapped payload on submit', async () => {
      const initialEvent = buildInitialEvent()
      const { result } = renderHook(() => useCreateEventForm({ initialEvent }))

      act(() => {
        result.current.setField('name', 'Updated name')
      })

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockCreateEvent).not.toHaveBeenCalled()
      expect(mockUpdateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'ev-42',
          identity: mockIdentity,
          payload: expect.objectContaining({
            name: 'Updated name',
            x: 5,
            y: 6,
            contact: 'owner@example.com',
            duration: 2 * 60 * 60 * 1000
          })
        })
      )
    })

    it('should invoke onSuccess when updateEvent resolves', async () => {
      const initialEvent = buildInitialEvent()
      const onSuccess = jest.fn()
      const { result } = renderHook(() => useCreateEventForm({ initialEvent, onSuccess }))

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('should surface a submit error and not call onSuccess when updateEvent rejects', async () => {
      mockUpdateUnwrap.mockRejectedValue({ status: 500, data: { error: 'boom' } })
      const initialEvent = buildInitialEvent()
      const onSuccess = jest.fn()
      const { result } = renderHook(() => useCreateEventForm({ initialEvent, onSuccess }))

      await act(async () => {
        await result.current.handleSubmit()
      })

      expect(mockUpdateEvent).toHaveBeenCalled()
      expect(result.current.errors.submit).toBe('create_event.error_submit')
      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('should send rejected=false when editing an event that was previously rejected so it returns to pending', async () => {
      const initialEvent = buildInitialEvent({ rejected: true })
      const { result } = renderHook(() => useCreateEventForm({ initialEvent }))

      await act(async () => {
        await result.current.handleSubmit()
      })

      const lastCall = mockUpdateEvent.mock.calls.at(-1)?.[0] as { payload: Record<string, unknown> }
      expect(lastCall.payload).toEqual(expect.objectContaining({ rejected: false }))
    })

    it('should not include rejected when editing an event that was not rejected', async () => {
      const initialEvent = buildInitialEvent({ rejected: false })
      const { result } = renderHook(() => useCreateEventForm({ initialEvent }))

      await act(async () => {
        await result.current.handleSubmit()
      })

      const lastCall = mockUpdateEvent.mock.calls.at(-1)?.[0] as { payload: Record<string, unknown> }
      expect(lastCall.payload).not.toHaveProperty('rejected')
    })
  })
})
