interface Player {
  name: string;
  age: number | null;
  position: string | null;
  team: string | null;
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
  comment: string | null;
}

export const generatePDF = async (
  player: Player,
  observation: Observation,
  ratings: Rating[]
) => {
  // Calculate average rating
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
    : "N/A";

  // Create HTML content for the PDF
  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Scouting Report - ${player.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2563eb;
            margin: 0 0 10px 0;
          }
          .header h2 {
            color: #059669;
            margin: 0;
            font-weight: normal;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h3 {
            color: #2563eb;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-item {
            padding: 10px;
            background: #f9fafb;
            border-radius: 5px;
          }
          .info-label {
            font-weight: bold;
            color: #6b7280;
            font-size: 12px;
            text-transform: uppercase;
          }
          .info-value {
            color: #111827;
            font-size: 16px;
            margin-top: 5px;
          }
          .rating-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            background: #f9fafb;
            border-radius: 5px;
          }
          .rating-name {
            font-weight: bold;
            text-transform: capitalize;
          }
          .rating-score {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          .rating-bar {
            width: 200px;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
          }
          .rating-fill {
            height: 100%;
            background: #2563eb;
          }
          .rating-comment {
            margin-top: 5px;
            color: #6b7280;
            font-size: 14px;
          }
          .notes {
            padding: 15px;
            background: #f9fafb;
            border-radius: 5px;
            white-space: pre-wrap;
            line-height: 1.6;
          }
          .average-box {
            text-align: center;
            padding: 20px;
            background: #2563eb;
            color: white;
            border-radius: 10px;
            margin: 20px 0;
          }
          .average-box .label {
            font-size: 14px;
            opacity: 0.9;
          }
          .average-box .value {
            font-size: 48px;
            font-weight: bold;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SCOUTING REPORT</h1>
          <h2>ScoutFlow Professional Analysis</h2>
        </div>

        <div class="section">
          <h3>Player Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Player Name</div>
              <div class="info-value">${player.name}</div>
            </div>
            ${player.age ? `
            <div class="info-item">
              <div class="info-label">Age</div>
              <div class="info-value">${player.age}</div>
            </div>
            ` : ''}
            ${player.position ? `
            <div class="info-item">
              <div class="info-label">Position</div>
              <div class="info-value">${player.position}</div>
            </div>
            ` : ''}
            ${player.team ? `
            <div class="info-item">
              <div class="info-label">Team</div>
              <div class="info-value">${player.team}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <h3>Observation Details</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Date</div>
              <div class="info-value">${new Date(observation.date).toLocaleDateString()}</div>
            </div>
            ${observation.location ? `
            <div class="info-item">
              <div class="info-label">Location</div>
              <div class="info-value">${observation.location}</div>
            </div>
            ` : ''}
          </div>
          ${observation.notes ? `
          <div style="margin-top: 15px;">
            <div class="info-label" style="margin-bottom: 10px;">Notes</div>
            <div class="notes">${observation.notes}</div>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <h3>Performance Analysis</h3>
          <div class="average-box">
            <div class="label">Overall Average Rating</div>
            <div class="value">${avgRating}</div>
          </div>
          
          ${ratings.map(rating => `
            <div class="rating-item">
              <div style="flex: 1;">
                <div class="rating-name">${rating.parameter.replace(/_/g, ' ')}</div>
                ${rating.comment ? `<div class="rating-comment">${rating.comment}</div>` : ''}
              </div>
              <div class="rating-bar">
                <div class="rating-fill" style="width: ${(rating.score / 10) * 100}%"></div>
              </div>
              <div class="rating-score">${rating.score}</div>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          <p>Generated by ScoutFlow - Professional Football Scouting Platform</p>
          <p>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
    </html>
  `;

  // Create a new window and print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
