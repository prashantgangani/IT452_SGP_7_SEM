import { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { getAllDeals } from '../api/adminApi';
import { repayDeal, downloadAgreement } from '../api/dealApi';
import toast from 'react-hot-toast';
import { RefreshCw, PlayCircle } from 'lucide-react';

const AdminDealPage = () => {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
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
                        <p className="text-sm text-theme-text-muted mt-1">Manage platform deals and process repayments</p>
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
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-theme-surface-hover/80 border-b border-theme-border text-xs uppercase tracking-wider text-theme-text-muted">
                                <th className="p-4 font-medium">Deal ID</th>
                                <th className="p-4 font-medium">Lender</th>
                                <th className="p-4 font-medium">MSME</th>
                                <th className="p-4 font-medium text-right">Funded Amount</th>
                                <th className="p-4 font-medium">Agreement</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-border">
                            {loading && !processingId && deals.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-theme-text-muted">Loading deals...</td>
                                </tr>
                            ) : deals.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-theme-text-muted">No deals found in the system.</td>
                                </tr>
                            ) : (
                                deals.map(deal => (
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
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${deal.lenderSigned && deal.msmeSigned ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                                    {deal.lenderSigned && deal.msmeSigned ? 'SIGNED' : 'PENDING'}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadAgreement(deal.id); }}
                                                    disabled={isDownloadingAgreement === deal.id}
                                                    className="text-[10px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline mt-1 font-medium"
                                                >
                                                    Download
                                                </button>
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDealPage;
