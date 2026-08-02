import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Square, 
  RotateCw, 
  Globe, 
  ExternalLink, 
  Terminal, 
  FileCode, 
  Sliders, 
  Database, 
  History, 
  Activity, 
  Cpu, 
  HardDrive, 
  Lock, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Save,
  Send,
  Eye,
  EyeOff,
  Copy,
  Download,
  ShieldCheck
} from 'lucide-react';
import { HostedProject, CodeFile, EnvVariable, DeploymentLog } from '../types';

interface ProjectDetailViewProps {
  project: HostedProject;
  onBack: () => void;
  onUpdateProject: (updated: Partial<HostedProject> & { triggerRedeploy?: boolean }) => void;
  onAction: (action: 'start' | 'stop' | 'restart' | 'redeploy') => void;
  onAddDatabaseAddon: (type: 'postgresql' | 'redis' | 'storage', name: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onOpenLivePreview?: (project: HostedProject) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  onUpdateProject,
  onAction,
  onAddDatabaseAddon,
  onDeleteProject,
  onOpenLivePreview
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'code' | 'logs' | 'settings' | 'addons' | 'history'>('overview');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Code Editing State
  const [files, setFiles] = useState<CodeFile[]>(project.files);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [isSavingCode, setIsSavingCode] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Settings State
  const [installCommand, setInstallCommand] = useState(project.installCommand);
  const [startCommand, setStartCommand] = useState(project.startCommand);
  const [port, setPort] = useState(project.port);
  const [envVars, setEnvVars] = useState<EnvVariable[]>(project.envVars);
  const [showSecrets, setShowSecrets] = useState<{ [id: string]: boolean }>({});

  // API Tester State
  const [testMethod, setTestMethod] = useState<'GET' | 'POST'>('GET');
  const [testEndpoint, setTestEndpoint] = useState('/');
  const [testBody, setTestBody] = useState('{\n  "name": "Test Client"\n}');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  // AI Diagnostic State
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<any>(null);

  // Log Search & Filter
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'runtime' | 'build'>('all');
  const [logSearch, setLogSearch] = useState('');

  // Handle Code Save & Redeploy
  const handleSaveCode = () => {
    setIsSavingCode(true);
    setTimeout(() => {
      onUpdateProject({
        files: files,
        triggerRedeploy: true
      });
      setIsSavingCode(false);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    }, 1000);
  };

  // Handle Settings Save
  const handleSaveSettings = () => {
    onUpdateProject({
      installCommand,
      startCommand,
      port,
      envVars,
      triggerRedeploy: true
    });
  };

  // API Tester Execution
  const handleRunApiTest = async () => {
    setIsTestingApi(true);
    setTimeout(() => {
      if (testEndpoint === '/api/health' || testEndpoint === '/health') {
        setTestResponse({
          status: 200,
          statusText: 'OK',
          timeMs: 24,
          data: { status: 'healthy', service: project.name, uptime_seconds: 14290 }
        });
      } else if (testEndpoint === '/api/data' || testEndpoint === '/data') {
        setTestResponse({
          status: 200,
          statusText: 'OK',
          timeMs: 38,
          data: { items: [{ id: 1, name: 'Sample Item' }, { id: 2, name: 'Sample Item 2' }], count: 2 }
        });
      } else {
        setTestResponse({
          status: 200,
          statusText: 'OK',
          timeMs: 18,
          data: {
            service: project.name,
            language: project.language,
            environment: 'production',
            message: `Réponse en direct simulée du serveur hébergé sur le port ${project.port}!`,
            timestamp: new Date().toISOString()
          }
        });
      }
      setIsTestingApi(false);
    }, 600);
  };

  // Run AI Diagnosis on Logs
  const handleRunAiDiagnosis = async () => {
    setIsDiagnosing(true);
    try {
      const res = await fetch('/api/ai-diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs: project.logs,
          files: files,
          installCommand: project.installCommand,
          startCommand: project.startCommand,
          language: project.language
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiDiagnosis(data.diagnosis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Filter logs
  const filteredLogs = project.logs.filter((log) => {
    if (logFilter === 'error' && log.level !== 'error') return false;
    if (logFilter === 'runtime' && log.source !== 'runtime') return false;
    if (logFilter === 'build' && log.source !== 'build') return false;
    if (logSearch && !log.message.toLowerCase().includes(logSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Detail View Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="Retour aux projets"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2 py-0.5 text-xs font-bold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-md font-mono">
                  {project.language}
                </span>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  project.status === 'running' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                }`}>
                  {project.status === 'running' ? '🟢 En ligne' : '⏸️ Arrêté'}
                </span>
                <span className="text-xs text-slate-500 font-mono">Port {project.port}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{project.name}</h1>
            </div>
          </div>

          {/* Quick Actions & Live Link */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenLivePreview?.(project)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-sky-500/50 text-sky-400 text-xs font-mono font-semibold rounded-xl transition cursor-pointer"
              title="Tester le lien avec le simulateur HTTP CloudHost"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="truncate max-w-[200px] text-white font-bold">{project.domain}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-sky-400" />
            </button>

            {project.status === 'running' ? (
              <button
                onClick={() => onAction('stop')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold rounded-xl transition"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={() => onAction('start')}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl transition"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Démarrer</span>
              </button>
            )}

            <button
              onClick={() => onAction('redeploy')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Redéployer</span>
            </button>

            {onDeleteProject && (
              <button
                onClick={() => setShowConfirmDelete(!showConfirmDelete)}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-xl transition"
                title="Supprimer ce projet"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>
            )}
          </div>

        </div>

        {/* Delete Confirmation Modal Banner */}
        {showConfirmDelete && (
          <div className="p-4 bg-rose-950/90 border border-rose-500/50 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Suppression définitive du projet</h4>
                <p className="text-slate-300">Êtes-vous sûr de vouloir supprimer "{project.name}" ? Cette action est irréversible et supprimera le conteneur, les fichiers et les logs.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end shrink-0">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowConfirmDelete(false);
                  onDeleteProject?.(project.id);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmer la suppression</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-t border-slate-800 mt-6 pt-4 overflow-x-auto text-xs font-medium">
          {[
            { id: 'overview', label: '📊 Aperçu & Test API', icon: Activity },
            { id: 'code', label: '💻 Éditeur de Code', icon: FileCode },
            { id: 'logs', label: '🖥️ Logs Terminal', icon: Terminal },
            { id: 'settings', label: '⚙️ Paramètres & .env', icon: Sliders },
            { id: 'addons', label: '🗄️ Base de données', icon: Database },
            { id: 'history', label: '📜 Historique', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* TAB 1: OVERVIEW & LIVE PREVIEW & API TESTER */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <Cpu className="w-3.5 h-3.5 text-sky-400" /> Charge CPU
              </span>
              <div className="text-2xl font-extrabold text-white font-mono">{project.metrics.cpuUsagePercent}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-sky-500 h-full" style={{ width: `${project.metrics.cpuUsagePercent}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" /> RAM Utilisée
              </span>
              <div className="text-2xl font-extrabold text-white font-mono">{project.metrics.memoryUsageMb} <span className="text-xs text-slate-500">/ {project.metrics.memoryLimitMb} Mo</span></div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: `${(project.metrics.memoryUsageMb / project.metrics.memoryLimitMb) * 100}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Requêtes / min
              </span>
              <div className="text-2xl font-extrabold text-white font-mono">{project.metrics.requestsPerMin}</div>
              <span className="text-[10px] text-emerald-400">Temps de réponse mso: {project.metrics.responseTimeMs}ms</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Disponibilité
              </span>
              <div className="text-2xl font-extrabold text-white font-mono">{project.metrics.uptimePercentage}%</div>
              <span className="text-[10px] text-slate-500">SSL Let's Encrypt Actif</span>
            </div>
          </div>

          {/* Live Preview / REST API Tester Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Container Web Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[420px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-400" />
                  <span>Aperçu du Web Service</span>
                </h3>
                <span className="text-xs text-emerald-400 font-mono">Port {project.port} (HTTP OK)</span>
              </div>

              {/* Mock Browser Frame */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="ml-2 text-slate-300 truncate">https://{project.domain}/</span>
                </div>
                <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-center items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl mb-3 border border-emerald-500/20">
                    🟢
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">{project.name} en ligne</h4>
                  <p className="text-xs text-slate-400 max-w-sm mb-4">
                    Le serveur {project.language.toUpperCase()} répond parfaitement aux requêtes entrantes.
                  </p>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-left font-mono text-[11px] text-emerald-300 w-full max-w-md">
                    <pre>{`{\n  "status": "online",\n  "app": "${project.name}",\n  "port": ${project.port},\n  "ssl": true\n}`}</pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: REST API Endpoint Tester */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[420px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-400" />
                  <span>Testeur de Requêtes API</span>
                </h3>
                <span className="text-[11px] text-slate-500">Tester vos endpoints en direct</span>
              </div>

              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex gap-2">
                  <select
                    value={testMethod}
                    onChange={(e) => setTestMethod(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-sky-400 focus:outline-none"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                  <input
                    type="text"
                    value={testEndpoint}
                    onChange={(e) => setTestEndpoint(e.target.value)}
                    placeholder="/api/health"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={handleRunApiTest}
                    disabled={isTestingApi}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  >
                    {isTestingApi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Envoyer</span>
                  </button>
                </div>

                {testMethod === 'POST' && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Body JSON:</span>
                    <textarea
                      rows={3}
                      value={testBody}
                      onChange={(e) => setTestBody(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-emerald-300 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs overflow-y-auto">
                  {testResponse ? (
                    <div>
                      <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-800 mb-2">
                        <span className="text-emerald-400 font-bold">STATUS 200 OK</span>
                        <span className="text-slate-500">{testResponse.timeMs}ms</span>
                      </div>
                      <pre className="text-emerald-300 text-[11px]">{JSON.stringify(testResponse.data, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className="text-slate-600 text-center py-8">
                      Cliquez sur "Envoyer" pour tester l'endpoint backend.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: CODE FILE EDITOR */}
      {activeTab === 'code' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Éditeur de Code Source Cloud</h3>
              <p className="text-xs text-slate-400">Modifiez votre code en direct et sauvegardez pour redéployer le conteneur</p>
            </div>
            <button
              onClick={handleSaveCode}
              disabled={isSavingCode}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50"
            >
              {isSavingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Sauvegarder & Redéployer</span>
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Modifications enregistrées ! Redéploiement automatique déclenché.</span>
            </div>
          )}

          {/* Code Tabs */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[480px]">
            <div className="flex items-center border-b border-slate-800 bg-slate-900/60 overflow-x-auto px-2">
              {files.map((f, idx) => (
                <button
                  key={f.path}
                  onClick={() => setActiveFileIndex(idx)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono border-b-2 transition ${
                    activeFileIndex === idx
                      ? 'border-sky-500 text-sky-400 bg-slate-950 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{f.path}</span>
                </button>
              ))}
            </div>

            <textarea
              value={files[activeFileIndex]?.content || ''}
              onChange={(e) => {
                const updated = [...files];
                updated[activeFileIndex].content = e.target.value;
                setFiles(updated);
              }}
              className="flex-1 bg-slate-950 text-emerald-300 p-4 focus:outline-none resize-none font-mono text-xs leading-relaxed"
              spellCheck="false"
            />
          </div>
        </div>
      )}

      {/* TAB 3: LIVE LOGS & AI DIAGNOSIS */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <span>Logs en direct du Conteneur</span>
              </h3>
              <p className="text-xs text-slate-400">Flux d'événements de build et de runtime (stdout/stderr)</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Filtrer les logs..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />

              <button
                onClick={handleRunAiDiagnosis}
                disabled={isDiagnosing}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 rounded-xl text-xs font-semibold transition"
              >
                {isDiagnosing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                <span>Diagnostiquer via IA</span>
              </button>
            </div>
          </div>

          {aiDiagnosis && (
            <div className="bg-indigo-950/60 border border-indigo-500/30 rounded-xl p-4 text-xs text-indigo-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Rapport d'analyse IA Gemini</span>
                </h4>
                <button onClick={() => setAiDiagnosis(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <p><strong>Cause :</strong> {aiDiagnosis.cause}</p>
              <p><strong>Correction recommandée :</strong> {aiDiagnosis.suggestedFix}</p>
            </div>
          )}

          {/* Log Console Output */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs h-[420px] overflow-y-auto space-y-2">
            {filteredLogs.map((l) => (
              <div key={l.id} className="flex items-start gap-3">
                <span className="text-slate-600 text-[10px] shrink-0 pt-0.5">{new Date(l.timestamp).toLocaleTimeString()}</span>
                <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase shrink-0 ${
                  l.level === 'error' ? 'bg-rose-500/20 text-rose-400' :
                  l.level === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                  l.level === 'command' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {l.source}
                </span>
                <span className={`flex-1 leading-relaxed ${
                  l.level === 'error' ? 'text-rose-300' :
                  l.level === 'success' ? 'text-emerald-300 font-bold' :
                  l.level === 'command' ? 'text-amber-300 font-bold' : 'text-slate-300'
                }`}>
                  {l.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS & ENVIRONMENT VARIABLES */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Paramètres de Build & Variables d'environnement</h3>
              <p className="text-xs text-slate-400">Modifiez vos commandes d'exécution et clés secrètes</p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les paramètres</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Commande d'installation (Build)
              </label>
              <input
                type="text"
                value={installCommand}
                onChange={(e) => setInstallCommand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Commande de démarrage (Start)
              </label>
              <input
                type="text"
                value={startCommand}
                onChange={(e) => setStartCommand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Variables d'environnement (.env)
              </label>
              <button
                onClick={() => setEnvVars([...envVars, { id: String(Date.now()), key: '', value: '', isSecret: false }])}
                className="flex items-center gap-1 text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>

            <div className="space-y-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
              {envVars.map((ev) => (
                <div key={ev.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ev.key}
                    onChange={(e) => setEnvVars(envVars.map((v) => v.id === ev.id ? { ...v, key: e.target.value.toUpperCase() } : v))}
                    className="w-1/3 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase focus:outline-none"
                  />
                  <input
                    type={showSecrets[ev.id] || !ev.isSecret ? 'text' : 'password'}
                    value={ev.value}
                    onChange={(e) => setEnvVars(envVars.map((v) => v.id === ev.id ? { ...v, value: e.target.value } : v))}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => setEnvVars(envVars.filter((v) => v.id !== ev.id))}
                    className="p-1 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-rose-900/40">
            <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Zone dangereuse
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  La suppression de ce projet effacera définitivement le déploiement, ses fichiers et son historique de logs.
                </p>
              </div>
              {onDeleteProject && (
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs rounded-xl transition shrink-0 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer le projet</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: DATABASE & ADDONS */}
      {activeTab === 'addons' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white">Bases de données & Add-ons en 1-Click</h3>
            <p className="text-xs text-slate-400">Attachez une base de données PostgreSQL ou Redis avec injection automatique de l'URL</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => onAddDatabaseAddon('postgresql', `${project.name}-postgres`)}
              className="p-5 bg-slate-950 border border-slate-800 hover:border-sky-500 rounded-xl text-left transition space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-lg">
                🐘
              </div>
              <h4 className="font-bold text-white group-hover:text-sky-400">PostgreSQL Cloud</h4>
              <p className="text-xs text-slate-400">Base relationnelle SQL managée. Injecte DATABASE_URL.</p>
            </button>

            <button
              onClick={() => onAddDatabaseAddon('redis', `${project.name}-redis`)}
              className="p-5 bg-slate-950 border border-slate-800 hover:border-rose-500 rounded-xl text-left transition space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-lg">
                🔴
              </div>
              <h4 className="font-bold text-white group-hover:text-rose-400">Redis Cache & KV</h4>
              <p className="text-xs text-slate-400">Stockage mémoire rapide. Injecte REDIS_URL.</p>
            </button>

            <button
              onClick={() => onAddDatabaseAddon('storage', `${project.name}-s3`)}
              className="p-5 bg-slate-950 border border-slate-800 hover:border-amber-500 rounded-xl text-left transition space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg">
                🪣
              </div>
              <h4 className="font-bold text-white group-hover:text-amber-400">Object Storage S3</h4>
              <p className="text-xs text-slate-400">Stockage de fichiers et médias. Injecte STORAGE_BUCKET_URL.</p>
            </button>
          </div>

          {/* Active Addons List */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Add-ons Attachés</h4>
            {project.addons.length > 0 ? (
              project.addons.map((a) => (
                <div key={a.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{a.name}</span>
                    <span className="ml-2 text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold uppercase">{a.status}</span>
                    <code className="block text-slate-400 font-mono text-[11px] mt-1">{a.connectionUrl}</code>
                  </div>
                  <span className="text-slate-500">{a.allocatedSizeMb} Mo</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">Aucune base de données attachée pour le moment.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: DEPLOYMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Historique des Déploiements & Rollback</h3>
          <div className="space-y-3">
            {project.deployments.map((dep) => (
              <div key={dep.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sky-400 font-bold">{dep.commitHash}</span>
                    <span className="text-white font-medium">{dep.commitMessage}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Déployé le {new Date(dep.deployedAt).toLocaleString()} • Durée: {Math.round(dep.durationMs / 1000)}s
                  </div>
                </div>
                <button
                  onClick={() => onAction('redeploy')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold"
                >
                  Restaurer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
