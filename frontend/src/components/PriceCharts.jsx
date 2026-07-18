import React from 'react';
import Plot from 'react-plotly.js';

export default function PriceCharts({ isHormuzBlocked }) {
  // Mock timeline dates
  const dates = ['Jul 10', 'Jul 11', 'Jul 12', 'Jul 13', 'Jul 14', 'Jul 15', 'Jul 16', 'Jul 17', 'Jul 18 (Today)', 'Jul 19 (Proj)', 'Jul 20 (Proj)', 'Jul 21 (Proj)'];
  
  // Brent Oil Prices
  const oilBase = [75.2, 75.8, 76.5, 76.1, 77.0, 78.2, 77.8, 78.5, 78.5, 79.0, 78.8, 79.2];
  const oilSpike = [75.2, 75.8, 76.5, 76.1, 77.0, 78.2, 77.8, 78.5, 118.2, 122.5, 125.0, 128.0];
  const oilMitigated = [75.2, 75.8, 76.5, 76.1, 77.0, 78.2, 77.8, 78.5, 105.0, 102.5, 101.0, 99.5];

  // LNG Prices
  const lngBase = [12.1, 12.3, 12.2, 12.5, 12.4, 12.8, 12.6, 12.4, 12.4, 12.5, 12.6, 12.7];
  const lngSpike = [12.1, 12.3, 12.2, 12.5, 12.4, 12.8, 12.6, 12.4, 21.8, 24.5, 26.0, 27.5];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div style={{ background: '#0d131f', border: '1px solid #1a2436', borderRadius: '8px', padding: '10px', overflow: 'hidden' }}>
        <Plot
          data={[
            {
              x: dates,
              y: isHormuzBlocked ? oilSpike : oilBase,
              type: 'scatter',
              mode: 'lines+markers',
              name: isHormuzBlocked ? 'Unmitigated Price Spike' : 'Baseline Brent Crude',
              line: { color: isHormuzBlocked ? '#f56565' : '#4fd1c5', width: 3 },
              marker: { size: 6 }
            },
            ...(isHormuzBlocked ? [{
              x: dates.slice(8),
              y: oilMitigated.slice(8),
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Mitigated (SPR Drawdown Active)',
              line: { color: '#48bb78', width: 3, dash: 'dot' },
              marker: { size: 6 }
            }] : [])
          ]}
          layout={{
            title: 'Brent Crude Oil Price Trend (USD/Barrel)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#a0aec0', size: 11 },
            xaxis: { gridcolor: '#1a2436', title: 'Timeline' },
            yaxis: { gridcolor: '#1a2436', title: 'Price (USD)' },
            margin: { l: 40, r: 20, t: 40, b: 40 },
            legend: { orientation: 'h', y: -0.2 },
            height: 250,
            autosize: true
          }}
          useResizeHandler={true}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ background: '#0d131f', border: '1px solid #1a2436', borderRadius: '8px', padding: '10px', overflow: 'hidden' }}>
        <Plot
          data={[
            {
              x: dates,
              y: isHormuzBlocked ? lngSpike : lngBase,
              type: 'scatter',
              mode: 'lines+markers',
              name: 'LNG Price',
              line: { color: isHormuzBlocked ? '#a78bfa' : '#4299e1', width: 3 },
              marker: { size: 6 }
            }
          ]}
          layout={{
            title: 'LNG Asian Spot Contract (USD/MMBtu)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#a0aec0', size: 11 },
            xaxis: { gridcolor: '#1a2436', title: 'Timeline' },
            yaxis: { gridcolor: '#1a2436', title: 'Price (USD)' },
            margin: { l: 40, r: 20, t: 40, b: 40 },
            legend: { orientation: 'h', y: -0.2 },
            height: 250,
            autosize: true
          }}
          useResizeHandler={true}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}
