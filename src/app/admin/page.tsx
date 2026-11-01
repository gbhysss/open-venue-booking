import { redirect } from 'next/navigation';
import { currentAdmin } from '@/lib/admin';
import { AdminDashboard } from '@/components/admin-dashboard';
export const dynamic='force-dynamic';
export default async function AdminPage(){
 const admin=await currentAdmin();
 if(!admin) redirect('/login');
 return <AdminDashboard adminName={admin.user.name}/>;
}
