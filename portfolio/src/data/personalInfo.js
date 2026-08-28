// Centralized personal/profile information.
// Keeping this in one place means Hero, Contact, and Footer sections
// (built in later steps) can all import from here instead of
// duplicating the same strings and links.
export const personalInfo = {
  name: 'Antor Hawlader',
  title: 'Software Engineer',
  tagline:
    'Software Engineer with strong hands-on experience across full-stack, mobile, and ML-based projects. Skilled in building production-ready applications from scratch, including MERN stack platforms, Flutter apps, native Android apps, and offline-first BLE communication systems.',
  location: 'Dhaka, Cantonment - 1206',
  phone: '01957472909',
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

// Full About/Overview paragraph, taken directly from the CV.
// Kept separate from the shorter Hero tagline so each section can
// use the length of text that fits its layout best.
export const aboutText =
  'Software Engineer with strong hands-on experience across full-stack, mobile, and ML-based projects. Skilled in building production-ready applications from scratch, including MERN stack platforms, Flutter apps, native Android apps, and offline-first BLE communication systems. Background in competitive programming (ICPC). Strong problem-solving mindset with a habit of building tools that solve real, uncommon problems.';

