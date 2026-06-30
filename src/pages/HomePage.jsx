import { useState } from 'react';
import { extractIntent } from '../agent';

const DEFAULT_TEMPLATES = [
  { id: 'career_change', label: '跳槽 vs 留任', icon: '💼' },
  { id: 'exam_prep', label: '是否考公', icon: '📚' },
  { id: 'role_switch', label: '是否转岗', icon: '🔄' },
  { id: 'project_choice', label: '是否接这个项目', icon: '📋' },
];

const STORAGE_KEY = 'sway_templates';

function loadTemplates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

const cardStyle = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(107,78,255,0.3)',
  borderRadius: '14px',
  padding: '14px 16px',
  cursor: 'pointer',
  transition: 'border-color 0.2s, background 0.2s',
  position: 'relative',
};

export default function HomePage({ onStart, onArchive }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [templates, setTemplates] = useState(loadTemplates);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  function saveTemplates(tpls) {
    setTemplates(tpls);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tpls));
  }

  function handleDelete(id) {
    saveTemplates(templates.filter(t => t.id !== id));
  }

  function handleStartEdit(t) {
    setEditingId(t.id);
    setEditingText(t.label);
  }

  function handleSaveEdit(id) {
    if (!editingText.trim()) return;
    saveTemplates(templates.map(t => t.id === id ? { ...t, label: editingText.trim() } : t));
    setEditingId(null);
  }

  function handleAddTemplate() {
    if (!customInput.trim()) return;
    const newT = { id: `custom_${Date.now()}`, label: customInput.trim(), icon: '✏️' };
    saveTemplates([...templates, newT]);
    setCustomInput('');
    setShowCustom(false);
  }

  async function handleStart(text) {
    const val = text || input;
    if (!val.trim()) return;
    setLoading(true);
    setError('');
    try {
      const intentData = await extractIntent(val.trim());
      onStart(val.trim(), intentData);
    } catch (e) {
      setError('连接 AI 失败，请检查网络或 API Key：' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '60px 24px 40px' }}>
      {/* Logo + 定位 */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <img src="/mascot.png" alt="Sway" style={{ width: '140px', height: '140px', objectFit: 'contain' }} />
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 700, color: '#E8E0FF', letterSpacing: '-0.5px', marginBottom: '8px' }}>
          Sway
        </h1>
        <p style={{ color: '#9B85FF', fontSize: '16px', marginBottom: '12px' }}>你的决策搭子 · 职场人的纠结翻译机</p>
        <button onClick={onArchive} style={{ background: 'rgba(107,78,255,0.2)', border: '1px solid rgba(107,78,255,0.5)', borderRadius: '20px', padding: '10px 24px', color: '#C4B5FF', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
          📂 决策档案
        </button>
      </div>

      {/* 主输入框 */}
      <div style={{ position: 'relative', marginBottom: '32px' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleStart(); } }}
          placeholder="说说你在纠结什么？"
          rows={4}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(107,78,255,0.4)',
            borderRadius: '14px', padding: '18px 20px', color: '#E8E0FF', fontSize: '16px',
            resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: '1.6',
          }}
        />
        <button onClick={() => handleStart()} disabled={loading || !input.trim()} style={{
          position: 'absolute', right: '14px', bottom: '14px',
          background: loading || !input.trim() ? 'rgba(107,78,255,0.3)' : '#6B4EFF',
          color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 22px',
          fontSize: '15px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        }}>
          {loading ? '分析中...' : '开始'}
        </button>
      </div>

      {error && <p style={{ color: '#ff6b6b', marginBottom: '16px', fontSize: '14px' }}>{error}</p>}

      {/* 场景模板标题 + 编辑按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <p style={{ color: '#9B85FF', fontSize: '13px' }}>或者选一个场景快速开始：</p>
        <button onClick={() => { setEditMode(!editMode); setEditingId(null); }} style={{
          background: 'none', border: '1px solid rgba(107,78,255,0.3)', borderRadius: '16px',
          padding: '4px 12px', color: 'rgba(155,133,255,0.7)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {editMode ? '完成' : '编辑'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {templates.map(t => (
          <div key={t.id} style={{ position: 'relative' }}>
            {editingId === t.id ? (
              // 编辑状态
              <div style={{ ...cardStyle, cursor: 'default', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  autoFocus
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(t.id); if (e.key === 'Escape') setEditingId(null); }}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: '#E8E0FF', fontSize: '14px', fontFamily: 'inherit',
                  }}
                />
                <button onClick={() => handleSaveEdit(t.id)} style={{ background: '#6B4EFF', border: 'none', borderRadius: '6px', color: '#fff', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>保存</button>
              </div>
            ) : (
              <div
                style={cardStyle}
                onClick={() => !editMode && handleStart(`我在纠结${t.label}`)}
                onMouseEnter={e => !editMode && (e.currentTarget.style.borderColor = '#6B4EFF')}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(107,78,255,0.3)'}
              >
                <span style={{ fontSize: '18px', marginRight: '8px' }}>{t.icon}</span>
                <span style={{ fontSize: '14px' }}>{t.label}</span>
                {editMode && (
                  <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '4px' }}>
                    <button onClick={e => { e.stopPropagation(); handleStartEdit(t); }} style={{ background: 'rgba(107,78,255,0.3)', border: 'none', borderRadius: '6px', color: '#E8E0FF', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>改</button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(t.id); }} style={{ background: 'rgba(255,80,80,0.25)', border: 'none', borderRadius: '6px', color: '#ff8080', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}>删</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* 自定义 / 新增 */}
        <div>
          <div
            style={cardStyle}
            onClick={() => setShowCustom(!showCustom)}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6B4EFF'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(107,78,255,0.3)'}
          >
            <span style={{ fontSize: '18px', marginRight: '8px' }}>✏️</span>
            <span style={{ fontSize: '14px' }}>自定义</span>
          </div>
          {showCustom && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <input
                autoFocus
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (editMode) handleAddTemplate();
                    else customInput.trim() && handleStart(customInput);
                  }
                }}
                placeholder={editMode ? '新场景名称...' : '描述你的纠结...'}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(107,78,255,0.4)',
                  borderRadius: '10px', padding: '10px 14px', color: '#E8E0FF', fontSize: '14px',
                  outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={() => editMode ? handleAddTemplate() : customInput.trim() && handleStart(customInput)}
                disabled={!customInput.trim()}
                style={{
                  background: !customInput.trim() ? 'rgba(107,78,255,0.3)' : '#6B4EFF',
                  color: '#fff', border: 'none', borderRadius: '10px', padding: '0 14px',
                  fontSize: '13px', cursor: !customInput.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}
              >
                {editMode ? '添加' : '开始'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '48px', color: 'rgba(155,133,255,0.6)', fontSize: '13px' }}>
        列清单 + 算命 = Sway · 帮你听见心里早有的答案
      </div>
    </div>
  );
}
