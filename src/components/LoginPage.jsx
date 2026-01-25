/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useState } from 'react';
import c from 'clsx';
import MoiBookLogo from './MoiBookLogo';
import QRCode from 'qrcode';

const loginDetails = {
  master: {
    title: 'Admin / Master login',
    tabTitle: 'Master',
    userLabel: 'பயனாளர் பெயர்',
    passLabel: 'கடவுச்சொல்',
    userPlaceholder: '',
    passPlaceholder: ''
  },
  table: {
    title: 'Table login',
    tabTitle: 'Table User',
    userLabel: 'பயனாளர் பெயர்',
    passLabel: 'கடவுச்சொல்',
    userPlaceholder: '',
    passPlaceholder: ''
  }
};

const numberToWord = (num) => {
    const words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    return words[num - 1];
};


export default function LoginPage({ onLoginSuccess }) {
  const [loginType, setLoginType] = useState('master');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrUrl, setQrUrl] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.location.origin || '';
  });
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrError, setQrError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert('பயனாளர் பெயர் மற்றும் கடவுச்சொல்லை உள்ளிடவும்');
      return;
    }
    
    if (loginType === 'master' && password === '1234') {
      if (username === 'admin') {
        onLoginSuccess('master', 'admin');
      } else if (username === 'master') {
        onLoginSuccess('master', 'master');
      } else {
        alert('தவறான பயனாளர் பெயர் அல்லது கடவுச்சொல்');
      }
    } else if (loginType === 'table') {
        const tableUserMatch = username.match(/^table([1-9]|10)$/);
        if (tableUserMatch) {
            const tableNumber = parseInt(tableUserMatch[1], 10);
            const expectedPassword = `table@${numberToWord(tableNumber)}`;
            if (password === expectedPassword) {
                onLoginSuccess('table', username);
                return;
            }
        }
        alert('தவறான பயனாளர் பெயர் அல்லது கடவுச்சொல்');
    } else {
        alert('தவறான பயனாளர் பெயர் அல்லது கடவுச்சொல்');
    }
  };
  
  const handleExit = () => {
    setUsername('');
    setPassword('');
  };

  const isLocalhost = /localhost|127\.0\.0\.1/i.test(qrUrl);

  useEffect(() => {
    let isActive = true;
    const generateQr = async () => {
      if (!showQrModal) return;
      const value = qrUrl.trim();
      if (!value) {
        setQrDataUrl('');
        return;
      }
      try {
        setQrError('');
        const dataUrl = await QRCode.toDataURL(value, { width: 240, margin: 1 });
        if (isActive) setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('QR generate failed', err);
        if (isActive) {
          setQrDataUrl('');
          setQrError('QR உருவாக்க முடியவில்லை.');
        }
      }
    };

    generateQr();
    return () => {
      isActive = false;
    };
  }, [showQrModal, qrUrl]);

  const currentLogin = loginDetails[loginType];

  return (
    <div className="login-container">
      <header className="logo-container">
        <MoiBookLogo size="xlarge" variant="default" />
      </header>

      <main className="login-box">
        <div className="login-tabs">
          {Object.entries(loginDetails).map(([key, { tabTitle }]) => (
            <button 
              key={key}
              className={c('tab-button', { active: loginType === key })}
              onClick={() => {
                setLoginType(key);
                handleExit(); // Clear fields on tab switch
              }}
              aria-pressed={loginType === key}
            >
              {tabTitle}
            </button>
          ))}
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <h2 className="form-title">{currentLogin.title}</h2>
          <div className="input-group">
            <label htmlFor="username">{currentLogin.userLabel}</label>
            <input 
              type="text" 
              id="username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={currentLogin.userPlaceholder} 
              aria-label={currentLogin.userLabel}
              required 
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">{currentLogin.passLabel}</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={currentLogin.passPlaceholder} 
              aria-label={currentLogin.passLabel}
              required 
            />
          </div>
          <div className="button-group">
            <button type="submit" className="button">உள் நுழை</button>
            <button type="button" className="button" onClick={handleExit}>வெளியேறு</button>
          </div>
          <div className="button-group" style={{ marginTop: '0.75rem' }}>
            <button type="button" className="button" onClick={() => setShowQrModal(true)}>📱 மொபைல் QR</button>
          </div>
        </form>
      </main>

      {showQrModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowQrModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>மொபைல் Open QR</h3>
              <button type="button" className="icon-button" onClick={() => setShowQrModal(false)} aria-label="Close">
                <span className="icon">close</span>
              </button>
            </div>
            <div className="modal-body" style={{ flexDirection: 'column', gap: '12px' }}>
              <label htmlFor="qr-url">Mobile URL</label>
              <input
                id="qr-url"
                type="text"
                value={qrUrl}
                onChange={(e) => setQrUrl(e.target.value)}
                placeholder="http://192.168.1.5:3000"
              />
              {isLocalhost && (
                <div style={{ fontSize: '0.9rem', color: '#b45309' }}>
                  localhost/127.0.0.1 மொபைலில் வேலை செய்யாது. உங்கள் PC‑இன் IP address‑ஐ இங்கே மாற்றவும்.
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', minHeight: '250px', alignItems: 'center' }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Mobile QR" style={{ width: 240, height: 240 }} />
                ) : (
                  <span>QR உருவாக்கப்படுகிறது...</span>
                )}
              </div>
              {qrError && <div style={{ color: '#b91c1c' }}>{qrError}</div>}
              <div style={{ fontSize: '0.95rem', color: '#444' }}>
                மொபைல் camera/QR app‑ல் scan செய்து browser‑ல் open செய்யவும்.
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="footer login-footer">
        <p>© 2025 MoiBookApp</p>
      </footer>
    </div>
  );
}