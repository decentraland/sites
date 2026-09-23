import { useEffect, useState } from 'react'

/**
 * Trails `value` by `delay` ms so a per-keystroke state change drives at most one network request
 * per pause in typing. The first value is returned immediately; only subsequent changes wait.
 */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    if (value === debounced) return
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
    // `debounced` is intentionally out of the dep list: including it would restart the timer as soon
    // as it fires, and the guard above already short-circuits the no-op case.
  }, [value, delay])

  return debounced
}

export { useDebouncedValue }
