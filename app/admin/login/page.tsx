"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import { Btn, useToast } from "@/components/admin/ui";

// Demo credentials exist only in the seeded development dataset; never
// surface them in production builds (NODE_ENV is inlined at build time).
const IS_DEV = process.env.NODE_ENV !== "production";

const DEMO_USERS = [
  { role: "Super Admin", email: "admin@medora.health" },
  { role: "Manager", email: "sneha@medora.health" },
  { role: "Inventory", email: "amit@medora.health" },
  { role: "Support", email: "priya@medora.health" },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await api("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      toast("Welcome back 👋");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-glow" />
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <span className="admin-brand-mark">✚</span>
          <span>
            <b>Medora</b>
            <small>CONTROL CENTRE</small>
          </span>
        </div>
        <h1>Secure sign in</h1>
        <p className="admin-login-sub">
          Authorised staff only. Access to patient data, orders and store operations is logged and monitored.
        </p>

        <form onSubmit={submit} noValidate>
          <label style={{ display: "grid", gap: 7, marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--admin-ink)" }}>Email address</span>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--admin-muted)", display: "inline-flex" }}>
                <Icon name="send" size={15} />
              </span>
              <input
                ref={emailRef}
                type="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%", padding: "13px 14px 13px 40px", borderRadius: 12,
                  border: "1.6px solid var(--admin-line)", background: "#fff",
                  fontSize: 14.5, fontFamily: "inherit", outline: "none",
                }}
              />
            </div>
          </label>

          <label style={{ display: "grid", gap: 7, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--admin-ink)" }}>Password</span>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--admin-muted)", display: "inline-flex" }}>
                <Icon name="lock" size={15} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
                onKeyDown={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
                style={{
                  width: "100%", padding: "13px 44px 13px 40px", borderRadius: 12,
                  border: "1.6px solid var(--admin-line)", background: "#fff",
                  fontSize: 14.5, fontFamily: "inherit", outline: "none",
                  letterSpacing: password ? ".08em" : undefined,
                }}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: 0, cursor: "pointer", color: "var(--admin-muted)",
                  padding: 8, display: "inline-flex",
                }}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
              </button>
            </div>
          </label>

          {capsLock && (
            <p style={{ margin: "0 0 10px", fontSize: 11.5, color: "#b7791f", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="alertTriangle" size={13} /> Caps Lock is on
            </p>
          )}

          {error && (
            <div className="admin-login-error" style={{ marginTop: 4 }}>
              <Icon name="alertTriangle" size={15} /> {error}
            </div>
          )}

          <Btn type="submit" loading={loading} className="admin-login-submit" icon={!loading ? "arrowRight" : undefined} style={{ width: "100%", marginTop: 12 }}>
            Sign in securely
          </Btn>
        </form>

        <p style={{ textAlign: "center", fontSize: 11.5, color: "var(--admin-muted)", margin: "14px 0 0", fontWeight: 600 }}>
          Forgot your password? Contact your system administrator.
        </p>

        {IS_DEV && (
          <div className="admin-login-demo">
            <div className="admin-login-demo-head">
              <Icon name="key" size={14} />
              <span>Dev seed — password: <b>demo1234</b> (hidden in production)</span>
            </div>
            <div className="admin-login-roles">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => {
                    setEmail(u.email);
                    setPassword("demo1234");
                  }}
                >
                  <span>{u.role}</span>
                  <small>{u.email}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="admin-login-secure">
          <Icon name="shieldCheck" size={13} />
          Passwords are scrypt-hashed · sessions are HMAC-signed · sign-ins rate-limited &amp; audited
        </div>
      </div>
      <div className="admin-login-foot">
        <Icon name="spark" size={12} /> Medora Control Centre v1.0 — © {new Date().getFullYear()} Medora Health
      </div>
    </div>
  );
}
