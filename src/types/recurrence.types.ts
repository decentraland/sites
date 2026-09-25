// Shared between event domain types (`src/features/events/events.types.ts`) and the
// calendar URL builder (`src/utils/whatsOnUrl.ts`). Lives outside both to avoid a
// `src/utils/* → src/features/*` import that would cycle with the existing dependency
// in the opposite direction.
type RecurrentFrequency = 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY' | 'HOURLY' | 'MINUTELY' | 'SECONDLY'

// The API timestamps needed to derive one occurrence's end. Structural so both `EventEntry`
// and the jump page's `JumpEvent` satisfy it.
/* eslint-disable @typescript-eslint/naming-convention */
interface OccurrenceTimes {
  start_at: string
  finish_at: string
  next_start_at: string
  next_finish_at: string
}
/* eslint-enable @typescript-eslint/naming-convention */

export type { OccurrenceTimes, RecurrentFrequency }
