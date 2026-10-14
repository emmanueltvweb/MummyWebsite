"use client"

import { useEffect, useRef, useState } from "react"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { TextStyleKit } from "@tiptap/extension-text-style"
import { Highlight } from "@tiptap/extension-highlight"
import { TextAlign } from "@tiptap/extension-text-align"
import { TableKit } from "@tiptap/extension-table"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { Youtube } from "@tiptap/extension-youtube"
import { CharacterCount, Placeholder } from "@tiptap/extensions"
import type { Mark } from "@tiptap/pm/model"
import { toast as sonner } from "sonner"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Code,
  Code2,
  Eraser,
  Highlighter,
  ImagePlus,
  Italic,
  Library,
  Link2,
  Link2Off,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Paintbrush,
  Quote,
  Redo2,
  Smile,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
  Upload,
  Video,
} from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MediaPickerDialog } from "@/components/admin/ui/uploads"
import { toast } from "@/components/admin/ui/toast"
import { uploadRemoteToCloudinary, uploadToCloudinary, validateFile } from "@/lib/admin/upload"
import { cn } from "@/lib/utils"
import { EmojiPicker } from "./emoji-picker"
import { FigureImage, getVimeoEmbedUrl, Vimeo } from "./extensions"

const FONT_FAMILIES = [
  { label: "Default", value: "" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Sans", value: "Arial, Helvetica, sans-serif" },
  { label: "Humanist", value: "'Trebuchet MS', Verdana, sans-serif" },
  { label: "Monospace", value: "'Courier New', monospace" },
]
const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px"]
const COLORS = [
  "#1b2552", "#2f4a8a", "#4f9bd9", "#d4a017", "#b7791f", "#15803d", "#b91c1c", "#7c3aed",
  "#111827", "#374151", "#6b7280", "#9ca3af", "#e5e7eb", "#ffffff", "#be185d", "#0f766e",
]
const HIGHLIGHTS = ["#fef08a", "#fde68a", "#fed7aa", "#fecaca", "#bbf7d0", "#bae6fd", "#ddd6fe", "#f5d0fe"]

const isCloudinary = (src: string) => src.startsWith("https://res.cloudinary.com/")

/** Height of the sticky admin top bar the editor toolbar sticks beneath (matches `top-[72px]`). */
const ADMIN_TOPBAR = 72
/** Used until the real toolbar height has been measured. */
const STICKY_FALLBACK = ADMIN_TOPBAR + 110

/* ------------------------------------------------------------------ Toolbar building blocks */

function ToolButton({
  label,
  onClick,
  active,
  disabled,
  children,
  shortcut,
}: {
  label: string
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  shortcut?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg text-admin-muted transition hover:bg-admin-subtle hover:text-admin-text disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
            active && "bg-admin-brand-soft text-admin-brand hover:bg-admin-brand-soft hover:text-admin-brand"
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <span className="ml-2 opacity-60">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  )
}

function Divider() {
  return <span className="mx-1 h-6 w-px shrink-0 bg-admin-border" aria-hidden />
}

function ToolSelect({ label, value, onChange, options, className }: { label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; className?: string }) {
  return (
    <select
      aria-label={label}
      title={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-8 shrink-0 cursor-pointer rounded-lg border border-transparent bg-transparent px-1.5 text-sm text-admin-text hover:bg-admin-subtle focus-visible:border-admin-brand focus-visible:outline-none", className)}
    >
      {options.map((o) => (
        <option key={o.label} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function ColorPopover({ label, icon, colors, current, onPick, onClear }: { label: string; icon: React.ReactNode; colors: string[]; current?: string; onPick: (c: string) => void; onClear: () => void }) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button type="button" aria-label={label} onMouseDown={(e) => e.preventDefault()} className="relative flex size-8 shrink-0 items-center justify-center rounded-lg text-admin-muted hover:bg-admin-subtle hover:text-admin-text [&_svg]:size-4">
              {icon}
              <span className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full" style={{ background: current || "transparent" }} />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-60 rounded-xl p-3" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="grid grid-cols-8 gap-1.5">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onPick(color)}
              className={cn("size-6 rounded-md border border-admin-border transition hover:scale-110", current === color && "ring-2 ring-admin-brand ring-offset-1")}
              style={{ background: color }}
              aria-label={color}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label className="flex flex-1 items-center gap-2 text-xs text-admin-muted">
            Custom
            <input type="color" className="h-7 w-10 cursor-pointer rounded border border-admin-border bg-transparent" onChange={(e) => onPick(e.target.value)} />
          </label>
          <button type="button" onClick={onClear} className="rounded-lg px-2 py-1 text-xs font-medium text-admin-muted hover:bg-admin-subtle">
            Reset
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function UrlPopover({
  label,
  icon,
  active,
  placeholder,
  initial = "",
  onSubmit,
  submitLabel = "Apply",
}: {
  label: string
  icon: React.ReactNode
  active?: boolean
  placeholder: string
  initial?: string
  onSubmit: (value: string) => boolean | void
  submitLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(initial)
  useEffect(() => {
    if (open) setValue(initial)
  }, [open, initial])
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={label}
              onMouseDown={(e) => e.preventDefault()}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg text-admin-muted hover:bg-admin-subtle hover:text-admin-text [&_svg]:size-4",
                active && "bg-admin-brand-soft text-admin-brand"
              )}
            >
              {icon}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80 rounded-xl p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (onSubmit(value.trim()) !== false) setOpen(false)
          }}
          className="flex gap-2"
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="h-9 min-w-0 flex-1 rounded-lg border border-admin-border bg-admin-surface px-2.5 text-sm outline-none focus:border-admin-brand"
          />
          <button type="submit" className="h-9 rounded-lg bg-admin-brand px-3 text-sm font-medium text-admin-brand-fg">
            {submitLabel}
          </button>
        </form>
      </PopoverContent>
    </Popover>
  )
}

/* ------------------------------------------------------------------ Editor */

export interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  folder?: string
  minimal?: boolean
  onBusyChange?: (busy: boolean) => void
  ariaLabel?: string
}

export function RichTextEditor({ value, onChange, placeholder = "Start writing…", folder = "blog", minimal, onBusyChange, ariaLabel = "Content" }: RichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [painter, setPainter] = useState<readonly Mark[] | null>(null)
  const [uploads, setUploads] = useState(0)
  const rehosting = useRef(new Set<string>())

  useEffect(() => onBusyChange?.(uploads > 0), [uploads, onBusyChange])

  const uploadFiles = async (editor: Editor, files: File[], at?: number) => {
    const images = files.filter((f) => f.type.startsWith("image/"))
    for (const file of images) {
      const problem = validateFile(file, "image")
      if (problem) {
        toast.error("Image skipped", problem)
        continue
      }
      setUploads((n) => n + 1)
      const toastId = sonner.loading(`Uploading ${file.name}`, { description: "0%" })
      try {
        const asset = await uploadToCloudinary(file, {
          folder,
          onProgress: (p) => sonner.loading(`Uploading ${file.name}`, { id: toastId, description: `${p}%` }),
        })
        const node = { type: "figureImage", attrs: { src: asset.secureUrl, alt: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), width: 100, align: "center" } }
        if (at !== undefined) editor.chain().focus().insertContentAt(at, node).run()
        else editor.chain().focus().insertContent(node).run()
        sonner.success("Image added", { id: toastId, description: file.name })
      } catch (error) {
        sonner.error(`Couldn't upload ${file.name}`, { id: toastId, description: (error as Error).message })
      } finally {
        setUploads((n) => n - 1)
      }
    }
  }

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: "noopener noreferrer" } },
      }),
      TextStyleKit.configure({ lineHeight: false }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit.configure({ table: { resizable: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Youtube.configure({ nocookie: true, modestBranding: true, HTMLAttributes: { class: "rounded-xl" } }),
      Vimeo,
      FigureImage,
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: value,
    editorProps: {
      attributes: { class: "rich-content", "aria-label": ariaLabel, role: "textbox", "aria-multiline": "true" },
      // Keep the caret clear of the sticky admin header + sticky toolbar (refined at runtime below).
      scrollThreshold: { top: STICKY_FALLBACK, bottom: 64, left: 0, right: 0 },
      scrollMargin: { top: STICKY_FALLBACK, bottom: 64, left: 0, right: 0 },
      handleDrop: (view, event, _slice, moved) => {
        const files = Array.from((event as DragEvent).dataTransfer?.files ?? [])
        if (moved || !files.some((f) => f.type.startsWith("image/"))) return false
        event.preventDefault()
        const pos = view.posAtCoords({ left: (event as DragEvent).clientX, top: (event as DragEvent).clientY })?.pos
        if (editorRef.current) uploadFiles(editorRef.current, files, pos)
        return true
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? [])
        if (!files.some((f) => f.type.startsWith("image/"))) return false
        event.preventDefault()
        if (editorRef.current) uploadFiles(editorRef.current, files)
        return true
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? "" : editor.getHTML())
      rehostExternalImages(editor)
    },
  })

  const editorRef = useRef<Editor | null>(null)
  editorRef.current = editor

  // Keep external value changes (e.g. loading a post) in sync without clobbering typing.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    // Deferred: React node views (images) flushSync while rendering, which React forbids inside an effect.
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled || editor.isDestroyed) return
      const current = editor.isEmpty ? "" : editor.getHTML()
      if (value !== current && !editor.isFocused) editor.commands.setContent(value || "", { emitUpdate: false })
    })
    return () => {
      cancelled = true
    }
  }, [value, editor])

  // Measure the sticky toolbar (it wraps onto more rows on narrow screens) so typing never
  // scrolls the current line underneath it.
  const toolbarRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const toolbar = toolbarRef.current
    if (!editor || editor.isDestroyed || !toolbar) return
    const apply = () => {
      const top = ADMIN_TOPBAR + toolbar.offsetHeight + 16
      editor.setOptions({
        editorProps: {
          ...editor.options.editorProps,
          scrollThreshold: { top, bottom: 64, left: 0, right: 0 },
          scrollMargin: { top, bottom: 64, left: 0, right: 0 },
        },
      })
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(toolbar)

    // The browser's own caret scrolling ignores sticky elements, so after focus / typing / cursor
    // moves, nudge the page if the current line has ended up hidden behind the toolbar.
    let frame = 0
    const revealCaret = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (editor.isDestroyed || !editor.isFocused) return
        const caret = editor.view.coordsAtPos(editor.state.selection.head)
        const hiddenBelow = toolbar.getBoundingClientRect().bottom + 12
        if (caret.top < hiddenBelow) window.scrollBy({ top: caret.top - hiddenBelow - 24 })
      })
    }
    editor.on("focus", revealCaret)
    editor.on("selectionUpdate", revealCaret)
    editor.on("update", revealCaret)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      editor.off("focus", revealCaret)
      editor.off("selectionUpdate", revealCaret)
      editor.off("update", revealCaret)
    }
  }, [editor])

  /** Any image that isn't on Cloudinary (pasted from another site / data URI) is imported automatically. */
  function rehostExternalImages(ed: Editor) {
    const pending: string[] = []
    ed.state.doc.descendants((node) => {
      if (node.type.name === "figureImage" && node.attrs.src && !isCloudinary(node.attrs.src) && !rehosting.current.has(node.attrs.src)) {
        pending.push(node.attrs.src)
      }
    })
    for (const src of pending) {
      rehosting.current.add(src)
      setUploads((n) => n + 1)
      uploadRemoteToCloudinary(src, folder)
        .then((asset) => {
          const { tr } = ed.state
          ed.state.doc.descendants((node, pos) => {
            if (node.type.name === "figureImage" && node.attrs.src === src) tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: asset.secureUrl })
          })
          ed.view.dispatch(tr)
        })
        .catch(() => {
          toast.warning("An image couldn't be imported", "It was removed because only Cloudinary images can be stored.")
          const { tr } = ed.state
          const positions: number[] = []
          ed.state.doc.descendants((node, pos) => {
            if (node.type.name === "figureImage" && node.attrs.src === src) positions.push(pos)
          })
          positions.reverse().forEach((pos) => tr.delete(pos, pos + 1))
          ed.view.dispatch(tr)
        })
        .finally(() => {
          rehosting.current.delete(src)
          setUploads((n) => n - 1)
        })
    }
  }

  if (!editor) {
    return <div className="admin-skeleton h-[520px] rounded-2xl" aria-hidden />
  }

  const block = [1, 2, 3, 4, 5, 6].find((level) => editor.isActive("heading", { level }))
  const textStyle = editor.getAttributes("textStyle")
  const inTable = editor.isActive("table")
  const words = editor.storage.characterCount.words() as number
  const chars = editor.storage.characterCount.characters() as number

  const applyPainter = () => {
    if (!painter) {
      setPainter(editor.state.selection.$from.marks())
      toast.info("Format copied", "Select text to apply the same formatting.")
      return
    }
    const chain = editor.chain().focus().unsetAllMarks()
    painter.forEach((mark) => chain.setMark(mark.type.name, mark.attrs))
    chain.run()
    setPainter(null)
  }

  return (
    <div className="admin-editor overflow-clip rounded-2xl border border-admin-border bg-admin-surface focus-within:border-admin-brand/50 focus-within:ring-4 focus-within:ring-admin-brand/10">
      {/* Toolbar */}
      <div ref={toolbarRef} className="sticky top-[72px] z-20 border-b border-admin-border bg-admin-surface/95 backdrop-blur" role="toolbar" aria-label="Formatting">
        <div className="admin-scroll flex flex-wrap items-center gap-0.5 p-1.5">
          <ToolButton label="Undo" shortcut="Ctrl Z" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo2 />
          </ToolButton>
          <ToolButton label="Redo" shortcut="Ctrl Y" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo2 />
          </ToolButton>
          <Divider />
          <ToolSelect
            label="Text style"
            className="w-[7.5rem]"
            value={block ? `h${block}` : editor.isActive("codeBlock") ? "code" : "p"}
            onChange={(v) => {
              const chain = editor.chain().focus()
              if (v === "p") chain.setParagraph().run()
              else if (v === "code") chain.setCodeBlock().run()
              else chain.setHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6 }).run()
            }}
            options={[
              { label: "Paragraph", value: "p" },
              ...[1, 2, 3, 4, 5, 6].map((l) => ({ label: `Heading ${l}`, value: `h${l}` })),
              { label: "Code block", value: "code" },
            ]}
          />
          {!minimal && (
            <>
              <ToolSelect
                label="Font family"
                className="w-[6.5rem]"
                value={textStyle.fontFamily ?? ""}
                onChange={(v) => (v ? editor.chain().focus().setFontFamily(v).run() : editor.chain().focus().unsetFontFamily().run())}
                options={FONT_FAMILIES}
              />
              <ToolSelect
                label="Font size"
                className="w-[4.5rem]"
                value={textStyle.fontSize ?? ""}
                onChange={(v) => (v ? editor.chain().focus().setFontSize(v).run() : editor.chain().focus().unsetFontSize().run())}
                options={[{ label: "Size", value: "" }, ...FONT_SIZES.map((s) => ({ label: s.replace("px", ""), value: s }))]}
              />
            </>
          )}
          <Divider />
          <ToolButton label="Bold" shortcut="Ctrl B" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold />
          </ToolButton>
          <ToolButton label="Italic" shortcut="Ctrl I" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic />
          </ToolButton>
          <ToolButton label="Underline" shortcut="Ctrl U" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon />
          </ToolButton>
          <ToolButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough />
          </ToolButton>
          <ToolButton label="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code />
          </ToolButton>
          <ColorPopover
            label="Text colour"
            icon={<Baseline />}
            colors={COLORS}
            current={textStyle.color}
            onPick={(c) => editor.chain().focus().setColor(c).run()}
            onClear={() => editor.chain().focus().unsetColor().run()}
          />
          <ColorPopover
            label="Highlight"
            icon={<Highlighter />}
            colors={HIGHLIGHTS}
            current={editor.getAttributes("highlight").color}
            onPick={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
            onClear={() => editor.chain().focus().unsetHighlight().run()}
          />
          <Divider />
          {([
            ["left", AlignLeft],
            ["center", AlignCenter],
            ["right", AlignRight],
            ["justify", AlignJustify],
          ] as const).map(([align, Icon]) => (
            <ToolButton key={align} label={`Align ${align}`} active={editor.isActive({ textAlign: align })} onClick={() => editor.chain().focus().setTextAlign(align).run()}>
              <Icon />
            </ToolButton>
          ))}
          <Divider />
          <ToolButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List />
          </ToolButton>
          <ToolButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered />
          </ToolButton>
          <ToolButton label="Checklist" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
            <ListChecks />
          </ToolButton>
          <ToolButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote />
          </ToolButton>
          <ToolButton label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code2 />
          </ToolButton>
          <ToolButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus />
          </ToolButton>
          <Divider />
          <UrlPopover
            label="Link"
            icon={<Link2 />}
            active={editor.isActive("link")}
            placeholder="https://example.com or /about"
            initial={editor.getAttributes("link").href ?? ""}
            onSubmit={(href) => {
              if (!href) {
                editor.chain().focus().extendMarkRange("link").unsetLink().run()
                return
              }
              if (!/^(https?:\/\/|\/|mailto:|tel:|#)/.test(href)) href = `https://${href}`
              if (editor.state.selection.empty && !editor.isActive("link")) {
                editor.chain().focus().insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).run()
              } else {
                editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
              }
            }}
          />
          {editor.isActive("link") && (
            <ToolButton label="Remove link" onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}>
              <Link2Off />
            </ToolButton>
          )}
          <ToolButton label="Upload image" onClick={() => fileRef.current?.click()}>
            <ImagePlus />
          </ToolButton>
          <ToolButton label="Insert from media library" onClick={() => setPickerOpen(true)}>
            <Library />
          </ToolButton>
          {!minimal && (
            <>
              <UrlPopover
                label="Embed YouTube or Vimeo video"
                icon={<Video />}
                placeholder="Paste a YouTube or Vimeo link"
                submitLabel="Embed"
                onSubmit={(url) => {
                  if (getVimeoEmbedUrl(url)) return void editor.chain().focus().setVimeoVideo({ src: url }).run()
                  if (editor.chain().focus().setYoutubeVideo({ src: url }).run()) return
                  toast.error("Unsupported video link", "Paste a youtube.com, youtu.be or vimeo.com URL.")
                  return false
                }}
              />
              <ToolButton label="Insert table" active={inTable} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                <TableIcon />
              </ToolButton>
            </>
          )}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button type="button" aria-label="Emoji" onMouseDown={(e) => e.preventDefault()} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-admin-muted hover:bg-admin-subtle hover:text-admin-text [&_svg]:size-4">
                    <Smile />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Emoji</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-auto rounded-xl p-3" onOpenAutoFocus={(e) => e.preventDefault()}>
              <EmojiPicker onSelect={(emoji) => editor.chain().focus().insertContent(emoji).run()} />
            </PopoverContent>
          </Popover>
          <Divider />
          <ToolButton label={painter ? "Apply copied formatting" : "Copy formatting"} active={!!painter} onClick={applyPainter}>
            <Paintbrush />
          </ToolButton>
          <ToolButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
            <Eraser />
          </ToolButton>
        </div>

        {inTable && (
          <div className="flex flex-wrap items-center gap-1 border-t border-admin-border bg-admin-surface-2 px-2 py-1 text-xs admin-rise">
            <span className="mr-1 font-semibold text-admin-muted">Table:</span>
            {[
              ["+ Row above", () => editor.chain().focus().addRowBefore().run()],
              ["+ Row below", () => editor.chain().focus().addRowAfter().run()],
              ["+ Column left", () => editor.chain().focus().addColumnBefore().run()],
              ["+ Column right", () => editor.chain().focus().addColumnAfter().run()],
              ["Delete row", () => editor.chain().focus().deleteRow().run()],
              ["Delete column", () => editor.chain().focus().deleteColumn().run()],
              ["Toggle header", () => editor.chain().focus().toggleHeaderRow().run()],
              ["Merge / split", () => editor.chain().focus().mergeOrSplit().run()],
            ].map(([label, action]) => (
              <button key={label as string} type="button" onClick={action as () => void} className="rounded-md px-2 py-1 font-medium text-admin-text hover:bg-admin-surface">
                {label as string}
              </button>
            ))}
            <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 font-medium text-admin-danger hover:bg-admin-danger-soft">
              <Trash2 className="size-3.5" /> Delete table
            </button>
          </div>
        )}
      </div>

      <div className="px-5 py-5 sm:px-8 sm:py-6">
        <EditorContent editor={editor} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-admin-border bg-admin-surface-2 px-4 py-2 text-xs text-admin-muted">
        <span className="flex items-center gap-2">
          <Upload className="size-3.5" /> Drag & drop or paste images · they're uploaded to Cloudinary automatically
          {uploads > 0 && <span className="font-semibold text-admin-brand">· Uploading {uploads}…</span>}
        </span>
        <span className="tabular-nums">
          {words.toLocaleString()} words · {chars.toLocaleString()} characters · ~{Math.max(1, Math.round(words / 220))} min read
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          uploadFiles(editor, Array.from(e.target.files ?? []))
          e.target.value = ""
        }}
      />
      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(asset) => editor.chain().focus().setFigureImage({ src: asset.secureUrl, alt: asset.displayName }).run()}
      />
    </div>
  )
}

export default RichTextEditor
