import { motion } from 'framer-motion';
import { Github, ExternalLink, CircleDot } from 'lucide-react';

/**
 * ProjectCard renders a single project as a card with:
 *   - title + subtitle
 *   - GitHub link button (if githubUrl is provided)
 *   - Live demo link button (if liveUrl is provided)
 *   - a bullet-point description list
 *   - tech stack badges
 * Some projects (e.g. GadgetDepoBD) have no public GitHub repo, so
 * githubUrl can be null — the button is simply omitted in that case.
 */
function ProjectCard({
  title,
  subtitle,
  description,
  techStack,
  githubUrl,
  liveUrl,
  index = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: (index % 3) * 0.1 }}
      whileHover={{ y: -8 }}
      className="flex flex-col h-full p-6 rounded-2xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark shadow-sm hover:shadow-xl hover:border-accent/40 dark:hover:border-accent-light/40 transition-shadow duration-300"
    >
      {/* Header: title, subtitle, and link buttons */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-lg font-bold text-textPrimary dark:text-textPrimary-dark">
            {title}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {githubUrl && (
              <motion.a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${title} GitHub repository`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full bg-surfaceAlt dark:bg-surfaceAlt-dark text-textSecondary dark:text-textSecondary-dark hover:text-accent dark:hover:text-accent-light transition-colors duration-200"
              >
                <Github size={16} />
              </motion.a>
            )}
            {liveUrl && (
              <motion.a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${title} live demo`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full bg-surfaceAlt dark:bg-surfaceAlt-dark text-textSecondary dark:text-textSecondary-dark hover:text-accent dark:hover:text-accent-light transition-colors duration-200"
              >
                <ExternalLink size={16} />
              </motion.a>
            )}
          </div>
        </div>
        <p className="text-sm font-medium text-accent-hover dark:text-accent-light">
          {subtitle}
        </p>
      </div>

      {/* Description bullet points */}
      <ul className="flex-1 space-y-2 mb-5">
        {description.map((point, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-textSecondary dark:text-textSecondary-dark leading-relaxed"
          >
            <CircleDot
              size={14}
              className="mt-1 flex-shrink-0 text-accent dark:text-accent-light"
            />
            <span>{point}</span>
          </li>
        ))}
      </ul>

      {/* Tech stack badges */}
      <div className="flex flex-wrap gap-2">
        {techStack.map((tech) => (
          <span
            key={tech}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-surfaceAlt dark:bg-surfaceAlt-dark text-textSecondary dark:text-textSecondary-dark border border-border dark:border-border-dark"
          >
            {tech}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default ProjectCard;
