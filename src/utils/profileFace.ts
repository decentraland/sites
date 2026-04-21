const PROFILE_IMAGES_ORIGIN = 'https://profile-images.decentraland.org'

function getProfileFaceUrl(address: string): string {
  return `${PROFILE_IMAGES_ORIGIN}/entities/${address.toLowerCase()}/face.png`
}

export { getProfileFaceUrl }
