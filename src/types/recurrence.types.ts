// Shared between event domain types (`src/features/events/events.types.ts`) and the
// calendar URL builder (`src/utils/whatsOnUrl.ts`). Lives outside both to avoid a
// `src/utils/* → src/features/*` import that would cycle with the existing dependency
// in the opposite direction.
type RecurrentFrequency = 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY' | 'HOURLY' | 'MINUTELY' | 'SECONDLY'

export type { RecurrentFrequency }
