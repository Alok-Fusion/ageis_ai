import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { 
  Box, Container, Grid, Typography, Button, Paper, Alert, 
  Tabs, Tab, CircularProgress, LinearProgress, Divider, List, ListItem, ListItemText, ListItemIcon, Chip 
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MapIcon from '@mui/icons-material/Map';
import HubIcon from '@mui/icons-material/Hub';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SecurityIcon from '@mui/icons-material/Security';

import theme from './theme/theme';
import InteractiveMap from './components/InteractiveMap';
import AgentFlow from './components/AgentFlow';
import GraphExplorer from './components/GraphExplorer';
import PriceCharts from './components/PriceCharts';
import ExecutiveChat from './components/ExecutiveChat';

export default function App() {
  const [ships, setShips] = useState([]);
  const [prices, setPrices] = useState({});
  const [activeTab, setActiveTab] = useState(0); 
  const [isHormuzBlocked, setIsHormuzBlocked] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [activeAgentIndex, setActiveAgentIndex] = useState(-1);
  const [agentLogs, setAgentLogs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [sprReleases, setSprReleases] = useState([]);
  const [riskIndex, setRiskIndex] = useState(52.4);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [refineries, setRefineries] = useState([]);
  const [reserves, setReserves] = useState([]);
  const [grids, setGrids] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Telemetry HUD specific states
  const [selectedNode, setSelectedNode] = useState(null);
  const [bottomTab, setBottomTab] = useState(0); // 0 = Vessels, 1 = Contracts, 2 = Refineries, 3 = Power Grids, 4 = Reserves
  const [searchQuery, setSearchQuery] = useState('');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const [nextScanSeconds, setNextScanSeconds] = useState(1800); // 30 minutes countdown
  const [forcingScan, setForcingScan] = useState(false);

  // Fetch initial dashboard metrics on load
  const fetchDashboardData = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/dashboard/metrics');
      const data = await res.json();
      setPrices(data.prices || {});
      setRiskIndex(data.energy_risk_index);
      setRecentAlerts(data.recent_alerts || []);
      
      const shipsRes = await fetch('http://localhost:8000/api/v1/dashboard/ships');
      const shipsData = await shipsRes.json();
      setShips(shipsData);

      const refineriesRes = await fetch('http://localhost:8000/api/v1/dashboard/refineries');
      const refineriesData = await refineriesRes.json();
      setRefineries(refineriesData);

      const reservesRes = await fetch('http://localhost:8000/api/v1/dashboard/reserves');
      const reservesData = await reservesRes.json();
      setReserves(reservesData);

      const gridsRes = await fetch('http://localhost:8000/api/v1/dashboard/grids');
      const gridsData = await gridsRes.json();
      setGrids(gridsData);

      const suppliersRes = await fetch('http://localhost:8000/api/v1/dashboard/suppliers');
      const suppliersData = await suppliersRes.json();
      setSuppliers(suppliersData);

      // Auto-select first item if none is selected
      if (!selectedNode && shipsData.length > 0) {
        setSelectedNode({ ...shipsData[0], nodeType: 'vessel' });
      }
    } catch (err) {
      console.error("Error fetching AEGIS core metrics:", err);
    }
  };

  // Poll metrics every 10 seconds for real-time changes
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Decrement countdown timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNextScanSeconds(prev => {
        if (prev <= 1) {
          triggerForceScan();
          return 1800;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Triggers immediate feed check and price check
  const triggerForceScan = async () => {
    if (forcingScan) return;
    setForcingScan(true);
    try {
      await fetchDashboardData();
      setNextScanSeconds(1800);
    } catch (err) {
      console.error("Error running force scan:", err);
    } finally {
      setForcingScan(false);
    }
  };

  // Simulates news event validation
  const runHormuzSimulation = async () => {
    if (simulationRunning) return;
    setSimulationRunning(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/simulation/analyze-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: "Iran closes Strait of Hormuz. US fleet on alert." })
      });
      const data = await response.json();
      setIsHormuzBlocked(true);
      setRiskIndex(data.unified_risk_score);
      setRecommendations(data.recommendations);
      setPrices(data.market_prices || {});

      const rawSim = await fetch('http://localhost:8000/api/v1/simulation/simulate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_key: "hormuz_blockage" })
      });
      const simData = await rawSim.json();
      setSprReleases(simData.spr_releases || []);
      
      // Update selected vessel to show alert state
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulationRunning(false);
    }
  };

  const resetSimulation = () => {
    setIsHormuzBlocked(false);
    setRecommendations([]);
    setSprReleases([]);
    fetchDashboardData();
  };

  const triggerReportDownload = () => {
    window.open('http://localhost:8000/api/v1/report/download-report?scenario_key=hormuz_blockage', '_blank');
  };

  // Format countdown
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filter lists based on search query
  const filteredShips = ships.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.destination.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredContracts = suppliers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.resource_type.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredRefineries = refineries.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.production_output.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredGrids = grids.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.grid_type.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredReserves = reserves.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.energy_type.toLowerCase().includes(searchQuery.toLowerCase()));

  // SVG Sparkline path generator
  const sparklineValues = [45, 48, 43, 50, 47, 54, 52, 58, 61, 57, 65, 62, 70, 68, 72];
  const generateSparklinePath = () => {
    let path = `M 10 ${100 - sparklineValues[0]}`;
    sparklineValues.forEach((val, idx) => {
      path += ` L ${10 + idx * 25} ${100 - val}`;
    });
    return path;
  };

  // Right click row handler
  const handleRowContextMenu = (e, node, type) => {
    e.preventDefault();
    setSelectedNode({ ...node, nodeType: type });
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Close context menu
  useEffect(() => {
    const handleClose = () => setShowContextMenu(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      {/* Immersive CRT effects (Subtle) */}
      <div className="scanline-beam" style={{ opacity: 0.15 }} />

      <Box sx={{ bgcolor: '#06080c', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Sleek Top Header Bar */}
        <Box sx={{ height: '36px', bgcolor: '#090e17', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
          {/* Left Window Control Group */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 0.8 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff5f56' }} />
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#27c93f' }} />
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ borderColor: '#1e293b', height: '16px', mx: 1 }} />
            
            {/* Header Tabs */}
            <Typography variant="caption" sx={{ color: '#4fd1c5', fontWeight: 'bold', borderBottom: '2px solid #4fd1c5', height: '36px', display: 'flex', alignItems: 'center', px: 1, fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer' }}>
              AEGIS OPERATIONAL COMMAND
            </Typography>
            <Typography variant="caption" sx={{ color: '#4a5568', height: '36px', display: 'flex', alignItems: 'center', px: 1, fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer', '&:hover': { color: '#cbd5e1' } }}>
              LOGISTICS MATRIX
            </Typography>
            <Typography variant="caption" sx={{ color: '#4a5568', height: '36px', display: 'flex', alignItems: 'center', px: 1, fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer', '&:hover': { color: '#cbd5e1' } }}>
              SCENARIO COCKPIT
            </Typography>
          </Box>

          {/* Right Header Status Group */}
          <Box sx={{ display: 'flex', gap: 3.5, alignItems: 'center' }}>
            <Typography sx={{ color: '#4fd1c5', fontSize: '9px', fontFamily: 'Courier New, monospace' }}>
              CLOCK: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </Typography>
            <Typography sx={{ color: isHormuzBlocked ? '#f56565' : '#48bb78', fontSize: '9px', fontFamily: 'Courier New, monospace', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              ● HORMUZ STATUS: {isHormuzBlocked ? 'BLOCKED' : 'SECURE'}
            </Typography>
            <Typography sx={{ color: '#ecc94b', fontSize: '9px', fontFamily: 'Courier New, monospace' }}>
              SCAN: {formatTime(nextScanSeconds)}
            </Typography>
          </Box>
        </Box>

        {/* Main Split Interface Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* LEFT 70% REGION: GIS Radar & Spreadsheet Telemetry */}
          <Box sx={{ width: '71%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1a2333', overflow: 'hidden' }}>
            
            {/* GIS Radar Map Viewport (62% height) */}
            <Box sx={{ height: '62%', position: 'relative', borderBottom: '1px solid #1a2333' }}>
              
              {/* Latitude/Longitude Grid Overlay Label Coordinates (along top/sides like the image) */}
              <Box sx={{ position: 'absolute', top: 6, left: 12, zIndex: 10, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <Typography sx={{ fontSize: '8px', color: 'rgba(79, 209, 197, 0.6)', fontFamily: 'Courier New' }}>CPH • COPENHAGEN RADAR</Typography>
                <Typography sx={{ fontSize: '7px', color: '#718096', fontFamily: 'Courier New' }}>A0-27 | VO-52 ACTIVE SENSORS</Typography>
              </Box>
              
              <InteractiveMap ships={ships} isHormuzBlocked={isHormuzBlocked} recentAlerts={recentAlerts} />

              {/* Bottom Horizontal Coordinates grid bar (-150 to 150) */}
              <Box sx={{ position: 'absolute', bottom: 4, left: 0, width: '100%', display: 'flex', justifyContent: 'space-around', zIndex: 10, pointerEvents: 'none', px: 4 }}>
                {['-150°', '-120°', '-90°', '-60°', '-30°', '0°', '30°', '60°', '90°', '120°', '150°'].map((coord) => (
                  <Typography key={coord} sx={{ fontSize: '8px', color: '#475569', fontFamily: 'Courier New, monospace' }}>
                    {coord}
                  </Typography>
                ))}
              </Box>
            </Box>

            {/* Dense Spreadsheet Table Area (38% height) */}
            <Box sx={{ height: '38%', display: 'flex', flexDirection: 'column', bgcolor: '#090e17' }}>
              {/* Telemetry Tabs Toolbar */}
              <Box sx={{ height: '32px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {[
                    { label: 'ACTIVE SHIPS', index: 0 },
                    { label: 'SUPPLIER CONTRACTS', index: 1 },
                    { label: 'REFINERIES', index: 2 },
                    { label: 'POWER GRIDS', index: 3 },
                    { label: 'STRATEGIC RESERVES', index: 4 }
                  ].map((tab) => (
                    <Button
                      key={tab.index}
                      size="small"
                      onClick={() => setBottomTab(tab.index)}
                      sx={{
                        fontSize: '9px',
                        py: 0.3,
                        px: 1,
                        color: bottomTab === tab.index ? '#4fd1c5' : '#718096',
                        fontWeight: 'bold',
                        borderRadius: '0px',
                        borderBottom: bottomTab === tab.index ? '2px solid #4fd1c5' : '2px solid transparent',
                        '&:hover': { bgcolor: 'transparent', color: '#cbd5e1' }
                      }}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </Box>
                
                {/* Search Bar Input */}
                <input
                  type="text"
                  placeholder="SEARCH NODES..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: '#06080c',
                    border: '1px solid #1e293b',
                    color: '#e2e8f0',
                    fontSize: '9px',
                    fontFamily: 'Courier New, monospace',
                    padding: '3px 8px',
                    width: '180px',
                    borderRadius: '2px',
                    outline: 'none'
                  }}
                />
              </Box>

              {/* Live Telemetry Table Viewport */}
              <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <table className="telemetry-table">
                  {bottomTab === 0 && (
                    <>
                      <thead>
                        <tr>
                          <th>Vessel</th>
                          <th>Azimuth (Az)</th>
                          <th>Elevation (El)</th>
                          <th>Cargo Type</th>
                          <th>Cargo Vol</th>
                          <th>Speed</th>
                          <th>Status</th>
                          <th>Destination</th>
                          <th>Owner</th>
                          <th>Country</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredShips.map((ship) => {
                          const isSelected = selectedNode && selectedNode.id === ship.id && selectedNode.nodeType === 'vessel';
                          // Fake Polar Coords
                          const az = (ship.lat * 4.5 + 180).toFixed(2);
                          const el = (ship.lng * 1.2 + 90).toFixed(2);
                          return (
                            <tr
                              key={ship.id}
                              className={isSelected ? 'selected-row' : ''}
                              onClick={() => setSelectedNode({ ...ship, nodeType: 'vessel' })}
                              onContextMenu={(e) => handleRowContextMenu(e, ship, 'vessel')}
                            >
                              <td style={{ color: '#4fd1c5', fontWeight: 'bold' }}>{ship.name}</td>
                              <td>{az}°</td>
                              <td>{el}°</td>
                              <td>{ship.cargo_type}</td>
                              <td>{ship.cargo_volume} bbl</td>
                              <td>{ship.speed} kn</td>
                              <td style={{ color: ship.status.includes('Detour') ? '#ecc94b' : '#cbd5e1' }}>{ship.status}</td>
                              <td>{ship.destination}</td>
                              <td>{ship.owner}</td>
                              <td>{ship.country}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </>
                  )}

                  {bottomTab === 1 && (
                    <>
                      <thead>
                        <tr>
                          <th>Contractor</th>
                          <th>Resource Type</th>
                          <th>Contract Volume</th>
                          <th>Cost / Unit</th>
                          <th>Delivery Days</th>
                          <th>Reliability Index</th>
                          <th>Country</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContracts.map((sup) => {
                          const isSelected = selectedNode && selectedNode.id === sup.id && selectedNode.nodeType === 'supplier';
                          return (
                            <tr
                              key={sup.id}
                              className={isSelected ? 'selected-row' : ''}
                              onClick={() => setSelectedNode({ ...sup, nodeType: 'supplier' })}
                              onContextMenu={(e) => handleRowContextMenu(e, sup, 'supplier')}
                            >
                              <td style={{ color: '#4fd1c5', fontWeight: 'bold' }}>{sup.name}</td>
                              <td>{sup.resource_type}</td>
                              <td>{sup.volume}M unit / month</td>
                              <td>${sup.cost_per_unit} USD</td>
                              <td>{sup.delivery_days} days</td>
                              <td style={{ color: '#48bb78', fontWeight: 'bold' }}>{sup.reliability_score}%</td>
                              <td>{sup.country}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </>
                  )}

                  {bottomTab === 2 && (
                    <>
                      <thead>
                        <tr>
                          <th>Refinery Complex</th>
                          <th>Input Product</th>
                          <th>Output Target</th>
                          <th>Current Capacity</th>
                          <th>Active Output</th>
                          <th>Utilization</th>
                          <th>Status</th>
                          <th>Country</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRefineries.map((ref) => {
                          const isSelected = selectedNode && selectedNode.id === ref.id && selectedNode.nodeType === 'refinery';
                          const util = ((ref.current_output / ref.capacity) * 100).toFixed(1);
                          return (
                            <tr
                              key={ref.id}
                              className={isSelected ? 'selected-row' : ''}
                              onClick={() => setSelectedNode({ ...ref, nodeType: 'refinery' })}
                              onContextMenu={(e) => handleRowContextMenu(e, ref, 'refinery')}
                            >
                              <td style={{ color: '#4fd1c5', fontWeight: 'bold' }}>{ref.name}</td>
                              <td>{ref.raw_material}</td>
                              <td>{ref.production_output.split(',')[0]}</td>
                              <td>{ref.capacity.toLocaleString()} bpd</td>
                              <td>{ref.current_output.toLocaleString()} bpd</td>
                              <td>{util}%</td>
                              <td style={{ color: ref.maintenance ? '#f56565' : '#48bb78' }}>
                                {ref.maintenance ? 'MAINTENANCE' : 'ACTIVE'}
                              </td>
                              <td>{ref.country}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </>
                  )}

                  {bottomTab === 3 && (
                    <>
                      <thead>
                        <tr>
                          <th>Transmission Grid</th>
                          <th>Region Type</th>
                          <th>Load Capacity</th>
                          <th>Generation Output</th>
                          <th>Grid Stability</th>
                          <th>Transmission Rate</th>
                          <th>Country</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGrids.map((grid) => {
                          const isSelected = selectedNode && selectedNode.id === grid.id && selectedNode.nodeType === 'grid';
                          const pct = ((grid.generation / grid.capacity) * 100).toFixed(1);
                          return (
                            <tr
                              key={grid.id}
                              className={isSelected ? 'selected-row' : ''}
                              onClick={() => setSelectedNode({ ...grid, nodeType: 'grid' })}
                              onContextMenu={(e) => handleRowContextMenu(e, grid, 'grid')}
                            >
                              <td style={{ color: '#4fd1c5', fontWeight: 'bold' }}>{grid.name}</td>
                              <td>{grid.grid_type} ({grid.region})</td>
                              <td>{grid.capacity} MW</td>
                              <td>{grid.generation.toFixed(1)} MW</td>
                              <td>{pct}% load</td>
                              <td style={{ color: grid.status === 'Nominal' ? '#48bb78' : '#f56565' }}>{grid.status.toUpperCase()}</td>
                              <td>{grid.country}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </>
                  )}

                  {bottomTab === 4 && (
                    <>
                      <thead>
                        <tr>
                          <th>Reserve Complex</th>
                          <th>Fuel Class</th>
                          <th>Current Stock</th>
                          <th>Max Capacity</th>
                          <th>Capacity Ratio</th>
                          <th>Draw Limit / Day</th>
                          <th>Fill Rate Limit</th>
                          <th>Country</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReserves.map((res) => {
                          const isSelected = selectedNode && selectedNode.id === res.id && selectedNode.nodeType === 'reserve';
                          const pct = ((res.current_stock / res.max_capacity) * 100).toFixed(1);
                          return (
                            <tr
                              key={res.id}
                              className={isSelected ? 'selected-row' : ''}
                              onClick={() => setSelectedNode({ ...res, nodeType: 'reserve' })}
                              onContextMenu={(e) => handleRowContextMenu(e, res, 'reserve')}
                            >
                              <td style={{ color: '#4fd1c5', fontWeight: 'bold' }}>{res.name}</td>
                              <td>{res.energy_type.toUpperCase()}</td>
                              <td>{res.current_stock.toFixed(2)}M units</td>
                              <td>{res.max_capacity.toFixed(0)}M units</td>
                              <td>{pct}%</td>
                              <td>{res.draw_rate_limit}M / day</td>
                              <td>{res.fill_rate_limit}M / day</td>
                              <td>{res.country}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </>
                  )}
                </table>
              </Box>
            </Box>
          </Box>

          {/* RIGHT 30% REGION: SVG Polar Radar, Sparkline wave graph & Selected Monospace Info */}
          <Box sx={{ width: '29%', display: 'flex', flexDirection: 'column', bgcolor: '#070a10', overflow: 'hidden' }}>
            
            {/* SVG Polar Radar scope (38% height) */}
            <Box sx={{ height: '38%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 1, borderBottom: '1px solid #1a2333', position: 'relative' }}>
              <Typography variant="caption" sx={{ position: 'absolute', top: 4, left: 10, fontSize: '8px', color: '#718096', fontFamily: 'Courier New' }}>
                POLAR SATELLITE TARGET INDEX
              </Typography>
              
              <svg width="200" height="200" style={{ background: 'transparent' }}>
                {/* Polar radar concentric circles */}
                <circle cx="100" cy="100" r="30" fill="none" stroke="rgba(79, 209, 197, 0.15)" strokeWidth="1" />
                <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(79, 209, 197, 0.15)" strokeWidth="1" />
                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(79, 209, 197, 0.15)" strokeWidth="1" />
                
                {/* Radar sweep radar scan lines */}
                <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(79, 209, 197, 0.1)" strokeWidth="1" />
                <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(79, 209, 197, 0.1)" strokeWidth="1" />
                
                {/* Compass markers N, S, E, W */}
                <text x="96" y="16" fill="rgba(79, 209, 197, 0.5)" fontSize="8" fontFamily="monospace">N</text>
                <text x="96" y="196" fill="rgba(79, 209, 197, 0.5)" fontSize="8" fontFamily="monospace">S</text>
                <text x="188" y="103" fill="rgba(79, 209, 197, 0.5)" fontSize="8" fontFamily="monospace">E</text>
                <text x="2" y="103" fill="rgba(79, 209, 197, 0.5)" fontSize="8" fontFamily="monospace">W</text>
                
                {/* Sweep scan animation pointer */}
                <line x1="100" y1="100" x2="100" y2="10" stroke="rgba(79, 209, 197, 0.25)" strokeWidth="1.5" className="radar-sweep-line" />

                {/* Plot active ships coordinates */}
                {ships.map((ship) => {
                  // Map Lat/Lng coordinates to circles
                  const r = 40 + (Math.abs(ship.lat) % 40);
                  const theta = (ship.lng + 180) * (Math.PI / 180);
                  const x = 100 + r * Math.cos(theta);
                  const y = 100 + r * Math.sin(theta);
                  const isSelected = selectedNode && selectedNode.id === ship.id && selectedNode.nodeType === 'vessel';
                  
                  return (
                    <g key={ship.id}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 4 : 2}
                        fill={isSelected ? '#a855f7' : '#4fd1c5'}
                        style={{ filter: isSelected ? 'drop-shadow(0 0 4px #a855f7)' : 'none' }}
                      />
                      {isSelected && (
                        <>
                          {/* Selected crosshairs overlay */}
                          <circle cx={x} cy={y} r="10" fill="none" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="2,2" />
                          <line x1={x - 14} y1={y} x2={x + 14} y2={y} stroke="#a855f7" strokeWidth="0.5" />
                          <line x1={x} y1={y - 14} x2={x} y2={y + 14} stroke="#a855f7" strokeWidth="0.5" />
                          
                          {/* Label VO-52 styled text block */}
                          <rect x={x + 8} y={y - 15} width="65" height="24" fill="rgba(7, 10, 16, 0.85)" stroke="#a855f7" strokeWidth="0.5" rx="1" />
                          <text x={x + 12} y={y - 6} fill="#a855f7" fontSize="6" fontFamily="monospace" fontWeight="bold">TARGET INDEX</text>
                          <text x={x + 12} y={y + 3} fill="#e2e8f0" fontSize="7" fontFamily="monospace">{ship.name.slice(0, 10)}</text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
            </Box>

            {/* Sparkline wave Load Graph (20% height) */}
            <Box sx={{ height: '20%', display: 'flex', flexDirection: 'column', p: 1.5, borderBottom: '1px solid #1a2333', position: 'relative' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: '8px', color: '#718096', fontFamily: 'Courier New' }}>
                  LOAD ON TRANSMITTER AND RECEIVER
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '8px', color: '#4fd1c5', fontFamily: 'monospace' }}>
                  D W M
                </Typography>
              </Box>
              
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="100%" height="80%" style={{ overflow: 'visible' }}>
                  {/* Wave pattern sparkline load curves */}
                  <path
                    d={generateSparklinePath()}
                    fill="none"
                    stroke="#4fd1c5"
                    strokeWidth="1.2"
                    style={{ filter: 'drop-shadow(0 0 2px rgba(79, 209, 197, 0.4))' }}
                  />
                  
                  {/* Background grid line markers */}
                  <line x1="0" y1="20" x2="350" y2="20" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="350" y2="50" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
                  <line x1="0" y1="80" x2="350" y2="80" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
                </svg>
              </Box>
            </Box>

            {/* Monospace Detail information box (42% height) */}
            <Box sx={{ height: '42%', display: 'flex', flexDirection: 'column', p: 2, bgcolor: '#090e17' }}>
              <Typography variant="caption" sx={{ color: '#4fd1c5', fontWeight: 'bold', mb: 1, letterSpacing: '0.05em' }}>
                TELEMETRY NODE PARAMETERS
              </Typography>
              
              <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedNode ? (
                  <>
                    {/* Vessel Telemetry Info */}
                    {selectedNode.nodeType === 'vessel' && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography sx={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold', fontFamily: 'monospace' }}>
                          NAME: {selectedNode.name}
                        </Typography>
                        <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>
                          CLASS: TANKER TRANSPORT ({selectedNode.ship_type})
                        </Typography>
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>LATITUDE</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.lat.toFixed(4)}°</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>LONGITUDE</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.lng.toFixed(4)}°</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>CARGO CLASS</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.cargo_type}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>VOLUME</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.cargo_volume} bbl</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>ROUTING PLAN</Typography>
                            <Typography sx={{ fontSize: '9px', color: '#cbd5e1', fontFamily: 'monospace' }}>VIA: {selectedNode.destination}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>OWNER</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.owner}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>NATION STATE</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.country.toUpperCase()}</Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {/* Supplier Contract Info */}
                    {selectedNode.nodeType === 'supplier' && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography sx={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold', fontFamily: 'monospace' }}>
                          CONTRACTOR: {selectedNode.name}
                        </Typography>
                        <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>
                          RESOURCE CLASS: {selectedNode.resource_type}
                        </Typography>
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>VOLUME VALUE</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.volume}M / month</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>COST / UNIT</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#4fd1c5', fontFamily: 'monospace' }}>${selectedNode.cost_per_unit} USD</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>LEAD DELIVERY</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.delivery_days} days</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>RELIABILITY</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#48bb78', fontFamily: 'monospace' }}>{selectedNode.reliability_score}%</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>CONTRACT ORIGIN</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.country.toUpperCase()}</Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {/* Refinery Facility Info */}
                    {selectedNode.nodeType === 'refinery' && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography sx={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold', fontFamily: 'monospace' }}>
                          COMPLEX: {selectedNode.name}
                        </Typography>
                        <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>
                          CLASS: REFINING & CRACKING FACILITY
                        </Typography>
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>RAW FEEDSTOCK</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.raw_material}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>PRODUCTION CLASS</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.production_output.split(',')[0]}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>CAPACITY CEILING</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.capacity.toLocaleString()} barrels per day</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>ACTIVE DISPATCH RATE</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#4fd1c5', fontFamily: 'monospace' }}>{selectedNode.current_output.toLocaleString()} barrels per day</Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {/* Power Grid Info */}
                    {selectedNode.nodeType === 'grid' && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography sx={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold', fontFamily: 'monospace' }}>
                          NETWORK: {selectedNode.name}
                        </Typography>
                        <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>
                          REGION: {selectedNode.region}
                        </Typography>
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>GENERATION TYPE</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.grid_type}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>STABILITY RATING</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#48bb78', fontFamily: 'monospace' }}>{selectedNode.status.toUpperCase()}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>MAXIMUM LOAD RATING</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.capacity.toLocaleString()} MW</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>GENERATION DISPATCH</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.generation.toFixed(2)} MW</Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {/* Reserve Info */}
                    {selectedNode.nodeType === 'reserve' && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography sx={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 'bold', fontFamily: 'monospace' }}>
                          RESERVE: {selectedNode.name}
                        </Typography>
                        <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>
                          FUEL CLASS: {selectedNode.energy_type.toUpperCase()}
                        </Typography>
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>CURRENT LEVEL</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.current_stock.toFixed(2)}M</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>CEILING LIMIT</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>{selectedNode.max_capacity.toFixed(0)}M</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography sx={{ fontSize: '9px', color: '#718096', fontFamily: 'monospace' }}>EMERGENCY DRAW LIMIT / DAY</Typography>
                            <Typography sx={{ fontSize: '10px', color: '#f56565', fontFamily: 'monospace' }}>{selectedNode.draw_rate_limit}M units / day</Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </>
                ) : (
                  <Typography variant="caption" sx={{ color: '#4a5568', fontStyle: 'italic' }}>
                    Select a node in the telemetry database or GIS radar map to visualize core parameters.
                  </Typography>
                )}
              </Box>

              {/* Sourcing scenario control inside info bottom */}
              <Box sx={{ mt: 1 }}>
                {!isHormuzBlocked ? (
                  <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    color="error"
                    startIcon={simulationRunning ? <CircularProgress size={10} color="inherit" /> : <PlayArrowIcon sx={{ fontSize: '12px' }} />}
                    onClick={runHormuzSimulation}
                    disabled={simulationRunning}
                    sx={{ fontSize: '9px', py: 0.3, fontWeight: 'bold' }}
                  >
                    TRIGGER CHOKE POINT SIMULATION
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={resetSimulation}
                      sx={{ fontSize: '9px', py: 0.3, fontWeight: 'bold' }}
                    >
                      RESET SIM
                    </Button>
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<DownloadIcon sx={{ fontSize: '12px' }} />}
                      onClick={triggerReportDownload}
                      sx={{ fontSize: '9px', py: 0.3, fontWeight: 'bold' }}
                    >
                      EXPORT BRIEF
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Floating Context Popup Menu (VO-52 Mac Style context options) */}
        {showContextMenu && (
          <Paper
            sx={{
              position: 'fixed',
              top: contextMenuPos.y,
              left: contextMenuPos.x,
              zIndex: 100,
              bgcolor: '#0d131f',
              border: '1px solid #334155',
              borderRadius: '2px',
              py: 0.5,
              width: '130px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          >
            {[
              'Sky at a Glance',
              'Target Locking',
              'Signal Analysis',
              'Route Overrides',
              'Detach Node'
            ].map((option) => (
              <Box
                key={option}
                onClick={() => {
                  alert(`Invoking directive: [${option}] for target [${selectedNode ? selectedNode.name : 'Unknown'}]`);
                  setShowContextMenu(false);
                }}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  fontSize: '9px',
                  color: '#cbd5e1',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(79, 209, 197, 0.1)', color: '#4fd1c5' }
                }}
              >
                {option}
              </Box>
            ))}
          </Paper>
        )}
      </Box>
    </ThemeProvider>
  );
}
