## Summary

- Stop reading `navigator.connection.downlink` for the macOS download modal hold estimate — Chrome caps it at ~10 Mbps per the Network Information API W3C spec, so every fast user looked like a 10 Mbps user and the estimate clamped to the max hold on every download.
- Use a static `ASSUMED_DOWNLINK_MBPS = 100` broadband assumption instead. More accurate in practice than the browser-reported value and deterministic to reason about.
- Lower `ESTIMATE_MAX_HOLD_MS` from `10000` → `4000` so the modal can't hang for 10 s on near-instant downloads even if the estimate drifts.

## Why

User reported the macOS modal stays up ~10 s even when the DMG downloads almost instantly. Reproduced locally: on a 100 Mbps connection, `navigator.connection.downlink` reads `9.3` (Chrome caps it for privacy; Safari/Firefox don't expose the API at all). With that artificially low downlink, every estimate frequently clamps to the 10 s `ESTIMATE_MAX_HOLD_MS`.

The browser is lying to us, so we stop asking. A static modern-broadband assumption is more accurate in practice than the spec-capped value and lets us reason about the worst-case hold deterministically.

## Test plan

- [ ] macOS Chrome on fast broadband: download DMG, modal closes within ~1–2 s of the file landing (no 10 s hang).
- [ ] macOS Safari: same behavior, no regression from the missing API.
- [ ] Slow connection: modal stays up at least `ESTIMATE_MIN_HOLD_MS` (800 ms) and at most `ESTIMATE_MAX_HOLD_MS` (4 s); the browser's native download bar takes over as the real progress signal afterward.
- [ ] Windows streamed-fetch path unaffected (this change only touches the macOS `estimateDownloadHoldMs` branch).
- [ ] Windows fallback path (CORS-blocked preview deploys) still holds for the fixed 4 s `FALLBACK_LOADER_HOLD_MS`.
