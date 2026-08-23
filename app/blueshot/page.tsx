"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, CheckCircle2, CircleAlert, Download, Filter, Loader2, Search, Sparkles, X } from "lucide-react";
import { chains } from "@/lib/chains";

type Holder = { address: string; items: number };
type Status = "idle" | "loading" | "done" | "error";
type CollectionPreview = {
  configured: boolean;
  name: string;
  imageUrl: string | null;
  description: string | null;
  slug: string | null;
  openseaUrl: string | null;
  message?: string;
};

const placeholderLines = [
  "Enter any collection's CA",
  "Paste an NFT contract address",
  "Try 0x… and run a snapshot",
];

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
  const [caPlaceholder, setCaPlaceholder] = useState("");
  const [rpcConfigured, setRpcConfigured] = useState<boolean | null>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [preview, setPreview] = useState<CollectionPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtered = useMemo(() => holders.filter(holder => holder.address.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.items - a.items), [holders, query]);
  const totalItems = holders.reduce((total, holder) => total + holder.items, 0);

  useEffect(() => {
    let phrase = 0;
    let cursor = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const line = placeholderLines[phrase];
      setCaPlaceholder(line.slice(0, cursor));
      if (!deleting && cursor < line.length) {
        cursor += 1;
        timer = setTimeout(tick, 48);
      } else if (!deleting) {
        deleting = true;
        timer = setTimeout(tick, 1450);
      } else if (cursor > 0) {
        cursor -= 1;
        timer = setTimeout(tick, 26);
      } else {
        deleting = false;
        phrase = (phrase + 1) % placeholderLines.length;
        timer = setTimeout(tick, 260);
      }
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/rpc-status", { cache: "no-store" })
      .then(response => response.ok ? response.json() as Promise<{ configured?: boolean }> : null)
      .then(data => { if (active) setRpcConfigured(Boolean(data?.configured)); })
      .catch(() => { if (active) setRpcConfigured(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  useEffect(() => {
    if (!preview) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setPreview(null); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [preview]);

  function triggerCameraFlash() {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlashActive(true);
    flashTimer.current = setTimeout(() => {
      setFlashActive(false);
      flashTimer.current = null;
    }, 620);
  }

  async function openCollectionPreview() {
    setError("");
    setPreviewError("");
    if (!collection.trim()) {
      setError("Enter a collection contract address before continuing.");
      return;
    }
    setPreviewLoading(true);
    try {
      const response = await fetch(`/api/collection-metadata?chain=${encodeURIComponent(chain)}&contract=${encodeURIComponent(collection.trim())}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({})) as { preview?: CollectionPreview | null; configured?: boolean; message?: string; error?: string };
      if (!response.ok && response.status !== 502) throw new Error(data.error || "Enter a valid collection contract address.");
      setPreview(data.preview ? { ...data.preview, configured: Boolean(data.configured) } : {
        configured: Boolean(data.configured),
        name: "Collection preview unavailable",
        imageUrl: null,
        description: null,
        slug: null,
        openseaUrl: null,
        message: data.message || "You can still proceed with the snapshot.",
      });
    } catch (requestError) {
      setPreviewError(requestError instanceof Error ? requestError.message : "Could not load the collection preview.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function runSnapshot() {
    triggerCameraFlash();
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

  return <main className="page app-page blueshot-page">
    <div className={`camera-flash ${flashActive ? "is-active" : ""}`} aria-hidden="true"><span className="camera-flash-ring camera-flash-ring-one" /><span className="camera-flash-ring camera-flash-ring-two" /></div>
    <div className="app-header blueshot-header"><div><div className="eyebrow">BLUESHOT / SNAPSHOT INFRASTRUCTURE</div><h1 style={{ fontSize: "clamp(46px,6vw,76px)" }}>Snapshot ownership.<br /><span style={{ color: "var(--blue-2)" }}>Keep moving.</span></h1></div><div className="blueshot-header-note"><span className={`rpc-status-pill ${rpcConfigured === null ? "is-checking" : rpcConfigured ? "is-ready" : "is-off"}`} title={rpcConfigured === null ? "Checking RPC configuration" : rpcConfigured ? "Alchemy RPC configured" : "No Alchemy key configured"}><i className="rpc-status-dot" /> RPC STATUS</span><p>Resolve holders across supported chains, review the result, and export a clean operator-ready file.</p></div></div>
    <div className="app-layout blueshot-layout">
      <section className="main-card blueshot-card"><div className="blueshot-card-top"><div><div className="eyebrow">NEW SNAPSHOT</div><h2 style={{ fontSize: 32, marginTop: 8 }}>Configure your capture</h2><p className="blueshot-subtitle">Drop a collection address, choose the network, and let Blueshot resolve the holders.</p></div><div className="capture-mark"><span>BS</span><small>01</small></div></div>
        <div className="snapshot-form-grid" style={{ marginTop: 28 }}>
          <div className="field collection-field"><label htmlFor="collection"><span>Collection contract address</span><em>Required</em></label><div className="input-shell"><span className="input-prefix">CA</span><input id="collection" value={collection} onChange={event => setCollection(event.target.value)} placeholder={caPlaceholder} autoComplete="off" spellCheck={false} /></div><small className="field-note">Any ERC-721 or ERC-1155 collection contract.</small></div>
          <div className="field chain-field"><label htmlFor="chain"><span>Chain</span><em>Network</em></label><div className="select-shell"><select id="chain" className="chain-select" value={chain} onChange={event => setChain(event.target.value as keyof typeof chains)}>{Object.entries(chains).map(([key, item]) => <option value={key} key={key}>{item.label}</option>)}</select></div><small className="field-note">Provider route: {chains[chain].network}</small></div>
          <label className="check-row" style={{ gridColumn: "1 / -1" }}><input type="checkbox" checked={checkAddress} onChange={event => { setCheckAddress(event.target.checked); setHoldingResult(null); setHolders([]); setQuery(""); }} /><span><strong>Check if an address is holding a collection</strong><small>Run a quick ownership check instead of downloading the holder list.</small></span><b className="check-arrow">↗</b></label>
          {checkAddress && <div className="field address-check-field" style={{ gridColumn: "1 / -1" }}><label htmlFor="holder-address"><span>Address to check</span><em>Optional mode</em></label><div className="input-shell"><span className="input-prefix">0x</span><input id="holder-address" value={address} onChange={event => setAddress(event.target.value)} placeholder="Paste a wallet address" autoComplete="off" spellCheck={false} /></div></div>}
        </div>
        <div className="form-actions blueshot-actions"><span className="hint"><CheckCircle2 size={12} style={{ verticalAlign: "-2px", marginRight: 5, color: "var(--cyan)" }} /> Read-only lookup · no wallet connection required</span><button className="button primary capture-button" onClick={openCollectionPreview} disabled={status === "loading" || previewLoading}>{previewLoading ? <><Loader2 size={15} className="spin" /> Loading preview...</> : status === "loading" ? <><Loader2 size={15} className="spin" /> {checkAddress ? "Checking..." : "Capturing..."}</> : <>{checkAddress ? "Check address" : "Run snapshot"} <Sparkles size={14} /></>}</button></div>
        {status === "error" && <div className="notice result-notice error-notice"><CircleAlert size={15} style={{ verticalAlign: "-3px", marginRight: 6 }} /> {error}</div>}
        {previewError && <div className="notice result-notice error-notice"><CircleAlert size={15} style={{ verticalAlign: "-3px", marginRight: 6 }} /> {previewError}</div>}
        {status === "done" && checkAddress && holdingResult && <div className={`notice result-notice ${holdingResult.holding ? "success-notice" : "error-notice"}`}><CheckCircle2 size={15} style={{ verticalAlign: "-3px", marginRight: 6 }} /> {holdingResult.holding ? `Yes — this address holds ${holdingResult.items.toLocaleString()} item${holdingResult.items === 1 ? "" : "s"}.` : "No — this address does not hold this collection."}</div>}
        {status === "done" && !checkAddress && <div className="notice result-notice success-notice"><CheckCircle2 size={15} style={{ verticalAlign: "-3px", marginRight: 6 }} /> Snapshot complete. Results are ready to review and export.</div>}
        <div className="metric-grid blueshot-metrics" style={{ marginTop: 34 }}><div className="metric"><span>UNIQUE HOLDERS</span><strong>{holders.length ? holders.length.toLocaleString() : "—"}</strong><small>Resolved addresses</small></div><div className="metric"><span>TOTAL ITEMS</span><strong>{holders.length ? totalItems.toLocaleString() : "—"}</strong><small>Across this collection</small></div><div className="metric"><span>CHAIN</span><strong style={{ fontSize: 24 }}>{chains[chain].short}</strong><small>{chains[chain].label}</small></div><div className="metric"><span>LAST RUN</span><strong style={{ fontSize: 24 }}>{lastRun ?? "—"}</strong><small>Local time</small></div></div>
        <div className="results-heading"><div><div className="eyebrow">OUTPUT</div><h3 style={{ fontSize: 22, marginTop: 5 }}>Holder results</h3><span className="hint">{holders.length ? `Latest snapshot · ${holders.length.toLocaleString()} addresses` : "Run a snapshot to populate this table."}</span></div><div className="results-tools">{holders.length > 0 && <><div className="field search-field"><Search size={14} /><input aria-label="Search holders" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search holders" /></div><button className="button secondary" onClick={csv}><Download size={14} /> CSV</button></>}</div></div>
        {holders.length > 0 && <><div className="table-wrap"><table className="data-table"><thead><tr><th>Holder address</th><th>NFT count</th><th>Status</th></tr></thead><tbody>{filtered.map(holder => <tr key={holder.address}><td className="mono">{holder.address}</td><td>{holder.items.toLocaleString()}</td><td><span className="pill-good">VERIFIED</span></td></tr>)}</tbody></table></div><div className="results-foot"><span className="hint"><Filter size={12} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Showing {filtered.length.toLocaleString()} of {holders.length.toLocaleString()} holders</span><span className="hint"><ArrowDownToLine size={12} style={{ verticalAlign: "-2px", marginRight: 5 }} /> CSV sorted by balance</span></div></>}
      </section>
    </div>
    {preview && <div className="collection-preview-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPreview(null); }}><section className="collection-preview-card" role="dialog" aria-modal="true" aria-labelledby="collection-preview-title"><button className="collection-preview-close" type="button" aria-label="Close collection preview" onClick={() => setPreview(null)}><X size={17} /></button><div className="collection-preview-media">{preview.imageUrl ? <img src={preview.imageUrl} alt={`${preview.name} collection artwork`} fetchPriority="high" /> : <div className="collection-preview-placeholder"><span>{preview.name.slice(0, 1).toUpperCase()}</span><small>BLUESHOT PREVIEW</small></div>}<div className="collection-preview-media-shade" /></div><div className="collection-preview-body"><div className="eyebrow">COLLECTION PREVIEW</div><h2 id="collection-preview-title">{preview.name}</h2>{preview.description ? <p>{preview.description}</p> : <p>{preview.message || "Review the collection before Blueshot resolves its holders."}</p>}<div className="collection-preview-meta"><span className="mono">{chains[chain].short} / {collection.trim().slice(0, 6)}...{collection.trim().slice(-4)}</span>{preview.configured && <span className="pill-good">OPENSEA INDEXED</span>}</div><div className="collection-preview-actions"><button className="button secondary" type="button" onClick={() => setPreview(null)}>Cancel</button><button className="button primary" type="button" onClick={() => { setPreview(null); void runSnapshot(); }}>Proceed to snapshot <ArrowRight size={14} /></button></div>{!preview.configured && <small className="collection-preview-note">Add <span className="mono">OPENSEA_API_KEY</span> in Admin or Vercel to enable richer collection previews.</small>}{preview.openseaUrl && <a className="collection-preview-link" href={preview.openseaUrl} target="_blank" rel="noreferrer">View collection on OpenSea <ArrowRight size={13} /></a>}</div></section></div>}
  </main>;
}
