import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, Github, LayoutDashboard, ArrowUpRight } from 'lucide-react';
export const metadata:Metadata={title:'OpenVenue — Spaces made simple',description:'A free, self-hosted venue booking and approval platform.',robots:{index:false,follow:false},icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>
    <header className="site-header"><div className="container header-content">
      <Link href="/" className="brand"><span className="brand-icon"><CalendarDays size={20} strokeWidth={2.3}/></span><span>OpenVenue<span className="brand-dot">.</span></span></Link>
      <nav className="main-nav"><Link href="/">Explore spaces</Link><Link href="/track">My request</Link><Link href="/admin" className="nav-admin"><LayoutDashboard size={15}/> Admin</Link></nav>
    </div></header>
    <main>{children}</main>
    <footer className="footer"><div className="container footer-inner"><div><strong>OpenVenue.</strong><span>Spaces made simple. Built for everyone.</span></div><div className="footer-actions"><span>Open-source · MIT License</span><a href="https://github.com/gbhysss" target="_blank" rel="noreferrer"><Github size={16}/> GitHub <ArrowUpRight size={14}/></a></div></div></footer>
  </body></html>;
}
