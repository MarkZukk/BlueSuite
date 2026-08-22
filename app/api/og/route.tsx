import { ImageResponse } from "next/og";

export const runtime = "edge";

const sections: Record<string, { kicker: string; title: string; detail: string; accent: string }> = {
  home: { kicker: "BLUEVALLEY LABS / BLUESUITE 01", title: "Tools for the blockchain.", detail: "Purpose-built software for people operating on-chain.", accent: "Every workflow, one surface." },
  blueshot: { kicker: "BLUESHOT / SNAPSHOT INFRASTRUCTURE", title: "Snapshot ownership.\nKeep moving.", detail: "Resolve holders, review the result, and export cleanly.", accent: "Fast, read-only chain lookups." },
  foundersbot: { kicker: "FOUNDERSBOT / PRIVATE DAO TOOLING", title: "A private operating layer.", detail: "The focused workspace for BlueValleyDAO.", accent: "Built for the people doing the work." },
  bluehelper: { kicker: "BLUEHELPER / BATCH OPERATIONS", title: "The heavy lifting,\nhandled in batches.", detail: "Move allocations and consolidate on-chain work.", accent: "Coming soon from BlueValley Labs." },
  admin: { kicker: "BLUESUITE / CONTROL CENTER", title: "Operate with\nclarity.", detail: "A calm command surface for blockchain workflows.", accent: "Secure operator access." },
};

function toDataUrl(bytes: ArrayBuffer) {
  const values = new Uint8Array(bytes);
  let binary = "";
  for (let index = 0; index < values.length; index += 1) binary += String.fromCharCode(values[index]);
  return `data:image/jpeg;base64,${btoa(binary)}`;
}

export async function GET(request: Request) {
  const section = new URL(request.url).searchParams.get("section") || "home";
  const content = sections[section] || sections.home;
  let logo = "";
  try {
    const response = await fetch(new URL("/bluevalleydao.jpg", request.url));
    if (response.ok) logo = toDataUrl(await response.arrayBuffer());
  } catch { /* The text mark remains a useful fallback for preview crawlers. */ }

  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", color: "#f5f8ff", background: "#05070d", fontFamily: "Arial" }}>
    <div style={{ position: "absolute", inset: 0, display: "flex", background: "radial-gradient(circle at 90% 10%, #2438ff 0, #0b123d 28%, transparent 58%), radial-gradient(circle at 12% 100%, #0d5a72 0, transparent 42%)", opacity: 0.9 }} />
    <div style={{ position: "absolute", right: -160, top: -190, width: 650, height: 650, display: "flex", border: "1px solid rgba(120,233,223,.28)", borderRadius: 999, boxShadow: "0 0 0 70px rgba(99,112,255,.08), 0 0 0 140px rgba(99,112,255,.04)" }} />
    <div style={{ position: "absolute", left: 72, top: 68, width: 9, height: 9, display: "flex", borderRadius: 99, background: "#78e9df", boxShadow: "0 0 0 9px rgba(120,233,223,.12)" }} />
    <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", padding: "68px 78px 58px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}><div style={{ display: "flex", width: 112, height: 112, borderRadius: 30, overflow: "hidden", border: "2px solid rgba(120,233,223,.6)", boxShadow: "0 14px 35px rgba(0,0,0,.3)" }}>{logo ? <img src={logo} width="112" height="112" /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "#78e9df", fontSize: 58, fontWeight: 700 }}>B</div>}</div><div style={{ display: "flex", flexDirection: "column", gap: 8 }}><div style={{ display: "flex", color: "#78e9df", fontSize: 17, letterSpacing: 3 }}>{content.kicker}</div><div style={{ display: "flex", color: "rgba(245,248,255,.64)", fontSize: 18 }}>BLUESUITE / BLUEVALLEY LABS</div></div></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 850 }}><div style={{ display: "flex", whiteSpace: "pre-line", fontSize: 68, lineHeight: 1.02, fontWeight: 700, letterSpacing: -2 }}>{content.title}</div><div style={{ display: "flex", color: "#aab6cb", fontSize: 25 }}>{content.detail}</div></div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#78e9df", fontSize: 17, letterSpacing: 1 }}><span>{content.accent}</span><span style={{ color: "rgba(245,248,255,.45)" }}>bluevalleylabs.xyz ↗</span></div>
    </div>
  </div>, { width: 1200, height: 630 });
}
