# Contributing to TrackMe 🚀

Thank you for your interest in contributing to **TrackMe**! We welcome all contributions from the community — whether it's adding new features, fixing bugs, proposing new Quranic Ayahs for memorization, or improving documentation.

---

## 🌟 Ways to Contribute

1. **Add or Curate Ayahs for Hifz (`src/data/ayahs.json`)**
   - Suggest inspiring Ayahs with proper Arabic vocalization (tashkeel), verified translation, reflections, and audio recitation URLs.
2. **Add New Program Categories or Field Templates**
   - Expand beyond languages, tech courses, and skills with custom metrics and trackers.
3. **Enhance the UI / UX**
   - Polish animations, accessibility (a11y), responsive layouts, and themes.
4. **Fix Bugs & Improve Performance**
   - Solve reported issues, optimize IndexedDB queries, and improve PWA caching.

---

## 🛠️ Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or higher recommended)
- `npm` (version 10 or higher)
- [Git](https://git-scm.com/)

### Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/<your-username>/track-me.git
   cd track-me
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📖 How to Add or Edit Ayahs for Hifz

All Ayahs displayed during the Pomodoro rest sessions are located in:
📂 `src/data/ayahs.json`

Each entry follows this JSON schema:

```json
{
  "id": 16,
  "surah": "سورة الانشراح",
  "surahEn": "Ash-Sharh",
  "surahNumber": 94,
  "ayahNumber": 6,
  "arabic": "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
  "translation": "Indeed, with hardship [will be] ease.",
  "benefit": "A powerful reminder that every trial is accompanied by divine ease.",
  "audioUrl": "https://cdn.islamic.network/quran/audio/128/ar.alafasy/6096.mp3"
}
```

### Guidelines for Ayahs:
- Ensure Arabic text includes **accurate diacritics / vocalization (Tashkeel)**.
- Include a thoughtful **practical reflection / benefit** (*فائدة وتدبر*).
- Use high-quality audio recitation URLs (recommended: Islamic Network CDN format `https://cdn.islamic.network/quran/audio/128/ar.alafasy/{ayahIndex}.mp3`).

---

## 🧪 Quality Checks & Validation

Before submitting your Pull Request, please ensure your code passes all checks:

```bash
# 1. Check TypeScript types and build
npm run build

# 2. Run fast linter
npm run lint
```

---

## 🔀 Submitting a Pull Request (PR)

1. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Commit your changes**:
   ```bash
   git commit -m "feat: add your descriptive feature message"
   ```
3. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
4. **Open a Pull Request** against the `main` branch of `Midou-Mni/track-me`.
5. Clearly describe what changed and link any relevant issues.

## 📜 Non-Commercial Policy

This project is released strictly under the **PolyForm Noncommercial License 1.0.0**.

By contributing to TrackMe, you agree that:
- TrackMe is and will remain free, non-commercial, and open for study and personal growth.
- Neither this project nor any derivative works may be commercialized, monetized, sold, or used to generate profit.

---

## 💬 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Please be respectful, constructive, and helpful when interacting with fellow contributors.

Thank you for helping make TrackMe better for everyone! ❤️
