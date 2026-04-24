import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    // POP covers browser back/forward and the initial load. Skipping lets the
    // browser's native scroll restoration return the user to where they were.
    if (navigationType === 'POP') return
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname, navigationType])

  return null
}

export { ScrollToTop }
