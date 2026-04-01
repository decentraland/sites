import { FormEvent, memo, useCallback, useEffect, useRef, useState } from 'react'
import { useAnalytics } from '@dcl/hooks'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { type SupportedLocale, useLocale } from '../../intl/LocaleContext'
import { SectionViewedTrack, SegmentEvent } from '../../modules/segment'
import { assetUrl } from '../../utils/assetUrl'
import { gettingStartedLinks, resourceLinks, socialLinks } from './footerConfig'
import { ChevronDown, Discord, GitHub, Instagram, LinkedIn, TikTok, XTwitter, YouTube } from './SocialIcons'
import {
  BottomBar,
  BottomBarLeft,
  BottomBarRight,
  ConnectSection,
  CopyrightText,
  DesktopLegalLinks,
  DropdownChevron,
  DropdownContent,
  EmailInput,
  EmailRow,
  FooterLink,
  FooterMain,
  FooterRoot,
  LanguageButton,
  LanguageMenu,
  LanguageWrapper,
  LeftColumn,
  LegalLink,
  LinkColumn,
  MobileFooterLink,
  MobileLegalGrid,
  MobileMenu,
  MobileMenuDropdown,
  MobileMenuLabel,
  NewsletterSection,
  NewsletterTitle,
  RightColumn,
  SectionLabel,
  SocialRow,
  SubscribeButton,
  Wordmark
} from './LandingFooter.styled'

const BEEHIIV_SUBSCRIBE_URL = 'https://embeds.beehiiv.com/f8da188c-39d0-4fd9-9631-1a39cf9ed00d'

const socialIconMap: Record<string, React.FC> = {
  Discord,
  GitHub,
  X: XTwitter,
  Instagram,
  YouTube,
  TikTok,
  LinkedIn
}

const legalLinks = [
  { label: 'Home', url: '/' },
  { label: 'Privacy Policy', url: '/privacy' },
  { label: 'Terms of Use', url: '/terms' },
  { label: 'Content Policy', url: '/content' },
  { label: 'Code of Ethics', url: '/ethics' }
]

const LANGUAGES: { code: SupportedLocale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' }
]

const SocialIconsRow = ({ onTrack }: { onTrack?: (platform: string) => void }) => (
  <SocialRow>
    {socialLinks.map(link => {
      const Icon = socialIconMap[link.name]
      return (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.name}
          onClick={() => onTrack?.(link.name)}
        >
          <Icon />
        </a>
      )
    })}
  </SocialRow>
)

const LandingFooter = memo(() => {
  const l = useFormatMessage()
  const { locale, setLocale } = useLocale()
  const { isInitialized, track } = useAnalytics()
  const [email, setEmail] = useState('')
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  const currentLang = LANGUAGES.find(lang => lang.code === locale) || LANGUAGES[0]

  const trackFooter = useCallback(
    (place: string, extra?: Record<string, string>) => {
      if (!isInitialized) return
      track(SegmentEvent.CLICK, { place, event: 'click', ...extra })
    },
    [isInitialized, track]
  )

  const handleSocialClick = useCallback(
    (platform: string) => trackFooter(SectionViewedTrack.LANDING_FOOTER_SOCIAL, { platform }),
    [trackFooter]
  )

  const handleSubscribe = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      if (!email.trim()) return
      trackFooter(SectionViewedTrack.LANDING_FOOTER_SUBSCRIBE)
      window.open(`${BEEHIIV_SUBSCRIBE_URL}?email=${encodeURIComponent(email.trim())}`, '_blank', 'noopener')
      setEmail('')
    },
    [email, trackFooter]
  )

  const toggleSection = useCallback((key: string) => {
    setOpenSection(prev => (prev === key ? null : key))
  }, [])

  // Close language menu on outside click
  useEffect(() => {
    if (!langOpen) return
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [langOpen])

  return (
    <FooterRoot>
      {/* ── Main footer (purple) ─────────────────────────────────────── */}
      <FooterMain>
        <LeftColumn>
          <Wordmark src={assetUrl('/dcl_name.svg')} alt="Decentraland" />

          <NewsletterSection>
            <NewsletterTitle>{l('component.landing.footer.newsletter.title')}</NewsletterTitle>
            <EmailRow onSubmit={handleSubscribe}>
              <EmailInput
                type="email"
                placeholder={l('component.landing.footer.newsletter.placeholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <SubscribeButton type="submit">{l('component.landing.footer.newsletter.cta')}</SubscribeButton>
            </EmailRow>
          </NewsletterSection>

          <ConnectSection className="desktop-only">
            <SectionLabel>{l('component.landing.footer.connect')}</SectionLabel>
            <SocialIconsRow onTrack={handleSocialClick} />
          </ConnectSection>
        </LeftColumn>

        <RightColumn>
          <LinkColumn>
            <SectionLabel>{l('component.landing.footer.getting_started.title')}</SectionLabel>
            {gettingStartedLinks.map(link => (
              <FooterLink
                key={link.labelKey}
                href={link.url}
                target={link.url.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                onClick={() => trackFooter(SectionViewedTrack.LANDING_FOOTER_LINK, { link: l(link.labelKey) })}
              >
                {l(link.labelKey)}
              </FooterLink>
            ))}
          </LinkColumn>
          <LinkColumn>
            <SectionLabel>{l('component.landing.footer.resources.title')}</SectionLabel>
            {resourceLinks.map(link => (
              <FooterLink
                key={link.labelKey}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackFooter(SectionViewedTrack.LANDING_FOOTER_LINK, { link: l(link.labelKey) })}
              >
                {l(link.labelKey)}
              </FooterLink>
            ))}
          </LinkColumn>
        </RightColumn>

        <MobileMenu>
          <MobileMenuLabel>{l('component.landing.footer.menu')}</MobileMenuLabel>

          <MobileMenuDropdown onClick={() => toggleSection('getting-started')}>
            {l('component.landing.footer.getting_started.title')}
            <DropdownChevron open={openSection === 'getting-started'}>
              <ChevronDown />
            </DropdownChevron>
          </MobileMenuDropdown>
          <DropdownContent open={openSection === 'getting-started'}>
            {gettingStartedLinks.map(link => (
              <MobileFooterLink
                key={link.labelKey}
                href={link.url}
                target={link.url.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                onClick={() => trackFooter(SectionViewedTrack.LANDING_FOOTER_LINK, { link: l(link.labelKey) })}
              >
                {l(link.labelKey)}
              </MobileFooterLink>
            ))}
          </DropdownContent>

          <MobileMenuDropdown onClick={() => toggleSection('resources')}>
            {l('component.landing.footer.resources.title')}
            <DropdownChevron open={openSection === 'resources'}>
              <ChevronDown />
            </DropdownChevron>
          </MobileMenuDropdown>
          <DropdownContent open={openSection === 'resources'}>
            {resourceLinks.map(link => (
              <MobileFooterLink
                key={link.labelKey}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackFooter(SectionViewedTrack.LANDING_FOOTER_LINK, { link: l(link.labelKey) })}
              >
                {l(link.labelKey)}
              </MobileFooterLink>
            ))}
          </DropdownContent>
        </MobileMenu>

        <ConnectSection className="mobile-only">
          <SectionLabel>{l('component.landing.footer.connect')}</SectionLabel>
          <SocialIconsRow onTrack={handleSocialClick} />
        </ConnectSection>
      </FooterMain>

      {/* ── Bottom bar (legal links) ─────────────────────────────────── */}
      <BottomBar>
        <BottomBarLeft>
          <LanguageWrapper ref={langRef}>
            <LanguageButton onClick={() => setLangOpen(o => !o)}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>{currentLang.flag}</span>
              {currentLang.label}
              <DropdownChevron open={langOpen} style={{ display: 'inline-flex' }}>
                <ChevronDown />
              </DropdownChevron>
            </LanguageButton>
            {langOpen && (
              <LanguageMenu>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    className={lang.code === locale ? 'active' : ''}
                    onClick={() => {
                      setLocale(lang.code)
                      setLangOpen(false)
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>{lang.flag}</span>
                    {lang.label}
                  </button>
                ))}
              </LanguageMenu>
            )}
          </LanguageWrapper>

          <DesktopLegalLinks>
            {legalLinks.map(link => (
              <LegalLink key={link.label} href={link.url}>
                {link.label}
              </LegalLink>
            ))}
          </DesktopLegalLinks>

          <MobileLegalGrid>
            <div>
              <LegalLink href="/privacy">Privacy Policy</LegalLink>
              <LegalLink href="/terms">Terms of Use</LegalLink>
            </div>
            <div>
              <LegalLink href="/content">Content Policy</LegalLink>
              <LegalLink href="/ethics">Code of Ethics</LegalLink>
            </div>
          </MobileLegalGrid>
        </BottomBarLeft>

        <BottomBarRight>
          <CopyrightText>&copy; {new Date().getFullYear()} Decentraland</CopyrightText>
        </BottomBarRight>
      </BottomBar>
    </FooterRoot>
  )
})

LandingFooter.displayName = 'LandingFooter'

export { LandingFooter }
