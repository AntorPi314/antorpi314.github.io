import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

/**
 * EducationItem renders a single entry in the vertical education
 * timeline: an icon marker on the timeline rail, plus a card with
 * the institution, degree, period, and optional extra details.
 * The `isLast` prop controls whether the connecting rail line is
 * drawn below this item (omitted for the final entry).
 */
function EducationItem({
  institution,
  degree,
  period,
  details,
  index = 0,
  isLast = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.15 }}
      className="relative pl-14 md:pl-16"
    >
      {/* Timeline rail: vertical connecting line behind the icon marker */}
      {!isLast && (
        <span className="absolute left-5 md:left-6 top-10 bottom-[-2rem] w-px bg-border dark:bg-border-dark" />
      )}

      {/* Icon marker */}
      <span className="absolute left-0 top-0 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-accent/10 dark:bg-accent-light/10 border border-accent/30 dark:border-accent-light/30 text-accent dark:text-accent-light">
        <GraduationCap size={20} />
      </span>

      {/* Content card */}
      <div className="pb-10 last:pb-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-1">
          <h3 className="text-lg font-bold text-textPrimary dark:text-textPrimary-dark">
            {institution}
          </h3>
          {period && (
            <span className="text-sm font-medium text-accent dark:text-accent-light whitespace-nowrap">
              {period}
            </span>
          )}
        </div>
        <p className="text-sm text-textSecondary dark:text-textSecondary-dark leading-relaxed">
          {degree}
        </p>
        {details && (
          <p className="text-sm text-textSecondary dark:text-textSecondary-dark leading-relaxed mt-1">
            {details}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default EducationItem;
