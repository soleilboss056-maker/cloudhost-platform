import React, { useState } from 'react';
import { X, Mail, Lock, User, Key, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserLogin: (user: UserProfile) => void;
  onUserLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserLogin,
  onUserLogout
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.log('Firebase signOut error:', err);
    } finally {
      setIsLoading(false);
      onUserLogout();
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      // Real Firebase Google Authentication popup
      const res = await signInWithPopup(auth, googleProvider);
      if (!res || !res.user) {
        throw new Error("Impossible d'accéder aux informations de l'utilisateur Google.");
      }

      const gEmail = res.user.email || '';
      const gName = res.user.displayName || gEmail.split('@')[0] || 'Utilisateur Google';
      const avatarUrl = res.user.photoURL || '';

      // Register or login on server backend
      const apiRes = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleEmail: gEmail,
          googleName: gName,
          avatarUrl: avatarUrl
        })
      });
      const data = await apiRes.json();
      if (data.success && data.user) {
        onUserLogin(data.user);
        setStatusMessage({ type: 'success', text: `Bienvenue ${data.user.name} ! Connexion Google réussie.` });
        setTimeout(() => onClose(), 1200);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Erreur lors de la synchronisation de votre compte.' });
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      let errMsg = 'Erreur lors de la connexion Google.';
      if (err?.code === 'auth/popup-closed-by-user') {
        errMsg = 'La fenêtre de connexion Google a été fermée avant la fin.';
      } else if (err?.code === 'auth/popup-blocked') {
        errMsg = 'La fenêtre surgissante (popup) a été bloquée par votre navigateur. Autorisez les popups et réessayez.';
      } else if (err?.message) {
        errMsg = err.message;
      }
      setStatusMessage({ type: 'error', text: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    let createdFirebaseUser = null;
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        createdFirebaseUser = cred.user;
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        createdFirebaseUser = cred.user;
      }
    } catch (fbErr: any) {
      console.warn('Firebase Auth email warning:', fbErr?.message || fbErr);
    }

    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        onUserLogin(data.user);
        setStatusMessage({ type: 'success', text: data.message || 'Authentification réussie !' });
        setTimeout(() => onClose(), 1200);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Erreur d\'identifiants' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Erreur de connexion au serveur.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setStatusMessage({ type: 'error', text: 'Veuillez saisir votre adresse e-mail.' });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);

    try {
      // Send REAL password reset email directly via Firebase Auth service
      await sendPasswordResetEmail(auth, cleanEmail);

      // Notify backend server
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      }).catch(() => {});

      setStatusMessage({
        type: 'success',
        text: `📧 Un e-mail officiel de réinitialisation a été envoyé à ${cleanEmail}. Veuillez vérifier votre boîte de réception (et vos spams) pour créer votre nouveau mot de passe.`
      });
    } catch (fbErr: any) {
      console.error('Firebase password reset error:', fbErr);
      let errTxt = 'Erreur lors de l\'envoi de l\'e-mail de réinitialisation.';
      if (fbErr?.code === 'auth/user-not-found') {
        errTxt = 'Aucun compte associé à cette adresse e-mail.';
      } else if (fbErr?.code === 'auth/invalid-email') {
        errTxt = 'Adresse e-mail invalide.';
      }
      setStatusMessage({ type: 'error', text: errTxt });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {currentUser ? 'Mon Compte CloudHost' : mode === 'login' ? 'Connexion CloudHost' : mode === 'register' ? 'Créer un Compte' : mode === 'forgot' ? 'Mot de passe oublié' : 'Réinitialiser le mot de passe'}
              </h3>
              <p className="text-xs text-slate-400">Authentification sécurisée et accès Render</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logged in state */}
        {currentUser ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-sky-500 mx-auto flex items-center justify-center overflow-hidden">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-sky-400" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-white text-lg">{currentUser.name}</h4>
              <p className="text-xs text-slate-400 mt-1">{currentUser.email}</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold mt-3">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Compte Actif (Google & Email)</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-2xl border border-rose-500/20 text-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Déconnexion...' : 'Se déconnecter'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Notification alert */}
            {statusMessage && (
              <div className={`p-4 rounded-2xl text-xs font-medium flex items-start gap-3 border ${
                statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Google Quick Auth */}
            {(mode === 'login' || mode === 'register') && (
              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-center gap-3 text-white text-xs font-bold transition shadow-md group"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.36 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/>
                  </svg>
                  <span>Continuer avec Google</span>
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                    <span className="bg-slate-900 px-3 text-slate-500 font-semibold">Ou par Email</span>
                  </div>
                </div>
              </div>
            )}

            {/* Email Form */}
            {(mode === 'login' || mode === 'register') && (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nom complet</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Soleil Boss"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Adresse Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="votre_email@domaine.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Mot de passe</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusMessage(null);
                          setMode('forgot');
                        }}
                        className="text-[11px] text-sky-400 hover:underline font-medium"
                      >
                        Mot de passe oublié ?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-sky-500/20 disabled:opacity-50"
                >
                  {isLoading ? 'Patientez...' : mode === 'login' ? 'Se Connecter' : 'Créer un Compte'}
                </button>
              </form>
            )}

            {/* Forgot Password Mode */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Saisissez votre adresse e-mail. Un e-mail contenant un lien sécurisé Firebase vous sera immédiatement envoyé pour réinitialiser votre mot de passe en toute sécurité.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Adresse Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="exemple@domaine.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-2xl text-xs transition shadow-lg disabled:opacity-50"
                >
                  {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                </button>
              </form>
            )}

            {/* Mode Switchers */}
            <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
              {mode === 'login' ? (
                <span>
                  Pas encore de compte ?{' '}
                  <button onClick={() => { setStatusMessage(null); setMode('register'); }} className="text-sky-400 hover:underline font-bold">
                    S'inscrire gratuitement
                  </button>
                </span>
              ) : mode === 'register' ? (
                <span>
                  Déjà inscrit ?{' '}
                  <button onClick={() => { setStatusMessage(null); setMode('login'); }} className="text-sky-400 hover:underline font-bold">
                    Se connecter
                  </button>
                </span>
              ) : (
                <button onClick={() => { setStatusMessage(null); setMode('login'); }} className="text-sky-400 hover:underline font-bold">
                  ← Retour à la connexion
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
