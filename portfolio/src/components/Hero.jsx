import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, ArrowDown } from 'lucide-react';
import { personalInfo } from '../data/personalInfo.js';
import profilePlaceholder from '../assets/profile.jpg';
import ThanosPart from './ThanosPart.jsx';

// Social links shown as icon buttons below the tagline.
// Reusing the centralized personalInfo data keeps this in sync with
// the Contact section built in a later step.
const SOCIAL_LINKS = [
  { icon: Github, href: personalInfo.socials.github, label: 'GitHub' },
  { icon: Linkedin, href: personalInfo.socials.linkedin, label: 'LinkedIn' },
  { icon: Mail, href: personalInfo.socials.email, label: 'Email' },
];

// Parent variant controls the stagger timing; each child fades and
// slides up in sequence rather than all appearing at once.
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

function Hero({ partsRef }) {
  return (
    <div className="relative min-h-[45vh] flex items-center overflow-hidden">
      {/* Decorative background gradient blobs. These use pure CSS/Tailwind
          (no external images) so they render identically in dark and
          light mode, just with different opacity/color via the
          dark: variants. Positioned absolutely and behind the content. */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/20 dark:bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-accent-light/20 dark:bg-accent-light/10 blur-3xl" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full flex flex-col-reverse md:flex-row items-center justify-between gap-10 md:gap-16"
      >
        {/* Text content */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
          <motion.p
            variants={itemVariants}
            className="text-accent dark:text-accent-light font-semibold tracking-wide mb-1.5"
          >
            Hi, this is
          </motion.p>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-textPrimary dark:text-textPrimary-dark leading-tight mb-3"
          >
            {personalInfo.name}
          </motion.h1>

          <motion.h2
            variants={itemVariants}
            className="text-xl md:text-2xl font-semibold text-textSecondary dark:text-textSecondary-dark mb-5"
          >
            {personalInfo.title}
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="max-w-xl text-base md:text-lg text-textSecondary dark:text-textSecondary-dark leading-relaxed mb-8"
          >
            {personalInfo.taglineBefore}
            <ThanosPart
              sectionId="hero"
              partId="hero-tagline"
              partsRef={partsRef}
              as="span"
            >
              {personalInfo.taglineSnapPhrase}
            </ThanosPart>
            {personalInfo.taglineAfter}
          </motion.p>

          {/* Social icons */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-4 mb-8"
          >
            {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
              <motion.a
                key={label}
                href={href}
                target={href.startsWith('mailto:') ? undefined : '_blank'}
                rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                aria-label={label}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-full bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-textSecondary dark:text-textSecondary-dark hover:text-accent dark:hover:text-accent-light hover:border-accent dark:hover:border-accent-light transition-colors duration-200 shadow-sm"
              >
                <Icon size={20} />
              </motion.a>
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center md:justify-start gap-4"
          >
            <motion.a
              href="#projects"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-full bg-accent hover:bg-accent-hover text-white font-medium shadow-lg shadow-accent/30 transition-colors duration-200"
            >
              View Projects
            </motion.a>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-full border border-border dark:border-border-dark text-textPrimary dark:text-textPrimary-dark font-medium hover:border-accent dark:hover:border-accent-light hover:text-accent dark:hover:text-accent-light transition-colors duration-200"
            >
              Contact Me
            </motion.a>
          </motion.div>
        </div>

        {/* Profile photo */}
        <motion.div
          variants={itemVariants}
          className="flex-shrink-0"
        >
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full p-1.5 bg-gradient-to-br from-accent to-accent-light shadow-xl">
            <img
              src={profilePlaceholder}
              alt={personalInfo.name}
              className="w-full h-full rounded-full object-cover border-4 border-surface dark:border-surface-dark"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.a
        href="#about"
        aria-label="Scroll to About section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="hidden md:flex absolute bottom-4 left-1/2 -translate-x-1/2 flex-col items-center gap-1 text-textSecondary dark:text-textSecondary-dark"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown size={20} />
        </motion.div>
      </motion.a>
    </div>
  );
}

export default Hero;
