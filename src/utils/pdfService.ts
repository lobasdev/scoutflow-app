import { supabase } from "@/integrations/supabase/client";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

interface Player {
  id?: string;
  name: string;
  position?: string | null;
  team?: string | null;
  nationality?: string | null;
  date_of_birth?: string | null;
  estimated_value?: string | null;
  estimated_value_numeric?: number | null;
  photo_url?: string | null;
  appearances?: number | null;
  minutesPlayed?: number | null;
  goals?: number | null;
  assists?: number | null;
  foot?: string | null;
  profile_summary?: string | null;
  height?: number | null;
  weight?: number | null;
  recommendation?: string | null;
  contract_expires?: string | null;
  scout_notes?: string | null;
  video_link?: string | null;
  tags?: string[] | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  risks?: string[] | null;
  ceiling_level?: string | null;
  sell_on_potential?: number | null;
  transfer_potential_comment?: string | null;
  shirt_number?: string | null;
  current_salary?: string | null;
  expected_salary?: string | null;
  agency?: string | null;
  agency_link?: string | null;
}

interface Observation {
  date: string;
  location: string | null;
  notes: string | null;
  video_link: string | null;
}

interface Rating {
  parameter: string;
  score: number;
  comment?: string | null;
}

export const generatePDF = async (
  player: Player,
  observation: Observation,
  ratings: Rating[]
) => {
  try {
    console.log('Calling PDF generation edge function for observation...');

    const { data, error } = await supabase.functions.invoke('generate-pdf', {
      body: {
        type: 'observation',
        data: {
          player,
          observation,
          ratings,
          fileName: `ObservationReport_${player.name.replace(/\s+/g, '_')}_${Date.now()}`
        }
      }
    });

    if (error) throw error;

    // The response is a PDF string, convert to blob
    const blob = new Blob([data as string], { type: 'application/pdf' });
    await downloadOrSharePDF(blob, `ObservationReport_${player.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    
    console.log('Observation PDF generated successfully');
  } catch (error) {
    console.error('Failed to generate observation PDF:', error);
    throw error;
  }
};

export const generatePlayerProfilePDF = async (
  player: Player,
  averageRatings: { parameter: string; averageScore: number }[],
  radarChartBase64?: string
) => {
  try {
    console.log('Calling PDF generation edge function for player profile...');

    const { data, error } = await supabase.functions.invoke('generate-pdf', {
      body: {
        type: 'player-profile',
        data: {
          player,
          averageRatings,
          radarChartBase64, // Note: Currently not used in backend, can be added later
          fileName: `PlayerProfile_${player.name.replace(/\s+/g, '_')}_${Date.now()}`
        }
      }
    });

    if (error) throw error;

    // The response is a PDF string, convert to blob
    const blob = new Blob([data as string], { type: 'application/pdf' });
    await downloadOrSharePDF(blob, `PlayerProfile_${player.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    
    console.log('Player profile PDF generated successfully');
  } catch (error) {
    console.error('Failed to generate player profile PDF:', error);
    throw error;
  }
};

async function downloadOrSharePDF(blob: Blob, fileName: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    // Mobile: Convert to base64 and share
    console.log('Mobile platform detected, sharing PDF...');
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    
    await new Promise<void>((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          
          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Data
          });
          
          await Share.share({
            title: 'Player Report',
            url: result.uri,
            dialogTitle: 'Share Report'
          });
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF blob'));
    });
  } else {
    // Web: Direct download
    console.log('Web platform detected, downloading PDF...');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}
