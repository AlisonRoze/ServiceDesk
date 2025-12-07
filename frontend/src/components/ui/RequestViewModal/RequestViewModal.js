'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './RequestViewModal.module.scss'
import Image from 'next/image'
import { useUserAuth } from '@/context/UserAuthContext'

// Базовый URL для Django API
const API_BASE_URL = 'http://127.0.0.1:8000'

const priorityLabels = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  urgent: 'Критический',
}

const issueTypeLabels = {
  furniture: 'Мебель',
  hardware: 'Оборудование',
  software: 'ПО',
  network: 'Сеть',
  access: 'Доступ',
  other: 'Другое',
}

const priorityOptions = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'urgent', label: 'Критический' },
]

const issueTypeOptions = [
  { value: 'furniture', label: 'Мебель' },
  { value: 'hardware', label: 'Оборудование' },
  { value: 'software', label: 'ПО' },
  { value: 'network', label: 'Сеть' },
  { value: 'access', label: 'Доступ' },
  { value: 'other', label: 'Другое' },
]

export default function RequestViewModal({ request, isOpen, onClose }) {
  const modalRef = useRef(null)
  const issueTypeDropdownRef = useRef(null)
  const performerDropdownRef = useRef(null)
  const { userRole, user } = useUserAuth()
  const isAHO = userRole === 'aho'
  
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [issueTypeOpen, setIssueTypeOpen] = useState(false)
  const [performerOpen, setPerformerOpen] = useState(false)
  const [users, setUsers] = useState([])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        // Сохраняем данные перед закрытием для АХО
        if (isAHO && editedData && Object.keys(editedData).length > 0) {
          saveRequestData()
        }
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, isAHO, editedData])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        // Сохраняем данные перед закрытием для АХО
        if (isAHO && editedData && Object.keys(editedData).length > 0) {
          saveRequestData()
        }
        onClose()
      }
      if (issueTypeDropdownRef.current && !issueTypeDropdownRef.current.contains(e.target)) {
        setIssueTypeOpen(false)
      }
      if (performerDropdownRef.current && !performerDropdownRef.current.contains(e.target)) {
        setPerformerOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      // Сохраняем данные при размонтировании компонента для АХО
      if (isAHO && editedData && Object.keys(editedData).length > 0) {
        saveRequestData()
      }
    }
  }, [isOpen, onClose, isAHO, editedData])

  // Загрузка списка пользователей для выбора исполнителя (только АХО)
  useEffect(() => {
    const loadUsers = async () => {
      if (!isAHO || !isOpen) return
      
      try {
        // Запрашиваем только пользователей с ролью АХО
        const response = await fetch(`${API_BASE_URL}/api/users/?role=aho`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // Дополнительная фильтрация
            const ahoUsers = (data.users || []).filter(user => {
              const userRole = (user.role || '').toLowerCase()
              return userRole === 'aho' || userRole === 'ахо'
            })
            setUsers(ahoUsers)
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error)
        setUsers([])
      }
    }

    loadUsers()
  }, [isAHO, isOpen])

  // Инициализация данных для редактирования
  useEffect(() => {
    if (request && isOpen) {
      setEditedData({
        priority: request.priority || 'medium',
        issueType: request.issueType || 'other',
        address: request.address || request.location || '',
        employeeLocation: request.employeeLocation || '',
        locationDescription: request.locationDescription || request.location || '',
        problemDescription: request.problemDescription || '',
        performerId: request.performer?.id || '',
        expenses: request.expense ? [
          {
            name: (request.expense.name && request.expense.name !== 'Заявка') ? request.expense.name : '',
            amount: request.expense.amount ? String(request.expense.amount) : ''
          },
          { name: '', amount: '' },
          { name: '', amount: '' },
          { name: '', amount: '' }
        ] : [
          { name: '', amount: '' },
          { name: '', amount: '' },
          { name: '', amount: '' },
          { name: '', amount: '' }
        ],
        comment: request.comments && request.comments.length > 0 
          ? request.comments[request.comments.length - 1].content || '' 
          : '',
      })
      // Для АХО режим редактирования включен по умолчанию
      setIsEditing(isAHO)
    }
  }, [request, isOpen, isAHO])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Восстанавливаем исходные данные
    if (request) {
      setEditedData({
        priority: request.priority || 'medium',
        issueType: request.issueType || 'other',
        address: request.address || request.location || '',
        employeeLocation: request.employeeLocation || '',
        locationDescription: request.locationDescription || request.location || '',
        problemDescription: request.problemDescription || '',
      })
    }
  }

  const handleMarkRevision = async () => {
    if (!request || !isAHO || !user) return

    setIsUpdatingStatus(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/${request.id}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          status: 'revision'
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onClose()
        // Обновление списка заявок произойдет автоматически при закрытии модального окна
      } else {
        console.error('Ошибка при обновлении статуса:', data.error)
      }
    } catch (error) {
      console.error('Ошибка при обновлении статуса заявки:', error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleMarkCompleted = async () => {
    if (!request || !isAHO || !user) return

    setIsUpdatingStatus(true)
    try {
      // Сначала сохраняем данные заявки
      await saveRequestData()
      
      // Затем обновляем статус
      const response = await fetch(`${API_BASE_URL}/api/requests/${request.id}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          status: 'completed'
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onClose()
        // Обновление списка заявок произойдет автоматически при закрытии модального окна
      } else {
        console.error('Ошибка при обновлении статуса:', data.error)
      }
    } catch (error) {
      console.error('Ошибка при обновлении статуса заявки:', error)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const saveRequestData = async () => {
    if (!request || !isAHO || !user || !editedData) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/${request.id}/update/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          priority: editedData.priority,
          issueType: editedData.issueType,
          address: editedData.address,
          locationDescription: editedData.locationDescription,
          employeeLocation: editedData.employeeLocation,
          problemDescription: editedData.problemDescription,
          performerId: editedData.performerId,
          expenses: editedData.expenses,
          comment: editedData.comment,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        console.error('Ошибка при сохранении данных:', data.error)
      }
    } catch (error) {
      console.error('Ошибка при сохранении данных заявки:', error)
    }
  }

  const handleChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }))
  }

  const handlePriorityClick = () => {
    if (!isAHO || !isEditing) return
    
    const currentIndex = priorityOptions.findIndex(opt => opt.value === editedData.priority)
    const nextIndex = (currentIndex + 1) % priorityOptions.length
    handleChange('priority', priorityOptions[nextIndex].value)
  }

  const formatPerformerName = (performer) => {
    if (!performer) return 'Не назначен'
    const firstName = performer.first_name || ''
    const lastName = performer.last_name || ''
    const middleName = performer.middle_name || ''
    
    if (lastName && firstName) {
      const initials = middleName ? `${middleName.charAt(0)}.` : ''
      return `${lastName} ${firstName.charAt(0)}. ${initials}`.trim()
    }
    return performer.username || 'Не назначен'
  }

  if (!isOpen || !request) return null

  const priorityLabel = priorityLabels[editedData.priority || request.priority] || request.priority
  const issueTypeLabel = issueTypeLabels[editedData.issueType || request.issueType] || request.issueType

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.header}>
          <h2 className={styles.title}>Заявка</h2>
          <button 
            className={styles.closeButton} 
            onClick={() => {
              // Сохраняем данные перед закрытием для АХО
              if (isAHO && editedData && Object.keys(editedData).length > 0) {
                saveRequestData()
              }
              onClose()
            }} 
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          {/* Приоритет */}
          <div className={`${styles.fieldGroup} ${styles.priorityFieldGroup}`}>
            <div 
              className={`${styles.priorityField} ${styles[editedData.priority || request.priority]}`}
              onClick={isAHO && isEditing ? handlePriorityClick : undefined}
              style={isAHO && isEditing ? { cursor: 'pointer' } : {}}
            >
              {priorityLabel}
            </div>
          </div>

          {/* Адрес */}
          <div className={styles.fieldGroup}>
            {(() => {
              const addressValue = isAHO && isEditing ? editedData.address : (request.address || request.location)
              return addressValue ? (
                <div className={styles.readonlyField}>
                  <label className={styles.label}>Адрес</label>
                  {isAHO && isEditing ? (
                    <input
                      type="text"
                      className={styles.input}
                      value={editedData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Адрес"
                    />
                  ) : (
                    <div className={styles.value}>{addressValue}</div>
                  )}
                </div>
              ) : (
                <div className={styles.readonlyField}>
                  {isAHO && isEditing ? (
                    <>
                      <label className={styles.label}>Адрес</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={editedData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="Адрес"
                      />
                    </>
                  ) : (
                    <div className={styles.placeholder}>Адрес</div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Место сотрудника */}
          <div className={styles.fieldGroup}>
            {(() => {
              const employeeLocationValue = isAHO && isEditing ? editedData.employeeLocation : request.employeeLocation
              return employeeLocationValue ? (
                <div className={styles.readonlyField}>
                  <label className={styles.label}>Место сотрудника</label>
                  {isAHO && isEditing ? (
                    <input
                      type="text"
                      className={styles.input}
                      value={editedData.employeeLocation}
                      onChange={(e) => handleChange('employeeLocation', e.target.value)}
                      placeholder="Место сотрудника"
                    />
                  ) : (
                    <div className={styles.value}>{employeeLocationValue}</div>
                  )}
                </div>
              ) : (
                <div className={styles.readonlyField}>
                  {isAHO && isEditing ? (
                    <>
                      <label className={styles.label}>Место сотрудника</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={editedData.employeeLocation}
                        onChange={(e) => handleChange('employeeLocation', e.target.value)}
                        placeholder="Место сотрудника"
                      />
                    </>
                  ) : (
                    <div className={styles.placeholder}>Место сотрудника</div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Тип поломки */}
          <div className={styles.fieldGroup}>
            {(() => {
              const issueTypeValue = isAHO && isEditing 
                ? issueTypeLabels[editedData.issueType] || editedData.issueType
                : issueTypeLabel
              return issueTypeValue ? (
                <div className={styles.readonlyField}>
                  <label className={styles.label}>Тип поломки</label>
                  {isAHO && isEditing ? (
                    <div
                      ref={issueTypeDropdownRef}
                      className={`${styles.dropdown} ${issueTypeOpen ? styles.open : ''}`}
                    >
                      <button
                        type="button"
                        className={styles.dropdownButton}
                        onClick={() => setIssueTypeOpen((v) => !v)}
                        aria-haspopup="listbox"
                        aria-expanded={issueTypeOpen}
                      >
                        {issueTypeOptions.find(o => o.value === editedData.issueType)?.label || 'Тип поломки'}
                      </button>
                      {issueTypeOpen && (
                        <ul className={styles.dropdownMenu} role="listbox">
                          {issueTypeOptions.map(opt => (
                            <li
                              key={opt.value}
                              role="option"
                              aria-selected={opt.value === editedData.issueType}
                              className={`${styles.dropdownItem} ${opt.value === editedData.issueType ? styles.active : ''}`}
                              onClick={() => {
                                handleChange('issueType', opt.value)
                                setIssueTypeOpen(false)
                              }}
                            >
                              {opt.label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className={styles.value}>{issueTypeValue}</div>
                  )}
                </div>
              ) : (
                <div className={styles.readonlyField}>
                  {isAHO && isEditing ? (
                    <>
                      <label className={styles.label}>Тип поломки</label>
                      <div
                        ref={issueTypeDropdownRef}
                        className={`${styles.dropdown} ${issueTypeOpen ? styles.open : ''}`}
                      >
                        <button
                          type="button"
                          className={styles.dropdownButton}
                          onClick={() => setIssueTypeOpen((v) => !v)}
                          aria-haspopup="listbox"
                          aria-expanded={issueTypeOpen}
                        >
                          {issueTypeOptions.find(o => o.value === editedData.issueType)?.label || 'Тип поломки'}
                        </button>
                        {issueTypeOpen && (
                          <ul className={styles.dropdownMenu} role="listbox">
                            {issueTypeOptions.map(opt => (
                              <li
                                key={opt.value}
                                role="option"
                                aria-selected={opt.value === editedData.issueType}
                                className={`${styles.dropdownItem} ${opt.value === editedData.issueType ? styles.active : ''}`}
                                onClick={() => {
                                  handleChange('issueType', opt.value)
                                  setIssueTypeOpen(false)
                                }}
                              >
                                {opt.label}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className={styles.placeholder}>Тип поломки</div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Описание локации */}
          <div className={styles.fieldGroup}>
            {(() => {
              const locationValue = isAHO && isEditing 
                ? editedData.locationDescription 
                : (request.locationDescription || request.location)
              return locationValue ? (
                <div className={styles.readonlyField}>
                  <label className={styles.label}>Описание локации</label>
                  {isAHO && isEditing ? (
                    <input
                      type="text"
                      className={styles.input}
                      value={editedData.locationDescription}
                      onChange={(e) => handleChange('locationDescription', e.target.value)}
                      placeholder="Описание локации"
                    />
                  ) : (
                    <div className={styles.value}>{locationValue}</div>
                  )}
                </div>
              ) : (
                <div className={styles.readonlyField}>
                  {isAHO && isEditing ? (
                    <>
                      <label className={styles.label}>Описание локации</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={editedData.locationDescription}
                        onChange={(e) => handleChange('locationDescription', e.target.value)}
                        placeholder="Описание локации"
                      />
                    </>
                  ) : (
                    <div className={styles.placeholder}>Описание локации</div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Описание проблемы */}
          <div className={styles.fieldGroup}>
            {(() => {
              const problemDescriptionValue = isAHO && isEditing 
                ? editedData.problemDescription 
                : request.problemDescription
              return problemDescriptionValue ? (
                <div className={`${styles.readonlyField} ${styles.problemDescriptionField}`}>
                  <label className={styles.label}>Описание проблемы</label>
                  {isAHO && isEditing ? (
                    <textarea
                      className={styles.input}
                      value={editedData.problemDescription}
                      onChange={(e) => handleChange('problemDescription', e.target.value)}
                      placeholder="Описание проблемы"
                      rows={4}
                    />
                  ) : (
                    <div className={styles.value}>{problemDescriptionValue}</div>
                  )}
                </div>
              ) : (
                <div className={`${styles.readonlyField} ${styles.problemDescriptionField}`}>
                  {isAHO && isEditing ? (
                    <>
                      <label className={styles.label}>Описание проблемы</label>
                      <textarea
                        className={styles.input}
                        value={editedData.problemDescription}
                        onChange={(e) => handleChange('problemDescription', e.target.value)}
                        placeholder="Описание проблемы"
                        rows={4}
                      />
                    </>
                  ) : (
                    <div className={styles.placeholder}>Описание проблемы</div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Исполнитель - только для АХО */}
          {isAHO && (
            <div className={styles.fieldGroup}>
              {(() => {
                const performerValue = isEditing 
                  ? (users.find(u => u.id === editedData.performerId) 
                      ? formatPerformerName(users.find(u => u.id === editedData.performerId))
                      : (request.performer ? formatPerformerName(request.performer) : 'Не назначен'))
                  : (request.performer ? formatPerformerName(request.performer) : 'Не назначен')
                
                return performerValue ? (
                  <div className={styles.readonlyField}>
                    <label className={styles.label}>Исполнитель</label>
                    {isEditing ? (
                      <div
                        ref={performerDropdownRef}
                        className={`${styles.dropdown} ${performerOpen ? styles.open : ''}`}
                      >
                        <button
                          type="button"
                          className={styles.dropdownButton}
                          onClick={() => setPerformerOpen((v) => !v)}
                          aria-haspopup="listbox"
                          aria-expanded={performerOpen}
                        >
                          {users.find(u => u.id === editedData.performerId) 
                            ? formatPerformerName(users.find(u => u.id === editedData.performerId))
                            : (request.performer ? formatPerformerName(request.performer) : 'Не назначен')}
                        </button>
                        {performerOpen && (
                          <ul className={styles.dropdownMenu} role="listbox">
                            <li
                              role="option"
                              className={`${styles.dropdownItem} ${!editedData.performerId ? styles.active : ''}`}
                              onClick={() => {
                                handleChange('performerId', '')
                                setPerformerOpen(false)
                              }}
                            >
                              Не назначен
                            </li>
                            {users.map(user => (
                              <li
                                key={user.id}
                                role="option"
                                aria-selected={user.id === editedData.performerId}
                                className={`${styles.dropdownItem} ${user.id === editedData.performerId ? styles.active : ''}`}
                                onClick={() => {
                                  handleChange('performerId', user.id)
                                  setPerformerOpen(false)
                                }}
                              >
                                {formatPerformerName(user)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <div className={styles.value}>{performerValue}</div>
                    )}
                  </div>
                ) : (
                  <div className={styles.readonlyField}>
                    {isEditing ? (
                      <>
                        <label className={styles.label}>Исполнитель</label>
                        <div
                          ref={performerDropdownRef}
                          className={`${styles.dropdown} ${performerOpen ? styles.open : ''}`}
                        >
                          <button
                            type="button"
                            className={styles.dropdownButton}
                            onClick={() => setPerformerOpen((v) => !v)}
                            aria-haspopup="listbox"
                            aria-expanded={performerOpen}
                          >
                            Не назначен
                          </button>
                          {performerOpen && (
                            <ul className={styles.dropdownMenu} role="listbox">
                              <li
                                role="option"
                                className={`${styles.dropdownItem} ${!editedData.performerId ? styles.active : ''}`}
                                onClick={() => {
                                  handleChange('performerId', '')
                                  setPerformerOpen(false)
                                }}
                              >
                                Не назначен
                              </li>
                              {users.map(user => (
                                <li
                                  key={user.id}
                                  role="option"
                                  aria-selected={user.id === editedData.performerId}
                                  className={`${styles.dropdownItem} ${user.id === editedData.performerId ? styles.active : ''}`}
                                  onClick={() => {
                                    handleChange('performerId', user.id)
                                    setPerformerOpen(false)
                                  }}
                                >
                                  {formatPerformerName(user)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className={styles.placeholder}>Исполнитель</div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Таблица затрат - только для АХО */}
          {isAHO && (
            <div className={styles.fieldGroup}>
              <div className={styles.readonlyField}>
                <label className={styles.label}>Затраты</label>
                <div className={styles.expenseTable}>
                  {((editedData && editedData.expenses && editedData.expenses.length > 0) ? editedData.expenses : [
                    { name: '', amount: '' },
                    { name: '', amount: '' },
                    { name: '', amount: '' },
                    { name: '', amount: '' }
                  ]).map((expense, index) => (
                    <div key={index} className={styles.expenseRow}>
                      <div className={styles.expenseCell}>
                        <input
                          type="text"
                          className={styles.input}
                          value={expense.name || ''}
                          onChange={(e) => {
                            const currentExpenses = (editedData && editedData.expenses) ? editedData.expenses : [
                              { name: '', amount: '' },
                              { name: '', amount: '' },
                              { name: '', amount: '' },
                              { name: '', amount: '' }
                            ]
                            const newExpenses = [...currentExpenses]
                            newExpenses[index] = { ...newExpenses[index], name: e.target.value }
                            handleChange('expenses', newExpenses)
                          }}
                          placeholder={index === 0 ? "Описание затрат" : ""}
                        />
                      </div>
                      <div className={styles.expenseCell}>
                        <input
                          type="text"
                          className={styles.input}
                          value={expense.amount || ''}
                          onChange={(e) => {
                            const currentExpenses = (editedData && editedData.expenses) ? editedData.expenses : [
                              { name: '', amount: '' },
                              { name: '', amount: '' },
                              { name: '', amount: '' },
                              { name: '', amount: '' }
                            ]
                            const newExpenses = [...currentExpenses]
                            newExpenses[index] = { ...newExpenses[index], amount: e.target.value }
                            handleChange('expenses', newExpenses)
                          }}
                          placeholder={index === 0 ? "Стоимость" : ""}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Комментарий - только для АХО */}
          {isAHO && (
            <div className={styles.fieldGroup}>
              {(() => {
                const commentValue = isEditing 
                  ? editedData.comment 
                  : (request.comments && request.comments.length > 0 
                      ? request.comments[request.comments.length - 1].content || '' 
                      : '')
                
                return commentValue ? (
                  <div className={`${styles.readonlyField} ${styles.problemDescriptionField}`}>
                    <label className={styles.label}>Комментарий</label>
                    {isEditing ? (
                      <textarea
                        className={styles.input}
                        value={editedData.comment}
                        onChange={(e) => handleChange('comment', e.target.value)}
                        placeholder="Комментарий"
                        rows={4}
                      />
                    ) : (
                      <div className={styles.value}>{commentValue}</div>
                    )}
                  </div>
                ) : (
                  <div className={`${styles.readonlyField} ${styles.problemDescriptionField}`}>
                    {isEditing ? (
                      <>
                        <label className={styles.label}>Комментарий</label>
                        <textarea
                          className={styles.input}
                          value={editedData.comment}
                          onChange={(e) => handleChange('comment', e.target.value)}
                          placeholder="Комментарий"
                          rows={4}
                        />
                      </>
                    ) : (
                      <div className={styles.placeholder}>Комментарий</div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {request.attachments && request.attachments.length > 0 && (
            <div className={styles.fieldGroup}>
              <div className={`${styles.readonlyField} ${styles.attachmentsField}`}>
                <label className={styles.label}>Прикрепленные файлы</label>
                <div className={styles.previews}>
                  {request.attachments.map((attachment, idx) => {
                    // Обрабатываем URL - если это строка (старый формат), преобразуем в объект
                    let attachmentData = attachment
                    if (typeof attachment === 'string') {
                      const imageUrl = attachment.startsWith('http') 
                        ? attachment 
                        : `http://127.0.0.1:8000${attachment.startsWith('/') ? '' : '/'}${attachment}`
                      // Извлекаем имя файла из URL
                      const fileName = attachment.split('/').pop() || `Вложение ${idx + 1}`
                      attachmentData = {
                        url: imageUrl,
                        name: fileName
                      }
                    }
                    
                    const imageUrl = attachmentData.url || attachmentData
                    const fileName = attachmentData.name || `Вложение ${idx + 1}`
                    
                    return (
                      <div key={idx} className={styles.previewItem}>
                        <img 
                          className={styles.previewImage} 
                          src={imageUrl} 
                          alt={fileName}
                          onError={(e) => {
                            console.error('Ошибка загрузки изображения:', imageUrl)
                            e.target.style.display = 'none'
                          }}
                        />
                        <div className={styles.fileName}>{fileName}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            {isAHO && (
              <>
                <button 
                  className={styles.revisionBtn} 
                  onClick={handleMarkRevision}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? 'ОБНОВЛЕНИЕ...' : 'ОТПРАВИТЬ НА ДОРАБОТКУ'}
                </button>
                <button 
                  className={styles.completedBtn} 
                  onClick={handleMarkCompleted}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? 'ОБНОВЛЕНИЕ...' : 'ОТМЕТИТЬ ВЫПОЛНЕННОЙ'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

