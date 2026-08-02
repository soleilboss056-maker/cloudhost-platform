import React from 'react';
import { 
  Server, 
  Plus, 
  Search, 
  Sparkles,
  User,
  GraduationCap
} from 'lucide-react';
import { HostedProject, UserProfile } from '../types';

interface NavbarProps {
  projects: HostedProject[];
  currentUser: UserProfile | null;
  onOpenNewProject: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAiCopilot: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenNewProject,
  searchQuery,
  onSearchChange,
  onOpenAiCopilot,
  onOpenAuth
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Logo & Cluster Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">CloudHost</span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                  Render Ready
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Cluster Render.com Sync</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-sm hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher un projet, domaine ou langage (Python, Node)..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
              />
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center gap-2">
            
            {/* AI Assistant */}
            <button
              onClick={onOpenAiCopilot}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition relative"
              title="IA Assistant Déploiement"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xl:inline">IA Copilot</span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                Bientôt
              </span>
            </button>

            {/* Auth Button */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition"
            >
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">
                {currentUser ? currentUser.name.split(' ')[0] : 'Connexion'}
              </span>
            </button>

            {/* Deploy New Project */}
            <button
              onClick={onOpenNewProject}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-sky-500/25 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau Projet</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
