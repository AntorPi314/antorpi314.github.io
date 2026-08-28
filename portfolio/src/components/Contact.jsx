import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Github, Linkedin, MessageCircle, Copy, Check } from 'lucide-react';
import SectionHeading from './SectionHeading.jsx';
import { personalInfo } from '../data/personalInfo.js';

// Each contact detail as an icon + label + link/href.
// `href` is optional (MapPin has no meaningful link target).
// `copyValue` is optional (phone and email can be copied to clipboard).
const CONTACT_DETAILS = [
  {
    icon: Phone,
    label: personalInfo.phone,
    href: `tel:${personalInfo.phone}`,
    copyValue: personalInfo.phone,
  },
  {
    icon: Mail,
    label: personalInfo.email,
    href: personalInfo.socials.email,
    copyValue: personalInfo.email,
  },
  {
    icon: MapPin,
    label: personalInfo.location,
    href: null,
    copyValue: null,
  },
];

const SOCIAL_LINKS = [
  { icon: Github, href: personalInfo.socials.github, label: 'GitHub' },
  { icon: Linkedin, href: personalInfo.socials.linkedin, label: 'LinkedIn' },
  { icon: MessageCircle, href: personalInfo.socials.whatsapp, label: 'WhatsApp' },
];

/**
 * Contact section. Shows phone, email, and location as a list of
 * icon rows (email opens the user's mail client via a mailto: link),
 * plus GitHub/LinkedIn as icon buttons and a prominent "Say Hello"
 * CTA button that also opens the mail client.
 */
function Contact() {
  // Tracks which field (by its copyValue) was just copied, to briefly
  // swap the Copy icon for a checkmark as feedback.
  const [copiedValue, setCopiedValue] = useState(null);

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      setTimeout(() => setCopiedValue((current) => (current === value ? null : current)), 1800);
    } catch (error) {
      // Clipboard API can fail in unsupported/insecure contexts; fail silently.
    }
  };

  return (
    <div>
      <SectionHeading
        title="Contact"
        subtitle="Have a project in mind or just want to say hi? Reach out, I'm always open to new opportunities and conversations."
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-xl mx-auto flex flex-col items-center gap-8"
      >
        {/* Contact detail rows */}
        <div className="w-full flex flex-col gap-4">
          {CONTACT_DETAILS.map(({ icon: Icon, label, href, copyValue }) => {
            const isCopied = copiedValue === copyValue;

            const content = (
              <>
                <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 dark:bg-accent-light/10 text-accent dark:text-accent-light">
                  <Icon size={18} />
                </span>
                <span className="text-textPrimary dark:text-textPrimary-dark font-medium break-all">
                  {label}
                </span>
              </>
            );

            const rowClasses =
              'flex items-center gap-4 p-4 rounded-xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark hover:border-accent/40 dark:hover:border-accent-light/40 transition-colors duration-200';

            const copyButton = copyValue && (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  handleCopy(copyValue);
                }}
                aria-label={`Copy ${label}`}
                title={isCopied ? 'Copied' : 'Copy'}
                className="ml-auto flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full text-textSecondary dark:text-textSecondary-dark hover:text-accent dark:hover:text-accent-light hover:bg-accent/10 dark:hover:bg-accent-light/10 transition-colors duration-200"
              >
                {isCopied ? <Check size={16} className="text-green-500 dark:text-green-400" /> : <Copy size={16} />}
              </button>
            );

            return href ? (
              <a key={label} href={href} className={rowClasses}>
                {content}
                {copyButton}
              </a>
            ) : (
              <div
                key={label}
                className="flex items-center gap-4 p-4 rounded-xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark"
              >
                {content}
              </div>
            );
          })}
        </div>

        {/* Social icon buttons */}
        <div className="flex items-center gap-4">
          {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
            <motion.a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-full bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-textSecondary dark:text-textSecondary-dark hover:text-accent dark:hover:text-accent-light hover:border-accent dark:hover:border-accent-light transition-colors duration-200 shadow-sm"
            >
              <Icon size={20} />
            </motion.a>
          ))}
        </div>

        {/* Primary CTA */}
        <motion.a
          href={personalInfo.socials.email}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 rounded-full bg-accent hover:bg-accent-hover text-white font-medium shadow-lg shadow-accent/30 transition-colors duration-200"
        >
          Say Hello
        </motion.a>
      </motion.div>
    </div>
  );
}

export default Contact;
