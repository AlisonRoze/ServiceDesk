'use client'

import { useState } from 'react'
import styles from './page.module.scss'
import RequestCard from '@/components/ui/RequestCard/RequestCard'

// Мок-данные заявок
const mockRequests = [
  {
    id: 'r1',
    priority: 'medium',
    location: '2 этаж, 210 кабинет, 10 стол',
    issueType: 'furniture',
    status: 'revision',
    createdAt: new Date('2024-09-20T18:30:00').toISOString(),
  },
  {
    id: 'r2',
    priority: 'low',
    location: '2 этаж, 210 кабинет, 10 стол',
    issueType: 'furniture',
    status: 'revision',
    createdAt: new Date('2024-09-20T18:30:00').toISOString(),
  },
  {
    id: 'r3',
    priority: 'low',
    location: '2 этаж, 210 кабинет, 10 стол',
    issueType: 'furniture',
    status: 'new',
    createdAt: new Date('2024-09-20T18:30:00').toISOString(),
  },
  {
    id: 'r4',
    priority: 'high',
    location: '3 этаж, 301 кабинет, 5 стол',
    issueType: 'hardware',
    status: 'in_progress',
    createdAt: new Date('2024-09-19T14:20:00').toISOString(),
  },
  {
    id: 'r5',
    priority: 'medium',
    location: '1 этаж, 105 кабинет, 15 стол',
    issueType: 'software',
    status: 'new',
    createdAt: new Date('2024-09-21T10:15:00').toISOString(),
  },
  {
    id: 'r6',
    priority: 'urgent',
    location: '2 этаж, 205 кабинет, 8 стол',
    issueType: 'network',
    status: 'in_progress',
    createdAt: new Date('2024-09-21T09:00:00').toISOString(),
  },
  {
    id: 'r7',
    priority: 'low',
    location: '1 этаж, 105 кабинет, 12 стол',
    issueType: 'furniture',
    status: 'completed',
    createdAt: new Date('2024-09-18T15:30:00').toISOString(),
  },
  {
    id: 'r8',
    priority: 'medium',
    location: '3 этаж, 310 кабинет, 3 стол',
    issueType: 'hardware',
    status: 'completed',
    createdAt: new Date('2024-09-17T11:20:00').toISOString(),
  },
]

const statusConfig = {
  revision: { label: 'На доработке', key: 'revision' },
  new: { label: 'Активные', key: 'new' },
  in_progress: { label: 'В работе', key: 'in_progress' },
  completed: { label: 'Выполненные', key: 'completed' },
}

export default function RequestsPage() {
  const [requests, setRequests] = useState(mockRequests)
  const [draggedRequest, setDraggedRequest] = useState(null)
  const [draggedOverColumn, setDraggedOverColumn] = useState(null)

  const handleDragStart = (e, request) => {
    setDraggedRequest(request)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', request.id)
  }

  const handleDragOver = (e, status) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDraggedOverColumn(status)
  }

  const handleDragLeave = () => {
    setDraggedOverColumn(null)
  }

  const handleDrop = (e, targetStatus) => {
    e.preventDefault()
    setDraggedOverColumn(null)

    if (draggedRequest && draggedRequest.status !== targetStatus) {
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === draggedRequest.id ? { ...req, status: targetStatus } : req
        )
      )
    }

    setDraggedRequest(null)
  }

  const handleDragEnd = () => {
    setDraggedRequest(null)
    setDraggedOverColumn(null)
  }

  const getRequestsByStatus = (status) => {
    return requests.filter((req) => req.status === status)
  }

  return (
    <div className={styles.dashboard}>
      {Object.values(statusConfig).map((config) => {
        const columnRequests = getRequestsByStatus(config.key)
        const isDraggedOver = draggedOverColumn === config.key

        return (
          <div
            key={config.key}
            className={`${styles.column} ${isDraggedOver ? styles.dragOver : ''}`}
            onDragOver={(e) => handleDragOver(e, config.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, config.key)}
          >
            <div className={styles.columnHeader}>
              <h2 className={styles.columnTitle}>{config.label}</h2>
            </div>
            <div className={styles.columnContent}>
              {columnRequests.length === 0 ? (
                <div className={styles.emptyColumn}>Нет заявок</div>
              ) : (
                columnRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    isDragging={draggedRequest?.id === request.id}
                    onDragStart={(e) => handleDragStart(e, request)}
                    onDragEnd={handleDragEnd}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

