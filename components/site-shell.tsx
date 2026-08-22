"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";

function Brand() {
  return <span className="brand"><span className="brand-mark"><img src="/bluevalleydao.jpg" alt="" /></span><span>Bluesuite</span></span>;
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(true);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("bluesuite-theme");
    if (saved) setDark(saved === "dark");
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("bluesuite-theme", dark ? "dark" : "light");
  }, [dark]);
  const closeMenu = () => setMenu(false);
  return <>
    <header className="topbar">
      <Link className="brand-link" href="/"><Brand /></Link>
      <nav className={menu ? "nav open" : "nav"}>
        <Link href="/#suite" onClick={closeMenu}>Suite</Link>
        <Link href="/blueshot" onClick={closeMenu}>Blueshot</Link>
        <Link href="/foundersbot" onClick={closeMenu}>FoundersBot</Link>
        <Link href="/bluehelper" onClick={closeMenu}>BlueHelper <span className="nav-badge">Soon</span></Link>
        <Link href="/#about" onClick={closeMenu}>About</Link>
      </nav>
      <div className="top-actions"><button className="icon-button" aria-label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button><Link className="admin-link" href="/admin">Admin <ArrowUpRight size={14} /></Link><button className="menu-button" aria-label={menu ? "Close menu" : "Open menu"} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button></div>
    </header>
    {children}
    <footer className="footer"><div><Brand /><p className="muted">Building tools for the blockchain.</p></div><div className="footer-links"><Link href="https://x.com/bluevalleylabs">BLUEVALLEY LABS ↗</Link><Link href="https://x.com/theweb3proxy">Proxy ↗</Link><span>© 2026 BlueValley Labs</span></div></footer>
  </>;
}
