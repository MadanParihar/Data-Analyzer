import React from 'react';
import { Database } from 'lucide-react';

const SplashScreen: React.FC = () => {
    return (
        <div className="splash-container">
            <div className="splash-logo-container">
                <div className="splash-glow"></div>
                <div className="splash-logo">
                    <Database size={40} />
                </div>
            </div>
            <div className="splash-text">
                DataAnalyser<span style={{ color: 'var(--accent-primary)' }}>.</span>
            </div>
            <div className="splash-loader">
                <div className="splash-loader-bar"></div>
            </div>
        </div>
    );
};

export default SplashScreen;
