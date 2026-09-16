import { useDeferredValue, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
// eslint-disable-next-line @typescript-eslint/naming-convention -- React component default export, matches MUI icon convention
import SearchIcon from '@mui/icons-material/Search'
import { CircularProgress, InputAdornment } from 'decentraland-ui2'
import { CenteredBox } from '../../App.styled'
import {
  CardGrid,
  Empty,
  ErrorBox,
  ErrorText,
  HeaderRow,
  PageContent,
  PageTitle,
  RetryButton,
  SearchField
} from '../../components/discover/_shared'
import { CommunityCard } from '../../components/discover/CommunityCard'
import { useGetCommunitiesListQuery } from '../../features/discover'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { usePageViewTracking } from '../../hooks/usePageViewTracking'

function DiscoverCommunitiesPage() {
  const t = useFormatMessage()

  // `/places/*` is in `isPageTrackingExempt`, so the Layout's route-level
  // `page()` is suppressed. Static name — fires immediately on mount.
  usePageViewTracking({ name: t('discover.communities.page_title') })

  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput.trim())

  const { data, isLoading, isError, refetch } = useGetCommunitiesListQuery({
    limit: 200,
    offset: 0,
    search: search || undefined
  })

  // The social-api returns communities in creation order by default. Surface
  // the most-populated communities first so the page leads with what's most
  // active. Client-side sort is fine since we fetch a single page.
  const communities = useMemo(() => {
    const list = data?.data?.results ?? []
    return [...list].sort((a, b) => (b.membersCount ?? 0) - (a.membersCount ?? 0))
  }, [data])
  const isEmpty = !isLoading && communities.length === 0

  // Same loader-handoff fix as DiscoverHomePage — anchor the cold-load
  // spinner at the same Y as the DappsShell Suspense fallback so there's
  // no perceived "two loaders" on mobile.
  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>{t('discover.communities.page_title')}</title>
        </Helmet>
        <CenteredBox>
          <CircularProgress />
        </CenteredBox>
      </>
    )
  }

  return (
    <PageContent>
      <Helmet>
        <title>{t('discover.communities.page_title')}</title>
      </Helmet>
      <HeaderRow>
        <PageTitle>{t('discover.communities.heading')}</PageTitle>
        <SearchField
          variant="outlined"
          placeholder={t('discover.communities.search_placeholder')}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </HeaderRow>
      {isError ? (
        <ErrorBox>
          <ErrorText>{t('discover.communities.error')}</ErrorText>
          <RetryButton type="button" onClick={() => void refetch()}>
            {t('discover.explore.retry')}
          </RetryButton>
        </ErrorBox>
      ) : isEmpty ? (
        <Empty>{t('discover.communities.empty')}</Empty>
      ) : (
        <CardGrid>
          {communities.map(community => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </CardGrid>
      )}
    </PageContent>
  )
}

export { DiscoverCommunitiesPage }
