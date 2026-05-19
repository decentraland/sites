import { useDeferredValue, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
// eslint-disable-next-line @typescript-eslint/naming-convention -- React component default export, matches MUI icon convention
import SearchIcon from '@mui/icons-material/Search'
import { CircularProgress, InputAdornment } from 'decentraland-ui2'
import { CenteredBox } from '../../App.styled'
import { CardGrid, Empty, HeaderRow, PageContent, PageTitle, SearchField } from '../../components/discover/_shared'
import { CommunityCard } from '../../components/discover/CommunityCard'
import { useGetCommunitiesListQuery } from '../../features/discover'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'

function DiscoverCommunitiesPage() {
  const t = useFormatMessage()
  const [searchInput, setSearchInput] = useState('')
  const search = useDeferredValue(searchInput.trim())

  const { data, isLoading } = useGetCommunitiesListQuery({
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
          <title>{t('social.communities.page_title')}</title>
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
        <title>{t('social.communities.page_title')}</title>
      </Helmet>
      <HeaderRow>
        <PageTitle>{t('social.communities.heading')}</PageTitle>
        <SearchField
          variant="outlined"
          placeholder={t('social.communities.search_placeholder')}
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
      {isEmpty ? (
        <Empty>{t('social.communities.empty')}</Empty>
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
