import LayoutStyles from './layout.module.scss'
import Image from 'next/image'
import NotificationBadge from '@/components/ui/NotificationBadge/NotificationBadge'

export default function MainLayout({ children }) {
  return (
    <div className={LayoutStyles.profileContainer}>
      {/* Header */}
      <header className={LayoutStyles.profileHeader}>
        <div className={LayoutStyles.profileHeaderContent}>
          <Image src="/assets/logo.svg" alt="Logo" width={100} height={100} priority />
          <nav className={LayoutStyles.profileNav}>
            <a href="/profile" className={`${LayoutStyles.navLink} ${LayoutStyles.active}`}>ЛИЧНЫЙ КАБИНЕТ</a>
            <a href="/requests" className={LayoutStyles.navLink}>ЗАЯВКИ</a>
            <a href="/notifications" className={LayoutStyles.navLink}>
              УВЕДОМЛЕНИЯ
              <NotificationBadge />
            </a>
          </nav>
          <button className={LayoutStyles.createRequestBtn}>
            <span className={LayoutStyles.btnIcon}>✏️</span>
            СОЗДАТЬ ЗАЯВКУ
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={LayoutStyles.profileMain}>
        {children}
      </main>
    </div>
  )
}
