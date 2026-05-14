import { authorAvatarAsset } from './assets'
import { createAuthorEntry, createCmsListResponse } from './cms-entry.factory'

export const adaAuthor = createAuthorEntry({
  id: 'author-ada',
  slug: 'ada-lovelace',
  title: 'Ada Lovelace',
  description: 'Engineer at Decentraland',
  imageAsset: authorAvatarAsset
})

export const lindaAuthor = createAuthorEntry({
  id: 'author-linda',
  slug: 'linda-liukas',
  title: 'Linda Liukas',
  description: 'Community lead',
  imageAsset: authorAvatarAsset
})

export const decentralandTeamAuthor = createAuthorEntry({
  id: 'author-dcl-team',
  slug: 'decentraland-team',
  title: 'Decentraland Team',
  description: 'Official Decentraland communications',
  imageAsset: authorAvatarAsset
})

export const allAuthors = [adaAuthor, lindaAuthor, decentralandTeamAuthor]

export const authorsListResponse = createCmsListResponse(allAuthors)
