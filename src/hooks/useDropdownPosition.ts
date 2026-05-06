import { type RefObject, useEffect, useState } from 'react'
import { useDesktopMediaQuery } from 'decentraland-ui2'

interface DropdownPosition {
  top: number
  left?: number
  right?: number
  width: number
}

interface UseDropdownPositionOptions {
  isOpen: boolean
  containerRef: RefObject<HTMLDivElement>
  minWidth?: number
}

const useDropdownPosition = ({ isOpen, containerRef, minWidth = 250 }: UseDropdownPositionOptions): DropdownPosition | null => {
  const [position, setPosition] = useState<DropdownPosition | null>(null)
  const isDesktop = useDesktopMediaQuery()
  const isMobile = !isDesktop

  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      setPosition(null)
      return
    }
    const rect = containerRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const dropdownWidth = Math.max(minWidth, rect.width)
    const estimatedDropdownHeight = 200

    const wouldOverflowRight = rect.left + dropdownWidth > viewportWidth - 16
    const isInLeftHalf = rect.left < viewportWidth / 2
    const wouldOverflowBottom = rect.bottom + estimatedDropdownHeight > viewportHeight - 16
    const shouldOpenUpwards = isMobile && wouldOverflowBottom && rect.top > estimatedDropdownHeight

    let calculated: DropdownPosition
    if (isMobile && (wouldOverflowRight || isInLeftHalf)) {
      calculated = {
        top: shouldOpenUpwards ? rect.top - estimatedDropdownHeight - 4 : rect.bottom + 4,
        right: viewportWidth - rect.right - 40,
        width: Math.min(dropdownWidth, viewportWidth - rect.left - 56)
      }
    } else {
      calculated = {
        top: shouldOpenUpwards ? rect.top - estimatedDropdownHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: dropdownWidth
      }
    }
    setPosition(calculated)
  }, [isOpen, isMobile, minWidth, containerRef])

  return position
}

export { useDropdownPosition }
