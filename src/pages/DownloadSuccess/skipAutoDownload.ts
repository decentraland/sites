// TEMP (local dev only): lets a developer open /download_success without downloading the installer or
// sending download_* events. `import.meta.env.DEV` is false in production builds, so the branch is dead
// there. Kept in its own module because ts-jest cannot parse `import.meta`; specs mock this file.
const SKIP_AUTO_DOWNLOAD = import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTO_DOWNLOAD === 'true'

export { SKIP_AUTO_DOWNLOAD }
