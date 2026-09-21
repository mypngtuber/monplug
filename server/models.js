export const SUPPORTED_MODELS = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Recommended)', contextWindow: '2M tokens', costTier: 'Standard', bestFor: 'Complex multi-step editing, deep semantic understanding' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Ultra-Fast)', contextWindow: '1M tokens', costTier: 'Economy', bestFor: 'Quick cuts, fast transcripts, budget optimization' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextWindow: '2M tokens', costTier: 'Standard', bestFor: 'Long-form podcast & interview editing' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', contextWindow: '1M tokens', costTier: 'Budget', bestFor: 'Rapid transcript and silence detection' }
];

export const SUPPORTED_EFFECTS = [
  { id: 'punch_in', name: 'Punch In (Zoom)', category: 'Transform', defaultIntensity: 0.25, supportedParams: ['scale', 'originX', 'originY'] },
  { id: 'punch_out', name: 'Punch Out (Wide)', category: 'Transform', defaultIntensity: 0.2, supportedParams: ['scale'] },
  { id: 'position_shift', name: 'Position Shift', category: 'Transform', defaultIntensity: 0.15, supportedParams: ['xOffset', 'yOffset'] },
  { id: 'scale', name: 'Smooth Scale Ramp', category: 'Transform', defaultIntensity: 0.3, supportedParams: ['startScale', 'endScale', 'duration'] },
  { id: 'blur', name: 'Gaussian Focus Blur', category: 'Stylize', defaultIntensity: 0.5, supportedParams: ['radius', 'feather'] },
  { id: 'opacity', name: 'Opacity Fade', category: 'Dissolve', defaultIntensity: 1.0, supportedParams: ['startOpacity', 'endOpacity'] },
  { id: 'shake', name: 'Screen Camera Shake', category: 'Motion', defaultIntensity: 0.4, supportedParams: ['frequency', 'amplitude', 'decay'] },
  { id: 'crop', name: 'Cinematic Crop (Letterbox)', category: 'Framing', defaultIntensity: 0.12, supportedParams: ['top', 'bottom'] },
  { id: 'vignette', name: 'Subtle Dark Vignette', category: 'Stylize', defaultIntensity: 0.35, supportedParams: ['amount', 'midpoint'] },
  { id: 'highlight', name: 'Radial Spotlight / Highlight', category: 'Stylize', defaultIntensity: 0.6, supportedParams: ['radius', 'centerX', 'centerY'] },
  { id: 'freeze_frame', name: 'Freeze Frame Hold', category: 'Time', defaultIntensity: 1.0, supportedParams: ['holdDuration'] },
  { id: 'basic_transition', name: 'Cross Dissolve / Dip to Black', category: 'Transition', defaultIntensity: 0.5, supportedParams: ['type', 'duration'] }
];

export const CAPTION_PRESETS = [
  {
    id: 'shorts',
    name: 'Shorts / TikTok Dynamic',
    font: 'Montserrat Black, Arial Black',
    fontSize: 48,
    color: '#FFE600',
    strokeColor: '#000000',
    strokeWidth: 4,
    shadowColor: 'rgba(0,0,0,0.8)',
    shadowBlur: 8,
    position: 'middle-bottom',
    animation: 'pop-in',
    maxWordsPerLine: 4,
    uppercase: true,
    highlightColor: '#00E5FF'
  },
  {
    id: 'clean',
    name: 'Clean Modern Corporate',
    font: 'Inter, system-ui, sans-serif',
    fontSize: 34,
    color: '#FFFFFF',
    strokeColor: '#1A1A1A',
    strokeWidth: 2,
    shadowColor: 'rgba(0,0,0,0.6)',
    shadowBlur: 4,
    position: 'bottom',
    animation: 'fade',
    maxWordsPerLine: 7,
    uppercase: false,
    highlightColor: '#38BDF8'
  },
  {
    id: 'kinetic',
    name: 'Kinetic Bouncy',
    font: 'Poppins Bold, sans-serif',
    fontSize: 44,
    color: '#FFFFFF',
    strokeColor: '#0F172A',
    strokeWidth: 3,
    shadowColor: 'rgba(0,0,0,0.7)',
    shadowBlur: 6,
    position: 'center',
    animation: 'bounce',
    maxWordsPerLine: 3,
    uppercase: true,
    highlightColor: '#EC4899'
  },
  {
    id: 'minimal',
    name: 'Minimal Documentary',
    font: 'Georgia, serif',
    fontSize: 28,
    color: '#F3F4F6',
    strokeColor: 'transparent',
    strokeWidth: 0,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowBlur: 3,
    position: 'bottom-compact',
    animation: 'none',
    maxWordsPerLine: 9,
    uppercase: false,
    highlightColor: '#FBBF24'
  }
];
