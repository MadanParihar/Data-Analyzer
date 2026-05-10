import React, { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch } from '../../store';
import { uploadDatabase, resetSession } from '../../features/appSlice'; // Added resetSession // Updated import
import { Plus, Database, Loader2, ChevronDown, Sparkles } from 'lucide-react';

const Home: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cleanMode, setCleanMode] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);

  const handleUpload = async (filesArg: FileList | null, clean: boolean) => {
    // ... existing implementation ...
    const filesToUpload = filesArg || selectedFiles;
    if (!filesToUpload || filesToUpload.length === 0) return;

    // Reset previous session state to avoid ghost data
    dispatch(resetSession());

    setUploading(true);
    console.log(`Sending upload request (Clean Mode: ${clean})...`);

    try {
      await dispatch(uploadDatabase({ files: filesToUpload, clean })).unwrap();
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Upload failed", error);
      setError("Upload failed. Please try again.");
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input changed");
    if (e.target.files && e.target.files.length > 0) {
      console.log(`Files selected: ${e.target.files.length}`);
      setSelectedFiles(e.target.files);
      // Auto trigger upload with current mode
      handleUpload(e.target.files, cleanMode);
    } else {
      console.log("No files in target");
    }
    // Reset value to allow re-selection
    e.target.value = '';
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center', // Center vertically
    minHeight: 'calc(100vh - 64px)', // Account for navbar
    width: '100%',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: '40px'
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: 600,
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    width: '240px',
    justifyContent: 'center',
    boxShadow: '0 8px 30px rgba(59, 130, 246, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    marginTop: '16px'
  };

  return (
    <div style={containerStyle}>
      <div className="background-glow glow-blue" style={{ opacity: 0.5 }}></div>
      <div className="background-glow glow-blue" style={{ opacity: 0.5 }}></div>

      <div style={{ zIndex: 10, textAlign: 'center' }}>
        <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="icon-wrapper accent-glow animate-fade-in" style={{ width: '64px', height: '64px', marginBottom: '24px' }}>
            <Database className="icon" style={{ width: '32px', height: '32px' }} />
          </div>
          <h1 className="hero-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Data Analyser
          </h1>
          <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Upload your data and start asking questions in natural language.
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          id="file-upload"
          className="hidden"
          style={{ display: 'none' }}
          accept=".sqlite,.db,.csv,.xlsx,.xls"
          multiple
        />

        {/* Header buttons removed - moved to Global Navbar */}
        <div style={{ height: '24px' }}></div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '24px',
          padding: '0 20px',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          zIndex: 10
        }}>
          {/* Standard Add Card */}
          <div 
            className="glass-panel animate-fade-in" 
            onClick={() => { setCleanMode(false); fileInputRef.current?.click(); }}
            style={{
              animationDelay: '0.3s',
              flex: '1',
              minWidth: '280px',
              maxWidth: '400px',
              padding: '32px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '20px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <Plus size={32} />
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Standard Add</h3>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Quickly upload your CSV, Excel, DB, or SQLite files and start analyzing immediately.
              </p>
            </div>
            <div style={{ 
              marginTop: 'auto',
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--accent-primary)'
            }}>
              Choose Files
            </div>
          </div>

          {/* Clean & Add Card */}
          <div 
            className="glass-panel animate-fade-in" 
            onClick={() => { setCleanMode(true); fileInputRef.current?.click(); }}
            style={{
              animationDelay: '0.4s',
              flex: '1',
              minWidth: '280px',
              maxWidth: '400px',
              padding: '32px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '20px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981'
            }}>
              <Sparkles size={32} />
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Clean & Add</h3>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Let our AI fix formatting, handle missing values, and optimize your data.
              </p>
            </div>
            <div style={{ 
              marginTop: 'auto',
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.05)',
              fontSize: '14px',
              fontWeight: 600,
              color: '#10b981'
            }}>
              AI-Powered Upload
            </div>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '24px', color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px 20px', borderRadius: '8px', fontSize: '14px' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
