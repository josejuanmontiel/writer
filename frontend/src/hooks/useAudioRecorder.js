import { useState, useCallback } from 'react';

/**
 * Custom hook to record audio and send it to the Go backend via Wails.
 * This version uses the native Go backend (arecord) to bypass browser permissions.
 */
export const useAudioRecorder = (onTranscribed, mode, isAiMode) => {
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('Listo');

    const startRecording = useCallback(async () => {
        try {
            console.log('Iniciando grabación nativa (Go)...');
            setStatus('Iniciando micrófono...');
            
            // Call the Go backend function to start recording via arecord
            await window.go.main.App.StartRecording();
            
            setIsRecording(true);
            setStatus('Grabando dictado...');
            console.log('Grabación nativa iniciada.');
        } catch (error) {
            console.error('Error al iniciar la grabación nativa:', error);
            setStatus('Error: Imposible iniciar micrófono nativo');
        }
    }, []);

    const stopRecording = useCallback(async () => {
        if (!isRecording) return;
        
        try {
            setIsRecording(false);
            console.log('Deteniendo grabación nativa, procesando...');
            setStatus('Transcribiendo con Whisper...');
            
            // Call the Go backend function to stop recording and send to Whisper
            const result = await window.go.main.App.StopRecording(mode, isAiMode);
            
            console.log('Transcripción recibida:', result);
            setStatus('Transcripción completada');
            
            // Si es modo IA, el backend ya habrá emitido el evento MCP o procesado,
            // pero aquí recibimos el texto transcrito original.
            if (onTranscribed && !isAiMode) {
                onTranscribed(result);
            }
            
            // Reset status after a delay
            setTimeout(() => setStatus('Listo'), 3000);
        } catch (error) {
            console.error('Error en el backend de Go al detener:', error);
            setStatus('Error en transcripción');
            setIsRecording(false);
        }
    }, [isRecording, mode, onTranscribed, isAiMode]);

    return {
        isRecording,
        status,
        startRecording,
        stopRecording
    };
};
