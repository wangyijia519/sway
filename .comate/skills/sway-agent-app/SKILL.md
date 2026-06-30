---
name: sway-agent-app
description: |
  Build a workplace decision-making AI web app (like Sway) using React + Vite + Tailwind CSS + Express backend proxy with ERNIE (百度千帆) API integration. Use this skill whenever the user wants to:
  - Build a multi-stage AI Agent app that guides users through a decision-making workflow
  - Integrate 百度千帆/ERNIE API into a React frontend via an Express proxy (to avoid CORS)
  - Deploy a full-stack React + Express app on Railway
  - Create an interactive chat interface powered by an LLM backend
  - Build apps with glassmorphism UI, radar charts, decision archives, or fortune/fate narrative features
  - Scaffold any "AI-powered form + chat + result visualization" product
  Trigger even when the user just describes the workflow idea without naming the tech stack.
---

# Sway — AI 决策助理 App 构建指南

Sway 是一款职场决策助手 Web App，通过三段式 AI Agent 引导用户梳理决策。本 Skill 记录了从零开始搭建、联调、部署整套流程中沉淀的关键经验。

---

## 技术栈

- **前端**: React 18 + Vite 8 + Tailwind CSS v4
- **后端**: Express.js（API 代理 + 静态文件服务）
- **AI 模型**: 百度千帆 `ernie-4.0-turbo-8k`（API 端点：`https://qianfan.baidubce.com/v2/chat/completions`）
- **可视化**: recharts（RadarChart）
- **部署**: Railway（GitHub 自动部署）
- **Node.js**: 必须 >= 20（Vite 8 要求）

---

## 三段式 Agent 架构

```
用户输入决策 → extractIntent → askNextQuestion（循环追问）→ calculateWeights → 雷达图结果
```

每一段都是独立的 LLM 调用，有独立的 System Prompt：

1. **extractIntent** — 提取用户的决策意图，识别关键维度（如"成长"、"薪资"、"生活平衡"）
2. **askNextQuestion** — 苏格拉底式追问，每次只问一个最关键问题，帮助用户探索自己真正在意的点；同时返回 3 个快捷回复选项
3. **calculateWeights** — 汇总所有对话，为每个维度打分（0-100），并返回「反直觉提示」

附加功能：
- **generateFateNarrative** — 根据生辰（年/月/日/时辰）生成命理叙事
- **askFortune** — 结合决策结果生成当前运势解读

---

## 核心经验与踩坑

### 1. ERNIE API 只能从服务端调用（CORS 限制）

前端无法直接调用千帆 API，必须通过 Express 代理：

```js
// server.js 核心代理逻辑
app.post('/api/chat', async (req, res) => {
  const response = await fetch('https://qianfan.baidubce.com/v2/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VITE_ERNIE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  });
  const data = await response.json();
  res.json(data);
});
```

前端 `agent.js` 调用时，根据环境选择地址：
```js
const API_URL = import.meta.env.DEV ? 'http://localhost:3001/api/chat' : '/api/chat';
```

### 2. 模型名称要用 `ernie-4.0-turbo-8k`

- `ernie-4.5-8k` → 401 错误
- `ernie-4.5` → 依然报错
- `ernie-4.0-turbo-8k` → 可用 ✓

### 3. React StrictMode 导致 useEffect 触发两次

开发模式下 StrictMode 会触发两次 effect，导致对话开始时弹出两个问题：

```js
// ChatPage.jsx — 用 useRef 防止重复初始化
const initialized = useRef(false);
useEffect(() => {
  if (initialized.current) return;
  initialized.current = true;
  startConversation();
}, []);
```

### 4. Express 5 路由语法变更

Express 5 中 `app.get('*')` 无效，SPA 回退路由必须写成：

```js
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
```

### 5. Railway 部署要点

- Node 版本：`package.json` 加 `"engines": {"node": ">=20"}`，同时在根目录放 `.nvmrc` 内容为 `20`
- 启动命令（package.json）：`"start": "npm run build && node server.js"`
- 环境变量：在 Railway 服务的 Variables 中设置 `VITE_ERNIE_API_KEY`（不要 commit `.env`）
- 端口：Railway 会设 `PORT=8080`，`server.js` 监听 `process.env.PORT || 3001`
- 域名生成：在 Service Settings → Networking → Generate Domain，端口填 **8080**

### 6. 命理叙事不要传数字 seed

LLM 收到数字会当内容描述，导致输出奇怪。直接传生辰文字描述：

```js
// 不要这样做
const seed = year * 10000 + month * 100 + day;
prompt = `seed: ${seed}`;

// 应该这样
prompt = `生辰：${year}年${month}月${day}日${shichen}时`;
```

---

## 项目文件结构

```
comate-zulu-demo/
├── src/
│   ├── agent.js          # 所有 ERNIE API 调用（extractIntent/askNextQuestion/calculateWeights 等）
│   ├── App.jsx           # 路由 + 视频背景（/bg.webm，playbackRate 0.4）
│   └── pages/
│       ├── HomePage.jsx  # 场景模板选择（可编辑/删除，存 localStorage）
│       ├── ChatPage.jsx  # 对话界面 + 快捷回复 chip
│       ├── WeightPage.jsx # 生辰滑轮 + MBTI + 星座选择
│       ├── ResultPage.jsx # 雷达图 + 运势按钮 + 存档
│       └── ArchivePage.jsx # 决策历史展开查看
├── server.js             # Express 代理 + 静态服务
├── package.json          # engines + start script
├── .nvmrc                # 内容: 20
├── public/
│   ├── bg.webm           # 背景视频（建议慢速，playbackRate 0.4）
│   └── mascot.png        # 吉祥物图片
└── .env                  # VITE_ERNIE_API_KEY=xxx（不 commit）
```

---

## 本地开发

```bash
# 终端1：前端
npm run dev

# 终端2：后端代理
VITE_ERNIE_API_KEY=你的key node server.js
```

---

## Railway 首次部署流程

1. 推送代码到 GitHub
2. Railway → New Project → Deploy from GitHub Repo → 选仓库
3. 在 Service → Variables 中添加 `VITE_ERNIE_API_KEY`
4. 等待构建完成
5. Service Settings → Networking → Generate Domain → 端口填 **8080**

---

## UI 设计要点（玻璃质感风格）

- 背景：全屏循环视频 `<video>` + `backdrop-blur` 毛玻璃叠层
- 卡片：`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl`
- 颜色：白色/半透明为主，强调色用紫/粉渐变
- 吉祥物：首页居中 140px，对话气泡 72px 头像
- 雷达图：recharts `RadarChart` 搭配自定义 tooltip
