# 🌉 Repurpose

**AI-powered curriculum bridge for refugee and migrant students.**
Upload any textbook page. Get it rewritten, translated, gap-checked, and read aloud — in under 30 seconds.

![status](https://img.shields.io/badge/status-live-brightgreen)
![built for](https://img.shields.io/badge/built%20for-SPEED%20August%20AI%20Challenge-blueviolet)
![license](https://img.shields.io/badge/license-MIT-lightgrey)

---

## 💡 The Problem

Every year, millions of displaced students enroll in schools that don't match the curriculum they came from. A 10th grader from Syria might land in a Kenyan classroom mid-way through a physics unit that assumes concepts they were never taught — in a language they're still learning to read.

Teachers don't have time to individually translate and rebuild lesson plans for every new arrival. Students fall behind not because they can't learn — but because the *bridge* between what they know and what's being taught doesn't exist.

**Repurpose builds that bridge, automatically.**

---

## ✨ What It Does

| Step | What happens |
|------|---------------|
| 📄 **Upload** | Drop a PDF or paste text from any textbook/worksheet |
| 🎯 **Rewrite** | AI rewrites content at the student's target grade/reading level |
| 🌍 **Translate** | Instantly translated into the student's chosen language |
| 🕳️ **Gap Detection** | Flags concepts the new material assumes but the student's home curriculum may not have covered |
| 🌉 **Bridge Lessons** | Generates a short, plain-language mini-lesson for every detected gap |
| 🔊 **Listen** | Read-aloud in the target language — for students still building reading fluency |
| 🏳️ **Curriculum Context** | Select the student's home country/curriculum for sharper, more accurate gap detection |

All in one screen. One run. Under 30 seconds.

---

## 🎬 See It In Action

> **Real test run:** Grade 10 Physics (*Simple Harmonic Motion*) → rewritten for Grade 8, translated to Swahili
> ⏱️ Completed in **17.4s** · 🕳️ **2 gaps detected** · 🌉 **2 bridge lessons generated** · ✅ Zero console errors

```
[Original: Grade 10, English]        →        [Rewritten: Grade 8, Swahili]
"The restoring force is directly              "Nguvu inayorudisha kitu mahali
 proportional to displacement..."              pake ni sawa na umbali..."

                                                ⚠️ Gap detected: "proportional"
                                                🌉 Bridge Lesson: What does
                                                   'proportional' mean? →
                                                   [expand]
```

---

## 🧩 Features at a Glance

- 🖥️ **Single-screen interface** — upload zone, settings bar, output view. No clutter, no learning curve.
- 🌐 **Language + grade + curriculum-origin dropdowns** — instantly regenerate output with new settings.
- 📊 **Side-by-side comparison** — original vs. rewritten, always visible together.
- 🔍 **Inline expandable bridge lessons** — click to reveal, click to collapse.
- 🔊 **Text-to-speech in target language** — for pre-literate or emerging readers.
- 🏳️ **Curriculum-aware gap detection** — compares against the student's actual home curriculum, not generic assumptions.
- ⚡ **Fast** — full pipeline (rewrite → translate → detect → bridge) completes in ~15-20 seconds.

---

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript, minimalist Bauhaus-inspired UI
- **AI Pipeline:** LLM-based rewrite, translation, and gap-detection chain
- **Text-to-Speech:** Multilingual TTS gateway for read-aloud output
- **PDF Parsing:** In-browser text extraction — no server upload required

---

## 🚀 Try It

1. Drop in a PDF or paste text from any textbook page
2. Set target grade level, language, and (optionally) the student's home curriculum
3. Hit generate — watch the rewrite, gaps, and bridge lessons appear
4. Click 🔊 Listen to hear any section read aloud

---

## 🎯 Why It Matters

This isn't a translation tool. It's a **curriculum-gap-aware learning bridge** — built for the moment a displaced student opens a textbook that was never written for them, and needs a way in.

Built for the **SPEED August AI Challenge** — educational tools that make learning more accessible, engaging, and personalized.

---

## 📜 License

MIT
