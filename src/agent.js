// 生产环境用相对路径，本地开发用 localhost:3001
const API_URL = import.meta.env.DEV
  ? 'http://localhost:3001/api/chat'
  : '/api/chat';

async function callERNIE(messages, jsonMode = false) {
  const body = {
    model: 'ernie-3.5-8k',
    messages,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// 阶段一：意图抽取
export async function extractIntent(userInput) {
  const messages = [
    {
      role: 'system',
      content: `你是一个职场决策助手。用户会描述一个纠结的情境。你需要严格输出 JSON，包含：
- intent: 决策类型（如 career_change / exam_prep / project_choice / role_switch / custom）
- options: 候选选项数组（如 ["跳槽","留任"]）
- unknown_dimensions: 需要挖掘的维度数组（如 ["薪资","稳定性","成长性"]）
- initial_preference: 用户话语中流露出的初始倾向（如 "留任"，若无则为 null）
只输出 JSON，不要其他文字。`,
    },
    { role: 'user', content: userInput },
  ];
  const raw = await callERNIE(messages, true);
  return JSON.parse(raw);
}

// 阶段二：动态提问（单轮）
export async function askNextQuestion(conversationHistory, remainingDimensions, roundNum) {
  const dimension = remainingDimensions[0] || '综合感受';
  const messages = [
    {
      role: 'system',
      content: `你是 Sway，一个懂职场的朋友，正在帮用户理清决策中真正在意的东西。
当前要挖掘的维度：${dimension}
对话轮次：${roundNum}/5（最多5轮）
规则：
- 用极端情境假设来提问，不直接问"你在意X吗"
- 语气像朋友，温暖不正式
- 只问一个问题，简洁
- 直接输出问题文字，不要加前缀`,
    },
    ...conversationHistory,
  ];
  return await callERNIE(messages, false);
}

// 阶段三：权重结算
export async function calculateWeights(conversationHistory, intentData) {
  const messages = [
    {
      role: 'system',
      content: `你是一个决策分析师。根据完整对话，输出 JSON：
- dimensions: [{name, weight}] 数组，weight 之和为 100
- options_score: {选项名: {维度名: 0-100分}} 
- initial_preference: "${intentData.initial_preference || '未知'}"
- score_winner: 综合得分最高的选项
- counter_intuitive_note: 若 score_winner 与 initial_preference 不一致，输出一句温和的反直觉提示；否则为 null
- summary: 一句话总结（如"按你的权重，选项B在成长空间领先"）
只输出 JSON。`,
    },
    ...conversationHistory,
    {
      role: 'user',
      content: `请基于以上对话，对选项 ${intentData.options.join('、')} 进行权重打分分析。`,
    },
  ];
  const raw = await callERNIE(messages, true);
  return JSON.parse(raw);
}

// 命理叙事（Hash 种子法）
export async function generateFateNarrative(birthday, decisionContext, scoreWinner, extra = '') {
  const messages = [
    {
      role: 'system',
      content: `你是一个会讲命理故事的朋友。根据以下信息生成120字以内的轻松叙事，语气轻松有趣，结尾加"（仅供参考，娱乐向）"。
用户生辰：${birthday}
决策场景：${decisionContext}
理性分析得分领先的选项：${scoreWinner}
${extra ? `用户额外信息：${extra}` : ''}
要求：
- 直接从命理角度解读，不要提任何数字、编码或种子
- 让叙事和理性分析形成呼应
- 如有MBTI或星座信息，结合性格特质解读`,
    },
    { role: 'user', content: '帮我生成命理叙事。' },
  ];
  return await callERNIE(messages, false);
}

// AI运势分析
export async function askFortune(sessionData) {
  const { weightData, userWeights, intentData, fateText, mbti, zodiac } = sessionData;
  const dims = userWeights || weightData?.dimensions || [];
  const winner = weightData?.score_winner || '';
  const messages = [
    {
      role: 'system',
      content: `你是一个温暖有趣的AI决策顾问，结合理性分析和玄学视角，给用户一个综合的运势解读和建议。语气轻松、有洞察力，200字以内。`,
    },
    {
      role: 'user',
      content: `我在纠结：${intentData?.options?.join(' vs ')}
权重最高的维度：${dims[0]?.name || '未知'}
综合得分领先：${winner}
${mbti ? `我的MBTI：${mbti}` : ''}
${zodiac ? `我的星座：${zodiac}` : ''}
${fateText ? `命理叙事：${fateText}` : ''}
请帮我分析一下当前运势，给我一个方向性建议。`,
    },
  ];
  return await callERNIE(messages, false);
}
