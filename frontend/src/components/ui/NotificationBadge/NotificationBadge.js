'use client'

import { useState, useEffect } from 'react'
import styles from './NotificationBadge.module.scss'

export default function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications/unread-count')
        const data = await response.json()
        
        if (data.success) {
          setUnreadCount(data.count || 0)
        }
      } catch (error) {
        console.error('Ошибка при получении количества уведомлений:', error)
        setUnreadCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUnreadCount()

    // Опционально: обновлять счетчик каждые 30 секунд
    const interval = setInterval(fetchUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [])

  // Не показываем badge, если нет непрочитанных уведомлений или идет загрузка
  if (isLoading || unreadCount === 0) {
    return null
  }

  // Форматируем большие числа (например, 99+)
  const displayCount = unreadCount > 99 ? '99+' : unreadCount

  return (
    <span className={styles.notificationBadge}>
      {displayCount}
    </span>
  )
}

