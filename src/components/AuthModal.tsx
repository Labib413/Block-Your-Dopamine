import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, User, ArrowRight, Loader2, Copy, Check, AlertTriangle, KeyRound } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { 
  signInWithFirebaseEmail, 
  signUpWithFirebaseEmail, 
  signInWithGoogle,
  sendFirebasePasswordReset 
} from "../firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  useEffect(() => {
    // Reset state whenever modal opens or switches mode
    setError(null);
    setResetSent(false);
    setIsUnauthorizedDomain(false);
  }, [isOpen, isLogin]);

  const handleCopyDomain = () => {
    if (currentHost) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your email address above to receive a password reset link.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendFirebasePasswordReset(cleanEmail);
      setResetSent(true);
    } catch (err: any) {
      const code = err?.code || "";
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setError("No account found with this email. Please sign up first.");
      } else if (code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResetSent(false);
    setIsUnauthorizedDomain(false);

    const cleanEmail = email.trim();
    const cleanPassword = password;

    if (!cleanEmail) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }
    if (!cleanPassword) {
      setError("Please enter your password.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Authenticate with Firebase Authentication
        const fbUser = await signInWithFirebaseEmail(cleanEmail, cleanPassword);
        if (fbUser) {
          onClose();
          const username = fbUser.displayName?.toLowerCase().replace(/\s+/g, '_') || fbUser.email?.split('@')[0] || "user";
          navigate(`/${username}/dashboard`, { replace: true });
        }
      } else {
        // Sign Up with Firebase Authentication
        if (cleanPassword.length < 6) {
          setError("Password must be at least 6 characters long.");
          setLoading(false);
          return;
        }
        const cleanName = fullName.trim() || cleanEmail.split('@')[0];
        const fbUser = await signUpWithFirebaseEmail(cleanEmail, cleanPassword, cleanName);
        if (fbUser) {
          onClose();
          const username = cleanName.toLowerCase().replace(/\s+/g, '_') || fbUser.email?.split('@')[0] || "user";
          navigate(`/${username}/dashboard`, { replace: true });
        }
      }
    } catch (err: any) {
      const code = err?.code || "";
      const msg = err?.message || "";
      console.warn("[AuthModal] Firebase auth error:", code, msg);

      if (
        code === 'auth/user-not-found' || 
        code === 'auth/invalid-credential' || 
        code === 'auth/invalid-login-credentials'
      ) {
        setError("No account found with this email, or incorrect password. If you haven't created an account yet, please click 'Don't have an account? Sign up' below to create your account first.");
      } else if (code === 'auth/wrong-password') {
        setError("Incorrect password. Please verify and try again.");
      } else if (code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please sign in instead.");
      } else if (code === 'auth/weak-password') {
        setError("Password is too weak. Please use at least 6 characters.");
      } else if (code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (code === 'auth/too-many-requests') {
        setError("Too many failed login attempts. Access temporarily disabled for security. Please try again later or reset your password.");
      } else if (code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(msg || "Authentication failed. Please verify your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setIsUnauthorizedDomain(false);
    try {
      const fbUser = await signInWithGoogle();
      if (fbUser) {
        onClose();
        const username = fbUser.displayName?.toLowerCase().replace(/\s+/g, '_') || fbUser.email?.split('@')[0] || "user";
        navigate(`/${username}/dashboard`, { replace: true });
      }
    } catch (err: any) {
      const code = err?.code || "";
      const msg = err?.message || "";
      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setIsUnauthorizedDomain(true);
        setError("This domain is not authorized in Firebase Console yet. Please add this domain under Firebase Authentication > Settings > Authorized domains, or use Email & Password below.");
      } else if (code === 'auth/popup-blocked') {
        setError("Browser blocked the Google pop-up. Please click the pop-up icon in your address bar to 'Always allow pop-ups', or sign in with email and password below.");
      } else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        console.warn("[Google Auth Notice]:", err);
        setError(msg || "Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md"
          >
            <GlassCard className="p-8 border-white/10 shadow-2xl">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-sans font-bold text-white mb-2">
                  {isLogin ? "Welcome Back" : "Join BYD"}
                </h2>
                <p className="text-white/40 text-sm">
                  {isLogin 
                    ? "Enter your registered Firebase credentials to access your profile" 
                    : "Create an account to track your dopamine detox"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-neon-green/50 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-neon-green/50 transition-all"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Password</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-[10px] text-neon-green/70 hover:text-neon-green font-medium transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-neon-green/50 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {resetSent && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs flex items-center gap-2"
                  >
                    <KeyRound className="w-4 h-4 shrink-0" />
                    <span>Password reset email sent! Check your inbox.</span>
                  </motion.div>
                )}

                {isUnauthorizedDomain && (
                  <motion.div 
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 text-left"
                  >
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Firebase Domain Authorization Required</span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-relaxed">
                      To enable Google Sign-In on this domain, add it to Firebase Console (<span className="text-white font-mono">Authentication &gt; Settings &gt; Authorized domains</span>):
                    </p>
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/50 border border-white/10 font-mono text-[11px] text-[#39FF14]">
                      <span className="truncate">{currentHost}</span>
                      <button
                        type="button"
                        onClick={handleCopyDomain}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-[10px] uppercase font-bold shrink-0 transition-colors"
                      >
                        {copiedDomain ? <Check className="w-3 h-3 text-[#39FF14]" /> : <Copy className="w-3 h-3" />}
                        {copiedDomain ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {error && !isUnauthorizedDomain && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs leading-relaxed animate-in fade-in">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-white text-black font-bold rounded-xl mt-4 hover:bg-neon-green transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? "Sign In" : "Create Account"}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                    <span className="bg-[#050505] px-4 text-white/20">or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-green/0 via-neon-green/5 to-neon-green/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="text-sm font-sans tracking-tight">Continue with Google</span>
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError(null);
                    }}
                    className="text-xs text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {isLogin 
                      ? "Don't have an account? Sign up" 
                      : "Already have an account? Sign in"}
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
