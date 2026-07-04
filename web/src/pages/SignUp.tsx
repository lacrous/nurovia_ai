import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Github, Chrome, Sparkles } from "lucide-react";
import { Input, Button, useToast } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useRedirectIfAuthed } from "../hooks/useRequireAuth";

export function SignUp() {
  useDocumentTitle("Create account");
  const navigate = useNavigate();
  const toast = useToast();
  const { signup } = useAuth();
  useRedirectIfAuthed();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", agree: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (values = form) => {
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Full name is required";
    else if (values.name.trim().length < 2) next.name = "Please enter your full name";
    if (!values.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = "Enter a valid email";
    if (!values.password) next.password = "Password is required";
    else if (values.password.length < 8) next.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(values.password) || !/[a-z]/.test(values.password) || !/\d/.test(values.password)) {
      next.password = "Include uppercase, lowercase, and a number";
    }
    if (values.password !== values.confirm) next.confirm = "Passwords do not match";
    if (!values.agree) next.agree = "You must accept the terms";
    setErrors(next);
    return next;
  };

  const socialSignUp = useCallback(
    (provider: string) => {
      toast.info(`${provider} sign-up is coming soon. Use email + password for now.`);
    },
    [toast]
  );

  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      validate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true, agree: true });
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return;
    }
    setIsLoading(true);
    try {
      await signup(form.email, form.name, form.password);
      toast.success("Account created. Welcome to Nurovia AI");
      navigate("/onboarding");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const strength = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[a-z]/.test(form.password),
    /\d/.test(form.password),
  ].filter(Boolean).length;

  const strengthLabel = ["Use 8+ chars with uppercase, lowercase, and a number", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["bg-theme/40", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-400"];

  const passwordRightIcon = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      className="text-muted-foreground hover:text-foreground transition-colors"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  const confirmRightIcon = (
    <button
      type="button"
      onClick={() => setShowConfirm((v) => !v)}
      className="text-muted-foreground hover:text-foreground transition-colors"
      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
    >
      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Mobile-only header (left panel is hidden on mobile) */}
      <div className="lg:hidden absolute top-0 left-0 right-0 z-20 h-16 flex items-center px-6 pointer-events-none">
        <div className="pointer-events-auto">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-icon.svg" alt="" className="w-7 h-7" />
            <span className="text-[15px] font-bold text-gold tracking-tight">Nurovia AI</span>
          </Link>
        </div>
      </div>
      {/* Left visual panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-glow">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-gold/8 blur-[120px]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-[11px] font-semibold w-max mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Join the beta
            </div>
            <h1 className="text-[42px] font-bold leading-tight max-w-md">
              Start shipping with a council of AIs.
            </h1>
            <p className="text-[15px] txt-muted mt-4 max-w-sm leading-relaxed">
              Create your account to upload projects, run autonomous debug sessions, and approve edits with confidence.
            </p>
          </motion.div>

          <div className="text-[12px] txt-faint">
            © {new Date().getFullYear()} Nurovia AI. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full max-w-[420px] ${shake ? "animate-[shake_0.3s_ease-in-out]" : ""}`}
        >
          <div className="text-center mb-8">
            <h2 className="text-[26px] font-bold">Create your account</h2>
            <p className="text-[14px] txt-muted mt-2">
              Already have an account?{" "}
              <Link to="/signin" className="text-gold hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium mb-1.5 txt-body">Full name</label>
              <Input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                placeholder="Alex Chen"
                leftIcon={<User className="w-4 h-4" />}
                error={touched.name ? errors.name : undefined}
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium mb-1.5 txt-body">Email address</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="you@company.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={touched.email ? errors.email : undefined}
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium mb-1.5 txt-body">Password</label>
              <Input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={passwordRightIcon}
                error={touched.password ? errors.password : undefined}
              />

              <div className="flex items-center gap-1.5 mt-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      strength >= i ? strengthColor[strength] : "bg-theme/40"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] txt-faint mt-1.5">{strengthLabel[strength]}</p>
            </div>

            <div>
              <label className="block text-[12px] font-medium mb-1.5 txt-body">Confirm password</label>
              <Input
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={confirmRightIcon}
                error={touched.confirm ? errors.confirm : undefined}
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(e) => setForm({ ...form, agree: e.target.checked })}
                className="w-4 h-4 mt-0.5 rounded border-theme/30 bg-surface text-gold focus:ring-gold/20"
              />
              <span className="text-[12px] txt-muted leading-relaxed">
                I agree to the{" "}
                <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Terms of Service</Link>{" "}
                and{" "}
                <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Privacy Policy</Link>.
              </span>
            </label>
            {touched.agree && errors.agree && <p className="text-[11px] text-red-400 -mt-2">{errors.agree}</p>}

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
              Create account
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-theme/20" />
            </div>
            <div className="relative flex justify-center text-[11px] txt-faint uppercase tracking-wider">
              <span className="bg-background px-3">Or sign up with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="secondary" size="md" className="w-full" onClick={() => socialSignUp("GitHub")}>
              <Github className="w-4 h-4" /> GitHub
            </Button>
            <Button type="button" variant="secondary" size="md" className="w-full" onClick={() => socialSignUp("Google")}>
              <Chrome className="w-4 h-4" /> Google
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
