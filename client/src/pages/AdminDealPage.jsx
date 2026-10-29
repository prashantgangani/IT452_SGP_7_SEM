import { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { getAllDeals } from '../api/adminApi';
import { repayDeal, downloadAgreement, signAgreement } from '../api/dealApi';
import toast from 'react-hot-toast';
import { RefreshCw, PlayCircle, Video, MessageSquare, CheckCircle2, PenTool, ShieldAlert, Users } from 'lucide-react';

const AdminDealPage = () => {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [signingId, setSigningId] = useState(null);
    const [isDownloadingAgreement, setIsDownloadingAgreement] = useState(null);

    const handleDownloadAgreement = async (dealId) => {
        setIsDownloadingAgreement(dealId);
        try {
            await downloadAgreement(dealId);
        } catch (error) {
            toast.error(error.message || "Failed to download agreement");
        } finally {
            setIsDownloadingAgreement(null);
        }
    };

    const handleAdminSign = async (dealId) => {
        setSigningId(dealId);
        try {
            const res = await signAgreement(dealId);
            if (res.success) {
                toast.success("Deal agreement attested & e-signed by Admin!");
                // Optimistically update local state immediately so button disables instantly
                setDeals(prev => prev.map(d => d.id === dealId ? { ...d, buyerSigned: true, agreementStatus: res.data?.agreementStatus || d.agreementStatus } : d));
                await fetchDeals();
            }
        } catch (error) {
            console.error("Failed to sign deal as admin:", error);
            toast.error(error.message || "Failed to e-sign agreement");
        } finally {
            setSigningId(null);
        }
    };

    const fetchDeals = async () => {
        try {
            setLoading(true);
            const response = await getAllDeals();
            if (response.success && response.data) {
                setDeals(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch deals:", error);
            toast.error("Failed to load deals.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeals();
    }, []);

    const handleRepay = async (dealId) => {
        setProcessingId(dealId);
        try {
            const response = await repayDeal(dealId);
            if (response.success) {
                toast.success('Deal repaid successfully!');
                await fetchDeals(); // Refresh the list
            }
        } catch (error) {
            console.error("Failed to repay deal:", error);
            toast.error(error.message || 'Failed to process repayment');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        const baseClass = "px-2 py-1 text-xs font-medium rounded-full";
        switch (status) {
            case 'ACTIVE': return `${baseClass} bg-green-500/10 text-green-400 border border-green-500/20`;
            case 'CLOSED': return `${baseClass} bg-slate-500/10 text-slate-400 border border-slate-500/20`;
            default: return `${baseClass} bg-blue-500/10 text-blue-400 border border-blue-500/20`;
        }
    };

    return (
        <AdminLayout title="Deal Management">
            <div className="bg-theme-surface rounded-2xl border border-theme-border shadow-xl overflow-hidden">
                <div className="p-6 border-b border-theme-border flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-theme-text">All Deals</h2>
                        <p className="text-sm text-theme-text-muted mt-1">Manage platform deals, join active meetings/chat, attest agreements, and process repayments</p>
                    </div>
                    <button
                        onClick={fetchDeals}
                        className="p-2 text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-hover rounded-xl transition-colors border border-theme-border"
                        title="Refresh List"
                    >
                        <RefreshCw size={20} className={loading && !processingId ? "animate-spin text-blue-500" : ""} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1100px]">
                        <thead>
                            <tr className="bg-theme-surface-hover/80 border-b border-theme-border text-xs uppercase tracking-wider text-theme-text-muted">
                                <th className="p-4 font-medium">Deal ID</th>
                                <th className="p-4 font-medium">Lender</th>
                                <th className="p-4 font-medium">MSME</th>
                                <th className="p-4 font-medium text-right">Funded Amount</th>
                                <th className="p-4 font-medium">Video Call (VC)</th>
                                <th className="p-4 font-medium">Agreement & E-Sign</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-border">
                            {loading && !processingId && deals.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-theme-text-muted">Loading deals...</td>
                                </tr>
                            ) : deals.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-theme-text-muted">No deals found in the system.</td>
                                </tr>
                            ) : (
                                deals.map(deal => {
                                    const isCallActive = deal.callSession && ['INITIATED', 'ONGOING'].includes(deal.callSession.status);

                                    return (
                                        <tr key={deal.id} className="hover:bg-theme-surface-hover/40 transition-colors">
                                            <td className="p-4 text-sm text-theme-text-muted font-mono">
                                                {deal.id.slice(0, 8)}...
                                            </td>
                                            <td className="p-4 text-sm text-theme-text font-medium">
                                                {deal.lender?.name || 'Unknown'}
                                            </td>
                                            <td className="p-4 text-sm text-theme-text font-medium">
                                                {deal.msme?.name || 'Unknown'}
                                            </td>
                                            <td className="p-4 text-sm text-theme-text text-right font-medium">
                                                ₹{parseFloat(deal.fundedAmount || 0).toLocaleString()}
                                            </td>

                                            {/* Video Call (VC) Column */}
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1.5 items-start">
                                                    {isCallActive ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                            </span>
                                                            <span className="text-[11px] font-semibold text-emerald-500 dark:text-emerald-400">
                                                                VC Active
                                                            </span>
                                                            {deal.adminInvited && (
                                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                                                                    Invited
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : deal.adminInvited ? (
                                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                            Lender Invited Admin
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-theme-text-muted">
                                                            Standby (Optional)
                                                        </span>
                                                    )}

                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            window.open(`/meeting/${deal.id}`, '_blank');
                                                        }}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                                                            isCallActive
                                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20 active:scale-95'
                                                                : deal.adminInvited
                                                                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-600/20 active:scale-95'
                                                                : 'bg-theme-surface-hover hover:bg-theme-surface border border-theme-border text-theme-text text-xs hover:border-violet-500/50'
                                                        }`}
                                                        title="Join room as Admin to participate or chat"
                                                    >
                                                        <Video size={13} />
                                                        <span>{isCallActive ? 'Join VC Call' : 'Enter Meeting / Chat'}</span>
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Agreement & E-Sign Column */}
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1.5 items-start">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${deal.lenderSigned && deal.msmeSigned ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                                            {deal.lenderSigned && deal.msmeSigned ? 'PARTIES SIGNED' : 'PENDING'}
                                                        </span>
                                                        {deal.buyerSigned ? (
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                                                <CheckCircle2 size={10} /> Admin Attested
                                                            </span>
                                                        ) : deal.adminInvited ? (
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
                                                                Admin E-Sign Req.
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {deal.buyerSigned ? (
                                                            <button
                                                                disabled
                                                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-not-allowed opacity-90 shadow-sm"
                                                                title="Agreement has already been attested and e-signed by Admin"
                                                            >
                                                                <CheckCircle2 size={12} className="text-emerald-400" />
                                                                <span>Admin Signed</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAdminSign(deal.id)}
                                                                disabled={signingId === deal.id || deal.status === 'CLOSED'}
                                                                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white shadow-sm transition-all ${
                                                                    signingId === deal.id || deal.status === 'CLOSED'
                                                                        ? 'bg-slate-700/60 text-slate-400 border border-white/10 cursor-not-allowed opacity-60'
                                                                        : 'bg-violet-600 hover:bg-violet-500 active:scale-95 shadow-violet-600/30'
                                                                }`}
                                                                title={deal.status === 'CLOSED' ? "Deal is closed" : "Perform Admin Attestation / E-Sign on this Agreement"}
                                                            >
                                                                {signingId === deal.id ? (
                                                                    <RefreshCw size={11} className="animate-spin" />
                                                                ) : (
                                                                    <PenTool size={11} />
                                                                )}
                                                                <span>{signingId === deal.id ? 'Attesting...' : 'Admin E-Sign'}</span>
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadAgreement(deal.id); }}
                                                            disabled={isDownloadingAgreement === deal.id}
                                                            className="text-[10px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium"
                                                        >
                                                            {isDownloadingAgreement === deal.id ? 'Downloading...' : 'PDF'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <span className={getStatusBadge(deal.status)}>
                                                    {deal.status}
                                                </span>
                                            </td>

                                            <td className="p-4 text-center">
                                                {deal.status === 'ACTIVE' && (
                                                    <button
                                                        onClick={() => handleRepay(deal.id)}
                                                        disabled={processingId === deal.id}
                                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${processingId === deal.id
                                                            ? 'bg-blue-600/50 text-white cursor-not-allowed'
                                                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-blue-500/20 active:scale-95'
                                                            }`}
                                                    >
                                                        {processingId === deal.id ? (
                                                            <>
                                                                <RefreshCw size={16} className="animate-spin" />
                                                                Processing
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PlayCircle size={16} />
                                                                Repay
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDealPage;
