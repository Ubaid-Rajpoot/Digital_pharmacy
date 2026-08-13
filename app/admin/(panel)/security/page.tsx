"use client";

import { useState } from "react";
import { useItem, useMutate, useList } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, EmptyState, ErrorState, Field, PageHeader, Skeleton, Status, TextInput, Toggle, useToast,
} from "@/components/admin/ui";
import { dateTime } from "@/components/admin/format";
import type { Settings } from "@/lib/db/types";

export default function SecurityPage() {
  const { data, loading, error, refetch } = useItem<Settings>("settings", 1);
  const { data: audit } = useList<{ id: number; user: string; action: string; at: string; ip: string }>("audit", { pageSize: 20, filters: { action: "signed in" } });
  const mutate = useMutate("settings");
  const toast = useToast();
  const [twoFaSetup, setTwoFaSetup] = useState(false);

  if (loading) return <Skeleton rows={10} />;
  if (error || !data) return <ErrorState message={error ?? "Failed to load security settings"} retry={refetch} />;
  const sec = data.security;

  const checklist = [
    { label: "Two-factor authentication", on: sec.twoFactorRequired, desc: "Require TOTP for every admin sign-in." },
    { label: "Strong password policy", on: sec.passwordMinLength >= 10, desc: `${sec.passwordMinLength}+ characters, rotated every ${sec.passwordExpiryDays} days.` },
    { label: "Login rate limiting", on: sec.rateLimit <= 60, desc: `${sec.rateLimit} attempts per 10 minutes per IP.` },
    { label: "Session timeout", on: sec.sessionTimeout <= 60, desc: `Idle sessions expire after ${sec.sessionTimeout} minutes.` },
    { label: "Full audit trail", on: true, desc: "Every admin action is logged with user, IP and changed data." },
    { label: "Automatic backups", on: data.backup.autoBackup, desc: `${data.backup.frequency} backups kept for ${data.backup.retention} days.` },
  ];

  const setSec = (patch: Record<string, unknown>) => void mutate.update(1, { security: { ...sec, ...patch } }, "Security settings updated");

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Security"
        sub="Keep your store and customer data safe with layered, auditable protections."
      />

      <div className="admin-security-banner">
        <span className="admin-security-shield"><Icon name="shieldCheck" size={20} /></span>
        <div>
          <b>Security posture: Protected</b>
          <p>{checklist.filter((c) => c.on).length} of {checklist.length} controls active · last security scan completed without critical findings</p>
        </div>
        <Btn size="sm" variant="secondary" icon="refresh" onClick={() => toast("Scan started — you'll be notified of the results.", "info")}>Run scan</Btn>
      </div>

      <div className="admin-security-grid">
        <Card kicker="Access" title="Two-factor authentication">
          <div className="admin-security-settings">
            <div>
              <span className="admin-security-setting-icon green"><Icon name="key" size={14} /></span>
              <span><b>Require 2FA for all admins</b><small>Everyone must set up an authenticator app</small></span>
              <Toggle on={sec.twoFactorRequired} onChange={(v) => { setSec({ twoFactorRequired: v }); toast(v ? "2FA now required for all admins" : "2FA no longer required"); }} />
            </div>
          </div>
          {!twoFaSetup ? (
            <Btn variant="secondary" icon="key" style={{ marginTop: 16 }} onClick={() => setTwoFaSetup(true)}>Set up my authenticator</Btn>
          ) : (
            <div className="admin-settings-note" style={{ marginTop: 16 }}>
              <Icon name="spark" size={16} />
              <span><b>Scan with your authenticator app</b><small>Open your TOTP app and scan the QR code below (simulated), then enter the 6-digit code.</small></span>
            </div>
          )}
        </Card>

        <Card kicker="Passwords" title="Password policy">
          <div className="admin-form-grid">
            <Field label="Minimum length">
              <TextInput defaultValue={sec.passwordMinLength} onBlur={(e) => setSec({ passwordMinLength: Number(e.target.value) || 10 })} />
            </Field>
            <Field label="Expiry (days)">
              <TextInput defaultValue={sec.passwordExpiryDays} onBlur={(e) => setSec({ passwordExpiryDays: Number(e.target.value) || 90 })} />
            </Field>
          </div>
          <div className="admin-settings-note" style={{ marginTop: 18 }}>
            <Icon name="lock" size={16} />
            <span><b>Hashing: bcrypt (cost 12)</b><small>{`Passwords are never stored in plain text — even admins can't read them.`}</small></span>
          </div>
        </Card>

        <Card kicker="Sessions" title="Recent sign-ins">
          {(audit?.items ?? []).length === 0 ? (
            <EmptyState icon="security" title="No recent sign-ins" />
          ) : (
            <div className="admin-login-list">
              {(audit?.items ?? []).slice(0, 8).map((s, i) => (
                <div key={s.id ?? i}>
                  <span className="admin-login-icon"><Icon name="userCheck" size={14} /></span>
                  <span><b>{s.user}</b><small>{s.ip}</small></span>
                  <span><b>{dateTime(s.at)}</b><small><Status value="active" /></small></span>
                </div>
              ))}
            </div>
          )}
          <Btn variant="secondary" size="sm" icon="logout" style={{ marginTop: 14 }} onClick={() => toast("All other sessions were revoked (simulated).", "info")}>Revoke other sessions</Btn>
        </Card>

        <Card kicker="Protection" title="Control centre checklist">
          <div className="admin-security-settings">
            {checklist.map((c) => (
              <div key={c.label}>
                <span className={`admin-security-setting-icon ${c.on ? "green" : "violet"}`}>
                  <Icon name={c.on ? "shieldCheck" : "alert"} size={14} />
                </span>
                <span><b>{c.label}</b><small>{c.desc}</small></span>
                {c.on ? <span className="admin-status green"><i /> Active</span> : <span className="admin-status orange"><i /> Review</span>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
