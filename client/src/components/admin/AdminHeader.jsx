import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, Menu, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import ProfileBadge from '../ProfileBadge';
import ThemeToggle from '../ThemeToggle';

const initialNotifications = [
    { id: 1, title: 'New lender verification', message: '3 lender applications are awaiting review.', type: 'info', time: '2 min ago' },
    { id: 2, title: 'Risk alert', message: 'One invoice has been flagged for suspicious activity.', type: 'warning', time: '18 min ago' },
    { id: 3, title: 'Funding milestone', message: 'Invoice funding cycle completed successfully.', type: 'success', time: '1 hour ago' },
];

const AdminHeader = ({ title, sidebarOpen, onToggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const panelRef = useRef(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications] = useState(initialNotifications);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="admin-header">
            <div className="header-left">
                <button
                    type="button"
                    className="menu-toggle"
                    onClick={onToggleSidebar}
                    aria-label="Toggle navigation drawer"
                    title="Toggle navigation drawer"
                >
                    <Menu size={20} />
                </button>
                <h1 className="page-title">{title}</h1>
            </div>

            <div className="header-right" ref={panelRef}>
                <div className="search-wrapper">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search users, invoices..."
                        className="search-input"
                    />
                </div>

                <div className="theme-toggle-wrap">
                    <ThemeToggle />
                </div>

                <div className="header-action-wrap">
                    <button
                        type="button"
                        className="header-icon-btn"
                        onClick={() => setShowNotifications((value) => !value)}
                        aria-label="Open notifications"
                        aria-expanded={showNotifications}
                    >
                        <Bell size={20} />
                        <span className="notification-badge">{notifications.length}</span>
                    </button>

                    {showNotifications && (
                        <div className="notification-panel">
                            <div className="notification-header">
                                <span>Notifications</span>
                                <button type="button" className="notification-close" onClick={() => setShowNotifications(false)} aria-label="Close notifications">
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="notification-list">
                                {notifications.map((item) => (
                                    <button type="button" key={item.id} className="notification-item" onClick={() => setShowNotifications(false)}>
                                        <div className={`notification-icon ${item.type}`}>
                                            {item.type === 'warning' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                                        </div>
                                        <div className="notification-copy">
                                            <strong>{item.title}</strong>
                                            <span>{item.message}</span>
                                            <small>{item.time}</small>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="profile-chip-wrap">
                    <ProfileBadge user={user} onLogout={handleLogout} profilePath="/admin" />
                    <div className="profile-info-mobile">
                        <div className="profile-name">{user?.name || 'Admin User'}</div>
                        <div className="profile-role">Administrator</div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
