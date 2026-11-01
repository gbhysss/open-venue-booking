import Link from 'next/link';
import { ArrowRight, CalendarCheck2, ShieldCheck, Sparkles, Building2, Users2, MapPin, ArrowUpRight, Clock3 } from 'lucide-react';
import { db } from '@/db/client';
import { venues } from '@/db/schema';
import { eq,asc } from 'drizzle-orm';
export const dynamic='force-dynamic';
export default async function Home(){
  const items=await db.select().from(venues).where(eq(venues.enabled,true)).orderBy(asc(venues.name));
  return <>
   <section className="hero"><div className="container hero-grid"><div className="hero-copy">
     <div className="eyebrow"><span className="pulse"/> OPEN SOURCE. OPEN SPACES.</div>
     <h1>Good spaces.<br/><span>Great things happen.</span></h1>
     <p>Find a space that fits. Pick your time. Send a request in minutes. A beautifully simple way for communities to share places.</p>
     <div className="hero-actions"><a className="btn btn-primary" href="#spaces">Explore spaces <ArrowRight size={17}/></a><Link className="btn btn-ghost" href="/track">Track a request <ArrowUpRight size={16}/></Link></div>
     <div className="hero-footnote"><ShieldCheck size={17}/> No account required to book · Privacy-first by design</div>
   </div><div className="hero-visual" aria-hidden="true"><div className="shape shape-a"/><div className="shape shape-b"/><div className="visual-card"><div className="visual-top"><div className="mini-calendar"><CalendarCheck2 size={21}/></div><span>YOUR NEXT EVENT</span><span className="tiny-dot"/></div><div className="visual-heading">Make room for<br/>something good.</div><div className="visual-sub"><span className="fake-avatar">OV</span><div><strong>Space for everyone</strong><small>Meet · Create · Connect</small></div></div><div className="visual-bottom"><span><Clock3 size={15}/> Flexible time slots</span><span>✓ Simple approval</span></div></div><div className="decor-card"><Sparkles size={18}/> Seamless scheduling</div></div></div></section>
   <section className="feature-bar"><div className="container features"><div><CalendarCheck2/><span>Book in a few clicks</span></div><div><ShieldCheck/><span>Secure approval workflow</span></div><div><Users2/><span>Built for communities</span></div></div></section>
   <section id="spaces" className="spaces-section"><div className="container"><div className="section-heading"><div><div className="section-kicker">FIND YOUR PLACE</div><h2>Spaces worth gathering in<span className="accent-mark">.</span></h2><p>Choose a space below to see availability and submit a request.</p></div><span className="result-counter">{items.length} {items.length===1?'space':'spaces'} available</span></div>
     {items.length===0 ? <div className="empty"><Building2 size={34}/><h3>No spaces listed yet</h3><p>An administrator can add the first venue from the dashboard.</p><Link href="/admin" className="btn btn-secondary">Open dashboard <ArrowRight size={15}/></Link></div> : <div className="venue-grid">{items.map((v,i)=><Link href={`/venues/${v.id}`} className="venue-card" key={v.id}><div className={`venue-art art-${i%4}`}><div className="art-decoration"/><div className="venue-art-symbol"><Building2 size={44} strokeWidth={1.4}/></div><span className="art-pill">AVAILABLE TO BOOK</span></div><div className="venue-body"><div className="venue-title-row"><h3>{v.name}</h3><span className="round-arrow"><ArrowUpRight size={18}/></span></div><p>{v.description||'A flexible place for your next gathering.'}</p><div className="venue-meta"><span><MapPin size={15}/>{v.location||'Location on request'}</span><span><Users2 size={15}/> Up to {v.capacity}</span></div></div></Link>)}</div>}
   </div></section>
   <section className="bottom-cta"><div className="container cta-inner"><div><div className="section-kicker">A LITTLE MORE SPACE</div><h2>Shared spaces. Stronger communities.</h2><p>Organizing an event has enough moving parts. Booking the room shouldn’t be one of them.</p></div><Link href="/track" className="btn btn-light">Track your request <ArrowRight size={17}/></Link></div></section>
  </>;
}
