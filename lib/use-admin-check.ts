'use client'

import { useEffect, useState } from 'react'

export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [shouldEdit, setShouldEdit] = useState(false)

  useEffect(() => {
    // Simple admin check - in production, this would check actual authentication
    const checkAdminStatus = () => {
      // Check if we're in development mode or if admin mode is enabled
      const isDev = process.env.NODE_ENV === 'development'
      const adminMode = localStorage.getItem('admin-mode') === 'true'
      const urlParams = new URLSearchParams(window.location.search)
      const adminParam = urlParams.get('admin') === 'true'
      const editParam = urlParams.get('edit') === 'true'

      console.log('Admin check:', { isDev, adminMode, adminParam, editParam, url: window.location.href })

      // Enable admin mode if any of these conditions are met
      const adminStatus = isDev || adminMode || adminParam
      setIsAdmin(adminStatus)
      setShouldEdit(adminStatus && editParam)
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
    shouldEdit,
    enableAdminMode,
    disableAdminMode,
  }
}