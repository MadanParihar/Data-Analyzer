import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Database,
    Sparkles,
    Zap,
    Shield,
    ArrowRight,
    LayoutDashboard,
    TrendingUp,
    Globe
} from 'lucide-react';
import type { RootState } from '../../store';
import './LandingPage.css';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useSelector((state: RootState) => state.auth);
    const { currentUploadId } = useSelector((state: RootState) => state.app);

    const handleGetStarted = () => {
        if (token) {
            navigate(currentUploadId ? '/dashboard' : '/upload');
        } else {
            navigate('/auth');
        }
    };

    return (
        <div className="landing-page">
            {/* Background Glows */}
            <div className="landing-glow landing-glow-1"></div>
            <div className="landing-glow landing-glow-2"></div>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="container">
                    <div className="hero-badge animate-fade-in">
                        <Sparkles size={16} /> <span>AI-Powered Data Analysis</span>
                    </div>
                    <h1 className="hero-title animate-slide-up">
                        Turn Raw Data into <span className="text-gradient">Actionable Insights</span>
                    </h1>
                    <p className="hero-subtitle animate-slide-up-delay-1">
                        A professional analytics platform for students and researchers. 
                        Upload your CSV/Excel files and let our AI handle the complex visualization and deep-dive analysis.
                    </p>
                    <div className="hero-actions animate-slide-up-delay-2">
                        <button onClick={handleGetStarted} className="btn-primary">
                            {token ? 'Go to Dashboard' : 'Get Started for Free'} <ArrowRight size={18} />
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                            View Live Demo
                        </button>
                    </div>

                    {/* Dashboard Preview / Mockup */}
                    <div className="hero-preview animate-scale-up">
                        <div className="preview-window">
                            <div className="window-header">
                                <div className="window-dots">
                                    <span></span><span></span><span></span>
                                </div>
                                <div className="window-address">data-analyser.io/dashboard</div>
                            </div>
                            <div className="preview-content">
                                <img src="/dashboard_mockup.png" alt="Dashboard Preview" />
                                <div className="preview-overlay">
                                    <div className="overlay-card">
                                        <TrendingUp size={24} color="var(--accent-primary)" />
                                        <span>+24.5% Growth</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Everything you need for <span className="text-gradient">Deep Analysis</span></h2>
                        <p className="section-subtitle">Powerful tools built for precision and clarity.</p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card glass-panel">
                            <div className="feature-icon"><Database size={24} /></div>
                            <h3>CSV/Excel Support</h3>
                            <p>Upload large datasets seamlessly. We support all major structured data formats.</p>
                        </div>
                        <div className="feature-card glass-panel">
                            <div className="feature-icon"><Sparkles size={24} /></div>
                            <h3>AI deep-dive</h3>
                            <p>Auto-detect anomalies, trends, and patterns using our integrated AI engine.</p>
                        </div>
                        <div className="feature-card glass-panel">
                            <div className="feature-icon"><LayoutDashboard size={24} /></div>
                            <h3>Dashboard Builder</h3>
                            <p>Drag and drop widgets to create beautiful, customized analytics dashboards.</p>
                        </div>
                        <div className="feature-card glass-panel">
                            <div className="feature-icon"><Zap size={24} /></div>
                            <h3>Real-time Viz</h3>
                            <p>Experience smooth, high-performance graph rendering with interactive tooltips.</p>
                        </div>
                        <div className="feature-card glass-panel">
                            <div className="feature-icon"><Shield size={24} /></div>
                            <h3>Secure Storage</h3>
                            <p>Your data is encrypted and private. Only you have access to your analysis results.</p>
                        </div>
                        <div className="feature-card glass-panel">
                            <div className="feature-icon"><Globe size={24} /></div>
                            <h3>Export Ready</h3>
                            <p>Generate high-quality PDF reports or export processed data back to Excel.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section className="workflow-section">
                <div className="container">
                    <div className="workflow-container glass-panel">
                        <div className="workflow-steps">
                            <div className="workflow-step">
                                <div className="step-number">01</div>
                                <h3>Upload</h3>
                                <p>Drag and drop your raw CSV or SQLite files.</p>
                            </div>
                            <div className="step-divider"><ArrowRight /></div>
                            <div className="workflow-step">
                                <div className="step-number">02</div>
                                <h3>Analyze</h3>
                                <p>Ask questions in plain English to our AI assistant.</p>
                            </div>
                            <div className="step-divider"><ArrowRight /></div>
                            <div className="workflow-step">
                                <div className="step-number">03</div>
                                <h3>Visualize</h3>
                                <p>Pin charts and notes to your custom dashboard.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-value">99.9%</div>
                            <div className="stat-label">Accuracy</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">10k+</div>
                            <div className="stat-label">Rows Analyzed</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">500ms</div>
                            <div className="stat-label">Response Time</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <div className="logo-group">
                                <Database size={24} color="var(--accent-primary)" />
                                <h3>DataAnalyser</h3>
                            </div>
                            <p>Professional AI Analytics for Seminar & Research Projects.</p>
                        </div>
                        <div className="footer-links">
                            <div className="link-group">
                                <h4>Product</h4>
                                <a href="#features">Features</a>
                                <a href="/dashboard">Dashboard</a>
                                <a href="/upload">Upload</a>
                            </div>
                            <div className="link-group">
                                <h4>Project</h4>
                                <span>Seminar 2026</span>
                                <span>College Project</span>
                                <a href="#">Documentation</a>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© 2026 DataAnalyser Pro. Built with React & FastAPI.</p>
                        <div className="social-links">
                            {/* Icons here */}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
