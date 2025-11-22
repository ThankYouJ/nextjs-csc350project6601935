Place your tutorial video file and optional poster image here for the instruction page.

Recommended filenames (the `page.js` currently references these):

- `sepolia-tutorial.mp4` — the tutorial video (MP4, H.264) that will autoplay, be muted, and loop.
- `sepolia-poster.png` — optional poster image shown before playback.

Notes and tips:

- For autoplay to work in most browsers, the video must be muted. The page sets `muted` and `playsInline`.
- Use a small, optimized MP4 (or WebM) for fast loading. Consider providing both `.webm` and `.mp4` for better compression and browser support.
- If you want captions, add a WebVTT file and a `<track kind="captions" src="/videos/sepolia-captions.vtt" srclang="en" label="English">` inside the `<video>` tag.

YouTube fallback:

- If you prefer to host the tutorial on YouTube, replace the anchor `https://www.youtube.com/watch?v=VIDEO_ID` in the instruction page with your video ID.
- To autoplay and loop a YouTube embed, you need `autoplay=1&mute=1&loop=1&playlist=VIDEO_ID` in the embed URL. Example iframe:

  <iframe
    src="https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&loop=1&controls=1&rel=0&modestbranding=1&playlist=VIDEO_ID"
    allow="autoplay; encrypted-media"
    style="width:100%; height:360px; border:0;"
    title="Sepolia setup tutorial"
  ></iframe>

Security/hosting:

- Files inside `/public` are served statically at the root of the site. Example: `/videos/sepolia-tutorial.mp4`.
- Keep file sizes small to avoid long load times for mobile users.

If you want, I can:
- Add a WebM source fallback and captions track to the page.
- Embed a YouTube iframe instead of the local video.
- Compress a sample tutorial video and place it in `/public/videos` (you'll need to provide the source file).
