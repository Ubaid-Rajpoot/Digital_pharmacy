"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useItem, useMutate } from "@/components/admin/api";
import { Icon, type IconName } from "@/components/admin/icons";
import {
  Btn, Card, EmptyState, ErrorState, Field, PageHeader, Select, Skeleton, TextArea, TextInput, Toggle, useToast,
} from "@/components/admin/ui";
import type { Settings } from "@/lib/db/types";

const TABS: { id: string; label: string; icon: IconName; desc: string }[] = [
  { id: "store", label: "Store information", icon: "home", desc: "Name, contact details and branding" },
  { id: "email", label: "Email & SMTP", icon: "mail", desc: "Outgoing mail server and sender" },
  { id: "payments", label: "Payment gateways", icon: "card", desc: "Accepted payment methods" },
  { id: "shipping", label: "Shipping methods", icon: "truck", desc: "Delivery options and rates" },
  { id: "taxes", label: "Taxes", icon: "percent", desc: "Tax rates and calculation rules" },
  { id: "languages", label: "Currency & languages", icon: "globe", desc: "Localisation settings" },
  { id: "theme", label: "Theme settings", icon: "palette", desc: "Colours, fonts and radius" },
  { id: "seo", label: "SEO", icon: "search", desc: "Meta defaults and verification" },
  { id: "security", label: "Security", icon: "lock", desc: "Passwords, sessions and 2FA" },
  { id: "backup", label: "Backup", icon: "database", desc: "Automatic backups and retention" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("store");
  const { data, loading, error, refetch } = useItem<Settings>("settings", 1);
  const mutate = useMutate("settings");
  const toast = useToast();

  const save = async (section: string, value: unknown, msg = "Settings saved") => {
    const res = await mutate.update(1, { [section]: value }, msg);
    if (res.ok) refetch();
  };

  return (
    <>
      <PageHeader eyebrow="System" title="Settings" sub="Configure every part of your store — from branding to security." />

      <div className="admin-settings-layout">
        <Card className="admin-settings-tabs" pad={false} bodyClassName="" style={{ padding: 9 }}>
          {TABS.map((t, i) => (
            <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <b>{t.label}</b>
              <Icon name="chevronRight" size={12} />
            </button>
          ))}
          <div className="admin-settings-help">
            <span className="admin-quick-icon blue"><Icon name="help" size={14} /></span>
            <b>Need help?</b>
            <small>Reach the care team anytime.</small>
            <button>Contact support <Icon name="arrowRight" size={11} /></button>
          </div>
        </Card>

        <Card className="admin-settings-form" pad={false} bodyClassName="" style={{ padding: 22 }}>
          {loading ? (
            <Skeleton rows={8} />
          ) : error ? (
            <ErrorState message={error} retry={refetch} />
          ) : !data ? (
            <EmptyState icon="settings" title="No settings found" />
          ) : (
            <div className="admin-form-stack">
              {tab === "store" && (
                <>
                  <SectionHead title="Store information" desc="How your store appears to customers and in receipts." />
                  <div className="admin-form-grid">
                    <Field label="Store name"><TextInput defaultValue={data.store.name} onBlur={(e) => void save("store", { ...data.store, name: e.target.value })} /></Field>
                    <Field label="Tagline"><TextInput defaultValue={data.store.tagline} onBlur={(e) => void save("store", { ...data.store, tagline: e.target.value })} /></Field>
                    <Field label="Support email"><TextInput defaultValue={data.store.email} onBlur={(e) => void save("store", { ...data.store, email: e.target.value })} /></Field>
                    <Field label="Phone"><TextInput defaultValue={data.store.phone} onBlur={(e) => void save("store", { ...data.store, phone: e.target.value })} /></Field>
                    <Field label="Address" className="full"><TextArea rows={2} defaultValue={data.store.address} onBlur={(e) => void save("store", { ...data.store, address: e.target.value })} /></Field>
                    <Field label="Currency"><Select defaultValue={data.store.currency} onChange={(e) => void save("store", { ...data.store, currency: e.target.value })}><option>INR (Rs)</option><option>USD ($)</option><option>EUR (€)</option><option>GBP (£)</option><option>PKR (Rs)</option></Select></Field>
                    <Field label="Timezone"><Select defaultValue={data.store.timezone} onChange={(e) => void save("store", { ...data.store, timezone: e.target.value })}><option>Asia/Kolkata</option><option>Asia/Karachi</option><option>UTC</option><option>America/New_York</option></Select></Field>
                    <Field label="Monthly revenue target (Rs)"><TextInput type="number" defaultValue={data.store.revenueTarget ?? 0} onBlur={(e) => void save("store", { ...data.store, revenueTarget: Math.max(0, Number(e.target.value) || 0) })} /></Field>
                  </div>
                  <div className="admin-logo-upload">
                    <span className="admin-logo-preview"><Icon name="spark" size={20} /></span>
                    <div><b>Store logo & favicon</b><small>PNG or SVG with transparent background · 240×90 recommended</small></div>
                    <button onClick={() => toast("Logo uploads use the Media Library.", "info")}><Icon name="upload" size={13} /> Replace</button>
                  </div>
                </>
              )}

              {tab === "email" && (
                <>
                  <SectionHead title="Email & SMTP" desc="All transactional and campaign emails are sent from this server." />
                  <div className="admin-form-grid">
                    <Field label="From address"><TextInput defaultValue={data.email.from} onBlur={(e) => void save("email", { ...data.email, from: e.target.value })} /></Field>
                    <Field label="Reply-to"><TextInput defaultValue={data.email.replyTo} onBlur={(e) => void save("email", { ...data.email, replyTo: e.target.value })} /></Field>
                    <Field label="SMTP host"><TextInput defaultValue={data.email.smtp.host} onBlur={(e) => void save("email", { ...data.email, smtp: { ...data.email.smtp, host: e.target.value } })} /></Field>
                    <Field label="SMTP port"><TextInput defaultValue={data.email.smtp.port} onBlur={(e) => void save("email", { ...data.email, smtp: { ...data.email.smtp, port: Number(e.target.value) } })} /></Field>
                    <Field label="Username"><TextInput defaultValue={data.email.smtp.user} onBlur={(e) => void save("email", { ...data.email, smtp: { ...data.email.smtp, user: e.target.value } })} /></Field>
                    <div className="admin-choice"><span>Use TLS/SSL</span><Toggle on={data.email.smtp.secure} onChange={(v) => void save("email", { ...data.email, smtp: { ...data.email.smtp, secure: v } })} /></div>
                  </div>
                  <Btn variant="secondary" icon="send" onClick={() => toast("A test email was sent to care@medora.health (simulated).", "info")}>Send test email</Btn>
                </>
              )}

              {tab === "payments" && (
                <>
                  <SectionHead title="Payment gateways" desc="Toggle which payment methods customers can use." />
                  <div className="admin-form-stack">
                    {data.payments.methods.map((m) => (
                      <div className="admin-security-settings" key={m.id}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 0", borderTop: "1px solid var(--admin-line)" }}>
                          <span className="admin-security-setting-icon green"><Icon name="card" size={14} /></span>
                          <span style={{ flex: 1 }}><b>{m.label}</b></span>
                          <Toggle on={m.enabled} onChange={(v) => void save("payments", { ...data.payments, methods: data.payments.methods.map((x) => (x.id === m.id ? { ...x, enabled: v } : x)) })} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tab === "shipping" && (
                <>
                  <SectionHead title="Shipping methods" desc="Rates and free-delivery thresholds per method." />
                  <div className="admin-form-stack">
                    {data.shipping.methods.map((m) => (
                      <div key={m.id} className="admin-card" style={{ padding: 15 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <span className="admin-quick-icon blue"><Icon name="truck" size={15} /></span>
                          <b style={{ flex: 1, fontSize: 12 }}>{m.label}</b>
                          <Toggle on={m.enabled} onChange={(v) => void save("shipping", { ...data.shipping, methods: data.shipping.methods.map((x) => (x.id === m.id ? { ...x, enabled: v } : x)) })} />
                        </div>
                        <div className="admin-form-grid">
                          <Field label="Cost (Rs)"><TextInput defaultValue={m.cost} onBlur={(e) => void save("shipping", { ...data.shipping, methods: data.shipping.methods.map((x) => (x.id === m.id ? { ...x, cost: Number(e.target.value) } : x)) })} /></Field>
                          <Field label="Free above (Rs, 0 = never)"><TextInput defaultValue={m.freeAbove} onBlur={(e) => void save("shipping", { ...data.shipping, methods: data.shipping.methods.map((x) => (x.id === m.id ? { ...x, freeAbove: Number(e.target.value) } : x)) })} /></Field>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tab === "taxes" && (
                <>
                  <SectionHead title="Taxes" desc="Configure how tax is calculated and displayed." />
                  <div className="admin-form-grid">
                    <div className="admin-choice"><span>Enable tax</span><Toggle on={data.taxes.enabled} onChange={(v) => void save("taxes", { ...data.taxes, enabled: v })} /></div>
                    <div className="admin-choice"><span>Prices include tax</span><Toggle on={data.taxes.included} onChange={(v) => void save("taxes", { ...data.taxes, included: v })} /></div>
                    <Field label="Tax rate (%)"><TextInput defaultValue={data.taxes.rate} onBlur={(e) => void save("taxes", { ...data.taxes, rate: Number(e.target.value) })} /></Field>
                    <Field label="Tax label"><TextInput defaultValue={data.taxes.label} onBlur={(e) => void save("taxes", { ...data.taxes, label: e.target.value })} /></Field>
                  </div>
                </>
              )}

              {tab === "languages" && (
                <>
                  <SectionHead title="Currency & languages" desc="Set the storefront default currency and available languages." />
                  <div className="admin-form-stack">
                    {data.languages.map((l) => (
                      <div className="admin-security-settings" key={l.code}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 0", borderTop: "1px solid var(--admin-line)" }}>
                          <span className="admin-security-setting-icon violet"><Icon name="lang" size={14} /></span>
                          <span style={{ flex: 1 }}><b>{l.label}</b><small style={{ display: "block", color: "var(--admin-muted)", fontSize: 9.5, marginTop: 2 }}>{l.code}</small></span>
                          {l.default && <span className="admin-coupon-code green">Default</span>}
                          <Btn size="sm" variant="secondary" onClick={() => void save("languages", data.languages.map((x) => ({ ...x, default: x.code === l.code }))).then(() => toast(`${l.label} is now the default language`))}>Set default</Btn>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tab === "theme" && (
                <>
                  <SectionHead title="Theme settings" desc="Adjust the look and feel without touching code." />
                  <div className="admin-form-grid">
                    <Field label="Accent colour"><input type="color" defaultValue={data.theme.accent} style={{ width: "100%", height: 38, border: "1px solid var(--admin-line)", borderRadius: 9, background: "#fff", padding: 4 }} onChange={(e) => void save("theme", { ...data.theme, accent: e.target.value })} /></Field>
                    <Field label="Base font"><Select defaultValue={data.theme.font} onChange={(e) => void save("theme", { ...data.theme, font: e.target.value })}><option>Manrope</option><option>Inter</option><option>Poppins</option><option>System default</option></Select></Field>
                    <Field label="Corner radius"><TextInput defaultValue={data.theme.radius} onBlur={(e) => void save("theme", { ...data.theme, radius: Number(e.target.value) })} /></Field>
                    <div className="admin-choice"><span>Dark mode default</span><Toggle on={data.theme.darkMode} onChange={(v) => void save("theme", { ...data.theme, darkMode: v })} /></div>
                  </div>
                </>
              )}

              {tab === "seo" && (
                <>
                  <SectionHead title="SEO" desc="Default metadata for pages without custom SEO." />
                  <div className="admin-form-grid">
                    <Field label="Title suffix" className="full"><TextInput defaultValue={data.seo.titleSuffix} onBlur={(e) => void save("seo", { ...data.seo, titleSuffix: e.target.value })} /></Field>
                    <Field label="Meta description" className="full"><TextArea rows={2} defaultValue={data.seo.description} onBlur={(e) => void save("seo", { ...data.seo, description: e.target.value })} /></Field>
                    <Field label="Meta keywords" className="full"><TextInput defaultValue={data.seo.keywords} onBlur={(e) => void save("seo", { ...data.seo, keywords: e.target.value })} /></Field>
                    <Field label="Google verification code"><TextInput defaultValue={data.seo.googleVerification} onBlur={(e) => void save("seo", { ...data.seo, googleVerification: e.target.value })} /></Field>
                  </div>
                </>
              )}

              {tab === "security" && (
                <>
                  <SectionHead title="Security settings" desc="Password policy, session and 2FA rules." />
                  <div className="admin-form-grid">
                    <Field label="Minimum password length"><TextInput defaultValue={data.security.passwordMinLength} onBlur={(e) => void save("security", { ...data.security, passwordMinLength: Number(e.target.value) })} /></Field>
                    <Field label="Session timeout (minutes)"><TextInput defaultValue={data.security.sessionTimeout} onBlur={(e) => void save("security", { ...data.security, sessionTimeout: Number(e.target.value) })} /></Field>
                    <Field label="Login rate limit (attempts/10min)"><TextInput defaultValue={data.security.rateLimit} onBlur={(e) => void save("security", { ...data.security, rateLimit: Number(e.target.value) })} /></Field>
                    <Field label="Password expiry (days)"><TextInput defaultValue={data.security.passwordExpiryDays} onBlur={(e) => void save("security", { ...data.security, passwordExpiryDays: Number(e.target.value) })} /></Field>
                    <div className="admin-choice full"><span>Require 2FA for all admins</span><Toggle on={data.security.twoFactorRequired} onChange={(v) => void save("security", { ...data.security, twoFactorRequired: v })} /></div>
                  </div>
                </>
              )}

              {tab === "backup" && (
                <>
                  <SectionHead title="Backup" desc="Protect your data with automatic backups." />
                  <div className="admin-form-grid">
                    <div className="admin-choice"><span>Automatic backups</span><Toggle on={data.backup.autoBackup} onChange={(v) => void save("backup", { ...data.backup, autoBackup: v })} /></div>
                    <Field label="Frequency"><Select defaultValue={data.backup.frequency} onChange={(e) => void save("backup", { ...data.backup, frequency: e.target.value })}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="hourly">Hourly</option></Select></Field>
                    <Field label="Retention (days)"><TextInput defaultValue={data.backup.retention} onBlur={(e) => void save("backup", { ...data.backup, retention: Number(e.target.value) })} /></Field>
                  </div>
                  <div className="admin-settings-note">
                    <Icon name="database" size={16} />
                    <span><b>Last backup: {new Date(data.backup.lastBackup).toLocaleString("en-IN")}</b><small>Restore from the backup console (available to Super Admins).</small></span>
                  </div>
                  <Btn variant="secondary" icon="database" onClick={() => toast("Backup started — you'll be notified when it completes.", "info")}>Back up now</Btn>
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="admin-eyebrow">{title}</div>
      <p style={{ color: "var(--admin-muted)", fontSize: 11.5, margin: "6px 0 0" }}>{desc}</p>
    </div>
  );
}
