/**
 * Structured JSON logger. Every line is a single JSON object so it can be shipped to any
 * log drain (Vercel, Datadog, Logtail, CloudWatch…) without extra parsing.
 */

type Level = "debug" | "info" | "warn" | "error"

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }
const minLevel = LEVELS[(process.env.LOG_LEVEL as Level) || (process.env.NODE_ENV === "production" ? "info" : "debug")] ?? 20

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack?.split("\n").slice(0, 6).join("\n") }
  }
  return { message: String(error) }
}

function write(level: Level, message: string, context: Record<string, unknown> = {}) {
  if (LEVELS[level] < minLevel) return
  const entry: Record<string, unknown> = { ts: new Date().toISOString(), level, msg: message }
  for (const [key, value] of Object.entries(context)) {
    entry[key] = key === "error" || value instanceof Error ? serializeError(value) : value
  }
  const line = JSON.stringify(entry)
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.log(line)
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => write("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => write("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => write("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => write("error", message, context),
}
