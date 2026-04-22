export default function Loading() {
  return (
    <div style={{
      maxWidth: 1080, margin: '0 auto', position: 'relative', zIndex: 1,
      fontFamily: "'Geist', system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        .skel { background: rgba(255,255,255,0.06); border-radius: 6px; animation: pulse 1.8s ease-in-out infinite; }
      `}</style>

      {/* Nav skeleton */}
      <div style={{ height: 54, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 32px', gap: 16 }}>
        <div className="skel" style={{ width: 140, height: 14 }} />
        <div className="skel" style={{ width: 60, height: 14, marginLeft: 32 }} />
        <div className="skel" style={{ width: 64, height: 28, marginLeft: 'auto', borderRadius: 6 }} />
      </div>

      {/* Hero skeleton */}
      <div style={{ padding: '80px 32px 72px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="skel" style={{ width: 200, height: 10, marginBottom: 28, borderRadius: 4 }} />
        <div className="skel" style={{ width: 520, height: 64, marginBottom: 12, borderRadius: 6 }} />
        <div className="skel" style={{ width: 420, height: 64, marginBottom: 12, borderRadius: 6 }} />
        <div className="skel" style={{ width: 320, height: 64, marginBottom: 24, borderRadius: 6 }} />
        <div className="skel" style={{ width: 380, height: 14, marginBottom: 8, borderRadius: 4 }} />
        <div className="skel" style={{ width: 340, height: 14, marginBottom: 40, borderRadius: 4 }} />
        <div className="skel" style={{ width: 520, height: 50, marginBottom: 20, borderRadius: 10 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[80, 60, 64, 60, 52].map((w, i) => (
            <div key={i} className="skel" style={{ width: w, height: 28, borderRadius: 6 }} />
          ))}
        </div>
      </div>

      {/* F&G skeleton */}
      <div style={{ padding: '40px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'grid', gridTemplateColumns: '300px 1fr', gap: 0 }}>
        <div style={{ paddingRight: 40, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="skel" style={{ width: 160, height: 10 }} />
          <div className="skel" style={{ width: 100, height: 88, borderRadius: 8 }} />
          <div className="skel" style={{ height: 6, borderRadius: 4 }} />
          <div className="skel" style={{ height: 56, borderRadius: 8 }} />
        </div>
        <div style={{ paddingLeft: 40, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
          <div className="skel" style={{ width: 100, height: 10 }} />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 44px', gap: 14, alignItems: 'center' }}>
              <div className="skel" style={{ height: 10 }} />
              <div className="skel" style={{ height: 4 }} />
              <div className="skel" style={{ height: 10 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Indices skeleton */}
      <div style={{ padding: '40px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="skel" style={{ width: 120, height: 10, marginBottom: 20, borderRadius: 4 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ padding: '22px 24px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="skel" style={{ width: 60, height: 8 }} />
              <div className="skel" style={{ width: 80, height: 28 }} />
              <div className="skel" style={{ width: 70, height: 10 }} />
              <div className="skel" style={{ width: 50, height: 20, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Trending skeleton */}
      <div style={{ padding: '40px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="skel" style={{ width: 200, height: 10, marginBottom: 20, borderRadius: 4 }} />
        <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 20px', background: 'rgba(14,17,25,1)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'grid', gridTemplateColumns: '40px 80px 1fr 100px 110px', gap: 16 }}>
            {[30, 40, 60, 60, 70].map((w, i) => (
              <div key={i} className="skel" style={{ height: 8, width: w }} />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '40px 80px 1fr 100px 110px', gap: 16, alignItems: 'center' }}>
              <div className="skel" style={{ height: 10, width: 16 }} />
              <div className="skel" style={{ height: 10, width: 48 }} />
              <div className="skel" style={{ height: 10 }} />
              <div className="skel" style={{ height: 10 }} />
              <div className="skel" style={{ height: 20, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
