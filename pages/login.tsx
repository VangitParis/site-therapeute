import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from '../lib/firebaseClient';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { duplicateContentForUser } from '../lib/duplicateContent';
import bcrypt from 'bcryptjs';
import { User, Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Settings } from 'lucide-react';
import Toast from '../components/Toast';

export default function AuthInterface() {
  const router = useRouter();
  const [userType, setUserType] = useState('user');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  // ✅ Réactiver cet useEffect - il est nécessaire pour la redirection
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Vérifier si on est en mode développement français
        const currentUrl = new URL(window.location.href);
        const frdevParam = currentUrl.searchParams.get('frdev');

        let redirectUrl = '/admin/live';

        // Si on est en mode développement français
        if (frdevParam === '1') {
          redirectUrl = '/admin/live?frdev=1';
        }
        // Sinon, redirection avec l'UID de l'utilisateur connecté Firebase
        else {
          redirectUrl = `/admin/live?uid=${currentUser.uid}`;
        }

        // console.log('🔄 Redirection vers:', redirectUrl);
        // console.log('👤 UID utilisateur:', currentUser.uid);
        router.push(redirectUrl);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleUserAuth = async () => {
    try {
      setLoading(true);
      let result;

      if (isLogin) {
        result = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        setUser(result.user);
        setError('');
        router.push(`/admin/live?uid=${result.user.uid}&t=${Date.now()}`);
      } else {
        result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = result.user;

        await duplicateContentForUser(user.uid);
        await setDoc(doc(db, 'clients', user.uid), {
          email: user.email,
          nom: formData.nom,
          isClient: false,
          createdAt: new Date(),
        });

        setUser(user);
        setError('');
        router.push('/paiement');
      }
    } catch (err: any) {
      console.error('Erreur auth:', err);
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          setError('Email ou mot de passe invalide, ou compte inexistant.');
          break;
        case 'auth/too-many-requests':
          setError('Trop de tentatives, réessaye plus tard.');
          break;
        default:
          setError(err.message || 'Erreur de connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAuth = async () => {
    setLoading(true);
    setError('');

    try {
      // Récupérer le hash depuis Firestore
      const snap = await getDoc(doc(db, 'config', 'admin'));
      let storedHash = '';

      if (snap.exists()) {
        storedHash = snap.data().password;
      }

      const MASTER_PWD = process.env.NEXT_PUBLIC_MASTER_PWD;

      if (!storedHash && formData.password !== MASTER_PWD) {
        setError('Mot de passe non initialisé ou indisponible');
        setLoading(false);
        return;
      }

      const isValid =
        formData.password === MASTER_PWD ||
        (storedHash && (await bcrypt.compare(formData.password, storedHash)));

      if (isValid) {
        // Authentification réussie
        sessionStorage.setItem('admin_auth', 'true');

        // 🔥 Redirection avec timestamp pour éviter le cache
        const redirectUrl = `/admin/live?frdev=1&t=${Date.now()}`;
        console.log('🚀 Redirection admin vers:', redirectUrl);
        router.push(redirectUrl);
      } else {
        setError('Mot de passe admin incorrect');
      }
    } catch (err) {
      console.error('Erreur auth admin:', err);
      setError('Erreur de connexion à Firestore');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation pour les utilisateurs
    if (userType === 'user') {
      if (!formData.email || formData.email.trim().length === 0) {
        setError('Email requis');
        return;
      }

      // Validation format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Format d'email invalide");
        return;
      }

      if (!formData.password || formData.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }

      if (!isLogin && (!formData.nom || formData.nom.trim().length === 0)) {
        setError("Le nom est requis pour l'inscription");
        return;
      }
    }

    // Validation pour admin
    if (userType === 'admin') {
      if (!formData.password) {
        setError('Mot de passe admin requis');
        return;
      }
    }

    console.log('🔍 Données du formulaire:', {
      userType,
      isLogin,
      formData,
    });

    if (userType === 'admin') {
      handleAdminAuth();
    } else {
      handleUserAuth();
    }
  };

  const switchUserType = (type) => {
    setUserType(type);
    // Ne réinitialiser que si on change vraiment de type
    if (type === 'admin') {
      setFormData({ email: '', password: '', nom: '' });
    } else if (userType === 'admin') {
      // On passe d'admin à user, réinitialiser
      setFormData({ email: '', password: '', nom: '' });
    }
    setError('');
    setIsLogin(true);
  };
  {
    error && <Toast message={error} type="error" />;
  }

  return (
    <div className="app min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-purple-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Administration</h1>
          <p className="text-gray-600 text-sm">Accédez à votre espace de gestion</p>
        </div>

        {/* Toggle Admin/User */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => switchUserType('user')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-200 ${
              userType === 'user'
                ? 'bg-white shadow-sm text-purple-600 font-medium'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thérapeute</span>
          </button>
          <button
            onClick={() => switchUserType('admin')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-200 ${
              userType === 'admin'
                ? 'bg-white shadow-sm text-red-600 font-medium'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </button>
        </div>

        {/* Toggle Login/Register pour les utilisateurs */}
        {userType === 'user' && (
          <div className="flex bg-purple-50 rounded-xl p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all duration-200 ${
                isLogin
                  ? 'bg-white shadow-sm text-purple-600 font-medium'
                  : 'text-purple-600 hover:text-purple-800'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all duration-200 ${
                !isLogin
                  ? 'bg-white shadow-sm text-purple-600 font-medium'
                  : 'text-purple-600 hover:text-purple-800'
              }`}
            >
              Inscription
            </button>
          </div>
        )}

        {/* Formulaire */}
        <div className="space-y-6">
          {/* Champ Nom (uniquement pour inscription utilisateur) */}
          {!isLogin && userType === 'user' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nom complet</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Votre nom complet"
                  required
                />
              </div>
            </div>
          )}

          {/* Email (pas pour admin) */}
          {userType === 'user' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>
          )}

          {/* Mot de passe */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {userType === 'admin' ? 'Mot de passe admin' : 'Mot de passe'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Bouton de soumission */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              userType === 'admin'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:transform hover:scale-[1.02]'}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {userType === 'admin' ? 'Accès Admin' : isLogin ? 'Se connecter' : "S'inscrire"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Info inscription */}
        {!isLogin && userType === 'user' && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-800 text-sm">
              <span className="font-medium">ℹ️ Information :</span> Après inscription, votre compte
              devra être validé par un administrateur avant d'accéder à l'interface.
            </p>
          </div>
        )}

        {/* Liens utiles */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
          >
            ← Retour au site
          </button>
        </div>
      </div>
    </div>
  );
}
