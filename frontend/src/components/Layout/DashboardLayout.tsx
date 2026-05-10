import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DashboardNavbar from '../Navbar/DashboardNavbar';
import Sidebar from '../Sidebar/Sidebar';

const DashboardLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div style={{ 
            position: 'relative', 
            height: '100vh', 
            width: '100vw', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <DashboardNavbar onOpenSidebar={() => setIsSidebarOpen(true)} />
            
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content Area */}
            <main style={{ 
                flex: 1,
                width: '100%', 
                height: 'calc(100vh - var(--nav-height))', 
                marginTop: 'var(--nav-height)',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
