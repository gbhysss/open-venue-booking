'use client';
import { useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { ArrowRight,AlertCircle } from 'lucide-react';
export function LoginForm(){
 const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const data=new FormData(e.currentTarget);
  try{
   const res=await authClient.signIn.email({email:String(data.get('email')),password:String(data.get('password'))});
   if(res.error){setError('Incorrect email or password');return;}
   router.push('/admin');router.refresh();
  }catch{setError('Unable to connect. Please try again.')}finally{setBusy(false)}
 }
 return <form className="login-card" onSubmit={submit}><label className="field">Email<input type="email" name="email" required placeholder="admin@example.org" autoComplete="username"/></label><label className="field">Password<input type="password" name="password" required placeholder="Your password" autoComplete="current-password"/></label>{error&&<div className="error-box"><AlertCircle size={17}/>{error}</div>}<button className="btn btn-primary btn-full" disabled={busy} type="submit">{busy?'Signing in…':'Sign in'} <ArrowRight size={17}/></button><p className="login-note">New accounts can only be created by an authorized server operator.</p></form>;
}
