import React from 'react';

const AuthPromptModal = ({ open, onClose, onLogin, onRegister, onVerify, showVerify }) => {
  if (!open) return null;
  return (
    <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.38)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',padding:'2.2em 2.5em',borderRadius:'14px',boxShadow:'0 2px 18px rgba(0,0,0,0.15)',maxWidth:'400px',width:'100%',display:'flex',flexDirection:'column',alignItems:'center'}}>
        <h3 style={{fontSize:'1.3em',fontWeight:700,marginBottom:'0.6em',color:'#1a202c'}}>Action Required</h3>
        <p style={{marginBottom:'1.2em',color:'#374151',textAlign:'center'}}>
          {showVerify
            ? 'You must verify your email before booking or paying for seats.'
            : 'You must log in or create an account to book or pay for seats.'}
        </p>
        <div style={{display:'flex',gap:'1em',marginBottom:'1.2em'}}>
          <button onClick={onLogin} style={{padding:'0.6em 1.3em',borderRadius:'7px',background:'#1a73e8',color:'#fff',border:'none',fontWeight:600,cursor:'pointer'}}>Sign In</button>
          <button onClick={onRegister} style={{padding:'0.6em 1.3em',borderRadius:'7px',background:'#16a34a',color:'#fff',border:'none',fontWeight:600,cursor:'pointer'}}>Sign Up</button>
        </div>
        {showVerify && (
          <button onClick={onVerify} style={{padding:'0.6em 1.3em',borderRadius:'7px',background:'#f59e42',color:'#fff',border:'none',fontWeight:600,cursor:'pointer',marginBottom:'1em'}}>Verify Email</button>
        )}
        <button onClick={onClose} style={{marginTop:'0.5em',background:'none',border:'none',color:'#64748b',fontWeight:500,fontSize:'1em',cursor:'pointer'}}>Close</button>
      </div>
    </div>
  );
};

export default AuthPromptModal;
