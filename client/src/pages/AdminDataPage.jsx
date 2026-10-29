import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FileText, RefreshCw, TrendingUp, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../components/admin/AdminLayout';
import { getAllBids, getAllInvoices, getAllTransactions, getAllUsers, getRiskAlerts } from '../api/adminApi';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const date = (value) => value ? new Date(value).toLocaleDateString('en-IN') : '—';
const statusClass = (value) => {
    const status = String(value || '').toUpperCase();
    if (['VERIFIED', 'COMPLETED', 'ACTIVE', 'SETTLED'].includes(status)) return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
    if (['REJECTED', 'FAILED', 'DEFAULTED', 'HIGH'].includes(status)) return 'border-rose-500/20 bg-rose-500/10 text-rose-400';
    return 'border-amber-500/20 bg-amber-500/10 text-amber-400';
};

const configs = {
    users: { title: 'Users', description: 'View registered MSMEs, lenders, and administrators.', icon: Users, fetcher: getAllUsers },
    invoices: { title: 'Invoices', description: 'Monitor invoices uploaded to the platform.', icon: FileText, fetcher: getAllInvoices },
    bids: { title: 'Bids & Funding', description: 'Review lender bids and funding interest across invoices.', icon: TrendingUp, fetcher: getAllBids },
    transactions: { title: 'Transactions', description: 'Track funding and repayment transaction activity.', icon: TrendingUp, fetcher: getAllTransactions },
    alerts: { title: 'Risk & Fraud', description: 'Review fraud flags and risk signals raised by the platform.', icon: AlertTriangle, fetcher: getRiskAlerts },
};

const AdminDataPage = ({ type }) => {
    const config = configs[type] || configs.users;
    const Icon = config.icon;
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await config.fetcher();
            setRows(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            toast.error(typeof error === 'string' ? error : `Failed to load ${config.title.toLowerCase()}`);
        } finally { setLoading(false); }
    }, [config]);

    useEffect(() => { load(); }, [load]);

    const filteredRows = useMemo(() => {
        const value = query.trim().toLowerCase();
        if (!value) return rows;
        return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(value));
    }, [query, rows]);

    const renderCells = (row) => {
        if (type === 'users') return <>
            <td>{row.name}</td><td>{row.email}</td><td><span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs text-blue-400">{row.role}</span></td>
            <td><span className={`rounded-full border px-2 py-1 text-xs ${statusClass(row.kycStatus)}`}>{row.kycStatus?.replace('_', ' ')}</span></td><td>{date(row.created_at)}</td>
        </>;
        if (type === 'invoices') return <>
            <td className="font-medium">{row.invoice_number || row.id.slice(0, 8)}</td><td>{row.user?.name || '—'}</td><td>{money(row.amount)}</td>
            <td><span className={`rounded-full border px-2 py-1 text-xs ${statusClass(row.status)}`}>{row.status}</span></td><td>{date(row.due_date)}</td>
        </>;
        if (type === 'bids') return <>
            <td>{row.invoice?.invoice_number || row.invoice_id.slice(0, 8)}</td><td>{row.lender?.name || '—'}</td><td>{money(row.invoice?.amount)}</td>
            <td>{row.interest_rate}%</td><td>{date(row.created_at)}</td>
        </>;
        if (type === 'transactions') return <>
            <td className="font-mono text-xs">{row.id.slice(0, 12)}</td><td>{row.invoice?.invoice_number || '—'}</td><td>{money(row.funded_amount)}</td>
            <td><span className={`rounded-full border px-2 py-1 text-xs ${statusClass(row.status)}`}>{row.status}</span></td><td>{date(row.created_at)}</td>
        </>;
        return <>
            <td>{row.invoice?.invoice_number || 'Account alert'}</td><td>{row.user?.name || '—'}</td><td>{row.reason}</td><td>{row.riskScore}</td><td>{date(row.createdAt)}</td>
        </>;
    };

    const headers = type === 'users' ? ['Name', 'Email', 'Role', 'KYC status', 'Joined']
        : type === 'invoices' ? ['Invoice', 'MSME', 'Amount', 'Status', 'Due date']
            : type === 'bids' ? ['Invoice', 'Lender', 'Invoice amount', 'Interest', 'Created']
                : type === 'transactions' ? ['Transaction', 'Invoice', 'Funded amount', 'Status', 'Created']
                    : ['Invoice', 'User', 'Reason', 'Risk score', 'Created'];

    return <AdminLayout title={config.title}>
        <section className="rounded-2xl border border-theme-border bg-theme-surface shadow-xl">
            <div className="flex flex-col gap-4 border-b border-theme-border p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/10 text-blue-400"><Icon size={20} /></div><div><h2 className="text-xl font-bold text-theme-text">{config.title}</h2><p className="text-sm text-theme-text-muted">{config.description}</p></div></div>
                <div className="flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}...`} className="w-full rounded-lg border border-theme-border bg-theme-bg px-3 py-2 text-sm text-theme-text outline-none focus:border-blue-500 sm:w-56" /><button onClick={load} className="rounded-lg border border-theme-border p-2 text-theme-text-muted hover:text-theme-text" title="Refresh"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /></button></div>
            </div>
            <div className="overflow-x-auto">
                <table className="admin-table min-w-[720px]"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>
                    {loading ? <tr><td colSpan={headers.length} className="py-12 text-center text-theme-text-muted">Loading {config.title.toLowerCase()}...</td></tr>
                        : filteredRows.length === 0 ? <tr><td colSpan={headers.length} className="py-12 text-center text-theme-text-muted">No records found.</td></tr>
                            : filteredRows.map((row) => <tr key={row.id}>{renderCells(row)}</tr>)}
                </tbody></table>
            </div>
        </section>
    </AdminLayout>;
};

export default AdminDataPage;
