import React, { useState, useRef } from 'react';

const SpeechToText = () => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);  // recognitionオブジェクトを保持するためのref

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            setError('このブラウザではWeb Speech APIがサポートされていません。');
            return;
        }

        recognitionRef.current = new window.webkitSpeechRecognition();
        const recognition = recognitionRef.current;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ja-JP';  // 日本語

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    setTranscript((prev) => prev + event.results[i][0].transcript + ' ');
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
        };

        recognition.onerror = (event) => {
            setError('エラーが発生しました: ' + event.error);
            stopListening();
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    return (
        <div className="container">
            <h1>リアルタイム文字起こし</h1>

            <div>
                {isListening ? (
                    <button onClick={stopListening}>停止</button>
                ) : (
                    <button onClick={startListening}>開始</button>
                )}
            </div>

            {error && <p className="error">{error}</p>}

            <div className="result-container">
                <label className="result-label">転写結果:</label>
                <div className="result-box">{transcript}</div>
            </div>
        </div>
    );
};

export default SpeechToText;
