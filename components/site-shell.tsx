"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(true);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("bluesuite-theme");
    if (saved) setDark(saved === "dark");
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; localStorage.setItem("bluesuite-theme", dark ? "dark" : "light"); }, [dark]);
  return <>
    <header className="topbar">
      <Link className="brand" href="/"><span className="brand-mark">B</span><span>Bluesuite</span></Link>
      <nav className={menu ? "nav open" : "nav"}>
        <Link href="/#suite" onClick={() => setMenu(false)}>Suite</Link>
        <Link href="/blueshot" onClick={() => setMenu(false)}>Blueshot</Link>
        <Link href="/foundersbot" onClick={() => setMenu(false)}>FoundersBot</Link>
        <Link href="/bluehelper" onClick={() => setMenu(false)}>BlueHelper <span className="nav-badge">Soon</span></Link>
        <Link href="/#about" onClick={() => setMenu(false)}>About</Link>
      </nav>
      <div className="top-actions"><button className="icon-button" aria-label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={16}/> : <Moon size={16}/>}</button><Link className="admin-link" href="/admin">Admin <ArrowUpRight size={14}/></Link><button className="menu-button" aria-label="Menu" onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button></div>
    </header>
    {children}
    <footer className="footer"><div><div className="brand"><span className="brand-mark">B</span><span>Bluesuite</span></div><p className="muted">Building tools for the blockchain.</p></div><div className="footer-links"><Link href="https://x.com/bluevalleylabs">BLUEVALLEY LABS ↗</Link><Link href="https://x.com/theweb3proxy">Proxy ↗</Link><span>© 2026 BlueValley Labs</span></div></footer>
  </>;
}
