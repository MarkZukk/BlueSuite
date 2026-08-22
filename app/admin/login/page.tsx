"use client";
import { FormEvent, useState } from "react";
import { ArrowRight, KeyRound, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      window.location.assign("/admin");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to sign in."); setLoading(false); }
  }
  return <main className="page" style={{ minHeight: "calc(100vh - 220px)", display: "grid", placeItems: "center" }}><section className="main-card" style={{ width: "min(100%, 440px)" }}><div className="eyebrow">BLUESUITE / CONTROL CENTER</div><h1 style={{ fontSize: 44, marginTop: 10 }}>Admin sign in</h1><p className="muted">Enter the server-configured administrator password to continue.</p><form onSubmit={submit} style={{ marginTop: 28 }}><div className="field"><label htmlFor="admin-password"><KeyRound size={12} style={{ verticalAlign: "-2px", marginRight: 5 }} />Password</label><input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus /></div>{error && <div className="notice" style={{ marginTop: 14, borderColor: "var(--danger)", color: "var(--danger)" }}>{error}</div>}<button className="button primary" style={{ marginTop: 18, width: "100%" }} disabled={loading}>{loading ? <><Loader2 size={15} /> Signing in…</> : <>Continue <ArrowRight size={15} /></>}</button></form></section></main>;
}
