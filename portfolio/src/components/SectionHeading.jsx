import { motion } from 'framer-motion';

/**
 * SectionHeading renders a consistent title + optional subtitle for
 * every content section (About, Skills, Projects, Education,
 * Contact). Using `whileInView` here means the heading animates in
 * only once, the moment it scrolls into the viewport.
 */
function SectionHeading({ title, subtitle, align = 'center' }) {
  const alignmentClasses =
    align === 'left' ? 'items-start text-left' : 'items-center text-center';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`flex flex-col ${alignmentClasses} mb-12 md:mb-16`}
    >
      <h2 className="text-3xl md:text-4xl font-bold text-textPrimary dark:text-textPrimary-dark mb-3">
        {title}
      </h2>
      <div className="w-14 h-1.5 rounded-full bg-accent mb-4" />
      {subtitle && (
        <p className="max-w-2xl text-textSecondary dark:text-textSecondary-dark leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

export default SectionHeading;
