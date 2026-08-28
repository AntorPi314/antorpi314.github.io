import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SectionHeading from './SectionHeading.jsx';
import ProjectCard from './ProjectCard.jsx';
import { projects } from '../data/projects.js';

// Category filter options. 'All' always shows every project;
// the rest are derived from the unique `category` values in the
// project data, in a fixed display order.
const CATEGORY_ORDER = ['All', 'Web', 'Mobile', 'Hardware', 'ML'];

/**
 * Projects section. Renders all 10 projects from the data file in a
 * responsive grid (1 col mobile, 2 col tablet, 3 col desktop), with
 * an optional category filter above the grid. Switching categories
 * animates the grid out/in smoothly via Framer Motion's
 * AnimatePresence, instead of an abrupt re-render.
 */
function Projects() {
  const [activeCategory, setActiveCategory] = useState('All');

  // Only show filter buttons for categories that actually exist
  // in the data, so the UI never offers an empty filter.
  const availableCategories = useMemo(() => {
    const present = new Set(projects.map((project) => project.category));
    return CATEGORY_ORDER.filter(
      (category) => category === 'All' || present.has(category)
    );
  }, []);

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'All') return projects;
    return projects.filter((project) => project.category === activeCategory);
  }, [activeCategory]);

  return (
    <div>
      <SectionHeading
        title="Projects"
        subtitle="A selection of full-stack, mobile, hardware, and ML-based projects I've built from scratch."
      />

      {/* Category filter buttons */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {availableCategories.map((category) => {
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={isActive}
              className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'text-white dark:text-textPrimary-dark'
                  : 'text-textSecondary dark:text-textSecondary-dark hover:text-textPrimary dark:hover:text-textPrimary-dark'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="project-filter-pill"
                  className="absolute inset-0 rounded-full bg-accent dark:bg-accent-light -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              {category}
            </button>
          );
        })}
      </div>

      {/* Responsive project grid: 1 col mobile, 2 col tablet, 3 col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <ProjectCard
                title={project.title}
                subtitle={project.subtitle}
                description={project.description}
                techStack={project.techStack}
                githubUrl={project.githubUrl}
                liveUrl={project.liveUrl}
                index={index}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state, shown only if a category somehow has no projects */}
      {filteredProjects.length === 0 && (
        <p className="text-center text-textSecondary dark:text-textSecondary-dark mt-8">
          No projects in this category yet.
        </p>
      )}
    </div>
  );
}

export default Projects;
