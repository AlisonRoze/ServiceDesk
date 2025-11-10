'use client'

import { NotificationProvider } from '@/contexts/NotificationContext'

export default function NotificationProviderWrapper({ children }) {
  return <NotificationProvider>{children}</NotificationProvider>
}

