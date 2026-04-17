/* eslint-disable */ // TODO(Task 14): fix imports
import { useEffect } from 'react'
import { redirectToAuth } from '../utils/authRedirect'

function SignInRedirect() {
  useEffect(() => {
    redirectToAuth()
  }, [])

  return null
}

export { SignInRedirect }
