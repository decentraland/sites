import { memo, useEffect } from 'react'
import { NotPhoto } from '../../components/Reels/NotPhoto'

const ReelsEmptyPage = memo(() => {
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
