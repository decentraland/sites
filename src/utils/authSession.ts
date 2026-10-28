// In-flight cache callbacks must not mutate a new session, including an A -> B -> A switch.
let authSession = 0
const getAuthSession = () => authSession
const advanceAuthSession = () => {
  authSession += 1
}

export { advanceAuthSession, getAuthSession }
