'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.scss'
import ArchiveRequestCard from '@/components/ui/ArchiveRequestCard/ArchiveRequestCard'
import { useUserAuth } from '@/context/UserAuthContext'
import RequestViewModal from '@/components/ui/RequestViewModal/RequestViewModal'

// Базовый URL для Django API
const API_BASE_URL = 'http://127.0.0.1:8000'

const periodOptions = [
  { value: '', label: 'Период' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'year', label: 'Год' },
]

const regionOptions = [
  { value: '', label: 'Регион' },
  // Здесь можно добавить динамические опции из API
]

const cityOptions = [
  { value: '', label: 'Город' },
  // Здесь можно добавить динамические опции из API
]

const officeOptions = [
  { value: '', label: 'Офис' },
  // Здесь можно добавить динамические опции из API
]

export default function ArchivePage() {
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  // Фильтры
  const [period, setPeriod] = useState('')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [office, setOffice] = useState('')
  
  // Состояния открытия выпадающих меню
  const [periodOpen, setPeriodOpen] = useState(false)
  const [regionOpen, setRegionOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [officeOpen, setOfficeOpen] = useState(false)
  
  // Refs для обработки кликов вне меню
  const periodRef = useRef(null)
  const regionRef = useRef(null)
  const cityRef = useRef(null)
  const officeRef = useRef(null)
  
  const { userRole, user } = useUserAuth()
  const router = useRouter()

  // Обработка кликов вне выпадающих меню
  useEffect(() => {
    function handleClickOutside(event) {
      if (periodRef.current && !periodRef.current.contains(event.target)) {
        setPeriodOpen(false)
      }
      if (regionRef.current && !regionRef.current.contains(event.target)) {
        setRegionOpen(false)
      }
      if (cityRef.current && !cityRef.current.contains(event.target)) {
        setCityOpen(false)
      }
      if (officeRef.current && !officeRef.current.contains(event.target)) {
        setOfficeOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Загрузка архивных заявок с сервера
  useEffect(() => {
    const loadArchiveRequests = async () => {
      if (!user || !user.id) {
        setIsLoading(false)
        return
      }

      try {
        // Фильтруем только завершенные заявки (архив)
        const response = await fetch(`${API_BASE_URL}/api/requests/${user.id}/`)
        
        if (!response.ok) {
          throw new Error('Ошибка при загрузке заявок')
        }

        const data = await response.json()
        
        if (data.success && data.requests) {
          // Фильтруем только завершенные заявки
          const completedRequests = data.requests.filter(req => req.status === 'completed')
          
          // Применяем фильтры
          let filtered = completedRequests
          
          // Здесь можно добавить логику фильтрации по периоду, региону, городу, офису
          // Пока просто показываем все завершенные заявки
          
          setRequests(filtered)
          setHasMore(false) // Пока без пагинации
        } else {
          setRequests([])
        }
      } catch (error) {
        console.error('Ошибка при загрузке архивных заявок:', error)
        setRequests([])
      } finally {
        setIsLoading(false)
      }
    }

    loadArchiveRequests()
  }, [user, period, region, city, office])

  const handleRequestClick = (request) => {
    setSelectedRequest(request)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRequest(null)
  }

  const handleLoadMore = () => {
    // Логика загрузки дополнительных элементов
    setPage(prev => prev + 1)
    // Здесь можно добавить загрузку следующей страницы
  }

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка архива...</div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.filtersContainer}>
        <div className={styles.filtersRow}>
          <div 
            ref={periodRef}
            className={`${styles.dropdown} ${periodOpen ? styles.open : ''}`}
          >
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={() => setPeriodOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={periodOpen}
            >
              {periodOptions.find(o => o.value === period)?.label || 'Период'}
            </button>
            {periodOpen && (
              <ul className={styles.dropdownMenu} role="listbox">
                {periodOptions.map(opt => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === period}
                    className={`${styles.dropdownItem} ${opt.value === period ? styles.active : ''}`}
                    onClick={() => {
                      setPeriod(opt.value)
                      setPeriodOpen(false)
                    }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div 
            ref={regionRef}
            className={`${styles.dropdown} ${regionOpen ? styles.open : ''}`}
          >
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={() => setRegionOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={regionOpen}
            >
              {regionOptions.find(o => o.value === region)?.label || 'Регион'}
            </button>
            {regionOpen && (
              <ul className={styles.dropdownMenu} role="listbox">
                {regionOptions.map(opt => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === region}
                    className={`${styles.dropdownItem} ${opt.value === region ? styles.active : ''}`}
                    onClick={() => {
                      setRegion(opt.value)
                      setRegionOpen(false)
                    }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div 
            ref={cityRef}
            className={`${styles.dropdown} ${cityOpen ? styles.open : ''}`}
          >
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={() => setCityOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={cityOpen}
            >
              {cityOptions.find(o => o.value === city)?.label || 'Город'}
            </button>
            {cityOpen && (
              <ul className={styles.dropdownMenu} role="listbox">
                {cityOptions.map(opt => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === city}
                    className={`${styles.dropdownItem} ${opt.value === city ? styles.active : ''}`}
                    onClick={() => {
                      setCity(opt.value)
                      setCityOpen(false)
                    }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className={styles.filtersRow}>
          <div 
            ref={officeRef}
            className={`${styles.dropdown} ${officeOpen ? styles.open : ''}`}
          >
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={() => setOfficeOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={officeOpen}
            >
              {officeOptions.find(o => o.value === office)?.label || 'Офис'}
            </button>
            {officeOpen && (
              <ul className={styles.dropdownMenu} role="listbox">
                {officeOptions.map(opt => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === office}
                    className={`${styles.dropdownItem} ${opt.value === office ? styles.active : ''}`}
                    onClick={() => {
                      setOffice(opt.value)
                      setOfficeOpen(false)
                    }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className={styles.archiveList}>
        {requests.length === 0 ? (
          <div className={styles.emptyState}>Нет архивных заявок</div>
        ) : (
          requests.map((request) => (
            <ArchiveRequestCard
              key={request.id}
              request={request}
              onClick={handleRequestClick}
            />
          ))
        )}
      </div>

      {requests.length > 0 && hasMore && (
        <div className={styles.loadMoreContainer}>
          <button className={styles.loadMoreButton} onClick={handleLoadMore}>
            ЕЩЕ
          </button>
        </div>
      )}

      <RequestViewModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}

