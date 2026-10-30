import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../../styles/admin.css';

const AdminLayout = ({ title, children }) => {
    // Only controls mobile drawer slide-in state
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const location = useLocation();

    // Auto-close mobile drawer when navigating to another route
    useEffect(() => {
        setMobileDrawerOpen(false);
    }, [location.pathname]);

    return (
        <div className="admin-container">
            {/* Backdrop overlay ONLY rendered for mobile drawer */}
            {mobileDrawerOpen && (
                <div
                    className="admin-sidebar-backdrop"
                    onClick={() => setMobileDrawerOpen(false)}
                    aria-hidden="true"
                />
            )}

            <AdminSidebar
                open={mobileDrawerOpen}
                onToggle={() => setMobileDrawerOpen((prev) => !prev)}
                onItemClick={() => setMobileDrawerOpen(false)}
            />

            <div className="admin-main">
                <AdminHeader
                    title={title}
                    sidebarOpen={mobileDrawerOpen}
                    onToggleSidebar={() => setMobileDrawerOpen((prev) => !prev)}
                />
                <main className="admin-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
