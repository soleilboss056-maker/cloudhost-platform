import React, { useState, useEffect } from 'react';
import { 
  X, 
  Globe, 
  Play, 
  RotateCw, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Copy, 
  Check, 
  Cpu, 
  HardDrive, 
  Activity, 
  ExternalLink,
  Code2,
  RefreshCw
} from 'lucide-react';
import { HostedProject } from '../types';

interface LivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: HostedProject | null;
}

export const LivePreviewModal: React.FC<LivePreviewModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'api' | 'keepalive' | 'headers'>('preview');
  const [customPath, setCustomPath] = useState('/');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST'>('GET');
  const [responseStatus, setResponseStatus] = useState<number>(200);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({
    'content-type': 'application/json; charset=utf-8',
    'x-xss-protection': '1; mode=block',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'SAMEORIGIN',
    'server': 'CloudHost-Container-Runner/v2.4',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*'
  });
  const [responseBody, setResponseBody] = useState<string>('');
  const [isPingLoading, setIsPingLoading] = useState(false);
  const [lastPingTime, setLastPingTime] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (project) {
      runSimulation(customPath);
    }
  }, [project, customPath]);

  if (!isOpen || !project) return null;

  const fullUrl = `https://${project.domain}${customPath}`;

  function runSimulation(path: string) {
    setIsPingLoading(true);
    setTimeout(() => {
      setLastPingTime(new Date().toLocaleTimeString('fr-FR'));
      setIsPingLoading(false);

      if (project?.status !== 'running') {
        setResponseStatus(503);
        setResponseBody(JSON.stringify({
          error: "Service Temporarily Unavailable",
          status: "stopped",
          message: `Le conteneur ${project?.name} est actuellement en pause ou en cours de démarrage.`
        }, null, 2));
        return;
      }

      setResponseStatus(200);
      if (path === '/api/health' || path === '/health') {
        setResponseBody(JSON.stringify({
          status: "healthy",
          uptime_seconds: Math.floor(Math.random() * 50000 + 1200),
          container_id: `ct-${project.id.slice(0, 8)}`,
          memory_used_mb: project.metrics.memoryUsageMb,
          cpu_usage_percent: project.metrics.cpuUsagePercent,
          timestamp: new Date().toISOString()
        }, null, 2));
      } else if (path === '/metrics') {
        setResponseBody(`# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.
# TYPE process_cpu_seconds_total counter
process_cpu_seconds_total ${project.metrics.cpuUsagePercent * 0.12}
# HELP process_resident_memory_bytes Resident memory size in bytes.
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes ${project.metrics.memoryUsageMb * 1024 * 1024}
# HELP http_requests_total Total number of HTTP requests.
# TYPE http_requests_total counter
http_requests_total 14290`);
      } else {
        if (project.language === 'python') {
          setResponseBody(JSON.stringify({
            message: `Bienvenue sur l'API FastAPI/Flask de ${project.name}`,
            status: "online",
            environment: "production",
            framework: "Uvicorn ASGI v0.27",
            endpoints: ["/", "/api/health", "/metrics", "/docs"],
            security: {
              xss_protected: true,
              cors_enabled: true
            }
          }, null, 2));
        } else {
          setResponseBody(JSON.stringify({
            app_name: project.name,
            version: "1.0.0",
            status: "running",
            server: "Node.js v20.11.0 Express",
            live_ping_status: "200 OK",
            keep_alive: "Enabled (30s frequency)"
          }, null, 2));
        }
      }
    }, 250);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[680px] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        
        {/* Top Window Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <div className="h-4 w-px bg-slate-800"></div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-xs">{project.name}</span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full">
                HTTP/2 LIVE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => runSimulation(customPath)}
              disabled={isPingLoading}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-xs transition flex items-center gap-1"
              title="Actualiser la réponse HTTP"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPingLoading ? 'animate-spin text-sky-400' : ''}`} />
              <span className="hidden sm:inline">Tester Ping</span>
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Address & Navigation Bar */}
        <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-400 font-mono">
            <span className="font-bold text-sky-400">{httpMethod}</span>
          </div>

          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 text-xs font-mono text-slate-200">
            <div className="flex items-center gap-2 truncate">
              <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-500">https://</span>
              <span className="text-white font-semibold truncate">{project.domain}</span>
              <input
                type="text"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                className="bg-transparent text-sky-300 font-bold focus:outline-none w-32 truncate"
                placeholder="/"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopy}
                className="p-1 text-slate-400 hover:text-white transition"
                title="Copier l'URL"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 ${
              responseStatus === 200 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${responseStatus === 200 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
              {responseStatus} OK
            </span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'preview' ? 'bg-sky-500/10 text-sky-400 font-bold border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Réponse API / JSON</span>
          </button>
          <button
            onClick={() => setActiveTab('keepalive')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'keepalive' ? 'bg-sky-500/10 text-sky-400 font-bold border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Keep-Alive Status</span>
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'headers' ? 'bg-sky-500/10 text-sky-400 font-bold border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>En-têtes HTTPS & Sécurité</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/60 font-mono text-xs">
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Fast Route shortcuts:</span>
                  <button onClick={() => setCustomPath('/')} className="hover:text-sky-400 underline font-bold">
                    /
                  </button>
                  <button onClick={() => setCustomPath('/api/health')} className="hover:text-sky-400 underline font-bold">
                    /api/health
                  </button>
                  <button onClick={() => setCustomPath('/metrics')} className="hover:text-sky-400 underline font-bold">
                    /metrics
                  </button>
                </div>
                <span>Taille: {responseBody.length} octets</span>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-emerald-400 whitespace-pre-wrap font-mono leading-relaxed shadow-inner overflow-x-auto">
                {responseBody}
              </div>
            </div>
          )}

          {activeTab === 'keepalive' && (
            <div className="space-y-6 font-sans">
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                    <h4 className="font-extrabold text-white text-sm">Système Keep-Alive CloudHost Actif</h4>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[11px] font-mono font-bold rounded-lg border border-emerald-500/30">
                    200 OK Ping
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ce conteneur bénéficie d'une boucle de pings automatiques toutes les 30 secondes pour prévenir toute mise en veille ou freeze de mémoire.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Dernier Ping Réussi</span>
                    <span className="text-emerald-400 font-bold">{lastPingTime || 'À l\'instant'}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Intervalle Automatique</span>
                    <span className="text-sky-400 font-bold">30 Secondes</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Uptime Conteneur</span>
                    <span className="text-indigo-400 font-bold">99.98%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'headers' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                <h4 className="font-sans font-extrabold text-white text-xs mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>En-têtes de Sécurité & HTTPS appliqués</span>
                </h4>
                {Object.entries(responseHeaders).map(([k, v], idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-900 last:border-0">
                    <span className="text-sky-400 font-bold">{k}:</span>
                    <span className="text-slate-300 truncate max-w-md">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
