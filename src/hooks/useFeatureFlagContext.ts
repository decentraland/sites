// Simple feature flag hook - returns all flags as enabled by default
// Returns tuple [flags, { loading }] to match decentraland-gatsby API
const useFeatureFlagContext = (): [{ variants: Record<string, unknown> }, { loading: boolean }] => {
  return [
    { variants: {} }, // flags object with variants property
    { loading: false } // metadata
  ]
}

export { useFeatureFlagContext }
