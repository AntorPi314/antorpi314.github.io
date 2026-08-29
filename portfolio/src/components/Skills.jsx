import SectionHeading from './SectionHeading.jsx';
import SkillCard from './SkillCard.jsx';
import { skillCategories } from '../data/skills.js';

function Skills({ partsRef }) {
  return (
    <div>
      <SectionHeading
        title="Skills"
        subtitle="Technologies and tools I work with across the full stack."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {skillCategories.map((item, index) => (
          <SkillCard
            key={item.category}
            category={item.category}
            icon={item.icon}
            skills={item.skills}
            index={index}
            partsRef={partsRef}
          />
        ))}
      </div>
    </div>
  );
}

export default Skills;
