import React, { useState, useEffect, useCallback } from 'react';
import './DiscussionModerator.css';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const DiscussionModerator = () => {
    const [logs, setLogs] = useState([]); 
    const [recognition, setRecognition] = useState(null);
    const [isRecording, setIsRecording] = useState(false);

    const stopRecognition = useCallback(() => {
        if (recognition) {
            recognition.stop();
            setIsRecording(false);
            sendToModerator(logs);
        }
    }, [recognition, logs]);

    const startRecognition = () => {
        if (!SpeechRecognition) {
            alert('お使いのブラウザは音声認識をサポートしていません。');
            return;
        }

        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.lang = 'ja-JP';
        recognitionInstance.interimResults = false; 
        recognitionInstance.continuous = true;

        recognitionInstance.onstart = () => {
            setIsRecording(true);
        };

        recognitionInstance.onresult = (event) => {
            const transcript = event.results[event.resultIndex][0].transcript;
            setLogs(prevLogs => [...prevLogs, transcript]);
        };

        recognitionInstance.onerror = (event) => {
            setLogs(prevLogs => [...prevLogs, `エラーが発生しました: ${event.error}`]);
        };

        recognitionInstance.onend = () => {
            setIsRecording(false);
        };

        recognitionInstance.start();
        setRecognition(recognitionInstance);
    };

    const sendToModerator = async (completeLogs) => {
        try {
            const response = await fetch('http://localhost:5000/api/moderate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logs: completeLogs,
                    participants: document.querySelector("input[placeholder='参加者を入力']").value,
                    topic: document.querySelector("input[placeholder='議題を入力']").value,
                    text: completeLogs.join('\n')
                }),
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

            {isRecording && <div className="recording-indicator">録音中...</div>}

            <div className="logs-container">
                <h2>Discussion Moderator</h2>
                {logs.map((log, index) => (
                    <p key={index} className={log.startsWith('司会進行') ? 'moderator-message' : ''}>{log}</p>
                ))}
            </div>

            <div className="end-meeting-container">
                <button className="end-meeting-button" onClick={() => sendToModerator([...logs, "総括をお願いします"])}>会議終了</button>
            </div>
        </div>
    );
};

export default DiscussionModerator;
