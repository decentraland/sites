# report

Community report flow. **Lightweight route** inside `<Layout />` — no Redux, no RTK Query.

## Routes

`/report`, `/report/success`.

## Key paths

| Path                                   | Purpose                                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/pages/report/`                    | Page components for the report form and success confirmation.                                                     |
| `src/components/Report/`               | Report-specific UI components (form fields, category selector, submit button). Note the capitalized directory.   |
| `src/features/report/report.types.ts`  | Domain types for the report form (categories, severity, target kinds).                                            |
| `src/features/report/*.helpers.ts`     | Form validation, target normalization.                                                                            |

## Submission

Form submits directly to the report backend via plain `fetch` (no RTK Query). Identity is optional — anonymous reports allowed.

## Cross-references

- Skill `add-route` — lightweight tier rules.
- Skill `auth-flow` — wallet/identity hooks (optional sign-in to attach reporter address).
