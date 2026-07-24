// ConfirmEmail.jsx
import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function ConfirmEmail({ onConfirmed }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      // Parse the query/hash params from the URL bar
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        // Exchange the PKCE auth code for an active session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
      } else {
        // If Supabase passed implicit hash fragments (#access_token=...)
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          throw new Error('No valid authentication token found in URL.');
        }
      }

      setSuccess(true);
      // Clean up the messy tokens from the address bar
      window.history.replaceState({}, document.title, window.location.pathname);

      // Notify parent component to refresh session state after 1.5 seconds
      setTimeout(() => {
        if (onConfirmed) onConfirmed();
      }, 1500);

    } catch (err) {
      setErrorMsg(err.message || 'Failed to verify email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '80px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>✉️ Confirm Your Email</h2>
      <p style={{ color: '#555', marginBottom: '25px' }}>
        Click the button below to finish creating your account and log into the QA Tracker.
      </p>

      {errorMsg && (
        <p style={{ color: '#d32f2f', background: '#ffebee', padding: '10px', borderRadius: '4px', fontSize: '14px' }}>
          {errorMsg}
        </p>
      )}

      {success ? (
        <div style={{ color: '#2e7d32', background: '#e8f5e9', padding: '15px', borderRadius: '4px', fontWeight: 'bold' }}>
          ✅ Email confirmed! Redirecting to dashboard...
        </div>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%'
          }}
        >
          {loading ? 'Verifying...' : 'Click Here to Complete Sign Up'}
        </button>
      )}
    </div>
  );
}