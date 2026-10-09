<div align="center">

# 🌿 TrackMe
### *Deep Focus Meets Spiritual Clarity*

```
     ╭─────────────────────────────────────────────────────────────╮
     │   وَقُل رَّبِّ زِدْنِي عِلْمًا  —  "My Lord, increase me in knowledge"   │
     ╰─────────────────────────────────────────────────────────────╯
```

**An offline-first personal mastery engine combining 45-minute deep-work Pomodoro sprints with Quran memorization (*حفظ وتدبر*) during breaks.**

[![License: NonCommercial](https://img.shields.io/badge/License-PolyForm%20NonCommercial-e11d48?style=for-the-badge)](LICENSE)
[![No Commercial Use](https://img.shields.io/badge/Commercial%20Use-Strictly%20Prohibited-black?style=for-the-badge)](LICENSE)
[![Offline First](https://img.shields.io/badge/Storage-IndexedDB%20(100%25%20Local)-059669?style=for-the-badge)](#-zero-cloud-privacy)
[![PWA Installable](https://img.shields.io/badge/PWA-iOS%20%26%20Android-f59e0b?style=for-the-badge)](#-install-on-your-phone)

<br />

```
               [ 45m Deep Work Sprint ] 
                          │
                   (Timer Rings 🔔)
                          ▼
            [ 15m Rest & Hifz Sanctuary ]
        • Read Vocalized Ayah in Arabic Calligraphy
        • Listen to Mishary Alafasy Tajweed Audio
        • Repeat & Memorize (Interactive Counter)
        • Absorb Daily Reflection (فائدة وتدبر)
                          │
                   (Next Sprint 🚀)
                          ▼
               [ 1-Click Session Logged ]
```

</div>

---

## 🧭 The Philosophy: Why TrackMe Exists

Most productivity apps treat breaks as empty downtime—nudging you toward mindless social media feeds, YouTube shorts, or dopamine traps that ruin attention spans and create mental fog for your next focus block.

**TrackMe flips the script:**

> *“Unquestionably, by the remembrance of Allah hearts are assured.”* — Surah Ar-Ra'd (13:28)

1. **45 Minutes of Unbroken Focus**: The optimal human cognitive window for entering a flow state (language practice, coding, technical courses, writing).
2. **15 Minutes of Rest & Barakah**: Instead of scrolling social media, spend your break with the words of Allah:
   - **Recite** with complete vocalization and Tashkeel.
   - **Listen** to accurate Tajweed audio recitation.
   - **Memorize** using the built-in repetition counter.
   - **Reflect** on practical takeaways for your daily character and mindset.
3. **100% Private & In Your Hands**: No subscriptions, no ads, no cloud accounts tracking you. All data resides solely in your browser's IndexedDB.

---

## ⚡ What Makes TrackMe Special?

### 1. ⏱️ Circular 45-Minute Pomodoro Timer
- **Fluid SVG Progress Ring**: Real-time circular progress animated with sub-pixel precision.
- **Dynamic Category Chromatics**: The timer's neon glow adapts automatically to match your program's category accent (Languages = Violet, Courses = Sky Blue, Skills = Coral, Sports = Emerald).
- **Zero-Asset Web Audio Bells**: Pleasant, harmonic chimes synthesized entirely via the browser's Web Audio API oscillators—no bulky audio files or network delays.
- **1-Click Instant Logging**: Completed your 45-minute sprint? Log it straight into your Dexie database with a single tap.

### 2. 📖 Quran Hifz (حفظ وتدبر) Rest Widget
- **Deterministic Day-of-Year Rotation**: Automatically presents today’s Ayah without requiring an internet connection or external server.
- **Vocalized Traditional Calligraphy**: Styled with Amiri and Scheherazade Uthmanic fonts with full diacritics (تَشْكِيل).
- **Audio Recitation on Demand**: Built-in audio streaming for Mishary Rashid Alafasy.
- **Interactive Repetition Counter**: Tap `+1 Repeat` to count your oral repetitions until the Ayah is committed to memory.
- **Mark as Memorized**: Track which Ayahs you have mastered over time.
- **Developer-Friendly Ayahs JSON**: Stored in a modular dataset (`src/data/ayahs.json`) that anyone can expand with new Ayahs, translations, and reflections.

### 3. 🎯 Multi-Category Program Architectures
Track anything with dedicated metrics tailored to each discipline:
- **Languages**: CEFR milestones (A1 → C2), vocabulary banks, immersion skills (Reading, Writing, Listening, Speaking radar).
- **Tech Courses & Coding**: Module progression, project builds, assignment reviews.
- **Habits & Discipline**: Streaks, daily adherence, target frequency.
- **Sports & Fitness**: Routine tracking, intensity levels, consistency.

### 4. 📅 Integrated Weekly Schedule & Calendar
- Weekly recurring day planners with time-of-day reminders (e.g. *Mon/Wed/Fri at 09:00*).
- 15-minute and 5-minute pre-session browser notifications.
- Unified calendar merging past session tracks with upcoming schedule commitments.

### 5. 🛡️ Zero-Cloud Privacy & Offline PWA
- **Dexie IndexedDB Engine**: Everything is stored locally on your device.
- **Full Offline Operation**: Works in airplane mode or with no Wi-Fi.
- **Installable PWA**: Installs as a standalone app on iPhone, iPad, Mac, and Android without going through an app store.

---

## 📱 Install on Your Phone (Takes 30 Seconds)

Because TrackMe is a Progressive Web App (PWA) with local IndexedDB storage, it behaves like an offline mobile app:

### 🍏 iPhone / iPad (Safari)
1. Open your deployed TrackMe link in **Safari**.
2. Tap the **Share** button (square with arrow pointing up).
3. Tap **Add to Home Screen** (`إضافة إلى الشاشة الرئيسية`).
4. Tap **Add** — TrackMe is now on your home screen with zero browser bars!

### 🤖 Android (Chrome)
1. Open the URL in **Google Chrome**.
2. Tap the menu dots (`⋮`) or the prompt banner at the bottom.
3. Tap **Install App** / **Add to Home screen**.

---

## 🛠️ The Architecture

```
track-me/
├── src/
│   ├── data/
│   │   └── ayahs.json              # 📖 Curated Quran Ayahs (Arabic, English, reflections, audio)
│   ├── core/
│   │   ├── db/                     # 💾 Dexie.js IndexedDB schema, repos, reactive hooks
│   │   ├── engine/                 # ⚙️ Goal calculation & dynamic validation engine
│   │   └── templates/              # 📋 Category templates (Languages, Courses, Skills, Habits)
│   ├── features/
│   │   ├── timer/                  # ⏱️ 45m Circular Pomodoro & Hifz Rest Session widget
│   │   ├── calendar/               # 📅 Calendar & Weekly recurring schedule planner
│   │   ├── today/                  # ☀️ Morning dashboard, streaks, goal progress
│   │   ├── log/                    # ⚡ Sub-15s rapid session logger
│   │   ├── programs/               # 📁 Program CRUD & comprehensive drill-down views
│   │   └── stats/                  # 📊 Interactive Recharts analytics
│   ├── lib/
│   │   ├── ayahs.ts                # 🌙 Ayah rotation logic, Hifz repetitions, storage
│   │   ├── chime.ts                # 🔔 Web Audio API procedural sound synthesizer
│   │   └── dates.ts                # 📆 Date arithmetic, week boundaries, streaks
│   └── stores/                     # 🎨 Zustand UI & theme store
├── netlify.toml                    # 🚀 Zero-config automated Netlify SPA deployment
└── public/_redirects               # 🔀 Client-side routing rewrite rules
```

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/Midou-Mni/track-me.git
cd track-me

# 2. Install dependencies
npm install

# 3. Launch Vite dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📖 How to Add More Ayahs (`src/data/ayahs.json`)

The Ayah database is intentionally kept as an open, readable JSON file so anyone can contribute:

```json
{
  "id": 16,
  "surah": "سورة طه",
  "surahEn": "Ta-Ha",
  "surahNumber": 20,
  "ayahNumber": 114,
  "arabic": "فَتَعَالَى اللَّهُ الْمَلِكُ الْحَقُّ ۗ وَلَا تَعْجَلْ بِالْقُرْآنِ مِن قَبْلِ أَن يُقْضَىٰ إِلَيْكَ وَحْيُهُ ۖ وَقُل رَّبِّ زِدْنِي عِلْمًا",
  "translation": "So high [above all] is Allah, the Sovereign, the Truth... and say: 'My Lord, increase me in knowledge.'",
  "benefit": "Du'a for seeking continuous increase in knowledge, patience in learning, and humility before wisdom.",
  "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.alafasy/2462.mp3"
}
```

Want to add your favorite Ayahs? Follow the guide in [CONTRIBUTING.md](CONTRIBUTING.md) and submit a Pull Request!

---

## 🗺️ Roadmap & Ideas for Contributors

Looking for a meaningful way to contribute? Here are features we’d love to see:

- [ ] **Spaced Repetition for Hifz**: Anki-style review intervals (1 day, 3 days, 7 days, 30 days) for memorized Ayahs.
- [ ] **Audio Speed Controller**: `0.75x`, `1.0x`, and `1.25x` recitation speed toggles.
- [ ] **Full Surah Context Modal**: Tap to view the 3 Ayahs before and after the current Ayah.
- [ ] **Data Export / Backup**: 1-click JSON backup & restore of your local database.
- [ ] **Ambient Soundscapes**: Optional subtle rain/nature brown-noise during the 45-minute focus session.
- [ ] **Custom Category Creator**: Allow users to design custom categories with custom fields directly in the UI.

---

## 📜 Non-Commercial License

This project is released under the **[PolyForm Noncommercial License 1.0.0](LICENSE)**.

```
                  ╔═════════════════════════════════════════════════╗
                  ║         STRICTLY NON-COMMERCIAL / NO PROFIT     ║
                  ╚═════════════════════════════════════════════════╝
```

- ✅ **Free for personal use, education, spiritual benefit, study, and research.**
- ✅ **Open for public contributions, forks, improvements, and community collaboration.**
- ❌ **Commercial use, selling, monetizing, charging fees, running ads, or profiting from this software or any derivatives is STRICTLY PROHIBITED.**

---

<div align="center">
  Crafted with care by <b><a href="https://github.com/Midou-Mni">Midou Mni</a></b> and open-source contributors.<br/>
  <sub>May every minute of focus and every Ayah memorized bring benefit and barakah.</sub>
</div>
