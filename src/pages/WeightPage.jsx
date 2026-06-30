import { useState, useEffect, useRef } from 'react';
import { calculateWeights, generateFateNarrative } from '../agent';

// 时辰
const SHICHEN = ['子时(23-1点)', '丑时(1-3点)', '寅时(3-5点)', '卯时(5-7点)', '辰时(7-9点)', '巳时(9-11点)', '午时(11-13点)', '未时(13-15点)', '申时(15-17点)', '酉时(17-19点)', '戌时(19-21点)', '亥时(21-23点)'];
const MBTI_LIST = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
const ZODIAC = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];

// 简单滑轮选择器
function WheelPicker({ items, value, onChange }) {
  const ref = useRef(null);
  const idx = items.indexOf(value);

  function handleScroll(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    const next = Math.max(0, Math.min(items.length - 1, (idx === -1 ? 0 : idx) + delta));
    onChange(items[next]);
  }

  return (
    <div
      ref={ref}
      onWheel={handleScroll}
      style={{
        height: '120px', overflowY: 'auto', scrollSnapType: 'y mandatory',
        border: '1px solid rgba(107,78,255,0.3)', borderRadius: '10px',
        background: 'rgba(255,255,255,0.04)', position: 'relative',
      }}
    >
      {items.map((item, i) => (
        <div
          key={item}
          onClick={() => onChange(item)}
          style={{
            height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            scrollSnapAlign: 'start', cursor: 'pointer', fontSize: '14px',
            background: value === item ? 'rgba(107,78,255,0.25)' : 'transparent',
            color: value === item ? '#E8E0FF' : 'rgba(232,224,255,0.4)',
            fontWeight: value === item ? 600 : 400,
            transition: 'all 0.15s',
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

// 年份列表（1950-2010）
const YEARS = Array.from({ length: 61 }, (_, i) => `${1950 + i}年`);
const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
const DAYS = Array.from({ length: 31 }, (_, i) => `${i + 1}日`);

export default function WeightPage({ sessionData, onUpdate, onNext }) {
  const { chatHistory, intentData } = sessionData;
  const [weightData, setWeightData] = useState(null);
  const [userWeights, setUserWeights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFate, setShowFate] = useState(false);
  const [byYear, setByYear] = useState('1995年');
  const [byMonth, setByMonth] = useState('1月');
  const [byDay, setByDay] = useState('1日');
  const [byShichen, setByShichen] = useState('午时(11-13点)');
  const [fateLoading, setFateLoading] = useState(false);
  const [fateText, setFateText] = useState('');
  const [mbti, setMbti] = useState('');
  const [zodiac, setZodiac] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    calculateWeights(chatHistory, intentData)
      .then(data => {
        setWeightData(data);
        setUserWeights(data.dimensions.map(d => ({ ...d })));
      })
      .catch(e => setError('分析失败：' + e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleWeightChange(idx, val) {
    setUserWeights(prev => prev.map((d, i) => i === idx ? { ...d, weight: Number(val) } : d));
  }

  async function handleFate() {
    const birthday = `${byYear}${byMonth}${byDay} ${byShichen}`;
    setFateLoading(true);
    try {
      const extra = [mbti && `MBTI: ${mbti}`, zodiac && `星座: ${zodiac}`].filter(Boolean).join('，');
      const text = await generateFateNarrative(birthday, intentData?.intent || '', weightData?.score_winner || '', extra);
      setFateText(text);
      onUpdate({ birthday, fateText: text, mbti, zodiac });
    } catch (e) {
      setFateText('命理生成失败，请稍后重试。');
    } finally {
      setFateLoading(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
      <img src="/mascot.png" alt="Sway" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
      <p style={{ color: '#9B85FF' }}>正在整理你的权重分布...</p>
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: '680px', margin: '60px auto', padding: '0 24px', color: '#ff6b6b' }}>{error}</div>
  );

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
        <img src="/mascot.png" alt="Sway" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
        <h2 style={{ fontSize: '22px', color: '#E8E0FF', fontWeight: 600 }}>我整理了一下你说的...</h2>
      </div>

      {/* AI 总结语 */}
      <div style={{ background: 'rgba(107,78,255,0.12)', border: '1px solid rgba(107,78,255,0.3)', borderRadius: '14px', padding: '20px', marginBottom: '28px', fontSize: '15px', lineHeight: '1.7' }}>
        根据我们的对话，我感觉你最在意的是：
        <strong style={{ color: '#9B85FF' }}>{weightData?.dimensions?.[0]?.name}</strong>
        {weightData?.dimensions?.length > 1 && <>，其次是 <strong style={{ color: '#9B85FF' }}>{weightData?.dimensions?.[1]?.name}</strong></>}。
        <br />是这样吗？你可以拖动下面的滑条来调整。
      </div>

      {/* 权重滑条 */}
      <div style={{ marginBottom: '32px' }}>
        {userWeights?.map((d, i) => (
          <div key={i} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '15px' }}>{d.name}</span>
              <span style={{ color: '#6B4EFF', fontWeight: 600 }}>{d.weight}%</span>
            </div>
            <input type="range" min={0} max={100} value={d.weight}
              onChange={e => handleWeightChange(i, e.target.value)}
              style={{ width: '100%', accentColor: '#6B4EFF' }}
            />
          </div>
        ))}
      </div>

      {/* 命理 + MBTI + 星座入口 */}
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
        <button onClick={() => setShowFate(!showFate)} style={{ background: 'none', border: 'none', color: '#9B85FF', fontSize: '15px', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
          {showFate ? '▼' : '▶'} 可选：加入命理 / 星座 / MBTI（结果更有说服力）
        </button>
        {showFate && (
          <div style={{ marginTop: '20px' }}>
            {/* 生辰滑轮 */}
            <p style={{ fontSize: '13px', color: '#9B85FF', marginBottom: '12px' }}>生辰（滚动选择）</p>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: '8px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(155,133,255,0.6)', marginBottom: '4px', textAlign: 'center' }}>年</div>
                <WheelPicker items={YEARS} value={byYear} onChange={setByYear} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(155,133,255,0.6)', marginBottom: '4px', textAlign: 'center' }}>月</div>
                <WheelPicker items={MONTHS} value={byMonth} onChange={setByMonth} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(155,133,255,0.6)', marginBottom: '4px', textAlign: 'center' }}>日</div>
                <WheelPicker items={DAYS} value={byDay} onChange={setByDay} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'rgba(155,133,255,0.6)', marginBottom: '4px', textAlign: 'center' }}>时辰</div>
                <WheelPicker items={SHICHEN} value={byShichen} onChange={setByShichen} />
              </div>
            </div>

            {/* MBTI */}
            <p style={{ fontSize: '13px', color: '#9B85FF', marginBottom: '8px' }}>MBTI（可不填）</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {MBTI_LIST.map(m => (
                <button key={m} onClick={() => setMbti(mbti === m ? '' : m)} style={{
                  padding: '5px 12px', borderRadius: '16px', border: '1px solid',
                  borderColor: mbti === m ? '#6B4EFF' : 'rgba(107,78,255,0.3)',
                  background: mbti === m ? 'rgba(107,78,255,0.25)' : 'transparent',
                  color: mbti === m ? '#E8E0FF' : '#9B85FF', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                }}>{m}</button>
              ))}
            </div>

            {/* 星座 */}
            <p style={{ fontSize: '13px', color: '#9B85FF', marginBottom: '8px' }}>星座（可不填）</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {ZODIAC.map(z => (
                <button key={z} onClick={() => setZodiac(zodiac === z ? '' : z)} style={{
                  padding: '5px 12px', borderRadius: '16px', border: '1px solid',
                  borderColor: zodiac === z ? '#6B4EFF' : 'rgba(107,78,255,0.3)',
                  background: zodiac === z ? 'rgba(107,78,255,0.25)' : 'transparent',
                  color: zodiac === z ? '#E8E0FF' : '#9B85FF', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                }}>{z}</button>
              ))}
            </div>

            <button onClick={handleFate} disabled={fateLoading} style={{
              background: fateLoading ? 'rgba(74,53,204,0.3)' : '#4A35CC',
              color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px',
              fontSize: '14px', cursor: fateLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              {fateLoading ? '生成中...' : '生成命理叙事'}
            </button>
            {fateText && (
              <div style={{ marginTop: '14px', background: 'rgba(107,78,255,0.1)', borderRadius: '10px', padding: '14px', fontSize: '14px', lineHeight: '1.7', color: '#9B85FF' }}>
                {fateText}
              </div>
            )}
          </div>
        )}
      </div>

      <button onClick={() => onNext(weightData, userWeights)} style={{
        width: '100%', background: '#6B4EFF', color: '#fff', border: 'none',
        borderRadius: '14px', padding: '16px', fontSize: '17px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
      }}>
        看看结果 →
      </button>
    </div>
  );
}
