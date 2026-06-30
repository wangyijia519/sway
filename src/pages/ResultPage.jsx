import { useEffect, useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { askFortune } from '../agent';

export default function ResultPage({ sessionData, onRestart }) {
  const { weightData, userWeights, intentData, fateText } = sessionData;
  const [show, setShow] = useState(false);
  const [fortuneText, setFortuneText] = useState('');
  const [fortuneLoading, setFortuneLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  const dims = userWeights || weightData?.dimensions || [];
  const options = intentData?.options || Object.keys(weightData?.options_score || {});
  const radarData = dims.map(d => {
    const entry = { dimension: d.name };
    options.forEach(opt => { entry[opt] = weightData?.options_score?.[opt]?.[d.name] ?? 50; });
    return entry;
  });
  const COLORS = ['#6B4EFF', '#9B85FF', '#4A35CC'];
  const scores = {};
  options.forEach(opt => {
    scores[opt] = dims.reduce((sum, d) => sum + (d.weight / 100) * (weightData?.options_score?.[opt]?.[d.name] ?? 50), 0);
  });
  const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0];

  async function handleFortune() {
    setFortuneLoading(true);
    try {
      const text = await askFortune(sessionData);
      setFortuneText(text);
    } catch (e) {
      setFortuneText('运势分析失败，请稍后重试。');
    } finally {
      setFortuneLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }}>
      {/* 反直觉提示 */}
      {weightData?.counter_intuitive_note && (
        <div style={{ background: 'rgba(107,78,255,0.15)', border: '1px solid #6B4EFF', borderRadius: '14px', padding: '20px', marginBottom: '28px', transition: 'opacity 0.5s', opacity: show ? 1 : 0 }}>
          <p style={{ fontSize: '13px', color: '#9B85FF', marginBottom: '6px' }}>💡 发现一个有趣的事</p>
          <p style={{ fontSize: '15px', lineHeight: '1.7' }}>{weightData.counter_intuitive_note}</p>
        </div>
      )}

      {/* 雷达图 */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(107,78,255,0.2)', borderRadius: '16px', padding: '24px', marginBottom: '24px', transition: 'opacity 0.8s', opacity: show ? 1 : 0 }}>
        <h3 style={{ fontSize: '16px', color: '#9B85FF', marginBottom: '16px' }}>维度对比雷达图</h3>
        {radarData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(107,78,255,0.2)" />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: '#E8E0FF', fontSize: 12 }} />
              {options.map((opt, i) => (
                <Radar key={opt} name={opt} dataKey={opt} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.15} />
              ))}
              <Legend wrapperStyle={{ color: '#E8E0FF', fontSize: '13px' }} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: '#9B85FF', textAlign: 'center' }}>暂无维度数据</p>
        )}
        {(weightData?.summary || winner) && (
          <p style={{ textAlign: 'center', color: '#9B85FF', marginTop: '12px', fontSize: '14px' }}>
            {weightData?.summary || `按你的权重，${winner} 综合领先`}
          </p>
        )}
      </div>

      {/* 各选项得分 */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: '12px', marginBottom: '24px' }}>
        {options.map((opt, i) => (
          <div key={opt} style={{
            background: opt === winner ? 'rgba(107,78,255,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${opt === winner ? '#6B4EFF' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '14px', padding: '20px', textAlign: 'center',
            transition: 'opacity 0.8s', opacity: show ? 1 : 0,
          }}>
            <div style={{ fontSize: '13px', color: '#9B85FF', marginBottom: '8px' }}>{opt}</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: COLORS[i % COLORS.length] }}>{scores[opt]?.toFixed(1)}</div>
            <div style={{ fontSize: '12px', color: 'rgba(232,224,255,0.5)', marginTop: '4px' }}>综合得分</div>
            {opt === winner && <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B4EFF' }}>✓ 权重领先</div>}
          </div>
        ))}
      </div>

      {/* 命理叙事 */}
      {fateText && (
        <div style={{ background: 'rgba(74,53,204,0.15)', border: '1px solid rgba(74,53,204,0.3)', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
          <p style={{ fontSize: '12px', color: '#9B85FF', marginBottom: '8px' }}>✨ 命理叙事（仅供参考）</p>
          <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#E8E0FF' }}>{fateText}</p>
        </div>
      )}

      {/* AI 问一问运势 */}
      <div style={{ background: 'rgba(107,78,255,0.08)', border: '1px solid rgba(107,78,255,0.25)', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        {!fortuneText ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#9B85FF', fontSize: '14px', marginBottom: '14px' }}>想听听 AI 怎么看你的当前运势？</p>
            <button onClick={handleFortune} disabled={fortuneLoading} style={{
              background: fortuneLoading ? 'rgba(107,78,255,0.3)' : '#6B4EFF',
              color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 28px',
              fontSize: '15px', cursor: fortuneLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              {fortuneLoading ? '分析中...' : '🔮 AI 问一问当前运势'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '12px', color: '#9B85FF', marginBottom: '10px' }}>🔮 AI 运势解读</p>
            <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#E8E0FF' }}>{fortuneText}</p>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={() => {
          const record = {
            date: new Date().toLocaleString(),
            options,
            winner,
            scores,
            dims,
            optionsScore: weightData?.options_score,
            counterNote: weightData?.counter_intuitive_note,
            summary: weightData?.summary,
            fateText: sessionData.fateText,
            mbti: sessionData.mbti,
            zodiac: sessionData.zodiac,
            fortuneText,
          };
          const saved = JSON.parse(localStorage.getItem('sway_archive') || '[]');
          saved.unshift(record);
          localStorage.setItem('sway_archive', JSON.stringify(saved.slice(0, 20)));
          alert('已存入决策档案！');
        }} style={{ flex: 1, background: 'rgba(107,78,255,0.2)', color: '#9B85FF', border: '1px solid rgba(107,78,255,0.4)', borderRadius: '14px', padding: '14px', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}>
          存入决策档案
        </button>
        <button onClick={onRestart} style={{ flex: 1, background: '#6B4EFF', color: '#fff', border: 'none', borderRadius: '14px', padding: '14px', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}>
          重新来过
        </button>
      </div>
    </div>
  );
}
