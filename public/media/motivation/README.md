# MOTIVATION VIDEOS — "The Mindset" section

These files power the culture section on the public About page (`/about`).

Place the files in this folder:

    public/media/motivation/

## Required — the three videos

| File                                   | Card                          |
| -------------------------------------- | ----------------------------- |
| `build-something-that-matters.mp4`      | Build Something That Matters  |
| `keep-building.mp4`                     | Keep Building                 |
| `the-future-is-built.mp4`               | The Future Is Built           |

## Optional — poster images

Same basename, any of `.jpg` `.jpeg` `.png`:

    build-something-that-matters.jpg
    keep-building.jpg
    the-future-is-built.jpg

Without a poster, the card shows a neutral grid plate with the card number.
Nothing is downloaded, invented or substituted.

Drop the files in, refresh the page. Nothing else to change.

## Video format

Short, web-optimised files — not archival masters:

| | |
| --- | --- |
| container | MP4 |
| video | H.264, `yuv420p` pixel format (so every browser and phone can decode it) |
| audio | AAC |
| resolution | 720p or 1080p — 4K only slows playback down |
| length | short; 30–90 seconds works well |
| size | aim for under ~10 MB per clip |

A reasonable conversion, if you have ffmpeg:

```
ffmpeg -i input.mov -vf "scale=-2:1080" -c:v libx264 -preset slow -crf 23 \
       -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart output.mp4
```

`-movflags +faststart` matters: it moves the index to the front of the file so
playback can start before the whole thing has downloaded.

Poster images: a frame from the video at roughly 1600 × 900, saved as JPG at
~80% quality, keeps the card sharp without weighing the page down.

## How playback behaves

- Nothing is requested until a visitor clicks play — the cards render posters
  (or the plate) only, so this section costs the About page nothing on load.
- Clicking opens a centred player with the browser's own controls: play/pause,
  volume, seeking, fullscreen, captions if the file has them.
- Closing the player removes the video element, so playback always stops and
  two videos can never play at once.
- If an MP4 is missing, the player shows a plain "not added yet" panel with the
  expected path — never a broken media icon.

## Changing a filename or adding a fourth video

Everything lives in `src/data/motivation.js`. Edit the `video` / `poster` values
there, or add another entry to the array — the section, the grid and the player
all follow automatically.
