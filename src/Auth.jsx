import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isFirstTimeOtp, setIsFirstTimeOtp] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Initial Sign Up (Email Only)
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Dummy temporary password for initial creation
    const tempPassword = `Temp_${Math.random().toString(36).slice(-8)}!`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password: tempPassword,
    });

    if (error) {
      setErrorMsg(error.message);
    } else if (data.user) {
      // Force sign out so session isn't accessible yet
      await supabase.auth.signOut();
      setSuccessMsg('Sign-up submitted! The administrator will email you your standard OTP code shortly.');
      setIsSigningUp(false);
    }

    setLoading(false);
  };

  // 2. First Time OTP Verification & Password Update Workflow
  const handleVerifyOtpAndLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Lookup profile to check OTP
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.trim())
      .single();

    if (profileErr || !profile) {
      setErrorMsg('User not found. Please verify your email address.');
      setLoading(false);
      return;
    }

    if (profile.otp_verified) {
      setErrorMsg('This OTP has already been used. Please log in with your email and password.');
      setLoading(false);
      return;
    }

    if (profile.otp !== otpToken.trim()) {
      setErrorMsg('Invalid OTP code. Please check your email or contact the admin.');
      setLoading(false);
      return;
    }

    // OTP Match -> Switch to Password Reset View
    setIsChangingPassword(true);
    setLoading(false);
  };

  // 3. Set New Password after Valid OTP
  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    // Update user's auth password in Supabase
    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateErr) {
      setErrorMsg(updateErr.message);
      setLoading(false);
      return;
    }

    // Invalidate OTP in Database
    await supabase
      .from('profiles')
      .update({ otp: null, otp_verified: true, must_change_password: false })
      .eq('email', email.trim());

    // Refresh Session
    window.location.reload();
  };

  // 4. Standard Sign In (Email + Password)
  const handleStandardSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'sans-serif', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <h2 style={{ marginTop: 0, textAlign: 'center' }}>
        {isChangingPassword 
          ? 'Set Your Password' 
          : isFirstTimeOtp 
          ? 'Enter Manual OTP' 
          : isSigningUp 
          ? 'Create Account' 
          : 'Sign In'}
      </h2>

      {errorMsg && (
        <p style={{ color: '#d32f2f', background: '#ffebee', padding: '8px', borderRadius: '4px', fontSize: '14px' }}>
          {errorMsg}
        </p>
      )}

      {successMsg && (
        <p style={{ color: '#2e7d32', background: '#e8f5e9', padding: '8px', borderRadius: '4px', fontSize: '14px' }}>
          {successMsg}
        </p>
      )}

      {/* VIEW 1: Set New Password after OTP */}
      {isChangingPassword ? (
        <form onSubmit={handleSetNewPassword}>
          <p style={{ fontSize: '14px', color: '#555' }}>
            OTP verified! Please set a permanent password for your account.
          </p>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>New Password</label>
            <input 
              type="password" 
              required 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            style={{ width: '100%', padding: '10px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Saving...' : 'Set Password & Launch Dashboard'}
          </button>
        </form>

      /* VIEW 2: Verify OTP First Time */
      ) : isFirstTimeOtp ? (
        <form onSubmit={handleVerifyOtpAndLogin}>
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
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>6-Digit OTP</label>
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
            {loading ? 'Verifying...' : 'Validate OTP'}
          </button>
          <p 
            style={{ marginTop: '15px', textAlign: 'center', cursor: 'pointer', color: '#1976d2', fontSize: '13px' }} 
            onClick={() => setIsFirstTimeOtp(false)}
          >
            ← Back to Standard Sign In
          </p>
        </form>

      /* VIEW 3: Standard Sign Up (Email Only) */
      ) : isSigningUp ? (
        <form onSubmit={handleSignUp}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            style={{ width: '100%', padding: '10px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Processing...' : 'Request Sign Up'}
          </button>
        </form>

      /* VIEW 4: Standard Sign In */
      ) : (
        <form onSubmit={handleStandardSignIn}>
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
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>
      )}

      {/* Navigation Footers */}
      {!isChangingPassword && !isFirstTimeOtp && (
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
          <p 
            style={{ cursor: 'pointer', color: '#1976d2', margin: '5px 0' }} 
            onClick={() => { setIsSigningUp(!isSigningUp); setErrorMsg(''); setSuccessMsg(''); }}
          >
            {isSigningUp ? 'Already registered? Sign In' : "Don't have an account? Sign Up"}
          </p>
          {!isSigningUp && (
            <p 
              style={{ cursor: 'pointer', color: '#555', textDecoration: 'underline', margin: '5px 0' }} 
              onClick={() => { setIsFirstTimeOtp(true); setErrorMsg(''); setSuccessMsg(''); }}
            >
              First time logging in with an OTP? Click here
            </p>
          )}
        </div>
      )}
    </div>
  );
}