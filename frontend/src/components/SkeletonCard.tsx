import '../index.css';

// Inline keyframe animation for the shimmer effect
const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--input-bg) 25%, var(--border) 50%, var(--input-bg) 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.4s ease-in-out infinite',
  borderRadius: '6px',
};

export default function SkeletonCard() {
  return (
    <>
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Matches .glass-card layout used by real result cards */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          paddingRight: '1rem',
        }}
        aria-hidden="true"
      >
        {/* Left content block */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {/* Food item title line */}
          <div style={{ ...shimmerStyle, height: '1.2rem', width: '55%' }} />
          {/* Restaurant name line */}
          <div style={{ ...shimmerStyle, height: '1rem', width: '40%' }} />
          {/* Meta row (distance + price) */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ ...shimmerStyle, height: '0.85rem', width: '90px' }} />
            <div style={{ ...shimmerStyle, height: '0.85rem', width: '70px' }} />
          </div>
        </div>

        {/* Right button placeholder */}
        <div
          style={{
            ...shimmerStyle,
            height: '2.6rem',
            width: '110px',
            borderRadius: '100px',
            flexShrink: 0,
            marginLeft: '1rem',
          }}
        />
      </div>
    </>
  );
}
