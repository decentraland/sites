import { styled } from 'decentraland-ui2'

// `<div>` (not `<span>`) because consumers pass block-level children — Typography (`<p>`) and Box
// (`<div>`). `display: inline-flex` keeps the trigger inline within the surrounding flow.
const LocalTimeTrigger = styled('div')({
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2,
    borderRadius: 4
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

export { LocalTimeTrigger }
