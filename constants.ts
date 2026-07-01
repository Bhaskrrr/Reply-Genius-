import { ReplyMode, LanguageOption } from './types';

export const SYSTEM_PROMPT = `
You are "ReplyGenius" - an advanced conversational AI assistant specialized in analyzing chat conversations and generating perfectly human-like reply suggestions.

Your output must be a JSON object with the following structure:
{
  "suggestedReply": "Main suggested reply text",
  "whyItWorks": "Explanation of why this reply is effective",
  "alternatives": ["Alternative reply 1", "Alternative reply 2"],
  "vibeCheck": "Analysis of the conversation mood and advice"
}

ABSOLUTE RULES:
1. NEVER sound robotic, formal, or AI-generated.
2. Match the texting style (lowercase, abbreviations, minimal punctuation if casual).
3. Be specific to the selected "Mode".
4. If analyzing an image, identify who is who (User is usually right/blue, Other is left/gray).
5. STRICTLY adhere to the requested language.
`;

export { LanguageOption };

export const LANGUAGES: LanguageOption[] = [
  { id: 'English', label: 'English', nativeLabel: 'English', example: 'How are you?' },
  { id: 'Hindi', label: 'Hindi', nativeLabel: 'हिंदी', example: 'आप कैसे हैं?' },
  { id: 'Hinglish', label: 'Hinglish', nativeLabel: 'Hinglish', example: 'Kaise ho?' },
  { id: 'English-Assamese', label: 'English Assamese', nativeLabel: 'Axomiya', example: 'Ki khobor?' }
];

export const REPLY_MODES: ReplyMode[] = [
  // ROMANTIC/DATING
  { 
    id: 'flirty', 
    name: 'Flirty', 
    icon: 'Sparkles', 
    color: 'bg-fuchsia-50', 
    textColor: 'text-fuchsia-700', 
    borderColor: 'border-fuchsia-200',
    description: 'Playful and charming responses', 
    category: 'Romantic' 
  },
  { 
    id: 'romantic', 
    name: 'Romantic', 
    icon: 'Heart', 
    color: 'bg-rose-50', 
    textColor: 'text-rose-700', 
    borderColor: 'border-rose-200',
    description: 'Sweet and heartfelt messages', 
    category: 'Romantic' 
  },
  { 
    id: 'sexting', 
    name: 'Sexting (18+)', 
    icon: 'Flame', 
    color: 'bg-orange-50', 
    textColor: 'text-orange-700', 
    borderColor: 'border-orange-200',
    description: 'Intimate and passionate replies', 
    category: 'Romantic' 
  },
  
  // EMOTIONAL
  { 
    id: 'angry', 
    name: 'Angry/Savage', 
    icon: 'Zap', 
    color: 'bg-red-50', 
    textColor: 'text-red-800', 
    borderColor: 'border-red-200',
    description: 'Strong, assertive comebacks', 
    category: 'Emotional' 
  },
  { 
    id: 'supportive', 
    name: 'Supportive', 
    icon: 'HeartHandshake', 
    color: 'bg-emerald-50', 
    textColor: 'text-emerald-700', 
    borderColor: 'border-emerald-200',
    description: 'Empathetic and understanding', 
    category: 'Emotional' 
  },
  { 
    id: 'apologetic', 
    name: 'Apologetic', 
    icon: 'Flower', 
    color: 'bg-indigo-50', 
    textColor: 'text-indigo-700', 
    borderColor: 'border-indigo-200',
    description: 'Sincere apology messages', 
    category: 'Emotional' 
  },

  // CASUAL/FUN
  { 
    id: 'funny', 
    name: 'Funny', 
    icon: 'Smile', 
    color: 'bg-amber-50', 
    textColor: 'text-amber-700', 
    borderColor: 'border-amber-200',
    description: 'Witty and entertaining replies', 
    category: 'Casual' 
  },
  { 
    id: 'sarcastic', 
    name: 'Sarcastic', 
    icon: 'Meh', 
    color: 'bg-violet-50', 
    textColor: 'text-violet-700', 
    borderColor: 'border-violet-200',
    description: 'Clever and witty comebacks', 
    category: 'Casual' 
  },
  { 
    id: 'casual', 
    name: 'Casual', 
    icon: 'Coffee', 
    color: 'bg-sky-50', 
    textColor: 'text-sky-700', 
    borderColor: 'border-sky-200',
    description: 'Relaxed everyday conversation', 
    category: 'Casual' 
  },

  // PROFESSIONAL
  { 
    id: 'professional', 
    name: 'Professional', 
    icon: 'Briefcase', 
    color: 'bg-slate-50', 
    textColor: 'text-slate-700', 
    borderColor: 'border-slate-200',
    description: 'Formal and business-like', 
    category: 'Professional' 
  },
  { 
    id: 'confident', 
    name: 'Confident', 
    icon: 'Crown', 
    color: 'bg-yellow-50', 
    textColor: 'text-yellow-800', 
    borderColor: 'border-yellow-200',
    description: 'Strong and self-assured', 
    category: 'Professional' 
  },

  // SPECIAL
  { 
    id: 'rejection', 
    name: 'Rejection', 
    icon: 'Ban', 
    color: 'bg-gray-100', 
    textColor: 'text-gray-700', 
    borderColor: 'border-gray-300',
    description: 'Turn down gracefully', 
    category: 'Special' 
  },
  { 
    id: 'ghosting', 
    name: 'Ghosting', 
    icon: 'Ghost', 
    color: 'bg-zinc-50', 
    textColor: 'text-zinc-600', 
    borderColor: 'border-zinc-200',
    description: 'Reply after being ghosted', 
    category: 'Special' 
  },
];

export const CATEGORIES = ['Romantic', 'Emotional', 'Casual', 'Professional', 'Special'] as const;

export const DEFAULT_GOALS = [
  'Get a date',
  'Just chat',
  'Make them laugh',
  'Get their number',
  'Build connection'
];

export const GOALS_BY_MODE: Record<string, string[]> = {
  'flirty': [
    'Get a date',
    'Make them blush',
    'Playful banter',
    'Build tension',
    'Ask them out smoothly',
    'Test the waters'
  ],
  'romantic': [
    'Express love',
    'Plan a romantic date',
    'Deepen connection',
    'Show appreciation',
    'Make them feel special'
  ],
  'sexting': [
    'One night stand',
    'Ask for sex',
    'Build sexual tension',
    'Talk dirty',
    'Send nudes (request)',
    'Hook up'
  ],
  'angry': [
    'Set boundaries',
    'Call them out',
    'Express disappointment',
    'End the argument',
    'Stand my ground'
  ],
  'supportive': [
    'Offer advice',
    'Comfort them',
    'Show empathy',
    'Cheer them up',
    'Listen actively'
  ],
  'apologetic': [
    'Ask for forgiveness',
    'Explain my side',
    'Admit mistake',
    'Make amends',
    'Sincere apology'
  ],
  'funny': [
    'Make them laugh',
    'Break the ice',
    'Share a funny story',
    'Roast them playfully',
    'Be random'
  ],
  'sarcastic': [
    'Be witty',
    'Playful teasing',
    'Dry humor',
    'Mock a situation',
    'Smart comeback'
  ],
  'casual': [
    'Catch up',
    'Make plans',
    'Just chat',
    'Kill boredom',
    'Check in'
  ],
  'professional': [
    'Schedule a meeting',
    'Network',
    'Ask for a favor',
    'Follow up',
    'Negotiate'
  ],
  'confident': [
    'Take the lead',
    'Make a decision',
    'Show authority',
    'Be direct',
    'Close the deal'
  ],
  'rejection': [
    'Let them down easy',
    'Be firm but polite',
    'Friendzone them',
    'End it clearly',
    'No ambiguity'
  ],
  'ghosting': [
    'Call them out',
    'Casual reconnect',
    'Ask why',
    'Final closure',
    'Say goodbye'
  ]
};

export const GOALS_BY_CATEGORY: Record<string, string[]> = {
  'Romantic': ['Get a date', 'Build connection', 'Flirt', 'Express interest'],
  'Emotional': ['Express feelings', 'Resolve conflict', 'Offer support', 'Vent'],
  'Casual': ['Just chat', 'Make them laugh', 'Kill time', 'Catch up'],
  'Professional': ['Network', 'Business inquiry', 'Formal request', 'Collaboration'],
  'Special': ['End conversation', 'Reconnect', 'Clarify status']
};