#!/usr/bin/env node
/**
 * LOC Report HTML Visualizer
 *
 * Generates an interactive HTML visualization of the lines of code report
 * and opens it in the default browser.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = process.cwd();
const reportJsonPath = path.join(rootDir, 'loc-report.json');
const reportHtmlPath = path.join(rootDir, 'loc-report.html');

// Generate JSON report if it doesn't exist
if (!fs.existsSync(reportJsonPath)) {
  console.log('Generating LOC report...');
  execSync('node scripts/count-loc.js --json', { stdio: 'inherit' });
}

// Read the JSON report
const report = JSON.parse(fs.readFileSync(reportJsonPath, 'utf-8'));

// Calculate percentages and prepare data
const overallSource = report.totals.overall.source;
const overallTests = report.totals.overall.tests;
const overallTotal = report.totals.overall.total;

const testCoverageRatio = overallSource.code > 0
  ? ((overallTests.code / overallSource.code) * 100).toFixed(1)
  : '0.0';

const codeDensity = overallTotal.lines > 0
  ? ((overallTotal.code / overallTotal.lines) * 100).toFixed(1)
  : '0.0';

// Prepare top packages and apps
const topPackages = Object.entries(report.packages)
  .map(([name, stats]) => ({ name, code: stats.source.code }))
  .sort((a, b) => b.code - a.code)
  .slice(0, 10);

const topApps = Object.entries(report.apps)
  .map(([name, stats]) => ({ name, code: stats.source.code }))
  .sort((a, b) => b.code - a.code)
  .slice(0, 10);

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Loom - Lines of Code Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #2d3748;
      padding: 2rem;
      min-height: 100vh;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    header {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    h1 {
      font-size: 2.5rem;
      color: #667eea;
      margin-bottom: 0.5rem;
    }

    .timestamp {
      color: #718096;
      font-size: 0.9rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }

    .stat-label {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #a0aec0;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 0.25rem;
    }

    .stat-subtitle {
      font-size: 0.875rem;
      color: #718096;
    }

    .chart-section {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    }

    .chart-title {
      font-size: 1.5rem;
      color: #2d3748;
      margin-bottom: 1.5rem;
      font-weight: 600;
    }

    .chart-container {
      position: relative;
      height: 400px;
    }

    .two-column {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .table-section {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      background: #f7fafc;
    }

    th {
      text-align: left;
      padding: 1rem;
      font-weight: 600;
      color: #4a5568;
      border-bottom: 2px solid #e2e8f0;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    td {
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    tbody tr:hover {
      background: #f7fafc;
    }

    .number {
      font-variant-numeric: tabular-nums;
      text-align: right;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge-success {
      background: #c6f6d5;
      color: #22543d;
    }

    .badge-warning {
      background: #feebc8;
      color: #7c2d12;
    }

    .badge-info {
      background: #bee3f8;
      color: #2c5282;
    }

    footer {
      text-align: center;
      color: white;
      margin-top: 3rem;
      opacity: 0.8;
    }

    @media (max-width: 768px) {
      body {
        padding: 1rem;
      }

      h1 {
        font-size: 2rem;
      }

      .two-column {
        grid-template-columns: 1fr;
      }

      .chart-container {
        height: 300px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 Web Loom - Lines of Code Report</h1>
      <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Code</div>
        <div class="stat-value">${overallTotal.code.toLocaleString()}</div>
        <div class="stat-subtitle">lines across ${overallTotal.files.toLocaleString()} files</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Source Code</div>
        <div class="stat-value">${overallSource.code.toLocaleString()}</div>
        <div class="stat-subtitle">${overallSource.files.toLocaleString()} files · ${codeDensity}% density</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Test Code</div>
        <div class="stat-value">${overallTests.code.toLocaleString()}</div>
        <div class="stat-subtitle">${overallTests.files.toLocaleString()} files · ${testCoverageRatio}% coverage</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Code Density</div>
        <div class="stat-value">${codeDensity}%</div>
        <div class="stat-subtitle">${overallTotal.comments.toLocaleString()} comments · ${overallTotal.blanks.toLocaleString()} blanks</div>
      </div>
    </div>

    <div class="two-column">
      <div class="chart-section">
        <h2 class="chart-title">Code Distribution</h2>
        <div class="chart-container">
          <canvas id="distributionChart"></canvas>
        </div>
      </div>

      <div class="chart-section">
        <h2 class="chart-title">Source vs Tests</h2>
        <div class="chart-container">
          <canvas id="sourceTestChart"></canvas>
        </div>
      </div>
    </div>

    <div class="chart-section">
      <h2 class="chart-title">Top 10 Packages by Lines of Code</h2>
      <div class="chart-container">
        <canvas id="packagesChart"></canvas>
      </div>
    </div>

    <div class="chart-section">
      <h2 class="chart-title">Top 10 Apps by Lines of Code</h2>
      <div class="chart-container">
        <canvas id="appsChart"></canvas>
      </div>
    </div>

    <div class="two-column">
      <div class="table-section">
        <h2 class="chart-title">Packages Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Package</th>
              <th class="number">Source</th>
              <th class="number">Tests</th>
              <th class="number">Coverage</th>
            </tr>
          </thead>
          <tbody id="packagesTable"></tbody>
        </table>
      </div>

      <div class="table-section">
        <h2 class="chart-title">Apps Summary</h2>
        <table>
          <thead>
            <tr>
              <th>App</th>
              <th class="number">Source</th>
              <th class="number">Tests</th>
              <th class="number">Coverage</th>
            </tr>
          </thead>
          <tbody id="appsTable"></tbody>
        </table>
      </div>
    </div>

    <footer>
      <p>Generated by Web Loom LOC Counter · ${new Date().getFullYear()}</p>
    </footer>
  </div>

  <script>
    const report = ${JSON.stringify(report, null, 2)};

    // Chart.js default configuration
    Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif";
    Chart.defaults.plugins.legend.labels.usePointStyle = true;

    // Distribution Chart
    const distributionCtx = document.getElementById('distributionChart').getContext('2d');
    new Chart(distributionCtx, {
      type: 'doughnut',
      data: {
        labels: ['Code', 'Comments', 'Blanks'],
        datasets: [{
          data: [
            ${overallTotal.code},
            ${overallTotal.comments},
            ${overallTotal.blanks}
          ],
          backgroundColor: ['#667eea', '#f6ad55', '#fc8181'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    // Source vs Test Chart
    const sourceTestCtx = document.getElementById('sourceTestChart').getContext('2d');
    new Chart(sourceTestCtx, {
      type: 'bar',
      data: {
        labels: ['Packages', 'Apps', 'Overall'],
        datasets: [{
          label: 'Source Code',
          data: [
            ${report.totals.packages.source.code},
            ${report.totals.apps.source.code},
            ${overallSource.code}
          ],
          backgroundColor: '#667eea'
        }, {
          label: 'Test Code',
          data: [
            ${report.totals.packages.tests.code},
            ${report.totals.apps.tests.code},
            ${overallTests.code}
          ],
          backgroundColor: '#48bb78'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    // Top Packages Chart
    const packagesCtx = document.getElementById('packagesChart').getContext('2d');
    new Chart(packagesCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(topPackages.map(p => p.name))},
        datasets: [{
          label: 'Lines of Code',
          data: ${JSON.stringify(topPackages.map(p => p.code))},
          backgroundColor: '#667eea'
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });

    // Top Apps Chart
    const appsCtx = document.getElementById('appsChart').getContext('2d');
    new Chart(appsCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(topApps.map(a => a.name))},
        datasets: [{
          label: 'Lines of Code',
          data: ${JSON.stringify(topApps.map(a => a.code))},
          backgroundColor: '#f6ad55'
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });

    // Populate Packages Table
    const packagesTableBody = document.getElementById('packagesTable');
    const sortedPackages = Object.entries(report.packages)
      .sort(([, a], [, b]) => b.source.code - a.source.code);

    sortedPackages.forEach(([name, stats]) => {
      const coverage = stats.source.code > 0
        ? ((stats.tests.code / stats.source.code) * 100).toFixed(1)
        : '0.0';

      const badgeClass = coverage >= 50 ? 'badge-success' : coverage >= 25 ? 'badge-warning' : 'badge-info';

      const row = document.createElement('tr');
      row.innerHTML = \`
        <td><strong>\${name}</strong></td>
        <td class="number">\${stats.source.code.toLocaleString()}</td>
        <td class="number">\${stats.tests.code.toLocaleString()}</td>
        <td class="number"><span class="badge \${badgeClass}">\${coverage}%</span></td>
      \`;
      packagesTableBody.appendChild(row);
    });

    // Populate Apps Table
    const appsTableBody = document.getElementById('appsTable');
    const sortedApps = Object.entries(report.apps)
      .sort(([, a], [, b]) => b.source.code - a.source.code);

    sortedApps.forEach(([name, stats]) => {
      const coverage = stats.source.code > 0
        ? ((stats.tests.code / stats.source.code) * 100).toFixed(1)
        : '0.0';

      const badgeClass = coverage >= 50 ? 'badge-success' : coverage >= 25 ? 'badge-warning' : 'badge-info';

      const row = document.createElement('tr');
      row.innerHTML = \`
        <td><strong>\${name}</strong></td>
        <td class="number">\${stats.source.code.toLocaleString()}</td>
        <td class="number">\${stats.tests.code.toLocaleString()}</td>
        <td class="number"><span class="badge \${badgeClass}">\${coverage}%</span></td>
      \`;
      appsTableBody.appendChild(row);
    });
  </script>
</body>
</html>`;

// Write HTML file
fs.writeFileSync(reportHtmlPath, html);
console.log(`\n✅ HTML report generated: ${reportHtmlPath}\n`);

// Open in default browser
const platform = process.platform;
let openCommand;

if (platform === 'darwin') {
  openCommand = 'open';
} else if (platform === 'win32') {
  openCommand = 'start';
} else {
  openCommand = 'xdg-open';
}

try {
  execSync(`${openCommand} "${reportHtmlPath}"`, { stdio: 'ignore' });
  console.log('🌐 Opening report in your default browser...\n');
} catch (error) {
  console.log(`⚠️  Could not open browser automatically. Please open: ${reportHtmlPath}\n`);
}
