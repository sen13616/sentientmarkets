export default function Loading() {
  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.15} }
        .sk { background: rgba(255,255,255,0.07); border-radius: 6px; animation: pulse 1.8s ease-in-out infinite; }
      `}</style>

      {/* nav */}
      <div style={{ height: 54, background: 'rgba(7,9,13,0.94)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 32px', gap: 14 }}>
        <div className="sk" style={{ width: 160, height: 16 }} />
        <div className="sk" style={{ flex: 1, maxWidth: 380, height: 32, borderRadius: 7 }} />
        <div className="sk" style={{ width: 72, height: 30, borderRadius: 6 }} />
      </div>

      {/* header */}
      <div style={{ padding: '32px 32px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="sk" style={{ width: 120, height: 52 }} />
          <div className="sk" style={{ width: 180, height: 14 }} />
          <div className="sk" style={{ width: 140, height: 12 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div className="sk" style={{ width: 140, height: 44 }} />
          <div className="sk" style={{ width: 120, height: 14 }} />
        </div>
      </div>

      {/* score section */}
      <div style={{ padding: '36px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="sk" style={{ width: 200, height: 120, borderRadius: 8 }} />
          <div className="sk" style={{ width: '100%', height: 6, borderRadius: 4 }} />
        </div>
        <div className="sk" style={{ height: 180, borderRadius: 10 }} />
      </div>

      {/* signal grid */}
      <div style={{ padding: '36px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="sk" style={{ width: 80, height: 10, marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[0,1,2].map(i => (
            <div key={i} className="sk" style={{ height: 220, borderRadius: 10 }} />
          ))}
        </div>
      </div>

      {/* news */}
      <div style={{ padding: '36px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="sk" style={{ width: 80, height: 10, marginBottom: 20 }} />
        <div className="sk" style={{ height: 200, borderRadius: 10 }} />
      </div>

      {/* fundamentals */}
      <div style={{ padding: '36px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="sk" style={{ width: 100, height: 10, marginBottom: 20 }} />
        <div className="sk" style={{ height: 180, borderRadius: 10 }} />
      </div>
    </div>
  );
}
