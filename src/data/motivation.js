/* =============================================================
   THE MINDSET — motivation/culture videos for the public About page.
   -------------------------------------------------------------
   VIDEOS
   ------
   Place video files inside:

       public/media/motivation/

   Required (one per card):
     - build-something-that-matters.mp4
     - keep-building.mp4
     - the-future-is-built.mp4

   Optional poster images, same folder, same basename:
     - build-something-that-matters.jpg
     - keep-building.jpg
     - the-future-is-built.jpg

   Drop the files in, refresh the page. Nothing else to change.

   The poster extension below is only the first thing tried: .jpg, .jpeg and .png
   are all attempted with the same basename, so any of those
   works. With no poster, the card shows a neutral technical plate — never a
   broken image and never a stock photo.

   Nothing is requested from the network until the visitor clicks play: the
   cards render posters (or the plate) only, and the <video> element is
   created when the player opens. That keeps the About page's load cost
   unchanged whether or not the videos exist.

   FILE GUIDANCE — short, web-optimised files, not archival masters:
     container  MP4
     video      H.264 (yuv420p so every browser and phone can decode it)
     audio      AAC
     resolution 720p or 1080p — 4K is not needed and only slows playback
     length     short; 30–90s works well
     size       aim under ~10 MB per clip
   ============================================================= */

export const MOTIVATION_MEDIA_DIR = '/media/motivation/';

/** Extensions tried, in order, when a poster file is not found. */
export const POSTER_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

export const MOTIVATION_VIDEOS = [
  {
    id: 'build-something-that-matters',
    title: 'Build Something That Matters',
    description: 'Technology earns its place when it solves a real problem for real people.',
    category: 'Purpose',
    video: '/media/motivation/build-something-that-matters.mp4',
    poster: '/media/motivation/build-something-that-matters.jpg',
  },
  {
    id: 'keep-building',
    title: 'Keep Building',
    description: 'Learning, iteration and the discipline to improve after something breaks.',
    category: 'Craft',
    video: '/media/motivation/keep-building.mp4',
    poster: '/media/motivation/keep-building.jpg',
  },
  {
    id: 'the-future-is-built',
    title: 'The Future Is Built',
    description: 'Engineering is how what comes next stops being an idea and starts working.',
    category: 'Future',
    video: '/media/motivation/the-future-is-built.mp4',
    poster: '/media/motivation/the-future-is-built.jpg',
  },
];

export default MOTIVATION_VIDEOS;
