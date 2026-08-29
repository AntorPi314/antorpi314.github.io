// Config + content for the terminal's "typing test" mode.
//
// Every category here is intentionally Antor-related — this is HIS
// terminal, so the typing practice text should be about him too, just
// told from a different angle each time (a little story, his skills,
// his projects, or a motivational note about his journey) so it stays
// fresh across repeated tests instead of repeating the same sentences.
//
// Gemini's ONLY job is to generate the paragraph to type — nothing else
// about the test (duration, category, WPM calc, etc.) touches the AI.
// If the Gemini call fails for any reason, we fall back to one of the
// 3 hardcoded texts below (picked at random) so the feature still works
// with zero network dependency.

import { personalInfo, aboutText } from './personalInfo.js';
import { skillCategories } from './skills.js';
import { projects } from './projects.js';

export const TYPING_DURATIONS = [30, 60, 120];

export const TYPING_CATEGORIES = [
  {
    id: 'story',
    label: 'A story about Antor',
    // Prompt fragment describing what kind of text to generate.
    promptHint: `a short, warm, slightly narrative "little story" or scene about ${personalInfo.name} as a developer — e.g. imagining him debugging late at night, shipping a feature, learning something new, or solving a tricky problem. Keep it grounded and plausible given his real background, not fantastical`,
  },
  {
    id: 'skills',
    label: 'His skills',
    promptHint: `a natural-sounding paragraph describing ${personalInfo.name}'s technical skills and the kind of work he does with them, based on his real skill set`,
  },
  {
    id: 'projects',
    label: 'His projects',
    promptHint: `a natural-sounding paragraph describing one or more of ${personalInfo.name}'s real projects, what they do and what he built them with`,
  },
  {
    id: 'journey',
    label: 'His journey',
    promptHint: `a short motivational, reflective paragraph about ${personalInfo.name}'s growth and journey as a software engineer — written the way an inspiring short passage about a developer's persistence and learning would read`,
  },
];

// Builds the (small, focused) instruction sent to Gemini for typing-test
// text only. Kept separate from aiSystemPrompt.js on purpose — this has
// nothing to do with the Q&A assistant persona, though it reuses the
// same real facts about Antor so the generated text stays accurate.
export function buildTypingPrompt(category, wordCount) {
  const cat = TYPING_CATEGORIES.find((c) => c.id === category) || TYPING_CATEGORIES[0];

  const skillsText = skillCategories.map((c) => `${c.category}: ${c.skills.join(', ')}`).join('; ');
  const projectsText = projects
    .map((p) => `${p.title} (${p.category}) — ${p.subtitle}, built with ${p.techStack.join(', ')}`)
    .join('; ');

  return `You are generating typing-test practice text for a portfolio website's typing game. The text must be about ${personalInfo.name}, a ${personalInfo.title}.

Write: ${cat.promptHint}.

Real facts you can draw from (use them accurately, don't invent unrelated facts, but you don't need to use all of them):
- About: ${aboutText}
- Skills: ${skillsText}
- Projects: ${projectsText}

Rules:
- Output ONLY the plain text to be typed. No title, no quotes around it, no markdown, no bullet points, no color tags, no preamble like "Here is your text".
- Refer to him in third person ("he", "${personalInfo.name.split(' ')[0]}"), never first person.
- Vary your wording, structure, and which facts you pick each time — do not always start the same way or reuse the same sentences, so repeated tests feel different.
- Target length: approximately ${wordCount} words (a little over or under is fine, do not pad with filler to hit the number exactly).
- Use plain, standard punctuation only (periods, commas). Avoid special characters, em dashes, quotation marks, parentheses, or symbols that are awkward to type.
- Keep it as one flowing block of text (multiple sentences), suitable for a monospace typing-test display.`;
}

// 3 fixed fallback texts (frontend-only, no network), all about Antor so
// the theme stays consistent even when Gemini is unreachable. One is
// picked at random whenever the Gemini call fails. Kept short-to-medium
// so they can be reused regardless of the requested word count.
export const TYPING_FALLBACK_TEXTS = [
  `${personalInfo.name} is a software engineer who enjoys turning a rough idea into a working application from scratch. He has built full stack platforms with the MERN stack, mobile apps with Flutter, native Android apps, and offline first systems using BLE communication. Late nights spent chasing a stubborn bug taught him more patience than any tutorial ever could. Every project on his portfolio started the same way, as a small idea he decided to actually finish.`,
  `Across his projects, ${personalInfo.name} has worked with React, Node, MongoDB, Flutter, and native Android development, moving comfortably between frontend polish and backend logic. He treats every bug as a puzzle worth solving rather than an obstacle to rush past. Building production ready applications from scratch is something he keeps coming back to, because there is a certain satisfaction in watching a project go from an empty folder to something people can actually use.`,
  `${personalInfo.name.split(' ')[0]}'s journey as a developer has been shaped less by big breakthroughs and more by steady, consistent progress on real projects. He believes clean, understandable code matters more than clever code, and that shipping something imperfect teaches more than waiting for it to be perfect. From mobile apps to offline first systems, each project has pushed him to learn a little more than the last one did.`,
];

export function getRandomFallbackText() {
  return TYPING_FALLBACK_TEXTS[Math.floor(Math.random() * TYPING_FALLBACK_TEXTS.length)];
}
