import { Building2, FileText, TrendingUp, CheckCircle, Clock } from 'lucide-react';

const RecentActivity = () => {
    const activities = [
        {
            id: 1,
            icon: Building2,
            title: 'New MSME Registered',
            description: 'TechStart Solutions registered',
            time: '2 hours ago',
            color: '#3B82F6',
            bgColor: 'rgba(59, 130, 246, 0.15)',
            borderColor: 'rgba(59, 130, 246, 0.3)',
        },
        {
            id: 2,
            icon: FileText,
            title: 'Invoice Uploaded',
            description: 'Invoice INV-2024-001 uploaded',
            time: '4 hours ago',
            color: '#8B5CF6',
            bgColor: 'rgba(139, 92, 246, 0.15)',
            borderColor: 'rgba(139, 92, 246, 0.3)',
        },
        {
            id: 3,
            icon: TrendingUp,
            title: 'New Bid Placed',
            description: 'Lender bid ₹5,00,000 on invoice',
            time: '6 hours ago',
            color: '#06B6D4',
            bgColor: 'rgba(6, 182, 212, 0.15)',
            borderColor: 'rgba(6, 182, 212, 0.3)',
        },
        {
            id: 4,
            icon: CheckCircle,
            title: 'Transaction Approved',
            description: 'Transaction TXN-2024-156 approved',
            time: '8 hours ago',
            color: '#22C55E',
            bgColor: 'rgba(34, 197, 94, 0.15)',
            borderColor: 'rgba(34, 197, 94, 0.3)',
        },
    ];

    return (
        <div className="activity-panel rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md p-6 shadow-xl flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Clock size={18} />
                    </div>
                    <div>
                        <h3 className="panel-title text-base font-bold text-white tracking-wide">Recent Activity</h3>
                        <p className="text-xs text-white/40">Platform events and audit log</p>
                    </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Feed
                </span>
            </div>

            {/* List */}
            <div className="activity-list space-y-3 flex-1 flex flex-col justify-between">
                {activities.map((activity) => {
                    const IconComponent = activity.icon;
                    return (
                        <div
                            key={activity.id}
                            className="activity-item group flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-white/15 transition-all duration-200"
                        >
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div
                                    className="activity-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                                    style={{
                                        color: activity.color,
                                        backgroundColor: activity.bgColor,
                                        border: `1px solid ${activity.borderColor}`
                                    }}
                                >
                                    <IconComponent size={19} />
                                </div>
                                <div className="activity-content min-w-0">
                                    <div className="activity-title text-sm font-semibold text-white/90 truncate">
                                        {activity.title}
                                    </div>
                                    <div className="activity-desc text-xs text-white/50 truncate mt-0.5">
                                        {activity.description}
                                    </div>
                                </div>
                            </div>
                            <div className="activity-time text-xs font-mono text-white/40 shrink-0 ml-3 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                {activity.time}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecentActivity;
