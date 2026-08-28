import { Code, Layout, Server, Palette, Smartphone, Cpu } from 'lucide-react';

// Skills grouped by category, matching the CV's structure exactly.
// Each category has a Lucide icon component reference (not JSX yet,
// so it can be rendered dynamically inside SkillCard with <Icon />).
export const skillCategories = [
  {
    category: 'Languages',
    icon: Code,
    skills: ['C', 'C++', 'JavaScript', 'Python', 'Java', 'Dart'],
  },
  {
    category: 'Frontend',
    icon: Layout,
    skills: ['React', 'Tailwind CSS', 'Axios'],
  },
  {
    category: 'Backend',
    icon: Server,
    skills: ['Express.js', 'Nest.js', 'MongoDB', 'Firebase'],
  },
  {
    category: 'UI/UX',
    icon: Palette,
    skills: ['Design Systems', 'Tailwind', 'Figma'],
  },
  {
    category: 'Mobile',
    icon: Smartphone,
    skills: ['Flutter', 'Android Native (Java, Dart, XML)'],
  },
  {
    category: 'Others',
    icon: Cpu,
    skills: ['Machine Learning', 'DeepFace', 'REST API', 'Git'],
  },
];
