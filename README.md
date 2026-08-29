# Bridge Lesson Builder

Build a web app called Repurpose: an AI tool that rewrites educational material to match a new country's curriculum level and language, for refugee and migrant students facing curriculum mismatch. User uploads a PDF or pastes text from a textbook/worksheet. The app extracts the content, then uses AI to: (1) rewrite it at a specified target grade/reading level, (2) translate it into the student's chosen language, and (3) detect and flag "curriculum gap" concepts — ideas the new material assumes the student already knows but that may not have been taught in their home curriculum — generating a short "bridge lesson" for each gap. Display results in a side-by-side view: original text on the left, rewritten + gap-flagged version on the right, with bridge lessons expandable inline. Let the user adjust target grade level and language via simple dropdowns and regenerate instantly. Keep the interface minimal: one upload zone, one settings bar, one output view. For the demo, use a real textbook excerpt (e.g., a math or science page) and show the full pipeline — upload, rewrite, gap detection, bridge lesson — completing in under 30 seconds, since speed and clarity will read well on video.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://curriculum-bridge-builder.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a10fe538-704b-4f33-a3ff-c5a25218065f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
