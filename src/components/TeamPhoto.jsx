import { useMemo, useState } from 'react';
import { TEAM_IMAGE_EXTENSIONS } from '../data/team';

/**
 * TeamPhoto — a fixed-ratio portrait plate for a team card.
 *
 * The configured path is tried first; if the file is not there, the same
 * basename is retried with each supported extension. That is what lets a
 * .png be dropped into public/images/team/ even though the data file names
 * a .jpg. When nothing resolves, a neutral initials plate takes its place:
 * same dimensions, no broken-image icon, no layout shift, and never an
 * invented face.
 */
function buildCandidates(src) {
  if (!src) return [];
  const base = src.replace(/\.(jpe?g|png)$/i, '');
  return [...new Set([src, ...TEAM_IMAGE_EXTENSIONS.map(ext => base + ext)])];
}

function initialsOf(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('');
}

export default function TeamPhoto({ src, name, role }) {
  const candidates = useMemo(() => buildCandidates(src), [src]);
  const [attempt, setAttempt] = useState(0);

  // Reset during render if the card is pointed at a different file.
  const [lastSrc, setLastSrc] = useState(src);
  if (src !== lastSrc) {
    setLastSrc(src);
    setAttempt(0);
  }

  const exhausted = attempt >= candidates.length;
  const label = `${name} — ${role}`;

  return (
    <div className="team-photo">
      {exhausted ? (
        <div
          className="team-photo__fallback"
          role="img"
          aria-label={`${label}. Photo coming soon.`}
        >
          <span className="team-photo__initials" aria-hidden="true">
            {initialsOf(name)}
          </span>
        </div>
      ) : (
        <img
          className="team-photo__img"
          src={candidates[attempt]}
          alt={label}
          loading="lazy"
          decoding="async"
          onError={() => setAttempt(i => i + 1)}
        />
      )}
    </div>
  );
}
