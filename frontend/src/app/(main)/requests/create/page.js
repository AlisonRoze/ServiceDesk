'use client'

import { useForm } from 'react-hook-form'
import styles from './create.module.scss'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export default function CreateRequestPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm({
    defaultValues: {
      priority: '',
      address: '',
      employeeLocation: '',
      issueType: '',
      locationDescription: '',
      problemDescription: '',
    }
  })
  const priorityValue = watch('priority')
  const [priorityOpen, setPriorityOpen] = useState(false)
  const dropdownRef = useRef(null)
  const issueTypeValue = watch('issueType')
  const [issueOpen, setIssueOpen] = useState(false)
  const issueDropdownRef = useRef(null)
  const [attachedImages, setAttachedImages] = useState([])
  const [attachedPreviews, setAttachedPreviews] = useState([])
  const fileInputRef = useRef(null)

  const handleTextareaInput = (e) => {
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.max(68, el.scrollHeight) + 'px'
  }

  useEffect(() => {
    function onDocClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setPriorityOpen(false)
      }
      if (issueDropdownRef.current && !issueDropdownRef.current.contains(e.target)) {
        setIssueOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const handleAttachClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file))
    setAttachedImages((prev) => [...prev, ...imageFiles])
    setAttachedPreviews((prev) => [...prev, ...newPreviews])

    // Reset input to allow re-selecting the same file
    e.target.value = ''
  }

  const removeAttachmentAt = (indexToRemove) => {
    setAttachedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove))
    setAttachedPreviews((prev) => {
      const toRevoke = prev[indexToRemove]
      if (toRevoke) {
        try { URL.revokeObjectURL(toRevoke) } catch {}
      }
      return prev.filter((_, idx) => idx !== indexToRemove)
    })
  }

  const priorityOptions = [
    { value: 'low', label: 'Низкий' },
    { value: 'medium', label: 'Средний' },
    { value: 'high', label: 'Высокий' },
    { value: 'urgent', label: 'Критический' },
  ]
  const issueTypeOptions = [
    { value: 'access', label: 'Доступ' },
    { value: 'hardware', label: 'Оборудование' },
    { value: 'software', label: 'ПО' },
    { value: 'network', label: 'Сеть' },
    { value: 'other', label: 'Другое' },
  ]

  const onSubmit = async (data) => {
    // Заглушка отправки формы. Здесь можно вызвать ваш API.
    // await fetch('/api/requests', { method: 'POST', body: JSON.stringify(data) })
    console.log('Create request payload:', data, {
      attachedImagesCount: attachedImages.length,
      attachedImages,
    })
    alert('Заявка отправлена (демо). Смотрите консоль для payload.')
    try {
      attachedPreviews.forEach((src) => {
        try { URL.revokeObjectURL(src) } catch {}
      })
    } catch {}
    reset()
    setAttachedImages([])
    setAttachedPreviews([])
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Создание заявки</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
        {/* Приоритет */}
        <div className={styles.fieldGroup}>
          <input type="hidden" id="priority" {...register('priority', { required: 'Выберите приоритет' })} value={priorityValue} readOnly />
          <div
            ref={dropdownRef}
            className={`${styles.dropdown} ${styles.prioritySelect} ${priorityOpen ? styles.open : ''}`}
          >
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={() => setPriorityOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={priorityOpen}
            >
              {priorityOptions.find(o => o.value === priorityValue)?.label || 'Приоритет'}
            </button>
            {priorityOpen && (
              <ul className={styles.dropdownMenu} role="listbox" aria-labelledby="priority">
                {priorityOptions.map(opt => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === priorityValue}
                    className={`${styles.dropdownItem} ${opt.value === priorityValue ? styles.active : ''}`}
                    onClick={() => {
                      setValue('priority', opt.value, { shouldValidate: true, shouldDirty: true })
                      setPriorityOpen(false)
                    }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.priority && <span className={styles.error}>{errors.priority.message}</span>}
        </div>

        {/* Адрес */}
        <div className={styles.fieldGroup}>
          <input
            id="address"
            type="text"
            placeholder="Адрес"
            {...register('address', {
              required: 'Адрес обязателен',
              minLength: { value: 3, message: 'Минимум 3 символа' },
              maxLength: { value: 200, message: 'Максимум 200 символов' },
            })}
            className={`${styles.input} ${styles.field40}`}
          />
          {errors.address && <span className={styles.error}>{errors.address.message}</span>}
        </div>

        {/* Место сотрудника (необязательно) */}
        <div className={styles.fieldGroup}>
          <input
            id="employeeLocation"
            type="text"
            placeholder="Место сотрудника"
            {...register('employeeLocation')}
            className={`${styles.input} ${styles.field40} ${styles.noBorder}`}
          />
          <span className={styles.hint}>Это поле необязательно к заполнению</span>
        </div>

        {/* Тип поломки */}
        <div className={styles.fieldGroup}>
          <input type="hidden" id="issueType" {...register('issueType', { required: 'Выберите тип поломки' })} value={issueTypeValue} readOnly />
          <div
            ref={issueDropdownRef}
            className={`${styles.dropdown} ${styles.prioritySelect} ${issueOpen ? styles.open : ''}`}
          >
            <button
              type="button"
              className={styles.dropdownButton}
              onClick={() => setIssueOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={issueOpen}
            >
              {issueTypeOptions.find(o => o.value === issueTypeValue)?.label || 'Тип поломки'}
            </button>
            {issueOpen && (
              <ul className={styles.dropdownMenu} role="listbox" aria-labelledby="issueType">
                {issueTypeOptions.map(opt => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === issueTypeValue}
                    className={`${styles.dropdownItem} ${opt.value === issueTypeValue ? styles.active : ''}`}
                    onClick={() => {
                      setValue('issueType', opt.value, { shouldValidate: true, shouldDirty: true })
                      setIssueOpen(false)
                    }}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.issueType && <span className={styles.error}>{errors.issueType.message}</span>}
        </div>

        {/* Описание локации */}
        <div className={styles.fieldGroup}>
          <textarea
            id="locationDescription"
            rows={1}
            placeholder="Описание локации"
            {...register('locationDescription', {
              required: 'Опишите локацию',
              minLength: { value: 3, message: 'Минимум 3 символа' },
            })}
            className={styles.textarea}
            onInput={handleTextareaInput}
          />
          {errors.locationDescription && <span className={styles.error}>{errors.locationDescription.message}</span>}
        </div>

        {/* Описание проблемы */}
        <div className={styles.fieldGroup}>
          <textarea
            id="problemDescription"
            rows={6}
            placeholder="Описание проблемы"
            {...register('problemDescription', {
              required: 'Описание проблемы обязательно',
              minLength: { value: 10, message: 'Минимум 10 символов' },
            })}
            className={styles.textarea}
            onInput={handleTextareaInput}
          />
          {errors.problemDescription && <span className={styles.error}>{errors.problemDescription.message}</span>}
        </div>

        <div className={styles.attach} onClick={handleAttachClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAttachClick() }}>
          <Image
            src={"/assets/add_photo.svg"}
            width={13}
            height={18}
            alt="Прикрепить"
          />
          <span className={styles.attachText}>Прикрепить фото</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesSelected}
          style={{ display: 'none' }}
        />

        {attachedPreviews.length > 0 && (
          <div className={styles.previews}>
            {attachedPreviews.map((src, idx) => {
              const key = `${src}-${idx}`
              return (
                <div
                  key={key}
                  className={styles.previewItem}
                  onClick={() => removeAttachmentAt(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') removeAttachmentAt(idx) }}
                  aria-label="Удалить вложение"
                  title="Удалить"
                >
                  <img className={styles.previewImage} src={src} alt={`Превью ${idx + 1}`} />
                  <div className={styles.previewOverlay}>
                    <span className={styles.previewCross} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitBtn}
          >
            {isSubmitting ? 'Отправка...' : 'Создать'}
          </button>
          
        </div>
      </form>
    </div>
  )
}


