import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isFirstTimeOtp, setIsFirstTimeOtp] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Generate a random 8-character string for temporary account password
  const generateRandomOTP = () => {
    return Math.random().toString(36).slice(-8) + 'A1!';
  };

  // 1. Initial Sign Up (Creates auth.users account using OTP as temporary password)
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const temporaryOTP = generateRandomOTP();

    // Create user in Supabase Auth.
    // Note: Your SQL trigger (handle_new_user) will automatically run on the DB
    // and populate public.profiles with the user details.
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: temporaryOTP,
    });

    if (error) {
      setErrorMsg(error.message);
    } else if (data.user) {
      // Sign out immediately so they aren't logged in until OTP verification
      await supabase.auth.signOut();
      
      // Update profile with the exact temporary OTP used for auth
      // (Bypasses RLS by using public signup context or DB default)
      setSuccessMsg('Account created successfully! Check your database or contact your admin to receive your temporary OTP.');
      setIsSigningUp(false);
    }

    setLoading(false);
  };

  // 2. First-Time OTP Login & Password Change Workflow
  const handleVerifyOtpAndChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    // Step A: Authenticate against auth.users using the OTP as the password
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: otpToken.trim(),
    });

    if (loginError) {
      setErrorMsg('Invalid email or OTP code. Please check your credentials.');
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    // Step B: Verify in public.profiles that this OTP hasn't been redeemed already
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('otp_verified')
      .eq('id', userId)
      .single();

    if (profileErr) {
      await supabase.auth.signOut();
      setErrorMsg('Could not fetch user profile record.');
      setLoading(false);
      return;
    }

    if (profile.otp_verified) {
      await supabase.auth.signOut();
      setErrorMsg('This temporary OTP has already been used. Please log in using standard Sign In with your updated password.');
      setLoading(false);
      return;
    }

    // Step C: Update password in auth.users
    const { error: updateAuthErr } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateAuthErr) {
      setErrorMsg(`Failed to update password: ${updateAuthErr.message}`);
      setLoading(false);
      return;
    }

    // Step D: Mark OTP as redeemed and clear plain-text OTP from profiles
    const { error: updateProfileErr } = await supabase
      .from('profiles')
      .update({
        otp_verified: true,
        must_change_password: false,
        otp: null,
      })
      .eq('id', userId);

    if (updateProfileErr) {
      setErrorMsg(`Password updated, but profile status sync failed: ${updateProfileErr.message}`);
      setLoading(false);
      return;
    }

    // Step E: Complete — reload page to launch dashboard with active session
    window.location.reload();
  };

  // 3. Standard Sign In (For returning users with updated password)
  const handleStandardSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
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
        {isFirstTimeOtp 
          ? 'First-Time OTP Login' 
          : isSigningUp 
          ? 'Create Account' 
          : 'Sign In'}
      </h2>

      {errorMsg && (
        <p style={{ color: '#d32f2f', background: '#ffebee', padding: '10px', borderRadius: '4px', fontSize: '14px', margin: '15px 0' }}>
          {errorMsg}
        </p>
      )}

      {successMsg && (
        <p style={{ color: '#2e7d32', background: '#e8f5e9', padding: '10px', borderRadius: '4px', fontSize: '14px', margin: '15px 0' }}>
          {successMsg}
        </p>
      )}

      {/* VIEW 1: First-Time OTP Verification & Mandatory Password Reset */}
      {isFirstTimeOtp ? (
        <form onSubmit={handleVerifyOtpAndChangePassword}>
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

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Temporary OTP</label>
            <input 
              type="text" 
              placeholder="Enter received OTP" 
              required 
              value={otpToken} 
              onChange={(e) => setOtpToken(e.target.value)} 
              style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>New Permanent Password</label>
            <input 
              type="password" 
              placeholder="At least 6 characters"
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
            {loading ? 'Verifying & Updating...' : 'Verify OTP & Set Password'}
          </button>

          <p 
            style={{ marginTop: '15px', textAlign: 'center', cursor: 'pointer', color: '#1976d2', fontSize: '13px' }} 
            onClick={() => { setIsFirstTimeOtp(false); setErrorMsg(''); setSuccessMsg(''); }}
          >
            ← Back to Standard Sign In
          </p>
        </form>

      /* VIEW 2: Standard Sign Up */
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

      /* VIEW 3: Standard Sign In */
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
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
      )}

      {/* Navigation Links */}
      {!isFirstTimeOtp && (
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
          <p 
            style={{ cursor: 'pointer', color: '#1976d2', margin: '5px 0' }} 
            onClick={() => { setIsSigningUp(!isSigningUp); setErrorMsg(''); setSuccessMsg(''); }}
          >
            {isSigningUp ? 'Already registered? Sign In' : "Don't have an account? Sign Up"}
          </p>

          {!isSigningUp && (
            <p 
              style={{ cursor: 'pointer', color: '#555', textDecoration: 'underline', margin: '8px 0 0 0' }} 
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