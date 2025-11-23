'use client'

import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react'
import NotificationModal from '@/components/ui/NotificationModal/NotificationModal'

const NotificationsContext = createContext(null)

// Базовый URL для Django API
const API_BASE_URL = 'http://127.0.0.1:8000'

export function useNotifications() {
  return useContext(NotificationsContext)
}

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const [notification, setNotification] = useState({
    isOpen: false,
    message: '',
    type: 'error'
  })

  // Загрузка уведомлений с сервера
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Получаем user_id из localStorage
        const userData = localStorage.getItem('user')
        if (!userData) {
          setIsLoading(false)
          return
        }

        const user = JSON.parse(userData)
        if (!user || !user.id) {
          setIsLoading(false)
          return
        }

        const response = await fetch(`${API_BASE_URL}/api/notifications/${user.id}/`)
        
        if (!response.ok) {
          throw new Error('Ошибка при загрузке уведомлений')
        }

        const data = await response.json()
        
        if (data.success && data.notifications) {
          setNotifications(data.notifications)
        } else {
          setNotifications([])
        }
      } catch (error) {
        console.error('Ошибка при загрузке уведомлений:', error)
        setNotifications([])
      } finally {
        setIsLoading(false)
      }
    }

    loadNotifications()

    // Обновляем уведомления каждые 30 секунд
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

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

  const value = useMemo(() => {
    return {
      notifications,
      unreadCount: notifications.length,
      isLoading,
      showNotification,
      hideNotification
    }
  }, [notifications, isLoading, showNotification, hideNotification])

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <NotificationModal
        message={notification.message}
        isOpen={notification.isOpen}
        onClose={hideNotification}
        type={notification.type}
      />
    </NotificationsContext.Provider>
  )
}

