import { type FC, type ReactNode, useEffect, useRef, useState } from 'react'
import { TextContent, TextWrapperContainer } from './TextWrapper.styled'

interface TextWrapperProps {
  children: ReactNode
  maxHeight: number
  gradientColor: string
}

const TextWrapper: FC<TextWrapperProps> = ({ children, maxHeight, gradientColor }) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [hasOverflow, setHasOverflow] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(false)

  useEffect(() => {
    const checkOverflow = () => {
      const el = contentRef.current
      if (!el) return
      setHasOverflow(el.scrollHeight > maxHeight)
    }

    const checkScrollPosition = () => {
      const el = contentRef.current
      if (!el) return
      setIsAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 1)
    }

    const timeoutId = window.setTimeout(() => {
      checkOverflow()
      checkScrollPosition()
    }, 500)

    const resizeObserver = new ResizeObserver(checkOverflow)
    const el = contentRef.current
    if (el) {
      resizeObserver.observe(el)
      el.addEventListener('scroll', checkScrollPosition)
    }

    return () => {
      window.clearTimeout(timeoutId)
      resizeObserver.disconnect()
      el?.removeEventListener('scroll', checkScrollPosition)
    }
  }, [maxHeight, children])

  return (
    <TextWrapperContainer maxHeight={maxHeight} gradientColor={gradientColor} hasGradient={hasOverflow && !isAtBottom}>
      <TextContent ref={contentRef}>{children}</TextContent>
    </TextWrapperContainer>
  )
}

export { TextWrapper }
