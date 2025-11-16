import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    
    console.log('Generating PDF:', { type });

    let pdfContent: string;

    if (type === 'observation') {
      pdfContent = generateObservationPDF(data);
    } else if (type === 'player-profile') {
      pdfContent = generatePlayerProfilePDF(data);
    } else {
      throw new Error(`Unknown PDF type: ${type}`);
    }

    // Generate PDF bytes
    const pdfString = generatePDFBytes(pdfContent);

    return new Response(pdfString, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${data.fileName || 'report'}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function generatePDFBytes(content: string): string {
  // Create a basic PDF structure
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 595 842]
/Contents 5 0 R
>>
endobj
4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
5 0 obj
<<
/Length ${content.length}
>>
stream
${content}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000262 00000 n 
0000000340 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
${410 + content.length}
%%EOF`;

  return pdfContent;
}

function generateObservationPDF(data: any): string {
  const { player, observation, ratings } = data;
  
  let yPos = 750;
  let content = 'BT\n/F1 24 Tf\n50 ' + yPos + ' Td\n(SCOUTING REPORT) Tj\nET\n';
  yPos -= 50;

  // Player Information
  content += 'BT\n/F1 16 Tf\n50 ' + yPos + ' Td\n(Player Information) Tj\nET\n';
  yPos -= 25;

  const playerInfo = [
    ['Player:', player.name || 'N/A'],
    ['Position:', player.position || 'N/A'],
    ['Team:', player.team || 'N/A'],
    ['Age:', player.date_of_birth ? calculateAge(player.date_of_birth) + ' years' : 'N/A'],
  ];

  for (const [label, value] of playerInfo) {
    content += `BT\n/F1 10 Tf\n50 ${yPos} Td\n(${escapeText(label)}) Tj\nET\n`;
    content += `BT\n/F1 10 Tf\n150 ${yPos} Td\n(${escapeText(value)}) Tj\nET\n`;
    yPos -= 20;
  }

  yPos -= 20;

  // Observation Details
  content += 'BT\n/F1 16 Tf\n50 ' + yPos + ' Td\n(Observation Details) Tj\nET\n';
  yPos -= 25;

  const obsDate = new Date(observation.date).toLocaleDateString();
  content += `BT\n/F1 10 Tf\n50 ${yPos} Td\n(Date:) Tj\nET\n`;
  content += `BT\n/F1 10 Tf\n150 ${yPos} Td\n(${obsDate}) Tj\nET\n`;
  yPos -= 20;

  if (observation.location) {
    content += `BT\n/F1 10 Tf\n50 ${yPos} Td\n(Location:) Tj\nET\n`;
    content += `BT\n/F1 10 Tf\n150 ${yPos} Td\n(${escapeText(observation.location)}) Tj\nET\n`;
    yPos -= 20;
  }

  yPos -= 20;

  // Performance Ratings
  content += 'BT\n/F1 16 Tf\n50 ' + yPos + ' Td\n(Performance Ratings) Tj\nET\n';
  yPos -= 25;

  content += 'BT\n/F1 10 Tf\n50 ' + yPos + ' Td\n(SKILL) Tj\nET\n';
  content += 'BT\n/F1 10 Tf\n400 ' + yPos + ' Td\n(RATING) Tj\nET\n';
  yPos -= 20;

  for (const rating of ratings) {
    if (yPos < 100) break;
    
    const skillName = rating.parameter.toUpperCase().replace(/_/g, ' ');
    content += `BT\n/F1 10 Tf\n50 ${yPos} Td\n(${escapeText(skillName)}) Tj\nET\n`;
    content += `BT\n/F1 10 Tf\n400 ${yPos} Td\n(${rating.score}/10) Tj\nET\n`;
    yPos -= 15;

    if (rating.comment) {
      const comment = rating.comment.length > 60 ? rating.comment.substring(0, 60) + '...' : rating.comment;
      content += `BT\n/F1 9 Tf\n50 ${yPos} Td\n(${escapeText(comment)}) Tj\nET\n`;
      yPos -= 20;
    }
  }

  // Average rating
  if (ratings.length > 0) {
    const avgRating = (ratings.reduce((sum: number, r: any) => sum + r.score, 0) / ratings.length).toFixed(1);
    yPos -= 10;
    content += `BT\n/F1 14 Tf\n250 ${yPos} Td\n(Average Rating: ${avgRating}/10) Tj\nET\n`;
  }

  // Scout Notes
  if (observation.notes && yPos > 150) {
    yPos -= 40;
    content += 'BT\n/F1 16 Tf\n50 ' + yPos + ' Td\n(Scout Notes) Tj\nET\n';
    yPos -= 25;

    const noteLines = wrapText(observation.notes, 70);
    for (const line of noteLines.slice(0, 8)) {
      if (yPos < 60) break;
      content += `BT\n/F1 10 Tf\n50 ${yPos} Td\n(${escapeText(line)}) Tj\nET\n`;
      yPos -= 15;
    }
  }

  return content;
}

function generatePlayerProfilePDF(data: any): string {
  const { player, averageRatings } = data;
  
  let yPos = 750;
  let content = `BT\n/F1 24 Tf\n50 ${yPos} Td\n(${escapeText(player.name || 'PLAYER PROFILE')}) Tj\nET\n`;
  yPos -= 30;

  content += 'BT\n/F1 12 Tf\n50 ' + yPos + ' Td\n(Player Profile) Tj\nET\n';
  yPos -= 40;

  // Basic info
  const infoLine = [
    player.position,
    player.team,
    player.nationality,
    player.date_of_birth ? `Age: ${calculateAge(player.date_of_birth)}` : null
  ].filter(Boolean).join(' - ');

  if (infoLine) {
    content += `BT\n/F1 10 Tf\n50 ${yPos} Td\n(${escapeText(infoLine)}) Tj\nET\n`;
    yPos -= 40;
  }

  // Recommendation
  if (player.recommendation) {
    content += `BT\n/F1 14 Tf\n150 ${yPos} Td\n(RECOMMENDATION: ${escapeText(player.recommendation.toUpperCase())}) Tj\nET\n`;
    yPos -= 50;
  }

  // Physical Attributes
  if (player.height || player.weight || player.foot) {
    content += 'BT\n/F1 14 Tf\n50 ' + yPos + ' Td\n(Physical Attributes) Tj\nET\n';
    yPos -= 25;

    const physicalInfo = [
      player.height ? ['Height:', `${player.height} cm`] : null,
      player.weight ? ['Weight:', `${player.weight} kg`] : null,
      player.foot ? ['Preferred Foot:', player.foot] : null,
    ].filter(Boolean) as [string, string][];

    for (const [label, value] of physicalInfo) {
      content += `BT\n/F1 10 Tf\n50 ${yPos} Td\n(${escapeText(label)}) Tj\nET\n`;
      content += `BT\n/F1 10 Tf\n200 ${yPos} Td\n(${escapeText(value)}) Tj\nET\n`;
      yPos -= 18;
    }
    yPos -= 15;
  }

  // Performance Stats
  const hasStats = player.appearances || player.goals || player.assists;
  if (hasStats) {
    content += 'BT\n/F1 14 Tf\n50 ' + yPos + ' Td\n(Performance Stats) Tj\nET\n';
    yPos -= 30;

    const stats = [
      player.appearances ? `Appearances: ${player.appearances}` : null,
      player.goals ? `Goals: ${player.goals}` : null,
      player.assists ? `Assists: ${player.assists}` : null,
    ].filter(Boolean).join('  |  ');

    content += `BT\n/F1 10 Tf\n50 ${yPos} Td\n(${escapeText(stats)}) Tj\nET\n`;
    yPos -= 40;
  }

  // Skills Profile
  if (averageRatings && averageRatings.length > 0) {
    content += 'BT\n/F1 14 Tf\n50 ' + yPos + ' Td\n(Skills Profile) Tj\nET\n';
    yPos -= 25;

    content += 'BT\n/F1 10 Tf\n50 ' + yPos + ' Td\n(SKILL) Tj\nET\n';
    content += 'BT\n/F1 10 Tf\n400 ' + yPos + ' Td\n(RATING) Tj\nET\n';
    yPos -= 20;

    for (const rating of averageRatings) {
      if (yPos < 150) break;
      
      const skillLabel = rating.parameter.toUpperCase().replace(/_/g, ' ');
      content += `BT\n/F1 10 Tf\n50 ${yPos} Td\n(${escapeText(skillLabel)}) Tj\nET\n`;
      content += `BT\n/F1 10 Tf\n400 ${yPos} Td\n(${rating.averageScore.toFixed(1)}/10) Tj\nET\n`;
      yPos -= 18;
    }
    yPos -= 20;
  }

  // Strengths
  if (player.strengths && player.strengths.length > 0) {
    content += 'BT\n/F1 12 Tf\n50 ' + yPos + ' Td\n(STRENGTHS) Tj\nET\n';
    yPos -= 20;

    for (const strength of player.strengths.slice(0, 5)) {
      if (yPos < 100) break;
      content += `BT\n/F1 9 Tf\n60 ${yPos} Td\n(- ${escapeText(strength)}) Tj\nET\n`;
      yPos -= 15;
    }
    yPos -= 10;
  }

  // Weaknesses
  if (player.weaknesses && player.weaknesses.length > 0 && yPos > 120) {
    content += 'BT\n/F1 12 Tf\n50 ' + yPos + ' Td\n(WEAKNESSES) Tj\nET\n';
    yPos -= 20;

    for (const weakness of player.weaknesses.slice(0, 4)) {
      if (yPos < 80) break;
      content += `BT\n/F1 9 Tf\n60 ${yPos} Td\n(- ${escapeText(weakness)}) Tj\nET\n`;
      yPos -= 15;
    }
    yPos -= 10;
  }

  // Scout Notes
  if (player.scout_notes && yPos > 100) {
    content += 'BT\n/F1 14 Tf\n50 ' + yPos + ' Td\n(Scout Notes) Tj\nET\n';
    yPos -= 20;

    const noteLines = wrapText(player.scout_notes, 70);
    for (const line of noteLines.slice(0, 5)) {
      if (yPos < 60) break;
      content += `BT\n/F1 9 Tf\n50 ${yPos} Td\n(${escapeText(line)}) Tj\nET\n`;
      yPos -= 14;
    }
  }

  // Footer
  content += `BT\n/F1 8 Tf\n50 40 Td\n(Report Generated: ${new Date().toLocaleString()}) Tj\nET\n`;

  return content;
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function escapeText(text: string): string {
  // Escape special PDF characters and handle nulls
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '');
}

function wrapText(text: string, maxLength: number): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines;
}
