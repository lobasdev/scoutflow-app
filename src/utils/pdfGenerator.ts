import pdfMake from 'pdfmake/build/pdfmake';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

// Import and configure fonts
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;

interface Player {
  name: string;
  position: string | null;
  team: string | null;
  nationality?: string | null;
  date_of_birth?: string | null;
  estimated_value?: string | null;
  photo_url?: string | null;
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

interface Observation {
  date: string;
  location: string | null;
  notes: string | null;
  video_link: string | null;
}

interface Rating {
  parameter: string;
  score: number;
  comment: string | null;
}

const createDocDefinition = (
  player: Player,
  observation: Observation,
  ratings: Rating[]
): any => {
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
    : "N/A";

  const playerInfoBody: any[] = [
    [{ text: 'Player Name', style: 'label' }, { text: player.name, style: 'value' }]
  ];
  
  if (player.date_of_birth) {
    const age = calculateAge(player.date_of_birth);
    playerInfoBody.push([{ text: 'Date of Birth', style: 'label' }, { text: `${new Date(player.date_of_birth).toLocaleDateString()} (Age: ${age})`, style: 'value' }]);
  }
  if (player.position) playerInfoBody.push([{ text: 'Position', style: 'label' }, { text: player.position, style: 'value' }]);
  if (player.team) playerInfoBody.push([{ text: 'Team', style: 'label' }, { text: player.team, style: 'value' }]);
  if (player.nationality) playerInfoBody.push([{ text: 'Nationality', style: 'label' }, { text: player.nationality, style: 'value' }]);
  if (player.estimated_value) playerInfoBody.push([{ text: 'Estimated Value', style: 'label' }, { text: player.estimated_value, style: 'value' }]);

  const observationInfoBody: any[] = [
    [{ text: 'Date', style: 'label' }, { text: new Date(observation.date).toLocaleDateString(), style: 'value' }]
  ];
  
  if (observation.location) observationInfoBody.push([{ text: 'Location', style: 'label' }, { text: observation.location, style: 'value' }]);

  const ratingsBody: any[] = [
    [
      { text: 'Parameter', style: 'tableHeader' },
      { text: 'Score', style: 'tableHeader', alignment: 'center' },
      { text: 'Rating', style: 'tableHeader', alignment: 'center' }
    ]
  ];

  ratings.forEach(rating => {
    ratingsBody.push([
      { text: rating.parameter.replace(/_/g, ' ').toUpperCase(), style: 'tableCell' },
      {
        canvas: [
          { type: 'rect', x: 0, y: 5, w: 80, h: 8, r: 4, color: '#e5e7eb' },
          { type: 'rect', x: 0, y: 5, w: (rating.score / 10) * 80, h: 8, r: 4, color: '#2563eb' }
        ]
      },
      { text: rating.score.toString(), style: 'score', alignment: 'center' }
    ]);
    
    if (rating.comment) {
      ratingsBody.push([
        { text: `Comment: ${rating.comment}`, colSpan: 3, style: 'comment' },
        {},
        {}
      ]);
    }
  });

  const content: any[] = [
    { text: 'SCOUTING REPORT', style: 'header', alignment: 'center' },
    { text: 'ScoutFlow Professional Analysis', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] },
    
    { text: 'Player Information', style: 'sectionHeader' },
    {
      table: { widths: ['*', '*'], body: playerInfoBody },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 20]
    },

    { text: 'Observation Details', style: 'sectionHeader' },
    {
      table: { widths: ['*', '*'], body: observationInfoBody },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 20]
    }
  ];

  if (observation.notes) {
    content.push(
      { text: 'Notes', style: 'label', margin: [0, 0, 0, 5] },
      { text: observation.notes, style: 'notes', margin: [0, 0, 0, 20] }
    );
  }

  content.push(
    { text: 'Performance Analysis', style: 'sectionHeader' },
    {
      table: {
        widths: ['*'],
        body: [[{
          text: `Overall Average Rating: ${avgRating}`,
          style: 'avgRating',
          alignment: 'center',
          fillColor: '#2563eb',
          color: '#ffffff',
          margin: [0, 10, 0, 10]
        }]]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 20]
    },
    {
      table: {
        widths: ['*', 80, 60],
        body: ratingsBody
      },
      layout: {
        hLineWidth: (i: number, node: any) => i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5,
        vLineWidth: () => 0,
        hLineColor: () => '#e5e7eb',
      }
    },
    { text: `Generated by ScoutFlow - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, style: 'footer', margin: [0, 30, 0, 0] }
  );

  return {
    content,
    styles: {
      header: { fontSize: 24, bold: true, color: '#2563eb' },
      subheader: { fontSize: 14, color: '#059669' },
      sectionHeader: { fontSize: 16, bold: true, color: '#2563eb', margin: [0, 10, 0, 10] },
      label: { fontSize: 10, color: '#6b7280', bold: true },
      value: { fontSize: 12, color: '#111827' },
      notes: { fontSize: 11, color: '#374151', lineHeight: 1.5 },
      avgRating: { fontSize: 20, bold: true },
      tableHeader: { fontSize: 11, bold: true, fillColor: '#f3f4f6', margin: [0, 5, 0, 5] },
      tableCell: { fontSize: 10, margin: [0, 8, 0, 8] },
      score: { fontSize: 16, bold: true, color: '#2563eb' },
      comment: { fontSize: 9, color: '#6b7280', italics: true, margin: [0, 2, 0, 5] },
      footer: { fontSize: 9, color: '#9ca3af', alignment: 'center' }
    }
  };
};

export const generatePDF = async (
  player: Player,
  observation: Observation,
  ratings: Rating[]
) => {
  const docDefinition = createDocDefinition(player, observation, ratings);

  if (Capacitor.isNativePlatform()) {
    return new Promise((resolve, reject) => {
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      
      pdfDocGenerator.getBase64(async (base64: string) => {
        try {
          const fileName = `ScoutingReport_${player.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
          
          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Documents,
          });

          console.log('PDF saved to:', result.uri);
          
          // Share the file on mobile
          await Share.share({
            title: 'Scouting Report',
            text: `Scouting report for ${player.name}`,
            url: result.uri,
            dialogTitle: 'Share Scouting Report',
          });
          
          resolve(result.uri);
        } catch (error) {
          console.error('Error saving PDF:', error);
          reject(error);
        }
      });
    });
  } else {
    // For web, download the PDF
    pdfMake.createPdf(docDefinition).download(`ScoutingReport_${player.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
  }
};

export const generatePlayerProfilePDF = async (
  player: Player,
  averageRatings: { parameter: string; averageScore: number }[]
) => {
  const playerInfoBody: any[] = [
    [{ text: 'Player Name', style: 'label' }, { text: player.name, style: 'value' }]
  ];
  
  if (player.date_of_birth) {
    const age = calculateAge(player.date_of_birth);
    playerInfoBody.push([{ text: 'Date of Birth', style: 'label' }, { text: `${new Date(player.date_of_birth).toLocaleDateString()} (Age: ${age})`, style: 'value' }]);
  }
  if (player.position) playerInfoBody.push([{ text: 'Position', style: 'label' }, { text: player.position, style: 'value' }]);
  if (player.team) playerInfoBody.push([{ text: 'Team', style: 'label' }, { text: player.team, style: 'value' }]);
  if (player.nationality) playerInfoBody.push([{ text: 'Nationality', style: 'label' }, { text: player.nationality, style: 'value' }]);
  if (player.estimated_value) playerInfoBody.push([{ text: 'Estimated Value', style: 'label' }, { text: player.estimated_value, style: 'value' }]);

  const ratingsBody: any[] = [
    [
      { text: 'Parameter', style: 'tableHeader' },
      { text: 'Average', style: 'tableHeader', alignment: 'center' },
      { text: 'Score', style: 'tableHeader', alignment: 'center' }
    ]
  ];

  averageRatings.forEach(rating => {
    ratingsBody.push([
      { text: rating.parameter.replace(/_/g, ' ').toUpperCase(), style: 'tableCell' },
      {
        canvas: [
          { type: 'rect', x: 0, y: 5, w: 80, h: 8, r: 4, color: '#e5e7eb' },
          { type: 'rect', x: 0, y: 5, w: (rating.averageScore / 10) * 80, h: 8, r: 4, color: '#2563eb' }
        ]
      },
      { text: rating.averageScore.toFixed(1), style: 'score', alignment: 'center' }
    ]);
  });

  const docDefinition: any = {
    content: [
      { text: 'PLAYER PROFILE REPORT', style: 'header', alignment: 'center' },
      { text: 'ScoutFlow Professional Analysis', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 30] },
      
      { text: 'Player Information', style: 'sectionHeader' },
      {
        table: { widths: ['*', '*'], body: playerInfoBody },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 30]
      },

      { text: 'Average Skills Overview', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 80, 60],
          body: ratingsBody
        },
        layout: {
          hLineWidth: (i: number, node: any) => i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#e5e7eb',
        }
      },

      { text: `Generated by ScoutFlow - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, style: 'footer', margin: [0, 30, 0, 0] }
    ],
    styles: {
      header: { fontSize: 24, bold: true, color: '#2563eb' },
      subheader: { fontSize: 14, color: '#059669' },
      sectionHeader: { fontSize: 16, bold: true, color: '#2563eb', margin: [0, 10, 0, 10] },
      label: { fontSize: 10, color: '#6b7280', bold: true },
      value: { fontSize: 12, color: '#111827' },
      tableHeader: { fontSize: 11, bold: true, fillColor: '#f3f4f6', margin: [0, 5, 0, 5] },
      tableCell: { fontSize: 10, margin: [0, 8, 0, 8] },
      score: { fontSize: 16, bold: true, color: '#2563eb' },
      footer: { fontSize: 9, color: '#9ca3af', alignment: 'center' }
    }
  };

  if (Capacitor.isNativePlatform()) {
    return new Promise((resolve, reject) => {
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      
      pdfDocGenerator.getBase64(async (base64: string) => {
        try {
          const fileName = `PlayerProfile_${player.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
          
          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Documents,
          });

          console.log('PDF saved to:', result.uri);
          
          // Share the file on mobile
          await Share.share({
            title: 'Player Profile Report',
            text: `Player profile for ${player.name}`,
            url: result.uri,
            dialogTitle: 'Share Player Profile',
          });
          
          resolve(result.uri);
        } catch (error) {
          console.error('Error saving PDF:', error);
          reject(error);
        }
      });
    });
  } else {
    // For web, download the PDF
    pdfMake.createPdf(docDefinition).download(`PlayerProfile_${player.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
  }
};
