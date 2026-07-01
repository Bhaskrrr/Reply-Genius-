import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title, showBack, onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <header className="w-full max-w-2xl px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {showBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          {title ? (
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              {title}
            </h1>
          ) : (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">ReplyGenius</span>
            </div>
          )}
        </div>
      </header>

      <main className="w-full max-w-2xl px-6 py-8 flex-1 flex flex-col">
        {children}
      </main>

      <footer className="w-full max-w-2xl px-6 py-6 text-center text-xs text-slate-400">
        Powered by Gemini 3 Pro • AI responses may vary
      </footer>
    </div>
  );
};

export default Layout;
