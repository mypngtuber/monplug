/**
 * Gemini Client for AstraCut
 * Strict Rules:
 * 1. Gemini is the ONLY AI in AstraCut.
 * 2. Audio-First: Only send transcript/audio features, never full raw video unless explicitly needed for visual index.
 * 3. Structured JSON output matching strict schema (never free text parsing).
 * 4. Model validation: check model availability dynamically; never replace non-available model silently.
 * 5. Cost control: cached fingerprints avoid repeated queries.
 */

export class GeminiClient {
  constructor(apiKey, modelId = 'gemini-2.5-pro') {
    this.apiKey = apiKey;
    this.modelId = modelId;
  }

  async validateKeyAndModel() {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      return { valid: false, error: 'API Key is missing. Please provide a valid Google Gemini API Key in Settings.' };
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        return { 
          valid: false, 
          error: errJson.error?.message || `Gemini API returned status ${response.status}: Unauthorized or Invalid Key.` 
        };
      }
      
      const data = await response.json();
      const models = data.models || [];
      const hasModel = models.some(m => m.name.includes(this.modelId) || m.name.endsWith(this.modelId));
      
      return {
        valid: true,
        modelExists: hasModel,
        modelId: this.modelId,
        availableModels: models.map(m => m.name.replace('models/', ''))
      };
    } catch (err) {
      return { valid: false, error: `Connection failed: ${err.message}` };
    }
  }

  /**
   * Audio-First Intelligence Analysis
   * Generates: Structured Transcript, Semantic Sections (Hook, Setup, CTA...), Silence candidates, Edit candidates
   */
  async analyzeAudioTranscript({ audioMeta, promptConstraint = '', duration = 60 }) {
    // If real Gemini key is not provided or live network test is mocked for local sandbox:
    if (!this.apiKey || this.apiKey.startsWith('demo_') || this.apiKey === 'TEST_KEY') {
      return this._generateMockAudioAnalysis(duration, promptConstraint);
    }

    const systemPrompt = `You are AstraCut, an expert video editor AI assisting in Adobe Premiere Pro.
You analyze audio transcript and generate a Frame-Accurate Edit Plan adhering to strict JSON schema.
RULES:
1. Preserve natural breathing, emotional pauses, and comedic timing. Do NOT delete silences purely because they are silent.
2. NEVER remove negations ("not", "never", "لا", "مش") or words that alter semantic intent.
3. Classify segments into Semantic Sections: Hook, Setup, Explanation, Example, Problem, Solution, Payoff, CTA.
4. Output ONLY valid JSON matching this schema:
{
  "transcript": [
    { "id": "seg_1", "start": 0.0, "end": 3.8, "text": "...", "speaker": "speaker_1", "confidence": 0.95, "type": "hook", "energy": 0.85, "keep": true }
  ],
  "semanticSections": [
    { "section": "Hook", "start": 0.0, "end": 4.2, "summary": "Attention-grabbing opening hook", "strength": 0.92 }
  ],
  "candidateCuts": [
    { "start": 12.0, "end": 14.5, "reason": "Filler stutter and duplicate phrase", "safeToRemove": true }
  ],
  "recommendedHook": { "segmentId": "seg_1", "text": "...", "start": 0.0, "end": 3.8 }
}`;

    const userPrompt = `Video Duration: ${duration}s.
User Requirements: ${promptConstraint || 'Create engaging reel, start with strongest hook, trim filler repetitions, preserve rhythm.'}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}:generateContent?key=${this.apiKey}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nTask:\n${userPrompt}` }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Gemini Error (${res.status}): ${err.error?.message || res.statusText}`);
    }

    const json = await res.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(rawText);
  }

  /**
   * Plan Generator: transforms user prompt + Audio Analysis + Material inventory into a Structured Edit Plan
   */
  async generateEditPlan({ audioAnalysis, materials, userInstruction, sequenceDuration, targetDuration = 35 }) {
    if (!this.apiKey || this.apiKey.startsWith('demo_') || this.apiKey === 'TEST_KEY') {
      return this._generateMockEditPlan(audioAnalysis, materials, userInstruction, targetDuration);
    }

    const systemPrompt = `You are the AstraCut Edit Planner for Adobe Premiere Pro.
Create a structured Edit Plan based on the audio analysis and project state.
Gemini decides the plan; AstraCut will validate and execute in Premiere.
Output valid JSON adhering to:
{
  "target_duration": number,
  "estimated_duration": number,
  "hook": { "source": "clip_01", "start": number, "end": number, "quote": string },
  "operations": [
    { "type": "keep"|"cut"|"trim"|"reorder", "source": string, "sourceIn": number, "sourceOut": number, "targetIn": number, "targetOut": number, "reason": string }
  ],
  "captions": [
    { "start": number, "end": number, "text": string, "highlight": string[], "style": "shorts"|"clean"|"kinetic"|"minimal" }
  ],
  "visualEffects": [
    { "type": "punch_in"|"punch_out"|"blur"|"shake"|"highlight"|"vignette", "start": number, "end": number, "intensity": number, "reason": string }
  ],
  "soundEffects": [
    { "type": "whoosh"|"impact"|"ui_click"|"riser", "start": number, "duration": number, "volume": number, "reason": string, "matchedMaterialId": string|null }
  ],
  "brollRequests": [
    { "start": number, "end": number, "duration": number, "description": string, "reason": string, "priority": "high"|"medium"|"low", "matchedMaterialId": string|null }
  ],
  "musicPlan": {
    "recommendedPrompt": string,
    "targetBpm": number,
    "mood": string,
    "matchedMaterialId": string|null,
    "duckingDb": -18
  }
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nAudio Analysis:\n${JSON.stringify(audioAnalysis)}\n\nProject Materials:\n${JSON.stringify(materials)}\n\nUser Goal:\n${userInstruction}` }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const json = await res.json();
    return JSON.parse(json.candidates?.[0]?.content?.parts?.[0]?.text);
  }

  // Realistic mock engine adhering 100% to specifications for demo/testing without incurring unnecessary API tokens
  _generateMockAudioAnalysis(duration, promptConstraint) {
    return {
      transcript: [
        { id: "seg_001", start: 0.0, end: 3.5, text: "الذكاء الاصطناعي بيغير كل قواعد المونتاج اليوم.", speaker: "speaker_1", confidence: 0.98, type: "hook", energy: 0.92, keep: true },
        { id: "seg_002", start: 3.8, end: 5.6, text: "يعني... آه... خليني أوضح الفكرة بالضبط.", speaker: "speaker_1", confidence: 0.88, type: "filler", energy: 0.54, keep: false },
        { id: "seg_003", start: 5.9, end: 11.2, text: "بدل ما تقضي 6 ساعات تقص سكوتات وتكتب كابشن يدوي، AstraCut بيعمل كل ده في ثواني.", speaker: "speaker_1", confidence: 0.96, type: "explanation", energy: 0.89, keep: true },
        { id: "seg_004", start: 11.5, end: 15.0, text: "الميزة الأهم إنه مش بيقص عمياني؛ بيحافظ على النفس والإيقاع الطبيعي.", speaker: "speaker_1", confidence: 0.94, type: "highlight", energy: 0.86, keep: true },
        { id: "seg_005", start: 15.4, end: 19.8, text: "الخوارزمية بتفحص النفي والمصطلحات عشان المعنى يفضل سليم 100%.", speaker: "speaker_1", confidence: 0.97, type: "solution", energy: 0.90, keep: true },
        { id: "seg_006", start: 20.2, end: 23.9, text: "جرب بنفسك وشوف الفرق في إنتاجيتك الآن!", speaker: "speaker_1", confidence: 0.99, type: "cta", energy: 0.94, keep: true }
      ],
      semanticSections: [
        { section: "Hook", start: 0.0, end: 3.5, summary: "Strong opening statement on AI video revolution", strength: 0.95 },
        { section: "Explanation", start: 5.9, end: 11.2, summary: "Time savings: 6 hours reduced to seconds", strength: 0.91 },
        { section: "Problem / Safety", start: 11.5, end: 19.8, summary: "Preserving natural breath, context, and negations", strength: 0.88 },
        { section: "CTA", start: 20.2, end: 23.9, summary: "Call to action to try AstraCut", strength: 0.94 }
      ],
      candidateCuts: [
        { start: 3.5, end: 5.9, reason: "Filler hesitation ('يعني... آه...') and duplicate pause", safeToRemove: true }
      ],
      recommendedHook: {
        segmentId: "seg_001",
        text: "الذكاء الاصطناعي بيغير كل قواعد المونتاج اليوم.",
        start: 0.0,
        end: 3.5
      }
    };
  }

  _generateMockEditPlan(audioAnalysis, materials = [], userInstruction = '', targetDuration = 30) {
    return {
      target_duration: targetDuration,
      estimated_duration: 21.8,
      hook: {
        source: "Interview_Clip_A01.mov",
        start: 0.0,
        end: 3.5,
        quote: "الذكاء الاصطناعي بيغير كل قواعد المونتاج اليوم."
      },
      operations: [
        {
          id: "op_1",
          type: "keep",
          source: "Interview_Clip_A01.mov",
          sourceIn: 0.0,
          sourceOut: 3.5,
          targetIn: 0.0,
          targetOut: 3.5,
          reason: "High energy Hook segment"
        },
        {
          id: "op_2",
          type: "cut",
          source: "Interview_Clip_A01.mov",
          sourceIn: 3.5,
          sourceOut: 5.9,
          targetIn: 3.5,
          targetOut: 3.5,
          reason: "Cut filler hesitation and long dead space"
        },
        {
          id: "op_3",
          type: "keep",
          source: "Interview_Clip_A01.mov",
          sourceIn: 5.9,
          sourceOut: 11.2,
          targetIn: 3.5,
          targetOut: 8.8,
          reason: "Core value explanation (6 hours to seconds)"
        },
        {
          id: "op_4",
          type: "keep",
          source: "Interview_Clip_A01.mov",
          sourceIn: 11.5,
          sourceOut: 19.8,
          targetIn: 8.8,
          targetOut: 17.1,
          reason: "Safety assurance & semantic integrity"
        },
        {
          id: "op_5",
          type: "keep",
          source: "Interview_Clip_A01.mov",
          sourceIn: 20.2,
          sourceOut: 23.9,
          targetIn: 17.1,
          targetOut: 20.8,
          reason: "Final Call to Action (CTA)"
        }
      ],
      captions: [
        { id: "cap_1", start: 0.0, end: 3.5, text: "الذكاء الاصطناعي بيغير قواعد المونتاج اليوم", highlight: ["الذكاء", "الاصطناعي"], style: "shorts" },
        { id: "cap_2", start: 3.5, end: 6.2, text: "بدل 6 ساعات شغل يدوي", highlight: ["6 ساعات"], style: "shorts" },
        { id: "cap_3", start: 6.2, end: 8.8, text: "AstraCut بيعمل كل ده في ثواني!", highlight: ["AstraCut", "ثواني"], style: "shorts" },
        { id: "cap_4", start: 8.8, end: 12.5, text: "بيحافظ على النفس والإيقاع الطبيعي", highlight: ["النفس", "الإيقاع"], style: "shorts" },
        { id: "cap_5", start: 12.5, end: 17.1, text: "الخوارزمية بتحمي النفي والمعنى تماماً", highlight: ["المعنى"], style: "shorts" },
        { id: "cap_6", start: 17.1, end: 20.8, text: "جرّب بنفسك وشوف الفرق الآن!", highlight: ["جرّب", "الفرق"], style: "shorts" }
      ],
      visualEffects: [
        { id: "vfx_1", type: "punch_in", start: 0.0, end: 1.8, intensity: 0.25, reason: "Initial punch-in to command viewer attention on hook" },
        { id: "vfx_2", type: "punch_in", start: 6.2, end: 8.8, intensity: 0.30, reason: "Punch in on product reveal ('AstraCut')" },
        { id: "vfx_3", type: "shake", start: 8.8, end: 9.15, intensity: 0.20, reason: "Subtle micro-shake on fast cut transition" }
      ],
      soundEffects: [
        { id: "sfx_1", type: "whoosh", name: "Fast Whoosh", start: 3.5, duration: 0.6, volume: -14, reason: "Smooth audio bridge over cut point", matchedMaterialId: null },
        { id: "sfx_2", type: "impact", name: "Deep Cinematic Sub Hit", start: 6.2, duration: 1.1, volume: -12, reason: "Emphasize key benefit punch", matchedMaterialId: null }
      ],
      brollRequests: [
        {
          id: "broll_1",
          start: 3.5,
          end: 7.0,
          duration: 3.5,
          name: "Video Editing Fast Workflow",
          description: "Close-up of editor timeline scrubbing fast, glowing waveforms or modern Premiere Pro UI",
          reason: "Visual support for ' بدل ما تقضي 6 ساعات '",
          priority: "high",
          matchedMaterialId: null
        }
      ],
      musicPlan: {
        recommendedPrompt: "Create a 30-second energetic modern tech beat, 108 BPM, subtle synth arpeggios, tight punchy groove, clean midrange leaving room for Arabic/English voiceover, subtle rise at 15s and clean crisp finish at 22s without abrupt clipping.",
        targetBpm: 108,
        mood: "Energetic, Modern, Focused",
        duckingDb: -18,
        matchedMaterialId: null
      }
    };
  }
}
