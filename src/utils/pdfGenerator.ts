import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { formatEstimatedValue } from './valueFormatter';
import { getSkillsForPosition } from '@/constants/skills';

// Configure pdfMake fonts
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

// Convert image URL to base64 - with robust error handling
const imageToBase64 = async (url: string): Promise<string | null> => {
  try {
    console.log('Converting image to base64:', url);
    
    // Clean URL - remove query parameters
    const cleanUrl = url.split('?')[0];
    
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(cleanUrl, {
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('Image converted successfully');
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        console.error('FileReader error');
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to convert image:', error);
    return null;
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

    const skills = getSkillsForPosition(player.position || null);
    const ratingsRows: any[] = [
      [
        { text: 'Skill', style: 'tableHeader', fillColor: '#f3f4f6' },
        { text: 'Rating', style: 'tableHeader', alignment: 'center', fillColor: '#f3f4f6' }
      ]
    ];

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
        { text: 'SCOUTING REPORT', style: 'title', margin: [0, 0, 0, 20] },
        { text: 'Player Information', style: 'sectionHeader', margin: [0, 0, 0, 10] },
        {
          table: { widths: ['40%', '60%'], body: playerRows },
          layout: 'noBorders',
          margin: [0, 0, 0, 20]
        },
        { text: 'Observation Details', style: 'sectionHeader', margin: [0, 0, 0, 10] },
        {
          table: { widths: ['40%', '60%'], body: observationRows },
          layout: 'noBorders',
          margin: [0, 0, 0, 20]
        },
        { text: 'Performance Ratings', style: 'sectionHeader', margin: [0, 0, 0, 10] },
        {
          table: { widths: ['70%', '30%'], body: ratingsRows },
          layout: { hLineWidth: () => 0.5, vLineWidth: () => 0, hLineColor: () => '#e5e7eb' },
          margin: [0, 0, 0, 10]
        },
        {
          text: `Average Rating: ${avgRating}/10`,
          style: 'avgRating',
          margin: [0, 10, 0, 20]
        }
      ],
      styles: {
        title: { fontSize: 20, bold: true, alignment: 'center', color: '#1f2937' },
        sectionHeader: { fontSize: 14, bold: true, color: '#1f2937', margin: [0, 10, 0, 5] },
        label: { fontSize: 9, color: '#6b7280', bold: true },
        value: { fontSize: 10, color: '#111827' },
        tableHeader: { fontSize: 10, bold: true, margin: [5, 5, 5, 5] },
        tableCell: { fontSize: 10, margin: [5, 5, 5, 5] },
        comment: { fontSize: 9, color: '#6b7280', margin: [5, 2, 5, 5] },
        avgRating: { fontSize: 12, bold: true, color: '#2563eb', alignment: 'center' }
      },
      pageMargins: [40, 40, 40, 40]
    };

    if (observation.notes) {
      docDefinition.content.push(
        { text: 'Scout Notes', style: 'sectionHeader', margin: [0, 20, 0, 10] },
        { text: observation.notes, style: 'notes', margin: [0, 0, 0, 0] }
      );
      docDefinition.styles.notes = { fontSize: 10, color: '#374151', lineHeight: 1.5 };
    }

    await downloadPDF(docDefinition, `ObservationReport_${player.name.replace(/\s+/g, '_')}`);
    console.log('Observation report PDF generated successfully');
  } catch (error) {
    console.error('Failed to generate observation PDF:', error);
    throw error;
  }
};

// Generate player profile PDF
export const generatePlayerProfilePDF = async (
  player: Player,
  averageRatings: { parameter: string; averageScore: number }[],
  radarChartBase64?: string
) => {
  try {
    console.log('=== Starting Player Profile PDF Generation ===');
    console.log('Player:', player.name);
    console.log('Has radar chart:', !!radarChartBase64);
    console.log('Has photo URL:', !!player.photo_url);

    const content: any[] = [];

    // === HEADER SECTION ===
    const headerColumns: any[] = [];
    
    // Try to load player photo
    if (player.photo_url) {
      console.log('Attempting to load player photo...');
      const photoBase64 = await imageToBase64(player.photo_url);
      if (photoBase64) {
        console.log('Photo loaded successfully');
        headerColumns.push({
          image: photoBase64,
          width: 80,
          height: 80,
          fit: [80, 80],
          margin: [0, 0, 15, 0]
        });
      } else {
        console.log('Photo load failed, continuing without it');
      }
    }

    // Player info
    const infoLines: string[] = [];
    if (player.position) infoLines.push(`Position: ${player.position}`);
    if (player.team) infoLines.push(`Team: ${player.team}`);
    if (player.nationality) infoLines.push(`Nationality: ${player.nationality}`);
    if (player.date_of_birth) {
      const age = calculateAge(player.date_of_birth);
      infoLines.push(`Age: ${age}`);
    }

    headerColumns.push({
      stack: [
        { text: player.name, fontSize: 20, bold: true, color: '#1f2937', margin: [0, 0, 0, 5] },
        { text: 'Player Profile', fontSize: 11, color: '#6b7280', italics: true, margin: [0, 0, 0, 10] },
        { text: infoLines.join(' • '), fontSize: 9, color: '#111827' }
      ],
      width: '*'
    });

    if (headerColumns.length > 0) {
      content.push({ columns: headerColumns, margin: [0, 0, 0, 20] });
    }

    // === RECOMMENDATION BADGE ===
    if (player.recommendation) {
      const recColor = 
        player.recommendation === "Sign" ? '#10b981' :
        player.recommendation === "Observe more" ? '#f59e0b' :
        player.recommendation === "Not sign" ? '#ef4444' :
        player.recommendation === "Invite for trial" ? '#3b82f6' : '#8b5cf6';
      
      content.push({
        table: {
          widths: ['*'],
          body: [[{
            text: `★ ${player.recommendation.toUpperCase()} ★`,
            fillColor: recColor,
            color: '#ffffff',
            bold: true,
            fontSize: 13,
            alignment: 'center',
            margin: [10, 10, 10, 10],
            border: [false, false, false, false]
          }]]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20]
      });
    }

    // === BASIC INFO ===
    const infoRows: any[] = [];
    
    if (player.height || player.weight || player.foot) {
      content.push({ text: 'Physical Attributes', fontSize: 13, bold: true, margin: [0, 0, 0, 10] });
      
      if (player.height) {
        infoRows.push([
          { text: 'Height', fontSize: 9, color: '#6b7280', bold: true, border: [false, false, false, true] },
          { text: `${player.height} cm`, fontSize: 10, border: [false, false, false, true] }
        ]);
      }
      if (player.weight) {
        infoRows.push([
          { text: 'Weight', fontSize: 9, color: '#6b7280', bold: true, border: [false, false, false, true] },
          { text: `${player.weight} kg`, fontSize: 10, border: [false, false, false, true] }
        ]);
      }
      if (player.foot) {
        infoRows.push([
          { text: 'Preferred Foot', fontSize: 9, color: '#6b7280', bold: true, border: [false, false, false, true] },
          { text: player.foot, fontSize: 10, border: [false, false, false, true] }
        ]);
      }
      
      content.push({
        table: { widths: ['35%', '65%'], body: infoRows },
        layout: 'noBorders',
        margin: [0, 0, 0, 20]
      });
    }

    // === STATS ===
    const hasStats = player.appearances || player.goals || player.assists || player.minutesPlayed;
    if (hasStats) {
      content.push({ text: 'Performance Stats', fontSize: 13, bold: true, margin: [0, 0, 0, 10] });
      
      const statCards: any[] = [];
      
      if (player.appearances) {
        statCards.push({
          width: '23%',
          table: {
            widths: ['*'],
            body: [
              [{ text: 'Appearances', fontSize: 8, color: '#6b7280', bold: true, alignment: 'center', fillColor: '#f3f4f6', border: [false, false, false, false] }],
              [{ text: String(player.appearances), fontSize: 16, bold: true, color: '#2563eb', alignment: 'center', border: [false, false, false, false] }]
            ]
          },
          layout: 'noBorders'
        });
      }
      
      if (player.goals) {
        statCards.push({
          width: '23%',
          table: {
            widths: ['*'],
            body: [
              [{ text: 'Goals', fontSize: 8, color: '#6b7280', bold: true, alignment: 'center', fillColor: '#f3f4f6', border: [false, false, false, false] }],
              [{ text: String(player.goals), fontSize: 16, bold: true, color: '#2563eb', alignment: 'center', border: [false, false, false, false] }]
            ]
          },
          layout: 'noBorders'
        });
      }
      
      if (player.assists) {
        statCards.push({
          width: '23%',
          table: {
            widths: ['*'],
            body: [
              [{ text: 'Assists', fontSize: 8, color: '#6b7280', bold: true, alignment: 'center', fillColor: '#f3f4f6', border: [false, false, false, false] }],
              [{ text: String(player.assists), fontSize: 16, bold: true, color: '#2563eb', alignment: 'center', border: [false, false, false, false] }]
            ]
          },
          layout: 'noBorders'
        });
      }
      
      const columnsWithSpacers: any[] = [];
      statCards.forEach((card, i) => {
        columnsWithSpacers.push(card);
        if (i < statCards.length - 1) {
          columnsWithSpacers.push({ width: '2%', text: '' });
        }
      });
      
      content.push({ columns: columnsWithSpacers, margin: [0, 0, 0, 20] });
    }

    // === SKILLS SECTION ===
    if (averageRatings.length > 0) {
      content.push({ 
        text: 'Skills Profile', 
        fontSize: 13, 
        bold: true, 
        margin: [0, 10, 0, 15]
      });

      // Add radar chart if available
      if (radarChartBase64) {
        console.log('Adding radar chart to PDF');
        content.push({
          image: radarChartBase64,
          width: 350,
          alignment: 'center',
          margin: [0, 0, 0, 15]
        });
      }

      // Skills table
      const skills = getSkillsForPosition(player.position || null);
      const skillRows: any[] = [
        [
          { text: 'Skill', fontSize: 9, bold: true, fillColor: '#f3f4f6', border: [false, false, false, true] },
          { text: 'Rating', fontSize: 9, bold: true, alignment: 'center', fillColor: '#f3f4f6', border: [false, false, false, true] }
        ]
      ];

      averageRatings.forEach(rating => {
        const skill = skills.find(s => s.key === rating.parameter);
        const label = skill ? skill.label : rating.parameter.replace(/_/g, ' ');
        
        skillRows.push([
          { text: label.toUpperCase(), fontSize: 9, color: '#111827', border: [false, false, false, true] },
          { text: rating.averageScore.toFixed(1) + '/10', fontSize: 10, bold: true, color: '#2563eb', alignment: 'center', border: [false, false, false, true] }
        ]);
      });

      content.push({
        table: { widths: ['70%', '30%'], body: skillRows },
        layout: 'noBorders',
        margin: [0, 0, 0, 20]
      });
    }

    // === STRENGTHS ===
    if (player.strengths && player.strengths.length > 0) {
      content.push({
        table: {
          widths: ['*'],
          body: [[{
            text: '✓ STRENGTHS',
            fillColor: '#10b981',
            color: '#ffffff',
            bold: true,
            fontSize: 10,
            margin: [8, 8, 8, 8],
            border: [false, false, false, false]
          }]]
        },
        layout: 'noBorders',
        margin: [0, 5, 0, 5]
      });
      
      content.push({
        ul: player.strengths.map(s => ({ text: s, fontSize: 9 })),
        margin: [10, 5, 0, 15]
      });
    }

    // === WEAKNESSES ===
    if (player.weaknesses && player.weaknesses.length > 0) {
      content.push({
        table: {
          widths: ['*'],
          body: [[{
            text: '✗ WEAKNESSES',
            fillColor: '#ef4444',
            color: '#ffffff',
            bold: true,
            fontSize: 10,
            margin: [8, 8, 8, 8],
            border: [false, false, false, false]
          }]]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 5]
      });
      
      content.push({
        ul: player.weaknesses.map(w => ({ text: w, fontSize: 9 })),
        margin: [10, 5, 0, 15]
      });
    }

    // === RISKS ===
    if (player.risks && player.risks.length > 0) {
      content.push({
        table: {
          widths: ['*'],
          body: [[{
            text: '⚠ RISKS',
            fillColor: '#f59e0b',
            color: '#ffffff',
            bold: true,
            fontSize: 10,
            margin: [8, 8, 8, 8],
            border: [false, false, false, false]
          }]]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 5]
      });
      
      content.push({
        ul: player.risks.map(r => ({ text: r, fontSize: 9 })),
        margin: [10, 5, 0, 15]
      });
    }

    // === SCOUT NOTES ===
    if (player.scout_notes) {
      content.push(
        { text: 'Scout Notes', fontSize: 13, bold: true, margin: [0, 5, 0, 10] },
        { text: player.scout_notes, fontSize: 9, color: '#374151', lineHeight: 1.5, margin: [0, 0, 0, 20] }
      );
    }

    // === FOOTER ===
    content.push({ text: `Report Generated: ${new Date().toLocaleString()}`, fontSize: 8, color: '#9ca3af', alignment: 'center', margin: [0, 20, 0, 0] });

    // === CREATE PDF ===
    const docDefinition = {
      content,
      pageMargins: [40, 40, 40, 40]
    };

    console.log('=== Calling downloadPDF ===');
    await downloadPDF(docDefinition, `PlayerProfile_${player.name.replace(/\s+/g, '_')}`);
    console.log('=== PDF Generation Complete ===');
  } catch (error) {
    console.error('=== PDF Generation Failed ===', error);
    throw error;
  }
};

// Download/share PDF
const downloadPDF = async (docDefinition: any, fileName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Creating PDF document...');
      const timestamp = Date.now();
      const fullFileName = `${fileName}_${timestamp}.pdf`;
      
      const pdfDoc = pdfMake.createPdf(docDefinition);

      if (Capacitor.isNativePlatform()) {
        // Mobile: save and share
        console.log('Mobile platform detected');
        pdfDoc.getBase64((base64) => {
          Filesystem.writeFile({
            path: fullFileName,
            data: base64,
            directory: Directory.Data
          })
          .then(result => {
            console.log('PDF saved:', result.uri);
            return Share.share({
              title: 'Player Report',
              url: result.uri,
              dialogTitle: 'Share Report'
            });
          })
          .then(() => {
            console.log('PDF shared successfully');
            resolve();
          })
          .catch(reject);
        });
      } else {
        // Web: download
        console.log('Web platform detected');
        pdfDoc.getBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fullFileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setTimeout(() => {
            URL.revokeObjectURL(url);
            console.log('PDF downloaded:', fullFileName);
            resolve();
          }, 100);
        });
      }
    } catch (error) {
      console.error('downloadPDF error:', error);
      reject(error);
    }
  });
};
