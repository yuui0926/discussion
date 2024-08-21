import React, { useState } from 'react';
import './DiscussionModerator.css';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const DiscussionModerator = () => {
    const [logs, setLogs] = useState([]); // 文字起こしログとモデレーターのフィードバックを保存する状態
    const [recognition, setRecognition] = useState(null);

    const startRecognition = () => {
        if (!SpeechRecognition) {
            alert('お使いのブラウザは音声認識をサポートしていません。');
            return;
        }

        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.lang = 'ja-JP';
        recognitionInstance.interimResults = false; // 確定した結果のみをログに追加
        recognitionInstance.continuous = true;

        recognitionInstance.onstart = () => {
            setLogs(prevLogs => [...prevLogs, '録音を開始しました']);
        };

        recognitionInstance.onresult = (event) => {
            const transcript = event.results[event.resultIndex][0].transcript;
            setLogs(prevLogs => [...prevLogs, transcript]);

            if (transcript.includes("以上です")) {
                stopRecognition();
                sendToModerator(transcript);
            }
        };

        recognitionInstance.onerror = (event) => {
            setLogs(prevLogs => [...prevLogs, `エラーが発生しました: ${event.error}`]);
        };

        recognitionInstance.onend = () => {
            setLogs(prevLogs => [...prevLogs, '録音を終了しました']);
        };

        recognitionInstance.start();
        setRecognition(recognitionInstance);
    };

    const stopRecognition = () => {
        if (recognition) {
            recognition.stop();
            setLogs(prevLogs => [...prevLogs, '録音を停止しました']);
        }
    };

    const sendToModerator = async (text) => {
        try {
            const response = await fetch('http://localhost:5000/api/moderate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });
            const data = await response.json();
            setLogs(prevLogs => [...prevLogs, `司会進行: ${data.feedback}`]);
        } catch (error) {
            console.error('Error moderating text:', error);
            setLogs(prevLogs => [...prevLogs, '司会進行との通信に失敗しました']);
        }
    };

    return (
        <div className="container">
            <div className="input-container">
                <input type="text" placeholder="参加者を入力" />
                <input type="text" placeholder="議題を入力" />
            </div>

            <div className="button-container">
                <button className="start-button" onClick={startRecognition}>発言開始</button>
                <button className="stop-button" onClick={stopRecognition}>発言終了</button>
            </div>

            <div className="logs-container">
                <h2>Discussion Moderator</h2>
                {logs.map((log, index) => (
                    <p key={index} className={log.startsWith('司会進行') ? 'moderator-message' : ''}>{log}</p>
                ))}
            </div>

            <div className="end-meeting-container">
                <button className="end-meeting-button">会議終了</button>
            </div>
        </div>
    );
};

export default DiscussionModerator;
