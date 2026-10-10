'use client';

import React from 'react';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, sans-serif', margin: 0, backgroundColor: '#F7F7F7', color: '#111111' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: '#fff', border: '1px solid #E0E0E0', padding: '3rem', maxWidth: '28rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              Application Error
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {error?.message || 'A critical error occurred. Please try refreshing the page.'}
            </p>
            <button
              onClick={() => reset()}
              style={{
                background: '#111', color: '#fff', border: 'none', padding: '0.625rem 1.25rem',
                fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
