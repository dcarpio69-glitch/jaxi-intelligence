'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token    = searchParams.get('token');
    const refresh  = searchParams.get('refresh');
    const error    = searchParams.get('error');
    const provider = searchParams.get('provider');

    if (error) {
      setErrorMsg(decodeURIComponent(error));
      setStatus('error');
      return;
    }

    if (token) {
      // Store tokens
      localStorage.setItem('jaxi_token',   token);
      if (refresh) localStorage.setItem('jaxi_refresh', refresh);

      // Small delay for UX, then redirect
      setTimeout(() => {
        router.replace('/dashboard');
      }, 1200);
    } else {
      setErrorMsg('No token received from authentication provider.');
      setStatus('error');
    }
  }, [searchParams, router]);

  if (status === 'error') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--purple-900)' }}
      >
        <div
          className="text-center p-10 rounded-2xl max-w-md w-full"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-strong)' }}
        >
          <div className="text-5xl mb-5">⚠️</div>
          <h2 className="text-xl font-700 mb-2" style={{ color: 'var(--text-0)' }}>
            Authentication Failed
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>{errorMsg}</p>
          <a
            href="/login"
            className="btn btn-lime w-full justify-center"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{ background: 'var(--purple-900)' }}
    >
      {/* Logo */}
      <div className="flex flex-col gap-0.5">
        <div className="flex gap-1">
          <div className="w-5 h-5 rounded" style={{ background: 'var(--lime)' }} />
          <div className="w-5 h-5 rounded" style={{ background: 'var(--lime)' }} />
        </div>
        <div className="flex gap-1">
          <div className="w-5 h-5 rounded" style={{ background: 'var(--lime)', opacity: 0.7 }} />
          <div className="w-5 h-5 rounded" style={{ background: 'var(--lime)', opacity: 0.4 }} />
        </div>
      </div>

      {/* Spinner */}
      <div className="relative w-12 h-12">
        <div
          className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `var(--lime) transparent transparent transparent` }}
        />
      </div>

      <div className="text-center">
        <p className="font-600 text-lg" style={{ color: 'var(--text-0)' }}>
          Authenticating…
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          Loading your projects from Procore
        </p>
      </div>
    </div>
  );
}
