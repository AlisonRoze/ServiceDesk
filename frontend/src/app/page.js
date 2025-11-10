'use client'

import { useState } from 'react'
import InputField from '../components/ui/InputField/InputField'
import styles from './page.module.scss'

// Базовый URL для Django API
const API_BASE_URL = 'http://127.0.0.1:8000'

export default function HomePage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Сохраняем данные пользователя в localStorage
        localStorage.setItem('user', JSON.stringify(data.user))
        // Переходим на страницу профиля
        window.location.href = '/profile'
      } else {
        setError(data.error || 'Произошла ошибка при авторизации')
      }
    } catch (error) {
      setError('Ошибка при подключении к серверу')
      console.error('Ошибка:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.authLayout}>
      <div className={styles.authContainer}>
        <div className={styles.authPage}>
          <h1>Добро пожаловать!</h1>
          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.authLabels}>
            <InputField 
              type="email"
              name="email"
              id="email"
              required={true}
              placeholder="Введите ваш email"
              value={formData.email}
              onChange={handleInputChange}
            />
            <InputField 
              type="password"
              name="password"
              id="password"
              required={true}
              placeholder="Введите пароль"
              value={formData.password}
              onChange={handleInputChange}
            />
            </div>
            <a href="#" className={styles.forgotPassword}>
              Забыли пароль?
            </a>
            
            {error && <div className={styles.errorMessage}>{error}</div>}
            <button type="submit" className={styles.authButton} disabled={isLoading}>
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
            <div className={styles.signUpRow}>
              <span>Нет аккаунта?</span>
              <a href="#" className={styles.signUpLink}>Зарегистрироваться</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}