import { Settings, ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import { useAuth } from '../context/AuthContext';

const AdminSettingsPage = () => {
    const { user } = useAuth();
    return <AdminLayout title="Settings">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-theme-border bg-theme-surface shadow-xl p-6">
                <div className="mb-6 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/10 text-blue-400"><UserRound size={20} /></div><div><h2 className="text-lg font-bold text-theme-text">Administrator profile</h2><p className="text-sm text-theme-text-muted">Current account details</p></div></div>
                <dl className="space-y-4 text-sm"><div><dt className="text-theme-text-muted">Name</dt><dd className="mt-1 font-medium text-theme-text">{user?.name || '—'}</dd></div><div><dt className="text-theme-text-muted">Email</dt><dd className="mt-1 font-medium text-theme-text">{user?.email || '—'}</dd></div><div><dt className="text-theme-text-muted">Role</dt><dd className="mt-1 font-medium text-theme-text">{user?.role || 'ADMIN'}</dd></div></dl>
            </section>
            <section className="rounded-2xl border border-theme-border bg-theme-surface shadow-xl p-6">
                <div className="mb-6 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400"><ShieldCheck size={20} /></div><div><h2 className="text-lg font-bold text-theme-text">Platform controls</h2><p className="text-sm text-theme-text-muted">Manage feature availability and governance.</p></div></div>
                <Link to="/system-control" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"><Settings size={16} /> Open system control</Link>
            </section>
        </div>
    </AdminLayout>;
};

export default AdminSettingsPage;
