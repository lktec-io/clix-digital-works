# TEAM PHOTOS

Place team photos in this folder:

    public/images/team/

Supported formats:

    .jpg
    .jpeg
    .png

## Expected files

One photo per card on the public About page (`/about`):

| File                                        | Card                                        |
| ------------------------------------------- | ------------------------------------------- |
| `leonard-kusekwa-founder-ceo.jpg`           | Leonard Kusekwa — Founder & CEO             |
| `christina-francis-project-manager-qa.jpg`  | Christina Francis — Project Manager & QA Lead |
|`leonard-kusekwa-lead-backend.jpg`          | Leonard Kusekwa — Lead Backend Engineer     |
| `christina-fransic-uiux-frontend.jpg`       | Christina Fransic — UI/UX & Frontend Lead   |
| `festo-chambika-mobile-engineer.jpg`        | Festo Chambika — Mobile App Engineer        |
| `leonard-kusekwa-ai-data.jpg`               | Leonard Kusekwa — AI & Data Engineer        |

Drop a file in, refresh the page. Nothing else to change.

## Notes

- **The `.jpg` extension above is not required.** Keep the same basename and use
  `.png` or `.jpeg` if you prefer — the page tries all three before giving up.
- **Same person, several cards.** Leonard appears on three cards and Christina on
  two because each holds more than one role. Each card has its own file, so you
  can use a different photo per role (or copy the same photo to each filename).
- **Missing photos are safe.** A card with no photo shows a neutral plate with the
  person's initials at exactly the same size — no broken image, no layout shift.
- **Portrait crop.** Each plate is 4:5 and the photo is cropped to fill it
  (`object-fit: cover`), centred slightly above middle so faces sit well. Roughly
  square or portrait source images work best; ~600 × 750px or larger keeps them
  sharp on high-density screens.
- **Different filename?** Edit the `image` value for that card in
  `src/data/team.js` — that is the only place team photo paths live.
