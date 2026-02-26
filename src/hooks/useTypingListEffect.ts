import { useEffect, useMemo, useRef, useState } from 'react'

const DELAY = 100

function useTypingListEffect(list: string[]) {
  const [currentLetterPosition, setCurrentLetterPosition] = useState(0)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [typingAction, setTypingAction] = useState<'write' | 'erase'>('write')
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(
      () => {
        setCurrentLetterPosition(currentLetterIndex => {
          if (typingAction === 'write' && currentLetterIndex === list[currentWordIndex].length - 1) {
            setTypingAction('erase')
          } else if (typingAction === 'write') {
            return currentLetterIndex + 1
          } else if (typingAction === 'erase' && currentLetterIndex === 0) {
            setTypingAction('write')
            setCurrentWordIndex(wordIndex => (wordIndex + 1 >= list.length ? 0 : wordIndex + 1))
            return 0
          }
          return currentLetterIndex - 1
        })
      },
      currentLetterPosition === list[currentWordIndex].length - 1 ? DELAY * 10 : DELAY
    )
    return () => clearTimeout(timeoutRef.current)
  }, [currentLetterPosition, typingAction, currentWordIndex, list])

  return useMemo(() => list[currentWordIndex].slice(0, currentLetterPosition + 1), [currentLetterPosition, currentWordIndex, list])
}

export { useTypingListEffect }
