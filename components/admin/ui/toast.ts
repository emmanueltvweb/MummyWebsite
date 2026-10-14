"use client"

import { toast as sonner } from "sonner"

import { errorMessage } from "@/lib/admin/api-client"

/** Thin wrapper so every admin notification looks and behaves the same. */
export const toast = {
  success: (title: string, description?: string) => sonner.success(title, { description }),
  error: (title: string, description?: string) => sonner.error(title, { description, duration: 6000 }),
  warning: (title: string, description?: string) => sonner.warning(title, { description }),
  info: (title: string, description?: string) => sonner.info(title, { description }),
  fromError: (error: unknown, title = "Something went wrong") => sonner.error(title, { description: errorMessage(error), duration: 6000 }),
  /** Shows a loading toast that resolves into success/error. */
  promise: <T,>(promise: Promise<T>, messages: { loading: string; success: string | ((value: T) => string); error?: string }) =>
    sonner.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: (err: unknown) => messages.error ?? errorMessage(err),
    }),
}
