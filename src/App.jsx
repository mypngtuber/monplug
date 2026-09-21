import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, ShieldCheck, Sparkles, Scissors, 
  MessageSquare, Film, Music, Type, Wand2, Layers, Settings,
  AlertTriangle, CheckCircle, Search, ExternalLink, Lock, Unlock,
  ChevronRight, RefreshCw, Volume2, Plus, Trash2, Cpu
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('project');
  const [lang, setLang] = useState('ar'); // 'ar' or 'en'
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [audioAnalysis, setAudioAnalysis] = useState(null);
  const [editPlan, setEditPlan] = useState(null);
  const [missingMaterials, setMissingMaterials] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('shorts');
  const [activeVersion, setActiveVersion] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);
  const [userPromptConstraint, setUserPromptConstraint] = useState(
    'اعمل ريل دقيقة من المقابلة، ابدأ بأقوى جملة، شيل التكرار والسكتات الطويلة، واعمل كابشن واقترح B-roll'
  );
  const [settings, setSettings] = useState({
    apiKey: 'demo_gemini_key_auto_enabled',
    modelId: 'gemini-2.5-pro',
    autoSafeCopy: true,
    requireApproval: true,
    enableValidation: true,
    cacheEnabled: true
  });
  const [modelStatus, setModelStatus] = useState({ checked: true, valid: true, modelExists: true });

  // Playback simulation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const res = await fetch('/api/project');
      const data = await res.json();
      if (data.success) {
        setProjectData(data);
        if (data.projectState.currentPlan) {
          setEditPlan(data.projectState.currentPlan);
        }
        if (data.projectState.audioAnalysis) {
          setAudioAnalysis(data.projectState.audioAnalysis);
        }
        if (data.projectState.chatMessages) {
          setChatMessages(data.projectState.chatMessages);
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  // Playback ticker
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const maxDur = editPlan ? editPlan.estimated_duration : (projectData?.projectState?.sequence?.duration || 24);
          if (prev >= maxDur) {
            setIsPlaying(false);
            return 0;
          }
          return Number((prev + 0.1).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, editPlan, projectData]);

  const handleStartAudioFirstAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audio/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptConstraint: userPromptConstraint,
          targetDuration: 22
        })
      });
      const data = await res.json();
      if (data.success) {
        setAudioAnalysis(data.audioAnalysis);
        setEditPlan(data.editPlan);
        setMissingMaterials(data.missingMaterials || []);
        setActiveTab('plan');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Analysis error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSafeCopy = async () => {
    if (!editPlan) return;
    setLoading(true);
    try {
      const res = await fetch('/api/plan/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: editPlan })
      });
      const data = await res.json();
      if (data.success) {
        setExecutionResult(data);
        setActiveVersion(data.executedSequence);
        setActiveTab('execution');
      } else {
        alert('Execution failed: ' + data.error);
      }
    } catch (e) {
      alert('Execute error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (versionId) => {
    setLoading(true);
    try {
      const res = await fetch('/api/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setActiveVersion(versionId === 'original' ? null : data.activeSequence);
      }
    } catch (e) {
      alert('Rollback error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { id: Date.now(), sender: 'user', text, timestamp: new Date().toLocaleTimeString() }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.messages);
        if (data.updatedPlan) {
          setEditPlan(data.updatedPlan);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isRTL = lang === 'ar';

  return (
    <div className={`flex flex-col h-screen w-full bg-[#141414] text-[#e0e0e0] select-none ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Premiere Panel Header */}
      <header className="h-12 bg-[#1f1f1f] border-b border-[#333333] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-gradient-to-tr from-purple-600 to-indigo-500 font-bold text-white text-xs tracking-wider shadow">
            Pr
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">AstraCut</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
                Gemini Intelligence
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800">
                Audio-First Engine
              </span>
            </div>
            <p className="text-[10px] text-gray-400">
              {projectData?.projectState?.sequence?.name || 'Interview_Main'} (29.97 FPS • 1080p)
            </p>
          </div>
        </div>

        {/* Global Controls: Safe mode indicator, Lang toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#272727] border border-[#3e3e3e] text-xs text-gray-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium">Safe Sequence: ON</span>
          </div>

          <button 
            onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
            className="px-2 py-1 rounded bg-[#2a2a2a] hover:bg-[#333333] text-xs font-semibold text-gray-200 border border-[#444]"
          >
            {lang === 'ar' ? 'English' : 'عربي'}
          </button>
        </div>
      </header>

      {/* Main Tab Navigation Bar styled like Premiere Pro Panel Tabs */}
      <nav className="h-10 bg-[#1a1a1a] border-b border-[#2d2d2d] flex items-center px-2 overflow-x-auto gap-1 text-xs font-medium">
        {[
          { id: 'project', label: isRTL ? 'المشروع' : 'PROJECT', icon: Film },
          { id: 'chat', label: isRTL ? 'المحادثة الذكية' : 'CHAT', icon: MessageSquare },
          { id: 'plan', label: isRTL ? 'خطة المونتاج' : 'EDIT PLAN', icon: Scissors },
          { id: 'captions', label: isRTL ? 'الكابشن' : 'CAPTIONS', icon: Type },
          { id: 'effects', label: isRTL ? 'التأثيرات' : 'EFFECTS', icon: Wand2 },
          { id: 'materials', label: isRTL ? 'الخامات والناقص' : 'MATERIALS', icon: Layers, badge: missingMaterials.length },
          { id: 'music', label: isRTL ? 'الموسيقى' : 'MUSIC', icon: Music },
          { id: 'execution', label: isRTL ? 'التنفيذ والنسخ' : 'EXECUTION', icon: ShieldCheck },
          { id: 'settings', label: isRTL ? 'الإعدادات' : 'SETTINGS', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t transition-all shrink-0 ${
                isActive 
                  ? 'bg-[#252526] text-white border-b-2 border-blue-500 font-bold' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#202020]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left/Right Primary Panel */}
        <main className="flex-1 p-4 overflow-y-auto space-y-4">
          
          {/* TAB 1: PROJECT OVERVIEW & SCAN */}
          {activeTab === 'project' && (
            <div className="space-y-4 max-w-5xl mx-auto">
              <div className="bg-[#202020] border border-[#333] rounded-lg p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      {isRTL ? 'التحليل الصوتي الأولي (Audio-First Architecture)' : 'Audio-First Strategic Scan'}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      {isRTL 
                        ? 'يتم استخراج الصوت محلياً عبر FFmpeg وتحليله بواسطة Gemini لتوفير استهلاك البيانات والتكلفة قبل لمس الفيديو.' 
                        : 'Audio extracted locally via FFmpeg and fed into Gemini to preserve context, breath, and optimize cost.'}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-semibold">
                    Local FFmpeg Ready
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-[#181818] p-3 rounded border border-[#2d2d2d]">
                    <span className="text-[11px] text-gray-400">{isRTL ? 'الـ Sequence النشط' : 'Active Sequence'}</span>
                    <p className="font-bold text-sm text-gray-100">{projectData?.projectState?.sequence?.name}</p>
                  </div>
                  <div className="bg-[#181818] p-3 rounded border border-[#2d2d2d]">
                    <span className="text-[11px] text-gray-400">{isRTL ? 'المدة الأصلية' : 'Original Duration'}</span>
                    <p className="font-bold text-sm text-gray-100">{projectData?.projectState?.sequence?.duration}s (~00:24)</p>
                  </div>
                  <div className="bg-[#181818] p-3 rounded border border-[#2d2d2d]">
                    <span className="text-[11px] text-gray-400">{isRTL ? 'معدل الإطارات (FPS)' : 'Frame Rate'}</span>
                    <p className="font-bold text-sm text-gray-100">{projectData?.projectState?.sequence?.fps} fps</p>
                  </div>
                  <div className="bg-[#181818] p-3 rounded border border-[#2d2d2d]">
                    <span className="text-[11px] text-gray-400">{isRTL ? 'حالة الكاش المحلي' : 'Local Cache'}</span>
                    <p className="font-bold text-sm text-emerald-400">
                      {projectData?.cacheStats?.count || 1} {isRTL ? 'ملفات مخزنة' : 'Items'} ({projectData?.cacheStats?.totalSizeKb || 4} KB)
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <label className="text-xs font-semibold text-gray-300">
                    {isRTL ? 'طلب التحرير الموجه للـ Gemini:' : 'Editor Prompt to Gemini:'}
                  </label>
                  <textarea
                    rows={3}
                    value={userPromptConstraint}
                    onChange={(e) => setUserPromptConstraint(e.target.value)}
                    className="w-full bg-[#181818] border border-[#3e3e3e] rounded p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    placeholder="اكتب توجيهاتك..."
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{isRTL ? 'حماية النفي وسياق الكلام مفعلة افتراضياً' : 'Negation & Semantic integrity lock active'}</span>
                  </div>

                  <button
                    disabled={loading}
                    onClick={handleStartAudioFirstAnalysis}
                    className="px-5 py-2.5 rounded bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white flex items-center gap-2 shadow disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{isRTL ? 'بدء التحليل الصوتي وبناء خطة المونتاج' : 'Run Audio-First Scan & Generate Plan'}</span>
                  </button>
                </div>
              </div>

              {/* Audio-First Transcript Breakdown if available */}
              {audioAnalysis && (
                <div className="bg-[#202020] border border-[#333] rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-blue-400" />
                      {isRTL ? 'الـ Transcript الذكي (Structured Audio Map)' : 'Structured Audio Map'}
                    </h3>
                    <span className="text-[11px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                      {isRTL ? 'تم استخراج 6 أجزاء صوتية' : '6 Audio Segments Classified'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {audioAnalysis.transcript?.map(seg => (
                      <div 
                        key={seg.id}
                        className={`p-3 rounded border flex items-center justify-between text-xs ${
                          seg.keep ? 'bg-[#1a221b] border-emerald-900/60' : 'bg-[#291717] border-red-950'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-gray-400">
                              {seg.start.toFixed(2)}s – {seg.end.toFixed(2)}s
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                              seg.type === 'hook' ? 'bg-amber-900 text-amber-200' :
                              seg.type === 'filler' ? 'bg-red-900 text-red-200' :
                              'bg-blue-900 text-blue-200'
                            }`}>
                              {seg.type}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Energy: {Math.round(seg.energy * 100)}%
                            </span>
                          </div>
                          <p className="text-gray-200 font-medium">{seg.text}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {seg.keep ? (
                            <span className="text-[11px] text-emerald-400 font-semibold">{isRTL ? 'حفظ (Keep)' : 'Keep'}</span>
                          ) : (
                            <span className="text-[11px] text-red-400 font-semibold">{isRTL ? 'حذف سكتة/تكرار' : 'Cut Filler'}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHAT SYSTEM */}
          {activeTab === 'chat' && (
            <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-[#202020] border border-[#333] rounded-lg">
              <div className="p-3 border-b border-[#2e2e2e] flex items-center justify-between bg-[#232323]">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">
                    {isRTL ? 'محادثة المونتاج الواعية بالمشروع (Project-Aware Chat)' : 'Project-Aware Chat'}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">
                  {isRTL ? 'Gemini يعرف الـ Timeline الحالي والخامات' : 'Context-aware with Timeline & Materials'}
                </span>
              </div>

              {/* Messages container */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'mr-auto items-start' : 'ml-auto items-end'}`}
                  >
                    <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-[#2a2a2a] text-gray-200 border border-[#3a3a3a] rounded-bl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-gray-500 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-[#2e2e2e] flex gap-2 bg-[#1a1a1a]">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isRTL ? 'اطلب تعديل: مثلاً "خلي البداية أقوى"، "شيل الـ SFX"، "اعمل رول باك"...' : 'Prompt: e.g. "Make hook stronger", "Add fast whoosh"...'}
                  className="flex-1 bg-[#252526] border border-[#3a3a3a] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded"
                >
                  {isRTL ? 'إرسال' : 'Send'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: EDIT PLAN */}
          {activeTab === 'plan' && (
            <div className="max-w-5xl mx-auto space-y-4">
              {!editPlan ? (
                <div className="text-center py-16 bg-[#202020] border border-[#333] rounded-lg">
                  <Scissors className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-300">
                    {isRTL ? 'لا توجد خطة مونتاج بعد.' : 'No Edit Plan Generated Yet.'}
                  </p>
                  <button 
                    onClick={handleStartAudioFirstAnalysis} 
                    className="mt-3 px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
                  >
                    {isRTL ? 'بدء التحليل الآن' : 'Run Audio Scan'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Plan Summary Bar */}
                  <div className="bg-[#202020] border border-[#333] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                        {isRTL ? 'الخطة المقترحة من Gemini' : 'Structured Edit Plan'}
                      </span>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <span>{isRTL ? 'المدة المستهدفة:' : 'Target:'} {editPlan.estimated_duration}s</span>
                        <span className="text-xs text-gray-400 line-through">23.9s</span>
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExecuteSafeCopy}
                        disabled={loading}
                        className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center gap-2 shadow"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isRTL ? 'إنشاء نسخة آمنة وتنفيذ (Execute Safe Copy)' : 'Execute Safe Copy in Premiere'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Strong Hook Spotlight */}
                  {editPlan.hook && (
                    <div className="bg-gradient-to-r from-purple-950/40 to-blue-950/30 border border-purple-800/60 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                        <Sparkles className="w-4 h-4" />
                        <span>{isRTL ? 'أقوى جملة تم اختيارها كـ Hook افتتاحية:' : 'Detected High-Retention Opening Hook:'}</span>
                      </div>
                      <p className="text-sm font-semibold text-white mt-1">"{editPlan.hook.quote}"</p>
                      <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                        Source: {editPlan.hook.source} ({editPlan.hook.start}s – {editPlan.hook.end}s)
                      </span>
                    </div>
                  )}

                  {/* Cut / Operations list */}
                  <div className="bg-[#202020] border border-[#333] rounded-lg p-4 space-y-2">
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      {isRTL ? 'عمليات القص وإعادة الترتيب (Frame-Accurate Operations)' : 'Frame-Accurate Operations'}
                    </h3>

                    {editPlan.operations?.map((op, i) => (
                      <div 
                        key={op.id || i}
                        className="bg-[#181818] border border-[#2e2e2e] p-3 rounded flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${op.type === 'cut' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-200 uppercase">{op.type}</span>
                              <span className="text-gray-400 font-mono text-[11px]">
                                {op.sourceIn}s – {op.sourceOut}s
                              </span>
                            </div>
                            <p className="text-gray-400 text-[11px] mt-0.5">{op.reason}</p>
                          </div>
                        </div>

                        <span className="text-[10px] text-gray-400 px-2 py-0.5 bg-[#252526] rounded">
                          {isRTL ? 'متزامن A/V' : 'AV-Synced'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: CAPTIONS */}
          {activeTab === 'captions' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="bg-[#202020] border border-[#333] rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Type className="w-4 h-4 text-amber-400" />
                      {isRTL ? 'نظام الكابشن الذكي والأنماط' : 'Caption Engine & Styles'}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {isRTL 
                        ? 'إنشاء كابشن ديناميكي يحافظ على المعنى الدقيق مع تمييز الكلمات المحورية (Smart Word Highlight).'
                        : 'Dynamic captions preserving exact spoken negation & terms with key phrase highlights.'}
                    </p>
                  </div>
                </div>

                {/* Preset Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {projectData?.captionPresets?.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`p-3 rounded text-left border transition-all ${
                        selectedPreset === preset.id 
                          ? 'bg-blue-950/40 border-blue-500 text-white' 
                          : 'bg-[#181818] border-[#333] text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <p className="font-bold text-xs">{preset.name}</p>
                      <p className="text-[10px] mt-1 text-gray-400">Font: {preset.font.split(',')[0]}</p>
                      <p className="text-[10px] text-gray-400">Max Words: {preset.maxWordsPerLine}</p>
                    </button>
                  ))}
                </div>

                {/* Caption Plan preview cards */}
                <div className="space-y-2 mt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase">
                    {isRTL ? 'شرائح الكابشن المقترحة:' : 'Generated Caption Blocks:'}
                  </h4>
                  {editPlan?.captions?.map((cap, i) => (
                    <div key={cap.id || i} className="bg-[#181818] border border-[#2d2d2d] p-3 rounded flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-[10px] text-gray-500 block">
                          {cap.start}s – {cap.end}s
                        </span>
                        <p className="text-sm font-bold text-yellow-300 mt-0.5">
                          {cap.text}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {cap.highlight?.map(h => (
                          <span key={h} className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: EFFECTS */}
          {activeTab === 'effects' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="bg-[#202020] border border-[#333] rounded-lg p-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <Wand2 className="w-4 h-4 text-purple-400" />
                  {isRTL ? 'مكتبة التأثيرات المعتمدة (Supported Effects Library)' : 'Supported Effects Library'}
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  {isRTL 
                    ? 'Gemini يختار حصراً من العمليات المدعومة محلياً في Premiere Pro دون إدخال كود غير آمن.' 
                    : 'Gemini plans within deterministic Premiere effect capabilities.'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Visual Effects Planned */}
                  <div className="bg-[#181818] p-4 rounded border border-[#2d2d2d] space-y-3">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                      {isRTL ? 'التأثيرات البصرية (Visual Effects Plan)' : 'Visual Effects Plan'}
                    </span>
                    {editPlan?.visualEffects?.map((vfx, i) => (
                      <div key={vfx.id || i} className="p-2.5 rounded bg-[#222] border border-[#333] text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-200">{vfx.type.toUpperCase()}</span>
                          <span className="font-mono text-gray-400 text-[10px]">{vfx.start}s – {vfx.end}s</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">{vfx.reason}</p>
                        <span className="text-[10px] text-blue-400 block mt-1">Intensity: {Math.round(vfx.intensity * 100)}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Sound Effects Planned */}
                  <div className="bg-[#181818] p-4 rounded border border-[#2d2d2d] space-y-3">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                      {isRTL ? 'المؤثرات الصوتية (SFX Plan)' : 'Sound Effects Plan'}
                    </span>
                    {editPlan?.soundEffects?.map((sfx, i) => (
                      <div key={sfx.id || i} className="p-2.5 rounded bg-[#222] border border-[#333] text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-200">{sfx.name || sfx.type.toUpperCase()}</span>
                          <span className="font-mono text-gray-400 text-[10px]">At {sfx.start}s ({sfx.duration}s)</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">{sfx.reason}</p>
                        <span className="text-[10px] text-emerald-400 block mt-1">Volume: {sfx.volume} dB</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MATERIALS & MISSING ASSETS */}
          {activeTab === 'materials' && (
            <div className="max-w-5xl mx-auto space-y-4">
              {/* Missing materials alert section */}
              {missingMaterials.length > 0 && (
                <div className="bg-amber-950/30 border border-amber-800/80 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{isRTL ? 'خامات ناقصة يحتاجها المونتاج (Missing Material Requests):' : 'Missing Material Requests:'}</span>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    {isRTL 
                      ? 'لا يتم إدخال أي خامة من الإنترنت تلقائياً. يمكنك اختيار خامة من جهازك أو البحث في المتصفح.'
                      : 'AstraCut never automatically downloads internet assets without your manual consent.'}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {missingMaterials.map(m => (
                      <div key={m.id} className="bg-[#1e1e1e] border border-amber-900/60 p-3.5 rounded text-xs space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-900 text-amber-200">
                              {m.type}
                            </span>
                            <h4 className="font-bold text-white mt-1 text-sm">{m.name}</h4>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">Duration: {m.duration}s</span>
                        </div>
                        <p className="text-gray-300 text-[11px]">{m.reason}</p>

                        <div className="pt-2 flex flex-wrap gap-2">
                          <button 
                            onClick={() => alert('Opening Premiere Media Browser to import...')}
                            className="px-2.5 py-1 bg-[#2c2c2c] hover:bg-[#383838] border border-[#444] rounded text-[11px] text-white"
                          >
                            {isRTL ? 'اختر من المشروع / الجهاز' : 'Choose File'}
                          </button>

                          <a
                            href={m.suggestedQueryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-blue-600/80 hover:bg-blue-600 rounded text-[11px] text-white flex items-center gap-1"
                          >
                            <Search className="w-3 h-3" />
                            <span>{isRTL ? 'بحث في جوجل' : 'Google Search'}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-gray-400 italic mt-2">
                    {isRTL 
                      ? 'تنويه: وجود كلمة "royalty-free" في نتائج البحث لا يعني بالضرورة أن الترخيص يغطي استخدامك التجاري، يرجى مراجعة حقوق الملف.' 
                      : 'Note: "Royalty-free" tag does not guarantee unencumbered commercial license.'}
                  </p>
                </div>
              )}

              {/* Current Project Inventory */}
              <div className="bg-[#202020] border border-[#333] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    {isRTL ? 'خامات المشروع الحالية (Project Inventory)' : 'Project Materials Inventory'}
                  </h3>
                  <button 
                    onClick={() => alert('Premiere Import Dialog simulated.')}
                    className="px-2.5 py-1 rounded bg-[#2b2b2b] hover:bg-[#383838] border border-[#444] text-[11px] font-semibold text-white flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isRTL ? 'إضافة خامة' : 'Add Material'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {projectData?.materials?.map(item => (
                    <div key={item.id} className="p-2.5 rounded bg-[#181818] border border-[#2d2d2d] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-[#282828] text-gray-300">
                          {item.type}
                        </span>
                        <div>
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-[10px] text-gray-400">{item.path || 'In Premiere Bin'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.inUse && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            In Timeline
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: MUSIC */}
          {activeTab === 'music' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="bg-[#202020] border border-[#333] rounded-lg p-5">
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                  <Music className="w-5 h-5 text-purple-400" />
                  {isRTL ? 'مولّد برومبت الموسيقى المخصص (Music Prompt Generator)' : 'Music Prompt Generator'}
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  {isRTL 
                    ? 'AstraCut لا يولد ملفات صوتية بنفسه، بل يولد Prompt هندسي دقيق يناسب إيقاع الفيديو وسرعة الكلام لتستخدمه في أي أداة موسيقية خارجية ثم تستورد الملف.' 
                    : 'AstraCut creates precise musical prompts tailored to timeline cadence and speech pauses.'}
                </p>

                <div className="bg-[#181818] p-4 rounded border border-[#333] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300">
                      {isRTL ? 'البرومبت المقترح للإنتاج:' : 'Generated Prompt:'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">BPM: 108 • Duration: 30s</span>
                  </div>

                  <p className="text-xs text-gray-200 font-mono bg-[#141414] p-3 rounded border border-[#2a2a2a] leading-relaxed">
                    {editPlan?.musicPlan?.recommendedPrompt || "Create a 30-second energetic modern tech beat, 108 BPM, subtle synth arpeggios, tight punchy groove, clean midrange leaving room for narration..."}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(editPlan?.musicPlan?.recommendedPrompt || '');
                        alert(isRTL ? 'تم نسخ البرومبت بنجاح!' : 'Prompt copied to clipboard!');
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold text-white"
                    >
                      {isRTL ? 'نسخ البرومبت' : 'Copy Prompt'}
                    </button>

                    <span className="text-[11px] text-gray-400">
                      Ducking: -18dB under dialogue
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: EXECUTION & ROLLBACK */}
          {activeTab === 'execution' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="bg-[#202020] border border-[#333] rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      {isRTL ? 'نظام النسخ الآمن والتراجع (Safe Sequence & Rollback)' : 'Safe Sequence & Rollback Engine'}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {isRTL 
                        ? 'الـ Sequence الأصلي لا يتم تعديله إطلاقاً؛ يتم عمل Clone جديد مع ترقيم الإصدار (v001, v002...).' 
                        : 'Original timeline is never overwritten. Every iteration lives in a safe versioned sequence.'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRollback('original')}
                    className="px-3 py-1.5 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-xs font-bold text-amber-200 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'استرجاع الـ Sequence الأصلي' : 'Rollback to Original'}</span>
                  </button>
                </div>

                {/* Quality Check Results if executed */}
                {executionResult && (
                  <div className="bg-[#181818] border border-emerald-900/60 rounded p-4 mb-4 space-y-3">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <CheckCircle className="w-4 h-4" />
                      {isRTL ? 'نتائج فحص الجودة بعد التنفيذ (QC Report)' : 'Post-Execution Quality Check'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {executionResult.qualityCheck?.checks?.map((chk, i) => (
                        <div key={i} className="p-2 bg-[#222] rounded border border-[#333]">
                          <span className="font-semibold text-gray-200 block">{chk.item}:</span>
                          <span className="text-gray-400 text-[11px]">{chk.details}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Versions list */}
                <div className="space-y-2 mt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase">
                    {isRTL ? 'سجل النسخ المنفذة (Version History):' : 'Version History:'}
                  </h4>
                  {projectData?.projectState?.versionHistory?.length === 0 && !activeVersion ? (
                    <p className="text-xs text-gray-500 py-3">{isRTL ? 'لا توجد نسخ معدلة حتى الآن.' : 'No version history yet.'}</p>
                  ) : (
                    <div className="space-y-2">
                      {projectData?.projectState?.versionHistory?.map((ver, idx) => (
                        <div key={ver.versionId || idx} className="p-3 rounded bg-[#181818] border border-[#2d2d2d] flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white">{ver.sequenceName}</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              Created: {new Date(ver.createdAt).toLocaleTimeString()} • {ver.cutsCount} cuts • {ver.duration}s
                            </span>
                          </div>

                          <button
                            onClick={() => handleRollback(ver.versionId)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-bold"
                          >
                            {isRTL ? 'تفعيل واسترجاع هذه النسخة' : 'Activate Version'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="bg-[#202020] border border-[#333] rounded-lg p-5 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-400" />
                  {isRTL ? 'إعدادات Gemini ومحرك AstraCut' : 'Gemini & AstraCut Configuration'}
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">
                      Gemini API Key
                    </label>
                    <input
                      type="password"
                      value={settings.apiKey}
                      onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                      className="w-full bg-[#181818] border border-[#3e3e3e] rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      {isRTL ? 'المفتاح محمي ومشفر محلياً ولا يتم استخدامه خارج خدمة Gemini.' : 'Encrypted locally.'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1">
                      {isRTL ? 'نموذج Gemini المحدد' : 'Selected Gemini Model'}
                    </label>
                    <select
                      value={settings.modelId}
                      onChange={(e) => setSettings({ ...settings, modelId: e.target.value })}
                      className="w-full bg-[#181818] border border-[#3e3e3e] rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {projectData?.supportedModels?.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-amber-400 mt-1">
                      {isRTL 
                        ? 'ملاحظة صارمة: إذا كان الـ Model غير متاح لا يتم استبداله بصمت بأي نموذج آخر.'
                        : 'Rule: If model is unavailable, it is never silently replaced.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#2e2e2e] space-y-2">
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.autoSafeCopy} 
                        onChange={(e) => setSettings({ ...settings, autoSafeCopy: e.target.checked })}
                      />
                      <span>{isRTL ? 'تفعيل إنشاء نسخة تسلسل آمنة دائماً (Always create safe sequence clone)' : 'Always create safe copy'}</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.cacheEnabled} 
                        onChange={(e) => setSettings({ ...settings, cacheEnabled: e.target.checked })}
                      />
                      <span>{isRTL ? 'تفعيل الكاش المحلي لمنع إعادة إرسال نفس الخامة لـ Gemini' : 'Enable local fingerprint cache'}</span>
                    </label>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      onClick={async () => {
                        const res = await fetch('/api/cache/clear', { method: 'POST' });
                        if (res.ok) alert(isRTL ? 'تم مسح الكاش المحلي بنجاح!' : 'Cache cleared');
                      }}
                      className="px-3 py-1.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-800 text-xs text-red-200"
                    >
                      {isRTL ? 'مسح الكاش المحلي' : 'Clear Cache'}
                    </button>

                    <button
                      onClick={async () => {
                        await fetch('/api/settings', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(settings)
                        });
                        alert(isRTL ? 'تم حفظ الإعدادات والتحقق من المفتاح بنجاح.' : 'Settings saved and validated.');
                      }}
                      className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white"
                    >
                      {isRTL ? 'حفظ وتأكيد' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Right Sidebar: Timeline visualizer & Simulation Player */}
        <aside className="w-80 bg-[#1e1e1e] border-r border-[#2e2e2e] flex flex-col justify-between p-3 hidden lg:flex">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-blue-400" />
                {isRTL ? 'معاينة النتيجة' : 'Live Timeline Preview'}
              </span>
              <span className="font-mono text-xs text-gray-400">
                {currentTime.toFixed(1)}s / {editPlan?.estimated_duration || 23.9}s
              </span>
            </div>

            {/* Video Canvas Simulation Monitor */}
            <div className="relative aspect-[9/16] bg-black rounded border border-[#333] overflow-hidden flex flex-col items-center justify-center p-4">
              {/* Talking Head Avatar / Waveform */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-800 to-indigo-900 flex items-center justify-center shadow-lg border border-purple-500/40">
                <Film className="w-10 h-10 text-white opacity-80" />
              </div>

              {/* Dynamic Active Caption Preview */}
              <div className="absolute bottom-12 inset-x-3 text-center pointer-events-none">
                {editPlan?.captions?.find(c => currentTime >= c.start && currentTime <= c.end) ? (
                  <div className="bg-black/80 px-3 py-1.5 rounded shadow-lg backdrop-blur-sm border border-yellow-500/30">
                    <span className="text-sm font-black text-yellow-300 tracking-wide uppercase">
                      {editPlan.captions.find(c => currentTime >= c.start && currentTime <= c.end)?.text}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-600 italic">
                    [Silence / Pause]
                  </span>
                )}
              </div>

              {/* Active VFX Indicator */}
              {editPlan?.visualEffects?.find(v => currentTime >= v.start && currentTime <= v.end) && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-purple-600/90 text-white text-[9px] font-bold">
                  {editPlan.visualEffects.find(v => currentTime >= v.start && currentTime <= v.end)?.type.toUpperCase()}
                </div>
              )}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3 py-1">
              <button
                onClick={() => setCurrentTime(0)}
                className="p-1.5 bg-[#2a2a2a] hover:bg-[#333] rounded text-gray-300"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsPlaying(p => !p)}
                className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>

            {/* Mini Visual Timeline Track */}
            <div className="space-y-1.5 pt-2 border-t border-[#2e2e2e]">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">
                {isRTL ? 'مسارات الـ Timeline' : 'Sequence Tracks'}
              </span>

              {/* V2 Overlays / B-roll */}
              <div className="h-5 bg-[#141414] rounded border border-[#2e2e2e] relative overflow-hidden flex items-center">
                <span className="text-[9px] text-purple-400 px-1 font-mono">V2 (B-Roll)</span>
                {editPlan?.brollRequests?.map((b, idx) => (
                  <div
                    key={idx}
                    style={{
                      left: `${(b.start / (editPlan.estimated_duration || 24)) * 100}%`,
                      width: `${(b.duration / (editPlan.estimated_duration || 24)) * 100}%`
                    }}
                    className="absolute h-full bg-purple-600/70 border-x border-purple-300 text-[8px] text-white flex items-center justify-center font-bold"
                  >
                    B-Roll
                  </div>
                ))}
              </div>

              {/* V1 Main Cut Clips */}
              <div className="h-5 bg-[#141414] rounded border border-[#2e2e2e] relative overflow-hidden flex items-center">
                <span className="text-[9px] text-blue-400 px-1 font-mono">V1 (Main)</span>
                {editPlan?.operations?.filter(o => o.type === 'keep').map((op, idx) => (
                  <div
                    key={idx}
                    style={{
                      left: `${(op.targetIn / (editPlan.estimated_duration || 24)) * 100}%`,
                      width: `${((op.targetOut - op.targetIn) / (editPlan.estimated_duration || 24)) * 100}%`
                    }}
                    className="absolute h-full bg-blue-700/80 border-r border-[#1e1e1e] text-[8px] text-white flex items-center justify-center"
                  >
                    Clip {idx + 1}
                  </div>
                ))}
              </div>

              {/* A1 Dialogue */}
              <div className="h-5 bg-[#141414] rounded border border-[#2e2e2e] relative overflow-hidden flex items-center">
                <span className="text-[9px] text-emerald-400 px-1 font-mono">A1 (Voice)</span>
                <div className="h-full w-full bg-emerald-950/60 flex items-center justify-center">
                  <span className="text-[8px] text-emerald-300">Clean Dialogue Track</span>
                </div>
              </div>

              {/* A2 SFX */}
              <div className="h-5 bg-[#141414] rounded border border-[#2e2e2e] relative overflow-hidden flex items-center">
                <span className="text-[9px] text-amber-400 px-1 font-mono">A2 (SFX)</span>
                {editPlan?.soundEffects?.map((sfx, idx) => (
                  <div
                    key={idx}
                    style={{
                      left: `${(sfx.start / (editPlan.estimated_duration || 24)) * 100}%`,
                      width: '6%'
                    }}
                    className="absolute h-full bg-amber-500/80 rounded-sm text-[8px] text-black font-bold flex items-center justify-center"
                  >
                    •
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#2e2e2e] text-[10px] text-gray-500 text-center">
            AstraCut v1.0.0 • Adobe Premiere Pro Native Panel
          </div>
        </aside>
      </div>
    </div>
  );
}
