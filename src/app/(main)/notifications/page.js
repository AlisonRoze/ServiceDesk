'use client'

import styles from './page.module.scss'
import { useNotifications } from '@/context/NotificationsContext'

function formatRelativeRu(dateIso) {
  const diffMs = Date.now() - new Date(dateIso).getTime()
  const totalMinutes = Math.max(0, Math.floor(diffMs / (60 * 1000)))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  const parts = []
  if (days > 0) parts.push(`${days} дн.`)
  if (hours > 0) parts.push(`${hours} час.`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} мин.`)

  return `${parts.join(' ')} назад`
}

export default function NotificationsPage() {
  const { notifications } = useNotifications() || { notifications: [] }

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {notifications.map((n, idx) => (
          <div key={n.id} className={styles.item}>
            <div className={styles.text}>{n.text}</div>
            <div className={styles.time}>{formatRelativeRu(n.createdAt)}</div>
            {idx < notifications.length - 1 && <div className={styles.separator} />}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className={styles.empty}>Уведомлений нет</div>
        )}
      </div>
    </div>
  )
}

