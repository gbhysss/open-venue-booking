import { LoginForm } from '@/components/login-form';
import { ShieldCheck } from 'lucide-react';
export default function LoginPage(){
 return <div className="simple-page"><div className="container narrow"><div className="login-icon"><ShieldCheck size={27}/></div><div className="section-kicker">STAFF PORTAL</div><h1>Welcome back</h1><p>Sign in to manage spaces and booking requests.</p><LoginForm/></div></div>;
}
