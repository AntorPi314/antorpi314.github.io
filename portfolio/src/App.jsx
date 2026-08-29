import { useEffect, useRef, useState } from 'react';
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
import AiTerminal from './components/AiTerminal.jsx';
import ThanosHand, { ThanosTarget } from './components/ThanosHand.jsx';

// The 6 sections the gauntlet snaps through, each independently
// scrollable-to and dust-able. "hero" only affects one small phrase
// inside the Hero intro (the rest of Hero always stays visible and
// Hero is still not a full disappearing section). "contact" bundles
// the Footer in too, since the footer has no separate nav anchor of
// its own.
const THANOS_SECTION_IDS = ['hero', 'about', 'skills', 'projects', 'education', 'contact'];

// How long after the page first loads before it auto-scrolls back to
// the very top (e.g. if the browser restored a mid-page scroll
// position, or the URL had a hash anchor that jumped the page down).
const AUTO_SCROLL_TOP_DELAY_MS = 1000;

/**
 * App is the root component. As of Step 9, every section has real
 * content: Hero, About, Skills, Projects (all 10 entries), Education,
 * and Contact, plus a Footer below the last section. Remaining steps
 * (10-12) focus on animation polish, responsive QA, and deployment
 * rather than new content sections.
 */
function App() {
  // Thanos snap state: true once a full snap sequence has completed,
  // false once the reverse sequence completes. Navbar/Terminal stay
  // untouched so the page never becomes unnavigable. Hero is now a
  // scroll target too (id "hero"), but only one small inline phrase
  // inside it actually fades (see Hero.jsx / partsRef) — the rest of
  // Hero (name, photo, buttons, etc) always stays visible.
  const [snapped, setSnapped] = useState(false);

  // Map<sectionId, HTMLElement>, populated by each ThanosTarget below.
  // ThanosHand reads from this to scroll to each section by id during
  // its random-order sequence (scrolling still happens per-section;
  // only the dust effect itself now happens per-part inside it).
  const targetsRef = useRef(new Map());
  const registerTarget = (id, el) => {
    if (el) targetsRef.current.set(id, el);
    else targetsRef.current.delete(id);
  };

  // Map<sectionId, Map<partId, apiRef>>, populated by every ThanosPart
  // nested inside each section (one SkillCard, one ProjectCard, the
  // About paragraph, one EducationItem, one Contact row, etc). This is
  // what actually gets dusted/reassembled now — the section/card boxes
  // themselves never disappear, only their inner content.
  const partsRef = useRef(new Map());

  // 1 second after the page first mounts, smoothly scroll back to the
  // very top. Runs once on mount only (empty deps) — this is not tied
  // to the Thanos snap sequence at all, it's purely a load-time reset.
  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, AUTO_SCROLL_TOP_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <FlyingBird />
      <ThanosHand
        snapped={snapped}
        onToggle={setSnapped}
        targetsRef={targetsRef}
        partsRef={partsRef}
        sectionIds={THANOS_SECTION_IDS}
      />
      <Navbar />

      {/* id="home" is required here since the navbar logo links to it. */}
      <ThanosTarget id="hero" register={registerTarget}>
        <Section id="home" className="pt-12 md:pt-14">
          <Hero partsRef={partsRef} />
        </Section>
      </ThanosTarget>

      <Section id="terminal">
        <AiTerminal />
      </Section>

      <ThanosTarget id="about" register={registerTarget}>
        <Section id="about" alt>
          <About partsRef={partsRef} />
        </Section>
      </ThanosTarget>

      <ThanosTarget id="skills" register={registerTarget}>
        <Section id="skills">
          <Skills partsRef={partsRef} />
        </Section>
      </ThanosTarget>

      <ThanosTarget id="projects" register={registerTarget}>
        <Section id="projects" alt>
          <Projects partsRef={partsRef} />
        </Section>
      </ThanosTarget>

      <ThanosTarget id="education" register={registerTarget}>
        <Section id="education">
          <Education partsRef={partsRef} />
        </Section>
      </ThanosTarget>

      <ThanosTarget id="contact" register={registerTarget}>
        <Section id="contact" alt>
          <Contact partsRef={partsRef} />
        </Section>
        <Footer />
      </ThanosTarget>
    </div>
  );
}

export default App;
