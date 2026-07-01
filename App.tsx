
import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  MessageCircle, 
  Upload, 
  Send, 
  Copy, 
  Check, 
  RefreshCw, 
  Edit3,
  Camera,
  Image as ImageIcon,
  Zap,
  Globe,
  MessageSquare,
  Sparkles,
  Heart,
  Flame,
  HeartHandshake,
  Flower,
  Smile,
  Meh,
  Coffee,
  Briefcase,
  Crown,
  Ban,
  Ghost,
  Star,
  Lock
} from 'lucide-react';
import Layout from './components/Layout';
import Button from './components/Button';
import { 
  REPLY_MODES, 
  CATEGORIES, 
  LANGUAGES, 
  GOALS_BY_MODE, 
  GOALS_BY_CATEGORY, 
  DEFAULT_GOALS 
} from './constants';
import { AppState, Gender, ReplyMode, AppScreen, ConversationStage, AnalysisResult, Language, AppMode } from './types';
import { generateReply } from './services/geminiService';

// Icon mapping to convert string names from constants to components
const ICON_MAP: Record<string, React.ElementType> = {
  'Sparkles': Sparkles,
  'Heart': Heart,
  'Flame': Flame,
  'Zap': Zap,
  'HeartHandshake': HeartHandshake,
  'Flower': Flower,
  'Smile': Smile,
  'Meh': Meh,
  'Coffee': Coffee,
  'Briefcase': Briefcase,
  'Crown': Crown,
  'Ban': Ban,
  'Ghost': Ghost
};

const INITIAL_STATE: AppState = {
  currentScreen: 'gender-selection',
  appMode: 'normal',
  gender: null,
  language: null,
  selectedModeId: null,
  stage: null,
  openerContext: {
    platform: 'WhatsApp',
    relation: 'Matched recently',
    goal: '',
    extraInfo: ''
  },
  screenshotBase64: null,
  conversationHistory: [],
  lastAnalysisResult: null,
  isAnalyzing: false,
  error: null
};

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [partnerReply, setPartnerReply] = useState('');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customReply, setCustomReply] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When new analysis results come in, default the selected sent message to the main suggestion
  useEffect(() => {
    if (state.lastAnalysisResult) {
      setSelectedOption(state.lastAnalysisResult.suggestedReply);
      setCustomReply('');
      setPartnerReply(''); // Reset input
    }
  }, [state.lastAnalysisResult]);

  // When mode changes, reset goal to the first available option for that mode
  useEffect(() => {
    if (state.selectedModeId) {
      const modeId = state.selectedModeId;
      const mode = REPLY_MODES.find(m => m.id === modeId);
      let goals = DEFAULT_GOALS;
      
      if (modeId && GOALS_BY_MODE[modeId]) {
        goals = GOALS_BY_MODE[modeId];
      } else if (mode && GOALS_BY_CATEGORY[mode.category]) {
        goals = GOALS_BY_CATEGORY[mode.category];
      }

      updateState({ 
        openerContext: { 
          ...state.openerContext, 
          goal: goals[0] 
        } 
      });
    }
  }, [state.selectedModeId]);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const navigateTo = (screen: AppScreen) => {
    updateState({ currentScreen: screen });
    window.scrollTo(0, 0);
  };

  const handleGenderSelect = (gender: Gender) => {
    updateState({ gender });
    navigateTo('language-selection');
  };

  const handleLanguageSelect = (language: Language) => {
    updateState({ language });
    navigateTo('app-mode-selection');
  };

  const handleAppModeSelect = (appMode: AppMode) => {
    updateState({ appMode });
    navigateTo('mode-selection');
  };

  const handleModeSelect = (modeId: string) => {
    updateState({ selectedModeId: modeId });
    navigateTo('stage-selection');
  };

  const handleStageSelect = (stage: ConversationStage) => {
    // When starting a new stage, reset relevant data to ensure freshness
    updateState({ 
      stage,
      // If we are starting an opener, clear history and screenshots
      ...(stage === 'opener' ? { 
        conversationHistory: [], 
        screenshotBase64: null,
        lastAnalysisResult: null 
      } : {})
    });

    if (stage === 'opener') {
      navigateTo('opener-input');
    } else {
      navigateTo('screenshot-upload');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateState({ screenshotBase64: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!state.selectedModeId || !state.gender) return;

    updateState({ isAnalyzing: true, error: null });
    
    try {
      const mode = REPLY_MODES.find(m => m.id === state.selectedModeId)?.name || 'Casual';
      const lang = state.language || 'English';
      
      const isOpener = state.stage === 'opener';

      const result = await generateReply(
        mode,
        state.gender,
        lang,
        isOpener ? 'First Message' : 'Ongoing Conversation',
        {
          textContext: isOpener ? state.openerContext : undefined,
          image: state.stage === 'ongoing' && state.screenshotBase64 ? state.screenshotBase64 : undefined,
          additionalContext: state.stage === 'ongoing' ? "The user provided a screenshot." : state.openerContext.extraInfo,
          // Crucial: Pass empty history for openers to ensure fresh start
          conversationHistory: isOpener ? [] : state.conversationHistory
        }
      );

      // If it's an opener, we also make sure the state history is cleared just in case
      if (isOpener) {
        updateState({ conversationHistory: [] });
      }

      updateState({ 
        lastAnalysisResult: result, 
        isAnalyzing: false,
        currentScreen: 'results'
      });
    } catch (err: any) {
      updateState({ 
        isAnalyzing: false, 
        error: "Something went wrong. Please try again. " + (err.message || "")
      });
    }
  };

  const handleContinueConversation = async () => {
    if (!partnerReply.trim()) return;

    // Determine actual user reply
    const userSentText = selectedOption === 'custom' ? customReply : selectedOption;
    if (!userSentText || !userSentText.trim()) return;

    updateState({ isAnalyzing: true, error: null });

    // Update history with the turn that just happened
    const newHistory = [
        ...state.conversationHistory,
        `User (Me): ${userSentText}`,
        `Partner (Them): ${partnerReply}`
    ];

    updateState({ conversationHistory: newHistory });

    try {
        const mode = REPLY_MODES.find(m => m.id === state.selectedModeId)?.name || 'Casual';
        const lang = state.language || 'English';

        // Call service with history
        const result = await generateReply(
            mode,
            state.gender!,
            lang,
            'Ongoing Conversation',
            {
                image: state.screenshotBase64 || undefined, // Keep context of original image
                textContext: state.openerContext,
                additionalContext: "Continuing conversation based on recent history.",
                conversationHistory: newHistory
            }
        );

        updateState({ 
            lastAnalysisResult: result, 
            isAnalyzing: false 
        });
        
        // Scroll to top to see new results
        window.scrollTo(0, 0);

    } catch (err: any) {
         updateState({ 
            isAnalyzing: false, 
            error: "Failed to generate reply: " + err.message 
        });
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const resetFlow = () => {
    setState(INITIAL_STATE);
    setPartnerReply('');
    setSelectedOption('');
    setCustomReply('');
  };

  // --- Render Functions ---

  const renderGenderSelection = () => (
    <Layout>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4 text-slate-800">Who are you chatting with?</h2>
        <p className="text-slate-500">We'll tailor the psychology of the replies based on this.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <button 
          onClick={() => handleGenderSelect('Male')}
          className="group relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-xl hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <User size={120} />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm mb-4">
              <User size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Male</h3>
            <p className="text-blue-100 text-sm">Tailored for conversations with men</p>
          </div>
        </button>

        <button 
          onClick={() => handleGenderSelect('Female')}
          className="group relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-pink-400 to-rose-600 text-white shadow-xl hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
             <User size={120} />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm mb-4">
              <User size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Female</h3>
            <p className="text-pink-100 text-sm">Tailored for conversations with women</p>
          </div>
        </button>
      </div>
    </Layout>
  );

  const renderLanguageSelection = () => (
    <Layout 
      title="Select Language" 
      showBack 
      onBack={() => navigateTo('gender-selection')}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Which language?</h2>
        <p className="text-slate-500">Choose the language for the reply suggestions.</p>
      </div>

      <div className="space-y-4">
        {LANGUAGES.map(lang => (
          <button
            key={lang.id}
            onClick={() => handleLanguageSelect(lang.id)}
            className="w-full p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all text-left flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 text-slate-500 rounded-xl group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                <Globe size={24} />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-800 block">{lang.label}</span>
                <span className="text-sm text-slate-400">{lang.nativeLabel}</span>
              </div>
            </div>
            <div className="bg-slate-50 px-3 py-1 rounded-lg text-slate-600 text-sm font-medium group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
              "{lang.example}"
            </div>
          </button>
        ))}
      </div>
    </Layout>
  );

  const renderAppModeSelection = () => (
    <Layout 
      title="Choose Experience" 
      showBack 
      onBack={() => navigateTo('language-selection')}
    >
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2">How do you want to chat?</h2>
        <p className="text-slate-500">Choose the mode that fits your style.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Normal Mode */}
        <button 
          onClick={() => handleAppModeSelect('normal')}
          className="w-full p-6 bg-white rounded-3xl shadow-md border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all text-left group relative overflow-hidden"
        >
          <div className="relative z-10 flex items-start gap-5">
            <div className="p-4 bg-slate-100 text-slate-600 rounded-2xl group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
              <MessageCircle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Normal Mode</h3>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                Pick a vibe and stick with it. Perfect for standard conversations where you want consistency.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Lock size={12} /> Vibe Locked
              </div>
            </div>
          </div>
        </button>

        {/* VIP Mode */}
        <button 
          onClick={() => handleAppModeSelect('vip')}
          className="w-full p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-xl border border-yellow-500/30 hover:border-yellow-400 transition-all text-left group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500 blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
          
          <div className="relative z-10 flex items-start gap-5">
            <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950 rounded-2xl shadow-lg shadow-yellow-500/20">
              <Crown size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-white">VIP Mode</h3>
                <span className="px-2 py-0.5 bg-yellow-500 text-yellow-950 text-[10px] font-bold uppercase rounded-full">Pro</span>
              </div>
              <p className="text-slate-300 mt-2 text-sm leading-relaxed">
                Total control. Change your vibe and goal dynamically for every single reply during the chat.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                <Sparkles size={12} /> Dynamic Vibes
              </div>
            </div>
          </div>
        </button>
      </div>
    </Layout>
  );

  const renderModeSelection = () => (
    <Layout 
      title={`Chatting with ${state.gender}`} 
      showBack 
      onBack={() => navigateTo('app-mode-selection')}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Pick your {state.appMode === 'vip' ? 'Starting ' : ''}Vibe</h2>
        <p className="text-slate-500">How do you want to come across?</p>
      </div>

      <div className="space-y-8">
        {CATEGORIES.map(category => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 ml-1">{category}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {REPLY_MODES.filter(m => m.category === category).map(mode => {
                const IconComponent = ICON_MAP[mode.icon] || Sparkles;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleModeSelect(mode.id)}
                    className={`p-4 rounded-2xl text-left transition-all duration-200 border hover:shadow-md ${mode.color} ${mode.borderColor || 'border-transparent'}`}
                  >
                    <div className="text-2xl mb-2 text-slate-800">
                        <IconComponent className={`w-8 h-8 ${mode.textColor}`} />
                    </div>
                    <div className={`font-bold text-sm ${mode.textColor}`}>{mode.name}</div>
                    <div className={`text-xs opacity-70 mt-1 leading-tight ${mode.textColor}`}>{mode.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );

  const renderStageSelection = () => (
    <Layout 
      title="Select Stage" 
      showBack 
      onBack={() => navigateTo('mode-selection')}
    >
      <div className="space-y-4">
        <button 
          onClick={() => handleStageSelect('opener')}
          className="w-full p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all text-left flex items-start gap-4 group"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
            <Zap size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Start a Conversation</h3>
            <p className="text-slate-500 text-sm mt-1">Need a perfect first message or opener</p>
          </div>
        </button>

        <button 
          onClick={() => handleStageSelect('ongoing')}
          className="w-full p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all text-left flex items-start gap-4 group"
        >
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
            <MessageCircle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Ongoing Chat</h3>
            <p className="text-slate-500 text-sm mt-1">Reply to a message or continue chatting</p>
          </div>
        </button>
      </div>
    </Layout>
  );

  const renderOpenerInput = () => {
    // Determine the available goals based on the selected mode
    const currentMode = REPLY_MODES.find(m => m.id === state.selectedModeId);
    let availableGoals = DEFAULT_GOALS;
    
    if (state.selectedModeId && GOALS_BY_MODE[state.selectedModeId]) {
      availableGoals = GOALS_BY_MODE[state.selectedModeId];
    } else if (currentMode && GOALS_BY_CATEGORY[currentMode.category]) {
      availableGoals = GOALS_BY_CATEGORY[currentMode.category];
    }

    // Determine color styling based on mode for visual consistency
    const borderColor = currentMode?.borderColor || 'border-slate-200';
    const focusRing = currentMode?.textColor.replace('text-', 'focus:ring-') || 'focus:ring-purple-500';

    return (
      <Layout 
        title="Craft Opener" 
        showBack 
        onBack={() => navigateTo('stage-selection')}
      >
        <div className={`bg-white p-6 rounded-3xl shadow-sm border ${borderColor} space-y-6`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${currentMode?.color} ${currentMode?.textColor}`}>
               {currentMode?.name} Mode
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Platform</label>
            <select 
              className={`w-full p-3 bg-slate-50 rounded-xl border border-transparent focus:ring-2 ${focusRing}`}
              value={state.openerContext.platform}
              onChange={(e) => updateState({ openerContext: { ...state.openerContext, platform: e.target.value }})}
            >
              <option>WhatsApp</option>
              <option>Tinder</option>
              <option>Bumble</option>
              <option>Hinge</option>
              <option>Instagram</option>
              <option>iMessage/SMS</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">What's your goal?</label>
            <select 
              className={`w-full p-3 bg-slate-50 rounded-xl border border-transparent focus:ring-2 ${focusRing}`}
              value={state.openerContext.goal}
              onChange={(e) => updateState({ openerContext: { ...state.openerContext, goal: e.target.value }})}
            >
              {availableGoals.map((goal, idx) => (
                <option key={idx} value={goal}>{goal}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">What do you know about them?</label>
            <textarea 
              className={`w-full p-3 bg-slate-50 rounded-xl border border-transparent focus:ring-2 ${focusRing} min-h-[100px]`}
              placeholder="e.g. They love hiking, have a dog named Max..."
              value={state.openerContext.extraInfo}
              onChange={(e) => updateState({ openerContext: { ...state.openerContext, extraInfo: e.target.value }})}
            />
          </div>

          <Button fullWidth onClick={handleAnalyze} disabled={state.isAnalyzing}>
            {state.isAnalyzing ? 'Analyzing...' : 'Generate Opener ✨'}
          </Button>
        </div>
      </Layout>
    );
  };

  const renderScreenshotUpload = () => (
    <Layout 
      title="Upload Chat" 
      showBack 
      onBack={() => navigateTo('stage-selection')}
    >
      <div 
        className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative"
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileUpload}
        />
        
        {state.screenshotBase64 ? (
          <div className="relative">
            <img 
              src={state.screenshotBase64} 
              alt="Upload preview" 
              className="max-h-64 mx-auto rounded-xl shadow-lg"
            />
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white font-medium flex items-center gap-2">
                <RefreshCw size={16} /> Change Image
              </span>
            </div>
          </div>
        ) : (
          <div className="py-10">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Upload Screenshot</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              For best results, upload the last 5-10 messages of your conversation.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Any context we missed? (Optional)</label>
        <textarea 
          className="w-full p-3 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 min-h-[80px]"
          placeholder="e.g. She takes a long time to reply..."
          value={state.openerContext.extraInfo}
          onChange={(e) => updateState({ openerContext: { ...state.openerContext, extraInfo: e.target.value }})}
        />
      </div>

      <div className="mt-8">
        <Button 
          fullWidth 
          onClick={handleAnalyze} 
          disabled={!state.screenshotBase64 || state.isAnalyzing}
        >
          {state.isAnalyzing ? 'Analyzing with Gemini...' : 'Analyze & Generate Reply ✨'}
        </Button>
      </div>

      {state.error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
          {state.error}
        </div>
      )}
    </Layout>
  );

  const renderResults = () => {
    if (!state.lastAnalysisResult) return null;

    const { suggestedReply, whyItWorks, alternatives, vibeCheck } = state.lastAnalysisResult;
    const currentMode = REPLY_MODES.find(m => m.id === state.selectedModeId);
    
    // Combine all suggestions for the selector
    const allSuggestions = [suggestedReply, ...alternatives];

    // Determine current available goals based on whatever mode is selected in state
    let availableGoals = DEFAULT_GOALS;
    if (state.selectedModeId && GOALS_BY_MODE[state.selectedModeId]) {
      availableGoals = GOALS_BY_MODE[state.selectedModeId];
    } else if (currentMode && GOALS_BY_CATEGORY[currentMode.category]) {
      availableGoals = GOALS_BY_CATEGORY[currentMode.category];
    }

    return (
      <Layout 
        title="Suggestion" 
        showBack 
        onBack={() => navigateTo('stage-selection')} 
      >
        <div className="space-y-6">
          
          {/* Main Card */}
          <div className="bg-gradient-to-br from-white to-slate-50 p-1 rounded-3xl shadow-lg">
             <div className="bg-white rounded-[20px] p-6">
                <div className="flex items-center gap-2 mb-4">
                   <span className={`text-xs font-bold px-2 py-1 rounded-full ${currentMode?.color} ${currentMode?.textColor}`}>
                      {currentMode?.name} Vibe
                   </span>
                   {state.appMode === 'vip' && (
                     <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
                       <Crown size={10} /> VIP
                     </span>
                   )}
                   {state.language && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                        {state.language}
                      </span>
                   )}
                   <span className="text-xs text-slate-400 uppercase font-bold tracking-wider ml-auto">Top Pick</span>
                </div>
                
                <div className="relative group">
                  <div className="text-xl md:text-2xl font-medium text-slate-800 mb-6 pr-8 leading-relaxed">
                    "{suggestedReply}"
                  </div>
                  <button 
                    onClick={() => handleCopy(suggestedReply, 0)}
                    className="absolute top-0 right-0 p-2 text-slate-400 hover:text-purple-600 transition-colors"
                  >
                    {copiedIndex === 0 ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                  </button>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 text-sm text-slate-700">
                  <strong className="text-purple-700 block mb-1 text-xs uppercase tracking-wide">Why it works</strong>
                  {whyItWorks}
                </div>
             </div>
          </div>

          {/* Vibe Check */}
          <div className="bg-slate-900 text-slate-200 p-6 rounded-3xl shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full blur-[60px] opacity-20"></div>
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
               <Zap size={14} /> Vibe Check
             </h3>
             <p className="relative z-10 leading-relaxed">
               {vibeCheck}
             </p>
          </div>

          {/* Alternatives */}
          <div className="space-y-3">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Alternatives</h3>
             {alternatives.map((alt, idx) => (
               <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-colors">
                  <p className="text-slate-700 font-medium pr-4">"{alt}"</p>
                  <button 
                    onClick={() => handleCopy(alt, idx + 1)}
                    className="p-2 text-slate-400 hover:text-purple-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {copiedIndex === idx + 1 ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
               </div>
             ))}
          </div>

          {/* Continuous Conversation Section */}
          <div className="border-t border-slate-200 pt-6 mt-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-purple-600" />
              Continue Conversation
            </h3>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                
                {/* VIP CONTROLS */}
                {state.appMode === 'vip' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-yellow-50/50 rounded-2xl border border-yellow-200 mb-2">
                    <div className="col-span-full flex items-center gap-2 text-yellow-800 font-bold text-xs uppercase tracking-wider">
                       <Crown size={14} /> VIP Dynamic Controls
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-yellow-700 mb-1">Switch Vibe</label>
                      <select 
                        value={state.selectedModeId || ''}
                        onChange={(e) => updateState({ selectedModeId: e.target.value })}
                        className="w-full p-2 bg-white rounded-lg border border-yellow-300 focus:ring-2 focus:ring-yellow-500 text-sm"
                      >
                        {REPLY_MODES.map(mode => (
                          <option key={mode.id} value={mode.id}>{mode.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-yellow-700 mb-1">Update Goal</label>
                      <select 
                        value={state.openerContext.goal}
                        onChange={(e) => updateState({ openerContext: { ...state.openerContext, goal: e.target.value }})}
                        className="w-full p-2 bg-white rounded-lg border border-yellow-300 focus:ring-2 focus:ring-yellow-500 text-sm"
                      >
                        {availableGoals.map((goal, i) => (
                          <option key={i} value={goal}>{goal}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-yellow-700 mb-1">Language</label>
                      <select 
                        value={state.language || 'English'}
                        onChange={(e) => updateState({ language: e.target.value as Language })}
                        className="w-full p-2 bg-white rounded-lg border border-yellow-300 focus:ring-2 focus:ring-yellow-500 text-sm"
                      >
                        {LANGUAGES.map(lang => (
                          <option key={lang.id} value={lang.id}>{lang.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* 1. Confirm what was sent */}
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Which reply did you use?
                   </label>
                   <select 
                      value={selectedOption}
                      onChange={(e) => {
                          const val = e.target.value;
                          setSelectedOption(val);
                          if (val !== 'custom') {
                              setCustomReply('');
                          }
                      }}
                      className="w-full p-3 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-purple-500 text-sm"
                   >
                      {allSuggestions.map((opt, i) => (
                        <option key={i} value={opt}>
                           {opt.length > 50 ? opt.substring(0, 50) + '...' : opt}
                        </option>
                      ))}
                      <option value="custom">I wrote something else...</option>
                   </select>
                   {selectedOption === 'custom' && (
                      <input 
                        type="text" 
                        placeholder="Type what you actually sent..."
                        className="w-full mt-2 p-3 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-purple-500 text-sm"
                        value={customReply}
                        onChange={(e) => setCustomReply(e.target.value)}
                      />
                   )}
                </div>

                {/* 2. Input their response */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                     What did they reply?
                  </label>
                  <textarea 
                     className="w-full p-3 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-purple-500 min-h-[80px]"
                     placeholder="Type their response exactly..."
                     value={partnerReply}
                     onChange={(e) => setPartnerReply(e.target.value)}
                  />
                </div>

                {/* 3. Generate Next */}
                <Button 
                   fullWidth 
                   onClick={handleContinueConversation} 
                   disabled={state.isAnalyzing || !partnerReply.trim()}
                >
                   {state.isAnalyzing ? 'Thinking...' : 'Generate Next Reply ⚡'}
                </Button>
            </div>
          </div>

          {/* Reset Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button 
              variant="ghost" 
              fullWidth 
              onClick={resetFlow}
              className="text-slate-400 hover:text-slate-600"
            >
              Start Completely New Chat
            </Button>
          </div>

        </div>
      </Layout>
    );
  };

  return (
    <div className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen">
      {state.currentScreen === 'gender-selection' && renderGenderSelection()}
      {state.currentScreen === 'language-selection' && renderLanguageSelection()}
      {state.currentScreen === 'app-mode-selection' && renderAppModeSelection()}
      {state.currentScreen === 'mode-selection' && renderModeSelection()}
      {state.currentScreen === 'stage-selection' && renderStageSelection()}
      {state.currentScreen === 'opener-input' && renderOpenerInput()}
      {state.currentScreen === 'screenshot-upload' && renderScreenshotUpload()}
      {state.currentScreen === 'results' && renderResults()}
    </div>
  );
}
