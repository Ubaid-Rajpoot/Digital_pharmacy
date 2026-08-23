"use client";

import { useState, type FormEvent } from "react";
import { useList, useMutate, type ListParams } from "@/components/admin/api";
import { Icon } from "@/components/admin/icons";
import {
  Btn, Card, Confirm, EmptyState, ErrorState, Field, Modal, PageHeader, SearchInput,
  Select, Skeleton, Status, Table, Td, TextInput, Th, TimeAgo, useToast, Toggle,
} from "@/components/admin/ui";
import type { AdminUser, RoleDef } from "@/lib/db/types";

const MODULES = ["dashboard", "products", "categories", "brands", "inventory", "orders", "customers", "reviews", "dealers", "coupons", "content", "media", "support", "newsletter", "reports", "users", "settings", "notifications", "audit", "security"];

export default function UsersPage() {
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 10 });
  const [editing, setEditing] = useState<AdminUser | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [roleEditor, setRoleEditor] = useState<RoleDef | null>(null);
  const { data, loading, error, refetch } = useList<AdminUser>("users", params);
  const { data: roles, refetch: refetchRoles } = useList<RoleDef>("roles", { pageSize: 20 });
  const mutate = useMutate("users", { onSuccess: refetch });
  const toast = useToast();

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Users & roles"
        sub="Control who can access the Control Centre and what they can do, with role-based permissions."
        actions={<Btn icon="userPlus" onClick={() => setEditing("new")}>Invite admin</Btn>}
      />

      <div className="admin-security-grid" style={{ marginBottom: 15 }}>
        <Card kicker="Team" title="Admin users" actions={<span className="admin-count">{data?.total ?? 0} members</span>} pad={false} bodyClassName="admin-table-card">
          <div className="admin-toolbar">
            <SearchInput value={params.search ?? ""} onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))} placeholder="Search team members…" />
          </div>
          {loading ? <Skeleton rows={6} /> : error ? <ErrorState message={error} retry={refetch} /> : !data || data.items.length === 0 ? (
            <EmptyState icon="users" title="No users yet" />
          ) : (
            <Table minWidth={760} head={<><Th>User</Th><Th>Role</Th><Th>2FA</Th><Th>Last login</Th><Th>Status</Th><Th /></>}>
              {data.items.map((u) => (
                <tr key={u.id}>
                  <Td>
                    <div className="admin-table-product">
                      <img src={u.avatar} alt="" style={{ borderRadius: "50%" }} />
                      <span><b>{u.name}</b><small>{u.email}</small></span>
                    </div>
                  </Td>
                  <Td><span className="admin-category-tag dark:!bg-[#1a293c] dark:!text-(--admin-muted)">{u.role}</span></Td>
                  <Td>{u.twoFactor ? <span className="admin-coupon-code green"><Icon name="shieldCheck" size={11} /> On</span> : <span className="admin-coupon-code">Off</span>}</Td>
                  <Td className="admin-muted-cell">{u.lastLogin ? <TimeAgo iso={u.lastLogin} /> : "Never"}</Td>
                  <Td><Status value={u.status} /></Td>
                  <Td>
                    <span style={{ display: "inline-flex", gap: 5 }}>
                      <Btn size="sm" variant="secondary" onClick={() => setEditing(u)}>Edit</Btn>
                      <Btn size="sm" variant="quiet" onClick={() => setConfirmDelete(u)}><Icon name="trash" size={13} /></Btn>
                    </span>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card kicker="Access control" title="Roles & permissions" actions={<span className="admin-count">{roles?.total ?? 0} roles</span>}>
          <div className="admin-roles">
            {(roles?.items ?? []).map((r) => (
              <div className="admin-role-row" key={r.id}>
                <span className="admin-avatar violet">{r.name.slice(0, 2).toUpperCase()}</span>
                <span><b>{r.name}</b><small>{r.users} member(s) · {r.description.slice(0, 52)}…</small></span>
                <Btn size="sm" variant="secondary" onClick={() => setRoleEditor(r)}>Permissions</Btn>
              </div>
            ))}
          </div>
          <div className="admin-settings-note" style={{ marginTop: 16 }}>
            <Icon name="key" size={16} />
            <span><b>Principle of least privilege</b><small>Give each role only the modules its members need.</small></span>
          </div>
        </Card>
      </div>

      {editing && (
        <UserForm user={editing === "new" ? null : editing} roles={(roles?.items ?? []).map((r) => r.name)} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); toast(editing === "new" ? "Admin invited" : "User updated"); refetch(); }} />
      )}

      {roleEditor && (
        <RoleEditor role={roleEditor} onClose={() => setRoleEditor(null)} onSaved={() => { setRoleEditor(null); toast("Role permissions updated"); refetchRoles(); }} />
      )}

      <Confirm
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && void mutate.remove(confirmDelete.id, "User removed").then((r) => r.ok && setConfirmDelete(null))}
        title="Remove user?"
        body={confirmDelete ? `${confirmDelete.name} will lose access to the Control Centre immediately.` : undefined}
        loading={mutate.loading}
      />
    </>
  );
}

function UserForm({ user, roles, onClose, onSaved }: { user: AdminUser | null; roles: string[]; onClose: () => void; onSaved: () => void }) {
  const mutate = useMutate("users");
  const toast = useToast();
  const [form, setForm] = useState<Record<string, unknown>>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? roles[0],
    status: user?.status ?? "active",
    twoFactor: user?.twoFactor ?? false,
    password: "",
  });
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!String(form.name).trim() || !String(form.email).trim()) return toast("Name and email are required", "error");
    const password = String(form.password ?? "");
    if (password && password.length < 8) return toast("Password must be at least 8 characters", "error");
    // Omit an untouched password so edits never reset it.
    const payload = { ...form };
    if (!password) delete payload.password;
    const res = user ? await mutate.update(user.id, payload) : await mutate.create({ ...payload, avatar: `https://picsum.photos/seed/new-admin-${Date.now()}/120/120` });
    if (res.ok) onSaved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={user ? `Edit ${user.name}` : "Create admin user"}
      sub={user ? "Update role, status or set a new password." : "Set a strong password — it is stored as a scrypt hash."}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn icon="check" onClick={submit} loading={mutate.loading}>{user ? "Save changes" : "Create user"}</Btn></>}
    >
      <form onSubmit={submit} className="admin-form-grid">
        <Field label="Full name" required><TextInput value={form.name as string} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Email" required><TextInput type="email" value={form.email as string} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Role">
          <Select value={form.role as string} onChange={(e) => set("role", e.target.value)}>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status as string} onChange={(e) => set("status", e.target.value)}>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </Select>
        </Field>
        <Field
          label={user ? "Set new password (optional)" : "Password"}
          hint={user ? "Leave blank to keep the current password" : "Minimum 8 characters"}
        >
          <TextInput
            type="password"
            autoComplete="new-password"
            placeholder={user ? "•••••••••• (unchanged)" : "Minimum 8 characters"}
            value={form.password as string}
            onChange={(e) => set("password", e.target.value)}
          />
        </Field>
        <div className="admin-choice" style={{ gridColumn: "1 / -1" }}>
          <span>Require two-factor authentication</span>
          <Toggle on={form.twoFactor as boolean} onChange={(v) => set("twoFactor", v)} />
        </div>
      </form>
    </Modal>
  );
}

function RoleEditor({ role, onClose, onSaved }: { role: RoleDef; onClose: () => void; onSaved: () => void }) {
  const mutate = useMutate("roles");
  const [perms, setPerms] = useState<string[]>(role.permissions.includes("*") ? [...MODULES] : role.permissions);

  const toggle = (m: string) => {
    setPerms((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));
  };

  const save = async () => {
    const all = perms.length === MODULES.length;
    const res = await mutate.update(role.id, { permissions: all ? ["*"] : perms }, `Permissions updated for ${role.name}`);
    if (res.ok) onSaved();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`${role.name} — permissions`}
      sub={role.description}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn icon="check" onClick={() => void save()} loading={mutate.loading}>Save permissions</Btn></>}
    >
      <div className="admin-form-section">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {MODULES.map((m) => (
            <button
              key={m}
              onClick={() => toggle(m)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 11px", borderRadius: 9,
                border: `1.5px solid ${perms.includes(m) ? "var(--admin-green)" : "var(--admin-line)"}`,
                background: perms.includes(m) ? "var(--admin-green-soft)" : "#fff",
                color: perms.includes(m) ? "var(--admin-green)" : "var(--admin-muted)",
                fontSize: 10.5, fontWeight: 800, textTransform: "capitalize",
              }}
            >
              <Icon name={perms.includes(m) ? "check" : "plus"} size={12} />
              {m}
            </button>
          ))}
        </div>
        <small style={{ color: "var(--admin-muted)" }}>{perms.length} of {MODULES.length} modules granted — {perms.length === MODULES.length ? "effectively full access" : "least privilege"}</small>
      </div>
    </Modal>
  );
}
