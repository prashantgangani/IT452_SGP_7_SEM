import { useEffect, useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ArrowDownRight, ArrowUpRight, BarChart3, BriefcaseBusiness, CircleDollarSign, ShieldCheck } from 'lucide-react';
import { getMyDeals } from '../api/dealApi';
import { getMyWallet } from '../api/walletApi';
import { useAuth } from '../context/AuthContext';
import FinbridgeLoading from '../components/FinbridgeLoading';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const tooltipStyle = {
    backgroundColor: '#0f172a',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    borderRadius: '12px',
    color: '#fff',
};

const MetricCard = ({ icon: Icon, label, value, hint, positive = true, color = 'blue' }) => {
    const colorClasses = {
        blue: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
        emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        violet: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
    };

    return (
    <article className="rounded-2xl border border-theme-border bg-theme-elevated/20 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-theme-border-focus hover:bg-theme-elevated/35">
        <div className="mb-5 flex items-start justify-between gap-3">
            <div className={`grid h-11 w-11 place-items-center rounded-xl border ${colorClasses[color] || colorClasses.blue}`}>
                <Icon size={20} />
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${positive ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/20 bg-rose-500/10 text-rose-400'}`}>
                {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {hint}
            </span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-theme-text-muted">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-theme-text">{value}</p>
    </article>
    );
};

const Analytics = () => {
    const { user } = useAuth();
    const [deals, setDeals] = useState([]);
    const [wallet, setWallet] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        Promise.all([
            getMyDeals().catch(() => []),
            getMyWallet().catch(() => ({})),
        ]).then(([dealData, walletData]) => {
            if (mounted) {
                setDeals(Array.isArray(dealData) ? dealData : []);
                setWallet(walletData || {});
                setLoading(false);
            }
        });
        return () => { mounted = false; };
    }, []);

    const metrics = useMemo(() => {
        const invested = deals.reduce((sum, deal) => sum + Number(deal.fundedAmount || 0), 0);
        const returns = deals.reduce((sum, deal) => sum + Number(deal.interestAmount || 0), 0);
        const active = deals.filter((deal) => deal.status === 'ACTIVE').length;
        const settled = deals.filter((deal) => deal.status === 'CLOSED' || deal.status === 'SETTLED').length;
        return { invested, returns, active, settled };
    }, [deals]);

    const monthlyData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        if (!deals.length) {
            return months.map((month, index) => ({ month, invested: [0, 0, 0, 0, 0, 0][index], returns: 0 }));
        }
        return months.map((month, index) => ({
            month,
            invested: Math.round(metrics.invested * ((index + 1) / months.length)),
            returns: Math.round(metrics.returns * ((index + 1) / months.length)),
        }));
    }, [deals.length, metrics.invested, metrics.returns]);

    const statusData = useMemo(() => {
        const statuses = ['ACTIVE', 'CLOSED', 'DEFAULTED'];
        return statuses.map((status) => ({
            status: status === 'CLOSED' ? 'SETTLED' : status,
            count: deals.filter((deal) => deal.status === status || (status === 'CLOSED' && deal.status === 'SETTLED')).length,
        }));
    }, [deals]);

    if (loading) {
        return <FinbridgeLoading userName={user?.name} />;
    }

    return (
        <div className="min-h-screen bg-theme-bg">
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-72 bg-gradient-to-b from-blue-600/10 to-transparent" />
            <main className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <header className="mb-8 flex flex-col gap-5 border-b border-theme-border pb-7 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                            <BarChart3 size={14} />
                            Portfolio analytics
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-theme-text sm:text-4xl">Performance overview</h1>
                        <p className="mt-2 max-w-2xl text-sm text-theme-text-muted">Track invested capital, returns, deal activity, and portfolio health in one place.</p>
                    </div>
                    <div className="rounded-xl border border-theme-border bg-theme-elevated/20 px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-wider text-theme-text-muted">Available balance</p>
                        <p className="mt-1 text-lg font-bold text-theme-text">{formatCurrency(wallet.availableBalance)}</p>
                    </div>
                </header>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard icon={CircleDollarSign} label="Total invested" value={formatCurrency(metrics.invested)} hint="+12.4%" />
                    <MetricCard icon={BriefcaseBusiness} label="Active deals" value={metrics.active} hint={`${deals.length} total`} />
                    <MetricCard icon={ArrowUpRight} label="Returns earned" value={formatCurrency(metrics.returns)} hint="+8.7%" color="emerald" />
                    <MetricCard icon={ShieldCheck} label="Settled deals" value={metrics.settled} hint={deals.length ? `${Math.round((metrics.settled / deals.length) * 100)}%` : '0%'} color="violet" />
                </section>

                <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
                    <article className="min-w-0 rounded-2xl border border-theme-border bg-theme-elevated/20 p-5 sm:p-6 xl:col-span-3">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-theme-text">Capital growth</h2>
                                <p className="mt-1 text-xs text-theme-text-muted">Investment and returns trend</p>
                            </div>
                            <span className="rounded-full border border-theme-border px-2.5 py-1 text-xs text-theme-text-muted">6 months</span>
                        </div>
                        <div className="h-72 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="analyticsInvested" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="analyticsReturns" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.35} />
                                    <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                                    <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [formatCurrency(value), name === 'invested' ? 'Invested' : 'Returns']} />
                                    <Area type="monotone" dataKey="invested" stroke="#3b82f6" fill="url(#analyticsInvested)" strokeWidth={2.5} />
                                    <Area type="monotone" dataKey="returns" stroke="#10b981" fill="url(#analyticsReturns)" strokeWidth={2.5} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </article>

                    <article className="min-w-0 rounded-2xl border border-theme-border bg-theme-elevated/20 p-5 sm:p-6 xl:col-span-2">
                        <div className="mb-5">
                            <h2 className="text-lg font-semibold text-theme-text">Deal status</h2>
                            <p className="mt-1 text-xs text-theme-text-muted">Current portfolio distribution</p>
                        </div>
                        <div className="h-72 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statusData} layout="vertical" margin={{ left: 8, right: 12 }}>
                                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.35} horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} stroke="#94a3b8" tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="status" stroke="#94a3b8" tickLine={false} axisLine={false} width={70} />
                                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
                                    <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={28} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </article>
                </section>

                <section className="mt-6 rounded-2xl border border-theme-border bg-theme-elevated/20 p-5 sm:p-6">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-theme-text">Portfolio summary</h2>
                            <p className="mt-1 text-xs text-theme-text-muted">A quick view of your current exposure.</p>
                        </div>
                        <button onClick={() => window.history.back()} className="mt-3 w-fit rounded-lg border border-theme-border px-3 py-2 text-xs font-semibold text-theme-text-muted transition hover:border-theme-border-focus hover:text-theme-text sm:mt-0">
                            Back to dashboard
                        </button>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-xl border border-theme-border bg-theme-surface-hover p-4">
                            <p className="text-xs text-theme-text-muted">Locked balance</p>
                            <p className="mt-2 text-lg font-semibold text-theme-text">{formatCurrency(wallet.lockedBalance)}</p>
                        </div>
                        <div className="rounded-xl border border-theme-border bg-theme-surface-hover p-4">
                            <p className="text-xs text-theme-text-muted">Total earnings</p>
                            <p className="mt-2 text-lg font-semibold text-emerald-400">{formatCurrency(wallet.totalEarnings)}</p>
                        </div>
                        <div className="rounded-xl border border-theme-border bg-theme-surface-hover p-4">
                            <p className="text-xs text-theme-text-muted">Average return</p>
                            <p className="mt-2 text-lg font-semibold text-theme-text">{formatCurrency(deals.length ? metrics.returns / deals.length : 0)}</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Analytics;
