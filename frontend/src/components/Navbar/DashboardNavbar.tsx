import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, BarChart3, History as HistoryIcon, Plus, Database, PieChart, Settings } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

interface DashboardNavbarProps {
    onOpenSidebar: () => void;
}

const DashboardNavbar: React.FC<DashboardNavbarProps> = ({ onOpenSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
        { path: '/dashboard/graphs', label: 'Graphs', icon: PieChart },
        { path: '/dashboard/history', label: 'History', icon: HistoryIcon },
        { path: '/dashboard/settings', label: 'Settings', icon: Settings },
    ];

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/designer') || location.pathname.startsWith('/dashboard/custom');
        }
        return location.pathname === path;
    };

    return (
        <nav className="navbar-blur" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 'var(--nav-height)',
            borderBottom: '1px solid var(--nav-border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            zIndex: 1000,
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
        }}>
            {/* Left: Brand & Nav Links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div 
                    onClick={() => navigate('/')}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                >
                    <Database size={28} color="var(--accent-primary)" />
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                        DataAnalyser<span style={{ color: 'var(--accent-primary)' }}>.</span>
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {navItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                        >
                            <item.icon size={16} />
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right: Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                    onClick={() => navigate('/dashboard/upload')}
                    className="btn-primary"
                    style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        borderRadius: '8px',
                        width: 'auto',
                        height: '36px'
                    }}
                >
                    <Plus size={16} /> New Upload
                </button>

                <div style={{ height: '20px', width: '1px', background: 'var(--border-color)', opacity: 0.5 }}></div>
                
                <ThemeToggle />

                <button
                    onClick={onOpenSidebar}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                    title="User Menu"
                >
                    <User size={18} />
                </button>
            </div>
        </nav>
    );
};

export default DashboardNavbar;
