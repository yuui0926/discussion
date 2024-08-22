require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai'); 

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/moderate', async (req, res) => {
    const { text, participants, topic, logs } = req.body;

    try {
        let logsContent;
        if (Array.isArray(logs)) {
            logsContent = logs.join('\n');
        } else if (typeof logs === 'string') {
            logsContent = logs;
        } else {
            logsContent = 'ログが提供されていません。';
        }

        const userMessage = text || 'ユーザーの発言内容が提供されていません。';

        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system', 
                    content: `
                        あなたはディスカッションのモデレーターです。以下の指針に従って議論を進めてください:
                        
                        1. **中立性を保つ**: 自分の意見を控え、公平な立場で議論を進めること。
                        2. **議論の目的を明確にする**: 最初に議論の目的を明確にし、全員が同じ目標に向かって議論できるようにすること。
                        3. **発言の公平な分配**: 全員が発言できるように、特定の人に話が偏らないようバランスを取ること。
                        4. **タイムマネジメント**: 時間を意識し、議論が長引かないように進行すること。重要なポイントを押さえつつ、時間内にまとめること。
                        5. **争点の整理と明確化**: 議論が混乱しないように、争点を整理し、どの点について話し合っているのかを常に明確にすること。
                        6. **建設的な議論を促進する**: 批判ではなく建設的な意見交換を促し、議論が前向きに進むようサポートすること。必要に応じて、議論をさらに深める質問を投げかけること。
                        7. **まとめと次のステップの確認**: 議論の終わりには、内容を簡潔にまとめ、次に取るべき行動を確認すること。

                        参加者: ${participants || '参加者情報が提供されていません。'}
                        議題: ${topic || '議題情報が提供されていません。'}
                        ログの内容:
                        ${logsContent}
                    `
                },
                { role: 'user', content: userMessage },
            ],
        });

        const feedback = completion.choices[0].message.content;
        res.json({ feedback });
    } catch (error) {
        console.error('Error interacting with GPT:', error);
        res.status(500).json({ error: 'Error interacting with GPT', details: error.message });
    }
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});
