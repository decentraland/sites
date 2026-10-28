import publicLinks from '../../config/publicLinks.json'

const socialLinks = [
  { name: 'Discord', url: publicLinks.social.discord },
  { name: 'GitHub', url: 'https://github.com/decentraland' },
  { name: 'X', url: publicLinks.social.x },
  { name: 'Instagram', url: 'https://instagram.com/decentraland_foundation/' },
  { name: 'YouTube', url: 'https://youtube.com/@decentraland_foundation' },
  { name: 'TikTok', url: 'https://tiktok.com/@decentraland_fdn' },
  { name: 'LinkedIn', url: 'https://linkedin.com/company/decentralandorg' }
] as const

const gettingStartedLinks = [
  { labelKey: 'component.landing.footer.getting_started.what_is', url: publicLinks.support.about },
  { labelKey: 'component.landing.footer.getting_started.download', url: '/download' },
  {
    labelKey: 'component.landing.footer.getting_started.system_requirements',
    url: 'https://docs.decentraland.org/in-world/settings-and-performance'
  },
  { labelKey: 'component.landing.footer.getting_started.faqs', url: publicLinks.support.faq },
  { labelKey: 'component.landing.footer.getting_started.contact_support', url: publicLinks.support.help }
] as const

const resourceLinks = [
  { labelKey: 'component.landing.footer.resources.marketplace', url: 'https://decentraland.org/marketplace' },
  { labelKey: 'component.landing.footer.resources.creator_hub', url: 'https://decentraland.org/create/' },
  { labelKey: 'component.landing.footer.resources.docs', url: 'https://docs.decentraland.org' },
  { labelKey: 'component.landing.footer.resources.blog', url: 'https://decentraland.org/blog/' },
  { labelKey: 'component.landing.footer.resources.vote', url: 'https://decentraland.org/dao' }
] as const

export { gettingStartedLinks, resourceLinks, socialLinks }
