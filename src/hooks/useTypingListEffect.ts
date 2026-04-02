import { useEffect, useMemo, useReducer, useRef } from 'react'

const DELAY = 100
const PAUSE_DELAY = DELAY * 10

type TypingState = {
  letterPos: number
  wordIndex: number
  action: 'write' | 'erase'
}

type TypingAction = { type: 'tick'; wordLength: number; listLength: number }

function typingReducer(state: TypingState, { wordLength, listLength }: TypingAction): TypingState {
  if (state.action === 'write') {
    if (state.letterPos === wordLength - 1) {
      return { ...state, action: 'erase' }
    }
    return { ...state, letterPos: state.letterPos + 1 }
  }

  if (state.letterPos === 0) {
    return {
      letterPos: 0,
      wordIndex: (state.wordIndex + 1) % listLength,
      action: 'write'
    }
  }

  return { ...state, letterPos: state.letterPos - 1 }
}

function useTypingListEffect(list: string[]) {
  const [state, dispatch] = useReducer(typingReducer, { letterPos: 0, wordIndex: 0, action: 'write' })
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const wordLength = list[state.wordIndex].length
  const isAtEnd = state.letterPos === wordLength - 1

  useEffect(() => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => dispatch({ type: 'tick', wordLength, listLength: list.length }), isAtEnd ? PAUSE_DELAY : DELAY)
    return () => clearTimeout(timeoutRef.current)
  }, [state, wordLength, list.length, isAtEnd])

  return useMemo(() => list[state.wordIndex].slice(0, state.letterPos + 1), [state.letterPos, state.wordIndex, list])
}

export { useTypingListEffect }
