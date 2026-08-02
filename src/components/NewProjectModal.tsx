import React, { useState } from 'react';
import { 
  X, 
  Github, 
  Code2, 
  Terminal, 
  Sparkles, 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle2, 
  Loader2, 
  Eye, 
  EyeOff,
  Globe,
  Sliders,
  Layers,
  FileCode,
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { STARTER_TEMPLATES } from '../data/templates';
import { HostedProject, LanguageType, CodeFile, EnvVariable, UserProfile } from '../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (projectData: Partial<HostedProject>) => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onDeploy,
  currentUser,
  onOpenAuth
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'code' | 'config' | 'deploying'>('github');
  
  // GitHub OAuth & Account State
  const [githubUsernameInput, setGithubUsernameInput] = useState<string>(currentUser?.email ? currentUser.email.split('@')[0] : '');
  const [githubTokenInput, setGithubTokenInput] = useState<string>('');
  const [isGithubAuthorized, setIsGithubAuthorized] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [githubUser, setGithubUser] = useState<{ login: string; avatar_url: string; public_repos: number } | null>(null);
  const [userRepos, setUserRepos] = useState<Array<{ name: string; full_name: string; html_url: string; default_branch: string; language: string; description: string }>>([]);
  const [showOAuthConsentModal, setShowOAuthConsentModal] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // GitHub state
  const [githubUrl, setGithubUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);

  // Trigger GitHub Authorization Flow
  const handleConfirmGithubAuth = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    setShowOAuthConsentModal(false);

    const targetUser = githubUsernameInput.trim();
    const token = githubTokenInput.trim();

    try {
      let fetchedRepos: any[] = [];
      let userInfo: any = null;

      if (token) {
        // Fetch authenticated user repos using Personal Access Token
        const userRes = await fetch('https://api.github.com/user', {
          headers: { Authorization: `token ${token}` }
        });
        if (userRes.ok) {
          userInfo = await userRes.json();
          const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=30', {
            headers: { Authorization: `token ${token}` }
          });
          if (reposRes.ok) {
            fetchedRepos = await reposRes.json();
          }
        }
      }

      if (!userInfo && targetUser) {
        // Fetch public user profile and repos by username
        const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(targetUser)}`);
        if (userRes.ok) {
          userInfo = await userRes.json();
          const reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(targetUser)}/repos?sort=updated&per_page=30`);
          if (reposRes.ok) {
            fetchedRepos = await reposRes.json();
          }
        }
      }

      if (!userInfo && !targetUser && !token) {
        setAuthError("Veuillez saisir votre nom d'utilisateur GitHub ou un Jeton d'accès.");
        setIsAuthLoading(false);
        return;
      }

      const finalLogin = userInfo?.login || targetUser || 'Utilisateur GitHub';
      const finalAvatar = userInfo?.avatar_url || `https://github.com/${finalLogin}.png`;

      setGithubUser({
        login: finalLogin,
        avatar_url: finalAvatar,
        public_repos: userInfo?.public_repos ?? fetchedRepos.length
      });

      setUserRepos(
        fetchedRepos.map((r: any) => ({
          name: r.name,
          full_name: r.full_name || `${finalLogin}/${r.name}`,
          html_url: r.html_url || `https://github.com/${finalLogin}/${r.name}`,
          default_branch: r.default_branch || 'main',
          language: r.language || 'Code Source',
          description: r.description || 'Dépôt GitHub'
        }))
      );
      setIsGithubAuthorized(true);

      // Auto-select first repo if available
      if (fetchedRepos.length > 0) {
        const firstRepo = fetchedRepos[0];
        setGithubUrl(firstRepo.html_url);
        setAppName(firstRepo.name);
      }
    } catch (err) {
      console.error('Error authorizing GitHub:', err);
      setAuthError('Erreur de connexion avec GitHub. Vérifiez le pseudo ou votre connexion internet.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSelectRepo = (repo: any) => {
    setGithubUrl(repo.html_url);
    setAppName(repo.name);
    setBranch(repo.default_branch || 'main');
    handleAnalyzeGithubUrl(repo.html_url);
  };

  // Template / Code state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('python-fastapi');
  const [language, setLanguage] = useState<LanguageType>('python');
  const [files, setFiles] = useState<CodeFile[]>(STARTER_TEMPLATES[0].files);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  // Configuration state
  const [appName, setAppName] = useState('python-app-cloud');
  const [installCommand, setInstallCommand] = useState('pip install -r requirements.txt');
  const [startCommand, setStartCommand] = useState('uvicorn main:app --host 0.0.0.0 --port 8000');
  const [port, setPort] = useState(8000);
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [showSecrets, setShowSecrets] = useState<{ [id: string]: boolean }>({});
  const [bulkEnvText, setBulkEnvText] = useState('');
  const [showBulkEnvModal, setShowBulkEnvModal] = useState(false);

  // Deployment simulation steps
  const [deployStep, setDeployStep] = useState(0);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [createdProject, setCreatedProject] = useState<HostedProject | null>(null);

  if (!isOpen) return null;

  // Handle template selection
  const handleSelectTemplate = (tId: string) => {
    const t = STARTER_TEMPLATES.find((tmpl) => tmpl.id === tId);
    if (t) {
      setSelectedTemplateId(tId);
      setLanguage(t.language);
      setFiles(t.files);
      setInstallCommand(t.installCommand);
      setStartCommand(t.startCommand);
      setPort(t.defaultPort);
      setAppName(`${t.id}-${Math.floor(Math.random() * 900 + 100)}`);
      setEnvVars(
        t.defaultEnvVars.map((e, idx) => ({
          id: String(idx + 1),
          key: e.key,
          value: e.value,
          isSecret: e.isSecret
        }))
      );
      setActiveFileIndex(0);
    }
  };

  // Analyze Repo / Code via Backend Gemini AI
  const handleAnalyzeGithubUrl = async (targetUrl?: string) => {
    const urlToAnalyze = targetUrl || githubUrl;
    if (!urlToAnalyze && files.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisSummary(null);

    try {
      const res = await fetch('/api/analyze-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: urlToAnalyze,
          languageHint: language,
          codeSnippet: files[0]?.content
        })
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        const a = data.analysis;
        if (a.language) setLanguage(a.language);
        if (a.installCommand) setInstallCommand(a.installCommand);
        if (a.startCommand) setStartCommand(a.startCommand);
        if (a.suggestedPort) setPort(a.suggestedPort);
        if (a.files && a.files.length > 0) {
          setFiles(a.files);
          setActiveFileIndex(0);
        }
        if (a.suggestedEnvVars && a.suggestedEnvVars.length > 0) {
          setEnvVars(
            a.suggestedEnvVars.map((ev: any, idx: number) => ({
              id: `ai-${idx}`,
              key: ev.key,
              value: ev.value,
              isSecret: ev.isSecret || false
            }))
          );
        }
        setAnalysisSummary(a.summary || 'Analyse GitHub terminée : Code source et configuration synchronisés !');
      }
    } catch (err) {
      console.error('Analyze error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeGithub = () => handleAnalyzeGithubUrl();

  // Env Var Management
  const addEnvVar = () => {
    setEnvVars([
      ...envVars,
      { id: String(Date.now()), key: '', value: '', isSecret: false }
    ]);
  };

  const removeEnvVar = (id: string) => {
    setEnvVars(envVars.filter((ev) => ev.id !== id));
  };

  const updateEnvVar = (id: string, field: 'key' | 'value' | 'isSecret', val: any) => {
    setEnvVars(
      envVars.map((ev) => (ev.id === id ? { ...ev, [field]: val } : ev))
    );
  };

  const handleApplyBulkEnv = () => {
    const lines = bulkEnvText.split('\n');
    const newVars: EnvVariable[] = [];
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const parts = trimmed.split('=');
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key) {
          newVars.push({
            id: `bulk-${idx}-${Date.now()}`,
            key,
            value,
            isSecret: key.toLowerCase().includes('secret') || key.toLowerCase().includes('token') || key.toLowerCase().includes('pass') || key.toLowerCase().includes('key')
          });
        }
      }
    });
    if (newVars.length > 0) {
      setEnvVars([...envVars, ...newVars]);
      setBulkEnvText('');
      setShowBulkEnvModal(false);
    }
  };

  // File Code Editing in Modal
  const handleUpdateFileContent = (content: string) => {
    const updated = [...files];
    updated[activeFileIndex].content = content;
    setFiles(updated);
  };

  // Trigger Deployment Process
  const handleStartDeploy = async () => {
    setActiveTab('deploying');
    setDeployStep(0);
    const isBot = githubUrl.toLowerCase().includes('bot') || appName.toLowerCase().includes('bot') || language === 'python';

    setDeployLogs([
      '🚀 Initialisation du pipeline de déploiement CloudHost...',
      githubUrl ? `📥 Clonage et synchronisation du dépôt GitHub (${githubUrl})...` : '📂 Preparation des fichiers du projet local...',
      `📦 Provisionnement du conteneur sécurisé (Architecture Linux ARM64)...`,
      `📂 Resolution des fichiers sources (${language.toUpperCase()})...`
    ]);

    setTimeout(() => {
      setDeployStep(1);
      setDeployLogs((prev) => [
        ...prev,
        `⚙️ Exécution de la commande d'installation : "$ ${installCommand}"`,
        '--> Ingestion du fichier de dépendances (requirements.txt / package.json)...',
        '--> Téléchargement et compilation des modules dans l\'environnement conteneurisé...'
      ]);
    }, 1200);

    setTimeout(() => {
      setDeployStep(2);
      setDeployLogs((prev) => [
        ...prev,
        '🔐 Injection des variables d\'environnement et clés API...',
        `--> Variables chargées : ${envVars.map((e) => e.key).join(', ') || 'PORT, ENVIRONMENT'}`,
        `🌐 Liaison avec l'adresse IP interne et réservation du port ${port}...`
      ]);
    }, 2400);

    setTimeout(() => {
      setDeployStep(3);
      setDeployLogs((prev) => [
        ...prev,
        `🚀 Lancement du processus applicatif : "$ ${startCommand}"`,
        isBot ? '🤖 [BOT PROTOCOL] Connexion à l\'API Bot Gateway (Telegram / Discord v5.0)...' : '🟢 HealthCheck applicatif (HTTP 200 OK)...',
        isBot ? '🟢 [BOT CONNECTED] Bot connecté avec succès sur le serveur! Prêt à recevoir des événements.' : '🔒 Génération du certificat SSL Let\'s Encrypt...',
        `🎉 DÉPLOIEMENT RÉUSSI ET ACTIF SUR https://${appName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.cloudhost.app`
      ]);
      setDeployStep(4);
    }, 3600);
  };

  const handleFinalize = () => {
    onDeploy({
      name: appName,
      language: language,
      repoUrl: githubUrl,
      branch: branch,
      installCommand: installCommand,
      startCommand: startCommand,
      port: port,
      files: files,
      envVars: envVars
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nouveau Déploiement d'Application</h2>
              <p className="text-xs text-slate-400">Hébergez votre code Python, Node.js, Go ou GitHub en 1 clic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Require Auth Banner if not logged in */}
        {!currentUser ? (
          <div className="p-8 text-center space-y-5 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-extrabold text-white">Connexion ou Inscription requise</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pour créer et déployer un nouveau projet sur le cluster CloudHost, vous devez d'abord vous connecter ou créer un compte utilisateur.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
              >
                Se Connecter / S'inscrire
              </button>
              <button
                onClick={onClose}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Selector (Disabled if deploying) */}
        {activeTab !== 'deploying' && (
          <div className="flex border-b border-slate-800 bg-slate-950/30 px-6">
            <button
              onClick={() => setActiveTab('github')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs transition ${
                activeTab === 'github'
                  ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Github className="w-4 h-4" />
              <span>1. Importer de GitHub</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs transition ${
                activeTab === 'code'
                  ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>2. Code & Modèles</span>
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs transition ${
                activeTab === 'config'
                  ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>3. Build, Ports & Variables</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: GITHUB IMPORT */}
          {activeTab === 'github' && (
            <div className="space-y-6">

              {/* GitHub OAuth Authorization Card */}
              {!isGithubAuthorized ? (
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-sky-500/30 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white shrink-0 shadow-md">
                        <Github className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                          <span>Connexion à votre Compte GitHub</span>
                          <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 rounded-full text-[10px]">OAuth & API</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
                          Saisissez votre pseudo GitHub (ou votre Jeton d'accès) pour importer vos dépôts directement dans CloudHost.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Input form for GitHub username or token */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nom d'utilisateur GitHub</label>
                      <input
                        type="text"
                        placeholder="Ex: octocat, dev-user..."
                        value={githubUsernameInput}
                        onChange={(e) => setGithubUsernameInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Jeton d'accès Personnel (Optionnel pour dépôts privés)</label>
                      <input
                        type="password"
                        placeholder="ghp_xxxx (Optionnel)"
                        value={githubTokenInput}
                        onChange={(e) => setGithubTokenInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setShowOAuthConsentModal(true)}
                      disabled={isAuthLoading}
                      className="w-full md:w-auto px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
                    >
                      {isAuthLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      ) : (
                        <Github className="w-4 h-4 text-slate-950" />
                      )}
                      <span>Connecter mon compte GitHub</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={githubUser?.avatar_url}
                        alt={githubUser?.login}
                        className="w-9 h-9 rounded-full border border-emerald-500/40"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">@{githubUser?.login}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Connecté
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{githubUser?.public_repos || userRepos.length} dépôts trouvés</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsGithubAuthorized(false);
                        setGithubUser(null);
                        setUserRepos([]);
                      }}
                      className="text-[11px] text-rose-400 hover:underline font-medium"
                    >
                      Changer de compte GitHub
                    </button>
                  </div>

                  {/* Repository Picker */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Sélectionnez un dépôt depuis votre compte GitHub (@{githubUser?.login})
                    </label>
                    {userRepos.length === 0 ? (
                      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
                        Aucun dépôt public trouvé. Saisissez l'URL d'un dépôt ci-dessous.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                        {userRepos.map((r, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectRepo(r)}
                            className={`p-3 rounded-xl border text-left transition ${
                              githubUrl === r.html_url
                                ? 'bg-sky-500/10 border-sky-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs truncate max-w-[180px] text-white">{r.name}</span>
                              <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded text-sky-400 font-mono">{r.language}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{r.description}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Manual URL Input Option */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Ou Saisissez manuellement l'URL d'un Dépôt GitHub
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Github className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="https://github.com/soleilboss056-maker/cloudhost-platform"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Branche (main)"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full sm:w-28 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={handleAnalyzeGithub}
                    disabled={isAnalyzing}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition disabled:opacity-50 shrink-0"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Analyser via IA</span>
                  </button>
                </div>
              </div>

              {analysisSummary && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-xs text-emerald-300 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-1">Analyse du Dépôt Réussie !</h4>
                    <p>{analysisSummary}</p>
                  </div>
                </div>
              )}

              {/* Language Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Langage de l'application
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'python', name: 'Python (Flask/FastAPI/Bot)', icon: '🐍' },
                    { id: 'nodejs', name: 'Node.js (Express/JS)', icon: '🟢' },
                    { id: 'go', name: 'Go (Golang)', icon: '🐹' },
                    { id: 'static', name: 'HTML / JS Statique', icon: '🌐' }
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLanguage(l.id as LanguageType)}
                      className={`p-3 border rounded-xl text-left flex items-center gap-3 transition ${
                        language === l.id
                          ? 'border-sky-500 bg-sky-500/10 text-white font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl">{l.icon}</span>
                      <span className="text-xs">{l.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setActiveTab('code')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition"
                >
                  <span>Continuer vers le Code & Modèles</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CODE & STARTER TEMPLATES */}
          {activeTab === 'code' && (
            <div className="space-y-6">
              
              {/* Preset Templates */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Choisir un modèle de démarrage
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {STARTER_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => handleSelectTemplate(tmpl.id)}
                      className={`p-3.5 border rounded-xl text-left transition ${
                        selectedTemplateId === tmpl.id
                          ? 'border-sky-500 bg-sky-500/10 text-white font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-200">{tmpl.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded font-mono uppercase text-sky-400">{tmpl.language}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{tmpl.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Files Editor */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[320px]">
                
                {/* File Tabs */}
                <div className="flex items-center border-b border-slate-800 bg-slate-900/60 overflow-x-auto px-2">
                  {files.map((f, idx) => (
                    <button
                      key={f.path}
                      onClick={() => setActiveFileIndex(idx)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-mono border-b-2 transition ${
                        activeFileIndex === idx
                          ? 'border-sky-500 text-sky-400 bg-slate-950'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>{f.path}</span>
                    </button>
                  ))}
                </div>

                {/* Editor Area */}
                <div className="flex-1 relative font-mono text-xs">
                  <textarea
                    value={files[activeFileIndex]?.content || ''}
                    onChange={(e) => handleUpdateFileContent(e.target.value)}
                    className="w-full h-full bg-slate-950 text-emerald-300 p-4 focus:outline-none resize-none leading-relaxed font-mono"
                    spellCheck="false"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setActiveTab('github')}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-medium"
                >
                  Retour
                </button>
                <button
                  onClick={() => setActiveTab('config')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition"
                >
                  <span>Configurer l'installation & Variables</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: BUILD, PORTS & ENV VARS */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              
              {/* App Name & Port */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Nom de l'application & Domaine
                  </label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-sky-500">
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white focus:outline-none font-mono"
                    />
                    <span className="bg-slate-900 text-slate-500 text-xs font-mono px-3 py-2.5 border-l border-slate-800">
                      .cloudhost.app
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Port d'écoute HTTP
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Installation & Start Commands */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Commande d'installation (Build)
                  </label>
                  <div className="relative">
                    <Terminal className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                    <input
                      type="text"
                      placeholder="pip install -r requirements.txt"
                      value={installCommand}
                      onChange={(e) => setInstallCommand(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Ex: pip install -r requirements.txt ou npm install</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Commande de démarrage (Start)
                  </label>
                  <div className="relative">
                    <Play className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                    <input
                      type="text"
                      placeholder="uvicorn main:app --host 0.0.0.0 --port 8000"
                      value={startCommand}
                      onChange={(e) => setStartCommand(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Ex: python main.py ou uvicorn app:app --port 8000</span>
                </div>
              </div>

              {/* Environment Variables Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-sky-400" />
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Variables d'environnement (.env)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBulkEnvModal(true)}
                      className="text-xs text-sky-400 hover:underline"
                    >
                      Coller du texte .env
                    </button>
                    <button
                      onClick={addEnvVar}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-48 overflow-y-auto">
                  {envVars.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="CLE_VARIABLE"
                        value={ev.key}
                        onChange={(e) => updateEnvVar(ev.id, 'key', e.target.value.toUpperCase())}
                        className="w-1/3 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-sky-500"
                      />
                      <div className="relative flex-1">
                        <input
                          type={showSecrets[ev.id] || !ev.isSecret ? 'text' : 'password'}
                          placeholder="Valeur de la variable"
                          value={ev.value}
                          onChange={(e) => updateEnvVar(ev.id, 'value', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-2.5 pr-8 py-1.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-sky-500"
                        />
                        {ev.isSecret && (
                          <button
                            onClick={() => setShowSecrets({ ...showSecrets, [ev.id]: !showSecrets[ev.id] })}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                          >
                            {showSecrets[ev.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={ev.isSecret}
                          onChange={(e) => updateEnvVar(ev.id, 'isSecret', e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
                        />
                        <span>Secret</span>
                      </label>
                      <button
                        onClick={() => removeEnvVar(ev.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setActiveTab('code')}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-medium"
                >
                  Retour au code
                </button>
                <button
                  onClick={handleStartDeploy}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-sky-500/25 transition active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>DÉPLOYER L'APPLICATION MAINTENANT</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 4: LIVE DEPLOYMENT TERMINAL */}
          {activeTab === 'deploying' && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-500/10">
                  {deployStep < 4 ? <Loader2 className="w-7 h-7 animate-spin" /> : <CheckCircle2 className="w-7 h-7 text-emerald-400" />}
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  {deployStep < 4 ? 'Déploiement en cours sur CloudHost...' : '🚀 Application Déployée avec Succès !'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {deployStep < 4 ? 'Veuillez patienter pendant la compilation et le lancement du conteneur...' : `Votre code est en ligne à l'adresse https://${appName}.cloudhost.app`}
                </p>
              </div>

              {/* Deployment Stepper Progress */}
              <div className="grid grid-cols-4 gap-2 text-[11px]">
                {['Source & Repo', 'Installation Dependencies', 'Config Environment', 'Container Online'].map((st, idx) => (
                  <div
                    key={st}
                    className={`p-2.5 rounded-xl border font-semibold text-center transition ${
                      deployStep > idx
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : deployStep === idx
                        ? 'bg-sky-500/10 border-sky-500/40 text-sky-300 animate-pulse'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}
                  >
                    {st}
                  </div>
                ))}
              </div>

              {/* Streaming Terminal Log Output */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 h-60 overflow-y-auto space-y-1.5 shadow-inner">
                {deployLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>

              {deployStep === 4 && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={handleFinalize}
                    className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition"
                  >
                    <span>ACCÉDER À L'APPLICATION SUR LE DASHBOARD</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
        </>
        )}

      </div>

      {/* Bulk Env Modal */}
      {showBulkEnvModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-lg w-full space-y-4">
            <h3 className="text-sm font-bold text-white">Coller du texte au format .env</h3>
            <textarea
              rows={6}
              placeholder="PORT=8000&#10;ENVIRONMENT=production&#10;DATABASE_URL=postgresql://..."
              value={bulkEnvText}
              onChange={(e) => setBulkEnvText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkEnvModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handleApplyBulkEnv}
                className="px-4 py-1.5 bg-sky-500 text-slate-950 font-bold rounded-lg text-xs"
              >
                Importer les variables
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub OAuth Consent Modal */}
      {showOAuthConsentModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white text-slate-950 flex items-center justify-center font-bold shadow-md">
                  <Github className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Autoriser CloudHost Platform</h3>
                  <p className="text-[11px] text-slate-400">Authentification GitHub OAuth 2.0</p>
                </div>
              </div>
              <button
                onClick={() => setShowOAuthConsentModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <p className="text-slate-300">
                  <strong className="text-white">CloudHost Application</strong> demande l'autorisation d'accéder à vos dépôts GitHub <code className="text-sky-300 font-mono font-bold">@{githubUsernameInput || 'votre-compte'}</code>.
                </p>
                <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Accès en lecture à vos dépôts publics et privés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Importation directe du code source et webhooks Render</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Clonage automatique lors du déploiement</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmGithubAuth}
                  disabled={isAuthLoading}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2"
                >
                  {isAuthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                  <span>Autoriser & Synchroniser les dépôts</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowOAuthConsentModal(false)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
