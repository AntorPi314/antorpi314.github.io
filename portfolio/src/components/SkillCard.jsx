import { motion } from 'framer-motion';
import ThanosPart from './ThanosPart.jsx';

/**
 * SkillCard renders one skill category: an icon, the category name,
 * and its list of skills as pill-shaped badges.
 * `index` is used purely to slightly stagger each card's entrance
 * animation so the grid doesn't pop in all at once.
 *
 * The card box itself (border/shadow/rounded background) never
 * disappears during a Thanos snap — only the icon+title+tags content
 * inside is wrapped in ThanosPart, so the empty card shell keeps its
 * exact size/layout while its contents fade to fully transparent
 * (and back), instead of any dust/particle animation.
 */
function SkillCard({ category, icon: Icon, skills, index = 0, partsRef }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.08 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="p-6 rounded-2xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark shadow-sm hover:shadow-lg hover:border-accent/40 dark:hover:border-accent-light/40 transition-shadow duration-300"
    >
      <ThanosPart sectionId="skills" partId={category} partsRef={partsRef}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-accent/10 dark:bg-accent/15 text-accent dark:text-accent-light">
            <Icon size={22} />
          </div>
          <h3 className="text-lg font-semibold text-textPrimary dark:text-textPrimary-dark">
            {category}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-surfaceAlt dark:bg-surfaceAlt-dark text-textSecondary dark:text-textSecondary-dark border border-border dark:border-border-dark"
            >
              {skill}
            </span>
          ))}
        </div>
      </ThanosPart>
    </motion.div>
  );
}

export default SkillCard;
