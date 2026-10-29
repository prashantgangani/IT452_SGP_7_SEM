import { AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';

const RiskAlerts = () => {
    const alerts = [
        {
            id: 1,
            type: 'critical',
            title: 'High-Risk Invoice',
            description: 'Invoice INV-2024-089 flagged for review',
            icon: AlertTriangle,
        },
        {
            id: 2,
            type: 'warning',
            title: 'Failed Login Attempts',
            description: '5 failed login attempts detected',
            icon: AlertCircle,
        },
        {
            id: 3,
            type: 'warning',
            title: 'Duplicate GSTIN',
            description: 'Company XYZ has duplicate GSTIN registered',
            icon: ShieldAlert,
        },
    ];

    const typeConfig = {
        critical: {
            border: 'border-rose-500/25 hover:border-rose-500/45',
            bg: 'bg-rose-500/[0.06] hover:bg-rose-500/[0.12]',
            iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
            titleColor: 'text-rose-200',
            badge: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
            label: 'Critical'
        },
        warning: {
            border: 'border-amber-500/25 hover:border-amber-500/45',
            bg: 'bg-amber-500/[0.06] hover:bg-amber-500/[0.12]',
            iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
            titleColor: 'text-amber-200',
            badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
            label: 'Warning'
        }
    };

    return (
        <div className="alert-panel rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md p-6 shadow-xl flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                        <ShieldAlert size={18} />
                    </div>
                    <div>
                        <h3 className="panel-title text-base font-bold text-white tracking-wide">Risk & Fraud Alerts</h3>
                        <p className="text-xs text-white/40">Real-time threat monitoring</p>
                    </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400">
                    {alerts.length} Flagged
                </span>
            </div>

            {/* List */}
            <div className="alert-list space-y-3 flex-1 flex flex-col justify-between">
                {alerts.map((alert) => {
                    const cfg = typeConfig[alert.type] || typeConfig.warning;
                    const IconComponent = alert.icon;
                    return (
                        <div
                            key={alert.id}
                            className={`alert-item group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${cfg.bg} ${cfg.border}`}
                        >
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className={`alert-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${cfg.iconBg}`}>
                                    <IconComponent size={19} />
                                </div>
                                <div className="alert-content min-w-0">
                                    <div className={`alert-title text-sm font-semibold truncate ${cfg.titleColor}`}>
                                        {alert.title}
                                    </div>
                                    <div className="alert-desc text-xs text-white/60 truncate mt-0.5">
                                        {alert.description}
                                    </div>
                                </div>
                            </div>
                            <div className={`alert-badge text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ml-3 ${cfg.badge}`}>
                                {cfg.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RiskAlerts;
