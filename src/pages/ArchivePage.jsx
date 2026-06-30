import { useState } from 'react';

export default function ArchivePage({ onBack }) {
  const [records, setRecords] = useState(() => JSON.parse(localStorage.getItem('sway_archive') || '[]'));
  const [expanded, setExpanded] = useState(null);

  function handleDelete(idx) {
    const updated = records.filter((_, i) => i !== idx);
    localStorage.setItem('sway_archive', JSON.stringify(updated));
    setRecords(updated);
    if (expanded === idx) setExpanded(null);
  }

  const COLORS = ['#6B4EFF', '#9B85FF', '#4A35CC'];

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9B85FF', fontSize: '22px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>←</button>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#E8E0FF' }}>决策档案</h2>
        <span style={{ fontSize: '13px', color: 'rgba(155,133,255,0.5)', marginLeft: 'auto' }}>{records.length} 条记录</span>
      </div>

      {records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(155,133,255,0.5)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <p>还没有存档，做完决策后点"存入决策档案"</p>
        </div>
      ) : records.map((r, i) => {
        const isOpen = expanded === i;
        const sortedOptions = Object.entries(r.scores || {}).sort((a, b) => b[1] - a[1]);
        return (
          <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${isOpen ? 'rgba(107,78,255,0.5)' : 'rgba(107,78,255,0.2)'}`, borderRadius: '14px', marginBottom: '14px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
            {/* 摘要行，点击展开 */}
            <div onClick={() => setExpanded(isOpen ? null : i)} style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '18px' }}>{isOpen ? '▼' : '▶'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  {(r.options || []).map(opt => (
                    <span key={opt} style={{
                      padding: '3px 10px', borderRadius: '12px', fontSize: '13px',
                      background: opt === r.winner ? 'rgba(107,78,255,0.3)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${opt === r.winner ? '#6B4EFF' : 'rgba(255,255,255,0.1)'}`,
                      color: opt === r.winner ? '#E8E0FF' : '#9B85FF',
                    }}>
                      {opt === r.winner ? '✓ ' : ''}{opt}
                    </span>
                  ))}
                </div>
                <span style={{ fontSize: '12px', color: 'rgba(155,133,255,0.4)' }}>{r.date}</span>
              </div>
              <button onClick={e => { e.stopPropagation(); handleDelete(i); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: '18px', cursor: 'pointer', padding: '0 4px' }}>×</button>
            </div>

            {/* 展开详情 */}
            {isOpen && (
              <div style={{ borderTop: '1px solid rgba(107,78,255,0.2)', padding: '20px' }}>
                {/* 得分对比 */}
                <p style={{ fontSize: '12px', color: '#9B85FF', marginBottom: '10px' }}>得分对比</p>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${(r.options || []).length}, 1fr)`, gap: '10px', marginBottom: '20px' }}>
                  {sortedOptions.map(([opt, score], j) => (
                    <div key={opt} style={{ background: opt === r.winner ? 'rgba(107,78,255,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${opt === r.winner ? '#6B4EFF' : 'rgba(255,255,255,0.08)'}`, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#9B85FF', marginBottom: '6px' }}>{opt}</div>
                      <div style={{ fontSize: '26px', fontWeight: 700, color: COLORS[j % COLORS.length] }}>{Number(score).toFixed(1)}</div>
                      {opt === r.winner && <div style={{ fontSize: '11px', color: '#6B4EFF', marginTop: '4px' }}>✓ 领先</div>}
                    </div>
                  ))}
                </div>

                {/* 权重维度 */}
                {r.dims?.length > 0 && (
                  <>
                    <p style={{ fontSize: '12px', color: '#9B85FF', marginBottom: '10px' }}>权重分布</p>
                    <div style={{ marginBottom: '20px' }}>
                      {r.dims.map(d => (
                        <div key={d.name} style={{ marginBottom: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                            <span>{d.name}</span>
                            <span style={{ color: '#6B4EFF' }}>{d.weight}%</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
                            <div style={{ height: '100%', width: `${d.weight}%`, background: '#6B4EFF', borderRadius: '3px', transition: 'width 0.5s' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* 反直觉提示 */}
                {r.counterNote && (
                  <div style={{ background: 'rgba(107,78,255,0.1)', border: '1px solid rgba(107,78,255,0.3)', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                    <p style={{ fontSize: '11px', color: '#9B85FF', marginBottom: '6px' }}>💡 反直觉提示</p>
                    <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#E8E0FF' }}>{r.counterNote}</p>
                  </div>
                )}

                {/* 命理叙事 */}
                {r.fateText && (
                  <div style={{ background: 'rgba(74,53,204,0.12)', border: '1px solid rgba(74,53,204,0.25)', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                    <p style={{ fontSize: '11px', color: '#9B85FF', marginBottom: '6px' }}>✨ 命理叙事</p>
                    <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#E8E0FF' }}>{r.fateText}</p>
                  </div>
                )}

                {/* AI运势 */}
                {r.fortuneText && (
                  <div style={{ background: 'rgba(107,78,255,0.08)', border: '1px solid rgba(107,78,255,0.2)', borderRadius: '10px', padding: '14px' }}>
                    <p style={{ fontSize: '11px', color: '#9B85FF', marginBottom: '6px' }}>🔮 AI运势解读</p>
                    <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#E8E0FF' }}>{r.fortuneText}</p>
                  </div>
                )}

                {/* MBTI / 星座 */}
                {(r.mbti || r.zodiac) && (
                  <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                    {r.mbti && <span style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid rgba(107,78,255,0.3)', fontSize: '12px', color: '#9B85FF' }}>MBTI: {r.mbti}</span>}
                    {r.zodiac && <span style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid rgba(107,78,255,0.3)', fontSize: '12px', color: '#9B85FF' }}>{r.zodiac}</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
