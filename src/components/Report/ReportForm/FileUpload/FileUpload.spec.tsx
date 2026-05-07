import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import type { UploadedFile } from '../../../../features/safety/report/report.types'

jest.mock('decentraland-ui2', () => ({
  Box: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  Typography: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
  styled: () => () => () => null
}))

jest.mock('./FileUpload.styled', () => {
  const passthrough =
    (tag: keyof JSX.IntrinsicElements, testid: string) =>
    ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) =>
      React.createElement(tag, { 'data-testid': testid, ...props }, children)
  return {
    AddFileButton: ({
      children,
      disabled,
      onClick
    }: {
      children?: React.ReactNode
      disabled?: boolean
      onClick?: React.MouseEventHandler<HTMLButtonElement>
    }) => (
      <button type="button" disabled={disabled} onClick={onClick}>
        {children}
      </button>
    ),
    ErrorText: passthrough('p', 'error-text'),
    FileChip: passthrough('div', 'file-chip'),
    FileChipRemove: ({
      children,
      onClick,
      'aria-label': ariaLabel
    }: {
      children?: React.ReactNode
      onClick?: React.MouseEventHandler<HTMLButtonElement>
      'aria-label'?: string
    }) => (
      <button type="button" aria-label={ariaLabel} onClick={onClick}>
        {children}
      </button>
    ),
    FileChipsContainer: passthrough('div', 'file-chips'),
    FileUploadContainer: passthrough('div', 'file-upload'),
    HiddenFileInput: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
      <input data-testid="hidden-input" ref={ref} {...props} />
    ))
  }
})

const { FileUpload } = jest.requireActual<typeof import('./FileUpload')>('./FileUpload')

const ADD_LABEL = 'Add file'

function buildFile({ name, type, size }: { name: string; type: string; size: number }): File {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size, configurable: true })
  return file
}

function buildUploaded(name: string, type: string): UploadedFile {
  const file = buildFile({ name, type, size: 1024 })
  return { id: name, file, name, size: 1024 }
}

const oversizedLabel = (names: string) => `oversized: ${names}`
const invalidTypeLabel = (names: string) => `invalid: ${names}`

function renderUpload(overrides: Partial<React.ComponentProps<typeof FileUpload>> = {}) {
  return render(
    <FileUpload
      files={[]}
      onFilesChange={() => undefined}
      addFileLabel={ADD_LABEL}
      oversizedLabel={oversizedLabel}
      invalidTypeLabel={invalidTypeLabel}
      {...overrides}
    />
  )
}

describe('FileUpload', () => {
  const realCrypto = globalThis.crypto
  let onFilesChange: jest.Mock
  let uuidCounter = 0

  beforeAll(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        ...realCrypto,
        randomUUID: () => {
          uuidCounter += 1
          return `uuid-${uuidCounter}`
        }
      },
      configurable: true
    })
  })

  afterAll(() => {
    Object.defineProperty(globalThis, 'crypto', { value: realCrypto, configurable: true })
  })

  beforeEach(() => {
    uuidCounter = 0
    onFilesChange = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the user selects only accepted files within the size limit', () => {
    it('should call onFilesChange with the new entries appended to the existing list', () => {
      const existing = [buildUploaded('prev.png', 'image/png')]
      renderUpload({ files: existing, onFilesChange })

      const next = buildFile({ name: 'next.jpg', type: 'image/jpeg', size: 2048 })
      fireEvent.change(screen.getByTestId('hidden-input'), { target: { files: [next] } })

      expect(onFilesChange).toHaveBeenCalledTimes(1)
      const updated = onFilesChange.mock.calls[0][0] as UploadedFile[]
      expect(updated.map(f => f.name)).toEqual(['prev.png', 'next.jpg'])
      expect(screen.queryByText(/invalid:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/oversized:/)).not.toBeInTheDocument()
    })
  })

  describe('when the user selects a file with an unsupported MIME type', () => {
    it('should drop the file from onFilesChange and surface invalidTypeLabel', () => {
      renderUpload({ onFilesChange })

      const bogus = buildFile({ name: 'evil.exe', type: 'application/x-msdownload', size: 1024 })
      fireEvent.change(screen.getByTestId('hidden-input'), { target: { files: [bogus] } })

      expect(onFilesChange).not.toHaveBeenCalled()
      expect(screen.getByText('invalid: evil.exe')).toBeInTheDocument()
    })

    it('should keep the accepted files and drop only the invalid ones in a mixed selection', () => {
      renderUpload({ onFilesChange })

      const ok = buildFile({ name: 'shot.png', type: 'image/png', size: 1024 })
      const bad = buildFile({
        name: 'doc.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1024
      })
      fireEvent.change(screen.getByTestId('hidden-input'), { target: { files: [ok, bad] } })

      expect(onFilesChange).toHaveBeenCalledTimes(1)
      const updated = onFilesChange.mock.calls[0][0] as UploadedFile[]
      expect(updated.map(f => f.name)).toEqual(['shot.png'])
      expect(screen.getByText('invalid: doc.docx')).toBeInTheDocument()
    })
  })

  describe('when the user selects an accepted file that is over 5MB', () => {
    it('should drop the oversized file and surface oversizedLabel', () => {
      renderUpload({ onFilesChange })

      const huge = buildFile({ name: 'huge.png', type: 'image/png', size: 6 * 1024 * 1024 })
      fireEvent.change(screen.getByTestId('hidden-input'), { target: { files: [huge] } })

      expect(onFilesChange).not.toHaveBeenCalled()
      expect(screen.getByText('oversized: huge.png')).toBeInTheDocument()
    })
  })

  describe('when the selection mixes invalid types and oversized files', () => {
    it('should prioritize the invalid-type message over the oversized message', () => {
      renderUpload({ onFilesChange })

      const huge = buildFile({ name: 'huge.png', type: 'image/png', size: 6 * 1024 * 1024 })
      const bogus = buildFile({ name: 'evil.exe', type: 'application/x-msdownload', size: 1024 })
      fireEvent.change(screen.getByTestId('hidden-input'), { target: { files: [huge, bogus] } })

      expect(screen.getByText('invalid: evil.exe')).toBeInTheDocument()
      expect(screen.queryByText('oversized: huge.png')).not.toBeInTheDocument()
    })
  })

  describe('when the existing list already has files', () => {
    it('should slice the new selection to fit MAX_FILES (5)', () => {
      const existing = [
        buildUploaded('a.png', 'image/png'),
        buildUploaded('b.png', 'image/png'),
        buildUploaded('c.png', 'image/png'),
        buildUploaded('d.png', 'image/png')
      ]
      renderUpload({ files: existing, onFilesChange })

      const incoming = [
        buildFile({ name: 'e.png', type: 'image/png', size: 1024 }),
        buildFile({ name: 'f.png', type: 'image/png', size: 1024 })
      ]
      fireEvent.change(screen.getByTestId('hidden-input'), { target: { files: incoming } })

      expect(onFilesChange).toHaveBeenCalledTimes(1)
      const updated = onFilesChange.mock.calls[0][0] as UploadedFile[]
      expect(updated.map(f => f.name)).toEqual(['a.png', 'b.png', 'c.png', 'd.png', 'e.png'])
    })

    it('should disable the add button when MAX_FILES is reached', () => {
      const existing = Array.from({ length: 5 }, (_, i) => buildUploaded(`f${i}.png`, 'image/png'))
      renderUpload({ files: existing, onFilesChange })

      expect(screen.getByRole('button', { name: ADD_LABEL })).toBeDisabled()
    })
  })

  describe('when the user removes an existing file via its chip', () => {
    it('should call onFilesChange with that entry filtered out', () => {
      const existing = [buildUploaded('keep.png', 'image/png'), buildUploaded('drop.png', 'image/png')]
      renderUpload({ files: existing, onFilesChange })

      fireEvent.click(screen.getByRole('button', { name: 'Remove drop.png' }))

      expect(onFilesChange).toHaveBeenCalledTimes(1)
      const updated = onFilesChange.mock.calls[0][0] as UploadedFile[]
      expect(updated.map(f => f.name)).toEqual(['keep.png'])
    })
  })

  describe('when an external error prop is provided', () => {
    it('should render it alongside any validation error', () => {
      renderUpload({ onFilesChange, error: 'external-error' })

      expect(screen.getByText('external-error')).toBeInTheDocument()
    })
  })
})
