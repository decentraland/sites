import { useEffect, useState } from 'react'

function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(() => (typeof document === 'undefined' ? true : !document.hidden))

  useEffect(() => {
    if (typeof document === 'undefined') return
    const handle = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', handle)
    return () => document.removeEventListener('visibilitychange', handle)
  }, [])

  return visible
}

export { useDocumentVisible }
