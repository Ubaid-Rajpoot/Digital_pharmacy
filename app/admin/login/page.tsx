"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/components/admin/api";
import { Icon, type IconName } from "@/components/admin/icons";
import { Btn, Field, TextInput, useToast } from "@/components/admin/ui";

// Demo credentials exist only in the seeded development dataset; never
// surface them in production builds (NODE_ENV is inlined at build time).
const IS_DEV = process.env.NODE_ENV !== "production";

const DEMO_USERS = [
  { role: "Super Admin", email: "admin@medora.health" },
  { role: "Manager", email: "sneha@medora.health" },
  { role: "Support", email: "priya@medora.health" },
];

const HERO_POINTS: { icon: IconName; title: string; copy: string }[] = [
  {
    icon: "shieldCheck",
    title: "Enterprise-grade security",
    copy: "Scrypt-hashed credentials, HMAC-signed sessions and rate-limited, fully audited sign-ins.",
  },
  {
    icon: "zap",
    title: "Unified operations console",
    copy: "Orders, inventory, prescriptions and fulfilment — managed from one real-time workspace.",
  },
  {
    icon: "trendUp",
    title: "Decision-ready analytics",
    copy: "Revenue, stock health and growth insights with exportable reporting for every team.",
  },
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
  const [demoOpen, setDemoOpen] = useState(false);
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
        // First-ever login on a fresh database seeds the store, which can
        // take a while — allow it the full serverless budget (maxDuration=60).
        signal: AbortSignal.timeout(60_000),
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

  const trackCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) =>
    setCapsLock(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div className="admin-login-shell">
      <aside className="admin-login-hero">
        <div className="admin-login-glow" />
        <div className="admin-login-hero-inner">
          <div className="admin-login-brand light">
            <span className="admin-brand-mark">✚</span>
            <span>
              <b>Medora</b>
              <small>CONTROL CENTRE</small>
            </span>
          </div>

          <div className="admin-login-hero-body">
            <h2>
              Run your pharmacy
              <br />
              like an <em>enterprise</em>.
            </h2>
            <p>
              The command centre behind Medora — trusted by store teams to manage
              catalogue, orders and compliance at scale.
            </p>
            <div className="admin-login-points">
              {HERO_POINTS.map((pt) => (
                <div key={pt.title}>
                  <span className="admin-login-point-icon">
                    <Icon name={pt.icon} size={16} />
                  </span>
                  <span>
                    <b>{pt.title}</b>
                    <small>{pt.copy}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-login-hero-foot">
            <Icon name="lock" size={12} />
            Passwords scrypt-hashed · sessions HMAC-signed · sign-ins rate-limited &amp; audited
          </div>
        </div>
      </aside>

      <main className="admin-login-pane">
        <div className="admin-login-brand mobile-only">
          <span className="admin-brand-mark">✚</span>
          <span>
            <b>Medora</b>
            <small>CONTROL CENTRE</small>
          </span>
        </div>

        <div className="admin-login-box">
          <h1>Sign in to your workspace</h1>
          <p className="admin-login-sub">
            Authorised staff only. Access to patient data, orders and store
            operations is logged and monitored.
          </p>

          <form onSubmit={submit} noValidate>
            <div className="admin-form-stack">
              <Field label="Email address" required>
                <TextInput
                  ref={emailRef}
                  type="email"
                  icon="send"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field label="Password" required>
                <TextInput
                  type={showPassword ? "text" : "password"}
                  icon="lock"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={trackCapsLock}
                  onKeyDown={trackCapsLock}
                  right={
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                      style={{
                        background: "none", border: 0, cursor: "pointer",
                        color: "var(--admin-muted)", padding: 8, display: "inline-flex",
                      }}
                    >
                      <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
                    </button>
                  }
                />
              </Field>
            </div>

            {capsLock && (
              <p style={{ margin: "6px 2px 0", fontSize: 11.5, color: "#b7791f", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="alertTriangle" size={13} /> Caps Lock is on
              </p>
            )}

            {error && (
              <div className="admin-login-error" style={{ marginTop: 12 }}>
                <Icon name="alertTriangle" size={15} /> {error}
              </div>
            )}

            <Btn type="submit" loading={loading} className="admin-login-submit" icon={!loading ? "arrowRight" : undefined}>
              Sign in securely
            </Btn>
          </form>

          <div className="admin-login-links">
            <span>Forgot your password? Contact your administrator.</span>
            <a href="/">
              <Icon name="home" size={12} /> Back to storefront
            </a>
          </div>

          {IS_DEV && (
            <div className="admin-login-demo">
              <button
                type="button"
                className="admin-login-demo-head"
                onClick={() => setDemoOpen((v) => !v)}
                aria-expanded={demoOpen}
              >
                <Icon name="key" size={13} />
                <span>Development seed credentials</span>
                <Icon name={demoOpen ? "chevronUp" : "chevronDown"} size={13} />
              </button>
              {demoOpen && (
                <>
                  <p className="admin-login-demo-pass">
                    Password for all roles: <b>demo1234</b> (hidden in production)
                  </p>
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
                </>
              )}
            </div>
          )}
        </div>

        <div className="admin-login-foot">
          <Icon name="spark" size={12} /> Medora Control Centre v1.0 — © {new Date().getFullYear()} Medora Health
        </div>
      </main>
    </div>
  );
}
