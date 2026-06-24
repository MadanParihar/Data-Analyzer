import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../store';
import { uploadDatabase, appendDatabase } from '../../features/appSlice';
import { Plus, Database, Sparkles } from 'lucide-react';

const Home: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cleanMode, setCleanMode] = useState(false);

  // If a dataset is already loaded, uploads ADD to it (accumulate) instead of
  // replacing — old data stays available.
  const currentUploadId = useSelector((state: RootState) => state.app.currentUploadId);

  const handleUpload = async (filesArg: FileList | null, clean: boolean) => {
    const filesToUpload = filesArg || selectedFiles;
    if (!filesToUpload || filesToUpload.length === 0) return;

    setError(null);
    console.log(`Sending upload request (Clean Mode: ${clean}, append: ${!!currentUploadId})...`);

    try {
      if (currentUploadId) {
        // Append each file as a new table in the existing session.
        for (const file of Array.from(filesToUpload)) {
          await dispatch(appendDatabase({ file, uploadId: currentUploadId, clean })).unwrap();
        }
      } else {
        // No active session — create a fresh one.
        await dispatch(uploadDatabase({ files: filesToUpload, clean })).unwrap();
      }
      navigate("/dashboard");
    } catch (err: any) {
      // Thunks reject with the real backend message (string); show it, and
      // crucially leave any existing dataset intact (no preemptive reset).
      console.error("Upload failed", err);
      setError(typeof err === 'string' ? err : (err?.message || 'Upload failed. Please try again.'));
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
          accept=".sqlite,.db,.csv,.xlsx,.xls,.json"
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
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.background = 'var(--bg-elevated)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.background = 'var(--bg-secondary)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
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
                Quickly upload your CSV, Excel, JSON, DB, or SQLite files and start analyzing immediately.
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
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.background = 'var(--bg-elevated)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.background = 'var(--bg-secondary)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
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
          <div style={{ marginTop: '24px', color: 'var(--error)', background: 'var(--error-light)', padding: '12px 20px', borderRadius: 'var(--radius-md)', fontSize: '14px' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
