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
  // A4 dimensions: 595 x 842 points
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
/F2 5 0 R
/F3 6 0 R
>>
>>
/MediaBox [0 0 595 842]
/Contents 7 0 R
>>
endobj
4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
6 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Oblique
>>
endobj
7 0 obj
<<
/Length ${content.length}
>>
stream
${content}
endstream
endobj
xref
0 8
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000357 00000 n 
0000000435 00000 n 
0000000520 00000 n 
trailer
<<
/Size 8
/Root 1 0 R
>>
startxref
${591 + content.length}
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
  
  let yPos = 792; // Start from top (A4 = 842pt high, 50pt margin)
  let content = '';

  // ==================== HEADER SECTION ====================
  // Background accent bar at top
  content += `0.2 0.4 0.7 rg\n40 ${yPos - 90} 515 90 re\nf\n`;
  
  yPos -= 20;
  
  // Player Name - Large, Bold, White
  content += `BT\n/F1 26 Tf\n1 1 1 rg\n60 ${yPos} Td\n(${escapeText(player.name || 'PLAYER PROFILE')}) Tj\nET\n`;
  yPos -= 30;
  
  // Position & Team - White text
  const positionTeam = [player.position, player.team].filter(Boolean).join(' - ');
  if (positionTeam) {
    content += `BT\n/F2 13 Tf\n1 1 1 rg\n60 ${yPos} Td\n(${escapeText(positionTeam)}) Tj\nET\n`;
    yPos -= 22;
  }
  
  // Basic Info Row - White text, compact
  const infoItems = [
    player.nationality ? player.nationality : null,
    player.date_of_birth ? `Age ${calculateAge(player.date_of_birth)}` : null,
    player.foot ? `${player.foot} foot` : null,
    player.height ? `${player.height}cm` : null,
    player.weight ? `${player.weight}kg` : null,
  ].filter(Boolean);
  
  if (infoItems.length > 0) {
    content += `BT\n/F2 9 Tf\n0.9 0.9 0.9 rg\n60 ${yPos} Td\n(${escapeText(infoItems.join(' | '))}) Tj\nET\n`;
  }
  
  // Recommendation Badge - Top right corner
  if (player.recommendation) {
    const recText = player.recommendation.toUpperCase();
    let badgeColor = '0.2 0.6 0.9'; // Blue default
    
    if (recText.includes('STRONG') || recText.includes('SIGN')) {
      badgeColor = '0.15 0.68 0.38'; // Green
    } else if (recText.includes('NOT') || recText.includes('AVOID')) {
      badgeColor = '0.9 0.2 0.2'; // Red
    } else if (recText.includes('MONITOR')) {
      badgeColor = '0.95 0.65 0.15'; // Orange
    }
    
    // Badge background
    content += `${badgeColor} rg\n420 ${yPos + 750} 135 22 re\nf\n`;
    // Badge text
    content += `BT\n/F1 10 Tf\n1 1 1 rg\n430 ${yPos + 755} Td\n(${escapeText(recText)}) Tj\nET\n`;
  }
  
  yPos -= 35;
  
  // ==================== STAT MICROCARDS (Wyscout-style) ====================
  const hasStats = player.appearances || player.goals || player.assists;
  if (hasStats) {
    const stats = [
      { label: 'APPS', value: player.appearances || 0, icon: '' },
      { label: 'GOALS', value: player.goals || 0, icon: '' },
      { label: 'ASSISTS', value: player.assists || 0, icon: '' },
    ];
    
    let xPos = 40;
    const cardWidth = 100;
    const cardHeight = 55;
    
    for (const stat of stats) {
      // Card background - light grey
      content += `0.97 0.97 0.98 rg\n${xPos} ${yPos - cardHeight} ${cardWidth} ${cardHeight} re\nf\n`;
      // Card border
      content += `0.85 0.85 0.87 RG\n0.5 w\n${xPos} ${yPos - cardHeight} ${cardWidth} ${cardHeight} re\nS\n`;
      
      // Value - large and bold
      content += `BT\n/F1 22 Tf\n0.2 0.2 0.2 rg\n${xPos + 10} ${yPos - 30} Td\n(${stat.value}) Tj\nET\n`;
      // Label - small
      content += `BT\n/F2 8 Tf\n0.5 0.5 0.5 rg\n${xPos + 10} ${yPos - 48} Td\n(${stat.label}) Tj\nET\n`;
      
      xPos += cardWidth + 8;
    }
    yPos -= cardHeight + 20;
  }
  
  // Separator line
  content += `0.85 0.85 0.87 RG\n0.5 w\n40 ${yPos} m\n555 ${yPos} l\nS\n`;
  yPos -= 25;
  
  // ==================== SUMMARY ASSESSMENT SECTION ====================
  content += `BT\n/F1 14 Tf\n0.2 0.2 0.2 rg\n40 ${yPos} Td\n(SUMMARY ASSESSMENT) Tj\nET\n`;
  yPos -= 22;
  
  // Calculate heights for side-by-side layout
  const strengthsCount = player.strengths ? Math.min(player.strengths.length, 6) : 0;
  const weaknessesCount = player.weaknesses ? Math.min(player.weaknesses.length, 6) : 0;
  const strengthsHeight = strengthsCount * 14 + 22;
  const weaknessesHeight = weaknessesCount * 14 + 22;
  const maxBoxHeight = Math.max(strengthsHeight, weaknessesHeight, 40);
  
  const boxStartY = yPos;
  
  // Strengths Box (Left side) - more compact
  if (player.strengths && player.strengths.length > 0) {
    content += `0.96 0.99 0.96 rg\n40 ${boxStartY - strengthsHeight} 250 ${strengthsHeight} re\nf\n`;
    content += `0.15 0.6 0.3 RG\n0.5 w\n40 ${boxStartY - strengthsHeight} 250 ${strengthsHeight} re\nS\n`;
    content += `BT\n/F1 10 Tf\n0.15 0.6 0.3 rg\n48 ${boxStartY - 10} Td\n(+ STRENGTHS) Tj\nET\n`;
    
    let strengthY = boxStartY - 24;
    for (const strength of player.strengths.slice(0, 6)) {
      content += `BT\n/F2 8 Tf\n0.2 0.2 0.2 rg\n48 ${strengthY} Td\n(${escapeText('• ' + strength)}) Tj\nET\n`;
      strengthY -= 14;
    }
  }
  
  // Weaknesses Box (Right side - aligned with strengths top)
  if (player.weaknesses && player.weaknesses.length > 0) {
    content += `0.99 0.96 0.96 rg\n305 ${boxStartY - weaknessesHeight} 250 ${weaknessesHeight} re\nf\n`;
    content += `0.8 0.2 0.2 RG\n0.5 w\n305 ${boxStartY - weaknessesHeight} 250 ${weaknessesHeight} re\nS\n`;
    content += `BT\n/F1 10 Tf\n0.8 0.2 0.2 rg\n313 ${boxStartY - 10} Td\n(- WEAKNESSES) Tj\nET\n`;
    
    let weaknessY = boxStartY - 24;
    for (const weakness of player.weaknesses.slice(0, 6)) {
      content += `BT\n/F2 8 Tf\n0.2 0.2 0.2 rg\n313 ${weaknessY} Td\n(${escapeText('• ' + weakness)}) Tj\nET\n`;
      weaknessY -= 14;
    }
  }
  
  // Move Y position down past both boxes
  yPos -= maxBoxHeight + 12;
  
  // Risks Box - more compact
  if (player.risks && player.risks.length > 0) {
    const risksHeight = (player.risks.slice(0, 4).length * 14) + 22;
    content += `0.99 0.97 0.95 rg\n40 ${yPos - risksHeight} 515 ${risksHeight} re\nf\n`;
    content += `0.8 0.5 0.1 RG\n0.5 w\n40 ${yPos - risksHeight} 515 ${risksHeight} re\nS\n`;
    content += `BT\n/F1 10 Tf\n0.8 0.5 0.1 rg\n48 ${yPos - 10} Td\n(! RISKS / RED FLAGS) Tj\nET\n`;
    
    let riskY = yPos - 24;
    for (const risk of player.risks.slice(0, 4)) {
      content += `BT\n/F2 8 Tf\n0.2 0.2 0.2 rg\n48 ${riskY} Td\n(${escapeText('• ' + risk)}) Tj\nET\n`;
      riskY -= 14;
    }
    yPos -= risksHeight + 12;
  }
  
  // Transfer Potential Box - more compact
  if (player.transfer_potential_comment) {
    const potentialLines = wrapText(player.transfer_potential_comment, 90);
    const linesCount = Math.min(potentialLines.length, 3);
    const potentialHeight = linesCount * 12 + 18;
    
    content += `0.96 0.97 0.99 rg\n40 ${yPos - potentialHeight} 515 ${potentialHeight} re\nf\n`;
    content += `0.2 0.4 0.7 RG\n0.5 w\n40 ${yPos - potentialHeight} 515 ${potentialHeight} re\nS\n`;
    content += `BT\n/F1 9 Tf\n0.2 0.4 0.7 rg\n48 ${yPos - 9} Td\n(TRANSFER POTENTIAL) Tj\nET\n`;
    
    let potentialY = yPos - 21;
    for (const line of potentialLines.slice(0, 3)) {
      content += `BT\n/F2 8 Tf\n0.2 0.2 0.2 rg\n48 ${potentialY} Td\n(${escapeText(line)}) Tj\nET\n`;
      potentialY -= 12;
    }
    yPos -= potentialHeight + 15;
  }
  
  // Separator
  content += `0.85 0.85 0.87 RG\n0.5 w\n40 ${yPos} m\n555 ${yPos} l\nS\n`;
  yPos -= 20;
  
  // ==================== ATTRIBUTES OVERVIEW WITH COMPACT RADAR ====================
  if (averageRatings && averageRatings.length > 0) {
    content += `BT\n/F1 14 Tf\n0.2 0.2 0.2 rg\n40 ${yPos} Td\n(ATTRIBUTES OVERVIEW) Tj\nET\n`;
    yPos -= 22;
    
    // Draw compact radar chart on the left side
    const radarCenterX = 140;
    const radarCenterY = yPos - 100;
    const radarRadius = 85;
    
    // Radar background circle
    content += `0.97 0.97 0.98 rg\n`;
    content += `${radarCenterX} ${radarCenterY} m\n`;
    for (let i = 0; i <= 360; i += 5) {
      const rad = (i * Math.PI) / 180;
      const x = radarCenterX + radarRadius * Math.cos(rad);
      const y = radarCenterY + radarRadius * Math.sin(rad);
      content += `${x} ${y} l\n`;
    }
    content += `f\n`;
    
    // Radar grid circles
    content += `0.9 0.9 0.91 RG\n0.5 w\n`;
    for (let r = 20; r <= radarRadius; r += 20) {
      content += `${radarCenterX} ${radarCenterY} m\n`;
      for (let i = 0; i <= 360; i += 5) {
        const rad = (i * Math.PI) / 180;
        const x = radarCenterX + r * Math.cos(rad);
        const y = radarCenterY + r * Math.sin(rad);
        content += `${x} ${y} l\n`;
      }
      content += `S\n`;
    }
    
    // Get top 6 skills for radar
    const topSkills = averageRatings.slice(0, 6);
    const angleStep = (2 * Math.PI) / topSkills.length;
    
    // Draw radar shape
    content += `0.2 0.4 0.7 rg\n0.3 w\n`;
    for (let i = 0; i < topSkills.length; i++) {
      const angle = (i * angleStep) - (Math.PI / 2);
      const value = (topSkills[i].averageScore / 10) * radarRadius;
      const x = radarCenterX + value * Math.cos(angle);
      const y = radarCenterY + value * Math.sin(angle);
      if (i === 0) {
        content += `${x} ${y} m\n`;
      } else {
        content += `${x} ${y} l\n`;
      }
    }
    content += `h\nf\n`;
    
    // Categorize skills
    const categorizeSkill = (param: string) => {
      const p = param.toLowerCase();
      if (p.includes('passing') || p.includes('vision') || p.includes('technique') || p.includes('distribution') || p.includes('handling')) return 'TECHNICAL';
      if (p.includes('decision') || p.includes('positioning')) return 'TACTICAL';
      if (p.includes('speed') || p.includes('physicality') || p.includes('reflexes')) return 'PHYSICAL';
      if (p.includes('potential') || p.includes('mental')) return 'MENTAL';
      return 'TECHNICAL';
    };
    
    const grouped: { [key: string]: typeof averageRatings } = {};
    for (const rating of averageRatings) {
      const category = categorizeSkill(rating.parameter);
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(rating);
    }
    
    // Render attributes table on the right side (compact)
    const categories = ['TECHNICAL', 'TACTICAL', 'PHYSICAL', 'MENTAL'];
    let attrYPos = yPos - 10;
    const attrXStart = 280;
    
    for (const category of categories) {
      if (!grouped[category] || grouped[category].length === 0) continue;
      
      content += `BT\n/F1 9 Tf\n0.3 0.3 0.4 rg\n${attrXStart} ${attrYPos} Td\n(${category}) Tj\nET\n`;
      attrYPos -= 15;
      
      for (const rating of grouped[category].slice(0, 3)) {
        const skillName = rating.parameter.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        const score = rating.averageScore.toFixed(1);
        const barWidth = (rating.averageScore / 10) * 100;
        
        // Skill name
        content += `BT\n/F2 8 Tf\n0.2 0.2 0.2 rg\n${attrXStart} ${attrYPos} Td\n(${escapeText(skillName.substring(0, 20))}) Tj\nET\n`;
        
        // Score
        content += `BT\n/F1 8 Tf\n0 0 0 rg\n520 ${attrYPos} Td\n(${score}) Tj\nET\n`;
        
        // Progress bar background
        content += `0.92 0.92 0.93 rg\n${attrXStart + 150} ${attrYPos - 1} 100 8 re\nf\n`;
        
        // Progress bar fill
        const barColor = rating.averageScore >= 7 ? '0.15 0.68 0.38' : rating.averageScore >= 5 ? '0.95 0.65 0.15' : '0.8 0.3 0.3';
        content += `${barColor} rg\n${attrXStart + 150} ${attrYPos - 1} ${barWidth} 8 re\nf\n`;
        
        attrYPos -= 13;
      }
      attrYPos -= 6;
    }
    
    yPos -= 210;
  }
  
  // ==================== SCOUT NOTES (moved up, stats are now in microcards) ====================
  
  if (player.scout_notes) {
    yPos -= 8;
    content += `0.85 0.85 0.87 RG\n0.5 w\n40 ${yPos} m\n555 ${yPos} l\nS\n`;
    yPos -= 18;
    
    content += `BT\n/F1 11 Tf\n0.2 0.2 0.2 rg\n40 ${yPos} Td\n(SCOUT NOTES) Tj\nET\n`;
    yPos -= 16;
    
    const notesLines = wrapText(player.scout_notes, 95);
    for (const line of notesLines.slice(0, 5)) {
      content += `BT\n/F2 8 Tf\n0.3 0.3 0.3 rg\n40 ${yPos} Td\n(${escapeText(line)}) Tj\nET\n`;
      yPos -= 12;
    }
  }
  
  // ==================== FOOTER ====================
  const footerY = 25;
  content += `0.85 0.85 0.87 rg\n40 ${footerY + 10} 515 0.5 re\nf\n`;
  content += `BT\n/F2 7 Tf\n0.5 0.5 0.5 rg\n40 ${footerY} Td\n(Generated by Scoutflow) Tj\nET\n`;
  
  const dateGenerated = new Date().toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  content += `BT\n/F2 7 Tf\n0.5 0.5 0.5 rg\n500 ${footerY} Td\n(${dateGenerated}) Tj\nET\n`;

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
