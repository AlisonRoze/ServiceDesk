'use client'

import { createContext, useContext, useMemo, useState } from 'react'

const NotificationsContext = createContext(null)

export function useNotifications() {
  return useContext(NotificationsContext)
}

export function NotificationsProvider({ children }) {
  // Mock notifications data
  const [notifications] = useState([
    {
      id: 'n1',
      text: 'Ваша заявка выполнена!',
      // 1 day 6 hours ago
      createdAt: new Date(Date.now() - (24 + 6) * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'n2',
      text: 'Ваша заявка отправлена на доработку.',
      // 5 days 6 hours ago
      createdAt: new Date(Date.now() - (5 * 24 + 6) * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'n3',
      text: 'Ваша заявка отправлена на доработку.',
      // 5 days 6 hours ago
      createdAt: new Date(Date.now() - (5 * 24 + 6) * 60 * 60 * 1000).toISOString(),
    },
  ])

  const value = useMemo(() => {
    return {
      notifications,
      unreadCount: notifications.length,
    }
  }, [notifications])

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}


