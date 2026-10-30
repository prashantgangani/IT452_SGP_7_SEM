import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFeatures } from '../context/FeatureContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';
import { ArrowLeft } from 'lucide-react';

const SystemControl = () => {
    const { user, token, logout } = useAuth();
    const { features, refreshFeatures, loading } = useFeatures();
    const navigate = useNavigate();

    useEffect(() => {
        // Enforce Controller or Admin Role
        if (!user || (user.role !== 'CONTROLLER' && user.role !== 'ADMIN')) {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleToggle = async (featureKey, currentValue) => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://finsite-7l69.onrender.com/api' : 'http://localhost:5000/api');
            const response = await axios.patch(
                `${API_BASE_URL}/features/admin/${featureKey}`,
                { isEnabled: !currentValue },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                toast.success(`${featureKey} has been ${!currentValue ? 'enabled' : 'disabled'}.`);
                refreshFeatures(); // Re-fetch all features
            }
        } catch (error) {
            toast.error('Failed to update feature toggle.');
            console.error(error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading || !user) {
        return <div className="min-h-screen bg-theme-bg flex items-center justify-center text-theme-text">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-theme-bg py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                    <div>
                        <div className="flex items-center gap-3">
                            {user.role === 'ADMIN' && (
                                <button
                                    onClick={() => navigate('/admin/settings')}
                                    className="p-2 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-hover text-theme-text-muted hover:text-theme-text transition-colors"
                                    title="Back to Admin Settings"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                            )}
                            <h1 className="text-3xl font-bold text-theme-text tracking-tight">System Control Panel</h1>
                        </div>
                        <p className="mt-2 text-sm text-theme-text-muted">Master Governance Dashboard: Enable/Disable Application Modules</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/admin')}
                            className="bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 border border-blue-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            Admin Operations
                        </button>
                        <ThemeToggle />
                        <button
                            onClick={handleLogout}
                            className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                <div className="bg-theme-surface shadow-xl rounded-2xl border border-theme-border overflow-hidden">
                    <ul className="divide-y divide-theme-border">
                        {Object.entries(features).map(([key, isEnabled]) => (
                            <li key={key} className="p-6 hover:bg-theme-surface-hover transition-colors flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-theme-text">{key.replace(/_/g, ' ')}</h3>
                                    <p className="mt-1 text-sm text-theme-text-muted">
                                        Currently <span className={isEnabled ? 'text-emerald-500 font-semibold' : 'text-red-500 font-semibold'}>{isEnabled ? 'Active' : 'Disabled'}</span>
                                    </p>
                                </div>
                                <div>
                                    <button
                                        onClick={() => handleToggle(key, isEnabled)}
                                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isEnabled ? 'bg-blue-600' : 'bg-slate-400 dark:bg-slate-700'
                                            }`}
                                    >
                                        <span className="sr-only">Toggle {key}</span>
                                        <span
                                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-7' : 'translate-x-0'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SystemControl;
