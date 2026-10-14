import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const source = path.join(root, "components/sections/gallery-content.tsx")
const target = path.join(root, "lib/content/gallery-defaults.ts")

const content = fs.readFileSync(source, "utf8")
const start = content.indexOf("const galleryData")
const end = content.indexOf("export function GalleryContent")
let block = content.slice(start, end)
block = block.replace("const galleryData", "export const defaultGalleryData")
block = block.replace(": Record<string, GalleryItem[]>", ": GalleryData")

const header = `import type { GalleryData } from "./types"\n\n`
fs.writeFileSync(target, header + block)
console.log("Extracted gallery defaults")
