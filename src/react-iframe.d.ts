import 'react'

// `credentialless` ships in Chromium but not in @types/react 18, so JSX would
// reject it. A document served with `Cross-Origin-Embedder-Policy` refuses to
// load cross-origin iframes that don't opt into COEP themselves, and this
// attribute is that opt-in: the frame loads in an ephemeral context with no
// cookies instead of failing with ERR_BLOCKED_BY_RESPONSE.
//
// It has to be part of the initial markup. The browser starts the frame's
// navigation the moment the element enters the document, so an attribute set
// afterwards (a ref callback, an effect) arrives too late to change how that
// request is made. Empty string only — it is a boolean attribute, so any value
// (`"false"` included) counts as present.
declare module 'react' {
  interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
    credentialless?: ''
  }
}
