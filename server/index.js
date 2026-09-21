import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { SUPPORTED_MODELS, SUPPORTED_EFFECTS, CAPTION_PRESETS } from './models.js';
import { LocalCache } from './cache.js';
import { AudioService } from './audioService.js';
import { GeminiClient } from './geminiClient.js';
import { EditEngine } from './editEngine.js';
import { MaterialManager } from './materialManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize state & cache
const cache = new LocalCache('astracut_project');
const materialManager = new MaterialManager();

let currentProjectState = {
  projectName: "Tech_Interview_Episode_42.prproj",
  sequence: {
    name: "Interview_Main",
    duration: 23.9,
    fps: 29.97,
    resolution: "1920x1080",
    videoTracks: 3,
    audioTracks: 4,
    clipsCount: 1,
    audioExtracted: false
  },
  settings: {
    apiKey: "demo_gemini_key_auto_enabled",
    modelId: "gemini-2.5-pro",
    autoSafeCopy: true,
    requireApproval: true,
    enableValidation: true,
    cacheEnabled: true
  },
  lockedElements: [
    { id: "lock_01", type: "section", name: "Guest Introduction", start: 0.0, end: 1.5 }
  ],
  versionHistory: [],
  currentPlan: null,
  audioAnalysis: null,
  chatMessages: [
    {
      id: "msg_init",
      sender: "ai",
      text: "مرحباً بك في AstraCut! قمت بفحص الـ Sequence الحالي (Interview_Main). هل تحب نبدأ بعمل Audio Analysis واستخراج الـ Hook الأقوى للـ Reel؟",
      timestamp: new Date().toLocaleTimeString()
    }
  ]
};

// 1. Project & Status APIs
app.get('/api/project', (req, res) => {
  res.json({
    success: true,
    projectState: currentProjectState,
    supportedModels: SUPPORTED_MODELS,
    supportedEffects: SUPPORTED_EFFECTS,
    captionPresets: CAPTION_PRESETS,
    materials: materialManager.getAll(),
    cacheStats: cache.getStats()
  });
});

// 2. Settings & Gemini Validation
app.post('/api/settings', async (req, res) => {
  const { apiKey, modelId, autoSafeCopy, requireApproval, enableValidation } = req.body;
  if (apiKey !== undefined) currentProjectState.settings.apiKey = apiKey;
  if (modelId !== undefined) currentProjectState.settings.modelId = modelId;
  if (autoSafeCopy !== undefined) currentProjectState.settings.autoSafeCopy = autoSafeCopy;
  if (requireApproval !== undefined) currentProjectState.settings.requireApproval = requireApproval;
  if (enableValidation !== undefined) currentProjectState.settings.enableValidation = enableValidation;

  const client = new GeminiClient(currentProjectState.settings.apiKey, currentProjectState.settings.modelId);
  const validation = await client.validateKeyAndModel();

  res.json({
    success: true,
    settings: currentProjectState.settings,
    modelValidation: validation
  });
});

// 3. Audio-First Extraction & Analysis (Core Optimization)
app.post('/api/audio/analyze', async (req, res) => {
  try {
    const { promptConstraint, targetDuration } = req.body;
    
    // Check cache first to avoid paying Gemini API tokens multiple times
    const cacheKey = `audio_analysis_${currentProjectState.sequence.name}_${Math.round(currentProjectState.sequence.duration)}`;
    let analysis = cache.get(cacheKey);

    if (!analysis) {
      const client = new GeminiClient(currentProjectState.settings.apiKey, currentProjectState.settings.modelId);
      analysis = await client.analyzeAudioTranscript({
        duration: currentProjectState.sequence.duration,
        promptConstraint
      });
      cache.set(cacheKey, analysis);
    }

    currentProjectState.audioAnalysis = analysis;
    currentProjectState.sequence.audioExtracted = true;

    // Build initial Edit Plan with Gemini
    const client = new GeminiClient(currentProjectState.settings.apiKey, currentProjectState.settings.modelId);
    const plan = await client.generateEditPlan({
      audioAnalysis: analysis,
      materials: materialManager.getAll(),
      userInstruction: promptConstraint || "اعمل ريل دقيقة، ابدأ بأقوى جملة، شيل التكرار والسكتات، واعمل كابشن واقترح B-roll",
      sequenceDuration: currentProjectState.sequence.duration,
      targetDuration: targetDuration || 22
    });

    currentProjectState.currentPlan = plan;
    const missingMaterials = materialManager.findMissingMaterials(plan);

    res.json({
      success: true,
      audioAnalysis: analysis,
      editPlan: plan,
      missingMaterials
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Edit Plan & Validation
app.post('/api/plan/validate', (req, res) => {
  const plan = req.body.plan || currentProjectState.currentPlan;
  const validation = EditEngine.validatePlan(plan, currentProjectState);
  res.json({ success: true, validation });
});

// 5. Execution (Safe Sequence Copy & Premiere Apply)
app.post('/api/plan/execute', (req, res) => {
  try {
    const plan = req.body.plan || currentProjectState.currentPlan;
    if (!plan) {
      return res.status(400).json({ success: false, error: "No edit plan to execute." });
    }

    const execResult = EditEngine.executePlan(
      plan,
      currentProjectState.sequence,
      currentProjectState.versionHistory
    );

    currentProjectState.versionHistory.unshift(execResult.safeSequence);

    res.json({
      success: true,
      executedSequence: execResult.safeSequence,
      qualityCheck: execResult.qualityCheck,
      versionHistory: currentProjectState.versionHistory
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Rollback Engine
app.post('/api/rollback', (req, res) => {
  const { versionId } = req.body;
  if (!versionId || versionId === 'original') {
    res.json({
      success: true,
      message: `Rolled back to original sequence: ${currentProjectState.sequence.name}`,
      activeSequence: currentProjectState.sequence
    });
    return;
  }

  const ver = currentProjectState.versionHistory.find(v => v.versionId === versionId);
  if (!ver) {
    return res.status(404).json({ success: false, error: "Version not found." });
  }

  res.json({
    success: true,
    message: `Rolled back to safe copy: ${ver.sequenceName}`,
    activeSequence: ver
  });
});

// 7. Materials Management
app.get('/api/materials', (req, res) => {
  res.json({
    success: true,
    materials: materialManager.getAll(),
    missing: currentProjectState.currentPlan ? materialManager.findMissingMaterials(currentProjectState.currentPlan) : []
  });
});

app.post('/api/materials/add', (req, res) => {
  const newMat = materialManager.addMaterial(req.body);
  res.json({ success: true, material: newMat, materials: materialManager.getAll() });
});

app.delete('/api/materials/:id', (req, res) => {
  materialManager.removeMaterial(req.params.id);
  res.json({ success: true, materials: materialManager.getAll() });
});

// 8. Locks (Clips, Sections, Tracks)
app.post('/api/locks/toggle', (req, res) => {
  const { id, type, name, start, end } = req.body;
  const existingIdx = currentProjectState.lockedElements.findIndex(l => l.id === id);

  if (existingIdx >= 0) {
    currentProjectState.lockedElements.splice(existingIdx, 1);
  } else {
    currentProjectState.lockedElements.push({ id, type, name, start, end });
  }

  res.json({ success: true, lockedElements: currentProjectState.lockedElements });
});

// 9. Context-Aware Chat
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message empty" });

  currentProjectState.chatMessages.push({
    id: `msg_${Date.now()}`,
    sender: "user",
    text: message,
    timestamp: new Date().toLocaleTimeString()
  });

  // Fast rule-based + generative simulation for Project-Aware Chat
  let aiReply = "";
  const lower = message.toLowerCase();

  if (lower.includes('أقوى') || lower.includes('hook') || lower.includes('بداية')) {
    aiReply = "تم ضبط خطة المونتاج لتبدأ مباشرة بـ Hook المقابلة: 'الذكاء الاصطناعي بيغير كل قواعد المونتاج اليوم'، مع إضافة Punch-in 1.2x في أول ثانيتين لشد انتباه المشاهد فوراً.";
    if (currentProjectState.currentPlan) {
      currentProjectState.currentPlan.visualEffects.push({
        id: `vfx_${Date.now()}`,
        type: "punch_in",
        start: 0,
        end: 2.0,
        intensity: 0.35,
        reason: "User requested stronger dynamic hook opening"
      });
    }
  } else if (lower.includes('كابشن') || lower.includes('caption') || lower.includes('shorts')) {
    aiReply = "قمت بتطبيق كابشن Shorts بلون أصفر ناصع مع Highlight ذكي للكلمات المحورية ('الذكاء', '6 ساعات', 'AstraCut').";
  } else if (lower.includes('sfx') || lower.includes('صوت') || lower.includes('whoosh')) {
    aiReply = "تم إدراج Fast Whoosh عند نقطة الانتقال 03.5s وDeep Sub Impact عند نقطة 06.2s لتعزيز الإيقاع الصوتي، وبحثت عن الملف في مواد المشروع.";
  } else if (lower.includes('رجع') || lower.includes('rollback')) {
    aiReply = "يمكنك الضغط على زر Rollback في تبويب Execution لاسترجاع أي نسخة سابقة بأمان تام دون المساس بالـ Sequence الأصلي.";
  } else {
    aiReply = `فهمت طلبك: "${message}". قمت بتحديث خطة التعديل في الـ Memory المحلية. يمكنك معاينة التغييرات في تبويب Edit Plan قبل الموافقة على التنفيذ.`;
  }

  const aiMessage = {
    id: `msg_${Date.now() + 1}`,
    sender: "ai",
    text: aiReply,
    timestamp: new Date().toLocaleTimeString()
  };

  currentProjectState.chatMessages.push(aiMessage);

  res.json({
    success: true,
    messages: currentProjectState.chatMessages,
    updatedPlan: currentProjectState.currentPlan
  });
});

// Cache operations
app.post('/api/cache/clear', (req, res) => {
  cache.clear();
  res.json({ success: true, message: "Cache successfully cleared." });
});

// Serve frontend in production or proxy
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AstraCut Engine] Listening on port ${PORT}`);
});
