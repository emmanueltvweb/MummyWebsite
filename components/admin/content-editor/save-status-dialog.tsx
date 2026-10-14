'use client'

import { AlertCircle, Check, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

export type SaveDialogStatus = 'loading' | 'success' | 'info' | 'error'

interface SaveStatusDialogProps {
  open: boolean
  status: SaveDialogStatus
  message?: string
  onClose: () => void
}

export function SaveStatusDialog({
  open,
  status,
  message,
  onClose,
}: SaveStatusDialogProps) {
  const isSuccess = status === 'success'
  const isLoading = status === 'loading'
  const isError = status === 'error'
  const isInfo = status === 'info'

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !isLoading && onClose()}>
      <DialogContent
        showCloseButton={!isLoading}
        className="max-w-sm overflow-hidden border-0 bg-white px-8 py-10 text-center shadow-2xl sm:rounded-3xl"
      >
        <div className="flex flex-col items-center">
          <div
            className={`relative mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
              isLoading
                ? 'bg-blue-50'
                : isSuccess
                ? 'bg-emerald-50 animate-in zoom-in-75 duration-500'
                : isError
                ? 'bg-red-50 animate-in zoom-in-75 duration-500'
                : 'bg-sky-50 animate-in zoom-in-75 duration-500'
            }`}
          >
            {isSuccess && (
              <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
            )}
            {isLoading ? (
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            ) : isSuccess ? (
              <Check className="relative h-10 w-10 text-emerald-600 animate-in zoom-in-50 duration-300" strokeWidth={3} />
            ) : isError ? (
              <AlertCircle className="relative h-10 w-10 text-red-600" />
            ) : (
              <Check className="relative h-10 w-10 text-sky-600" strokeWidth={3} />
            )}
          </div>

          <DialogTitle className="text-2xl font-semibold tracking-tight text-gray-900">
            {isLoading
              ? 'Saving changes'
              : isSuccess
              ? 'Saved successfully'
              : isError
              ? 'Save failed'
              : 'Already up to date'}
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-xs text-base text-gray-600">
            {isLoading
              ? 'Please wait while we update your website content...'
              : message ||
                (isSuccess
                  ? 'Your website has been updated with the latest changes.'
                  : 'There was a problem saving your changes.')}
          </DialogDescription>

          {!isLoading && (
            <Button
              className={`mt-8 min-w-[140px] ${
                isSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : isError
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
              }`}
              onClick={onClose}
            >
              {isError ? 'Try again' : 'Done'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
