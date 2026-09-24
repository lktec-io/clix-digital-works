/* =============================================================
   TEAM — single source of truth for the public About page.
   -------------------------------------------------------------
   TEAM PHOTOS
   -----------
   Place team photos inside:

       public/images/team/

   Supported formats: .jpg  .jpeg  .png

   Expected files (one per card):
     - leonard-kusekwa-founder-ceo.jpg
     - christina-francis-project-manager-qa.jpg
     - leonard-kusekwa-lead-backend.jpg
     - christina-fransic-uiux-frontend.jpg
     - festo-chambika-mobile-engineer.jpg
     - leonard-kusekwa-ai-data.jpg

   Drop the file in, refresh the page — nothing else to change.

   The extension in `image` below is only the FIRST thing tried. If that
   file is missing, the same basename is retried as .jpg, .jpeg and .png
   before the card falls back to a neutral initials plate, so a .png works
   even though the path below says .jpg. To use a different filename
   entirely, just edit the `image` value on that card.

   NOTE ON DUPLICATE NAMES: the same person may appear on more than one
   card because they hold more than one role. Cards are deliberately NOT
   deduplicated, and each has its own `image`, so every role can carry a
   different photo. `id` (not `name`) is the React key.
   ============================================================= */

export const TEAM_IMAGE_DIR = '/images/team/';

/** Extensions tried, in order, when the configured file is not found. */
export const TEAM_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

export const TEAM = [
  {
    id: 'founder-ceo',
    name: 'Leonard Kusekwa',
    role: 'Founder & CEO',
    image: '/images/team/leonard-kusekwa-founder-ceo.jpg',
    bio: 'Full-stack engineer and visionary behind Clix Digital Works. Passionate about leveraging technology to solve real African business problems.',
    skills: ['React', 'Node.js', 'System Design'],
    color: '#19C39B',
  },
  {
    id: 'project-manager-qa',
    name: 'Christina Francis',
    role: 'Project Manager & QA Lead',
    image: '/images/team/christina-francis-project-manager-qa.jpg',
    bio: 'Ensures every project is delivered on time, within scope, and exceeds quality standards through rigorous testing and clear communication.',
    skills: ['Agile', 'QA Testing', 'Client Relations'],
    color: '#3B7DFF',
  },
  {
    id: 'lead-backend',
    name: 'Leonard Kusekwa',
    role: 'Lead Backend Engineer',
    image: '/images/team/leonard-kusekwa-lead-backend.jpg',
    bio: 'Experienced in building scalable APIs, database architecture, and cloud infrastructure that power enterprise-grade applications.',
    skills: ['Node.js', 'MySQL', 'DevOps'],
    color: '#19C39B',
  },
  {
    id: 'uiux-frontend',
    name: 'Christina Fransic',
    role: 'UI/UX & Frontend Lead',
    image: '/images/team/christina-fransic-uiux-frontend.jpg',
    bio: 'Crafts pixel-perfect, accessible interfaces with a keen eye for design systems, user psychology, and modern web aesthetics.',
    skills: ['React', 'Figma', 'CSS Architecture'],
    color: '#3B7DFF',
  },
  {
    id: 'mobile-engineer',
    name: 'Festo Chambika',
    role: 'Mobile App Engineer',
    image: '/images/team/festo-chambika-mobile-engineer.jpg',
    bio: 'Specialises in cross-platform mobile applications delivering native-quality experiences for Android and iOS users.',
    skills: ['React Native', 'Flutter', 'API Integration'],
    color: '#19C39B',
  },
  {
    id: 'ai-data',
    name: 'Leonard Kusekwa',
    role: 'AI & Data Engineer',
    image: '/images/team/leonard-kusekwa-ai-data.jpg',
    bio: 'Builds machine learning pipelines, predictive models, and intelligent automation tools that give our clients a competitive edge.',
    skills: ['Python', 'TensorFlow', 'Data Analysis'],
    color: '#3B7DFF',
  },
];

export default TEAM;
