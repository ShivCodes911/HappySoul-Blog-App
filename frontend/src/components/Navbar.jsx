import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Sun, Moon, PenLine, Bookmark, BookOpen, 
  User, LogOut, Menu, X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    setMobileOpen(false);
    navigate('/login');
  };

  const isHomePage = location.pathname === '/';

  const navLinks = [
    { label: 'HOME', href: '/', isRoute: true },
    { label: 'EXPLORE', href: isHomePage ? '#explore' : '/#explore' },
    ...(user
      ? [
          { label: 'WRITE', href: '/create-post', isRoute: true },
          { label: 'MY POSTS', href: '/my-posts', isRoute: true },
          { label: 'BOOKMARKS', href: '/bookmarks', isRoute: true },
        ]
      : []),
  ];

  return (
    <header style={vNav.header}>
      {/* Top Editorial Ticker Bar */}
      <div style={vNav.topBar} className="nav-top-bar">
        <div className="container" style={vNav.topBarContainer}>
          <div style={vNav.tickerLeft}>
            <span style={vNav.tickerTag}>INKFLOW BLOG</span>
            <span style={vNav.tickerDivider} className="nav-ticker-text">/</span>
            <span style={vNav.tickerText} className="nav-ticker-text">IDEAS, STORIES & TECHNICAL ESSAYS</span>
          </div>

          <div style={vNav.tickerRight}>
            <button
              onClick={toggleTheme}
              style={vNav.invertBtn}
              aria-label="Toggle light and dark mode"
              id="theme-toggle-btn"
            >
              {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
              <span>{theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Masthead Bar */}
      <div style={vNav.mainBar}>
        <div className="container" style={vNav.mainContainer}>
          {/* Masthead Logo: InkFlow */}
          <Link to="/" style={vNav.mastheadLink} id="brand-logo">
            <span style={vNav.mastheadText} className="nav-masthead-text">INKFLOW</span>
            <span style={vNav.mastheadDot}>.</span>
          </Link>

          {/* Desktop Navigation */}
          <nav style={vNav.desktopNav} className="nav-desktop">
            {navLinks.map((item) => {
              const isActive = item.isRoute && location.pathname === item.href;
              return item.isRoute ? (
                <Link
                  key={item.label}
                  to={item.href}
                  style={{
                    ...vNav.navLink,
                    ...(isActive ? vNav.navLinkActive : {}),
                  }}
                >
                  {item.label}
                  {isActive && <span style={vNav.redUnderline} />}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  style={vNav.navLink}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* User Controls & Call to Action */}
          <div style={vNav.rightCluster}>
            {user ? (
              <>
                <Link to="/create-post" className="btn btn-primary btn-sm nav-write-btn" id="nav-write-btn">
                  <PenLine size={13} />
                  <span className="nav-write-btn-text">NEW POST</span>
                </Link>

                <div style={{ position: 'relative' }} ref={dropRef} className="nav-avatar-wrap">
                  <button
                    onClick={() => setMenuOpen((p) => !p)}
                    style={vNav.avatarBtn}
                    className="avatar"
                    aria-label="Author account menu"
                    id="nav-avatar-btn"
                  >
                    {user.profileImage?.url || user.profileImage ? (
                      <img
                        src={user.profileImage?.url || user.profileImage}
                        alt={user.name || 'Author'}
                        className="avatar"
                        style={{ width: 34, height: 34, objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="avatar" style={vNav.avatarPlaceholder}>
                        {(user.name || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </button>

                  {menuOpen && (
                    <div style={vNav.dropdownMenu}>
                      <div style={vNav.dropHeader}>
                        <span className="type-overline" style={{ color: 'var(--clr-text-3)' }}>WRITER ACCOUNT</span>
                        <div style={vNav.dropUserName}>{user.name || 'InkFlow Contributor'}</div>
                        <div style={vNav.dropUserEmail}>{user.email}</div>
                      </div>

                      <div style={vNav.dropDivider} />

                      <Link
                        to="/profile"
                        style={vNav.dropItem}
                        onClick={() => setMenuOpen(false)}
                      >
                        <User size={14} />
                        <span>PROFILE & SETTINGS</span>
                      </Link>

                      <Link
                        to="/my-posts"
                        style={vNav.dropItem}
                        onClick={() => setMenuOpen(false)}
                      >
                        <BookOpen size={14} />
                        <span>MY STORIES</span>
                      </Link>

                      <Link
                        to="/bookmarks"
                        style={vNav.dropItem}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Bookmark size={14} />
                        <span>BOOKMARKS</span>
                      </Link>

                      <div style={vNav.dropDivider} />

                      <button
                        style={{ ...vNav.dropItem, color: 'var(--clr-secondary)' }}
                        onClick={handleLogout}
                        id="nav-logout-btn"
                      >
                        <LogOut size={14} />
                        <span>SIGN OUT</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={vNav.guestAuthGroup} className="nav-guest-group">
                <Link to="/login" className="btn btn-secondary btn-sm" id="nav-login-btn">
                  LOG IN
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" id="nav-signup-btn">
                  SIGN UP
                </Link>
              </div>
            )}

            {/* Mobile Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              style={vNav.mobileThemeIconBtn}
              className="nav-mobile-theme-btn"
              aria-label="Toggle light and dark mode"
              id="mobile-theme-toggle-btn"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileOpen((p) => !p)}
              style={vNav.hamburger}
              className="nav-hamburger"
              aria-label="Toggle Navigation Menu"
              id="nav-mobile-toggle"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div style={vNav.mobileDrawer} className="nav-mobile-drawer">
          <div className="container" style={vNav.mobileContainer}>
            {user && (
              <div style={vNav.mobileUserCard}>
                {user.profileImage?.url || user.profileImage ? (
                  <img
                    src={user.profileImage?.url || user.profileImage}
                    alt={user.name || 'Author'}
                    className="avatar"
                    style={{ width: 42, height: 42, objectFit: 'cover' }}
                  />
                ) : (
                  <div className="avatar" style={vNav.mobileAvatarPlaceholder}>
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--clr-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name || 'InkFlow Contributor'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--clr-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </div>
                </div>
              </div>
            )}

            {user && (
              <Link
                to="/create-post"
                className="btn btn-primary btn-md"
                style={{ width: '100%', justifyContent: 'center', margin: '4px 0 10px' }}
                onClick={() => setMobileOpen(false)}
              >
                <PenLine size={14} />
                <span>+ WRITE NEW POST</span>
              </Link>
            )}

            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                style={vNav.mobileLink}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  to="/profile"
                  style={vNav.mobileLink}
                  onClick={() => setMobileOpen(false)}
                >
                  PROFILE & SETTINGS
                </Link>
                <button
                  style={{
                    ...vNav.mobileLink,
                    color: 'var(--clr-secondary)',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid var(--clr-border-subtle)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  <span>SIGN OUT</span>
                </button>
              </>
            ) : (
              <div style={vNav.mobileAuthRow}>
                <Link
                  to="/login"
                  className="btn btn-secondary btn-md"
                  style={{ flex: 1 }}
                  onClick={() => setMobileOpen(false)}
                >
                  LOG IN
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-md"
                  style={{ flex: 1 }}
                  onClick={() => setMobileOpen(false)}
                >
                  SIGN UP
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

const vNav = {
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    backgroundColor: 'var(--clr-bg)',
    borderBottom: '2px solid var(--clr-border-strong)',
  },
  topBar: {
    borderBottom: '1px solid var(--clr-border-subtle)',
    backgroundColor: 'var(--clr-surface)',
    padding: '6px 0',
  },
  topBarContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tickerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  tickerTag: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: 'var(--clr-secondary)',
    textTransform: 'uppercase',
  },
  tickerDivider: {
    color: 'var(--clr-border-medium)',
    fontSize: '11px',
  },
  tickerText: {
    fontFamily: 'var(--font-sans)',
    fontSize: '11px',
    color: 'var(--clr-text-2)',
    fontWeight: 600,
    letterSpacing: '0.04em',
  },
  tickerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  invertBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--clr-text-1)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 6px',
    letterSpacing: '0.04em',
  },
  mainBar: {
    padding: '12px 0',
  },
  mainContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 32,
  },
  mastheadLink: {
    display: 'flex',
    alignItems: 'baseline',
    textDecoration: 'none',
    flexShrink: 0,
  },
  mastheadText: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    lineHeight: 1,
    letterSpacing: '-0.04em',
    color: 'var(--clr-text-1)',
  },
  mastheadDot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    backgroundColor: 'var(--clr-secondary)',
    marginLeft: 2,
  },
  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  },
  navLink: {
    fontFamily: 'var(--font-sans)',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: 'var(--clr-text-1)',
    textTransform: 'uppercase',
    padding: '8px 0',
    position: 'relative',
    transition: 'color 0.15s ease',
  },
  navLinkActive: {
    color: 'var(--clr-secondary)',
  },
  redUnderline: {
    position: 'absolute',
    bottom: -12,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'var(--clr-secondary)',
  },
  rightCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto',
  },
  avatarBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: '9999px',
    backgroundColor: 'var(--clr-border-strong)',
    color: 'var(--clr-bg)',
    fontFamily: 'var(--font-display)',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    minWidth: 220,
    backgroundColor: 'var(--clr-bg)',
    border: '2px solid var(--clr-border-strong)',
    padding: '8px 0',
    zIndex: 250,
  },
  dropHeader: {
    padding: '10px 16px',
    borderBottom: '1px solid var(--clr-border-subtle)',
  },
  dropUserName: {
    fontFamily: 'var(--font-display)',
    fontSize: '14px',
    color: 'var(--clr-text-1)',
    marginTop: 4,
  },
  dropUserEmail: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--clr-text-3)',
    marginTop: 2,
  },
  dropDivider: {
    height: 1,
    backgroundColor: 'var(--clr-border-subtle)',
    margin: '4px 0',
  },
  dropItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    color: 'var(--clr-text-1)',
    textDecoration: 'none',
    width: '100%',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  guestAuthGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  hamburger: {
    background: 'none',
    border: '2px solid var(--clr-border-strong)',
    padding: 6,
    color: 'var(--clr-text-1)',
    cursor: 'pointer',
  },
  mobileDrawer: {
    borderTop: '2px solid var(--clr-border-strong)',
    backgroundColor: 'var(--clr-bg)',
    padding: '16px 0 24px',
    maxHeight: 'calc(100vh - 90px)',
    overflowY: 'auto',
  },
  mobileContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  mobileLink: {
    fontFamily: 'var(--font-sans)',
    fontSize: '15px',
    fontWeight: 700,
    padding: '12px 4px',
    borderBottom: '1px solid var(--clr-border-subtle)',
    color: 'var(--clr-text-1)',
    textTransform: 'uppercase',
  },
  mobileAuthRow: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
  },
  mobileThemeIconBtn: {
    background: 'none',
    border: '2px solid var(--clr-border-strong)',
    padding: '6px 8px',
    color: 'var(--clr-text-1)',
    cursor: 'pointer',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileUserCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 0 16px',
    borderBottom: '2px solid var(--clr-border-subtle)',
    marginBottom: 8,
  },
  mobileAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: '9999px',
    backgroundColor: 'var(--clr-border-strong)',
    color: 'var(--clr-bg)',
    fontFamily: 'var(--font-display)',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};
