import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';

interface VoiceNoteRecorderProps {
  onSave: (blob: Blob, duration: number) => Promise<any>;
  uploading: boolean;
}

export function VoiceNoteRecorder({ onSave, uploading }: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const duration = (Date.now() - startTimeRef.current) / 1000;
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        await onSave(blob, duration);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [onSave]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (uploading) {
    return (
      <Button disabled variant="outline" size="sm">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Saving...
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <>
          <span className="text-sm text-destructive font-medium animate-pulse">
            ● {formatTime(recordingTime)}
          </span>
          <Button
            onClick={stopRecording}
            variant="destructive"
            size="sm"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
        </>
      ) : (
        <Button
          onClick={startRecording}
          variant="outline"
          size="sm"
        >
          <Mic className="h-4 w-4 mr-2" />
          Record Note
        </Button>
      )}
    </div>
  );
}
