import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  RotateCw, 
  Terminal, 
  ExternalLink, 
  Settings, 
  Code2, 
  Cpu, 
  HardDrive, 
  GitBranch, 
  Globe,
  Database,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
  Trash2
} from 'lucide-react';
import { HostedProject, LanguageType } from '../types';

interface ProjectCardProps {
  project: HostedProject;
  onSelectProject: (p: HostedProject) => void;
  onAction: (projectId: string, action: 'start' | 'stop' | 'restart' | 'redeploy') => void;
  onDeleteProject?: (projectId: string) => void;
  onOpenLivePreview?: (project: HostedProject) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onSelectProject,
  onAction,
  onDeleteProject,
  onOpenLivePreview
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const getLanguageBadge = (lang: LanguageType) => {
    switch (lang) {
      case 'python':
        return { label: 'Python', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'nodejs':
        return { label: 'Node.js', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'go':
        return { label: 'Go', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
      case 'rust':
        return { label: 'Rust', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
      case 'static':
        return { label: 'HTML/CSS', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
      default:
        return { label: lang.toUpperCase(), color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }
  };

  const langBadge = getLanguageBadge(project.language);

  const getStatusBadge = () => {
    switch (project.status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            En cours (Keep-Alive 30s)
          </span>
        );
      case 'deploying':
      case 'building':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full text-xs font-semibold">
            <Loader2 className="w-3 h-3 animate-spin" />
            Déploiement
          </span>
        );
      case 'stopped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-full text-xs font-semibold">
            <Square className="w-3 h-3 text-slate-400" />
            En pause
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-semibold">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Échec
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between group">
      
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2 py-0.5 text-[11px] font-bold border rounded-md uppercase tracking-wider ${langBadge.color}`}>
                {langBadge.label}
              </span>
              {getStatusBadge()}
            </div>
            <h3 
              onClick={() => onSelectProject(project)}
              className="text-lg font-bold text-white hover:text-sky-400 cursor-pointer transition line-clamp-1"
            >
              {project.name}
            </h3>
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
            {project.status === 'running' ? (
              <button
                onClick={() => onAction(project.id, 'stop')}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition"
                title="Mettre en pause le conteneur"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onAction(project.id, 'start')}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg transition"
                title="Démarrer le conteneur"
              >
                <Play className="w-4 h-4 fill-emerald-400/20" />
              </button>
            )}

            <button
              onClick={() => onAction(project.id, 'restart')}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded-lg transition"
              title="Redémarrer le conteneur"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {onDeleteProject && (
              <button
                onClick={() => setShowConfirmDelete(!showConfirmDelete)}
                className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition"
                title="Supprimer ce projet"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation Banner */}
        {showConfirmDelete && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-xs space-y-2 animate-fadeIn">
            <p className="text-rose-200 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Voulez-vous vraiment supprimer "{project.name}" ?</span>
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowConfirmDelete(false);
                  onDeleteProject?.(project.id);
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Confirmer</span>
              </button>
            </div>
          </div>
        )}

        {/* Description & Domain */}
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {project.description}
        </p>

        {/* Live Public URL */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenLivePreview) onOpenLivePreview(project);
          }}
          className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 hover:border-sky-500/40 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-slate-300 mb-4 font-mono cursor-pointer transition group/url"
        >
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0 group-hover/url:animate-pulse" />
            <span className="truncate group-hover/url:text-sky-300 font-bold">{project.domain}</span>
          </div>
          <button
            type="button"
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded transition shrink-0 flex items-center gap-1 text-[11px] font-sans"
            title="Tester le lien en direct avec le simulateur HTTP CloudHost"
          >
            <span className="hidden sm:inline font-semibold">Tester HTTP</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Commands Preview */}
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-4 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Install</span>
            <code className="text-amber-300 font-mono text-[10px] truncate block">{project.installCommand}</code>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Start</span>
            <code className="text-emerald-300 font-mono text-[10px] truncate block">{project.startCommand}</code>
          </div>
        </div>
      </div>

      {/* Footer Metrics & Settings Trigger */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        {/* Resource Usage */}
        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <div className="flex items-center gap-1" title="Usage CPU">
            <Cpu className="w-3 h-3 text-sky-400" />
            <span>{project.metrics.cpuUsagePercent}%</span>
          </div>
          <div className="flex items-center gap-1" title="Usage Mémoire RAM">
            <HardDrive className="w-3 h-3 text-purple-400" />
            <span>{project.metrics.memoryUsageMb} Mo</span>
          </div>
          {project.envVars.length > 0 && (
            <div className="flex items-center gap-1 text-slate-500" title="Variables d'environnement chargées">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>{project.envVars.length} env</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => onSelectProject(project)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span>Gérer</span>
        </button>
      </div>

    </div>
  );
};
