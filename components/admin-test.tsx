"use client"

import { useEffect, useState } from 'react'
import { useAdminCheck } from '@/lib/use-admin-check'

export function AdminTest() {
  const { isAdmin, enableAdminMode, disableAdminMode } = useAdminCheck()
  const [adminStatus, setAdminStatus] = useState<string>('checking...')

  useEffect(() => {
    setAdminStatus(isAdmin ? 'Admin mode ENABLED' : 'Admin mode DISABLED')
  }, [isAdmin])

  return (
    <div className="fixed top-20 left-4 z-50 bg-white p-4 rounded-lg shadow-lg border">
      <h3 className="font-bold mb-2">Admin Status Test</h3>
      <p className="text-sm mb-2">{adminStatus}</p>
      <div className="flex gap-2">
        <button 
          onClick={enableAdminMode}
          className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
        >
          Enable Admin
        </button>
        <button 
          onClick={disableAdminMode}
          className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
        >
          Disable Admin
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Current URL: {typeof window !== 'undefined' ? window.location.href : 'loading...'}
      </p>
    </div>
  )
}