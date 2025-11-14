import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { formatEstimatedValue } from './valueFormatter';
import { getSkillsForPosition } from '@/constants/skills';

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
  tags?: string[] | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  risks?: string[] | null;
  ceiling_level?: string | null;
  sell_on_potential?: number | null;
  transfer_potential_comment?: string | null;
  shirt_number?: string | null;
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

    // Build ratings table - use correct skill labels
    const skills = getSkillsForPosition(player.position || null);
    const ratingsRows: any[] = [
      [
        { text: 'Skill', style: 'tableHeader', fillColor: '#f3f4f6' },
        { text: 'Rating', style: 'tableHeader', alignment: 'center', fillColor: '#f3f4f6' }
      ]
    ];

    // Map ratings to proper skill labels
    skills.forEach(skill => {
      const rating = ratings.find(r => r.parameter === skill.key);
      if (rating) {
        ratingsRows.push([
          { text: skill.label.toUpperCase(), style: 'tableCell' },
          { text: rating.score + '/10', style: 'tableCell', alignment: 'center', bold: true, color: '#2563eb' }
        ]);

        if (rating.comment) {
          ratingsRows.push([
            { text: rating.comment, style: 'comment', colSpan: 2, italics: true },
            {}
          ]);
        }
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

    const content: any[] = [];

    // ========== HEADER ==========
    content.push(
      { text: 'PLAYER PROFILE', style: 'header', alignment: 'center', margin: [0, 0, 0, 5] },
      { text: 'ScoutFlow Professional Analysis', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] }
    );

    // ========== RECOMMENDATION BADGE (TOP) ==========
    if (player.recommendation) {
      const recColor = 
        player.recommendation === "Sign" ? '#10b981' :
        player.recommendation === "Observe more" ? '#f59e0b' :
        player.recommendation === "Not sign" ? '#ef4444' :
        player.recommendation === "Invite for trial" ? '#3b82f6' :
        '#8b5cf6';
      
      content.push({
        table: {
          widths: ['*'],
          body: [[
            { 
              text: `★ RECOMMENDATION: ${player.recommendation.toUpperCase()} ★`, 
              style: 'recommendationBadge',
              fillColor: recColor,
              color: '#ffffff',
              bold: true,
              fontSize: 14,
              alignment: 'center',
              margin: [15, 12, 15, 12]
            }
          ]]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 25]
      });
    }

    // ========== BASIC INFORMATION ==========
    content.push({ text: 'Basic Information', style: 'sectionHeader', margin: [0, 0, 0, 10] });

    const basicInfoRows: any[] = [];
    
    basicInfoRows.push([
      { text: 'Name', style: 'label', border: [false, false, false, true] },
      { text: player.name, style: 'valueBold', border: [false, false, false, true] }
    ]);

    if (player.shirt_number) {
      basicInfoRows.push([
        { text: 'Shirt Number', style: 'label', border: [false, false, false, true] },
        { text: player.shirt_number, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.position) {
      basicInfoRows.push([
        { text: 'Position', style: 'label', border: [false, false, false, true] },
        { text: player.position, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.team) {
      basicInfoRows.push([
        { text: 'Team', style: 'label', border: [false, false, false, true] },
        { text: player.team, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.date_of_birth) {
      const age = calculateAge(player.date_of_birth);
      basicInfoRows.push([
        { text: 'Age', style: 'label', border: [false, false, false, true] },
        { text: `${age} years (DOB: ${new Date(player.date_of_birth).toLocaleDateString()})`, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.nationality) {
      basicInfoRows.push([
        { text: 'Nationality', style: 'label', border: [false, false, false, true] },
        { text: player.nationality, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.foot) {
      basicInfoRows.push([
        { text: 'Preferred Foot', style: 'label', border: [false, false, false, true] },
        { text: player.foot, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.height) {
      basicInfoRows.push([
        { text: 'Height', style: 'label', border: [false, false, false, true] },
        { text: `${player.height} cm`, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.weight) {
      basicInfoRows.push([
        { text: 'Weight', style: 'label', border: [false, false, false, true] },
        { text: `${player.weight} kg`, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.estimated_value_numeric) {
      basicInfoRows.push([
        { text: 'Estimated Value', style: 'label', border: [false, false, false, true] },
        { text: formatEstimatedValue(player.estimated_value_numeric), style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.contract_expires) {
      basicInfoRows.push([
        { text: 'Contract Expires', style: 'label', border: [false, false, false, true] },
        { text: new Date(player.contract_expires).toLocaleDateString(), style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.tags && player.tags.length > 0) {
      basicInfoRows.push([
        { text: 'Tags', style: 'label', border: [false, false, false, true] },
        { text: player.tags.join(', '), style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.video_link) {
      basicInfoRows.push([
        { text: 'Video Link', style: 'label', border: [false, false, false, true] },
        { text: player.video_link, style: 'linkValue', link: player.video_link, border: [false, false, false, true] }
      ]);
    }

    content.push({
      table: {
        widths: ['30%', '70%'],
        body: basicInfoRows
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 20]
    });

    // ========== PROFILE SUMMARY ==========
    if (player.profile_summary) {
      content.push(
        { text: 'Profile Summary', style: 'sectionHeader', margin: [0, 0, 0, 10] },
        { 
          text: player.profile_summary, 
          style: 'summaryText',
          margin: [0, 0, 0, 20]
        }
      );
    }

    // ========== PERFORMANCE STATISTICS ==========
    const hasStats = player.appearances !== null || player.goals !== null || player.assists !== null || player.minutesPlayed !== null;
    
    if (hasStats) {
      content.push({ text: 'Performance Statistics', style: 'sectionHeader', margin: [0, 0, 0, 10] });

      const statsRows: any[] = [];
      if (player.appearances !== null && player.appearances !== undefined) {
        statsRows.push([
          { text: 'Appearances', style: 'label', border: [false, false, false, true] },
          { text: String(player.appearances), style: 'statsValue', border: [false, false, false, true] }
        ]);
      }
      if (player.minutesPlayed !== null && player.minutesPlayed !== undefined) {
        statsRows.push([
          { text: 'Minutes Played', style: 'label', border: [false, false, false, true] },
          { text: String(player.minutesPlayed), style: 'statsValue', border: [false, false, false, true] }
        ]);
      }
      if (player.goals !== null && player.goals !== undefined) {
        statsRows.push([
          { text: 'Goals', style: 'label', border: [false, false, false, true] },
          { text: String(player.goals), style: 'statsValue', border: [false, false, false, true] }
        ]);
      }
      if (player.assists !== null && player.assists !== undefined) {
        statsRows.push([
          { text: 'Assists', style: 'label', border: [false, false, false, true] },
          { text: String(player.assists), style: 'statsValue', border: [false, false, false, true] }
        ]);
      }

      content.push({
        table: {
          widths: ['50%', '50%'],
          body: statsRows
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20]
      });
    }

    // ========== SKILLS RATINGS ==========
    if (averageRatings.length > 0) {
      content.push({ text: 'Skills Analysis', style: 'sectionHeader', margin: [0, 0, 0, 10] });

      const skills = getSkillsForPosition(player.position || null);
      const ratingsRows: any[] = [
        [
          { text: 'SKILL', style: 'tableHeader', fillColor: '#f3f4f6', bold: true },
          { text: 'RATING', style: 'tableHeader', alignment: 'center', fillColor: '#f3f4f6', bold: true }
        ]
      ];

      skills.forEach(skill => {
        const rating = averageRatings.find(r => r.parameter === skill.key);
        if (rating) {
          ratingsRows.push([
            { text: skill.label.toUpperCase(), style: 'tableCell', fontSize: 10 },
            { 
              text: rating.averageScore.toFixed(1) + '/10', 
              style: 'tableCell', 
              alignment: 'center', 
              bold: true, 
              color: '#2563eb',
              fontSize: 11
            }
          ]);
        }
      });

      content.push({
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
      });
    }

    // ========== STRENGTHS & WEAKNESSES ==========
    if ((player.strengths && player.strengths.length > 0) || (player.weaknesses && player.weaknesses.length > 0)) {
      content.push({ text: 'Player Analysis', style: 'sectionHeader', margin: [0, 0, 0, 15] });

      // STRENGTHS (GREEN SECTION)
      if (player.strengths && player.strengths.length > 0) {
        content.push({
          table: {
            widths: ['*'],
            body: [[
              { 
                text: '✓ STRENGTHS', 
                style: 'strengthsHeader',
                fillColor: '#10b981',
                color: '#ffffff',
                bold: true,
                fontSize: 11,
                margin: [10, 8, 10, 8]
              }
            ]]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 5]
        });

        content.push({
          ul: player.strengths.map(s => ({ text: s, color: '#111827' })),
          style: 'bulletList',
          margin: [15, 5, 0, 15]
        });
      }

      // WEAKNESSES (RED SECTION)
      if (player.weaknesses && player.weaknesses.length > 0) {
        content.push({
          table: {
            widths: ['*'],
            body: [[
              { 
                text: '✗ WEAKNESSES', 
                style: 'weaknessesHeader',
                fillColor: '#ef4444',
                color: '#ffffff',
                bold: true,
                fontSize: 11,
                margin: [10, 8, 10, 8]
              }
            ]]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 5]
        });

        content.push({
          ul: player.weaknesses.map(w => ({ text: w, color: '#111827' })),
          style: 'bulletList',
          margin: [15, 5, 0, 20]
        });
      }
    }

    // ========== RISKS / RED FLAGS ==========
    if (player.risks && player.risks.length > 0) {
      content.push({
        table: {
          widths: ['*'],
          body: [[
            { 
              text: '⚠ RISKS / RED FLAGS', 
              style: 'risksHeader',
              fillColor: '#f59e0b',
              color: '#ffffff',
              bold: true,
              fontSize: 11,
              margin: [10, 8, 10, 8]
            }
          ]]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 5]
      });

      content.push({
        ul: player.risks.map(r => ({ text: r, color: '#111827' })),
        style: 'bulletList',
        margin: [15, 5, 0, 20]
      });
    }

    // ========== TRANSFER POTENTIAL ==========
    const hasTransferPotential = player.ceiling_level || player.sell_on_potential !== null || player.transfer_potential_comment;
    
    if (hasTransferPotential) {
      content.push({ text: 'Transfer Potential', style: 'sectionHeader', margin: [0, 0, 0, 10] });

      const transferRows: any[] = [];
      
      if (player.ceiling_level) {
        transferRows.push([
          { text: 'Ceiling Level', style: 'label', border: [false, false, false, true] },
          { text: player.ceiling_level, style: 'value', bold: true, border: [false, false, false, true] }
        ]);
      }
      
      if (player.sell_on_potential !== null && player.sell_on_potential !== undefined) {
        transferRows.push([
          { text: 'Sell-on Potential', style: 'label', border: [false, false, false, true] },
          { text: `${player.sell_on_potential}/10`, style: 'value', bold: true, color: '#2563eb', fontSize: 12, border: [false, false, false, true] }
        ]);
      }
      
      if (player.transfer_potential_comment) {
        transferRows.push([
          { text: 'Comment', style: 'label', border: [false, false, false, true] },
          { text: player.transfer_potential_comment, style: 'value', border: [false, false, false, true] }
        ]);
      }

      content.push({
        table: {
          widths: ['35%', '65%'],
          body: transferRows
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20]
      });
    }

    // ========== SCOUT NOTES ==========
    if (player.scout_notes) {
      content.push(
        { text: 'Scout Notes', style: 'sectionHeader', margin: [0, 0, 0, 10] },
        { 
          text: player.scout_notes, 
          style: 'notes',
          margin: [0, 0, 0, 20]
        }
      );
    }

    // ========== FOOTER ==========
    content.push(
      { text: '', margin: [0, 10, 0, 0] },
      { text: `Report Generated: ${new Date().toLocaleString()}`, style: 'footer', margin: [0, 0, 0, 0] }
    );

    // ========== DOCUMENT DEFINITION ==========
    const docDefinition: any = {
      content,
      styles: {
        header: { fontSize: 24, bold: true, color: '#2563eb' },
        subheader: { fontSize: 12, color: '#059669', italics: true },
        sectionHeader: { fontSize: 14, bold: true, color: '#1f2937', margin: [0, 5, 0, 5] },
        label: { fontSize: 10, color: '#6b7280', bold: true },
        value: { fontSize: 11, color: '#111827' },
        valueBold: { fontSize: 12, color: '#111827', bold: true },
        statsValue: { fontSize: 11, color: '#2563eb', bold: true },
        linkValue: { fontSize: 10, color: '#2563eb', decoration: 'underline' },
        summaryText: { fontSize: 11, color: '#374151', lineHeight: 1.5, italics: true },
        notes: { fontSize: 10, color: '#374151', lineHeight: 1.4 },
        recommendationBadge: { fontSize: 14, bold: true },
        strengthsHeader: { fontSize: 11, bold: true },
        weaknessesHeader: { fontSize: 11, bold: true },
        risksHeader: { fontSize: 11, bold: true },
        bulletList: { fontSize: 10, color: '#111827', lineHeight: 1.3, margin: [5, 3, 5, 3] },
        tableHeader: { fontSize: 10, bold: true, margin: [8, 8, 8, 8], color: '#374151' },
        tableCell: { fontSize: 10, margin: [8, 6, 8, 6] },
        footer: { fontSize: 8, color: '#9ca3af', alignment: 'center', italics: true }
      },
      pageMargins: [40, 40, 40, 40]
    };

    await downloadPDF(docDefinition, `PlayerProfile_${player.name.replace(/\s+/g, '_')}`);
    console.log('Player profile PDF generated successfully with all new fields');
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
