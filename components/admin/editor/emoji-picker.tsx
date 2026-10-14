"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

const EMOJI: Record<string, string[]> = {
  Smileys: "😀 😃 😄 😁 😊 🙂 😇 🥰 😍 🤩 😘 😋 😎 🤗 🤔 😌 😴 🥹 😢 😭 😤 😮 😱 🥳 😅 😂 🤣 😉 🙃 😬".split(" "),
  Faith: "🙏 ✝️ ⛪ 🕊️ 📖 ✨ 🔥 🕯️ 👑 🌅 💒 🛐 ☦️ 🌟 💫 🌈 🎶 🎵 🙌 👐 💖 🤲 ⭐ 🌿 🍞 🍇 🐑 ⚓ 🗝️ 🏔️".split(" "),
  Hearts: "❤️ 🧡 💛 💚 💙 💜 🤍 🖤 🤎 💕 💞 💓 💗 💖 💘 💝 ❣️ 💟 💌 🫶".split(" "),
  Gestures: "👍 👎 👏 🙌 👋 🤝 ✌️ 🤞 👌 👉 👈 👆 👇 ☝️ ✋ 💪 🫡 🫂 🙋 🙇".split(" "),
  Nature: "🌸 🌺 🌻 🌷 🌹 🌼 🍀 🌳 🌴 🌊 ☀️ 🌤️ 🌧️ ⛅ 🌙 🌍 🦋 🐦 🕊️ 🌾".split(" "),
  Objects: "📣 📢 🎉 🎊 🎁 📅 📌 📍 📝 ✏️ 📚 📷 🎥 🎤 📺 💡 🔔 ✅ ❗ ❓ ➡️ ⬅️ ⬆️ ⬇️ 🔗 📧 📞 🏠 🌐 🕒".split(" "),
}

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [tab, setTab] = useState("Faith")
  return (
    <div className="w-72">
      <div className="admin-scroll mb-2 flex gap-1 overflow-x-auto border-b border-admin-border pb-2" role="tablist" aria-label="Emoji categories">
        {Object.keys(EMOJI).map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={cn(
              "shrink-0 rounded-lg px-2 py-1 text-xs font-medium",
              tab === name ? "bg-admin-brand-soft text-admin-brand" : "text-admin-muted hover:bg-admin-subtle"
            )}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0.5" role="tabpanel">
        {EMOJI[tab].map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            type="button"
            onClick={() => onSelect(emoji)}
            className="flex size-8 items-center justify-center rounded-lg text-lg transition hover:scale-125 hover:bg-admin-subtle"
            aria-label={`Insert ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
