import { useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import InsertLinkIcon from '@mui/icons-material/InsertLink'
import { Box, Button, CatalogCard, CircularProgress, Tooltip, Typography } from 'decentraland-ui2'
import { useProfileBadges } from '../../../features/profile/profile.badges.client'
import { useGetProfileQuery } from '../../../features/profile/profile.client'
import { useEquippedCollectibles } from '../../../features/profile/profile.wearables.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { CreatorByLine } from './OverviewTab.creator'
import {
  detectLinkProvider,
  extractAchievedTierDescription,
  formatBadgeDate,
  formatPriceMana,
  getEquippedWearables,
  readField,
  toCatalogAsset
} from './OverviewTab.helpers'
import { WearableInfoBadges } from './OverviewTab.icons'
import type { InfoField, OverviewTabProps, ProfileLink } from './OverviewTab.types'
import {
  BadgeFallback,
  BadgeImage,
  BadgeSlot,
  BadgesRow,
  BioText,
  EmptyBio,
  EquippedCardLink,
  EquippedGrid,
  InfoGrid,
  InfoItem,
  InfoLabel,
  InfoSurface,
  InfoValue,
  LinkPill,
  LinkPillIcon,
  LinksRow,
  LoadingRow,
  OverviewRoot,
  SectionHeader,
  SectionTitle
} from './OverviewTab.styled'

function OverviewTab({ address, isOwnProfile }: OverviewTabProps) {
  const t = useFormatMessage()
  const { data: profile, isLoading } = useGetProfileQuery(address)
  const avatar = profile?.avatars?.[0]
  const description = avatar?.description?.trim() ?? ''
  const wearables = useMemo(() => getEquippedWearables(avatar), [avatar])
  const { collectibles, isLoading: isLoadingCollectibles } = useEquippedCollectibles(wearables)
  const { badges, isLoading: isLoadingBadges } = useProfileBadges(address)
  const visibleBadges = badges

  const infoFields: InfoField[] = [
    { labelKey: 'profile.overview.country', value: readField(avatar, 'country') },
    { labelKey: 'profile.overview.language', value: readField(avatar, 'language') },
    { labelKey: 'profile.overview.pronouns', value: readField(avatar, 'pronouns') },
    { labelKey: 'profile.overview.relationship_status', value: readField(avatar, 'relationshipStatus') },
    { labelKey: 'profile.overview.gender', value: readField(avatar, 'gender') },
    { labelKey: 'profile.overview.profession', value: readField(avatar, 'profession') },
    { labelKey: 'profile.overview.birth_date', value: readField(avatar, 'birthdate') },
    { labelKey: 'profile.overview.real_name', value: readField(avatar, 'realName') },
    { labelKey: 'profile.overview.favorite_hobby', value: readField(avatar, 'hobbies') }
  ]
  const populatedInfo = infoFields.filter(field => field.value !== undefined)

  const links = (avatar as unknown as { links?: ProfileLink[] } | undefined)?.links ?? []

  if (isLoading) {
    return (
      <OverviewRoot>
        <LoadingRow>
          <CircularProgress size={24} />
        </LoadingRow>
      </OverviewRoot>
    )
  }

  return (
    <OverviewRoot>
      <InfoSurface>
        <section style={{ width: '100%' }}>
          <SectionHeader>
            <SectionTitle>{t('profile.overview.badges')}</SectionTitle>
          </SectionHeader>
          {isLoadingBadges ? (
            <LoadingRow>
              <CircularProgress size={22} />
            </LoadingRow>
          ) : visibleBadges.length > 0 ? (
            <BadgesRow>
              {visibleBadges.map(badge => {
                const tierName = badge.tierName
                const description = extractAchievedTierDescription(badge.description, tierName)
                const completedAt = formatBadgeDate(badge.progress?.lastCompletedTierAt ?? badge.completedAt)
                return (
                  <Tooltip
                    key={badge.id}
                    arrow
                    placement="top"
                    title={
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, py: 0.5, px: 0.25, maxWidth: 240 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {badge.name}
                        </Typography>
                        {tierName ? (
                          <Typography variant="caption" sx={{ opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>
                            {tierName}
                          </Typography>
                        ) : null}
                        {description ? (
                          <Typography variant="caption" sx={{ opacity: 0.85 }}>
                            {description}
                          </Typography>
                        ) : null}
                        {completedAt ? (
                          <Typography variant="caption" sx={{ opacity: 0.6 }}>
                            {t('profile.overview.badge_unlocked_on', { date: completedAt })}
                          </Typography>
                        ) : null}
                      </Box>
                    }
                  >
                    <BadgeSlot tabIndex={0} aria-label={badge.name}>
                      {badge.imageUrl ? (
                        <BadgeImage src={badge.imageUrl} alt={badge.name} loading="lazy" />
                      ) : (
                        <BadgeFallback>{badge.name.charAt(0).toUpperCase()}</BadgeFallback>
                      )}
                    </BadgeSlot>
                  </Tooltip>
                )
              })}
            </BadgesRow>
          ) : (
            <EmptyBio>{t('profile.overview.no_badges_yet')}</EmptyBio>
          )}
        </section>

        <section style={{ width: '100%' }}>
          <SectionTitle>{t('profile.overview.about')}</SectionTitle>
          {description.length > 0 ? (
            <BioText sx={{ mt: 1 }}>{description}</BioText>
          ) : (
            <EmptyBio sx={{ mt: 1 }}>{t(isOwnProfile ? 'profile.overview.no_bio_owner' : 'profile.overview.no_bio_member')}</EmptyBio>
          )}
          {populatedInfo.length > 0 ? (
            <InfoGrid>
              {populatedInfo.map(field => (
                <InfoItem key={field.labelKey}>
                  <InfoLabel>{t(field.labelKey)}</InfoLabel>
                  <InfoValue>{field.value}</InfoValue>
                </InfoItem>
              ))}
            </InfoGrid>
          ) : null}
        </section>

        {links.length > 0 ? (
          <section style={{ width: '100%' }}>
            <SectionTitle>{t('profile.overview.links')}</SectionTitle>
            <LinksRow sx={{ mt: 1 }}>
              {links.map(link => (
                <LinkPill key={`${link.url}-${link.title ?? ''}`} href={link.url} target="_blank" rel="noopener noreferrer">
                  <LinkPillIcon>
                    <InsertLinkIcon fontSize="medium" />
                  </LinkPillIcon>
                  {link.title || detectLinkProvider(link.url)}
                </LinkPill>
              ))}
            </LinksRow>
          </section>
        ) : null}
      </InfoSurface>

      <InfoSurface>
        <section style={{ width: '100%' }}>
          <SectionTitle>{t('profile.overview.equipped_items')}</SectionTitle>
          {collectibles.length > 0 ? (
            <EquippedGrid sx={{ mt: 2 }}>
              {collectibles.map(item => {
                const price = formatPriceMana(item.price)
                const card = (
                  <CatalogCard
                    asset={toCatalogAsset(item)}
                    imageSrc={item.thumbnail}
                    action={null}
                    extraInformation={null}
                    price={price}
                    notForSale={!price}
                    withShadow={false}
                    hoverShadow="glow"
                    disableInfoExpansion={isOwnProfile}
                    creatorSlot={<CreatorByLine address={item.creator} />}
                    infoBadges={<WearableInfoBadges category={item.wearableCategory} bodyShapes={item.bodyShapes} isSmart={item.isSmart} />}
                    bottomAction={
                      isOwnProfile ? undefined : (
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          href={item.marketplaceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('profile.overview.buy')}
                        </Button>
                      )
                    }
                  />
                )
                return isOwnProfile ? (
                  <EquippedCardLink
                    key={item.urn}
                    href={item.marketplaceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.name}
                  >
                    {card}
                  </EquippedCardLink>
                ) : (
                  <Box key={item.urn}>{card}</Box>
                )
              })}
            </EquippedGrid>
          ) : isLoadingCollectibles ? (
            <LoadingRow>
              <CircularProgress size={20} />
            </LoadingRow>
          ) : (
            <EmptyBio sx={{ mt: 1 }}>{t('profile.overview.no_wearables')}</EmptyBio>
          )}
        </section>
      </InfoSurface>
    </OverviewRoot>
  )
}

export { OverviewTab }
export type { OverviewTabProps }
