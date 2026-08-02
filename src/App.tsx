import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Sparkles, 
  CheckCircle2,
  Activity
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ProjectCard } from './components/ProjectCard';
import { NewProjectModal } from './components/NewProjectModal';
import { ProjectDetailView } from './components/ProjectDetailView';
import { AiCopilotModal } from './components/AiCopilotModal';
import { LivePreviewModal } from './components/LivePreviewModal';
import { AuthModal } from './components/AuthModal';
import { HostedProject, UserProfile } from './types';
import { auth, onAuthStateChanged, signOut } from './lib/firebase';

export default function App() {
  const [projects, setProjects] = useState<HostedProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<HostedProject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>('all');
  
  // Modals & Preview State
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [previewProject, setPreviewProject] = useState<HostedProject | null>(null);
  
  // User Profile state with localStorage persistence
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('cloudhost_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Sync user state to localStorage and Firebase Auth
  const handleSetUser = (user: UserProfile | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('cloudhost_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cloudhost_user');
      signOut(auth).catch((err) => console.log('Firebase signOut error:', err));
      showToast('👋 Déconnexion réussie !');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const uProfile: UserProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Utilisateur Google',
          email: fbUser.email || 'user@cloudhost.app',
          avatarUrl: fbUser.photoURL || undefined,
          authProvider: 'google',
          createdAt: new Date().toISOString()
        };
        setCurrentUser(uProfile);
        localStorage.setItem('cloudhost_user', JSON.stringify(uProfile));
      }
    });
    return () => unsubscribe();
  }, []);

  // Modals state & Toast notification
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch Projects from Backend Express API
  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && data.projects) {
        setProjects(data.projects);
        // If a project is selected, refresh its object
        if (selectedProject) {
          const updated = data.projects.find((p: HostedProject) => p.id === selectedProject.id);
          if (updated) setSelectedProject(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Real Automated Keep-Alive Ping Engine (pings running containers every 30s)
  useEffect(() => {
    const keepAliveInterval = setInterval(async () => {
      const running = projects.filter(p => p.status === 'running');
      if (running.length === 0) return;

      for (const pr of running) {
        try {
          await fetch(`/api/projects/${pr.id}/ping`, { method: 'POST' });
        } catch (e) {
          // Silent catch for background pings
        }
      }
      fetchProjects();
    }, 30000);

    return () => clearInterval(keepAliveInterval);
  }, [projects]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Handle Deploy New Project
  const handleDeployNewProject = async (projectData: Partial<HostedProject>) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      const data = await res.json();
      if (data.success && data.project) {
        showToast(`🚀 Application "${data.project.name}" déployée avec succès sur ${data.project.domain}!`);
        await fetchProjects();
        setSelectedProject(data.project);
      }
    } catch (err) {
      console.error('Error deploying project:', err);
    }
  };

  // Handle Project Settings Update
  const handleUpdateProject = async (updatedData: Partial<HostedProject> & { triggerRedeploy?: boolean }) => {
    if (!selectedProject) return;
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      if (data.success && data.project) {
        setSelectedProject(data.project);
        showToast(`Configuration mise à jour pour ${data.project.name}`);
        await fetchProjects();
      }
    } catch (err) {
      console.error('Error updating project:', err);
    }
  };

  // Handle Project Quick Actions (Start, Stop, Restart, Redeploy)
  const handleProjectAction = async (projectId: string, action: 'start' | 'stop' | 'restart' | 'redeploy') => {
    try {
      const res = await fetch(`/api/projects/${projectId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success && data.project) {
        showToast(`Action "${action.toUpperCase()}" effectuée sur ${data.project.name}`);
        await fetchProjects();
        if (selectedProject?.id === projectId) {
          setSelectedProject(data.project);
        }
      }
    } catch (err) {
      console.error('Error executing action:', err);
    }
  };

  // Add Database Addon
  const handleAddDatabaseAddon = async (type: 'postgresql' | 'redis' | 'storage', name: string) => {
    if (!selectedProject) return;
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name })
      });
      const data = await res.json();
      if (data.success && data.project) {
        setSelectedProject(data.project);
        showToast(`Module ${type.toUpperCase()} activé pour ${data.project.name}!`);
        await fetchProjects();
      }
    } catch (err) {
      console.error('Addon error:', err);
    }
  };

  // Handle Project Delete
  const handleDeleteProject = async (projectId: string) => {
    try {
      const target = projects.find(p => p.id === projectId);
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🗑️ Projet "${target?.name || 'Projet'}" supprimé avec succès !`);
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
        }
        await fetchProjects();
      }
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.language.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLang = 
      selectedLanguageFilter === 'all' || p.language === selectedLanguageFilter;

    return matchesSearch && matchesLang;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-slate-950">
      
      {/* Top Navigation Bar */}
      <Navbar
        projects={projects}
        currentUser={currentUser}
        onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAiCopilot={() => setIsAiCopilotOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/40 text-emerald-300 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* View Switcher: Detail View OR Projects Overview Dashboard */}
        {selectedProject ? (
          <ProjectDetailView
            project={selectedProject}
            onBack={() => setSelectedProject(null)}
            onUpdateProject={handleUpdateProject}
            onAction={(act) => handleProjectAction(selectedProject.id, act)}
            onAddDatabaseAddon={handleAddDatabaseAddon}
            onDeleteProject={(pid) => handleDeleteProject(pid)}
            onOpenLivePreview={(p) => setPreviewProject(p)}
          />
        ) : (
          <div className="space-y-8">
            
            {/* Platform Hero & Metrics Summary Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none"></div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-full text-xs font-bold mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Plateforme d'Hébergement Multi-Langages</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                    Hébergez vos codes <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Python, Node & GitHub</span> en direct
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                    Déployez instantanément vos scripts, bots et APIs avec vos propres commandes d'installation (<code className="text-amber-300">pip install</code>, <code className="text-emerald-300">npm install</code>), vos variables d'environnement (<code className="text-sky-300">.env</code>) et votre domaine public HTTPS.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setIsNewProjectModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-sky-500/20 transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Déployer du Code / GitHub</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter & Category Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-2 rounded-2xl border border-slate-800/60">
              
              {/* Language Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto px-2 py-1 text-xs">
                {[
                  { id: 'all', label: 'Tous les projets', count: projects.length },
                  { id: 'python', label: '🐍 Python', count: projects.filter(p => p.language === 'python').length },
                  { id: 'nodejs', label: '🟢 Node.js', count: projects.filter(p => p.language === 'nodejs').length },
                  { id: 'go', label: '🐹 Go', count: projects.filter(p => p.language === 'go').length },
                  { id: 'static', label: '🌐 Statique', count: projects.filter(p => p.language === 'static').length }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedLanguageFilter(cat.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
                      selectedLanguageFilter === cat.id
                        ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      selectedLanguageFilter === cat.id ? 'bg-slate-950 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Status info */}
              <div className="text-xs text-slate-400 px-4">
                Affichage de <strong className="text-white">{filteredProjects.length}</strong> projet(s)
              </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onSelectProject={setSelectedProject}
                    onAction={(pid, act) => handleProjectAction(pid, act)}
                    onDeleteProject={(pid) => handleDeleteProject(pid)}
                    onOpenLivePreview={(p) => setPreviewProject(p)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto text-3xl">
                  🚀
                </div>
                <h3 className="text-lg font-bold text-white">Aucun projet hébergé trouvé</h3>
                <p className="text-xs text-slate-400">
                  {searchQuery ? 'Aucun résultat ne correspond à votre recherche.' : 'Commencez par héberger votre premier code Python ou projet GitHub en 1 clic.'}
                </p>
                <button
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
                >
                  Déployer un Projet Maintenant
                </button>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Deploy New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onDeploy={handleDeployNewProject}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* AI Assistant Modal */}
      <AiCopilotModal
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
        selectedProject={selectedProject}
      />

      {/* Live Preview & Ping Tester Modal */}
      <LivePreviewModal
        isOpen={!!previewProject}
        onClose={() => setPreviewProject(null)}
        project={previewProject}
      />

      {/* Auth Modal (Google & Email & Password Reset) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserLogin={(user) => handleSetUser(user)}
        onUserLogout={() => handleSetUser(null)}
      />

    </div>
  );
}
