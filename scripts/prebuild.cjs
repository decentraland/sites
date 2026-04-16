/* eslint-disable */
const fs = require("fs")
const dotenv = require("dotenv")

dotenv.config()

let ENV_CONTENT = {}

// read files
if (fs.existsSync(".env")) {
  Object.assign(ENV_CONTENT, dotenv.parse(fs.readFileSync(".env")))
}
const packageJson = JSON.parse(fs.readFileSync("./package.json").toString())
const publicPackageJson = JSON.parse(
  fs.readFileSync("./public/package.json").toString()
)

// set version
ENV_CONTENT["REACT_APP_WEBSITE_VERSION"] = packageJson.version
publicPackageJson.version = packageJson.version

// set public url
Object.assign(ENV_CONTENT, getPublicUrls())
packageJson.homepage = ENV_CONTENT["VITE_BASE_URL"]
publicPackageJson.homepage = packageJson.homepage
if (packageJson.homepage) {
  // github action outputs. Do not touch.
  console.log("::set-output name=public_url::" + packageJson.homepage)
  console.log(
    "::set-output name=public_path::" + new URL(packageJson.homepage).pathname
  )
}

// log stuff
console.log("VERSIONS: ", Object.entries(ENV_CONTENT), "\n")

// save files
fs.writeFileSync(
  ".env",
  Object.entries(ENV_CONTENT)
    .map((e) => e[0] + "=" + JSON.stringify(e[1]))
    .join("\n") + "\n"
)
fs.writeFileSync("./package.json", JSON.stringify(packageJson, null, 2))
fs.writeFileSync(
  "./public/package.json",
  JSON.stringify(publicPackageJson, null, 2)
)

// public url logic
function getPublicUrls() {
  const isStatic = !!process.env.GEN_STATIC_LOCAL
  const isCI = !!process.env.CI
  const isVercel = isCI && !!process.env.VERCEL
  const isCloudflarePages = isCI && !!process.env.CF_PAGES
  const isCDN = !isStatic && isCI && !isVercel && !isCloudflarePages
  console.log("is static", isStatic)
  console.log("is CI", isCI)
  console.log("is Vercel", isVercel)
  console.log("is Cloudflare Pages", isCloudflarePages)
  console.log("is CDN", isCDN)
  if (isCDN) {
    // master/main branch, also releases
    const cdnUrl = `https://cdn.decentraland.org/${publicPackageJson.name}/${publicPackageJson.version}`
    console.log(`Using CDN as public url: "${cdnUrl}"`)
    return {
      VITE_BASE_URL: cdnUrl,
    }
  }
  // localhost, Vercel, or Cloudflare Pages
  console.log("Using empty public url")
  return {
    VITE_BASE_URL: "",
  }
}

// ---------------------------------------------------------------------------
// FAQ sync: fetch "Getting Started" questions from the docs repo at build time
// so that /help page FAQ always reflects the canonical player docs content.
// ---------------------------------------------------------------------------

const DOCS_FAQ_URL =
  "https://raw.githubusercontent.com/decentraland/documentation/main/content/player/FAQs/decentraland-101.md"

const LOCALE_FILES = ["en", "es", "fr", "ja", "ko", "zh"]

/**
 * Parse the ## Getting Started section from the docs markdown and return an
 * array of { question, answer } objects.
 */
function parseGettingStartedFAQ(markdown) {
  // Isolate the ## Getting Started section (up to the next ## heading or end)
  const sectionMatch = markdown.match(
    /## Getting Started\n([\s\S]*?)(?=\n## |\n---\n|$)/
  )
  if (!sectionMatch) {
    console.warn("Could not find '## Getting Started' section in docs FAQ.")
    return null
  }

  const section = sectionMatch[1]
  const items = []

  // Each Q&A lives inside {{< details ... title="..." >}} ... {{</ details >}}
  const detailsRegex =
    /{{<\s*details[^>]*title="([^"]+)"[^>]*>}}([\s\S]*?){{<\/\s*details\s*>}}/g
  let match
  while ((match = detailsRegex.exec(section)) !== null) {
    const question = match[1].trim()
    const answer = cleanMarkdownToPlainText(match[2].trim())
    items.push({ question, answer })
  }

  return items.length > 0 ? items : null
}

/**
 * Strip Hugo shortcodes, markdown images, tables, and other non-plain-text
 * syntax to produce a readable plain-text answer suitable for the FAQ accordion.
 *
 * For answers that contain hardware spec tables, the tables are removed and a
 * link to the full docs is appended instead.
 */
function cleanMarkdownToPlainText(text) {
  const hasTables = /^\|.+\|/m.test(text)

  let result = text

  // Remove Hugo hint shortcodes ({{< hint ... >}} ... {{</ hint >}})
  // Note: Hugo allows spaces around the slash, e.g. {{< /hint >}}
  result = result.replace(
    /{{<\s*hint[^>]*>}}[\s\S]*?{{<\s*\/\s*hint\s*>}}/g,
    ""
  )

  // Remove all remaining Hugo shortcodes (opening and closing tags)
  result = result.replace(/{{<\s*\/?\s*[a-z][^>]*>}}/g, "")

  // Remove markdown images (![alt](url))
  result = result.replace(/!\[[^\]]*\]\([^)]*\)/g, "")

  // Convert markdown links to plain text labels (strip the URL)
  result = result.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")

  // Remove markdown table rows and separator lines
  result = result.replace(/^\|.*$/gm, "")
  result = result.replace(/^[-| :]+$/gm, "")

  // When tables are stripped, their section headings (e.g. "#### Windows")
  // become orphaned. Remove headings that are no longer followed by content.
  result = result.replace(/^#{1,6}\s+.*$/gm, "")

  // Strip bold and italic markers
  result = result.replace(/\*\*([^*]+)\*\*/g, "$1")
  result = result.replace(/__([^_]+)__/g, "$1")
  result = result.replace(/\*([^*]+)\*/g, "$1")

  // Collapse runs of blank lines down to a single blank line
  result = result.replace(/\n{3,}/g, "\n\n").trim()

  // When tables were stripped, the answer is missing key details
  // (e.g. the hardware spec question). Append a docs link so readers can
  // find the full information.
  if (hasTables) {
    result +=
      "\n\nFor full system requirements, visit docs.decentraland.org/faqs/decentraland-101."
  }

  return result
}

/**
 * Fetch the FAQ markdown from the docs repo, parse the Getting Started section,
 * and write the Q&A pairs into every locale JSON file under
 * component.landing.help.faq_section.
 *
 * Non-English locale files keep their translated title/paragraph/cta_link
 * strings but receive the English question + answer content (since the docs
 * only publish English content).
 *
 * If the fetch fails (e.g. offline, docs repo unreachable) the build continues
 * with the existing locale content — the function logs a warning and returns.
 */
async function syncFAQFromDocs() {
  console.log("Syncing FAQ from docs repo:", DOCS_FAQ_URL)

  let markdown
  try {
    const response = await fetch(DOCS_FAQ_URL, {
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) {
      console.warn(
        `FAQ sync: docs fetch returned HTTP ${response.status}. Keeping existing FAQ content.`
      )
      return
    }
    markdown = await response.text()
  } catch (err) {
    console.warn(
      `FAQ sync: could not fetch docs (${err.message}). Keeping existing FAQ content.`
    )
    return
  }

  const items = parseGettingStartedFAQ(markdown)
  if (!items) {
    console.warn("FAQ sync: no items parsed. Keeping existing FAQ content.")
    return
  }

  console.log(`FAQ sync: parsed ${items.length} items from Getting Started.`)

  for (const locale of LOCALE_FILES) {
    const filePath = `./src/intl/${locale}.json`
    if (!fs.existsSync(filePath)) continue

    const localeData = JSON.parse(fs.readFileSync(filePath).toString())

    const faqSection = localeData?.component?.landing?.help?.faq_section
    if (!faqSection) {
      console.warn(
        `FAQ sync: could not find faq_section in ${locale}.json, skipping.`
      )
      continue
    }

    // Preserve locale-specific UI strings (title, paragraph, cta_link)
    const newFaqSection = {
      title: faqSection.title,
      paragraph: faqSection.paragraph,
      cta_link: faqSection.cta_link,
      item_count: String(items.length),
    }

    items.forEach((item, i) => {
      newFaqSection[`item_${i}_question`] = item.question
      newFaqSection[`item_${i}_answer`] = item.answer
    })

    localeData.component.landing.help.faq_section = newFaqSection
    fs.writeFileSync(filePath, JSON.stringify(localeData, null, 2))
    console.log(`FAQ sync: updated ${locale}.json`)
  }
}

// Run the async FAQ sync. The Node.js event loop stays alive until the
// fetch completes, so the process won't exit prematurely.
syncFAQFromDocs().catch((err) => {
  console.warn("FAQ sync: unexpected error:", err.message)
  // Never fail the build due to a FAQ sync error
})
