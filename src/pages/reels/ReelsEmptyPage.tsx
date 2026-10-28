import { memo, useEffect } from 'react'
import { NotPhoto } from '../../components/Reels/NotPhoto'
import { usePageView } from '../../hooks/usePageView'

const ReelsEmptyPage = memo(() => {
  usePageView()

  useEffect(() => {
    const previous = document.title
    document.title = 'Decentraland Reels'
    return () => {
      document.title = previous
    }
  }, [])

  return <NotPhoto />
})

export { ReelsEmptyPage }
