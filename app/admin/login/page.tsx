"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import { Btn, Field, TextInput, useToast } from "@/components/admin/ui";

const DEMO_USERS = [
  { role: "Super Admin", email: "admin@medora.health" },
  { role: "Manager", email: "sneha@medora.health" },
  { role: "Inventory", email: "amit@medora.health" },
  { role: "Support", email: "priya@medora.health" },
  { role: "Marketing", email: "rohit@medora.health" },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setError(err instanceof ApiError ? err.message : "Unable to sign in.");
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
        <h1>Welcome back</h1>
        <p className="admin-login-sub">Sign in to manage your store — orders, inventory, customers and more.</p>

        <form onSubmit={submit} noValidate>
          <div className="admin-form-stack">
            <Field label="Email address" required>
              <TextInput
                type="email"
                autoComplete="email"
                placeholder="you@medora.health"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password" required>
              <TextInput
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          </div>

          <div className="admin-login-row">
            <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, color: "var(--admin-ink-soft)" }}>
              <input type="checkbox" defaultChecked style={{ accentColor: "var(--admin-blue)" }} /> Keep me signed in
            </label>
            <button type="button" className="admin-text-link" onClick={() => toast("Password reset emails are simulated in this demo.", "info")}>
              Forgot password?
            </button>
          </div>

          {error && (
            <div className="admin-login-error">
              <Icon name="alertTriangle" size={15} /> {error}
            </div>
          )}

          <Btn type="submit" loading={loading} className="admin-login-submit" icon={!loading ? "arrowRight" : undefined}>
            Sign in to dashboard
          </Btn>
        </form>

        <div className="admin-login-demo">
          <div className="admin-login-demo-head">
            <Icon name="key" size={14} />
            <span>Demo access — password: <b>demo1234</b></span>
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

        <div className="admin-login-secure">
          <Icon name="shieldCheck" size={13} />
          Protected by rate limiting, 2FA-ready sessions and full audit logging
        </div>
      </div>
      <div className="admin-login-foot">
        <Icon name="spark" size={12} /> Medora Control Centre v1.0 — © {new Date().getFullYear()} Medora Health
      </div>
    </div>
  );
}
