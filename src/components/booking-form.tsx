'use client';
import { useEffect,useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, CalendarDays, Clock3, Mail, AlertCircle, Copy } from 'lucide-react';
type Slot={startsAt:string;endsAt:string};
export function BookingForm({venueId,capacity,minDate,timeZone}:{venueId:string;capacity:number;minDate:string;timeZone:string}){
 const [date,setDate]=useState('');
 const [slotsError,setSlotsError]=useState(false);
 const [slots,setSlots]=useState<Slot[]>([]);
 const [loadingSlots,setLoadingSlots]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [tracking,setTracking]=useState('');
 const [copied,setCopied]=useState(false);
 useEffect(()=>{if(!date){setSlots([]);return;}let cancelled=false;setLoadingSlots(true);setSlotsError(false);fetch(`/api/availability?venueId=${encodeURIComponent(venueId)}&date=${date}`,{cache:'no-store'}).then(r=>r.json()).then(j=>{if(!cancelled)setSlots(j.data||[])}).catch(()=>{if(!cancelled){setSlots([]);setSlotsError(true)}}).finally(()=>{if(!cancelled)setLoadingSlots(false)});return()=>{cancelled=true}},[date,venueId]);
 const checkSlot=(start:string,end:string)=>slots.some(s=>start < s.endsAt.slice(0,5) && end > s.startsAt.slice(0,5));
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError('');
  const f=new FormData(e.currentTarget);
  const payload={venueId,bookingDate:String(f.get('bookingDate')),startsAt:String(f.get('startsAt')),endsAt:String(f.get('endsAt')),
   applicantName:String(f.get('applicantName')),applicantEmail:String(f.get('applicantEmail')),purpose:String(f.get('purpose')),
   attendees:Number(f.get('attendees')),website:String(f.get('website')||'')};
  if(checkSlot(payload.startsAt,payload.endsAt)){setError('This time slot is already booked. Please pick another.');setBusy(false);return;}
  try{const r=await fetch('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const j=await r.json();if(!r.ok)throw Error(j.error||'Please check your details');
   const url=`${window.location.origin}/track#token=${encodeURIComponent(j.data.token)}`;setTracking(url);
  }catch(err){setError(err instanceof Error?err.message:'Something went wrong');}finally{setBusy(false)}
 }
 if(tracking)return <div className="success-state"><div className="success-icon"><CheckCircle2 size={32}/></div><h2>Request submitted!</h2><p>Your request is pending approval. Save this private link to check its status. It is only shown once.</p><div className="tracking-field"><code>{tracking}</code><button type="button" onClick={async()=>{await navigator.clipboard.writeText(tracking);setCopied(true)}} aria-label="Copy tracking link"><Copy size={18}/></button></div><small>{copied?'Copied to clipboard':'Anyone with this link can view the request status. Keep it private.'}</small><Link href="/" className="btn btn-primary">Back to spaces <ArrowRight size={16}/></Link></div>;
 return <form onSubmit={submit} className="booking-form">
  <div className="field-row"><label className="field">Preferred date <input required type="date" name="bookingDate" value={date} min={minDate} onChange={e=>setDate(e.target.value)}/></label><label className="field">Attendees <input required type="number" name="attendees" min={1} max={capacity} defaultValue={1}/></label></div>
  <p className="timezone-hint">All booking times are in {timeZone}.</p>
  <div className="field-row"><label className="field">Start time <input required type="time" name="startsAt" defaultValue="09:00"/></label><label className="field">End time <input required type="time" name="endsAt" defaultValue="10:00"/></label></div>
  {date && <div className="availability-banner"><Clock3 size={16}/><div><strong>{loadingSlots?'Checking the calendar…':slotsError?'Availability temporarily unavailable':slots.length?`${slots.length} confirmed booking(s) on this date`:'No confirmed bookings on this date'}</strong><span>{slotsError?'Booking requests can still be submitted; final approval prevents conflicts.':slots.length?`Busy: ${slots.map(s=>`${s.startsAt.slice(0,5)}–${s.endsAt.slice(0,5)}`).join(' · ')}`:'Choose a time that works for you.'}</span></div></div>}
  <div className="form-divider"><span>CONTACT DETAILS</span></div>
  <div className="field-row"><label className="field">Your name <input required type="text" name="applicantName" maxLength={80} minLength={2} placeholder="Full name" autoComplete="name"/></label><label className="field">Email address <input required type="email" name="applicantEmail" maxLength={180} placeholder="you@example.com" autoComplete="email"/></label></div>
  <label className="field">What are you organizing? <textarea required name="purpose" minLength={3} maxLength={500} rows={4} placeholder="Briefly describe your event or activity..."/></label>
  <div className="honeypot" aria-hidden="true"><label>Website <input name="website" tabIndex={-1} autoComplete="off"/></label></div>
  {error&&<div className="error-box"><AlertCircle size={17}/>{error}</div>}
  <button type="submit" disabled={busy} className="btn btn-primary btn-full">{busy?'Submitting…':'Submit booking request'} <ArrowRight size={18}/></button>
  <div className="form-help"><Mail size={15}/> No account needed. Save the private link shown after submission.</div>
 </form>;
}
