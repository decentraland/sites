# Mac Arch Hint Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `mac_arch` property (`apple_silicon | intel | unknown`) to download-CTA `Click` events so we can finally measure how many macOS downloaders are on Intel Macs — machines that cannot run our arm64-only launcher and silently fail after download.

**Architecture:** A pure, memoized detection module reads the WebGL unmasked renderer string (the only signal that doesn't lie on macOS — the UA reports "Intel" even on Apple Silicon; verified live: an M4 Pro returns `ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro…)`). Both click-tracking hooks (`useDownloadClick` for download CTAs, `useTrackClick` for generic data-\* clicks) attach the hint to the payload ONLY when the click carries a `download_target` and the visitor is on macOS. Purely additive: no existing event or property changes.

**Tech Stack:** TypeScript, React hooks, Jest + jsdom (canvas/WebGL mocked), Segment via existing `deferredTrack`/`postSegmentEvent` paths.

## Global Constraints

- **Fable gate:** this plan requires explicit user approval before execution.
- Branch from `origin/master`: `feat/mac-arch-hint-tracking` (current worktree is on `fix/beacon-ip-stamping` — do NOT build on it).
- Commits: `<type>: <summary>`, GPG-signed, **never** add `Co-Authored-By` (repo CLAUDE.md overrides harness default). **Never push without explicit user authorization.**
- Coverage floor: 95% statements/lines/functions on new code (CLAUDE.md rule 6).
- File placement: pure logic in `src/modules/`, hook changes in `src/hooks/` (+ `src/hooks/adapters/`), specs co-located (CLAUDE.md conventions).
- No i18n changes (no user-visible copy). No `src/shells/` imports (all touched files are lightweight-tier).
- Payload key is snake_case `mac_arch` (warehouse convention, same as `download_target`).
- Pre-commit gate (CLAUDE.md): `npm run format` → `npm run lint:fix` → `npm run lint:pkg` → `npm run build` → `npm test`, then self-review of `git diff --cached`.
- Do NOT compute WebGL on every click: gate on `downloadTarget` presence. Memoize so at most one WebGL context is ever created per page load.

---

### Task 0: Branch setup

**Files:** none (git only)

**Interfaces:**

- Produces: branch `feat/mac-arch-hint-tracking` checked out, based on up-to-date `origin/master`. Every later task commits onto it.

- [ ] **Step 1: Verify the worktree is clean enough to switch**

Run: `git status --porcelain`
Expected: only untracked files (e.g. `docs/superpowers/`). If there are MODIFIED tracked files, STOP and ask the user before proceeding (they belong to `fix/beacon-ip-stamping`).

- [ ] **Step 2: Create the branch from origin/master**

```bash
git fetch origin master
git checkout -b feat/mac-arch-hint-tracking origin/master
```

Expected: `Switched to a new branch 'feat/mac-arch-hint-tracking'` tracking `origin/master`.

- [ ] **Step 3: Commit the plan document**

```bash
git add docs/superpowers/plans/2026-07-21-mac-arch-hint-tracking.md
git commit -m "docs: add mac_arch hint tracking implementation plan"
```

(If the repo convention is to not commit plan docs, skip — but leaving it untracked is also fine; do NOT commit unrelated files under `docs/superpowers/`.)

---

### Task 1: Detection module `getMacArchHint`

**Files:**

- Create: `src/modules/macArchHint.ts`
- Test: `src/modules/macArchHint.spec.ts`

**Interfaces:**

- Produces: `getMacArchHint(): MacArchHint | null` where `type MacArchHint = 'apple_silicon' | 'intel' | 'unknown'`. Returns `null` when the visitor is not on macOS (callers must omit the property entirely in that case). Memoized: repeated calls return the first result without touching WebGL again.

- [ ] **Step 1: Write the failing spec**

```ts
// src/modules/macArchHint.spec.ts
type GetMacArchHint = typeof import('./macArchHint').getMacArchHint

describe('getMacArchHint', () => {
  let getMacArchHint: GetMacArchHint
  let getContextMock: jest.Mock

  const setUserAgent = (value: string) => {
    Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value })
  }

  const mockWebGl = (renderer: string | null) => {
    const gl = renderer
      ? {
          getExtension: jest.fn((name: string) =>
            name === 'WEBGL_debug_renderer_info'
              ? { UNMASKED_RENDERER_WEBGL: 37446 }
              : name === 'WEBGL_lose_context'
                ? { loseContext: jest.fn() }
                : null
          ),
          getParameter: jest.fn(() => renderer)
        }
      : null
    getContextMock = jest.fn(() => gl)
    HTMLCanvasElement.prototype.getContext = getContextMock as unknown as typeof HTMLCanvasElement.prototype.getContext
  }

  beforeEach(() => {
    jest.resetModules()
    getMacArchHint = require('./macArchHint').getMacArchHint
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the visitor is not on macOS', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      mockWebGl('ANGLE (NVIDIA, NVIDIA GeForce RTX 3080)')
    })

    it('should return null without creating a WebGL context', () => {
      expect(getMacArchHint()).toBeNull()
      expect(getContextMock).not.toHaveBeenCalled()
    })
  })

  describe('when the renderer reports an Apple GPU', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl('ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version)')
    })

    it('should return apple_silicon', () => {
      expect(getMacArchHint()).toBe('apple_silicon')
    })

    it('should memoize the result and not create a second WebGL context', () => {
      getMacArchHint()
      getMacArchHint()
      expect(getContextMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('when the renderer reports an Intel GPU', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl('ANGLE (Intel, Intel(R) Iris(TM) Plus Graphics 655, Unspecified Version)')
    })

    it('should return intel', () => {
      expect(getMacArchHint()).toBe('intel')
    })
  })

  describe('when the renderer reports an AMD GPU', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl('AMD Radeon Pro 5500M OpenGL Engine')
    })

    it('should return intel', () => {
      expect(getMacArchHint()).toBe('intel')
    })
  })

  describe('when the debug renderer extension is unavailable', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      const gl = { getExtension: jest.fn(() => null), getParameter: jest.fn() }
      getContextMock = jest.fn(() => gl)
      HTMLCanvasElement.prototype.getContext = getContextMock as unknown as typeof HTMLCanvasElement.prototype.getContext
    })

    it('should return unknown', () => {
      expect(getMacArchHint()).toBe('unknown')
    })
  })

  describe('when WebGL is unavailable', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      mockWebGl(null)
    })

    it('should return unknown', () => {
      expect(getMacArchHint()).toBe('unknown')
    })
  })

  describe('when creating the context throws', () => {
    beforeEach(() => {
      setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
      getContextMock = jest.fn(() => {
        throw new Error('blocked')
      })
      HTMLCanvasElement.prototype.getContext = getContextMock as unknown as typeof HTMLCanvasElement.prototype.getContext
    })

    it('should return unknown', () => {
      expect(getMacArchHint()).toBe('unknown')
    })
  })
})
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `npx jest src/modules/macArchHint.spec.ts`
Expected: FAIL — `Cannot find module './macArchHint'`

- [ ] **Step 3: Write the implementation**

```ts
// src/modules/macArchHint.ts
/**
 * Best-effort Mac CPU-architecture hint for download analytics.
 *
 * The browser hides the real Mac chip everywhere that would be convenient:
 * the User-Agent reports "Intel Mac OS X" even on Apple Silicon, and
 * userAgentData.architecture comes back empty (Safari doesn't ship it at
 * all). The one reliable signal is the GPU — Apple Silicon Macs always have
 * an Apple GPU, Intel Macs never do — exposed through WebGL's unmasked
 * renderer string (e.g. "ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro…)"
 * vs "ANGLE (Intel, Intel(R) Iris(TM) Plus Graphics…)").
 *
 * Why this matters: the launcher DMG is arm64-only. An Intel Mac downloads
 * it fine and then cannot open it, firing zero telemetry — invisible in the
 * funnel. This hint is the only place in the whole pipeline where that
 * cohort can be measured.
 */
type MacArchHint = 'apple_silicon' | 'intel' | 'unknown'

// One WebGL context per page load at most: the GPU can't change mid-session.
let cachedHint: MacArchHint | null | undefined

function readWebGlRenderer(): string | null {
  const canvas = document.createElement('canvas')
  const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
  if (!gl) return null

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  const renderer = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : null

  // Free the context eagerly — some browsers cap live WebGL contexts.
  gl.getExtension('WEBGL_lose_context')?.loseContext()

  return renderer
}

function detect(): MacArchHint | null {
  if (!/Macintosh|Mac OS X/.test(navigator.userAgent)) return null

  try {
    const renderer = readWebGlRenderer()
    if (!renderer) return 'unknown'
    if (/apple/i.test(renderer)) return 'apple_silicon'
    if (/intel|amd|radeon/i.test(renderer)) return 'intel'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

function getMacArchHint(): MacArchHint | null {
  if (cachedHint === undefined) {
    cachedHint = detect()
  }
  return cachedHint
}

export { getMacArchHint }
export type { MacArchHint }
```

- [ ] **Step 4: Run the spec to verify it passes**

Run: `npx jest src/modules/macArchHint.spec.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add src/modules/macArchHint.ts src/modules/macArchHint.spec.ts
git commit -m "feat: add mac architecture hint detection via WebGL renderer"
```

---

### Task 2: Attach the hint in `useDownloadClick`

**Files:**

- Modify: `src/hooks/useDownloadClick.ts` (payload assembly, right after the `download_target` rename around line 62-64)
- Test: `src/hooks/useDownloadClick.spec.ts` (extend existing suite — 23 existing describe/it blocks, keep them green)

**Interfaces:**

- Consumes: `getMacArchHint(): MacArchHint | null` from Task 1 (`import { getMacArchHint } from '../modules/macArchHint'`).
- Produces: `Click` payloads that include `mac_arch: 'apple_silicon' | 'intel' | 'unknown'` when and only when the clicked CTA carries `data-download-target` AND the visitor is on macOS.

- [ ] **Step 1: Write the failing tests (extend the existing spec)**

The existing suite (`describe('when tracking a download click')`) builds events with a local `buildClickEvent(attrs)` helper, renders with `renderHook(() => useDownloadClick())`, asserts on `mockTrack` (warm path), and — critically — runs `jest.resetAllMocks()` in `afterEach`, so every mock must be re-armed per `beforeEach`.

Add a mock at the top of `src/hooks/useDownloadClick.spec.ts`, alongside the existing module mocks:

```ts
import { getMacArchHint } from '../modules/macArchHint'

jest.mock('../modules/macArchHint', () => ({
  getMacArchHint: jest.fn()
}))
```

Then add these cases inside the top-level `describe` (after the existing ones, same "when …/should …" style):

```ts
describe('and the CTA carries a download_target on a macOS visitor', () => {
  beforeEach(() => {
    mockIsInitialized = true
    ;(getMacArchHint as jest.Mock).mockReturnValue('apple_silicon')
  })

  it('should attach mac_arch to the payload', () => {
    const { result } = renderHook(() => useDownloadClick())

    act(() => {
      result.current(buildClickEvent({ 'data-download-target': 'desktop_installer', 'data-place': 'Landing Hero' }))
    })

    expect(mockTrack).toHaveBeenCalledWith(
      SegmentEvent.CLICK,
      expect.objectContaining({ download_target: 'desktop_installer', mac_arch: 'apple_silicon' })
    )
  })
})

describe('and the visitor is not on macOS', () => {
  beforeEach(() => {
    mockIsInitialized = true
    ;(getMacArchHint as jest.Mock).mockReturnValue(null)
  })

  it('should not include a mac_arch key in the payload', () => {
    const { result } = renderHook(() => useDownloadClick())

    act(() => {
      result.current(buildClickEvent({ 'data-download-target': 'desktop_installer', 'data-place': 'Landing Hero' }))
    })

    expect(mockTrack.mock.calls[0][1]).not.toHaveProperty('mac_arch')
  })
})

describe('and the CTA has no download_target', () => {
  beforeEach(() => {
    mockIsInitialized = true
    ;(getMacArchHint as jest.Mock).mockReturnValue('apple_silicon')
  })

  it('should not call getMacArchHint at all', () => {
    const { result } = renderHook(() => useDownloadClick())

    act(() => {
      result.current(buildClickEvent({ 'data-place': 'Landing Footer Link' }))
    })

    expect(getMacArchHint).not.toHaveBeenCalled()
  })
})
```

Note: existing cases are unaffected — after `jest.resetAllMocks()` the auto-mocked `getMacArchHint` returns `undefined`, which the implementation treats as "omit the property".

- [ ] **Step 2: Run the spec to verify the new cases fail**

Run: `npx jest src/hooks/useDownloadClick.spec.ts`
Expected: the 3 new cases FAIL (`mac_arch` missing / mock called unexpectedly); the 23 pre-existing cases still PASS.

- [ ] **Step 3: Implement the payload change**

In `src/hooks/useDownloadClick.ts`, add the import and extend the `downloadTarget` block:

```ts
import { getMacArchHint } from '../modules/macArchHint'
```

```ts
if (downloadTarget) {
  payload.download_target = downloadTarget

  // Mac-only architecture hint (GPU-based; the UA lies about the chip).
  // Only download CTAs pay the (memoized) WebGL read — see macArchHint.
  const macArch = getMacArchHint()
  if (macArch) {
    payload.mac_arch = macArch
  }
}
```

- [ ] **Step 4: Run the spec to verify everything passes**

Run: `npx jest src/hooks/useDownloadClick.spec.ts`
Expected: PASS (26 cases: 23 pre-existing + 3 new)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDownloadClick.ts src/hooks/useDownloadClick.spec.ts
git commit -m "feat: attach mac_arch hint to download CTA clicks"
```

---

### Task 3: Attach the hint in the generic `useTrackClick` adapter

**Files:**

- Modify: `src/hooks/adapters/useTrackLinkContext.ts` (the `downloadTarget` rename block around line 35-38)
- Test: `src/hooks/adapters/useTrackLinkContext.spec.ts` (extend existing suite)

**Interfaces:**

- Consumes: `getMacArchHint(): MacArchHint | null` from Task 1 (`import { getMacArchHint } from '../../modules/macArchHint'` — note the extra `../`).
- Produces: same contract as Task 2 for clicks that flow through the generic data-\* adapter (some download CTAs use this hook instead of `useDownloadClick`).

- [ ] **Step 1: Write the failing tests**

The existing suite (`describe('useTrackClick')`) uses the same pattern as Task 2's: a local `buildClickEvent(attrs)` helper (creates a `button`), `renderHook(() => useTrackClick())`, `mockTrack` assertions, and `jest.resetAllMocks()` in `afterEach` (re-arm mocks per `beforeEach`).

Add the mock at the top of `src/hooks/adapters/useTrackLinkContext.spec.ts`:

```ts
import { getMacArchHint } from '../../modules/macArchHint'

jest.mock('../../modules/macArchHint', () => ({
  getMacArchHint: jest.fn()
}))
```

Then add these cases inside `describe('useTrackClick')`:

```ts
describe('when the element carries a download_target on a macOS visitor', () => {
  beforeEach(() => {
    ;(getMacArchHint as jest.Mock).mockReturnValue('intel')
  })

  it('should attach mac_arch to the payload', () => {
    const { result } = renderHook(() => useTrackClick())

    act(() => {
      result.current(buildClickEvent({ 'data-download-target': 'desktop_installer', 'data-place': 'Landing Hero' }))
    })

    expect(mockTrack).toHaveBeenCalledWith(
      SegmentEvent.CLICK,
      expect.objectContaining({ download_target: 'desktop_installer', mac_arch: 'intel' })
    )
  })
})

describe('when the visitor is not on macOS', () => {
  beforeEach(() => {
    ;(getMacArchHint as jest.Mock).mockReturnValue(null)
  })

  it('should not include a mac_arch key in the payload', () => {
    const { result } = renderHook(() => useTrackClick())

    act(() => {
      result.current(buildClickEvent({ 'data-download-target': 'desktop_installer', 'data-place': 'Landing Hero' }))
    })

    expect(mockTrack.mock.calls[0][1]).not.toHaveProperty('mac_arch')
  })
})

describe('when the element has no download_target', () => {
  beforeEach(() => {
    ;(getMacArchHint as jest.Mock).mockReturnValue('intel')
  })

  it('should not call getMacArchHint at all', () => {
    const { result } = renderHook(() => useTrackClick())

    act(() => {
      result.current(buildClickEvent({ 'data-place': 'Landing Navbar' }))
    })

    expect(getMacArchHint).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to verify the new cases fail**

Run: `npx jest src/hooks/adapters/useTrackLinkContext.spec.ts`
Expected: 3 new FAIL, pre-existing PASS.

- [ ] **Step 3: Implement**

In `src/hooks/adapters/useTrackLinkContext.ts`:

```ts
import { getMacArchHint } from '../../modules/macArchHint'
```

```ts
if (downloadTarget) {
  payload.download_target = downloadTarget

  // Mac-only architecture hint (GPU-based; the UA lies about the chip).
  const macArch = getMacArchHint()
  if (macArch) {
    payload.mac_arch = macArch
  }
}
```

- [ ] **Step 4: Run to verify everything passes**

Run: `npx jest src/hooks/adapters/useTrackLinkContext.spec.ts`
Expected: PASS (all pre-existing + 3 new)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/adapters/useTrackLinkContext.ts src/hooks/adapters/useTrackLinkContext.spec.ts
git commit -m "feat: attach mac_arch hint to generic download clicks"
```

---

### Task 4: Full gate + docs sync

**Files:**

- Modify: none in `src/` (verification only)
- Docs: `.claude/skills/tracking-events/SKILL.md` (confirmed to exist) — add the `mac_arch` property if the skill documents Click properties

- [ ] **Step 1: Run the full pre-commit gate**

```bash
npm run format && npm run lint:fix && npm run lint:pkg && npm run build && npm test
```

Expected: all green. `lint:pkg` is silent on success — do not skip it.

- [ ] **Step 2: Coverage check on the touched files**

Run: `npx jest --coverage --collectCoverageFrom='src/modules/macArchHint.ts' --collectCoverageFrom='src/hooks/useDownloadClick.ts' --collectCoverageFrom='src/hooks/adapters/useTrackLinkContext.ts' src/modules/macArchHint.spec.ts src/hooks/useDownloadClick.spec.ts src/hooks/adapters/useTrackLinkContext.spec.ts`
Expected: ≥95% statements/lines/functions on all three files.

- [ ] **Step 3: Docs sync**

If the `tracking-events` skill documents Click properties, add one line: `mac_arch (apple_silicon|intel|unknown) — Mac-only GPU-based arch hint on download CTA clicks, live since <deploy date>. Intel Macs cannot run the arm64 launcher; this is the only signal that measures them.` Follow `docs/skills-registry.md` governance if the registry needs a row.

- [ ] **Step 4: Self-review the full diff, then commit docs**

```bash
git diff master...HEAD
git add -A && git commit -m "docs: document mac_arch click property in tracking-events skill"
```

(Skip the commit if no doc file needed changes.)

- [ ] **Step 5: STOP — report status**

Per repo rules: branch ready, all gates green. **Do NOT push and do NOT open a PR without explicit user authorization.** Report: files changed, test counts, coverage numbers, and the measurement query to run once deployed:

```sql
SELECT mac_arch, COUNT(DISTINCT anonymous_id) AS anons
FROM segment.landing.click
WHERE download_target = 'desktop_installer'
  AND context_user_agent_data_platform = 'macOS'
  AND CAST(timestamp AS DATE) >= '<deploy date>'
GROUP BY 1;
```

---

## Post-deploy follow-ups (NOT part of this plan)

- Add `mac_arch` reliable-since date to the trust map + knowledge base changelog.
- Once ~1 week of data exists: size the Intel share of Mac downloads and re-read the success→launcher drop with Intel excluded.
- Separate product decision: warn likely-Intel users at the download CTA (needs i18n + design).
