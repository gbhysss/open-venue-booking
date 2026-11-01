import { db } from '@/db/client';
import { venues } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { BookingForm } from '@/components/booking-form';
import { todayInZone } from '@/lib/validation';
import Link from 'next/link';
import {ArrowLeft,MapPin,Users2,ShieldCheck} from 'lucide-react';
export const dynamic='force-dynamic';
export default async function VenuePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
 const [venue]=await db.select().from(venues).where(eq(venues.id,id)).limit(1);
 if(!venue||!venue.enabled) notFound();
 return <div className="booking-page"><div className="container"><Link href="/" className="back-link"><ArrowLeft size={16}/> Back to spaces</Link><div className="booking-layout"><aside className="booking-aside"><div className="booking-aside-visual"><div className="circle-icon"><MapPin size={29}/></div><span>SPACE DETAILS</span></div><div className="aside-content"><div className="section-kicker">YOUR SPACE</div><h1>{venue.name}</h1><p>{venue.description||'A great space for your next gathering.'}</p><div className="aside-attribute"><MapPin size={18}/><span>{venue.location||'Location available from the organizer'}</span></div><div className="aside-attribute"><Users2 size={18}/><span>Seats up to {venue.capacity} people</span></div><div className="aside-privacy"><ShieldCheck size={18}/><span>Only the administrator can see your submitted contact details.</span></div></div></aside><section className="booking-panel"><div className="panel-heading"><div className="section-kicker">BOOK A SPACE</div><h2>Tell us about your plans</h2><p>Submit the details and the space coordinator will review your request.</p></div><BookingForm venueId={venue.id} capacity={venue.capacity} minDate={todayInZone(process.env.APP_TIME_ZONE || 'Asia/Shanghai')} timeZone={process.env.APP_TIME_ZONE || 'Asia/Shanghai'}/></section></div></div></div>;
}
