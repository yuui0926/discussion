require('dotenv').config(); // .env ファイルから環境変数を読み込む

const express = require('express');
const cors = require('cors');
const path = require('path'); // 追加：静的ファイルのパス設定に使用

const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // .env ファイルで設定した API キーを使用
});

app.post('/api/moderate', async (req, res) => {
    const { text } = req.body;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: 'あなたはディスカッションのモデレーターです。ログに基づいて司会進行を行ってください。' },
                { role: 'user', content: `以下はこれまでのディスカッションのログです: ${text}。このログに基づいてディスカッションを進めてください。` },
            ],
            model: 'gpt-4', // 最新のモデルを使用
        });

        const feedback = completion.choices[0].message.content;
        res.json({ feedback });
    } catch (error) {
        console.error('Error interacting with GPT:', error.message);
        res.status(500).json({ error: 'Error interacting with GPT' });
    }
});

// 静的ファイルの提供（Reactアプリケーションを提供するための設定）
app.use(express.static(path.join(__dirname, 'build'))); // 修正：'public'を'build'に変更

// すべてのGETリクエストに対してindex.htmlを返す
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html')); // 修正：正しいパスを指定
});

app.listen(5000, '172.20.0.40', () => {
    console.log('Server running on port 5000');
});
