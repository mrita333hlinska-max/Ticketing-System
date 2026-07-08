/**
 * Application top navigation (design shell): brand, section tabs, and a user
 * menu. Present on all authenticated screens.
 */
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSession } from '@/app/providers/session';
import { classNames } from '@/shared/lib';
import styles from './TopNav.module.css';

const TABS = [
  { to: '/board', label: 'Board' },
  { to: '/teams', label: 'Teams' },
  { to: '/epics', label: 'Epics' },
];

export function TopNav() {
  const { user, logout } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <span aria-hidden="true" className={styles.mark} />
        Ticket Tracker
      </div>

      <nav className={styles.tabs} aria-label="Primary">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              classNames(styles.tab, isActive && styles.tabActive)
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.user}>
        <button
          type="button"
          className={styles.userButton}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {user?.email ?? 'Account'}
          <span aria-hidden="true" className={styles.caret}>
            ▾
          </span>
        </button>
        {menuOpen && (
          <div className={styles.menu} role="menu">
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                void logout();
              }}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
