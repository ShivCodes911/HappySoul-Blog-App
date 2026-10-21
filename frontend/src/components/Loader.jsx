export default function Loader({ fullPage = true, message = 'RETRIEVING DISPATCHES…' }) {
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 36,
          height: 36,
          border: '3px solid var(--clr-border-medium)',
          borderTopColor: 'var(--clr-border-strong)',
          borderRightColor: 'var(--clr-secondary)',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      {message && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--clr-text-2)',
            textTransform: 'uppercase',
          }}
        >
          {message}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      {content}
    </div>
  );
}
