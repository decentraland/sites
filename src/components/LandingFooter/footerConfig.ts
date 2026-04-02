const socialLinks = [
  { name: 'Discord', url: 'https://dcl.gg/discord' },
  { name: 'GitHub', url: 'https://github.com/decentraland' },
  { name: 'X', url: 'https://x.com/decentraland' },
  { name: 'Instagram', url: 'https://instagram.com/decentraland_foundation/' },
  { name: 'YouTube', url: 'https://youtube.com/@decentraland_foundation' },
  { name: 'TikTok', url: 'https://tiktok.com/@decentraland_fdn' },
  { name: 'LinkedIn', url: 'https://linkedin.com/company/decentralandorg' }
] as const

const gettingStartedLinks = [
  { labelKey: 'component.landing.footer.getting_started.what_is', url: 'https://docs.decentraland.org/introduction/about-decentraland' },
  { labelKey: 'component.landing.footer.getting_started.download', url: '/download' },
  {
    labelKey: 'component.landing.footer.getting_started.system_requirements',
    url: 'https://docs.decentraland.org/in-world/settings-and-performance'
  },
  { labelKey: 'component.landing.footer.getting_started.faqs', url: 'https://docs.decentraland.org/faqs/decentraland-101' },
  { labelKey: 'component.landing.footer.getting_started.contact_support', url: 'https://decentraland.org/help/' }
] as const

const resourceLinks = [
  { labelKey: 'component.landing.footer.resources.marketplace', url: 'https://decentraland.org/marketplace' },
  { labelKey: 'component.landing.footer.resources.creator_hub', url: 'https://decentraland.org/create/' },
  { labelKey: 'component.landing.footer.resources.docs', url: 'https://docs.decentraland.org' },
  { labelKey: 'component.landing.footer.resources.blog', url: 'https://decentraland.org/blog/' },
  { labelKey: 'component.landing.footer.resources.vote', url: 'https://decentraland.org/dao' }
] as const

export { gettingStartedLinks, resourceLinks, socialLinks }
