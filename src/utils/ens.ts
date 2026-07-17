// Hyphens and underscores are valid ENS label characters, so worlds like
// `common-ground.dcl.eth` or `foo_bar.eth` must match — omitting them silently
// treats a real world realm as a genesis-city position (e.g. it would fall back
// to parcel 0,0 on the storage/jump paths that branch on isEns).
const ENS_REGEX = /^[a-zA-Z0-9._-]+\.eth$/

function isEns(value: string | undefined): value is `${string}.eth` {
  return !!value?.match(ENS_REGEX)?.length
}

export { isEns }
