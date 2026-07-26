import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false); // Step 2: OTP screen
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Send OTP / Handle Sign Up or Sign In
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (isSigningUp) {
      // Step A: Register user (Supabase emails a 6-digit OTP code)
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        // Show OTP code input screen
        setIsVerifyingOtp(true);
      }
    } else {
      // Step B: Sign In directly
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      }
    }

    setLoading(false);
  };

  // 2. Verify 6-Digit OTP Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpToken.trim(),
      type: 'signup',
    });

    if (error) {
      setErrorMsg(error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'sans-serif', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <h2 style={{ marginTop: 0, textAlign: 'center' }}>
        {isVerifyingOtp ? 'Enter Security Code' : isSigningUp ? 'Create Account' : 'Sign In'}
      </h2>

      {errorMsg && (
        <p style={{ color: '#d32f2f', background: '#ffebee', padding: '8px', borderRadius: '4px', fontSize: '14px' }}>
          {errorMsg}
        </p>
      )}

      {/* VIEW 1: Enter 6-Digit OTP Code */}
      {isVerifyingOtp ? (
        <form onSubmit={handleVerifyOtp}>
          <p style={{ fontSize: '14px', color: '#555', textAlign: 'center' }}>
            We emailed a 6-digit security code to <strong>{email}</strong>. Enter it below to complete sign-up.
          </p>
          <div style={{ marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="e.g. 123456" 
              required 
              value={otpToken} 
              onChange={(e) => setOtpToken(e.target.value)} 
              style={{ width: '100%', padding: '10px', fontSize: '18px', textAlign: 'center', letterSpacing: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            style={{ width: '100%', padding: '10px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Verifying...' : 'Verify & Log In'}
          </button>
          <p 
            style={{ marginTop: '15px', textAlign: 'center', cursor: 'pointer', color: '#1976d2', fontSize: '13px' }} 
            onClick={() => setIsVerifyingOtp(false)}
          >
            ← Back to Sign In
          </p>
        </form>
      ) : (
        /* VIEW 2: Standard Sign In / Sign Up Form */
        <form onSubmit={handleAuth}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            style={{ width: '100%', padding: '10px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Processing...' : isSigningUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
      )}

      {!isVerifyingOtp && (
        <p 
          style={{ marginTop: '20px', textAlign: 'center', cursor: 'pointer', color: '#1976d2', fontSize: '14px' }} 
          onClick={() => { setIsSigningUp(!isSigningUp); setErrorMsg(''); }}
        >
          {isSigningUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </p>
      )}
    </div>
  );
}