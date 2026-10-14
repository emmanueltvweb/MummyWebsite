import sanitize from "sanitize-html"

const COLOR = [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^hsla?\([\d\s.,%deg]+\)$/i, /^var\(--[\w-]+\)$/, /^[a-z]+$/i]
const TEXT_ALIGN = [/^(left|right|center|justify)$/]

const IFRAME_HOSTS = ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"]

/** Allow-list sanitiser for rich-text HTML produced by the admin editor. */
export function sanitizeRichText(html: string): string {
  return sanitize(html, {
    allowedTags: [
      "p", "br", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "strike",
      "span", "mark", "sub", "sup", "ul", "ol", "li", "label", "input", "blockquote", "pre", "code",
      "table", "colgroup", "col", "thead", "tbody", "tr", "th", "td", "hr", "a", "img", "figure",
      "figcaption", "iframe", "div",
    ],
    allowedAttributes: {
      "*": ["style", "data-align", "data-type", "data-checked", "data-width", "data-youtube-video", "data-vimeo-video"],
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "title"],
      input: ["type", "checked", "disabled"],
      code: ["class"],
      pre: ["class"],
      td: ["colspan", "rowspan", "colwidth"],
      th: ["colspan", "rowspan", "colwidth"],
      col: ["style", "span"],
      ol: ["start", "type"],
    },
    allowedStyles: {
      "*": {
        color: COLOR,
        "background-color": COLOR,
        "text-align": TEXT_ALIGN,
        "font-size": [/^\d{1,3}(px|rem|em|%)$/],
        "font-family": [/^[\w\s,"'-]+$/],
        width: [/^\d{1,4}(px|%)$/],
        "min-width": [/^\d{1,4}px$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https", "http", "data"] },
    allowedIframeHostnames: IFRAME_HOSTS,
    allowIframeRelativeUrls: false,
    transformTags: {
      a: (tagName, attribs) => {
        const external = attribs.href && /^https?:\/\//.test(attribs.href)
        return {
          tagName,
          attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer nofollow" } : attribs,
        }
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
      input: (tagName, attribs) => ({ tagName, attribs: { ...attribs, disabled: "disabled" } }),
    },
    exclusiveFilter: (frame) => frame.tag === "input" && frame.attribs.type !== "checkbox",
  })
}

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " }

/** Plain text from HTML: block boundaries become spaces and common entities are decoded. */
export function stripHtml(html: string): string {
  const spaced = html.replace(/<\/(p|h[1-6]|li|blockquote|div|figcaption|td|th|pre)>|<br\s*\/?>/gi, " ")
  return sanitize(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, " ")
    .trim()
}

export function makeExcerpt(html: string, length = 180): string {
  const text = stripHtml(html)
  if (text.length <= length) return text
  return `${text.slice(0, length).replace(/\s+\S*$/, "")}…`
}

export function readingMinutes(html: string): number {
  const words = stripHtml(html).split(" ").filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

/** Returns `base`, or `base-2`, `base-3`… so that it doesn't collide with `taken`. */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  const root = slugify(base) || "untitled"
  if (!used.has(root)) return root
  let i = 2
  while (used.has(`${root}-${i}`)) i++
  return `${root}-${i}`
}
