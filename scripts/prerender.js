import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get all markdown files
const markdownDir = path.join(__dirname, '../src/pages/markdown')
const files = fs.readdirSync(markdownDir).filter((file) => file.endsWith('.md'))

const routes = []

files.forEach((file) => {
  const filePath = path.join(markdownDir, file)
  const content = fs.readFileSync(filePath, 'utf-8')
  const { data } = matter(content)

  if (data.menu && data.slug) {
    routes.push({
      path: data.slug,
      title: data.title,
      description: data.description,
      image: data.image
    })
  }
})

console.log('Found markdown routes:', routes.map((r) => r.path).join(', '))

// Generate route manifest for build
const manifestPath = path.join(__dirname, '../markdown-routes.json')
fs.writeFileSync(manifestPath, JSON.stringify(routes, null, 2))

console.log(`✓ Generated route manifest: ${manifestPath}`)
