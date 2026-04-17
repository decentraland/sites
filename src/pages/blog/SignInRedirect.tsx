import { useEffect } from 'react'
import { redirectToAuth } from '../../utils/blogAuthRedirect'

function SignInRedirect() {
  useEffect(() => {
    redirectToAuth()
  }, [])

  return null
}

export { SignInRedirect }
