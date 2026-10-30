import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import '../../styles/admin.css';

const AdminLayout = ({ title, children }) => {
    // Mobile drawer slide-in state
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    
    // Desktop sidebar collapsed state (persisted in localStorage)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        try {
            return localStorage.getItem('admin_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const location = useLocation();

    // Auto-close mobile drawer when navigating to another route
    useEffect(() => {
        setMobileDrawerOpen(false);
    }, [location.pathname]);

    // Unified toggle: controls drawer on mobile, collapse state on desktop
    const handleToggleSidebar = () => {
        if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
            setMobileDrawerOpen((prev) => !prev);
        } else {
            setSidebarCollapsed((prev) => {
                const next = !prev;
                try {
                    localStorage.setItem('admin_sidebar_collapsed', String(next));
                } catch {
                    // ignore storage errors
                }
                return next;
            });
        }
    };

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
                collapsed={sidebarCollapsed}
                onToggle={handleToggleSidebar}
                onItemClick={() => setMobileDrawerOpen(false)}
            />

            <div className={`admin-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <AdminHeader
                    title={title}
                    sidebarCollapsed={sidebarCollapsed}
                    sidebarOpen={mobileDrawerOpen}
                    onToggleSidebar={handleToggleSidebar}
                />
                <main className="admin-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
