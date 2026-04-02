type MediaProps = {
  url: string
  width: number
  height: number
}

type HeroData = {
  titleFirstLine: string
  changingWords: string[]
  titleLastLine: string
  subtitle: string
  imageLandscape: MediaProps
  videoLandscape: MediaProps & { mimeType: string }
  imagePortrait: MediaProps
  videoPortrait: MediaProps & { mimeType: string }
}

type WhyCardData = {
  id: string
  title: string
  description: string
  image: string
}

type CreateCardTab = {
  title: string
  descriptionTitle: string
  descriptionSubTitle: string
  skills: string[]
  links: { label: string; url: string }[]
}

type CreateCardData = {
  id: string
  title: string
  description: string
  image: string
  imageBackground: string
  tab1: CreateCardTab
  tab2?: CreateCardTab
}

type ConnectCardData = {
  id: string
  name: string
  description: string
  image: string
  url?: string
}

type LearnCardData = {
  id: string
  title: string
  name: string
  userImage: string
  image: string
  url: string
  date: string
}

type FaqData = {
  question: string
  answer: string
}

const heroData: HeroData = {
  titleFirstLine: 'Create your own',
  changingWords: ['Wearables', 'Emotes', 'Worlds', 'Experiences', 'Scenes', 'Games'],
  titleLastLine: 'in Decentraland',
  subtitle: 'Download the Creator Hub to start building immersive scenes and interactive experiences in Decentraland.',
  imageLandscape: {
    url: 'https://images.ctfassets.net/ea2ybdmmn1kv/3fZB29mbYNJdp7sv1y2SJ2/108e55d6d3e23cd11e7d75563d81caf5/hero.webp',
    width: 960,
    height: 540
  },
  videoLandscape: {
    url: 'https://videos.ctfassets.net/ea2ybdmmn1kv/5ELJfyKfvgJMlWi3QXzyt7/28d4d5202e965c08eabc3f9efcf329ea/hero-desktop.mp4',
    mimeType: 'video/mp4',
    width: 960,
    height: 540
  },
  imagePortrait: {
    url: 'https://images.ctfassets.net/ea2ybdmmn1kv/1nUkaxckVENfmyQduvC9Rm/9304ddbd82bba15c44ea698be0fadfa8/hero-mobile.webp',
    width: 195,
    height: 330
  },
  videoPortrait: {
    url: 'https://videos.ctfassets.net/ea2ybdmmn1kv/35QAhVRDvfhcDjRbCquYKT/459f381b4445fb5b44b140b2fc4ff80a/hero_mobile.mp4',
    mimeType: 'video/mp4',
    width: 195,
    height: 330
  }
}

const whyCards: WhyCardData[] = [
  {
    id: 'join',
    title: 'Join a Community of Creators',
    description:
      'Share knowledge, collaborate, and build relationships in a community of artists, designers, and developers where you can see your work appreciated everyday.',
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/2l0VUCaHXFG7NwltyZ1nWA/a6e18252e09a9916e8d735f098ef452a/Image_1.png'
  },
  {
    id: 'create',
    title: 'Create in an Open, Decentralized Ecosystem',
    description:
      "Retain full control over your content on a platform that's governed by its users and build side-by-side with other creators in an open virtual world ready to be explored.",
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/77yzgLkg2oQ7GAZLPtEAwY/64a8d2741a6e3f1f90b15636c4d37638/Image_2.png'
  },
  {
    id: 'benefit',
    title: 'Benefit from a Creator-Centric Economy',
    description:
      "Decentraland is owned by its users, so you keep 97.5% of Marketplace sales while the rest funds community grants for creators like you. Plus, you'll get 2.5% royalties on resales.",
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/3iCBvRrzEtgD7LT8PYxMZn/2f5fba37f044d426d24e25ce33dc1f9c/Image_3.png'
  }
]

const createCards: CreateCardData[] = [
  {
    id: 'design-unique-wearables',
    title: 'Design Unique Wearables',
    description:
      'In Decentraland, Wearables go beyond clothing. Think floating elements, glowing fabrics, robot prosthetics, alien bodies—anything is possible!',
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/3Cu7b7wDmHMxdlnV1kPIHK/af575947c309275575ee1f456042596a/PNG_1.png',
    imageBackground: 'https://images.ctfassets.net/ea2ybdmmn1kv/5tQ56AeW3FWfsnDIgIr1ix/1ff51b5358a8ddf13a4bb4bddaf36601/BG_1.png',
    tab1: {
      title: 'Regular',
      descriptionTitle: 'Shape Your Digital Identity',
      descriptionSubTitle:
        'Craft the skins, clothes, accessories, and bodies that provide the Decentraland community with endless options to customize their digital identities.',
      skills: ['3D MODELING', 'IMAGINATIVE FASHION SENSE'],
      links: [
        {
          label: 'Creating Wearables',
          url: 'https://docs.decentraland.org/creator/wearables/creating-wearables/'
        },
        {
          label: 'Wearables in the Marketplace',
          url: 'https://decentraland.org/marketplace/browse?section=wearables&vendor=decentraland&page=1&sortBy=newest&status=on_sale'
        },
        {
          label: 'Publishing Wearables',
          url: 'https://docs.decentraland.org/creator/wearables/publishing-collections/'
        },
        {
          label: 'Wearable Tutorials',
          url: 'https://www.youtube.com/watch?v=zl43Fw7zROQ&list=PLEl6fe1igtKBFDcxaC64Uxamo7kQUi5mf&pp=iAQB'
        }
      ]
    },
    tab2: {
      title: 'Smart Wearables',
      descriptionTitle: 'Experiences & Fashion Combined',
      descriptionSubTitle:
        'Want to create a jet pack that lets you fly or glasses that reveal a secret world? Tie Portable Experiences to Wearables, for a whole new realm of possibilities.',
      skills: ['ANIMATION', 'IMAGINATIVE FASHION SENSE', '3D MODELING', 'TYPESCRIPT'],
      links: [
        {
          label: 'Portable Experience Docs',
          url: 'https://docs.decentraland.org/creator/development-guide/sdk7/portable-experiences/'
        },
        {
          label: 'SDK 7 Docs',
          url: 'https://docs.decentraland.org/creator/development-guide/sdk7/sdk-101/'
        },
        {
          label: 'Smart Wearables Docs',
          url: 'https://docs.decentraland.org/creator/development-guide/sdk7/smart-wearables/'
        },
        {
          label: 'Smart Wearables in the Marketplace',
          url: 'https://decentraland.org/marketplace/browse?assetType=item&section=wearables&vendor=decentraland&page=1&sortBy=newest&status=on_sale&onlySmart=true'
        }
      ]
    }
  },
  {
    id: 'animate-expressive-emotes',
    title: 'Animate Expressive Emotes',
    description:
      "Create the avatar animations that allow Decentraland's community to form connections, share emotions, and participate in endless fun activities.",
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/5TILWmR3rrA6K2DMTrPwXx/aeafb6cfc8fd3ef829833c41fb4cda16/PNG_2.png',
    imageBackground: 'https://images.ctfassets.net/ea2ybdmmn1kv/26Oa8X59NGyCSnL2j2Tvrw/091c890f8a5bfcdf8878a3c09c1268ae/BG_2.png',
    tab1: {
      title: 'More than Motion',
      descriptionTitle: 'More than Motion',
      descriptionSubTitle:
        'Surpassing simple animations, in Decentraland, Emotes take expression to the next level with the option of adding props and sounds!',
      skills: ['TYPESCRIPT', '3D MODELING', 'ANIMATION'],
      links: [
        {
          label: 'Creating Emotes',
          url: 'https://docs.decentraland.org/creator/emotes/creating-and-exporting-emotes/'
        },
        {
          label: 'Emote Tutorials',
          url: 'https://www.youtube.com/watch?v=-iWslh4uQIk&list=PLAcRraQmr_GN8LcnnQk2BByo9L2Orvp9c&pp=iAQB'
        },
        {
          label: 'Publishing Emotes',
          url: 'https://docs.decentraland.org/creator/wearables/publishing-collections/'
        },
        {
          label: 'Emotes in the Marketplace',
          url: 'https://decentraland.org/marketplace/browse?assetType=item&section=emotes&vendor=decentraland&page=1&sortBy=newest&status=on_sale'
        }
      ]
    }
  },
  {
    id: 'craft-immersive-experiences',
    title: 'Craft Immersive Experiences',
    description:
      'Construct captivating scenes, interactive experiences, and games in an open-world ecosystem. Claim your own World or rent/buy LAND to start building.',
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/3JXtpqW33ILyBYzrpzykKl/f246d9529cbbc4d033c271cd02d4376b/PNG_3.png',
    imageBackground: 'https://images.ctfassets.net/ea2ybdmmn1kv/5E9WJJcBi3qeuqqetuleeT/6308247b5ca650adf34aaec41d7e7182/BG_3.png',
    tab1: {
      title: 'Basic',
      descriptionTitle: 'Ideal for Beginners',
      descriptionSubTitle:
        'Drag and drop pre-made elements into place to create your dream scene or start with a scene template and customize the details to make it your own.',
      skills: ['ABILITY TO CLICK A MOUSE', 'OVERACTIVE IMAGINATION'],
      links: [
        {
          label: 'Explore Places',
          url: 'https://decentraland.org/places/'
        },
        {
          label: 'Download Creator Hub',
          url: 'https://decentraland.org/download/creator-hub'
        },
        {
          label: 'Building Tutorials',
          url: 'https://www.youtube.com/watch?v=wm8ZD2kSyKA&list=PLAcRraQmr_GPrMmQekqbMWhyBxo3lXs8p&pp=iAQB'
        },
        {
          label: 'Worlds Essential Guide',
          url: 'https://decentraland.org/blog/about-decentraland/decentraland-worlds-your-own-virtual-space'
        }
      ]
    },
    tab2: {
      title: 'Advanced',
      descriptionTitle: 'Complete Control Over Your Creations',
      descriptionSubTitle:
        "Transform your ideas to reality with Decentraland's SDK 7. Craft anything you can imagine, from complex scenes and interactive experiences to fully fledged games.",
      skills: ['TYPESCRIPT', '3D MODELING', 'ANIMATION'],
      links: [
        {
          label: 'Open Source Resources & Templates',
          url: 'https://studios.decentraland.org/resources'
        },
        {
          label: 'Download Creator Hub',
          url: 'https://decentraland.org/download/creator-hub'
        },
        {
          label: 'Building Docs',
          url: 'https://docs.decentraland.org/creator/development-guide/sdk7/sdk-101/'
        },
        {
          label: 'Building Tutorials',
          url: 'https://www.youtube.com/watch?v=wm8ZD2kSyKA&list=PLAcRraQmr_GPrMmQekqbMWhyBxo3lXs8p&pp=iAQB'
        }
      ]
    }
  }
]

const connectCards: ConnectCardData[] = [
  {
    id: 'mrdhingia',
    name: 'MrDhingia',
    description:
      "I love being a DCL creator because it lets me freely create cool 3D spaces. It's great to work with others, learn new things, and monetize my content, reaching people worldwide.",
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/7w2syTuMGjA3VCJZ78YK8q/1a37abd7658ba66e16f1c8d7d4a28333/dhingia.png',
    url: 'https://x.com/MrDhingia'
  },
  {
    id: 'canessa',
    name: 'Canessa',
    description:
      'I think having unique Emotes is a way of making your avatar another form of yourself. I made myself a unique Emote so I could always have a special greeting [distinct from the standard animations everyone uses] for my friends.',
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/3ugHhjVpg2TJRKpGrE5HJO/2c267463b5cab7923fedcd2a8912c17e/anessa.png'
  },
  {
    id: 'polygonal-mind',
    name: 'Polygonal Mind',
    description:
      'Decentraland evolves almost every day on a technical level, but also on a community level. Newcomers come into the platform with new ideas that make the whole platform spin to accommodate them. It is very exciting to see the change in real time.',
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/2A10uagc69WkV4Put4Je8K/b5f7d12193e3e7bc6c126c8b1cf574b9/polygonal.png'
  },
  {
    id: 'tangpoko',
    name: 'TangPoko',
    description:
      'There is a lot of gratification in creating Wearables and Emotes in Decentraland when you see everyone around you wearing and using them!',
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/3VUTEOy199FdbePR0n4v9h/2011425bade058c0b6ceeda046bbc71c/tang.png'
  },
  {
    id: 'nikki-fuego',
    name: 'Nikki Fuego',
    description:
      "My whole life I've been a gamer and the one thing I've always wanted from games was ultimate customization with my character's wearables. [In Decentraland,] that fantasy became a reality.",
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/1qNFtMuqQ6NUgVFZxqIMWO/53a6bd692059f897f8df5a99c9570ecf/Nikki.png'
  }
]

const learnCards: LearnCardData[] = [
  {
    id: 'isamazing',
    title: 'Emote Workshop | Create Great Animations',
    name: 'Isamazing',
    userImage: 'https://images.ctfassets.net/ea2ybdmmn1kv/1JsJlPSMTiDHxWvNbLcTUb/c3ae0654ff66da80a99a52334a3caf01/isa.png',
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/6b8IV5K8BUFIi6AyA1h6uI/e2dd6add08d9b0a77c12d65131f0b42c/5PEF2pwZxtY-HQ.jpg',
    url: 'https://youtu.be/5PEF2pwZxtY?list=PLAcRraQmr_GN8LcnnQk2BByo9L2Orvp9c',
    date: 'January 30, 2024'
  },
  {
    id: 'kjwalker',
    title: 'Making Skins | Creating Wearables',
    name: 'KJWalker',
    userImage: 'https://images.ctfassets.net/ea2ybdmmn1kv/6pjOW45mmmYy5DkaoOsYLB/02b30670a4d63e32845d89d6ad063fe5/kj.png',
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/3BYsoFQ1UEbmjVPIDNMdIU/f9a89d99a91741da24010d68030d323e/zx2CBy3pPfo-HQ.jpg',
    url: 'https://www.youtube.com/watch?v=zx2CBy3pPfo',
    date: 'January 31, 2024'
  },
  {
    id: 'nicoe',
    title: 'Creating Scenes | SDK 7 and Smart Items',
    name: 'NicoE',
    userImage: 'https://images.ctfassets.net/ea2ybdmmn1kv/1HxP6difHgjUlzACC0Nha2/7c75d6c74da5171584072eadefd3b961/nico.png',
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/6gjVuKeWBh76Pe6UyiAZzt/29ffb9ad320ca075e2c04ad34464f9c4/J_EO1LZkaiA-HQ.jpg',
    url: 'https://www.youtube.com/watch?v=J_EO1LZkaiA&list=PLAcRraQmr_GP_K8WN7csnKnImK4R2TgMA&index=6&ab_channel=Decentraland',
    date: 'January 31, 2024'
  },
  {
    id: 'sango',
    title: 'How to Make a Wearable | Workshop Series',
    name: 'Sango',
    userImage: 'https://images.ctfassets.net/ea2ybdmmn1kv/4AVvwN5SFyRJu9zEFt2qJF/fd883eb27e429351a619d6fef963f9cb/sango.png',
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/5ky9e2oglx9xmfLRC6uhzY/c04eee263099cccb99245c3d9b7808c3/zl43Fw7zROQ-SD.jpg',
    url: 'https://youtu.be/zl43Fw7zROQ?list=PLEl6fe1igtKBFDcxaC64Uxamo7kQUi5mf',
    date: 'January 24, 2024'
  },
  {
    id: 'sinful',
    title: 'Publishing Wearables & Emotes',
    name: 'Sinful',
    userImage:
      'https://images.ctfassets.net/ea2ybdmmn1kv/16eJcvU74UY7k3KXZoI5AD/a8578a20da16d755c95815f6daed072a/Screenshot_2024-01-31_130003.png',
    image: 'https://images.ctfassets.net/ea2ybdmmn1kv/5EI8frG7fYxMRGbgm92TPC/a69b8d39cb44e88640c44b0cdaa8373f/vY7IYksmC2M-HQ.jpg',
    url: 'https://www.youtube.com/watch?v=vY7IYksmC2M',
    date: 'January 31, 2024'
  }
]

const faqItems: FaqData[] = [
  {
    question: 'What is Decentraland?',
    answer:
      "Launched in 2020, Decentraland is a virtual social world, the first decentralized metaverse, and the only one that is open source. Within the Decentraland platform, which can run on a browser or desktop app, users can create, experience, and monetize content and applications as well as socialize and attend a wide range of daily, community-driven events. Decentraland is unique in that it is owned, created, and governed by the people who use it every day. Through Decentraland's decentralized autonomous organization (DAO) users can submit and vote on proposals and even apply for grants for the community to vote on."
  },
  {
    question: 'What can I create in Decentraland?',
    answer:
      "It would be easier to ask what you can't create in Decentraland! As a virtual world created by its users, in Decentraland you can create just about everything.\nDecentraland Creators make all the components that go into crafting a digital identity, such as Wearables (this can include whole skins, body parts, articles of clothing, hair styles, accessories, etc.) as well as Emotes, animations for your avatar which can include props and sounds in addition to movement.\nThe landscape and activities of Decentraland are also all shaped by creators. Walking through Decentraland's Genesis City, you can explore a variety of content from different creators, built side-by-side: art galleries, theaters, gardens, night clubs, racetracks, casinos, entire game experiences, and more can be explored and created by everyone! To start building, download Decentraland's Creator Hub."
  },
  {
    question: 'How do I become a Decentraland creator?',
    answer:
      "Anyone can be a Decentraland creator, all it takes is a little knowhow and endless creative ideas! Depending on what you want to create, the knowledge you need to know differs. If you just want to create cool virtual scenes for yourself or to host events, and learning programming and 3D modeling isn't in your plans, then you can get started creating scenes right away by downloading Decentraland's Creator Hub.\n\nFor those familiar with or willing to learn 3D modeling and/or programming, all the technical specs and procedures you need to know to create in Decentraland can be found on the Creator Docs page, and there are many tutorials available online for creating Wearables, Emotes, and experiences.\nWearables & Emotes\nThe process of creating Wearables & Emotes involves asset creation in a 3D modeling program like Blender, submission to the Curation Committee who ensure that your creation is technically sound and complies with Decentraland's content policy (this includes paying the $100 USD publication fee which goes to the DAO to fund community grants). Finally, once your creation is approved, it is officially published in the Marketplace! You'll receive 97.5% of all primary sales and earn 2.5% royalties on any secondary sales.\nExperiences\nIf you're interested in designing experiences, download Decentraland's Creator Hub and you can start creating immersive scenes and games which you can then publish to Worlds or LAND in Decentraland's open-world Genesis City. You retain all control over your content, can edit or remove it whenever you wish, and keep all proceeds of any funds you may generate through your experiences."
  },
  {
    question: 'Is it possible to monetize my creations?',
    answer:
      'Yes, of course! Decentraland creators are able to monetize their skills in many ways.\n\nWearable and Emote creators publish their creations in the Marketplace, paying a $100 USD publication fee which goes to the DAO to fund community grants, and as a result earn 97.5% of the profits on all primary sales and 2.5% royalties on any secondary sales.\nSome scene creators monetize their experiences, the revenue of which they are able to keep fully for themselves, and lastly many creators offer their services for hire through Decentraland Studios.'
  },
  {
    question: 'Do I need to own LAND to create experiences in Decentraland?',
    answer:
      "No, owning LAND is not necessary to create scenes or interactive experiences in Decentraland. Anyone is free to create content using Decentraland's SDK 7 or no-code Editor. Then, if you want to publish your creations so that you and others can explore and enjoy them, there are multiple options available to you, in addition to owning LAND.\nWorlds\nWorlds are your personal 3D space in the metaverse. The exist separately from the open-world map of Decentraland's Genesis City and are perfect for those looking to experiment with 3D creation or host their own virtual space.\n\nGetting your own World is easy: when you claim a Decentraland NAME you not only get a unique username that can be used across Web3, but also 100 Voting Power (used in Decentraland governance), and of course your own World to use as you wish. Learn more here.\n\nRent LAND\nIf you're interested in publishing your content in Decentraland's open-world Genesis City but don't want to commit to a LAND purchase, you don't have to! It's easy to rent LAND for the short or long term in the Marketplace where you can pay by card, bank transfer, or cryptocurrency. Browse rentals and see what's available!\n\nCommunity Connections, Community Grants, and Open Calls for Creators\nIf someone is passionate about sharing their creations with the community, in Decentraland there will always be a way to make it happen. The creator community is very welcoming and open to lending a hand. If you're just getting started, you can meet many creators in the Community Building Discord.\nIf you want to build an experience that benefits the community, but need the resources to make it happen, you can always try applying for a Community Grant in the DAO. You may also apply to one of the Open  Calls that happen periodically through the year to build experiences and scenes for various Decentraland events such as the annual music, art, and fashion festivals. Stay tuned to Decentraland socials or subscribe to the weekly newsletter to stay updated!"
  },
  {
    question: 'Do I need cryptocurrency or a digital wallet to use Decentraland?',
    answer:
      "You do not need to own cryptocurrency to enjoy Decentraland as it is free to use. If you decide to purchase a community-made creation from the Marketplace, there are multiple payment options available, such as credit/debit card and bank transfer in addition to various cryptocurrencies.\n\nAs for owning a digital wallet, if you don't already have one, you don't need to get one yourself if you don't want to. When you sign-in to Decentraland for the first time-creating your account-a digital wallet will be created for you behind the scenes, it's as simple as that!\n\nThis digital wallet is part of your Decentraland account and is used to store any digital assets you acquire, such as free Wearables you might claim in-world or a fun Emote you purchase in the Marketplace."
  }
]

const earnSkills = [
  '3D MODELING',
  'CREATIVE DIRECTION',
  'LAND RENTAL',
  'LINKED WEARABLES',
  'VENUE RENTAL',
  'ADVERTISING',
  'EMOTE DESIGN',
  'ENTERTAINMENT',
  'PROGRAMMING',
  'WEARABLE DESIGN'
]

export { connectCards, createCards, earnSkills, faqItems, heroData, learnCards, whyCards }
export type { ConnectCardData, CreateCardData, CreateCardTab, FaqData, HeroData, LearnCardData, MediaProps, WhyCardData }
