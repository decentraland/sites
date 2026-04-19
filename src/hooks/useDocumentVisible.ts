import { useEffect, useState } from 'react'
import { isDocumentVisible, subscribeVisibility } from '../utils/documentVisibility'

function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(isDocumentVisible)

  useEffect(() => subscribeVisibility(setVisible), [])

  return visible
}

export { useDocumentVisible }
