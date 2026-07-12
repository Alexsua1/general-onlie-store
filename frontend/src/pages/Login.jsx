import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context';

export default function Login() {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('jane@example.com');
  const [password, setPassword] = useState('password');
  const [name, setName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [error, setError] = useState('');
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const doLogin = async () => {
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (e) {
      setError(e.message);
    }
  };

  const doSignup = async () => {
    setError('');
    if (!name || !suEmail || !suPassword) { setError('Fill in all fields'); return; }
    try {
      await signup(name, suEmail, suPassword);
      navigate('/', { replace: true });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="screen active" style={{ flexDirection: 'column' }}>
      <div className="auth-wrap">
        <div className="auth-logo">
          <div className="badge">🛒</div>
          <h1>General Online Store</h1>
          <p>Everything you need, one cart</p>
        </div>
        <div className="auth-card">
          <div className="auth-tabs">
            <div className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Log In</div>
            <div className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>Sign Up</div>
          </div>

          {tab === 'login' ? (
            <div>
              <div className="field"><label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field"><label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <div className="field-error">{error}</div>}
              <button className="primary-btn" onClick={doLogin}>Log In</button>
              <div className="demo-note">
                Demo admin: <b>admin@store.com</b> / <b>admin123</b><br />
                Demo customer: <b>jane@example.com</b> / <b>password</b>
              </div>
            </div>
          ) : (
            <div>
              <div className="field"><label>Full name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="field"><label>Email</label>
                <input type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div className="field"><label>Password</label>
                <input type="password" value={suPassword} onChange={(e) => setSuPassword(e.target.value)} placeholder="Create a password" />
              </div>
              {error && <div className="field-error">{error}</div>}
              <button className="primary-btn" onClick={doSignup}>Create Account</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
