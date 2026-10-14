"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"
import { AlertTriangle, Info } from "lucide-react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ConfirmOptions {
  title: string
  description?: React.ReactNode
  confirmText?: string
  cancelText?: string
  tone?: "danger" | "default"
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/**
 * Promise-based confirmation dialog:
 *   if (await confirm({ title: "Delete post?", tone: "danger" })) { … }
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<(value: boolean) => void>(undefined)

  const confirm = useCallback<ConfirmFn>((next) => {
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = (value: boolean) => {
    resolver.current?.(value)
    resolver.current = undefined
    setOptions(null)
  }

  const danger = options?.tone !== "default"

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={!!options} onOpenChange={(open) => !open && close(false)}>
        <AlertDialogContent className="rounded-2xl border-admin-border sm:max-w-md">
          <AlertDialogHeader className="sm:flex-row sm:items-start sm:gap-4">
            <span
              className={cn(
                "mx-auto flex size-11 shrink-0 items-center justify-center rounded-full sm:mx-0",
                danger ? "bg-admin-danger-soft text-admin-danger" : "bg-admin-brand-soft text-admin-brand"
              )}
            >
              {danger ? <AlertTriangle className="size-5" /> : <Info className="size-5" />}
            </span>
            <div className="space-y-1.5">
              <AlertDialogTitle>{options?.title}</AlertDialogTitle>
              {options?.description && <AlertDialogDescription>{options.description}</AlertDialogDescription>}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{options?.cancelText ?? "Cancel"}</AlertDialogCancel>
            <Button
              className={cn("rounded-xl", danger && "bg-admin-danger text-white hover:bg-admin-danger/90")}
              onClick={() => close(true)}
            >
              {options?.confirmText ?? (danger ? "Delete" : "Confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider")
  return ctx
}
