'use client'

import { useEffect, useRef } from 'react'
import styles from './RequestViewModal.module.scss'
import Image from 'next/image'

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

export default function RequestViewModal({ request, isOpen, onClose }) {
  const modalRef = useRef(null)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
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
  }, [isOpen, onClose])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen || !request) return null

  const priorityLabel = priorityLabels[request.priority] || request.priority
  const issueTypeLabel = issueTypeLabels[request.issueType] || request.issueType

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.header}>
          <h2 className={styles.title}>Заявка</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={`${styles.fieldGroup} ${styles.priorityFieldGroup}`}>
            <div className={`${styles.priorityField} ${styles[request.priority]}`}>
              {priorityLabel}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            {(() => {
              const addressValue = request.address || request.location
              return addressValue ? (
                <div className={styles.readonlyField}>
                  <label className={styles.label}>Адрес</label>
                  <div className={styles.value}>{addressValue}</div>
                </div>
              ) : (
                <div className={styles.readonlyField}>
                  <div className={styles.placeholder}>Адрес</div>
                </div>
              )
            })()}
          </div>

          <div className={styles.fieldGroup}>
            {request.employeeLocation ? (
              <div className={styles.readonlyField}>
                <label className={styles.label}>Место сотрудника</label>
                <div className={styles.value}>{request.employeeLocation}</div>
              </div>
            ) : (
              <div className={styles.readonlyField}>
                <div className={styles.placeholder}>Место сотрудника</div>
              </div>
            )}
          </div>

          <div className={styles.fieldGroup}>
            {issueTypeLabel ? (
              <div className={styles.readonlyField}>
                <label className={styles.label}>Тип поломки</label>
                <div className={styles.value}>{issueTypeLabel}</div>
              </div>
            ) : (
              <div className={styles.readonlyField}>
                <div className={styles.placeholder}>Тип поломки</div>
              </div>
            )}
          </div>

          <div className={styles.fieldGroup}>
            {(() => {
              const locationValue = request.locationDescription || request.location
              return locationValue ? (
                <div className={styles.readonlyField}>
                  <label className={styles.label}>Описание локации</label>
                  <div className={styles.value}>{locationValue}</div>
                </div>
              ) : (
                <div className={styles.readonlyField}>
                  <div className={styles.placeholder}>Описание локации</div>
                </div>
              )
            })()}
          </div>

          <div className={styles.fieldGroup}>
            {request.problemDescription ? (
              <div className={`${styles.readonlyField} ${styles.problemDescriptionField}`}>
                <label className={styles.label}>Описание проблемы</label>
                <div className={styles.value}>{request.problemDescription}</div>
              </div>
            ) : (
              <div className={`${styles.readonlyField} ${styles.problemDescriptionField}`}>
                <div className={styles.placeholder}>Описание проблемы</div>
              </div>
            )}
          </div>

          {request.attachments && request.attachments.length > 0 && (
            <div className={styles.fieldGroup}>
              <div className={`${styles.readonlyField} ${styles.attachmentsField}`}>
                <label className={styles.label}>Прикрепленные файлы</label>
                <div className={styles.previews}>
                  {request.attachments.map((attachment, idx) => {
                    // Обрабатываем URL - если это относительный путь, добавляем базовый URL
                    const imageUrl = attachment.startsWith('http') 
                      ? attachment 
                      : `http://127.0.0.1:8000${attachment.startsWith('/') ? '' : '/'}${attachment}`
                    
                    return (
                      <div key={idx} className={styles.previewItem}>
                        <img 
                          className={styles.previewImage} 
                          src={imageUrl} 
                          alt={`Вложение ${idx + 1}`}
                          onError={(e) => {
                            console.error('Ошибка загрузки изображения:', imageUrl)
                            e.target.style.display = 'none'
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button className={styles.closeBtn} onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

