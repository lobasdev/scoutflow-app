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
    let annotations = '';

    if (type === 'observation') {
      pdfContent = generateObservationPDF(data);
    } else if (type === 'player-profile') {
      const result = generatePlayerProfilePDF(data);
      pdfContent = result.content;
      annotations = result.annotations;
    } else {
      throw new Error(`Unknown PDF type: ${type}`);
    }

    // Generate PDF bytes
    const pdfString = generatePDFBytes(pdfContent, annotations);

    // Ensure ASCII-only filename for HTTP headers to avoid ByteString errors
    const rawFileName = (data.fileName || 'report').toString();
    const safeFileName = rawFileName.replace(/[^\x20-\x7E]/g, '_');

    return new Response(pdfString, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName}.pdf"`,
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

function generatePDFBytes(content: string, annotations: string = ''): string {
  // A4 dimensions: 595 x 842 points
  const hasAnnotations = annotations.length > 0;
  const numAnnotations = hasAnnotations ? (annotations.match(/\d+ 0 obj/g) || []).length : 0;
  const annotationsObj = hasAnnotations ? `\n/Annots [${Array.from({length: numAnnotations}, (_, i) => `${8 + i} 0 R`).join(' ')}]` : '';
  const totalObjects = 7 + numAnnotations + 1;
  
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
>>${annotationsObj}
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
${annotations}
xref
0 ${totalObjects}
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000${hasAnnotations ? '300' : '274'} 00000 n 
0000000${hasAnnotations ? '383' : '357'} 00000 n 
0000000${hasAnnotations ? '461' : '435'} 00000 n 
0000000${hasAnnotations ? '546' : '520'} 00000 n 
${hasAnnotations ? Array.from({length: numAnnotations}, () => '0000000000 00000 n \n').join('') : ''}trailer
<<
/Size ${totalObjects}
/Root 1 0 R
>>
startxref
${hasAnnotations ? 591 + content.length + annotations.length : 591 + content.length}
%%EOF`;

  return pdfContent;
}

function generateObservationPDF(data: any): string {
  const { player, observation, ratings } = data;
  
  let yPos = 792; // Start from top with proper margin
  let content = '';
  
  // Main title header with background
  content += `0.25 0.45 0.75 rg\n40 ${yPos - 45} 515 45 re\nf\n`;
  content += 'BT\n/F1 26 Tf\n1 1 1 rg\n50 ' + (yPos - 30) + ' Td\n(SCOUTING OBSERVATION REPORT) Tj\nET\n';
  yPos -= 65;

  // ==================== PLAYER INFORMATION SECTION ====================
  // Section header with underline
  content += 'BT\n/F1 14 Tf\n0.2 0.2 0.2 rg\n40 ' + yPos + ' Td\n(PLAYER INFORMATION) Tj\nET\n';
  yPos -= 3;
  content += `0.25 0.45 0.75 rg\n40 ${yPos} 160 2 re\nf\n`;
  yPos -= 22;

  // Player info in card-like layout
  content += `0.97 0.97 0.98 rg\n40 ${yPos - 90} 515 90 re\nf\n`;
  content += `0.85 0.85 0.87 RG\n0.5 w\n40 ${yPos - 90} 515 90 re\nS\n`;

  const playerInfo = [
    ['Player Name:', player.name || 'N/A'],
    ['Position:', player.position || 'N/A'],
    ['Team:', player.team || 'N/A'],
    ['Age:', player.date_of_birth ? calculateAge(player.date_of_birth) + ' years' : 'N/A'],
  ];

  for (const [label, value] of playerInfo) {
    content += `BT\n/F1 10 Tf\n0.5 0.5 0.5 rg\n50 ${yPos} Td\n(${escapeText(label)}) Tj\nET\n`;
    content += `BT\n/F2 11 Tf\n0.2 0.2 0.2 rg\n170 ${yPos} Td\n(${escapeText(value)}) Tj\nET\n`;
    yPos -= 22;
  }

  yPos -= 25;

  // ==================== OBSERVATION DETAILS SECTION ====================
  // Section header with underline
  content += 'BT\n/F1 14 Tf\n0.2 0.2 0.2 rg\n40 ' + yPos + ' Td\n(OBSERVATION DETAILS) Tj\nET\n';
  yPos -= 3;
  content += `0.25 0.45 0.75 rg\n40 ${yPos} 180 2 re\nf\n`;
  yPos -= 22;

  // Observation details in card
  const obsCardHeight = observation.location ? 70 : 48;
  content += `0.96 0.97 0.99 rg\n40 ${yPos - obsCardHeight} 515 ${obsCardHeight} re\nf\n`;
  content += `0.85 0.85 0.87 RG\n0.5 w\n40 ${yPos - obsCardHeight} 515 ${obsCardHeight} re\nS\n`;

  const obsDate = new Date(observation.date).toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  content += `BT\n/F1 10 Tf\n0.5 0.5 0.5 rg\n50 ${yPos} Td\n(Date:) Tj\nET\n`;
  content += `BT\n/F2 11 Tf\n0.2 0.2 0.2 rg\n170 ${yPos} Td\n(${obsDate}) Tj\nET\n`;
  yPos -= 22;

  if (observation.location) {
    content += `BT\n/F1 10 Tf\n0.5 0.5 0.5 rg\n50 ${yPos} Td\n(Match Name:) Tj\nET\n`;
    content += `BT\n/F2 11 Tf\n0.2 0.45 0.75 rg\n170 ${yPos} Td\n(${escapeText(observation.location)}) Tj\nET\n`;
    yPos -= 22;
  }

  yPos -= 30;

  // ==================== PERFORMANCE RATINGS SECTION ====================
  // Section header with underline
  content += 'BT\n/F1 14 Tf\n0.2 0.2 0.2 rg\n40 ' + yPos + ' Td\n(PERFORMANCE RATINGS) Tj\nET\n';
  yPos -= 3;
  content += `0.25 0.45 0.75 rg\n40 ${yPos} 180 2 re\nf\n`;
  yPos -= 22;

  // Table header
  content += `0.9 0.9 0.91 rg\n40 ${yPos - 18} 515 18 re\nf\n`;
  content += 'BT\n/F1 9 Tf\n0.3 0.3 0.3 rg\n50 ' + (yPos - 12) + ' Td\n(SKILL PARAMETER) Tj\nET\n';
  content += 'BT\n/F1 9 Tf\n0.3 0.3 0.3 rg\n360 ' + (yPos - 12) + ' Td\n(SCORE) Tj\nET\n';
  content += 'BT\n/F1 9 Tf\n0.3 0.3 0.3 rg\n450 ' + (yPos - 12) + ' Td\n(VISUAL) Tj\nET\n';
  yPos -= 22;

  for (const rating of ratings) {
    if (yPos < 120) break;
    
    // Alternating row backgrounds
    const rowHeight = rating.comment ? 36 : 20;
    if (ratings.indexOf(rating) % 2 === 0) {
      content += `0.98 0.98 0.99 rg\n40 ${yPos - rowHeight} 515 ${rowHeight} re\nf\n`;
    }
    
    const skillName = rating.parameter.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    content += `BT\n/F2 10 Tf\n0.2 0.2 0.2 rg\n50 ${yPos} Td\n(${escapeText(skillName)}) Tj\nET\n`;
    
    // Score with color coding
    let scoreColor = '0.2 0.2 0.2'; // default
    if (rating.score >= 8) scoreColor = '0.15 0.68 0.38'; // green
    else if (rating.score >= 6) scoreColor = '0.2 0.6 0.9'; // blue
    else if (rating.score >= 4) scoreColor = '0.95 0.65 0.15'; // orange
    else scoreColor = '0.9 0.2 0.2'; // red
    
    content += `BT\n/F1 14 Tf\n${scoreColor} rg\n370 ${yPos} Td\n(${rating.score}/10) Tj\nET\n`;
    
    // Visual bar representation
    const barWidth = (rating.score / 10) * 70;
    content += `${scoreColor} rg\n450 ${yPos + 2} ${barWidth} 10 re\nf\n`;
    content += `0.85 0.85 0.87 RG\n0.3 w\n450 ${yPos + 2} 70 10 re\nS\n`;
    
    yPos -= 14;

    if (rating.comment) {
      const commentLines = wrapText(rating.comment, 75);
      content += `BT\n/F3 8 Tf\n0.4 0.4 0.4 rg\n50 ${yPos} Td\n(${escapeText(commentLines[0])}) Tj\nET\n`;
      yPos -= 12;
    }
    
    yPos -= 10;
  }

  // Average rating highlight box
  if (ratings.length > 0) {
    const avgRating = (ratings.reduce((sum: number, r: any) => sum + r.score, 0) / ratings.length).toFixed(1);
    yPos -= 15;
    
    content += `0.25 0.45 0.75 rg\n180 ${yPos - 35} 235 35 re\nf\n`;
    content += `BT\n/F2 11 Tf\n1 1 1 rg\n200 ${yPos - 12} Td\n(OVERALL AVERAGE RATING) Tj\nET\n`;
    content += `BT\n/F1 18 Tf\n1 1 1 rg\n280 ${yPos - 28} Td\n(${avgRating} / 10) Tj\nET\n`;
    yPos -= 45;
  }

  // ==================== SCOUT NOTES SECTION ====================
  if (observation.notes && yPos > 130) {
    yPos -= 20;
    
    // Section header with underline
    content += 'BT\n/F1 14 Tf\n0.2 0.2 0.2 rg\n40 ' + yPos + ' Td\n(SCOUT NOTES) Tj\nET\n';
    yPos -= 3;
    content += `0.25 0.45 0.75 rg\n40 ${yPos} 120 2 re\nf\n`;
    yPos -= 22;

    // Notes in text box with background
    const noteLines = wrapText(observation.notes, 85);
    const notesHeight = Math.min(noteLines.length * 13 + 20, 120);
    content += `0.99 0.99 0.97 rg\n40 ${yPos - notesHeight} 515 ${notesHeight} re\nf\n`;
    content += `0.85 0.85 0.87 RG\n0.5 w\n40 ${yPos - notesHeight} 515 ${notesHeight} re\nS\n`;
    
    yPos -= 10;
    for (const line of noteLines.slice(0, 8)) {
      if (yPos < 70) break;
      content += `BT\n/F2 9 Tf\n0.2 0.2 0.2 rg\n50 ${yPos} Td\n(${escapeText(line)}) Tj\nET\n`;
      yPos -= 13;
    }
  }

  // Footer
  const footerY = 30;
  content += `0.85 0.85 0.87 rg\n40 ${footerY + 5} 515 0.5 re\nf\n`;
  content += `BT\n/F2 7 Tf\n0.5 0.5 0.5 rg\n40 ${footerY - 5} Td\n(Generated by Scoutflow) Tj\nET\n`;
  const dateGenerated = new Date().toLocaleDateString('en-GB', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  content += `BT\n/F2 7 Tf\n0.5 0.5 0.5 rg\n490 ${footerY - 5} Td\n(${dateGenerated}) Tj\nET\n`;

  return content;
}

function generatePlayerProfilePDF(data: any): { content: string; annotations: string } {
  const { player, averageRatings } = data;
  
  let yPos = 792; // Start from top (A4 = 842pt high, 50pt margin)
  let content = '';
  let annotations = '';

  // ==================== HEADER SECTION ====================
  // Thin blue bar for player name only - with more height for breathing room
  content += `0.25 0.45 0.75 rg\n40 ${yPos - 55} 515 55 re\nf\n`;
  
  yPos -= 16; // Reduced to create more space above name
  
  // Player Name - Large, Bold, White on blue, centered vertically with proper spacing
  content += `BT\n/F1 28 Tf\n1 1 1 rg\n50 ${yPos} Td\n(${escapeText(player.name || 'PLAYER PROFILE')}) Tj\nET\n`;
  
  yPos -= 60; // Increased spacing below blue bar
  
  // Position & Team - Dark text on white background with improved spacing
  const positionTeam = [player.position, player.team].filter(Boolean).join(' - ');
  if (positionTeam) {
    content += `BT\n/F2 12 Tf\n0.2 0.2 0.2 rg\n50 ${yPos} Td\n(${escapeText(positionTeam)}) Tj\nET\n`;
    yPos -= 20;
  }
  
  // Profile Summary - Dark text, italic
  if (player.profile_summary) {
    const summaryLines = wrapText(player.profile_summary, 65);
    content += `BT\n/F3 11 Tf\n0.35 0.35 0.35 rg\n50 ${yPos} Td\n(${escapeText(summaryLines[0])}) Tj\nET\n`;
    yPos -= 20;
  }
  
  // Basic Info Row - Gray text
  const infoItems = [
    player.nationality ? player.nationality : null,
    player.date_of_birth ? `Age ${calculateAge(player.date_of_birth)}` : null,
    player.foot ? `${player.foot} foot` : null,
    player.height ? `${player.height}cm` : null,
    player.weight ? `${player.weight}kg` : null,
  ].filter(Boolean);
  
  if (infoItems.length > 0) {
    content += `BT\n/F2 9 Tf\n0.5 0.5 0.5 rg\n50 ${yPos} Td\n(${escapeText(infoItems.join(' | '))}) Tj\nET\n`;
  }
  
  // Right-side info column - clean grid layout
  let rightY = 732; // Track right column position separately
  const rightX = 380;
  const cardWidth = 175;
  
  // Recommendation Badge - Positioned cleanly below header, not overlapping
  if (player.recommendation) {
    const recText = player.recommendation.toUpperCase();
    let badgeColor = '0.5 0.3 0.7'; // Purple default
    
    if (recText.includes('SIGN') && !recText.includes('NOT')) {
      badgeColor = '0.15 0.68 0.38'; // Green
    } else if (recText.includes('NOT') || recText.includes('AVOID')) {
      badgeColor = '0.9 0.2 0.2'; // Red
    } else if (recText.includes('OBSERVE') || recText.includes('MONITOR')) {
      badgeColor = '0.95 0.65 0.15'; // Yellow/Orange
    } else if (recText.includes('TRIAL') || recText.includes('INVITE')) {
      badgeColor = '0.2 0.6 0.9'; // Blue
    }
    
    content += `${badgeColor} rg\n${rightX} ${rightY - 30} ${cardWidth} 30 re\nf\n`;
    content += `BT\n/F1 13 Tf\n1 1 1 rg\n${rightX + cardWidth/2 - 25} ${rightY - 20} Td\n(${escapeText(recText.substring(0, 14))}) Tj\nET\n`;
    rightY -= 38;
  }
  
  // Info cards container - consistent spacing and alignment
  const cardSpacing = 6;
  const cardHeight = 42;
  
  // Estimated Value Card
  if (player.estimated_value) {
    // Format the value for display
    const formattedValue = formatEstimatedValue(player.estimated_value);
    
    content += `1 1 1 rg\n${rightX} ${rightY - cardHeight} ${cardWidth} ${cardHeight} re\nf\n`;
    content += `0.85 0.85 0.87 RG\n0.5 w\n${rightX} ${rightY - cardHeight} ${cardWidth} ${cardHeight} re\nS\n`;
    content += `BT\n/F2 8 Tf\n0.5 0.5 0.5 rg\n${rightX + 12} ${rightY - 14} Td\n(ESTIMATED VALUE) Tj\nET\n`;
    content += `BT\n/F1 14 Tf\n0.2 0.2 0.2 rg\n${rightX + 12} ${rightY - 32} Td\n(${escapeText(formattedValue)}) Tj\nET\n`;
    rightY -= (cardHeight + cardSpacing);
  }
  
  // Contract Expires Card
  if (player.contract_expires) {
    const contractDate = new Date(player.contract_expires).toLocaleDateString('en-GB', { 
      year: 'numeric', 
      month: 'short' 
    });
    content += `1 1 1 rg\n${rightX} ${rightY - cardHeight} ${cardWidth} ${cardHeight} re\nf\n`;
    content += `0.85 0.85 0.87 RG\n0.5 w\n${rightX} ${rightY - cardHeight} ${cardWidth} ${cardHeight} re\nS\n`;
    content += `BT\n/F2 8 Tf\n0.5 0.5 0.5 rg\n${rightX + 12} ${rightY - 14} Td\n(CONTRACT EXPIRES) Tj\nET\n`;
    content += `BT\n/F1 14 Tf\n0.2 0.2 0.2 rg\n${rightX + 12} ${rightY - 32} Td\n(${escapeText(contractDate)}) Tj\nET\n`;
    rightY -= (cardHeight + cardSpacing);
  }
  
  // Current Salary Card
  if (player.current_salary) {
    const formattedSalary = formatSalary(player.current_salary);
    content += `1 1 1 rg\n${rightX} ${rightY - cardHeight} ${cardWidth} ${cardHeight} re\nf\n`;
    content += `0.85 0.85 0.87 RG\n0.5 w\n${rightX} ${rightY - cardHeight} ${cardWidth} ${cardHeight} re\nS\n`;
    content += `BT\n/F2 8 Tf\n0.5 0.5 0.5 rg\n${rightX + 12} ${rightY - 14} Td\n(CURRENT SALARY) Tj\nET\n`;
    content += `BT\n/F1 13 Tf\n0.2 0.2 0.2 rg\n${rightX + 12} ${rightY - 32} Td\n(${escapeText(formattedSalary)}) Tj\nET\n`;
    rightY -= (cardHeight + cardSpacing);
  }
  
  // Expected Salary Card
  if (player.expected_salary) {
    const formattedSalary = formatSalary(player.expected_salary);
    content += `1 1 1 rg\n${rightX} ${rightY - cardHeight} ${cardWidth} ${cardHeight} re\nf\n`;
    content += `0.85 0.85 0.87 RG\n0.5 w\n${rightX} ${rightY - cardHeight} ${cardWidth} ${cardHeight} re\nS\n`;
    content += `BT\n/F2 8 Tf\n0.5 0.5 0.5 rg\n${rightX + 12} ${rightY - 14} Td\n(EXPECTED SALARY) Tj\nET\n`;
    content += `BT\n/F1 13 Tf\n0.2 0.2 0.2 rg\n${rightX + 12} ${rightY - 32} Td\n(${escapeText(formattedSalary)}) Tj\nET\n`;
    rightY -= (cardHeight + cardSpacing);
  }
  
  // Agency Card (with optional clickable link)
  if (player.agency) {
    const agencyY = rightY - cardHeight;
    content += `1 1 1 rg\n${rightX} ${agencyY} ${cardWidth} ${cardHeight} re\nf\n`;
    content += `0.85 0.85 0.87 RG\n0.5 w\n${rightX} ${agencyY} ${cardWidth} ${cardHeight} re\nS\n`;
    content += `BT\n/F2 8 Tf\n0.5 0.5 0.5 rg\n${rightX + 12} ${rightY - 14} Td\n(AGENCY) Tj\nET\n`;
    
    if (player.agency_link) {
      content += `BT\n/F1 11 Tf\n0.2 0.4 0.7 rg\n${rightX + 12} ${rightY - 30} Td\n(${escapeText(player.agency)}) Tj\nET\n`;
      
      // Store agency annotation to be added later with proper numbering
      const agencyAnnotation = {
        rect: [rightX, agencyY, rightX + cardWidth, agencyY + cardHeight],
        url: player.agency_link
      };
      (player as any)._agencyAnnotation = agencyAnnotation;
    } else {
      content += `BT\n/F1 11 Tf\n0.2 0.2 0.2 rg\n${rightX + 12} ${rightY - 30} Td\n(${escapeText(player.agency)}) Tj\nET\n`;
    }
    rightY -= (cardHeight + cardSpacing);
  }
  
  // Video Link Card - same style, visually integrated
  if (player.video_link) {
    const linkY = rightY - cardHeight;
    content += `1 1 1 rg\n${rightX} ${linkY} ${cardWidth} ${cardHeight} re\nf\n`;
    content += `0.2 0.4 0.7 RG\n0.8 w\n${rightX} ${linkY} ${cardWidth} ${cardHeight} re\nS\n`;
    content += `BT\n/F2 8 Tf\n0.5 0.5 0.5 rg\n${rightX + 12} ${rightY - 14} Td\n(VIDEO REPORT) Tj\nET\n`;
    content += `BT\n/F1 11 Tf\n0.2 0.4 0.7 rg\n${rightX + 12} ${rightY - 30} Td\n(Watch Video) Tj\nET\n`;
    
    // Collect all annotations
    const hasAgencyLink = (player as any)._agencyAnnotation;
    
    if (hasAgencyLink) {
      // Both video and agency links exist
      const agencyAnnot = (player as any)._agencyAnnotation;
      annotations = `8 0 obj
<<
/Type /Annot
/Subtype /Link
/Rect [${agencyAnnot.rect[0]} ${agencyAnnot.rect[1]} ${agencyAnnot.rect[2]} ${agencyAnnot.rect[3]}]
/Border [0 0 0]
/A <<
/S /URI
/URI (${agencyAnnot.url})
>>
/NewWindow true
>>
endobj
9 0 obj
<<
/Type /Annot
/Subtype /Link
/Rect [${rightX} ${linkY} ${rightX + cardWidth} ${linkY + 38}]
/Border [0 0 0]
/A <<
/S /URI
/URI (${player.video_link})
>>
/NewWindow true
>>
endobj
`;
    } else {
      // Only video link exists
      annotations = `8 0 obj
<<
/Type /Annot
/Subtype /Link
/Rect [${rightX} ${linkY} ${rightX + cardWidth} ${linkY + 38}]
/Border [0 0 0]
/A <<
/S /URI
/URI (${player.video_link})
>>
/NewWindow true
>>
endobj
`;
    }
    rightY -= (cardHeight + cardSpacing);
  } else if ((player as any)._agencyAnnotation) {
    // Only agency link exists
    const agencyAnnot = (player as any)._agencyAnnotation;
    annotations = `8 0 obj
<<
/Type /Annot
/Subtype /Link
/Rect [${agencyAnnot.rect[0]} ${agencyAnnot.rect[1]} ${agencyAnnot.rect[2]} ${agencyAnnot.rect[3]}]
/Border [0 0 0]
/A <<
/S /URI
/URI (${agencyAnnot.url})
>>
/NewWindow true
>>
endobj
`;
  }
  
  // Resume main content flow - ensure we start below BOTH left and right columns
  // Left column ended around yPos=660 (after profile summary and basic info)
  // Right column ended at rightY
  // We need to start below the lowest point of both columns
  yPos = Math.min(660, rightY - 10); // Add 10pt buffer below right column
  
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
  yPos -= 30;
  
  // ==================== SUMMARY ASSESSMENT SECTION ====================
  // Section header with accent underline
  content += `BT\n/F1 14 Tf\n0.2 0.2 0.2 rg\n40 ${yPos} Td\n(SUMMARY ASSESSMENT) Tj\nET\n`;
  yPos -= 3;
  content += `0.25 0.45 0.75 rg\n40 ${yPos} 180 2 re\nf\n`;
  yPos -= 25;
  
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
    content += `BT\n/F1 10 Tf\n0.15 0.6 0.3 rg\n48 ${boxStartY - 10} Td\n(STRENGTHS) Tj\nET\n`;
    
    let strengthY = boxStartY - 24;
    for (const strength of player.strengths.slice(0, 6)) {
      content += `BT\n/F2 8 Tf\n0.2 0.2 0.2 rg\n48 ${strengthY} Td\n(+ ${escapeText(strength)}) Tj\nET\n`;
      strengthY -= 14;
    }
  }
  
  // Weaknesses Box (Right side - aligned with strengths top)
  if (player.weaknesses && player.weaknesses.length > 0) {
    content += `0.99 0.96 0.96 rg\n305 ${boxStartY - weaknessesHeight} 250 ${weaknessesHeight} re\nf\n`;
    content += `0.8 0.2 0.2 RG\n0.5 w\n305 ${boxStartY - weaknessesHeight} 250 ${weaknessesHeight} re\nS\n`;
    content += `BT\n/F1 10 Tf\n0.8 0.2 0.2 rg\n313 ${boxStartY - 10} Td\n(WEAKNESSES) Tj\nET\n`;
    
    let weaknessY = boxStartY - 24;
    for (const weakness of player.weaknesses.slice(0, 6)) {
      content += `BT\n/F2 8 Tf\n0.2 0.2 0.2 rg\n313 ${weaknessY} Td\n(- ${escapeText(weakness)}) Tj\nET\n`;
      weaknessY -= 14;
    }
  }
  
  // Move Y position down past both boxes
  yPos -= maxBoxHeight + 18;
  
  // Risks Box - normalized spacing
  if (player.risks && player.risks.length > 0) {
    const risksHeight = (player.risks.slice(0, 4).length * 14) + 22;
    content += `0.99 0.97 0.95 rg\n40 ${yPos - risksHeight} 515 ${risksHeight} re\nf\n`;
    content += `0.8 0.5 0.1 RG\n0.5 w\n40 ${yPos - risksHeight} 515 ${risksHeight} re\nS\n`;
    content += `BT\n/F1 10 Tf\n0.8 0.5 0.1 rg\n48 ${yPos - 10} Td\n(RISKS / RED FLAGS) Tj\nET\n`;
    
    let riskY = yPos - 24;
    for (const risk of player.risks.slice(0, 4)) {
      content += `BT\n/F2 8 Tf\n0.2 0.2 0.2 rg\n48 ${riskY} Td\n(! ${escapeText(risk)}) Tj\nET\n`;
      riskY -= 14;
    }
    yPos -= risksHeight + 18;
  }
  
  // Transfer Potential Box - normalized spacing
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
    yPos -= potentialHeight + 18;
  }
  
  // Separator
  content += `0.85 0.85 0.87 RG\n0.5 w\n40 ${yPos} m\n555 ${yPos} l\nS\n`;
  yPos -= 28;
  
  // ==================== ATTRIBUTES OVERVIEW WITH COMPACT RADAR + SCOUT NOTES ====================
  if (averageRatings && averageRatings.length > 0) {
    // Section header with accent underline
    content += `BT\n/F1 14 Tf\n0.2 0.2 0.2 rg\n40 ${yPos} Td\n(ATTRIBUTES OVERVIEW) Tj\nET\n`;
    yPos -= 3;
    content += `0.25 0.45 0.75 rg\n40 ${yPos} 180 2 re\nf\n`;
    yPos -= 25;
    
    const sectionStartY = yPos;
    
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
    
    // Radar grid circles with values
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
      
      // Add numeric labels at right side of each circle
      if (r === 85) {
        content += `BT\n/F2 7 Tf\n0.6 0.6 0.6 rg\n${radarCenterX + r + 5} ${radarCenterY - 3} Td\n(10) Tj\nET\n`;
      } else if (r === 42) {
        content += `BT\n/F2 7 Tf\n0.6 0.6 0.6 rg\n${radarCenterX + r + 5} ${radarCenterY - 3} Td\n(5) Tj\nET\n`;
      }
    }
    
    // Get top 6 skills for radar
    const topSkills = averageRatings.slice(0, 6);
    const angleStep = (2 * Math.PI) / topSkills.length;
    
    // Draw radar axes
    content += `0.85 0.85 0.87 RG\n0.3 w\n`;
    for (let i = 0; i < topSkills.length; i++) {
      const angle = (i * angleStep) - (Math.PI / 2);
      const x = radarCenterX + radarRadius * Math.cos(angle);
      const y = radarCenterY + radarRadius * Math.sin(angle);
      content += `${radarCenterX} ${radarCenterY} m\n${x} ${y} l\nS\n`;
    }
    
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
    
    // Add skill labels around the radar
    for (let i = 0; i < topSkills.length; i++) {
      const angle = (i * angleStep) - (Math.PI / 2);
      const labelDistance = radarRadius + 15;
      const x = radarCenterX + labelDistance * Math.cos(angle);
      const y = radarCenterY + labelDistance * Math.sin(angle);
      
      const skillName = topSkills[i].parameter.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()).substring(0, 12);
      const score = topSkills[i].averageScore.toFixed(1);
      
      // Adjust text position based on angle for better readability
      let textX = x - 15;
      if (angle > -Math.PI/4 && angle < Math.PI/4) textX = x + 2; // Right side
      
      content += `BT\n/F2 7 Tf\n0.2 0.2 0.2 rg\n${textX} ${y - 3} Td\n(${escapeText(skillName)}) Tj\nET\n`;
      content += `BT\n/F1 7 Tf\n0.2 0.4 0.7 rg\n${textX} ${y - 10} Td\n(${score}) Tj\nET\n`;
    }
    
    // ==================== SCOUT NOTES (RIGHT COLUMN) - Aligned to radar top ====================
    if (player.scout_notes) {
      const notesX = 290;
      const notesStartY = sectionStartY; // Start at same level as radar
      
      // Scout notes box background - aligned to radar chart top
      content += `0.98 0.98 0.99 rg\n${notesX} ${notesStartY - 205} 265 205 re\nf\n`;
      content += `0.85 0.85 0.87 RG\n0.5 w\n${notesX} ${notesStartY - 205} 265 205 re\nS\n`;
      
      content += `BT\n/F1 11 Tf\n0.2 0.2 0.2 rg\n${notesX + 10} ${notesStartY - 15} Td\n(SCOUT NOTES) Tj\nET\n`;
      
      let notesY = notesStartY - 30;
      const notesLines = wrapText(player.scout_notes, 42);
      for (const line of notesLines.slice(0, 14)) {
        content += `BT\n/F2 8 Tf\n0.3 0.3 0.3 rg\n${notesX + 10} ${notesY} Td\n(${escapeText(line)}) Tj\nET\n`;
        notesY -= 12;
      }
    }
    
    yPos -= 210;
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

  return { content, annotations };
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

function formatEstimatedValue(value: string): string {
  if (!value) return '';
  
  // Remove currency symbols and whitespace
  const cleanValue = value.replace(/[€$£¥\s]/g, '');
  
  // Extract currency symbol (default to EUR)
  let currency = 'EUR';
  if (value.includes('$')) currency = '$';
  else if (value.includes('£')) currency = 'GBP';
  else if (value.includes('¥')) currency = 'YEN';
  else if (value.includes('€')) currency = 'EUR';
  
  // Try to parse as number
  let numericValue = parseFloat(cleanValue.replace(/[^0-9.]/g, ''));
  
  // Check if it already has M/K/B suffix
  if (cleanValue.match(/M$/i)) {
    numericValue *= 1000000;
  } else if (cleanValue.match(/K$/i)) {
    numericValue *= 1000;
  } else if (cleanValue.match(/B$/i)) {
    numericValue *= 1000000000;
  }
  
  // Format with appropriate suffix using text instead of symbol
  let formattedAmount = '';
  if (numericValue >= 1000000000) {
    formattedAmount = `${(numericValue / 1000000000).toFixed(1)}B`;
  } else if (numericValue >= 1000000) {
    formattedAmount = `${(numericValue / 1000000).toFixed(1)}M`;
  } else if (numericValue >= 1000) {
    formattedAmount = `${(numericValue / 1000).toFixed(0)}K`;
  } else {
    formattedAmount = `${numericValue}`;
  }
  
  // Use currency text instead of symbols for better PDF compatibility
  if (currency === '$') {
    return `$${formattedAmount}`;
  } else if (currency === 'GBP') {
    return `GBP ${formattedAmount}`;
  } else if (currency === 'YEN') {
    return `YEN ${formattedAmount}`;
  } else {
    return `EUR ${formattedAmount}`;
  }
}

function formatSalary(value: string): string {
  if (!value) return '';
  
  // If it already looks formatted (contains /, week, month, year, or already has K/M), return as is
  if (value.match(/\/|week|month|year|per/i) || (value.match(/[KMB]$/i) && !value.match(/^\d+$/))) {
    return value;
  }
  
  // Remove currency symbols and whitespace
  const cleanValue = value.replace(/[€$£¥\s]/g, '');
  
  // Extract currency symbol (default to EUR)
  let currency = 'EUR';
  if (value.includes('$')) currency = '$';
  else if (value.includes('£')) currency = 'GBP';
  else if (value.includes('¥')) currency = 'YEN';
  else if (value.includes('€')) currency = 'EUR';
  
  // Try to parse as number
  let numericValue = parseFloat(cleanValue.replace(/[^0-9.]/g, ''));
  
  if (isNaN(numericValue)) return value;
  
  // Check if it already has M/K/B suffix
  if (cleanValue.match(/M$/i)) {
    numericValue *= 1000000;
  } else if (cleanValue.match(/K$/i)) {
    numericValue *= 1000;
  } else if (cleanValue.match(/B$/i)) {
    numericValue *= 1000000000;
  }
  
  // Format with appropriate suffix
  let formattedAmount = '';
  if (numericValue >= 1000000) {
    formattedAmount = `${(numericValue / 1000000).toFixed(1)}M`;
  } else if (numericValue >= 1000) {
    formattedAmount = `${(numericValue / 1000).toFixed(0)}K`;
  } else {
    formattedAmount = `${numericValue}`;
  }
  
  // Use currency text instead of symbols for better PDF compatibility
  let currencyPrefix = '';
  if (currency === '$') {
    currencyPrefix = '$';
  } else if (currency === 'GBP') {
    currencyPrefix = 'GBP ';
  } else if (currency === 'YEN') {
    currencyPrefix = 'YEN ';
  } else {
    currencyPrefix = 'EUR ';
  }
  
  return `${currencyPrefix}${formattedAmount}`;
}

function escapeText(text: string): string {
  // Escape special PDF characters, handle nulls, and encode Unicode characters properly
  if (!text) return '';
  
  let result = String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '');
  
  // Convert common accented/special characters to their closest ASCII equivalents
  // This ensures proper rendering in PDF without UTF-8 issues
  const charMap: { [key: string]: string } = {
    'ä': 'a', 'ö': 'o', 'ü': 'u', 'Ä': 'A', 'Ö': 'O', 'Ü': 'U', 'ß': 'ss',
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'å': 'a',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ø': 'o',
    'ù': 'u', 'ú': 'u', 'û': 'u',
    'ñ': 'n', 'ç': 'c', 'ć': 'c', 'č': 'c',
    'ś': 's', 'š': 's', 'ž': 'z', 'ź': 'z', 'ż': 'z',
    'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Å': 'A',
    'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
    'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ø': 'O',
    'Ù': 'U', 'Ú': 'U', 'Û': 'U',
    'Ñ': 'N', 'Ç': 'C', 'Ć': 'C', 'Č': 'C',
    'Ś': 'S', 'Š': 'S', 'Ž': 'Z', 'Ź': 'Z', 'Ż': 'Z'
  };
  
  result = result.split('').map(char => charMap[char] || char).join('');
  
  return result;
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
