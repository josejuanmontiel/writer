import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook to record audio and transcribe it.
 * In Desktop (Wails): Uses native Go backend (arecord + Whisper).
 * In Web Browser: Uses Web Speech API (SpeechRecognition / webkitSpeechRecognition) for instant dictation.
 */
export const useAudioRecorder = (onTranscribed, mode, isAiMode) => {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('Listo');
    const recognitionRef = useRef(null);
    const accumulatedTextRef = useRef('');

    const isDesktopWails = typeof window !== 'undefined' && !!window?.go?.main?.App?.StartRecording;

    const startRecording = useCallback(async () => {
        if (isDesktopWails) {
            try {
                console.log('Iniciando grabación nativa (Go)...');
                setStatus('Iniciando micrófono...');
                await window.go.main.App.StartRecording();
                setIsRecording(true);
                setStatus('Grabando dictado...');
            } catch (error) {
                console.error('Error al iniciar la grabación nativa:', error);
                setStatus('Error: Imposible iniciar micrófono nativo');
            }
            return;
        }

        // Modo Web Browser: Web Speech API
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                alert('Tu navegador no soporta reconocimiento de voz nativo (Web Speech API). Usa Chrome, Edge o Safari.');
                return;
            }

            accumulatedTextRef.current = '';
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-ES';
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = () => {
                setIsRecording(true);
                setStatus('Escuchando voz (Web STT)...');
            };

            recognition.onresult = (event) => {
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        accumulatedTextRef.current += event.results[i][0].transcript + ' ';
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }
                setStatus(`Dictando: ${(accumulatedTextRef.current + interim).slice(-40)}...`);
            };

            recognition.onerror = (event) => {
                console.error('Error en reconocimiento de voz web:', event.error);
                setStatus(`Error micrófono: ${event.error}`);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error('Error iniciando Web Speech Recognition:', err);
            setStatus('Error al acceder al micrófono');
        }
    }, [isDesktopWails]);

    const stopRecording = useCallback(async () => {
        if (isDesktopWails) {
            if (!isRecording) return;
            try {
                setIsRecording(false);
                setStatus('Transcribiendo con Whisper...');
                const result = await window.go.main.App.StopRecording(mode, isAiMode);
                setStatus('Transcripción completada');
                if (onTranscribed && !isAiMode) {
                    onTranscribed(result);
                }
                setTimeout(() => setStatus('Listo'), 3000);
            } catch (error) {
                console.error('Error en el backend de Go al detener:', error);
                setStatus('Error en transcripción');
                setIsRecording(false);
            }
            return;
        }

        // Modo Web Browser
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsRecording(false);
        const finalTranscribed = accumulatedTextRef.current.trim();
        if (finalTranscribed) {
            setStatus('Transcripción completada');
            if (onTranscribed) {
                onTranscribed(finalTranscribed);
            }
        } else {
            setStatus('Listo');
        }
        setTimeout(() => setStatus('Listo'), 3000);
    }, [isDesktopWails, isRecording, mode, onTranscribed, isAiMode]);

    return {
        isRecording,
        status,
        startRecording,
        stopRecording
    };
};
