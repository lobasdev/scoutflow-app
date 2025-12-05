import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { VoiceNote } from '@/hooks/useVoiceNotes';

interface VoiceNotePlayerProps {
  note: VoiceNote;
  getAudioUrl: (filePath: string) => Promise<string | null>;
  onDelete: (note: VoiceNote) => Promise<void>;
}

export function VoiceNotePlayer({ note, getAudioUrl, onDelete }: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const loadAndPlay = async () => {
    setIsLoading(true);
    try {
      let url = audioUrl;
      if (!url) {
        url = await getAudioUrl(note.file_path);
        if (!url) throw new Error('Failed to get audio URL');
        setAudioUrl(url);
      }

      if (!audioRef.current) {
        audioRef.current = new Audio(url);
        audioRef.current.ontimeupdate = () => {
          setCurrentTime(audioRef.current?.currentTime || 0);
        };
        audioRef.current.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };
      }

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      await loadAndPlay();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = note.duration > 0 ? (currentTime / note.duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={togglePlay}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(note.duration)}</span>
        </div>
      </div>

      <span className="text-xs text-muted-foreground shrink-0">
        {format(new Date(note.created_at), 'MMM d, HH:mm')}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(note)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
