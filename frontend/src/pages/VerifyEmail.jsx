import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-email`, { code });
      setMsg('Email verified! Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-email" style={{maxWidth:'420px',margin:'3em auto',padding:'2em',background:'#fff',borderRadius:'12px',boxShadow:'0 2px 12px rgba(0,0,0,0.07)',display:'flex',flexDirection:'column',alignItems:'center'}}>
      <h2 style={{fontSize:'2rem',fontWeight:700,marginBottom:'0.8rem',color:'#1a202c'}}>Verify Email</h2>
      <form onSubmit={handleSubmit} style={{width:'100%',display:'flex',flexDirection:'column',gap:'1em'}}>
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="Enter verification code" required style={{padding:'0.7em',fontSize:'1.1em',borderRadius:'7px',border:'1px solid #cbd5e1'}} autoFocus autoComplete="off" />
        <button type="submit" disabled={loading} style={{padding:'0.7em',fontWeight:600,borderRadius:'7px',background:'#1a73e8',color:'#fff',border:'none',fontSize:'1.1em',cursor:loading?'not-allowed':'pointer'}}>Verify</button>
      </form>
      <div style={{marginTop:'1em',color:msg.includes('verified')?'#16a34a':'#dc2626',fontWeight:500}}>{msg}</div>
      <p style={{fontSize:'0.97em',marginTop:'1.5em',color:'#64748b'}}>Enter the exact code sent to your email. Code is case-sensitive and may contain both letters and numbers.</p>
    </div>
  );
};
export default VerifyEmail;
