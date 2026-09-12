import React from 'react';

export function PlaceholderView({ title }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <h2>{title}</h2>
      <p style={{ marginTop: '16px' }}>This feature is coming soon.</p>
    </div>
  );
}
