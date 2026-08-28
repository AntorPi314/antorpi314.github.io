import { motion } from 'framer-motion';
import SectionHeading from './SectionHeading.jsx';
import { aboutText } from '../data/personalInfo.js';

function About() {
  return (
    <div>
      <SectionHeading
        title="About Me"
        subtitle="A quick overview of who I am and what I build."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        className="max-w-3xl mx-auto p-8 md:p-10 rounded-2xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark shadow-sm"
      >
        <p className="text-base md:text-lg leading-relaxed text-textSecondary dark:text-textSecondary-dark">
          {aboutText}
        </p>
      </motion.div>
    </div>
  );
}

export default About;
