// Centralized personal/profile information.
// Keeping this in one place means Hero, Contact, and Footer sections
// (built in later steps) can all import from here instead of
// duplicating the same strings and links.
export const personalInfo = {
  name: 'Antor Hawlader',
  title: 'Software Engineer',
  // The tagline is split into three pieces (before / snapPhrase / after)
  // so Hero.jsx can wrap just the middle phrase in its own ThanosPart —
  // that phrase fades to fully transparent on a Thanos snap while the
  // rest of the sentence always stays visible. `tagline` (the full
  // concatenated string) is kept too, for anywhere the split isn't
  // needed (e.g. the AI terminal's system prompt / typing test).
  taglineBefore: 'Software Engineer with strong hands-on experience across full-stack, mobile, ',
  taglineSnapPhrase:
    'and ML-based projects. Skilled in building production-ready applications from scratch, including MERN stack platforms, Flutter apps, ',
  taglineAfter:
    'native Android apps, and offline-first BLE communication systems.',
  location: 'Dhaka, Cantonment - 1206',
  phone: '+8801957472909',
  email: 'antorhawlader50@gmail.com',
  socials: {
    github: 'https://github.com/AntorPi314',
    linkedin: 'https://linkedin.com/in/antor-hawlader',
    email: 'mailto:antorhawlader50@gmail.com',
    // Same phone number as above, in international format (88 + number)
    // as required by WhatsApp's click-to-chat link format.
    whatsapp: 'https://wa.me/8801957472909',
  },
};

// Convenience export of the full tagline (used anywhere the split
// pieces aren't needed individually, e.g. AI terminal context).
personalInfo.tagline = personalInfo.taglineBefore + personalInfo.taglineSnapPhrase + personalInfo.taglineAfter;

// Full About/Overview paragraph, taken directly from the CV.
// Kept separate from the shorter Hero tagline so each section can
// use the length of text that fits its layout best.
export const aboutText =
  'Software Engineer with strong hands-on experience across full-stack, mobile, and ML-based projects. Skilled in building production-ready applications from scratch, including MERN stack platforms, Flutter apps, native Android apps, and offline-first BLE communication systems. Background in competitive programming (ICPC). Strong problem-solving mindset with a habit of building tools that solve real, uncommon problems.';

