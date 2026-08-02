import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, Loader2, Code2, Copy, Check } from 'lucide-react';
import { HostedProject } from '../types';

interface AiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProject?: HostedProject | null;
}

export const AiCopilotModal: React.FC<AiCopilotModalProps> = ({
  isOpen,
  onClose,
  selectedProject
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `Bonjour ! Je suis votre Assistant IA Déploiement CloudHost. Je peux vous aider à configurer vos scripts Python, générer un \`requirements.txt\`, résoudre des erreurs d'installation ou créer des routes API pour ${selectedProject ? selectedProject.name : 'vos applications'}.`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/analyze-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeSnippet: userMsg,
          languageHint: selectedProject?.language || 'python'
        })
      });
      const data = await res.json();
      
      let aiReply = '';
      if (data.success && data.analysis) {
        const a = data.analysis;
        aiReply = `Voici ma recommandation d'hébergement :\n\n- **Langage détecté** : ${a.language?.toUpperCase()}\n- **Framework** : ${a.framework}\n- **Commande d'installation** : \`${a.installCommand}\`\n- **Commande de démarrage** : \`${a.startCommand}\`\n- **Port recommandé** : ${a.suggestedPort}\n\n${a.summary}`;
      } else {
        aiReply = `Pour déployer votre projet ${selectedProject?.language || 'Python'} en toute sécurité sur CloudHost :\n1. Assurez-vous d'avoir la commande d'installation : \`pip install -r requirements.txt\` (ou \`npm install\`)\n2. Spécifiez la commande de lancement écoutant sur \`0.0.0.0\` et le port sélectionné.\n3. Renseignez vos clés API dans la section Variables d'environnement (.env).`;
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: aiReply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Une erreur est survenue lors de la consultation de l\'IA. Veuillez réessayer.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl h-[560px] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Assistant IA Copilot</h3>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-extrabold uppercase">
                  Bientôt Disponible
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Diagnostic intelligent & Génération Docker / requirements.txt</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Banner Notice */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-4 bg-slate-950/60">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>

          <div className="max-w-md space-y-2">
            <h4 className="text-lg font-extrabold text-white">L'Assistant IA arrive très bientôt ! 🚀</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              L'intégration de l'Assistant Copilote IA avec Gemini 3.6 Flash est actuellement en cours de finalisation pour la mise à jour v2.0.
            </p>
            <p className="text-xs text-slate-400">
              Il permettra l'auto-détection des erreurs de builds, la correction automatique de vos scripts Python/Node et l'optimisation de vos conteneurs.
            </p>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-amber-300 font-mono font-semibold max-w-sm">
            ⚡ Statut : En cours de déploiement (v2.0)
          </div>
        </div>

        {/* Input Bar Disabled */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
          <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
            <input
              type="text"
              disabled
              placeholder="Discussion désactivée (Bientôt disponible)..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed"
            />
            <button
              disabled
              className="px-4 py-2.5 bg-slate-800 text-slate-500 font-bold rounded-xl text-xs cursor-not-allowed"
            >
              Bientôt
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
