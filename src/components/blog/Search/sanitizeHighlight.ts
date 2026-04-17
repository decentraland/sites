/* eslint-disable @typescript-eslint/naming-convention */
import DOMPurify from 'dompurify'

const sanitizeHighlight = (value: string): string =>
  DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['em', 'mark'],
    ALLOWED_ATTR: []
  })

export { sanitizeHighlight }
