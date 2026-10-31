import { useState } from 'react';
import { UsersRound, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { errorMessage } from '../api.js';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@staffsync.local');
  const [password, setPassword] = useState('StaffSync@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await login(email, password); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return <div className="login-screen">
    <div className="login-decoration"><div className="decor-orb orb-one"/><div className="decor-orb orb-two"/>
      <div className="login-brand"><span className="brand-mark">S</span><span>Staff<span className="brand-light">Sync</span></span></div>
      <div className="login-message"><div className="eyebrow light">PEOPLE. PROGRESS. PURPOSE.</div><h1>Great teams<br/>start with <em>great care.</em></h1><p>A calmer, clearer way to manage your people operations — all in one place.</p>
        <div className="login-feature"><span><UsersRound size={18}/></span><div><strong>People at the centre</strong><small>Everything your team needs to thrive.</small></div></div>
        <div className="login-feature"><span><ShieldCheck size={18}/></span><div><strong>One organised workspace</strong><small>Employee records, attendance and leave.</small></div></div>
      </div><div className="login-decoration-foot">STAFFSYNC • HUMAN RESOURCE MANAGEMENT</div>
    </div>
    <div className="login-panel"><div className="login-form-wrap"><div className="eyebrow">WELCOME BACK</div><h2>Sign in to StaffSync</h2><p className="muted">Enter your work credentials to continue.</p>
      <form onSubmit={submit} className="form-stack">
        <label>Email address<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
        <label>Password<div className="password-wrap"><input type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" className="password-toggle" onClick={()=>setShowPassword(v=>!v)} aria-label="Toggle password visibility">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
        {error && <div className="alert error">{error}</div>}
        <button className="primary-button login-submit" disabled={busy}>{busy?'Signing in…':'Sign in'} <ArrowRight size={17}/></button>
      </form>
      <div className="demo-note"><ShieldCheck size={17}/><div><strong>Demo administrator account</strong><p>For local development only. Change the default password before sharing or deploying this project.</p></div></div>
    </div><div className="login-copyright">© 2026 StaffSync · Built for better workdays</div></div>
  </div>;
}
