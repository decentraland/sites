import { Suspense, lazy, useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useDesktopMediaQuery } from 'decentraland-ui2'
import { assetUrl } from '../../utils/assetUrl'
import {
  AboutBody,
  AboutContainer,
  AboutLead,
  AboutSection,
  AboutTagline,
  AboutTitle,
  HeroSection,
  HeroSlide,
  HeroSlideContent,
  HeroSlideImage,
  HeroSlideOverlay,
  HeroSlideSubtitle,
  HeroSlideTitle,
  ParallaxImageWrapper,
  ParallaxSection,
  ParallaxSticky,
  SuspenseFallback
} from './ExplorePage.styled'

const FooterLanding = lazy(() =>
  import('decentraland-ui2/dist/components/FooterLanding/FooterLanding').then(m => ({ default: m.FooterLanding }))
)

// ─── Static content ──────────────────────────────────────────────────────────

const heroSlides = [
  {
    imageUrl: assetUrl('/landing_hero.webp'),
    title: 'Explore Decentraland',
    subtitle: "The world's largest decentralized virtual world"
  },
  {
    imageUrl: assetUrl('/come_hang_out_background.webp'),
    title: 'Create Your World',
    subtitle: 'Build, design, and own your virtual spaces'
  },
  {
    imageUrl: assetUrl('/jump_into_background.webp'),
    title: 'Own Your Experience',
    subtitle: 'True ownership of your digital assets and identity'
  }
]

const parallaxImages = [
  { src: assetUrl('/persona.webp'), position: 'left' as const, alt: 'Decentraland avatar' },
  { src: assetUrl('/catch_the_vibe/alan.webp'), position: 'right' as const, alt: 'Decentraland community' },
  { src: assetUrl('/catch_the_vibe/roustan.webp'), position: 'left' as const, alt: 'Decentraland creator' }
]

// Scroll-progress thresholds at which each image begins to appear
const SHOW_THRESHOLDS = [0.05, 0.38, 0.68] as const

// ─── Component ───────────────────────────────────────────────────────────────

const ExplorePage = () => {
  const isDesktop = useDesktopMediaQuery()

  // Parallax section outer ref — used to measure scroll progress through the section
  const sectionRef = useRef<HTMLDivElement>(null)

  // Individual image wrapper refs — updated directly without React re-renders
  const img1Ref = useRef<HTMLDivElement>(null)
  const img2Ref = useRef<HTMLDivElement>(null)
  const img3Ref = useRef<HTMLDivElement>(null)

  // Lazy-load the footer only when near-viewport
  const { ref: footerRef, inView: footerInView } = useInView({ triggerOnce: true, rootMargin: '400px' })

  // ── Scroll-driven parallax ─────────────────────────────────────────────────
  //
  // We update DOM styles directly (no setState) so scroll events never
  // trigger React re-renders. requestAnimationFrame keeps it in sync with
  // the browser's paint cycle.
  //
  // The outer ParallaxSection is 300 vh, giving us enough scroll distance for
  // smooth motion. The inner ParallaxSticky is `position: sticky; top: 0`,
  // so the viewport always shows the same 100 vh viewport as the user scrolls
  // through those 300 vh.
  //
  // scrollProgress is a value in [0, 1]:
  //   0 = section top is at the viewport bottom (just entering)
  //   1 = section bottom is at the viewport bottom (just leaving)
  //
  useEffect(() => {
    let rafId: number

    const handleScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const section = sectionRef.current
        if (!section) return

        const rect = section.getBoundingClientRect()
        const scrollable = section.offsetHeight - window.innerHeight
        if (scrollable <= 0) return

        const p = Math.max(0, Math.min(1, -rect.top / scrollable))

        // ── Image 1: left side, floats from bottom-center to upper-left ──────
        const ref1 = img1Ref.current
        if (ref1) {
          const show = p >= SHOW_THRESHOLDS[0]
          // Maps 0.05 → 1 to translateY centre+20% → centre-20%
          const ty = show ? (0.4 - p) * 55 : 22
          ref1.style.transform = `translateY(calc(-50% + ${ty}%))`
          ref1.style.opacity = show ? '1' : '0'
        }

        // ── Image 2: right side, slides in from the right ─────────────────
        const ref2 = img2Ref.current
        if (ref2) {
          const show = p >= SHOW_THRESHOLDS[1]
          const tx = show ? Math.max(0, (0.68 - p) * 18) : 18
          const ty = show ? (0.62 - p) * 55 : 22
          ref2.style.transform = `translate(${tx}%, calc(-50% + ${ty}%))`
          ref2.style.opacity = show ? '1' : '0'
        }

        // ── Image 3: left side, floats from below ─────────────────────────
        const ref3 = img3Ref.current
        if (ref3) {
          const show = p >= SHOW_THRESHOLDS[2]
          const ty = show ? (0.95 - p) * 55 : 22
          ref3.style.transform = `translateY(calc(-50% + ${ty}%))`
          ref3.style.opacity = show ? '1' : '0'
        }
      })
    }

    // Compute initial state (section may already be partially visible on load)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <>
      {/* ── Section 1: Full-width hero carousel ─────────────────────────── */}
      <HeroSection>
        <Swiper
          modules={[Autoplay, Navigation, Pagination]}
          autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          navigation
          pagination={{ clickable: true }}
          loop
          speed={700}
        >
          {heroSlides.map((slide, index) => (
            <SwiperSlide key={index}>
              <HeroSlide>
                <HeroSlideImage src={slide.imageUrl} alt={slide.title} loading={index === 0 ? 'eager' : 'lazy'} />
                <HeroSlideOverlay />
                <HeroSlideContent>
                  <HeroSlideTitle variant={isDesktop ? 'h2' : 'h3'}>{slide.title}</HeroSlideTitle>
                  <HeroSlideSubtitle variant="h5">{slide.subtitle}</HeroSlideSubtitle>
                </HeroSlideContent>
              </HeroSlide>
            </SwiperSlide>
          ))}
        </Swiper>
      </HeroSection>

      {/* ── Section 2: Parallax floating images ─────────────────────────── */}
      <ParallaxSection ref={sectionRef}>
        <ParallaxSticky>
          {parallaxImages.map((img, index) => {
            const ref = [img1Ref, img2Ref, img3Ref][index]
            return (
              <ParallaxImageWrapper key={index} $position={img.position} ref={ref}>
                <img src={img.src} alt={img.alt} loading="lazy" />
              </ParallaxImageWrapper>
            )
          })}
        </ParallaxSticky>
      </ParallaxSection>

      {/* ── Section 3: About Decentraland ────────────────────────────────── */}
      <AboutSection>
        <AboutContainer>
          <AboutTitle variant="h2">What is Decentraland?</AboutTitle>

          <AboutLead>
            Decentraland is the world&apos;s first fully decentralized virtual world — a place where you truly own every piece of your
            experience.
          </AboutLead>

          <AboutBody>
            Built on the Ethereum blockchain, Decentraland is an open metaverse where users can explore vast lands, attend live events, play
            games, visit art galleries, and connect with people from around the globe — all without any central authority controlling what
            you can do or own.
          </AboutBody>

          <AboutBody>
            Every parcel of LAND is a unique NFT you can buy, sell, and build on. Your avatar, wearables, and name are yours — stored on the
            blockchain and portable across the metaverse. You&apos;re not just a player; you&apos;re a citizen, creator, and owner.
          </AboutBody>

          <AboutBody>
            Whether you want to host events, build interactive experiences, launch your own art exhibition, or simply hang out with friends,
            Decentraland gives you the tools and the freedom to make it happen — on your terms, in your world.
          </AboutBody>

          <AboutTagline>Your world. Your rules. Your ownership.</AboutTagline>
        </AboutContainer>
      </AboutSection>

      {/* ── Footer (lazy-loaded when near viewport, matching homepage) ───── */}
      <div ref={footerRef}>
        {footerInView && (
          <Suspense fallback={<SuspenseFallback />}>
            <FooterLanding />
          </Suspense>
        )}
      </div>
    </>
  )
}

export { ExplorePage }
