import { Github, Linkedin, Mail, MessageCircle } from 'lucide-react';
import { personalInfo } from '../data/personalInfo.js';

// Same anchor targets as the navbar, duplicated here since the
// footer is a self-contained component with its own small nav list.
const FOOTER_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Education', href: '#education' },
  { label: 'Contact', href: '#contact' },
];

const SOCIAL_LINKS = [
  { icon: Github, href: personalInfo.socials.github, label: 'GitHub' },
  { icon: Linkedin, href: personalInfo.socials.linkedin, label: 'LinkedIn' },
  { icon: MessageCircle, href: personalInfo.socials.whatsapp, label: 'WhatsApp' },
  { icon: Mail, href: personalInfo.socials.email, label: 'Email' },
];

/**
 * Footer. Sits below the Contact section and shows the name/logo,
 * a compact nav link list, social icons, and a copyright line with
 * the current year computed automatically.
 */
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-surfaceAlt dark:bg-surfaceAlt-dark border-t border-border dark:border-border-dark">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 flex flex-col items-center gap-6">
        {/* Logo */}
        <a
          href="#home"
          className="text-lg font-bold text-textPrimary dark:text-textPrimary-dark tracking-tight"
        >
          Antor<span className="text-accent">.</span>
        </a>

        {/* Nav links */}
        <ul className="flex flex-wrap items-center justify-center gap-6">
          {FOOTER_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium text-textSecondary dark:text-textSecondary-dark hover:text-accent dark:hover:text-accent-light transition-colors duration-200"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Social icons */}
        <div className="flex items-center gap-4">
          {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('mailto:') ? undefined : '_blank'}
              rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              aria-label={label}
              className="text-textSecondary dark:text-textSecondary-dark hover:text-accent dark:hover:text-accent-light transition-colors duration-200"
            >
              <Icon size={18} />
            </a>
          ))}
        </div>

        {/* Copyright */}
        <p className="text-xs text-textSecondary dark:text-textSecondary-dark text-center">
          © {currentYear} {personalInfo.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
