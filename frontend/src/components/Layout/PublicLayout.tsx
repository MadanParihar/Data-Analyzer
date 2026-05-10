import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from '../Navbar/PublicNavbar';

const PublicLayout: React.FC = () => {
    return (
        <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', overflowX: 'hidden' }}>
            <PublicNavbar />
            
            <div style={{ paddingTop: 'var(--nav-height)' }}>
                <Outlet />
            </div>
        </div>
    );
};

export default PublicLayout;
