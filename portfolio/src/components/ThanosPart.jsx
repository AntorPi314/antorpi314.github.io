import { useEffect, useRef, useState } from 'react';

// How long the fade to/from transparent takes. Kept short and simple —
// this is a plain opacity transition, not a particle animation.
const FADE_MS = 400;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ThanosPart wraps one *sub-part* of a section (a single SkillCard,
 * ProjectCard, EducationItem, the About card, one Contact row, etc.)
 * so it can be hidden/shown individually, instead of the whole section
 * disappearing as one block.
 *
 * This does NOT dust, dissolve, or otherwise animate the content away —
 * it simply fades opacity to 0 (fully transparent) and back to 1. The
 * content keeps its layout space (visibility/pointer-events are toggled,
 * not display), so surrounding cards/boxes never reflow or break.
 *
 * `sectionId` groups parts together (e.g. all SkillCard instances
 * register under "skills"); `partId` must be unique within that
 * section. `partsRef` is a Map<sectionId, Map<partId, apiRef>> ref
 * that lives in App.jsx and gets read by ThanosHand, mirroring how
 * ThanosTarget/targetsRef already works for whole sections. The
 * exposed api ({ disintegrate, reassemble }) keeps the same method
 * names ThanosHand already calls, even though the effect itself is
 * now just a fade — renaming would mean touching ThanosHand too.
 *
 * `as` picks the wrapper tag: 'div' (default) for block content like
 * card bodies, 'span' for a phrase sitting inline inside a <p> (e.g.
 * one sentence within a larger paragraph) where a <div> would be
 * invalid HTML and break text flow.
 */
function ThanosPart({ sectionId, partId, partsRef, className = '', as: Tag = 'div', children }) {
  const apiRef = useRef(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!partsRef) return undefined;

    apiRef.current = {
      disintegrate: async () => {
        setHidden(true);
        await wait(FADE_MS);
      },
      reassemble: async () => {
        setHidden(false);
        await wait(FADE_MS);
      },
    };

    if (!partsRef.current.has(sectionId)) {
      partsRef.current.set(sectionId, new Map());
    }
    const sectionMap = partsRef.current.get(sectionId);
    sectionMap.set(partId, apiRef);

    return () => {
      sectionMap.delete(partId);
      if (sectionMap.size === 0) partsRef.current.delete(sectionId);
      apiRef.current = null;
    };
  }, [sectionId, partId, partsRef]);

  return (
    <Tag
      className={className}
      style={{
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? 'none' : undefined,
        transition: `opacity ${FADE_MS}ms ease`,
      }}
      aria-hidden={hidden || undefined}
    >
      {children}
    </Tag>
  );
}

export default ThanosPart;
