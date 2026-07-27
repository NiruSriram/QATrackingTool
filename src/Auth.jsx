import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [requiresPasswordReset, setRequiresPasswordReset] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Initial Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: generatedOTP,
        options: {
          data: {
            otp: generatedOTP,
          },
        },
      });

      if (authError) throw authError;

      if (authData?.user) {
        await supabase.auth.signOut();
        setSuccessMsg('Account created successfully! Check your profiles table for your 6-digit OTP.');
        setIsSigningUp(false);
      }
    } catch (err) {
      setErrorMsg(err?.message || 'An error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Standard Sign In (Checks if forced password update is required)
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();

    // Authenticate with Supabase Auth (works for both 6-digit OTP or user's permanent password)
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password.trim(),
    });

    if (loginError) {
      setErrorMsg('Invalid email or password / OTP.');
      setLoading(false);
      return;
    }

    const user = authData?.user;

    if (user) {
      // Check profile to see if user is logging in with an unredeemed OTP
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('must_change_password')
        .eq('id', user.id)
        .single();

      if (profileErr) {
        console.error("Profile check error:", profileErr);
      }

      // If user must change password, transition immediately to the forced reset screen
      if (profile?.must_change_password) {
        setRequiresPasswordReset(true);
      } else {
        // Standard user — reload or redirect to app dashboard
        window.location.reload();
      }
    }

    setLoading(false);
  };

  // 3. Forced Password Change (Triggered post-OTP login)
  const handleForcePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // Step A: Update password in Supabase Auth system
      const { error: updateAuthErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateAuthErr) throw updateAuthErr;

      // Step B: Mark OTP as redeemed and clear plain-text OTP from profiles
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateProfileErr } = await supabase
        .from('profiles')
        .update({
          must_change_password: false,
          otp_verified: true,
          otp: null,
        })
        .eq('id', user.id);

      if (updateProfileErr) throw updateProfileErr;

      // Step C: Complete — refresh page to launch dashboard
      window.location.reload();
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '80px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'sans-serif', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <h2 style={{ marginTop: 0, textAlign: 'center' }}>
        {requiresPasswordReset 
          ? 'Set New Password' 
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

      {/* VIEW 1: Forced Password Change Screen (Triggers automatically after logging in with temporary OTP) */}
      {requiresPasswordReset ? (
        <form onSubmit={handleForcePasswordChange}>
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '15px' }}>
            You logged in using a temporary OTP. Please create a permanent password to continue.
          </p>

          <div style={{ marginBottom: '15px' }}>
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

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Confirm Password</label>
            <input 
              type="password" 
              placeholder="Re-enter new password"
              required 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{ width: '100%', padding: '10px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? 'Updating Password...' : 'Save Password & Continue'}
          </button>
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

      /* VIEW 3: Standard Sign In (Handles both initial OTP login & standard password login) */
      ) : (
        <form onSubmit={handleSignIn}>
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
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Password or OTP</label>
            <input 
              type="password" 
              placeholder="Enter password or 6-digit OTP"
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

      {/* Navigation Link */}
      {!requiresPasswordReset && (
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px' }}>
          <p 
            style={{ cursor: 'pointer', color: '#1976d2', margin: '5px 0' }} 
            onClick={() => { setIsSigningUp(!isSigningUp); setErrorMsg(''); setSuccessMsg(''); }}
          >
            {isSigningUp ? 'Already registered? Sign In' : "Don't have an account? Sign Up"}
          </p>
        </div>
      )}
    </div>
  );
}