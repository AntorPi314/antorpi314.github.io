import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

// Nav links used both in the desktop menu and the mobile menu.
// The `href` values are anchor targets that must match the `id`
// attributes on each section (added in later steps).
const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Education', href: '#education' },
  { label: 'Contact', href: '#contact' },
];

function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Track scroll position so the navbar can get a background/shadow
  // once the user scrolls past the very top of the page.
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track which section is currently in view using IntersectionObserver
  // (much cheaper than computing scroll positions manually on every
  // scroll event). The section whose heading crosses a band near the
  // top of the viewport becomes "active", which drives the animated
  // underline below.
  useEffect(() => {
    const sectionIds = ['home', ...NAV_LINKS.map((link) => link.href.slice(1))];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (sections.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        // Treat a section as "active" once it reaches the upper third
        // of the viewport, and stop counting it once it passes the
        // lower half — keeps the highlight stable while scrolling.
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Close the mobile menu automatically whenever the viewport is
  // resized back up to desktop width, to avoid a stuck-open menu.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Closes the mobile menu after a nav link is clicked, since the
  // anchor click already triggers the native smooth scroll.
  const handleNavLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-md shadow-md border-b border-border dark:border-border-dark'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
        {/* Logo / Name */}
        <a
          href="#home"
          className="text-lg md:text-xl font-bold text-textPrimary dark:text-textPrimary-dark tracking-tight"
        >
          Antor<span className="text-accent">.</span>
        </a>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href.slice(1);
            return (
              <li key={link.href} className="relative">
                <a
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-accent-hover dark:text-accent-light'
                      : 'text-textSecondary dark:text-textSecondary-dark hover:text-accent dark:hover:text-accent-light'
                  }`}
                >
                  {link.label}
                </a>
                {isActive && (
                  <motion.span
                    layoutId="navbar-active-underline"
                    className="absolute left-0 -bottom-1.5 w-full h-0.5 rounded-full bg-accent dark:bg-accent-light"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </li>
            );
          })}
        </ul>

        {/* Right side: theme toggle (always visible) + hamburger (mobile only) */}
        <div className="flex items-center gap-3">
          <motion.button
            key={isDark ? 'dark' : 'light'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="p-2 rounded-full text-textSecondary dark:text-textSecondary-dark hover:text-accent dark:hover:text-accent-light hover:bg-surfaceAlt dark:hover:bg-surfaceAlt-dark transition-colors duration-200"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>

          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-full text-textPrimary dark:text-textPrimary-dark hover:bg-surfaceAlt dark:hover:bg-surfaceAlt-dark transition-colors duration-200"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-surface dark:bg-surface-dark border-b border-border dark:border-border-dark"
          >
            <ul className="flex flex-col px-6 py-4 gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.href.slice(1);
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={handleNavLinkClick}
                      className={`block py-3 text-base font-medium transition-colors duration-200 ${
                        isActive
                          ? 'text-accent-hover dark:text-accent-light'
                          : 'text-textSecondary dark:text-textSecondary-dark hover:text-accent dark:hover:text-accent-light'
                      }`}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
