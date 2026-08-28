/**
 * Section is a reusable layout wrapper used by every page section
 * (Hero, About, Skills, Projects, Education, Contact, etc.).
 * It standardizes:
 *   - max width and horizontal padding (via the inner container)
 *   - vertical spacing between sections
 *   - the `id` attribute used for navbar anchor scrolling
 *   - alternating background color (via the `alt` prop) to visually
 *     separate consecutive sections
 */
function Section({ id, alt = false, className = '', children }) {
  return (
    <section
      id={id}
      className={`w-full transition-colors duration-300 ${
        alt
          ? 'bg-surfaceAlt dark:bg-surfaceAlt-dark'
          : 'bg-background dark:bg-background-dark'
      } ${className}`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-24">
        {children}
      </div>
    </section>
  );
}

export default Section;
