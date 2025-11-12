import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { formatEstimatedValue } from './valueFormatter';

// Configure pdfMake fonts - pdfFonts is already the vfs object
if (typeof pdfFonts !== 'undefined') {
  (pdfMake as any).vfs = pdfFonts;
}

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

const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const safeValue = (value: any, fallback: string = 'N/A'): string => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
};

// Generate observation report PDF
export const generatePDF = async (
  player: Player,
  observation: Observation,
  ratings: Rating[]
) => {
  try {
    console.log('Generating observation report PDF...');

    const avgRating = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
      : 'N/A';

    // Build player info rows
    const playerRows: any[] = [
      [{ text: 'Player', style: 'label', border: [false, false, false, true] }, 
       { text: player.name, style: 'value', border: [false, false, false, true] }]
    ];

    if (player.position) {
      playerRows.push([
        { text: 'Position', style: 'label', border: [false, false, false, true] },
        { text: player.position, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.team) {
      playerRows.push([
        { text: 'Team', style: 'label', border: [false, false, false, true] },
        { text: player.team, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.date_of_birth) {
      const age = calculateAge(player.date_of_birth);
      playerRows.push([
        { text: 'Age', style: 'label', border: [false, false, false, true] },
        { text: `${age} years`, style: 'value', border: [false, false, false, true] }
      ]);
    }

    // Build observation rows
    const observationRows: any[] = [
      [{ text: 'Date', style: 'label', border: [false, false, false, true] },
       { text: new Date(observation.date).toLocaleDateString(), style: 'value', border: [false, false, false, true] }]
    ];

    if (observation.location) {
      observationRows.push([
        { text: 'Location', style: 'label', border: [false, false, false, true] },
        { text: observation.location, style: 'value', border: [false, false, false, true] }
      ]);
    }

    // Build ratings table
    const ratingsRows: any[] = [
      [
        { text: 'Skill', style: 'tableHeader', fillColor: '#f3f4f6' },
        { text: 'Rating', style: 'tableHeader', alignment: 'center', fillColor: '#f3f4f6' }
      ]
    ];

    ratings.forEach(rating => {
      ratingsRows.push([
        { text: rating.parameter.replace(/_/g, ' ').toUpperCase(), style: 'tableCell' },
        { text: rating.score + '/10', style: 'tableCell', alignment: 'center', bold: true, color: '#2563eb' }
      ]);

      if (rating.comment) {
        ratingsRows.push([
          { text: rating.comment, style: 'comment', colSpan: 2, italics: true },
          {}
        ]);
      }
    });

    const docDefinition: any = {
      content: [
        { text: 'SCOUTING REPORT', style: 'header', alignment: 'center', margin: [0, 0, 0, 10] },
        { text: 'ScoutFlow', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 30] },

        { text: 'Player Information', style: 'sectionHeader', margin: [0, 0, 0, 10] },
        {
          table: {
            widths: ['30%', '70%'],
            body: playerRows
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 20]
        },

        { text: 'Observation Details', style: 'sectionHeader', margin: [0, 0, 0, 10] },
        {
          table: {
            widths: ['30%', '70%'],
            body: observationRows
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 20]
        },

        ...(observation.notes ? [
          { text: 'Notes', style: 'sectionHeader', margin: [0, 0, 0, 10] },
          { text: observation.notes, style: 'notes', margin: [0, 0, 0, 20] }
        ] : []),

        { text: 'Performance Analysis', style: 'sectionHeader', margin: [0, 0, 0, 10] },
        {
          table: {
            widths: ['*'],
            body: [[{
              text: `Overall Rating: ${avgRating}`,
              style: 'avgRating',
              alignment: 'center',
              fillColor: '#2563eb',
              color: '#ffffff',
              margin: [10, 10, 10, 10]
            }]]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 20]
        },

        {
          table: {
            widths: ['70%', '30%'],
            body: ratingsRows
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#e5e7eb'
          }
        },

        { text: `Generated: ${new Date().toLocaleString()}`, style: 'footer', margin: [0, 30, 0, 0] }
      ],
      styles: {
        header: { fontSize: 22, bold: true, color: '#2563eb' },
        subheader: { fontSize: 12, color: '#059669' },
        sectionHeader: { fontSize: 14, bold: true, color: '#1f2937' },
        label: { fontSize: 10, color: '#6b7280', bold: true },
        value: { fontSize: 11, color: '#111827' },
        notes: { fontSize: 10, color: '#374151', lineHeight: 1.4 },
        avgRating: { fontSize: 18, bold: true },
        tableHeader: { fontSize: 11, bold: true, margin: [5, 5, 5, 5] },
        tableCell: { fontSize: 10, margin: [5, 5, 5, 5] },
        comment: { fontSize: 9, color: '#6b7280', margin: [5, 2, 5, 5] },
        footer: { fontSize: 8, color: '#9ca3af', alignment: 'center' }
      },
      pageMargins: [40, 40, 40, 40]
    };

    await downloadPDF(docDefinition, `ScoutingReport_${player.name.replace(/\s+/g, '_')}`);
    console.log('Observation report generated successfully');
  } catch (error) {
    console.error('Error generating observation report:', error);
    throw error;
  }
};

// Generate player profile PDF
export const generatePlayerProfilePDF = async (
  player: Player,
  averageRatings: { parameter: string; averageScore: number }[]
) => {
  try {
    console.log('Generating player profile PDF...');

    // Build player info rows
    const playerRows: any[] = [
      [{ text: 'Name', style: 'label', border: [false, false, false, true] },
       { text: player.name, style: 'value', border: [false, false, false, true] }]
    ];

    if (player.profile_summary) {
      playerRows.push([
        { text: 'Summary', style: 'label', border: [false, false, false, true] },
        { text: player.profile_summary, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.recommendation) {
      playerRows.push([
        { text: 'Recommendation', style: 'label', border: [false, false, false, true] },
        { text: player.recommendation, style: 'recommendationValue', bold: true, border: [false, false, false, true] }
      ]);
    }

    if (player.date_of_birth) {
      const age = calculateAge(player.date_of_birth);
      playerRows.push([
        { text: 'Age', style: 'label', border: [false, false, false, true] },
        { text: `${age} years (${new Date(player.date_of_birth).toLocaleDateString()})`, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.position) {
      playerRows.push([
        { text: 'Position', style: 'label', border: [false, false, false, true] },
        { text: player.position, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.team) {
      playerRows.push([
        { text: 'Team', style: 'label', border: [false, false, false, true] },
        { text: player.team, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.nationality) {
      playerRows.push([
        { text: 'Nationality', style: 'label', border: [false, false, false, true] },
        { text: player.nationality, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.foot) {
      playerRows.push([
        { text: 'Preferred Foot', style: 'label', border: [false, false, false, true] },
        { text: player.foot, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.height) {
      playerRows.push([
        { text: 'Height', style: 'label', border: [false, false, false, true] },
        { text: `${player.height} cm`, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.weight) {
      playerRows.push([
        { text: 'Weight', style: 'label', border: [false, false, false, true] },
        { text: `${player.weight} kg`, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.estimated_value_numeric) {
      playerRows.push([
        { text: 'Estimated Value', style: 'label', border: [false, false, false, true] },
        { text: formatEstimatedValue(player.estimated_value_numeric), style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.contract_expires) {
      playerRows.push([
        { text: 'Contract Expires', style: 'label', border: [false, false, false, true] },
        { text: new Date(player.contract_expires).toLocaleDateString(), style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.video_link) {
      playerRows.push([
        { text: 'Video Link', style: 'label', border: [false, false, false, true] },
        { text: player.video_link, style: 'value', link: player.video_link, color: '#2563eb', border: [false, false, false, true] }
      ]);
    }

    // Build stats rows
    const statsRows: any[] = [];
    if (player.appearances !== null && player.appearances !== undefined) {
      statsRows.push([
        { text: 'Appearances', style: 'label', border: [false, false, false, true] },
        { text: String(player.appearances), style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.minutesPlayed !== null && player.minutesPlayed !== undefined) {
      statsRows.push([
        { text: 'Minutes Played', style: 'label', border: [false, false, false, true] },
        { text: String(player.minutesPlayed), style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.goals !== null && player.goals !== undefined) {
      statsRows.push([
        { text: 'Goals', style: 'label', border: [false, false, false, true] },
        { text: String(player.goals), style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.assists !== null && player.assists !== undefined) {
      statsRows.push([
        { text: 'Assists', style: 'label', border: [false, false, false, true] },
        { text: String(player.assists), style: 'value', border: [false, false, false, true] }
      ]);
    }

    // Build ratings table
    const ratingsRows: any[] = [
      [
        { text: 'Skill', style: 'tableHeader', fillColor: '#f3f4f6' },
        { text: 'Average', style: 'tableHeader', alignment: 'center', fillColor: '#f3f4f6' }
      ]
    ];

    averageRatings.forEach(rating => {
      ratingsRows.push([
        { text: rating.parameter.replace(/_/g, ' ').toUpperCase(), style: 'tableCell' },
        { text: rating.averageScore.toFixed(1) + '/10', style: 'tableCell', alignment: 'center', bold: true, color: '#2563eb' }
      ]);
    });

    const content: any[] = [
      { text: 'PLAYER PROFILE', style: 'header', alignment: 'center', margin: [0, 0, 0, 10] },
      { text: 'ScoutFlow Professional Analysis', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 30] },

      { text: 'Player Information', style: 'sectionHeader', margin: [0, 0, 0, 10] },
      {
        table: {
          widths: ['30%', '70%'],
          body: playerRows
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20]
      }
    ];

    // Add stats section if we have any stats
    if (statsRows.length > 0) {
      content.push(
        { text: 'Performance Statistics', style: 'sectionHeader', margin: [0, 0, 0, 10] },
        {
          table: {
            widths: ['50%', '50%'],
            body: statsRows
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 20]
        }
      );
    }

    // Add ratings section if we have ratings
    if (averageRatings.length > 0) {
      content.push(
        { text: 'Skills Overview', style: 'sectionHeader', margin: [0, 0, 0, 10] },
        {
          table: {
            widths: ['70%', '30%'],
            body: ratingsRows
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#e5e7eb'
          },
          margin: [0, 0, 0, 20]
        }
      );
    }

    // Add scout notes if available
    if (player.scout_notes) {
      content.push(
        { text: 'Scout Notes', style: 'sectionHeader', margin: [0, 0, 0, 10] },
        { text: player.scout_notes, style: 'notes', margin: [0, 0, 0, 20] }
      );
    }

    content.push(
      { text: `Generated: ${new Date().toLocaleString()}`, style: 'footer', margin: [0, 30, 0, 0] }
    );

    const docDefinition: any = {
      content,
      styles: {
        header: { fontSize: 22, bold: true, color: '#2563eb' },
        subheader: { fontSize: 12, color: '#059669' },
        sectionHeader: { fontSize: 14, bold: true, color: '#1f2937' },
        label: { fontSize: 10, color: '#6b7280', bold: true },
        value: { fontSize: 11, color: '#111827' },
        recommendationValue: { fontSize: 11, color: '#8b5cf6' },
        notes: { fontSize: 10, color: '#374151', lineHeight: 1.4 },
        tableHeader: { fontSize: 11, bold: true, margin: [5, 5, 5, 5] },
        tableCell: { fontSize: 10, margin: [5, 5, 5, 5] },
        footer: { fontSize: 8, color: '#9ca3af', alignment: 'center' }
      },
      pageMargins: [40, 40, 40, 40]
    };

    await downloadPDF(docDefinition, `PlayerProfile_${player.name.replace(/\s+/g, '_')}`);
    console.log('Player profile generated successfully');
  } catch (error) {
    console.error('Error generating player profile:', error);
    throw error;
  }
};

// Helper function to handle PDF download/share
const downloadPDF = async (docDefinition: any, fileName: string): Promise<void> => {
  const timestamp = new Date().getTime();
  const fullFileName = `${fileName}_${timestamp}.pdf`;

  if (Capacitor.isNativePlatform()) {
    // Mobile: save and share using Directory.Data for better persistence
    return new Promise((resolve, reject) => {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      pdfDoc.getBase64((base64) => {
        Filesystem.writeFile({
          path: fullFileName,
          data: base64,
          directory: Directory.Data
        })
        .then(result => {
          console.log('PDF saved to Data directory:', result.uri);
          return Share.share({
            title: 'Player Report',
            url: result.uri,
            dialogTitle: 'Share Report'
          });
        })
        .then(() => resolve())
        .catch(reject);
      });
    });
  } else {
    // Web: direct download
    return new Promise((resolve, reject) => {
      try {
        const pdfDoc = pdfMake.createPdf(docDefinition);
        pdfDoc.download(fullFileName);
        console.log('PDF download triggered:', fullFileName);
        
        // Give the download a moment to start
        setTimeout(() => resolve(), 100);
      } catch (error) {
        reject(error);
      }
    });
  }
};
