import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { LogIn, UserPlus, Sparkles, X, ChevronDown } from "lucide-react";
import OautGoogle from "./OAuthGoogle";
import { getPopularTimezoneOptions } from "@/lib/timezones";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuthErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const { login, register, demoLogin } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh"
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});

  const timezoneOptions = useMemo(
    () => getPopularTimezoneOptions(timezone, i18n.language),
    [timezone, i18n.language]
  );

  if (!isOpen) return null;

  const validate = (): AuthErrors => {
    const errs: AuthErrors = {};
    if (!isLoginView && !fullName.trim()) {
      errs.fullName = t("errors.required");
    }
    if (!email.trim()) {
      errs.email = t("errors.required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = t("auth.invalidEmail");
    }
    if (!password) {
      errs.password = t("errors.required");
    } else if (password.length < 6) {
      errs.password = t("auth.passwordMinLength");
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    let success = false;
    if (isLoginView) {
      success = await login(email, password);
    } else {
      success = await register(fullName, email, password, timezone);
    }
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    const success = await demoLogin();
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
      hasError ? "border-destructive" : "border-input"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {isLoginView ? t("auth.loginTitle") : t("auth.registerTitle")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoginView ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
          </p>
        </div>

        {/* Google OAuth Button */}
        <div className="mb-4">
          <OautGoogle />
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t("auth.orWithEmail")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginView && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("auth.fullName")}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((p) => ({ ...p, fullName: undefined }));
                }}
                placeholder={t("auth.fullNamePlaceholder")}
                className={inputClass(Boolean(errors.fullName))}
              />
              {errors.fullName && (
                <p className="text-xs font-medium text-destructive mt-1">{errors.fullName}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("auth.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder={t("auth.emailPlaceholder")}
              className={inputClass(Boolean(errors.email))}
            />
            {errors.email && (
              <p className="text-xs font-medium text-destructive mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("auth.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder={t("auth.passwordPlaceholder")}
              className={inputClass(Boolean(errors.password))}
            />
            {errors.password && (
              <p className="text-xs font-medium text-destructive mt-1">{errors.password}</p>
            )}
          </div>

          {!isLoginView && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("auth.timezone")}
              </label>
              <div className="relative">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background pl-3.5 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {isLoginView ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {loading ? t("auth.processing") : isLoginView ? t("auth.loginBtn") : t("auth.registerBtn")}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">{t("auth.explore")}</span>
          </div>
        </div>

        <button
          onClick={handleDemo}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          {t("auth.demoAccount")}
        </button>

        <div className="mt-5 text-center text-sm text-muted-foreground">
          {isLoginView ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
          <button
            type="button"
            onClick={() => {
              setIsLoginView(!isLoginView);
              setErrors({});
            }}
            className="font-semibold text-primary hover:underline cursor-pointer"
          >
            {isLoginView ? t("auth.registerNow") : t("auth.loginNow")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
