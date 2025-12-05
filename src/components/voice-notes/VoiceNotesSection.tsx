import { useVoiceNotes } from '@/hooks/useVoiceNotes';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { Mic } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface VoiceNotesSectionProps {
  playerId?: string;
  matchId?: string;
}

export function VoiceNotesSection({ playerId, matchId }: VoiceNotesSectionProps) {
  const {
    voiceNotes,
    loading,
    uploading,
    uploadVoiceNote,
    deleteVoiceNote,
    getAudioUrl,
  } = useVoiceNotes({ playerId, matchId });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Notes
        </h3>
        <VoiceNoteRecorder onSave={uploadVoiceNote} uploading={uploading} />
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : voiceNotes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No voice notes yet. Tap "Record Note" to add one.
        </p>
      ) : (
        <div className="space-y-2">
          {voiceNotes.map(note => (
            <VoiceNotePlayer
              key={note.id}
              note={note}
              getAudioUrl={getAudioUrl}
              onDelete={deleteVoiceNote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
