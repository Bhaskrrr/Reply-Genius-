
export type Gender = 'Male' | 'Female' | null;

export type Language = 'English' | 'Hindi' | 'Hinglish' | 'English-Assamese' | null;

export type AppMode = 'normal' | 'vip';

export interface LanguageOption {
  id: Exclude<Language, null>;
  label: string;
  nativeLabel: string;
  example: string;
}

export type AppScreen = 
  | 'gender-selection'
  | 'language-selection'
  | 'app-mode-selection'
  | 'mode-selection'
  | 'stage-selection'
  | 'opener-input'
  | 'screenshot-upload'
  | 'results';

export interface ReplyMode {
  id: string;
  name: string;
  icon: string;
  color: string;
  textColor: string;
  borderColor: string;
  description: string;
  category: 'Romantic' | 'Emotional' | 'Casual' | 'Professional' | 'Special' | 'Advanced';
}

export type ConversationStage = 'opener' | 'ongoing' | null;

export interface OpenerContext {
  platform: string;
  relation: string; // How they know them
  goal: string;
  extraInfo: string;
}

export interface AppState {
  currentScreen: AppScreen;
  appMode: AppMode;
  gender: Gender;
  language: Language;
  selectedModeId: string | null;
  stage: ConversationStage;
  openerContext: OpenerContext;
  screenshotBase64: string | null;
  conversationHistory: string[]; // For continuous chat (simple strings for now)
  lastAnalysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
}

export interface AnalysisResult {
  suggestedReply: string;
  whyItWorks: string;
  alternatives: string[];
  vibeCheck: string;
}
