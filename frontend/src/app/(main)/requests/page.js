'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.scss'
import RequestCard from '@/components/ui/RequestCard/RequestCard'
import { useUserAuth } from '@/context/UserAuthContext'
import RequestViewModal from '@/components/ui/RequestViewModal/RequestViewModal'
import Image from 'next/image'

// Базовый URL для Django API
const API_BASE_URL = 'http://127.0.0.1:8000'


// Конфигурация колонок для разных ролей
const statusConfigs = {
  employee: {
    revision: { label: 'На доработке', key: 'revision' },
    new: { label: 'Активные', key: 'new' },
    completed: { label: 'Выполненные', key: 'completed' },
  },
  aho: {
    new: { label: 'Новые', key: 'new' },
    in_progress: { label: 'В работе', key: 'in_progress' },
    completed: { label: 'Выполненные', key: 'completed' },
    awaiting_purchase: { label: 'Ожидают закупки', key: 'awaiting_purchase' },
  },
}

export default function RequestsPage() {
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedRequest, setDraggedRequest] = useState(null)
  const [draggedOverColumn, setDraggedOverColumn] = useState(null)
  const [filterType, setFilterType] = useState('my_requests')
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { userRole, user } = useUserAuth()
  const router = useRouter()

  const loadRequests = async () => {
    if (!user || !user.id) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/${user.id}/`)
      
      if (!response.ok) {
        throw new Error('Ошибка при загрузке заявок')
      }

      const data = await response.json()
      
      if (data.success && data.requests) {
        setRequests(data.requests)
      } else {
        setRequests([])
      }
    } catch (error) {
      console.error('Ошибка при загрузке заявок:', error)
      setRequests([])
    } finally {
      setIsLoading(false)
    }
  }

  // Загрузка заявок с сервера
  useEffect(() => {
    if (user && user.id) {
      loadRequests()
    }
  }, [user])

  const statusConfig = statusConfigs[userRole] || statusConfigs.employee

  const filterOptions = [
    { value: 'my_requests', label: 'Мои заявки' },
    { value: 'i_am_performer', label: 'Я исполнитель' },
  ]

  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false)
      }
    }

    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isFilterDropdownOpen])

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

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault()
    setDraggedOverColumn(null)

    if (draggedRequest && draggedRequest.status !== targetStatus) {
      // Оптимистичное обновление UI
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === draggedRequest.id ? { ...req, status: targetStatus } : req
        )
      )

      // Отправляем запрос на сервер для обновления статуса
      try {
        if (!user || !user.id) {
          console.error('Пользователь не найден')
          return
        }

        const response = await fetch(`${API_BASE_URL}/api/requests/${draggedRequest.id}/status/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            status: targetStatus
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          // Откатываем изменения при ошибке
          setRequests((prevRequests) =>
            prevRequests.map((req) =>
              req.id === draggedRequest.id ? { ...req, status: draggedRequest.status } : req
            )
          )
          console.error('Ошибка при обновлении статуса:', data.error)
        }
      } catch (error) {
        console.error('Ошибка при обновлении статуса заявки:', error)
        // Откатываем изменения при ошибке
        setRequests((prevRequests) =>
          prevRequests.map((req) =>
            req.id === draggedRequest.id ? { ...req, status: draggedRequest.status } : req
          )
        )
      }
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

  const handleArchiveClick = () => {
    router.push('/requests/archive')
  }

  const handleFilterChange = (value) => {
    setFilterType(value)
    setIsFilterDropdownOpen(false)
  }

  const handleRequestClick = (request) => {
    setSelectedRequest(request)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRequest(null)
    // Перезагружаем заявки после закрытия модального окна
    if (user && user.id) {
      setIsLoading(true)
      loadRequests()
    }
  }

  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка заявок...</div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.filtersContainer}>
        <button 
          className={styles.archiveButton}
          onClick={handleArchiveClick}
        >
          <Image 
            src="/assets/archive.svg" 
            alt="Архив" 
            width={20} 
            height={20}
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
          Архив
        </button>
        
        <div className={styles.filterDropdown} ref={dropdownRef}>
          <button
            className={styles.filterButton}
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
          >
            {filterOptions.find(opt => opt.value === filterType)?.label || 'Мои заявки'}
            <svg 
              className={`${styles.arrow} ${isFilterDropdownOpen ? styles.arrowOpen : ''}`}
              width="23" 
              height="13" 
              viewBox="0 0 23 13" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M9.98524 0.43934C10.571 -0.146447 11.5208 -0.146447 12.1066 0.43934L21.6525 9.98528C22.2383 10.5711 22.2383 11.5208 21.6525 12.1066C21.0667 12.6924 20.117 12.6924 19.5312 12.1066L11.0459 3.62132L2.56062 12.1066C1.97483 12.6924 1.02508 12.6924 0.439297 12.1066C-0.14649 11.5208 -0.14649 10.5711 0.439297 9.98528L9.98524 0.43934ZM11.0459 2.5H9.5459V1.5H11.0459H12.5459V2.5H11.0459Z" 
                fill="#121212"
              />
            </svg>
          </button>
          
          {isFilterDropdownOpen && (
            <div className={styles.dropdownMenu}>
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  className={`${styles.dropdownItem} ${filterType === option.value ? styles.active : ''}`}
                  onClick={() => handleFilterChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`${styles.dashboard} ${styles[userRole]}`}>
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
                    onClick={handleRequestClick}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
      </div>

      <RequestViewModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}

