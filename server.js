import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.VITE_ERNIE_API_KEY || '';

const app = express();
app.use(express.json());

// API 代理
app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch('https://qianfan.baidubce.com/v2/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ ...req.body, model: req.body.model || 'ernie-4.0-turbo-8k' }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 托管前端静态文件
app.use(express.static(join(__dirname, 'dist')));
app.get('/{*path}', (_, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
