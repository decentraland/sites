import { memo, useCallback, useRef } from 'react'
import { useTranslation } from '@dcl/hooks'
import { TabButton, TabsRow } from './ExperiencesTabs.styled'
import type { TabValue } from './ExperiencesTabs.styled'

interface ExperiencesTabsProps {
  value: TabValue
  onChange: (value: TabValue) => void
  panelId?: string
}

const TAB_ORDER: TabValue[] = ['all', 'my']

const ExperiencesTabs = memo(({ value, onChange, panelId }: ExperiencesTabsProps) => {
  const { t } = useTranslation()
  const listRef = useRef<HTMLDivElement>(null)

  const handleTabClick = useCallback((next: TabValue) => () => onChange(next), [onChange])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
      event.preventDefault()
      const currentIndex = TAB_ORDER.indexOf(value)
      const delta = event.key === 'ArrowRight' ? 1 : -1
      const nextIndex = (currentIndex + delta + TAB_ORDER.length) % TAB_ORDER.length
      const nextValue = TAB_ORDER[nextIndex]
      onChange(nextValue)
      const button = listRef.current?.querySelector<HTMLButtonElement>(`[data-tab-value="${nextValue}"]`)
      button?.focus()
    },
    [onChange, value]
  )

  return (
    <TabsRow ref={listRef} role="tablist" aria-label={t('all_experiences.title')}>
      {TAB_ORDER.map(tab => {
        const isActive = tab === value
        return (
          <TabButton
            key={tab}
            type="button"
            role="tab"
            data-tab-value={tab}
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            isActive={isActive}
            onClick={handleTabClick(tab)}
            onKeyDown={handleKeyDown}
          >
            {t(tab === 'all' ? 'all_experiences.tab_all' : 'all_experiences.tab_my')}
          </TabButton>
        )
      })}
    </TabsRow>
  )
})

ExperiencesTabs.displayName = 'ExperiencesTabs'

export { ExperiencesTabs }
export type { ExperiencesTabsProps, TabValue }
