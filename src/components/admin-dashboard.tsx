'use client';
import { useCallback,useEffect,useRef,useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import {LayoutDashboard,Building2,ClipboardList,Clock3,Check, X, Plus,RefreshCw,LogOut,Users,MapPin,ChevronRight,AlertCircle } from 'lucide-react';
type Venue={id:string;name:string;description:string;location:string;capacity:number;enabled:boolean};
type Reservation={id:string;venueName:string;bookingDate:string;startsAt:string;endsAt:string;applicantName:string;applicantEmail:string;purpose:string;attendees:number;status:string;decisionNote:string|null;createdAt:string};
export function AdminDashboard({adminName}:{adminName:string}){
 const router=useRouter();
 const [venues,setVenues]=useState<Venue[]>([]);const [bookings,setBookings]=useState<Reservation[]>([]);
 const [tab,setTab]=useState<'bookings'|'venues'>('bookings');const [filter,setFilter]=useState('pending');
 const [newVenue,setNewVenue]=useState(false);const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [error,setError]=useState('');
 const [noteById,setNoteById]=useState<Record<string,string>>({});
 const [page,setPage]=useState(1);
 const [counts,setCounts]=useState({pending:0,approved:0,rejected:0,all:0});
 const [pagination,setPagination]=useState({page:1,pageCount:1,pageSize:25,total:0});
 const requestId=useRef(0);
 const refresh=useCallback(async()=>{
  const generation=++requestId.current;setLoading(true);setError('');
  try{
   const query=new URLSearchParams({status:filter,page:String(page),pageSize:'25'});
   const [r1,r2]=await Promise.all([fetch('/api/admin/venues',{cache:'no-store'}),fetch(`/api/admin/reservations?${query}`,{cache:'no-store'})]);
   if(generation!==requestId.current)return;
   if(r1.status===401||r2.status===401){router.push('/login');return;}
   if(!r1.ok||!r2.ok)throw Error('Unable to load data');
   const [v,b]=await Promise.all([r1.json(),r2.json()]);
   if(generation!==requestId.current)return;
   setVenues(v.data);setBookings(b.data);setCounts(b.counts);setPagination(b.pagination);
   setPage(b.pagination.page);
  }catch(e){if(generation===requestId.current)setError(e instanceof Error?e.message:'Unable to load data')}
  finally{if(generation===requestId.current)setLoading(false)}
 },[router,filter,page]);
 useEffect(()=>{void refresh();return()=>{requestId.current++}},[refresh]);
 async function decide(id:string,status:'approved'|'rejected'){
  if(!confirm(status==='approved'?'Approve this booking?':'Reject this booking?'))return;
  setSaving(true);setError('');try{const r=await fetch(`/api/admin/reservations/${id}/decision`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status,decisionNote:noteById[id]||''})});const j=await r.json();if(!r.ok)throw Error(j.error||'Unable to process request');await refresh();}catch(e){setError(e instanceof Error?e.message:'Unable to process request')}finally{setSaving(false)}
 }
 async function addVenue(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);setError('');const f=new FormData(e.currentTarget);
  const payload={name:String(f.get('name')),description:String(f.get('description')),location:String(f.get('location')),capacity:Number(f.get('capacity')),enabled:true};
  try{const r=await fetch('/api/admin/venues',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const j=await r.json();if(!r.ok)throw Error(j.error||'Unable to add space');setNewVenue(false);await refresh();}catch(e){setError(e instanceof Error?e.message:'Unable to add space')}finally{setSaving(false)}
 }
 async function toggleVenue(venue:Venue){setSaving(true);setError('');try{const r=await fetch(`/api/admin/venues/${venue.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:!venue.enabled})});if(!r.ok)throw Error('Failed to update space');await refresh()}catch(e){setError(e instanceof Error?e.message:'Failed to update space')}finally{setSaving(false)}}
 const pending=counts.pending;const approved=counts.approved;const visible=bookings;
 return <div className="dashboard"><div className="container dashboard-layout"><aside className="dash-sidebar"><div className="dash-sidebar-title"><span className="side-badge"><LayoutDashboard size={20}/></span><div><strong>Workspace</strong><small>Admin console</small></div></div><button className={`side-link ${tab==='bookings'?'active':''}`} onClick={()=>setTab('bookings')}><ClipboardList size={18}/> Booking requests <ChevronRight size={15}/></button><button className={`side-link ${tab==='venues'?'active':''}`} onClick={()=>setTab('venues')}><Building2 size={18}/> Manage spaces <ChevronRight size={15}/></button><div className="sidebar-bottom"><span className="sidebar-avatar">{adminName.slice(0,1).toUpperCase()}</span><div><strong>{adminName}</strong><small>Administrator</small></div><button title="Sign out" onClick={async()=>{await authClient.signOut();router.push('/login');router.refresh()}}><LogOut size={17}/></button></div></aside><div className="dash-main"><div className="dash-heading"><div><div className="section-kicker">OVERVIEW</div><h1>{tab==='bookings'?'Booking requests':'Your spaces'}</h1><p>Keep your shared spaces running smoothly.</p></div><button className="btn btn-secondary" onClick={()=>void refresh()} disabled={loading||saving}><RefreshCw size={16}/> Refresh</button></div>
 <div className="stats-grid"><div className="stat-card"><div className="stat-top"><span>Pending requests</span><Clock3 size={18}/></div><strong>{pending}</strong><small>Waiting for review</small></div><div className="stat-card"><div className="stat-top"><span>Approved bookings</span><Check size={18}/></div><strong>{approved}</strong><small>Across your spaces</small></div><div className="stat-card"><div className="stat-top"><span>Active spaces</span><Building2 size={18}/></div><strong>{venues.filter(x=>x.enabled).length}</strong><small>Available to request</small></div></div>
 {error&&<div role="alert" className="error-box"><AlertCircle size={17}/>{error}</div>}
 {tab==='bookings'?<div className="panel card-panel"><div className="panel-top"><div><h2>Requests</h2><p>Review and manage upcoming reservations.</p></div><div className="tab-filter">{['pending','approved','rejected','all'].map(s=><button key={s} className={filter===s?'selected':''} disabled={saving} aria-pressed={filter===s} onClick={()=>{setFilter(s);setPage(1)}}>{s}</button>)}</div></div>
 {loading?<div className="empty-inline">Loading requests…</div>:visible.length===0?<div className="empty-inline"><ClipboardList size={28}/><strong>No requests here</strong><span>Requests will appear as they come in.</span></div>:<div className="request-list">{visible.map(b=><article className="request-row" key={b.id}><div className="request-main"><div className="request-topline"><span className={`status-pill ${b.status}`}>{b.status}</span><span className="request-venue">{b.venueName}</span></div><h3>{b.purpose}</h3><div className="request-details"><span><Clock3 size={15}/>{b.bookingDate} · {b.startsAt.slice(0,5)}–{b.endsAt.slice(0,5)}</span><span><Users size={15}/>{b.attendees} attendees</span><span><span className="person-dot"/>{b.applicantName} · {b.applicantEmail}</span></div>{b.status==='pending'?<div className="approve-controls"><input aria-label={`Note for ${b.applicantName}`} placeholder="Decision note (optional)" maxLength={500} value={noteById[b.id]||''} onChange={e=>setNoteById(prev=>({...prev,[b.id]:e.target.value}))}/><button className="btn btn-outline-success" disabled={saving} onClick={()=>void decide(b.id,'approved')}><Check size={15}/> Approve</button><button className="btn btn-outline-danger" disabled={saving} onClick={()=>void decide(b.id,'rejected')}><X size={15}/> Reject</button></div>:b.decisionNote?<p className="row-note">Note: {b.decisionNote}</p>:null}</div></article>)}</div>}
 <nav className="reservation-pagination" aria-label="Booking request pages" aria-busy={loading}>
  <span role="status">{pagination.total} requests · Page {pagination.page} of {pagination.pageCount}</span>
  <div><button className="btn btn-secondary btn-small" disabled={loading||saving||pagination.page<=1} onClick={()=>setPage(pagination.page-1)}>Previous</button>
  <button className="btn btn-secondary btn-small" disabled={loading||saving||pagination.page>=pagination.pageCount} onClick={()=>setPage(pagination.page+1)}>Next</button></div>
 </nav></div>
 :<div className="panel card-panel"><div className="panel-top"><div><h2>Manage spaces</h2><p>Add spaces or pause booking availability.</p></div><button className="btn btn-primary" onClick={()=>setNewVenue(v=>!v)}><Plus size={17}/> Add a space</button></div>
 {newVenue&&<form onSubmit={addVenue} className="add-venue-form"><div className="field-row"><label className="field">Space name<input required minLength={2} maxLength={80} name="name" placeholder="Community meeting room"/></label><label className="field">Capacity<input required type="number" min={1} max={20000} defaultValue={30} name="capacity"/></label></div><label className="field">Location<input maxLength={160} name="location" placeholder="Building A, 2F"/></label><label className="field">Description<textarea maxLength={1000} rows={3} name="description" placeholder="Describe the space…"/></label><div className="form-end"><button className="btn btn-secondary" type="button" onClick={()=>setNewVenue(false)}>Cancel</button><button className="btn btn-primary" disabled={saving} type="submit">Create space <Check size={16}/></button></div></form>}
 <div className="space-admin-list">{venues.map(v=><div key={v.id} className="space-admin-row"><span className="space-icon"><Building2 size={22}/></span><div className="space-admin-info"><strong>{v.name}</strong><span><MapPin size={13}/>{v.location||'No location'} · {v.capacity} seats</span></div><span className={`status-pill ${v.enabled?'approved':'rejected'}`}>{v.enabled?'Active':'Paused'}</span><button className="btn btn-secondary btn-small" disabled={saving} onClick={()=>void toggleVenue(v)}>{v.enabled?'Pause':'Enable'}</button></div>)}{!venues.length&&<div className="empty-inline">No spaces yet. Add your first one.</div>}</div></div>}
 </div></div></div>;
}
