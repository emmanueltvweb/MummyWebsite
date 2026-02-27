'use client'

import { useEffect, useState } from 'react'

export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simple admin check - in production, this would check actual authentication
    const checkAdminStatus = () => {
      // Check if we're in development mode or if admin mode is enabled
      const isDev = process.env.NODE_ENV === 'development'
      const adminMode = localStorage.getItem('admin-mode') === 'true'
      const urlParams = new URLSearchParams(window.location.search)
      const adminParam = urlParams.get('admin') === 'true'

      console.log('Admin check:', { isDev, adminMode, adminParam, url: window.location.href })

      // Enable admin mode if any of these conditions are met
      setIsAdmin(isDev || adminMode || adminParam)
      setIsLoading(false)
    }

    checkAdminStatus()
  }, [])

  const enableAdminMode = () => {
    localStorage.setItem('admin-mode', 'true')
    setIsAdmin(true)
  }

  const disableAdminMode = () => {
    localStorage.removeItem('admin-mode')
    setIsAdmin(false)
  }

  return {
    isAdmin,
    isLoading,
    enableAdminMode,
    disableAdminMode,
  }
}