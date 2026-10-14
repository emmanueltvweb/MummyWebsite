"use client"

import { useRef } from "react"
import { mergeAttributes, Node } from "@tiptap/core"
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react"
import { AlignCenter, AlignLeft, AlignRight, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"

/* ============================================================================ Figure image
   An image block with caption, alignment and drag-to-resize (width stored as % of the column). */

export interface FigureImageAttrs {
  src: string
  alt?: string
  caption?: string
  width?: number
  align?: "left" | "center" | "right"
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figureImage: {
      setFigureImage: (attrs: FigureImageAttrs) => ReturnType
    }
    vimeo: {
      setVimeoVideo: (options: { src: string }) => ReturnType
    }
  }
}

function FigureView({ node, updateAttributes, deleteNode, selected, editor }: ReactNodeViewProps) {
  const { src, alt, caption, width, align } = node.attrs as Required<FigureImageAttrs>
  const figureRef = useRef<HTMLElement>(null)
  const editable = editor.isEditable

  const startResize = (event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const figure = figureRef.current
    const container = figure?.parentElement?.closest(".ProseMirror") as HTMLElement | null
    if (!figure || !container) return
    const startX = event.clientX
    const startWidth = figure.getBoundingClientRect().width
    const total = container.getBoundingClientRect().width
    const direction = align === "right" ? -1 : 1
    const onMove = (e: PointerEvent) => {
      const next = ((startWidth + (e.clientX - startX) * direction * (align === "center" ? 2 : 1)) / total) * 100
      updateAttributes({ width: Math.round(Math.min(100, Math.max(15, next))) })
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  return (
    <NodeViewWrapper
      as="figure"
      ref={figureRef}
      data-align={align}
      data-width={width}
      style={{ width: `${width}%` }}
      className={cn("group relative my-4", selected && "ProseMirror-selectednode")}
      data-drag-handle
    >
      <img src={src} alt={alt ?? ""} draggable={false} className="block w-full rounded-xl" />

      {editable && selected && (
        <div contentEditable={false} className="absolute top-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-admin-border bg-admin-surface p-1 shadow-admin-lg">
          {([
            ["left", AlignLeft],
            ["center", AlignCenter],
            ["right", AlignRight],
          ] as const).map(([value, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => updateAttributes({ align: value })}
              className={cn("rounded-lg p-1.5 text-admin-muted hover:bg-admin-subtle", align === value && "bg-admin-brand-soft text-admin-brand")}
              aria-label={`Align ${value}`}
            >
              <Icon className="size-4" />
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-admin-border" />
          {[25, 50, 75, 100].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => updateAttributes({ width: w })}
              className={cn("rounded-lg px-2 py-1 text-xs font-semibold text-admin-muted hover:bg-admin-subtle", width === w && "bg-admin-brand-soft text-admin-brand")}
            >
              {w}%
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-admin-border" />
          <button
            type="button"
            onClick={() => {
              const next = window.prompt("Alt text (describe the image for screen readers)", alt ?? "")
              if (next !== null) updateAttributes({ alt: next })
            }}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-admin-muted hover:bg-admin-subtle"
          >
            Alt
          </button>
          <button type="button" onClick={deleteNode} className="rounded-lg p-1.5 text-admin-danger hover:bg-admin-danger-soft" aria-label="Remove image">
            <Trash2 className="size-4" />
          </button>
        </div>
      )}

      {editable && (
        <span
          contentEditable={false}
          onPointerDown={startResize}
          className={cn(
            "absolute top-1/2 h-12 w-2.5 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-admin-brand opacity-0 shadow transition group-hover:opacity-100",
            align === "right" ? "-left-1.5" : "-right-1.5",
            selected && "opacity-100"
          )}
          role="separator"
          aria-label="Drag to resize image"
        />
      )}

      {editable ? (
        <input
          value={caption ?? ""}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          placeholder="Add a caption (optional)"
          className="mt-2 w-full bg-transparent text-center text-sm text-admin-muted outline-none placeholder:text-admin-muted/60"
          onKeyDown={(e) => e.stopPropagation()}
        />
      ) : (
        caption && <figcaption>{caption}</figcaption>
      )}
    </NodeViewWrapper>
  )
}

export const FigureImage = Node.create({
  name: "figureImage",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: "" },
      caption: { default: "" },
      width: { default: 100 },
      align: { default: "center" },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image"]',
        priority: 60,
        getAttrs: (element) => {
          const el = element as HTMLElement
          const img = el.querySelector("img")
          if (!img) return false
          return {
            src: img.getAttribute("src"),
            alt: img.getAttribute("alt") ?? "",
            caption: el.querySelector("figcaption")?.textContent ?? "",
            width: Number(el.getAttribute("data-width")) || 100,
            align: el.getAttribute("data-align") || "center",
          }
        },
      },
      {
        tag: "img[src]",
        getAttrs: (element) => ({
          src: (element as HTMLElement).getAttribute("src"),
          alt: (element as HTMLElement).getAttribute("alt") ?? "",
        }),
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const { src, alt, caption, width, align } = node.attrs as Required<FigureImageAttrs>
    const figure = mergeAttributes(HTMLAttributes, {
      "data-type": "image",
      "data-align": align,
      "data-width": String(width),
      style: `width:${width}%`,
    })
    delete figure.src
    delete figure.alt
    delete figure.caption
    delete figure.width
    delete figure.align
    return caption
      ? ["figure", figure, ["img", { src, alt }], ["figcaption", {}, caption]]
      : ["figure", figure, ["img", { src, alt }]]
  },

  addCommands() {
    return {
      setFigureImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { width: 100, align: "center", ...attrs } }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(FigureView)
  },
})

/* ============================================================================ Vimeo embed */

export function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/)
  return match ? `https://player.vimeo.com/video/${match[1]}` : null
}

export const Vimeo = Node.create({
  name: "vimeo",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return { src: { default: null } }
  },

  parseHTML() {
    return [
      {
        tag: "div[data-vimeo-video] iframe",
        getAttrs: (el) => ({ src: (el as HTMLElement).getAttribute("src") }),
      },
    ]
  },

  renderHTML({ node }) {
    return [
      "div",
      { "data-vimeo-video": "" },
      [
        "iframe",
        {
          src: node.attrs.src,
          width: "640",
          height: "360",
          frameborder: "0",
          allow: "autoplay; fullscreen; picture-in-picture",
          allowfullscreen: "true",
          title: "Vimeo video",
        },
      ],
    ]
  },

  addCommands() {
    return {
      setVimeoVideo:
        ({ src }) =>
        ({ commands }) => {
          const embed = getVimeoEmbedUrl(src)
          if (!embed) return false
          return commands.insertContent({ type: this.name, attrs: { src: embed } })
        },
    }
  },
})
