import Navbar from './components/Navbar.jsx';
import Section from './components/Section.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Skills from './components/Skills.jsx';
import Projects from './components/Projects.jsx';
import Education from './components/Education.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import FlyingBird from './components/FlyingBird.jsx';

/**
 * App is the root component. As of Step 9, every section has real
 * content: Hero, About, Skills, Projects (all 10 entries), Education,
 * and Contact, plus a Footer below the last section. Remaining steps
 * (10-12) focus on animation polish, responsive QA, and deployment
 * rather than new content sections.
 */
function App() {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <FlyingBird />
      <Navbar />

      {/* id="home" is required here since the navbar logo links to it. */}
      <Section id="home" className="pt-24 md:pt-28">
        <Hero />
      </Section>

      <Section id="about" alt>
        <About />
      </Section>

      <Section id="skills">
        <Skills />
      </Section>

      <Section id="projects" alt>
        <Projects />
      </Section>

      <Section id="education">
        <Education />
      </Section>

      <Section id="contact" alt>
        <Contact />
      </Section>

      <Footer />
    </div>
  );
}

export default App;
