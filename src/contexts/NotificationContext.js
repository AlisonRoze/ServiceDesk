'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import NotificationModal from '@/components/ui/NotificationModal/NotificationModal'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState({
    isOpen: false,
    message: '',
    type: 'error' // error, success, info, warning
  })

  const showNotification = useCallback((message, type = 'error') => {
    setNotification({
      isOpen: true,
      message,
      type
    })
  }, [])

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      isOpen: false
    }))
  }, [])

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      <NotificationModal
        message={notification.message}
        isOpen={notification.isOpen}
        onClose={hideNotification}
        type={notification.type}
      />
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

