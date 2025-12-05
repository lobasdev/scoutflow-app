import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface VoiceNote {
  id: string;
  file_path: string;
  duration: number;
  created_at: string;
  player_id?: string;
  match_id?: string;
}

interface UseVoiceNotesOptions {
  playerId?: string;
  matchId?: string;
}

export function useVoiceNotes({ playerId, matchId }: UseVoiceNotesOptions) {
  const { user } = useAuth();
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchVoiceNotes = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('voice_notes')
        .select('*')
        .eq('scout_id', user.id)
        .order('created_at', { ascending: false });

      if (playerId) {
        query = query.eq('player_id', playerId);
      } else if (matchId) {
        query = query.eq('match_id', matchId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setVoiceNotes(data || []);
    } catch (error) {
      console.error('Error fetching voice notes:', error);
      toast.error('Failed to load voice notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoiceNotes();
  }, [user, playerId, matchId]);

  const uploadVoiceNote = async (audioBlob: Blob, duration: number) => {
    if (!user) {
      toast.error('You must be logged in');
      return null;
    }

    setUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}.webm`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('voice-notes')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
        });

      if (uploadError) throw uploadError;

      // Save metadata to database
      const { data, error: dbError } = await supabase
        .from('voice_notes')
        .insert({
          scout_id: user.id,
          player_id: playerId || null,
          match_id: matchId || null,
          file_path: fileName,
          duration: Math.round(duration),
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setVoiceNotes(prev => [data, ...prev]);
      toast.success('Voice note saved');
      return data;
    } catch (error) {
      console.error('Error uploading voice note:', error);
      toast.error('Failed to save voice note');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteVoiceNote = async (note: VoiceNote) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('voice-notes')
        .remove([note.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('voice_notes')
        .delete()
        .eq('id', note.id);

      if (dbError) throw dbError;

      setVoiceNotes(prev => prev.filter(n => n.id !== note.id));
      toast.success('Voice note deleted');
    } catch (error) {
      console.error('Error deleting voice note:', error);
      toast.error('Failed to delete voice note');
    }
  };

  const getAudioUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('voice-notes')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting audio URL:', error);
      return null;
    }
  };

  return {
    voiceNotes,
    loading,
    uploading,
    uploadVoiceNote,
    deleteVoiceNote,
    getAudioUrl,
    refetch: fetchVoiceNotes,
  };
}
