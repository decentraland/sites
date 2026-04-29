import { useEffect, useRef, useState } from 'react'

const WIDGETS_SRC = 'https://platform.twitter.com/widgets.js'

type TwitterWidgets = {
  createTweet: (tweetId: string, element: HTMLElement, options?: { theme?: 'light' | 'dark' }) => Promise<HTMLElement | undefined>
}

type TwitterGlobal = { widgets?: TwitterWidgets }

// Hoisted so concurrent callers share a single script load.
let scriptPromise: Promise<void> | null = null

const loadTwitterWidgets = (): Promise<void> => {
  if (scriptPromise) return scriptPromise
  if (typeof window === 'undefined') return Promise.resolve()

  const existing = (window as unknown as { twttr?: TwitterGlobal }).twttr
  if (existing?.widgets) return Promise.resolve()

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = WIDGETS_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Failed to load Twitter widgets'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

const clearContainer = (el: HTMLElement) => {
  while (el.firstChild) el.removeChild(el.firstChild)
}

interface TwitterEmbedProps {
  tweetId: string
  theme?: 'light' | 'dark'
}

const TwitterEmbed = ({ tweetId, theme = 'dark' }: TwitterEmbedProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    loadTwitterWidgets()
      .then(() => {
        if (cancelled || !ref.current) return
        clearContainer(ref.current)
        const widgets = (window as unknown as { twttr?: TwitterGlobal }).twttr?.widgets
        if (!widgets) return
        return widgets.createTweet(tweetId, ref.current, { theme })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tweetId, theme])

  return (
    <div ref={ref} aria-busy={loading ? true : undefined}>
      {loading ? 'Loading tweet…' : null}
    </div>
  )
}

export { TwitterEmbed }
