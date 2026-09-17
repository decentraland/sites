import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { redirectToAuth } from '../utils/authRedirect'

function SignInRedirect() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    const searchParams = new URLSearchParams(search)
    const currentRedirectTo = searchParams.get('redirectTo')
    const redirectPath = currentRedirectTo || `${pathname}${search}`
    // Pure redirector page: replace so Back from the login screen never lands
    // here (this page would instantly forward the user to login again).
    redirectToAuth(redirectPath, undefined, { replace: true })
  }, [pathname, search])

  return null
}

export { SignInRedirect }
