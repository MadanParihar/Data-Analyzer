import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Database, Zap, Home as HomeIcon } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

const PublicNavbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = useSelector((state: RootState) => state.auth);

    const isHome = location.pathname === '/';

    const handleFeaturesClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isHome) {
            const el = document.getElementById('features');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
            navigate('/#features');
        }
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
        }}>
            {/* Left: Brand */}
            <div 
                onClick={() => navigate('/')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
                <Database size={32} color="var(--accent-primary)" />
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                    DataAnalyser<span style={{ color: 'var(--accent-primary)' }}>.</span>
                </span>
            </div>

            {/* Right: Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                        onClick={() => navigate('/')}
                        className={`nav-link ${isHome ? 'active' : ''}`}
                    >
                        <HomeIcon size={16} /> Home
                    </button>
                    <a 
                        href="#features" 
                        onClick={handleFeaturesClick}
                        className="nav-link"
                    >
                        <Zap size={16} /> Features
                    </a>
                </div>

                <div style={{ height: '20px', width: '1px', background: 'var(--border-color)', opacity: 0.5 }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <ThemeToggle />
                    <button
                        onClick={() => navigate(token ? '/dashboard' : '/auth')}
                        className="btn-primary"
                        style={{
                            padding: '8px 24px',
                            fontSize: '14px',
                            borderRadius: '8px',
                            width: 'auto'
                        }}
                    >
                        {token ? 'Go to Dashboard' : 'Sign In'}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default PublicNavbar;
