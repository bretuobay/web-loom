import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Web Loom — Framework-Agnostic MVVM Architecture';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px 96px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.08) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '48px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '16px',
              boxShadow: '0 0 0 1px rgba(99,102,241,0.4)',
            }}
          >
            <span style={{ color: 'white', fontSize: '28px', fontWeight: '800' }}>W</span>
          </div>
          <span style={{ color: '#e2e8f0', fontSize: '28px', fontWeight: '600', letterSpacing: '-0.5px' }}>
            Web<span style={{ color: '#60a5fa' }}>.loom</span>
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            color: '#f1f5f9',
            fontSize: '58px',
            fontWeight: '800',
            margin: '0 0 24px 0',
            lineHeight: '1.1',
            maxWidth: '880px',
            letterSpacing: '-1.5px',
          }}
        >
          Framework-Agnostic MVVM for the Modern Web
        </h1>

        {/* Subline */}
        <p
          style={{
            color: '#94a3b8',
            fontSize: '26px',
            margin: '0 0 48px 0',
            lineHeight: '1.4',
            maxWidth: '760px',
          }}
        >
          34 packages. One ViewModel — React, Vue, Angular, Lit, Marko, Svelte, React Native.
        </p>

        {/* Framework pills */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {['React', 'Vue', 'Angular', 'Svelte', 'Lit', 'Vanilla'].map((fw) => (
            <div
              key={fw}
              style={{
                background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: '9999px',
                padding: '6px 18px',
                color: '#93c5fd',
                fontSize: '18px',
                fontWeight: '500',
              }}
            >
              {fw}
            </div>
          ))}
        </div>

        {/* Bottom-right URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            right: '96px',
            color: '#475569',
            fontSize: '20px',
            letterSpacing: '0.5px',
          }}
        >
          webloom.dev
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
