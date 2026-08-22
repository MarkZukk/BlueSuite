"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, CheckCircle2, CircleAlert, Download, Filter, Loader2, Search, Sparkles } from "lucide-react";
import { chains } from "@/lib/chains";

type Holder = { address: string; items: number };
type Status = "idle" | "loading" | "done" | "error";

export default function Blueshot() {
  const [chain, setChain] = useState<keyof typeof chains>("robinhood");
  const [collection, setCollection] = useState("");
  const [checkAddress, setCheckAddress] = useState(false);
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [holders, setHolders] = useState<Holder[]>([]);
  const [holdingResult, setHoldingResult] = useState<{ holding: boolean; items: number } | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const filtered = useMemo(() => holders.filter(holder => holder.address.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.items - a.items), [holders, query]);
  const totalItems = holders.reduce((total, holder) => total + holder.items, 0);

  async function runSnapshot() {
    setStatus("loading");
    setError("");
    setHoldingResult(null);
    try {
      const response = await fetch("/api/snapshot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chain, collection, address, checkAddress }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Snapshot service could not reach the chain.");
      if (checkAddress) {
        setHoldingResult({ holding: Boolean(data.holding), items: Number(data.items ?? 0) });
      } else {
        setHolders(Array.isArray(data.holders) ? data.holders : []);
      }
      setLastRun(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setStatus("done");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Snapshot service could not reach the chain.");
      setStatus("error");
    }
  }

  function csv() {
    const text = "address,items\n" + [...filtered].sort((a, b) => b.items - a.items).map(holder => `${holder.address},${holder.items}`).join("\n") + "\n";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
    link.download = "blueshot-holders.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return <main className="page app-page">
    <div className="app-header"><div><div className="eyebrow">BLUESHOT / SNAPSHOT INFRASTRUCTURE</div><h1 style={{ fontSize: "clamp(46px,6vw,76px)" }}>Snapshot ownership.<br /><span style={{ color: "var(--blue-2)" }}>Keep moving.</span></h1></div><p>Resolve holders across supported chains, review the result, and export a clean operator-ready file.</p></div>
    <div className="app-layout">
      <aside className="side-card"><div className="side-title">Workspace</div><div className="side-nav"><button className="active">New snapshot</button><button>Snapshot history</button><button>Saved collections</button></div><div className="side-title" style={{ marginTop: 22 }}>System</div><div className="side-nav"><button>API status <span className="status-dot" style={{ display: "inline-block", marginLeft: 5 }} /></button><button>Export settings</button></div><div className="notice" style={{ marginTop: 20, fontSize: 11 }}>Alchemy is used first for indexed snapshots when configured. Robinhood falls back to parallel RPC and explorer paging automatically.</div></aside>
      <section className="main-card"><div className="eyebrow">NEW SNAPSHOT</div><h2 style={{ fontSize: 32, marginTop: 8 }}>Configure your capture</h2>
        <div className="form-grid" style={{ marginTop: 26 }}>
          <div className="field"><label htmlFor="chain">Chain</label><select id="chain" value={chain} onChange={event => setChain(event.target.value as keyof typeof chains)}>{Object.entries(chains).map(([key, item]) => <option value={key} key={key}>{item.label}</option>)}</select></div>
          <div className="field"><label htmlFor="collection">Collection / contract address</label><input id="collection" value={collection} onChange={event => setCollection(event.target.value)} placeholder="0x… ERC-721 or ERC-1155 contract" /></div>
          <label className="check-row" style={{ gridColumn: "1 / -1" }}><input type="checkbox" checked={checkAddress} onChange={event => { setCheckAddress(event.target.checked); setHoldingResult(null); setHolders([]); setQuery(""); }} /><span><strong>Check if an address is holding a collection</strong><small>Run a quick ownership check instead of downloading the holder list.</small></span></label>
          {checkAddress && <div className="field" style={{ gridColumn: "1 / -1" }}><label htmlFor="holder-address">Address to check</label><input id="holder-address" value={address} onChange={event => setAddress(event.target.value)} placeholder="0x… wallet address" autoComplete="off" /></div>}
        </div>
        <div className="form-actions"><span className="hint"><CheckCircle2 size={12} style={{ verticalAlign: "-2px", marginRight: 5, color: "var(--cyan)" }} /> Read-only lookup · no wallet connection required</span><button className="button primary" onClick={runSnapshot} disabled={status === "loading"}>{status === "loading" ? <><Loader2 size={15} className="spin" /> {checkAddress ? "Checking…" : "Capturing…"}</> : <>{checkAddress ? "Check address" : "Run snapshot"} <Sparkles size={14} /></>}</button></div>
        {status === "error" && <div className="notice" style={{ marginTop: 20, borderColor: "var(--danger)", color: "var(--danger)" }}><CircleAlert size={15} style={{ verticalAlign: "-3px", marginRight: 6 }} /> {error}</div>}
        {status === "done" && checkAddress && holdingResult && <div className="notice" style={{ marginTop: 20, borderColor: holdingResult.holding ? "var(--cyan)" : "var(--danger)", color: holdingResult.holding ? "var(--cyan)" : "var(--danger)" }}><CheckCircle2 size={15} style={{ verticalAlign: "-3px", marginRight: 6 }} /> {holdingResult.holding ? `Yes — this address holds ${holdingResult.items.toLocaleString()} item${holdingResult.items === 1 ? "" : "s"}.` : "No — this address does not hold this collection."}</div>}
        {status === "done" && !checkAddress && <div className="notice" style={{ marginTop: 20 }}><CheckCircle2 size={15} style={{ verticalAlign: "-3px", marginRight: 6, color: "var(--cyan)" }} /> Snapshot complete. Results are ready to review and export.</div>}
        <div className="metric-grid" style={{ marginTop: 34 }}><div className="metric"><span>UNIQUE HOLDERS</span><strong>{holders.length ? holders.length.toLocaleString() : "—"}</strong></div><div className="metric"><span>TOTAL ITEMS</span><strong>{holders.length ? totalItems.toLocaleString() : "—"}</strong></div><div className="metric"><span>CHAIN</span><strong style={{ fontSize: 24 }}>{chains[chain].short}</strong></div><div className="metric"><span>LAST RUN</span><strong style={{ fontSize: 24 }}>{lastRun ?? "—"}</strong></div></div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 34 }}><div><h3 style={{ fontSize: 22 }}>Holder results</h3><span className="hint">{holders.length ? `Latest snapshot · ${holders.length.toLocaleString()} addresses` : "Run a snapshot to populate this table."}</span></div><div style={{ display: "flex", gap: 8 }}>{holders.length > 0 && <><div className="field" style={{ display: "flex", alignItems: "center", position: "relative" }}><Search size={14} style={{ position: "absolute", left: 10, color: "var(--muted)" }} /><input aria-label="Search holders" style={{ paddingLeft: 30, paddingTop: 9, paddingBottom: 9, width: 160 }} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search" /></div><button className="button secondary" onClick={csv}><Download size={14} /> CSV</button></>}</div></div>
        {holders.length > 0 && <><div className="table-wrap"><table className="data-table"><thead><tr><th>Holder address</th><th>NFT count</th><th>Status</th></tr></thead><tbody>{filtered.map(holder => <tr key={holder.address}><td className="mono">{holder.address}</td><td>{holder.items.toLocaleString()}</td><td><span className="pill-good">VERIFIED</span></td></tr>)}</tbody></table></div><div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}><span className="hint"><Filter size={12} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Showing {filtered.length.toLocaleString()} of {holders.length.toLocaleString()} holders</span><span className="hint"><ArrowDownToLine size={12} style={{ verticalAlign: "-2px", marginRight: 5 }} /> CSV includes holder + item count</span></div></>}
      </section>
    </div>
  </main>;
}
