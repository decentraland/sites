/* eslint-disable */
const fs = require('fs')
const path = require('path')
const semver = require('semver')

const viteConfigPath = path.resolve(__dirname, '..', 'vite.config.ts')
const packageJsonPath = path.resolve(__dirname, '..', 'package.json')

const viteConfig = fs.readFileSync(viteConfigPath, 'utf8')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }

// Extract requiredVersion entries from vite.config.ts federation shared block
const sharedBlockMatch = viteConfig.match(/shared:\s*\{([\s\S]*?)\}\s*as\s*Record/)
if (!sharedBlockMatch) {
  console.error('Could not find federation shared block in vite.config.ts')
  process.exit(1)
}

const sharedBlock = sharedBlockMatch[1]
const entryPattern = /['"]?([^'":\s]+)['"]?\s*:\s*\{[^}]*requiredVersion:\s*'([^']+)'/g

let match
const errors = []

while ((match = entryPattern.exec(sharedBlock)) !== null) {
  const pkg = match[1]
  const requiredVersion = match[2]
  const installedRange = allDeps[pkg]

  if (!installedRange) {
    // Packages like @emotion/react may come as transitive deps from decentraland-ui2
    continue
  }

  // Resolve the minimum version from the installed range
  const installedMin = semver.minVersion(installedRange)
  if (!installedMin) {
    errors.push(`${pkg}: could not parse installed version "${installedRange}"`)
    continue
  }

  if (!semver.satisfies(installedMin.version, requiredVersion)) {
    errors.push(
      `${pkg}: installed "${installedRange}" (min ${installedMin}) does not satisfy federation requiredVersion "${requiredVersion}"`
    )
  }
}

if (errors.length > 0) {
  console.error('Federation version drift detected:\n')
  errors.forEach(e => console.error(`  ✗ ${e}`))
  console.error('\nUpdate the requiredVersion in vite.config.ts federation shared config.')
  process.exit(1)
} else {
  console.log('✓ All federation shared versions are in sync with package.json')
}
