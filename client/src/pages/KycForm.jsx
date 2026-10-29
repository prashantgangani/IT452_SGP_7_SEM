import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileText, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitKyc } from '../api/kycApi';
import { useAuth } from '../context/AuthContext';
import { FeatureGuard } from '../context/FeatureContext';

const KycForm = () => {
    const navigate = useNavigate();
    const { user, login, token } = useAuth();

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [riskPreview, setRiskPreview] = useState(null);
    const [formData, setFormData] = useState({
        legalName: '',
        businessName: '',
        gstNumber: '',
        businessStartDate: '',
        businessAddress: '',
        turnover: '',
        gstCertificateUrl: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep1 = () => {
        return formData.legalName && formData.businessName && formData.businessStartDate;
    };

    const validateStep2 = () => {
        return formData.gstNumber && formData.businessAddress && formData.turnover;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep1() || !validateStep2()) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setLoading(true);
        try {
            const result = await submitKyc(formData);
            toast.success("KYC submitted successfully!");

            // Show risk score preview
            setRiskPreview(result.data);

            // Update local user context so UI reflects IN_PROGRESS
            const updatedUser = { ...user, kycStatus: 'IN_PROGRESS', riskScore: result.data.riskScore };
            login(token, updatedUser);

            setStep(3); // Move to success step
        } catch (error) {
            toast.error(typeof error === 'string' ? error : "KYC Submission failed");
        } finally {
            setLoading(false);
        }
    };

    if (user?.kycStatus === 'IN_PROGRESS') {
        return (
            <div className="min-h-screen bg-theme-bg flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-theme-surface border border-amber-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                        <AlertTriangle className="text-amber-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-semibold text-theme-text">KYC Under Review</h2>
                    <p className="text-theme-text-muted text-sm">Your business profile is currently being verified by our team. You'll be notified once approved.</p>
                    <button
                        onClick={() => navigate('/msme')}
                        className="mt-6 bg-theme-surface hover:bg-theme-surface-hover border border-theme-border text-theme-text px-6 py-2.5 rounded-xl font-medium transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (user?.kycStatus === 'VERIFIED') {
        return (
            <div className="min-h-screen bg-theme-bg flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-theme-surface border border-emerald-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                        <CheckCircle className="text-emerald-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-semibold text-theme-text">KYC Verified</h2>
                    <p className="text-theme-text-muted text-sm">Your business profile is fully verified. You can now access all platform features.</p>
                    <button
                        onClick={() => navigate('/msme')}
                        className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-md shadow-blue-500/20"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <FeatureGuard featureKey="KYC_ONBOARDING_MODULE">
            <div className="min-h-screen relative overflow-hidden bg-theme-bg flex items-center justify-center py-12 px-4">
                {/* Background elements */}
                <div className="absolute top-0 right-1/4 w-[480px] h-[480px] bg-blue-600 rounded-full -z-10 blur-3xl opacity-[0.10] pointer-events-none" />
                <div className="absolute bottom-1/4 -left-24 w-[400px] h-[400px] bg-indigo-500 rounded-full -z-10 blur-3xl opacity-[0.08] pointer-events-none" />

                <div className="max-w-3xl w-full">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-theme-text mb-2">Complete Your Business KYC</h1>
                        <p className="text-theme-text-muted">Verify your business to unlock invoice financing</p>
                    </div>

                    <div className="bg-theme-surface border border-theme-border rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
                        {/* Stepper Header — hidden while submitting */}
                        <div className={`flex border-b border-theme-border bg-theme-surface-hover/50 ${loading ? 'opacity-30 pointer-events-none' : ''}`}>
                            <div className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${step >= 1 ? 'text-blue-500 font-semibold border-b-2 border-blue-500' : 'text-theme-text-muted'}`}>
                                1. Business Info
                            </div>
                            <div className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${step >= 2 ? 'text-blue-500 font-semibold border-b-2 border-blue-500' : 'text-theme-text-muted'}`}>
                                2. Financial Details
                            </div>
                            <div className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${step === 3 ? 'text-blue-500 font-semibold border-b-2 border-blue-500' : 'text-theme-text-muted'}`}>
                                3. Review & Status
                            </div>
                        </div>

                        <div className="p-8">
                            {/* ── Inline submit loading — replaces form steps while API call is in flight ── */}
                            {loading && (
                                <div className="py-6 text-center space-y-6 animate-in fade-in duration-300">
                                    {/* Spinner */}
                                    <div className="mx-auto h-14 w-14 rounded-full border-2 border-blue-400/30 border-t-blue-500 animate-spin" />

                                    <div>
                                        <h2 className="text-2xl font-semibold text-theme-text">Submitting KYC…</h2>
                                        <p className="mt-2 text-theme-text-muted text-sm">We're verifying your GST and business details.<br />Please don't refresh this page.</p>
                                    </div>

                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold">
                                        Reviewing
                                    </div>
                                </div>
                            )}

                            {/* ── Form steps — hidden (not unmounted) while submitting so inputs keep values ── */}
                            <div className={loading ? 'hidden' : undefined}>
                                {step === 1 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div>
                                            <label className="block text-sm font-medium text-theme-text mb-2">Legal Business Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Building2 size={18} className="text-theme-text-muted" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="legalName"
                                                    value={formData.legalName}
                                                    onChange={handleChange}
                                                    className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 pl-11 pr-4 text-theme-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-theme-text-muted"
                                                    placeholder="As per PAN card"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-theme-text mb-2">Trade/Business Name</label>
                                                <input
                                                    type="text"
                                                    name="businessName"
                                                    value={formData.businessName}
                                                    onChange={handleChange}
                                                    className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 px-4 text-theme-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-theme-text-muted"
                                                    placeholder="Your brand name"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-theme-text mb-2">Business Start Date</label>
                                                <input
                                                    type="date"
                                                    name="businessStartDate"
                                                    value={formData.businessStartDate}
                                                    onChange={handleChange}
                                                    className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 px-4 text-theme-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={() => validateStep1() ? setStep(2) : toast.error("Fill all fields")}
                                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-md shadow-blue-500/20"
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div>
                                            <label className="block text-sm font-medium text-theme-text mb-2">GST Number</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <FileText size={18} className="text-theme-text-muted" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="gstNumber"
                                                    value={formData.gstNumber}
                                                    onChange={handleChange}
                                                    className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 pl-11 pr-4 text-theme-text uppercase focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-theme-text-muted"
                                                    placeholder="22AAAAA0000A1Z5"
                                                    maxLength={15}
                                                    required
                                                />
                                            </div>
                                            <p className="text-xs text-theme-text-muted mt-1">15-digit correct GST format is required</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-theme-text mb-2">Registered Address</label>
                                            <textarea
                                                name="businessAddress"
                                                value={formData.businessAddress}
                                                onChange={handleChange}
                                                rows={3}
                                                className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 px-4 text-theme-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-theme-text-muted resize-none"
                                                placeholder="Full address as per GST"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-theme-text mb-2">Annual Turnover (INR)</label>
                                            <input
                                                type="number"
                                                name="turnover"
                                                value={formData.turnover}
                                                onChange={handleChange}
                                                className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 px-4 text-theme-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-theme-text-muted"
                                                placeholder="e.g. 5000000"
                                                required
                                            />
                                        </div>

                                        <div className="pt-4 flex justify-between">
                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={() => setStep(1)}
                                                className="bg-theme-surface border border-theme-border hover:bg-theme-surface-hover disabled:opacity-50 disabled:cursor-not-allowed text-theme-text px-6 py-2.5 rounded-xl font-medium transition-colors"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={handleSubmit}
                                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
                                            >
                                                {loading ? 'Submitting…' : 'Submit KYC'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>{/* end form-steps wrapper */}

                            {step === 3 && riskPreview && (
                                <div className="space-y-6 text-center animate-in zoom-in-95 duration-500">
                                    <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <ShieldCheck className="text-emerald-500" size={40} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-theme-text">Application Received</h2>
                                    <p className="text-theme-text-muted mb-8 max-w-md mx-auto">
                                        Your KYC application has been successfully submitted and is now under review by our administrators.
                                    </p>

                                    <div className="bg-theme-bg border border-theme-border rounded-2xl p-6 max-w-sm mx-auto shadow-sm">
                                        <h3 className="text-sm font-medium text-theme-text-muted mb-4 uppercase tracking-wider">Preliminary Assessment</h3>

                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-theme-text font-medium">Risk Score</span>
                                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
                                                {riskPreview.riskScore}/100
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center pt-4 border-t border-theme-border">
                                            <span className="text-theme-text font-medium">Risk Level</span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${riskPreview.riskLevel === 'LOW' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                                                riskPreview.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                                                    'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                                }`}>
                                                {riskPreview.riskLevel}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button
                                            onClick={() => navigate('/msme')}
                                            className="bg-theme-surface hover:bg-theme-surface-hover border border-theme-border text-theme-text px-8 py-3 rounded-xl font-medium transition-all shadow-sm"
                                        >
                                            Go to Dashboard
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </FeatureGuard>
    );
};

export default KycForm;
