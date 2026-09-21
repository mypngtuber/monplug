# AstraCut — AI Editing Assistant for Adobe Premiere Pro

AstraCut is an intelligent editing assistant plugin running directly inside **Adobe Premiere Pro** (UXP / CEP) and powered strictly and solely by **Google Gemini**.

---

## 🌟 Core Philosophy & Design Principles

1. **Gemini is the ONLY AI Engine**: No OpenAI, Claude, Whisper, ElevenLabs, or third-party AI APIs.
2. **Audio-First Cost Optimization**:
   - Rather than sending multi-gigabyte video files to Gemini, AstraCut extracts the audio locally via **FFmpeg**.
   - Gemini receives the speech/transcript to map out hooks, semantic intent, pauses, and repetition.
   - Visual analysis is only called on-demand when semantic video context (e.g. physical gestures, screen recordings) is required.
3. **Preservation of Natural Speech & Breathing**:
   - Silences are **never** removed merely because they are quiet.
   - Pauses that preserve dramatic effect, natural breath, comedic timing, or emphasis are maintained.
   - Negations (`not`, `never`, `لا`, `مش`), proper nouns, and meaning-altering words are strictly protected.
4. **Structured JSON Schema**:
   - Gemini never outputs unparsed free text; responses strictly conform to validated JSON schemas.
5. **Safe Sequence System & Non-Destructive Editing**:
   - The original sequence is **never** overwritten by default.
   - Every execution creates a versioned safe clone (`[Sequence]__AstraCut_v001`, `v002`...).
   - Instant 1-click **Rollback** to any previous version or the original timeline.
6. **Material Inventory & Missing Asset Cards**:
   - AstraCut inventories project media (video, b-roll, audio, SFX, music, overlays, graphics, logos, fonts).
   - If an Edit Plan requires an asset (e.g. a Fast Whoosh SFX or B-roll of coding screen) that does not exist in the project, it issues a dedicated **Material Request Card**:
     - `[Choose From Project]`
     - `[Choose From Device]`
     - `[Search in Browser]` (constructs Google search query with disclaimer on royalty-free licenses)
     - `[Skip]`
7. **Music System via Prompt Engineering**:
   - Gemini generates tailored music prompts matching exact timeline BPM, mood, and dialogue ducking without requiring a paid music API.
8. **Full RTL & Arabic Support**:
   - Fully bilingual interface (Arabic & English) designed to match Adobe Premiere Pro's native dark theme and panel conventions.

---

## 🚀 Quickstart & Running Locally

### 1. Install & Build
```bash
npm install
npm run build
```

### 2. Run the Service
```bash
# Starts the AstraCut Core Engine & Premiere Panel on port 5000
npm start
```

### 3. Premiere Pro Installation
- The plugin includes `manifest.json` for **Adobe UXP Developer Tool** (PPRO >= 22.0) and `host/premiereBridge.jsx` for ExtendScript/CEP bridges.
- Load the manifest in UXP Developer Tool to dock the panel directly inside Adobe Premiere Pro.
