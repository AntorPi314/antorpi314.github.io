import SectionHeading from './SectionHeading.jsx';
import EducationItem from './EducationItem.jsx';
import { education } from '../data/education.js';

/**
 * Education section. Renders a vertical timeline of all education
 * history, most recent first, using EducationItem for each entry.
 * The sequential entrance animation (each item fading/sliding in
 * slightly after the previous one) is handled inside EducationItem
 * via its `index`-based transition delay.
 */
function Education({ partsRef }) {
  return (
    <div>
      <SectionHeading
        title="Education"
        subtitle="My academic background, from secondary school to university."
      />

      <div className="max-w-2xl mx-auto">
        {education.map((item, index) => (
          <EducationItem
            key={item.id}
            id={item.id}
            institution={item.institution}
            degree={item.degree}
            period={item.period}
            details={item.details}
            index={index}
            isLast={index === education.length - 1}
            partsRef={partsRef}
          />
        ))}
      </div>
    </div>
  );
}

export default Education;
