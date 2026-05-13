import type { ReactNode } from 'react'
import { AsideArea, BodyArea, BodySplit, ContentArea, LayoutRoot, ProfileCard, TabsArea } from './ProfileLayout.styled'

interface ProfileLayoutProps {
  header: ReactNode
  tabs?: ReactNode
  aside?: ReactNode
  /** When false the aside column collapses (BodyArea slides over it). Defaults to whether `aside` is provided. */
  showAside?: boolean
  /** When true, drops the outer page chrome (gradient background + card frame) so the surface can be embedded inside another modal/container. */
  embedded?: boolean
  children: ReactNode
}

function ProfileLayout({ header, tabs, aside, showAside, embedded, children }: ProfileLayoutProps) {
  const hasAside = Boolean(aside)
  const visible = hasAside && (showAside ?? true)
  const body = (
    <>
      {header}
      {tabs ? <TabsArea>{tabs}</TabsArea> : null}
      <BodySplit $hasAside={hasAside} $showAside={visible}>
        {hasAside ? <AsideArea $showAside={visible}>{aside}</AsideArea> : null}
        <BodyArea>{children}</BodyArea>
      </BodySplit>
    </>
  )
  if (embedded) {
    return <>{body}</>
  }
  return (
    <LayoutRoot>
      <ContentArea>
        <ProfileCard>{body}</ProfileCard>
      </ContentArea>
    </LayoutRoot>
  )
}

export { ProfileLayout }
export type { ProfileLayoutProps }
