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

// Helper to fetch image as data URL for PDF
const fetchImageAsDataUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
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

    // ========== HEADER WITH PHOTO ==========
    const headerColumns = [];
    
    // Add player photo if available
    if (player.photo_url) {
      try {
        const imageDataUrl = await fetchImageAsDataUrl(player.photo_url);
        headerColumns.push({
          image: imageDataUrl,
          width: 80,
          height: 80,
          margin: [0, 0, 20, 0]
        });
      } catch (error) {
        console.error('Failed to load player photo:', error);
      }
    }
    
    // Add player info
    headerColumns.push({
      stack: [
        { text: player.name, style: 'header', margin: [0, 0, 0, 5] },
        { text: 'ScoutFlow Professional Analysis', style: 'subheader', margin: [0, 0, 0, 10] },
        {
          columns: [
            { text: player.position ? `Position: ${player.position}` : '', style: 'value', width: 'auto' },
            { text: player.team ? `  •  Team: ${player.team}` : '', style: 'value', width: 'auto' },
            { text: player.nationality ? `  •  Nationality: ${player.nationality}` : '', style: 'value', width: 'auto' }
          ].filter(col => col.text),
          margin: [0, 0, 0, 0]
        }
      ],
      width: '*'
    });
    
    if (headerColumns.length > 0) {
      content.push({
        columns: headerColumns,
        margin: [0, 0, 0, 20]
      });
    } else {
      content.push(
        { text: player.name, style: 'header', alignment: 'center', margin: [0, 0, 0, 5] },
        { text: 'ScoutFlow Professional Analysis', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] }
      );
    }

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

    // ========== BASIC INFORMATION (TWO-COLUMN LAYOUT) ==========
    content.push({ text: 'Basic Information', style: 'sectionHeader', margin: [0, 0, 0, 10] });

    const leftColumn: any[] = [];
    const rightColumn: any[] = [];
    
    // Left column data
    leftColumn.push([
      { text: 'Name', style: 'label', border: [false, false, false, true] },
      { text: player.name, style: 'valueBold', border: [false, false, false, true] }
    ]);

    if (player.position) {
      leftColumn.push([
        { text: 'Position', style: 'label', border: [false, false, false, true] },
        { text: player.position, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.team) {
      leftColumn.push([
        { text: 'Team', style: 'label', border: [false, false, false, true] },
        { text: player.team, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.date_of_birth) {
      const age = calculateAge(player.date_of_birth);
      leftColumn.push([
        { text: 'Age', style: 'label', border: [false, false, false, true] },
        { text: `${age} years`, style: 'value', border: [false, false, false, true] }
      ]);
    }

    // Right column data
    if (player.nationality) {
      rightColumn.push([
        { text: 'Nationality', style: 'label', border: [false, false, false, true] },
        { text: player.nationality, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.shirt_number) {
      rightColumn.push([
        { text: 'Shirt Number', style: 'label', border: [false, false, false, true] },
        { text: player.shirt_number, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.foot) {
      rightColumn.push([
        { text: 'Preferred Foot', style: 'label', border: [false, false, false, true] },
        { text: player.foot, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.height) {
      rightColumn.push([
        { text: 'Height', style: 'label', border: [false, false, false, true] },
        { text: `${player.height} cm`, style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.weight) {
      rightColumn.push([
        { text: 'Weight', style: 'label', border: [false, false, false, true] },
        { text: `${player.weight} kg`, style: 'value', border: [false, false, false, true] }
      ]);
    }

    // Create two-column layout for basic info
    content.push({
      columns: [
        {
          width: '48%',
          table: {
            widths: ['40%', '60%'],
            body: leftColumn
          },
          layout: 'noBorders'
        },
        { width: '4%', text: '' },
        {
          width: '48%',
          table: {
            widths: ['40%', '60%'],
            body: rightColumn
          },
          layout: 'noBorders'
        }
      ],
      margin: [0, 0, 0, 20]
    });

    // Additional info section
    const additionalInfoRows: any[] = [];
    
    if (player.estimated_value_numeric) {
      additionalInfoRows.push([
        { text: 'Estimated Value', style: 'label', border: [false, false, false, true] },
        { text: formatEstimatedValue(player.estimated_value_numeric), style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.contract_expires) {
      additionalInfoRows.push([
        { text: 'Contract Expires', style: 'label', border: [false, false, false, true] },
        { text: new Date(player.contract_expires).toLocaleDateString(), style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.tags && player.tags.length > 0) {
      additionalInfoRows.push([
        { text: 'Tags', style: 'label', border: [false, false, false, true] },
        { text: player.tags.join(', '), style: 'value', border: [false, false, false, true] }
      ]);
    }

    if (player.video_link) {
      additionalInfoRows.push([
        { text: 'Video Link', style: 'label', border: [false, false, false, true] },
        { text: player.video_link, style: 'linkValue', link: player.video_link, border: [false, false, false, true] }
      ]);
    }

    if (additionalInfoRows.length > 0) {
      content.push({
        table: {
          widths: ['30%', '70%'],
          body: additionalInfoRows
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20]
      });
    }

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

    // ========== PERFORMANCE STATISTICS (CARD LAYOUT) ==========
    const hasStats = player.appearances !== null || player.goals !== null || player.assists !== null || player.minutesPlayed !== null;
    
    if (hasStats) {
      content.push({ text: 'Performance Statistics', style: 'sectionHeader', margin: [0, 0, 0, 10] });

      const statCards = [];
      
      if (player.appearances !== null && player.appearances !== undefined) {
        statCards.push({
          width: '23%',
          table: {
            widths: ['*'],
            body: [
              [{ text: 'APPEARANCES', style: 'statLabel', alignment: 'center', fillColor: '#f3f4f6', border: [false, false, false, false] }],
              [{ text: String(player.appearances), style: 'statValue', alignment: 'center', border: [false, false, false, false] }]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 0]
        });
      }
      
      if (player.goals !== null && player.goals !== undefined) {
        statCards.push({
          width: '23%',
          table: {
            widths: ['*'],
            body: [
              [{ text: 'GOALS', style: 'statLabel', alignment: 'center', fillColor: '#f3f4f6', border: [false, false, false, false] }],
              [{ text: String(player.goals), style: 'statValue', alignment: 'center', border: [false, false, false, false] }]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 0]
        });
      }
      
      if (player.assists !== null && player.assists !== undefined) {
        statCards.push({
          width: '23%',
          table: {
            widths: ['*'],
            body: [
              [{ text: 'ASSISTS', style: 'statLabel', alignment: 'center', fillColor: '#f3f4f6', border: [false, false, false, false] }],
              [{ text: String(player.assists), style: 'statValue', alignment: 'center', border: [false, false, false, false] }]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 0]
        });
      }
      
      if (player.minutesPlayed !== null && player.minutesPlayed !== undefined) {
        statCards.push({
          width: '23%',
          table: {
            widths: ['*'],
            body: [
              [{ text: 'MINUTES', style: 'statLabel', alignment: 'center', fillColor: '#f3f4f6', border: [false, false, false, false] }],
              [{ text: String(player.minutesPlayed), style: 'statValue', alignment: 'center', border: [false, false, false, false] }]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 0]
        });
      }

      // Add spacers between cards
      const columnsWithSpacers = [];
      statCards.forEach((card, index) => {
        columnsWithSpacers.push(card);
        if (index < statCards.length - 1) {
          columnsWithSpacers.push({ width: '2%', text: '' });
        }
      });

      content.push({
        columns: columnsWithSpacers,
        margin: [0, 0, 0, 20]
      });
    }

    // ========== SKILLS ANALYSIS (DEDICATED SECTION) ==========
    if (averageRatings.length > 0) {
      content.push({ 
        text: 'Skills Analysis', 
        style: 'sectionHeader', 
        margin: [0, 5, 0, 10],
        pageBreak: averageRatings.length > 5 ? 'before' : undefined 
      });

      const skills = getSkillsForPosition(player.position || null);
      const ratingsRows: any[] = [
        [
          { text: 'SKILL', style: 'tableHeader', fillColor: '#2563eb', color: '#ffffff', bold: true },
          { text: 'RATING', style: 'tableHeader', alignment: 'center', fillColor: '#2563eb', color: '#ffffff', bold: true }
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
          hLineColor: () => '#e5e7eb',
          paddingTop: () => 8,
          paddingBottom: () => 8
        },
        margin: [0, 0, 0, 25]
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
        header: { fontSize: 22, bold: true, color: '#1f2937' },
        subheader: { fontSize: 11, color: '#6b7280', italics: true },
        sectionHeader: { fontSize: 15, bold: true, color: '#1f2937', margin: [0, 8, 0, 8] },
        label: { fontSize: 9, color: '#6b7280', bold: true, margin: [0, 2, 0, 2] },
        value: { fontSize: 10, color: '#111827', margin: [0, 2, 0, 2] },
        valueBold: { fontSize: 11, color: '#111827', bold: true, margin: [0, 2, 0, 2] },
        statsValue: { fontSize: 11, color: '#2563eb', bold: true },
        statLabel: { fontSize: 9, color: '#6b7280', bold: true, margin: [8, 8, 8, 4] },
        statValue: { fontSize: 18, color: '#2563eb', bold: true, margin: [8, 4, 8, 8] },
        linkValue: { fontSize: 10, color: '#2563eb', decoration: 'underline' },
        summaryText: { fontSize: 11, color: '#374151', lineHeight: 1.6, italics: true },
        notes: { fontSize: 10, color: '#374151', lineHeight: 1.5 },
        recommendationBadge: { fontSize: 14, bold: true },
        strengthsHeader: { fontSize: 11, bold: true },
        weaknessesHeader: { fontSize: 11, bold: true },
        risksHeader: { fontSize: 11, bold: true },
        bulletList: { fontSize: 10, color: '#111827', lineHeight: 1.4, margin: [5, 3, 5, 3] },
        tableHeader: { fontSize: 10, bold: true, margin: [10, 10, 10, 10], color: '#ffffff' },
        tableCell: { fontSize: 10, margin: [10, 8, 10, 8] },
        footer: { fontSize: 8, color: '#9ca3af', alignment: 'center', italics: true }
      },
      pageMargins: [40, 40, 40, 50]
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
    // Web: direct download using blob
    return new Promise((resolve, reject) => {
      try {
        const pdfDoc = pdfMake.createPdf(docDefinition);
        
        pdfDoc.getBlob((blob) => {
          try {
            // Create a temporary URL for the blob
            const url = URL.createObjectURL(blob);
            
            // Create a temporary anchor element and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = fullFileName;
            link.style.display = 'none';
            
            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL after a short delay
            setTimeout(() => {
              URL.revokeObjectURL(url);
              console.log('PDF download completed:', fullFileName);
              resolve();
            }, 100);
          } catch (error) {
            console.error('Error creating download link:', error);
            reject(error);
          }
        });
      } catch (error) {
        console.error('Error generating PDF blob:', error);
        reject(error);
      }
    });
  }
};
