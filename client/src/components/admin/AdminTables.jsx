import { useState } from 'react';
import { Users, FileText, ArrowLeftRight } from 'lucide-react';

const AdminTables = () => {
    const [activeTab, setActiveTab] = useState('users');

    // Dummy Data
    const users = [
        { id: 1, name: 'Rajesh Kumar', email: 'rajesh@techstart.com', role: 'MSME', status: 'Active', joinDate: '2024-01-15' },
        { id: 2, name: 'Priya Sharma', email: 'priya@capital.com', role: 'LENDER', status: 'Active', joinDate: '2024-02-01' },
        { id: 3, name: 'Amit Patel', email: 'amit@solutions.com', role: 'MSME', status: 'Inactive', joinDate: '2024-01-20' },
        { id: 4, name: 'Neha Singh', email: 'neha@ventures.com', role: 'LENDER', status: 'Active', joinDate: '2024-02-05' },
        { id: 5, name: 'Vikram Gupta', email: 'vikram@enterprises.com', role: 'MSME', status: 'Active', joinDate: '2024-02-10' },
    ];

    const invoices = [
        { id: 1, invoiceNo: 'INV-2024-001', msme: 'TechStart Solutions', amount: '₹5,50,000', status: 'Approved', dueDate: '2024-03-15' },
        { id: 2, invoiceNo: 'INV-2024-002', msme: 'Digital Innovations', amount: '₹8,75,000', status: 'Pending', dueDate: '2024-03-20' },
        { id: 3, invoiceNo: 'INV-2024-003', msme: 'Creative Services', amount: '₹3,25,000', status: 'Flagged', dueDate: '2024-03-10' },
        { id: 4, invoiceNo: 'INV-2024-004', msme: 'Finance Corp', amount: '₹12,50,000', status: 'Approved', dueDate: '2024-03-25' },
        { id: 5, invoiceNo: 'INV-2024-005', msme: 'Business Solutions', amount: '₹6,75,000', status: 'Pending', dueDate: '2024-04-01' },
    ];

    const transactions = [
        { id: 1, txnId: 'TXN-2024-156', from: 'Capital Ventures', to: 'TechStart Solutions', amount: '₹5,00,000', status: 'Completed', date: '2024-02-12' },
        { id: 2, txnId: 'TXN-2024-157', from: 'Prime Investments', to: 'Digital Innovations', amount: '₹3,50,000', status: 'Completed', date: '2024-02-11' },
        { id: 3, txnId: 'TXN-2024-158', from: 'Global Finance', to: 'Creative Services', amount: '₹2,10,000', status: 'Processing', date: '2024-02-10' },
        { id: 4, txnId: 'TXN-2024-159', from: 'Capital Ventures', to: 'Finance Corp', amount: '₹7,50,000', status: 'Completed', date: '2024-02-09' },
        { id: 5, txnId: 'TXN-2024-160', from: 'Prime Investments', to: 'Business Solutions', amount: '₹4,25,000', status: 'Failed', date: '2024-02-08' },
    ];

    const getStatusBadge = (status) => {
        const s = String(status).toLowerCase();
        if (['active', 'approved', 'completed'].includes(s)) {
            return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
        }
        if (['pending', 'processing'].includes(s)) {
            return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
        }
        if (['flagged', 'failed'].includes(s)) {
            return 'bg-rose-500/10 text-rose-400 border border-rose-500/25';
        }
        return 'bg-slate-700/30 text-slate-400 border border-slate-700/50';
    };

    const getRoleBadge = (role) => {
        const r = String(role).toUpperCase();
        if (r === 'MSME') return 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
        if (r === 'LENDER') return 'bg-violet-500/10 text-violet-400 border border-violet-500/25';
        return 'bg-slate-700/30 text-slate-400 border border-slate-700/50';
    };

    return (
        <div className="tables-section rounded-2xl border border-theme-border bg-theme-surface backdrop-blur-md p-6 shadow-xl">
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-theme-border mb-6">
                <div>
                    <h3 className="text-base font-bold text-theme-text tracking-wide">Recent Activity Log</h3>
                    <p className="text-xs text-theme-text-muted">Quick audit snapshot across system entities</p>
                </div>
                <div className="table-tabs inline-flex items-center gap-1.5 p-1 rounded-xl bg-theme-bg border border-theme-border">
                    <button
                        className={`tab flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === 'users'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-hover'
                        }`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users size={14} />
                        Recent Users
                    </button>
                    <button
                        className={`tab flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === 'invoices'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-hover'
                        }`}
                        onClick={() => setActiveTab('invoices')}
                    >
                        <FileText size={14} />
                        Recent Invoices
                    </button>
                    <button
                        className={`tab flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === 'transactions'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-hover'
                        }`}
                        onClick={() => setActiveTab('transactions')}
                    >
                        <ArrowLeftRight size={14} />
                        Recent Transactions
                    </button>
                </div>
            </div>

            {/* Users Table */}
            {activeTab === 'users' && (
                <div className="table-wrapper overflow-x-auto rounded-xl border border-theme-border">
                    <table className="admin-table w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-theme-surface-hover/80 text-theme-text-muted text-xs uppercase tracking-wider font-semibold border-b border-theme-border">
                                <th className="px-5 py-3">Name</th>
                                <th className="px-5 py-3">Email</th>
                                <th className="px-5 py-3">Role</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3 text-right">Join Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-border text-sm">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-theme-surface-hover/40 transition-colors">
                                    <td className="px-5 py-3.5 font-medium text-theme-text">{user.name}</td>
                                    <td className="px-5 py-3.5 text-theme-text-muted font-mono text-xs">{user.email}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right text-xs text-theme-text-muted font-mono">{user.joinDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Invoices Table */}
            {activeTab === 'invoices' && (
                <div className="table-wrapper overflow-x-auto rounded-xl border border-theme-border">
                    <table className="admin-table w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-theme-surface-hover/80 text-theme-text-muted text-xs uppercase tracking-wider font-semibold border-b border-theme-border">
                                <th className="px-5 py-3">Invoice No</th>
                                <th className="px-5 py-3">MSME</th>
                                <th className="px-5 py-3">Amount</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3 text-right">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-border text-sm">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-theme-surface-hover/40 transition-colors">
                                    <td className="px-5 py-3.5 font-mono text-xs text-blue-500 font-semibold">{invoice.invoiceNo}</td>
                                    <td className="px-5 py-3.5 font-medium text-theme-text">{invoice.msme}</td>
                                    <td className="px-5 py-3.5 font-semibold text-theme-text">{invoice.amount}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(invoice.status)}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right text-xs text-theme-text-muted font-mono">{invoice.dueDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Transactions Table */}
            {activeTab === 'transactions' && (
                <div className="table-wrapper overflow-x-auto rounded-xl border border-theme-border">
                    <table className="admin-table w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-theme-surface-hover/80 text-theme-text-muted text-xs uppercase tracking-wider font-semibold border-b border-theme-border">
                                <th className="px-5 py-3">Transaction ID</th>
                                <th className="px-5 py-3">From</th>
                                <th className="px-5 py-3">To</th>
                                <th className="px-5 py-3">Amount</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-border text-sm">
                            {transactions.map((txn) => (
                                <tr key={txn.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-3.5 font-mono text-xs text-violet-400 font-semibold">{txn.txnId}</td>
                                    <td className="px-5 py-3.5 text-white/80">{txn.from}</td>
                                    <td className="px-5 py-3.5 text-white/80">{txn.to}</td>
                                    <td className="px-5 py-3.5 font-semibold text-white/90">{txn.amount}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(txn.status)}`}>
                                            {txn.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right text-xs text-white/40 font-mono">{txn.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminTables;
