import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, signupUser, clearError } from '../../features/authSlice';
import type { RootState, AppDispatch } from '../../store';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import './AuthPage.css';

type AuthMode = 'login' | 'signup';

const AuthPage: React.FC = () => {
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { loading, error, user } = useSelector((state: RootState) => state.auth);
    const { currentUploadId } = useSelector((state: RootState) => state.app);

    useEffect(() => {
        if (user) {
            navigate(currentUploadId ? '/dashboard' : '/upload');
        }
    }, [user, navigate, currentUploadId]);

    // Clear errors when switching modes
    useEffect(() => {
        dispatch(clearError());
    }, [authMode, dispatch]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (authMode === 'login') {
            dispatch(loginUser({ email, password }));
        } else {
            dispatch(signupUser({ email, password }));
        }
    };

    const displayError = typeof error === 'string' ? error : null;

    return (
        <div className="auth-container">
            {/* Error Toast - Floating Popup */}
            {displayError && (
                <div style={{
                    position: 'fixed',
                    top: '32px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#ef4444',
                    padding: '16px 28px',
                    borderRadius: '12px',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 8px 32px rgba(239, 68, 68, 0.25)',
                    fontSize: '15px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'slideDown 0.3s ease-out',
                    whiteSpace: 'nowrap',
                }}>
                    {displayError}
                </div>
            )}

            <div className="auth-sidebar">
                <div className="auth-form-wrapper">

                    <form onSubmit={handleSubmit}>
                        <div className="auth-header">
                            <h1 className="auth-title">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
                            <p className="auth-subtitle">
                                {authMode === 'login' ? 'Enter your details to access your workspace' : 'Start your data journey with us'}
                            </p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@company.com"
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    minLength={authMode === 'signup' ? 8 : 1}
                                    autoComplete={authMode === 'login' ? "current-password" : "new-password"}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {authMode === 'signup' && (
                                <p className="password-hint">Min 8 chars, 1 uppercase, 1 number, 1 special char</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="auth-button btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Loader2 className="animate-spin" size={18} /> Processing...
                                </span>
                            ) : (
                                authMode === 'login' ? 'Sign In' : 'Sign Up'
                            )}
                        </button>
                    </form>

                    <div className="toggle-auth">
                        {authMode === 'login' ? (
                            <>Don't have an account? <span className="toggle-link" onClick={() => setAuthMode('signup')}>Sign up</span></>
                        ) : (
                            <>Already have an account? <span className="toggle-link" onClick={() => setAuthMode('login')}>Sign in</span></>
                        )}
                    </div>
                </div>
            </div>

            <div className="auth-illustration">
                <div className="auth-glow"></div>
                <img
                    src="/undraw_login.svg"
                    alt="Data Analysis Illustration"
                    className="illustration-img"
                />
            </div>
        </div>
    );
};

export default AuthPage;
