import { useState, useEffect, useRef } from 'react';
import { askNextQuestion } from '../agent';

// 每个维度预设快捷选项
const QUICK_OPTIONS = {
  '薪资': ['涨幅很重要，低于20%不考虑', '差不多就行，差距不大', '薪资不是首要考虑'],
  '稳定性': ['我需要稳定，不想折腾', '可以接受一定风险', '越有挑战越好'],
  '成长性': ['成长机会比什么都重要', '有成长空间就够了', '目前更在意稳定'],
  '工作环境': ['团队氛围很重要', '能独立工作就好', '无所谓环境'],
  '工作强度': ['工作生活平衡最重要', '偶尔忙碌可以接受', '愿意高强度换高回报'],
  '晋升空间': ['有清晰晋升通道很重要', '慢慢来没关系', '不太在意职级'],
};

function getQuickReplies(question) {
  for (const [key, opts] of Object.entries(QUICK_OPTIONS)) {
    if (question.includes(key)) return opts;
  }
  return ['非常在意', '有点在意', '不太在意', '不确定'];
}

export default function ChatPage({ sessionData, onUpdate, onNext }) {
  const { intentData, userInput } = sessionData;
  const [messages, setMessages] = useState([]);
  const [userText, setUserText] = useState('');
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState(0);
  const [dimensions, setDimensions] = useState(intentData?.unknown_dimensions || []);
  const [history, setHistory] = useState([{ role: 'user', content: userInput }]);
  const [lastQuestion, setLastQuestion] = useState('');
  const bottomRef = useRef(null);
  const MAX_ROUNDS = 5;

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const greeting = `你好，我是 Sway 👋 我们来聊聊你的纠结。\n\n我看到你在考虑「${(intentData?.options || []).join(' vs ')}」，让我先问你几个问题，帮你想清楚自己真正在意什么。`;
    setMessages([{ role: 'sway', content: greeting }]);
    askQuestion([{ role: 'user', content: userInput }], intentData?.unknown_dimensions || [], 1);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function askQuestion(hist, dims, roundNum) {
    setLoading(true);
    try {
      const q = await askNextQuestion(hist, dims, roundNum);
      setLastQuestion(q);
      setMessages(prev => [...prev, { role: 'sway', content: q, showQuick: true }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'sway', content: '抱歉，连接出了点问题，请稍后再试。' }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(text) {
    const msg = (text || userText).trim();
    if (!msg || loading) return;
    setUserText('');
    // 隐藏上一条消息的快捷选项
    setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, showQuick: false } : m));

    const newHistory = [...history, { role: 'user', content: msg }];
    setHistory(newHistory);
    setMessages(prev => [...prev, { role: 'user', content: msg }]);

    const nextRound = round + 1;
    setRound(nextRound);

    if (nextRound >= MAX_ROUNDS) {
      setMessages(prev => [...prev, { role: 'sway', content: '好的，我已经大致了解你的想法了。让我帮你整理一下，你真正在意的是什么...' }]);
      setTimeout(() => onNext(newHistory), 1200);
    } else {
      const newDims = dimensions.slice(nextRound);
      askQuestion(newHistory, newDims, nextRound + 1);
    }
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* 顶部进度 */}
      <div style={{ padding: '20px 0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#9B85FF', fontSize: '18px', fontWeight: 700 }}>Sway</span>
        <span style={{ color: 'rgba(155,133,255,0.6)', fontSize: '13px' }}>
          正在了解你的真实在意 {Math.min(round, MAX_ROUNDS)}/{MAX_ROUNDS}
        </span>
      </div>

      {/* 消息列表 */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '16px' }}>
        {messages.map((m, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
              {m.role === 'sway' && (
                <img src="/mascot.png" alt="Sway" style={{ width: '72px', height: '72px', objectFit: 'contain', marginRight: '10px', flexShrink: 0 }} />
              )}
              <div style={{
                maxWidth: '80%',
                background: m.role === 'sway' ? 'rgba(107,78,255,0.15)' : 'rgba(255,255,255,0.1)',
                border: m.role === 'sway' ? '1px solid rgba(107,78,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: m.role === 'sway' ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                padding: '12px 16px', fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap',
              }}>
                {m.content}
              </div>
            </div>
            {/* 快捷选项 */}
            {m.role === 'sway' && m.showQuick && !loading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginLeft: '46px', marginBottom: '16px' }}>
                {getQuickReplies(m.content).map((opt, j) => (
                  <button key={j} onClick={() => handleSend(opt)} style={{
                    background: 'rgba(107,78,255,0.1)', border: '1px solid rgba(107,78,255,0.4)',
                    borderRadius: '20px', padding: '6px 14px', color: '#9B85FF', fontSize: '13px',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.target.style.background = 'rgba(107,78,255,0.25)'}
                    onMouseLeave={e => e.target.style.background = 'rgba(107,78,255,0.1)'}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', marginBottom: '16px' }}>
            <img src="/mascot.png" alt="Sway" style={{ width: '72px', height: '72px', objectFit: 'contain', marginRight: '10px' }} />
            <div style={{ background: 'rgba(107,78,255,0.15)', border: '1px solid rgba(107,78,255,0.3)', borderRadius: '4px 14px 14px 14px', padding: '12px 16px', color: '#9B85FF' }}>思考中...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 输入区 */}
      <div style={{ padding: '12px 0 24px', display: 'flex', gap: '10px' }}>
        <input
          value={userText}
          onChange={e => setUserText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="或者自己说说..."
          style={{
            flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(107,78,255,0.4)',
            borderRadius: '12px', padding: '14px 18px', color: '#E8E0FF', fontSize: '15px',
            outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button onClick={() => handleSend()} disabled={loading || !userText.trim()} style={{
          background: loading || !userText.trim() ? 'rgba(107,78,255,0.3)' : '#6B4EFF',
          color: '#fff', border: 'none', borderRadius: '12px', padding: '0 22px',
          fontSize: '15px', cursor: loading || !userText.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        }}>
          发送
        </button>
      </div>
    </div>
  );
}
