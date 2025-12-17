/**
 * useVoiceRecording - Voice recording and transcription management
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { getVoiceRecorder, RecordingState } from '../../../services/voiceRecording';
import { transcribeAudio, isWebSpeechSupported } from '../../../services/speechToText';
import { LiveSpeechRecognition, LiveTranscriptionResult } from '../../../services/speechToTextLive';
import { detectBrowser, getBrowserGuidance, isVoiceSupported } from '../../../utils/browserDetection';

interface UseVoiceRecordingOptions {
  onTranscriptionComplete: (text: string) => void;
  showAlert: (title: string, message: string, buttons?: any[]) => void;
}

interface UseVoiceRecordingResult {
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  liveTranscript: string;
  isTranscribing: boolean;
  toggleRecording: () => Promise<void>;
  cancelRecording: () => void;
  restartRecording: () => Promise<void>;
  togglePause: () => void;
}

export function useVoiceRecording({
  onTranscriptionComplete,
  showAlert,
}: UseVoiceRecordingOptions): UseVoiceRecordingResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  const voiceRecorderRef = useRef(getVoiceRecorder());
  const liveSpeechRef = useRef<LiveSpeechRecognition | null>(null);

  // Setup voice recorder and live speech recognition
  useEffect(() => {
    const voiceRecorder = voiceRecorderRef.current;

    voiceRecorder.setOnStateChange((state: RecordingState) => {
      setIsRecording(state.isRecording);
      setIsPaused(state.isPaused);
      setRecordingDuration(state.duration);
    });

    // Initialize live speech recognition if supported
    if (isWebSpeechSupported()) {
      const liveSpeech = new LiveSpeechRecognition();

      liveSpeech.setOnResult((result: LiveTranscriptionResult) => {
        setLiveTranscript(result.transcript);
      });

      liveSpeech.setOnError((error: Error) => {
        console.error('[useVoiceRecording] Live speech error:', error);
        // Don't show alert for interim errors, wait for final result
      });

      liveSpeechRef.current = liveSpeech;
    }

    return () => {
      voiceRecorder.dispose();
      if (liveSpeechRef.current) {
        liveSpeechRef.current.abort();
      }
    };
  }, []);

  const handleTranscription = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);

    try {
      console.log('[useVoiceRecording] Transcribing audio with native Web Speech API...');

      // Use native Web Speech API (built into browsers)
      const result = await transcribeAudio(audioBlob, 'web-speech', false);

      console.log('[useVoiceRecording] Transcription result:', result);

      if (result.text.trim()) {
        onTranscriptionComplete(result.text.trim());
      } else {
        showAlert(
          'No Speech Detected',
          'Could not detect any speech in the recording. Please try again and speak clearly.'
        );
      }
    } catch (error: any) {
      console.error('[useVoiceRecording] Transcription error:', error);
      showAlert('Transcription Failed', error.message || 'Failed to transcribe audio. Please check your OpenAI API key in Settings.');
    } finally {
      setIsTranscribing(false);
    }
  }, [onTranscriptionComplete, showAlert]);

  const toggleRecording = useCallback(async () => {
    const voiceRecorder = voiceRecorderRef.current;
    const liveSpeech = liveSpeechRef.current;

    console.log('[useVoiceRecording] toggleRecording called, isRecording:', isRecording);

    // Check browser compatibility
    const voiceSupport = isVoiceSupported();
    console.log('[useVoiceRecording] Voice support check:', voiceSupport);
    if (!voiceSupport.supported) {
      showAlert('Not Supported', voiceSupport.message);
      return;
    }

    if (!voiceRecorder.isSupported()) {
      const browser = detectBrowser();
      console.log('[useVoiceRecording] VoiceRecorder not supported in:', browser);
      showAlert(
        'Not Supported',
        `Voice recording is not supported in ${browser.name}. Please use Chrome, Edge, Brave, Firefox, or Safari.`
      );
      return;
    }

    if (isRecording) {
      console.log('[useVoiceRecording] Stopping recording...');

      // Stop live speech recognition if active
      let finalTranscript = '';
      if (liveSpeech && liveSpeech.isSupported()) {
        finalTranscript = liveSpeech.stop();
        console.log('[useVoiceRecording] Live speech transcript:', finalTranscript || '(empty)');
      }

      // Also check the liveTranscript state (shown in "Live:" card)
      // This ensures we capture text even if liveSpeech.stop() returns empty
      if (!finalTranscript.trim() && liveTranscript.trim()) {
        finalTranscript = liveTranscript;
        console.log('[useVoiceRecording] Using liveTranscript state:', finalTranscript);
      }

      // Stop recording and wait for audio blob to be ready
      const audioBlob = await voiceRecorder.stopRecording();
      console.log('[useVoiceRecording] Recording stopped, audioBlob:', !!audioBlob, audioBlob?.size);

      // Use live transcript if available, otherwise transcribe recorded audio
      if (finalTranscript.trim()) {
        // We got live transcription - add it to the input field
        onTranscriptionComplete(finalTranscript.trim());
        setLiveTranscript('');
        console.log('[useVoiceRecording] Using live transcript');
      } else {
        // Fall back to transcription with recorded audio
        setLiveTranscript('');
        if (audioBlob) {
          console.log('[useVoiceRecording] Falling back to audio transcription');
          await handleTranscription(audioBlob);
        } else {
          console.warn('[useVoiceRecording] No audio blob available for transcription');
          showAlert('Recording Error', 'No audio was captured. Please try again.');
        }
      }
    } else {
      // Start recording
      try {
        console.log('[useVoiceRecording] Starting recording...');
        setLiveTranscript('');
        await voiceRecorder.startRecording();
        console.log('[useVoiceRecording] VoiceRecorder started successfully');

        // Start live speech recognition if available
        console.log('[useVoiceRecording] Checking live speech support:', {
          liveSpeech: !!liveSpeech,
          isSupported: liveSpeech?.isSupported()
        });
        if (liveSpeech && liveSpeech.isSupported()) {
          try {
            liveSpeech.start();
            const browser = detectBrowser();
            console.log(`[useVoiceRecording] Started live speech recognition (${browser.name})`);
          } catch (error: any) {
            console.error('[useVoiceRecording] Failed to start live speech:', error);
            // Continue with audio recording even if live speech fails
            const browser = detectBrowser();
            console.log(`[useVoiceRecording] Will use fallback transcription (${browser.name})`);
          }
        } else {
          const browser = detectBrowser();
          console.log(`[useVoiceRecording] Live speech not available in ${browser.name}, will use fallback`);
        }
      } catch (error: any) {
        console.error('[useVoiceRecording] Recording error:', error);
        const guidance = getBrowserGuidance('microphone');
        showAlert('Recording Error', `${error.message}\n\n${guidance}`);
      }
    }
  }, [isRecording, liveTranscript, onTranscriptionComplete, handleTranscription, showAlert]);

  const cancelRecording = useCallback(() => {
    const voiceRecorder = voiceRecorderRef.current;
    const liveSpeech = liveSpeechRef.current;

    voiceRecorder.cancelRecording();

    if (liveSpeech) {
      liveSpeech.abort();
    }

    setLiveTranscript('');
  }, []);

  const restartRecording = useCallback(async () => {
    const voiceRecorder = voiceRecorderRef.current;
    const liveSpeech = liveSpeechRef.current;

    // Cancel current recording
    voiceRecorder.cancelRecording();
    if (liveSpeech) {
      liveSpeech.abort();
    }
    setLiveTranscript('');

    // Small delay to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 100));

    // Start new recording
    try {
      await voiceRecorder.startRecording();
      if (liveSpeech && liveSpeech.isSupported()) {
        try {
          liveSpeech.start();
        } catch (error) {
          console.error('[useVoiceRecording] Failed to restart live speech:', error);
        }
      }
    } catch (error: any) {
      console.error('[useVoiceRecording] Failed to restart recording:', error);
    }
  }, []);

  const togglePause = useCallback(() => {
    const voiceRecorder = voiceRecorderRef.current;
    if (isPaused) {
      voiceRecorder.resumeRecording();
    } else {
      voiceRecorder.pauseRecording();
    }
  }, [isPaused]);

  return {
    isRecording,
    isPaused,
    recordingDuration,
    liveTranscript,
    isTranscribing,
    toggleRecording,
    cancelRecording,
    restartRecording,
    togglePause,
  };
}

export default useVoiceRecording;
