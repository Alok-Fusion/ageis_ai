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
  const [activeTab, setActiveTab] = useState(0); // 0 = Map background overlays, 1 = Graph, 2 = Price curves, 3 = Pure map
  const [isHormuzBlocked, setIsHormuzBlocked] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [activeAgentIndex, setActiveAgentIndex] = useState(-1);
  const [agentLogs, setAgentLogs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [sprReleases, setSprReleases] = useState([]);
  const [riskIndex, setRiskIndex] = useState(52.4);
  const [recentAlerts, setRecentAlerts] = useState([]);

  const [nextScanSeconds, setNextScanSeconds] = useState(1800); // 30 minutes countdown
  const [forcingScan, setForcingScan] = useState(false);

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

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
      // Backend automatically checks RSS feeds on endpoint invoke
      await fetchDashboardData();
      setNextScanSeconds(1800);
    } catch (err) {
      console.error("Error running force scan:", err);
    } finally {
      setForcingScan(false);
    }
  };

  // Simulates a news event parsing through the 15-Agent pipeline
  const runHormuzSimulation = async () => {
    if (simulationRunning) return;
    
    setSimulationRunning(true);
    setActiveAgentIndex(0);
    setAgentLogs(["News Agent: Ingesting global press releases..."]);
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/simulation/analyze-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: "Iran closes Strait of Hormuz. US fleet on alert." })
      });
      const data = await response.json();

      // Walk through the agents with animation delays
      const steps = data.steps;
      for (let i = 0; i < steps.length; i++) {
        setActiveAgentIndex(i);
        setAgentLogs(prev => [...prev, `${steps[i].agent}: ${steps[i].logs}`]);
        // Delay for high-fidelity visual animation
        await new Promise(r => setTimeout(r, 600));
      }

      // Update state post-simulation
      setIsHormuzBlocked(true);
      setRiskIndex(data.unified_risk_score);
      setRecommendations(data.recommendations);
      setPrices(data.market_prices || {});
      
      // Grab spr releases from the backend simulation trigger
      const rawSim = await fetch('http://localhost:8000/api/v1/simulation/simulate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_key: "hormuz_blockage" })
      });
      const simData = await rawSim.json();
      setSprReleases(simData.spr_releases || []);

    } catch (err) {
      console.error(err);
      setAgentLogs(prev => [...prev, "Simulation core error. Aborting."]);
    } finally {
      setSimulationRunning(false);
      setActiveAgentIndex(-1);
    }
  };

  const resetSimulation = () => {
    setIsHormuzBlocked(false);
    setRecommendations([]);
    setSprReleases([]);
    setAgentLogs([]);
    fetchDashboardData();
  };

  const triggerReportDownload = () => {
    window.open('http://localhost:8000/api/v1/report/download-report?scenario_key=hormuz_blockage', '_blank');
  };

  // Format countdown seconds: mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <ThemeProvider theme={theme}>
      {/* Immersive CRT effects and corner brackets */}
      <div className="scanline-beam" />
      <div className="corner-bracket corner-top-left" />
      <div className="corner-bracket corner-top-right" />
      <div className="corner-bracket corner-bottom-left" />
      <div className="corner-bracket corner-bottom-right" />

      {/* Global Full-Screen GIS Map Background */}
      <Box className="fullscreen-map-container">
        <InteractiveMap ships={ships} isHormuzBlocked={isHormuzBlocked} recentAlerts={recentAlerts} />
      </Box>

      {/* Floating Tactical Header Panel */}
      {activeTab !== 3 && (
        <Paper 
          className="floating-overlay-card"
          sx={{ 
            position: 'fixed', 
            top: 15, 
            left: '2%', 
            width: '96%', 
            height: '75px',
            zIndex: 10, 
            p: 1.8,
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: '900', color: '#4fd1c5', display: 'flex', alignItems: 'center', gap: 1, tracking: '0.1em' }}>
              AEGIS AI
              <Typography variant="caption" sx={{ color: '#ecc94b', border: '1px solid #ecc94b', px: 1, borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' }}>
                CONFIDENTIAL // NATIONAL ENERGY SECURITY
              </Typography>
            </Typography>
            <Typography variant="subtitle2" sx={{ color: '#718096', fontSize: '10px', mt: 0.2 }}>
              Autonomous Energy Geopolitical Intelligence & Supply-chain Operating System
            </Typography>
          </Box>

          {/* Quick KPI stats */}
          <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Box sx={{ textAlign: 'right', borderRight: '1px solid rgba(255,255,255,0.1)', pr: 3 }}>
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '9px' }}>NEXT FEED SCAN</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#4fd1c5', fontFamily: 'Courier New, monospace' }}>
                {formatTime(nextScanSeconds)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', borderRight: '1px solid rgba(255,255,255,0.1)', pr: 3 }}>
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '9px' }}>GLOBAL RISK INDEX</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: isHormuzBlocked ? '#f56565' : '#4fd1c5' }}>
                {riskIndex} / 100
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', borderRight: '1px solid rgba(255,255,255,0.1)', pr: 3 }}>
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '9px' }}>ACTIVE TANKERS</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#fff' }}>
                {ships.length}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: '#718096', fontSize: '9px' }}>SYSTEM STATE</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#48bb78', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleIcon sx={{ fontSize: '14px' }} /> SECURE
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Main Crisis Alert Banner Floating Overlay */}
      {isHormuzBlocked && activeTab !== 3 && (
        <Alert 
          severity="error" 
          icon={<WarningIcon />}
          sx={{ 
            position: 'fixed',
            top: 105,
            left: '2%',
            width: '96%',
            zIndex: 11,
            background: 'rgba(239, 68, 68, 0.18)', 
            border: '1px solid #ef4444', 
            color: '#fca5a5',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px 0 rgba(239, 68, 68, 0.2)',
            '& .MuiAlert-icon': { color: '#ef4444' }
          }}
        >
          <strong>CRISIS DETECTED:</strong> Iran closes the Strait of Hormuz. All Middle-East vessel traffic is blocked. Real-time pricing shocks and detours updated.
        </Alert>
      )}

      {/* Floating Left Panel: Crisis Initiator & Agent Workflow logs */}
      {showLeftPanel && activeTab !== 3 && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: isHormuzBlocked ? 170 : 105, 
            left: '2%', 
            width: '27%', 
            height: isHormuzBlocked ? 'calc(100vh - 250px)' : 'calc(100vh - 185px)', 
            zIndex: 10, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2,
            overflowY: 'auto',
            pr: 1
          }}
        >
          {/* 1. System Scenario Control */}
          <Paper className="floating-overlay-card" sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#cbd5e0', mb: 2 }}>
              SYSTEM SCENARIO CONTROL
            </Typography>

            {!isHormuzBlocked ? (
              <Button
                fullWidth
                variant="contained"
                color="error"
                startIcon={simulationRunning ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                onClick={runHormuzSimulation}
                disabled={simulationRunning}
                sx={{
                  fontWeight: 'bold',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
                  '&:hover': { background: '#dc2626' }
                }}
              >
                {simulationRunning ? 'ORCHESTRATING AGENTS...' : 'Simulate: Hormuz Blockage'}
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  onClick={resetSimulation}
                  sx={{ fontWeight: 'bold' }}
                >
                  Clear Simulation
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<DownloadIcon />}
                  onClick={triggerReportDownload}
                  sx={{ fontWeight: 'bold' }}
                >
                  Export Brief
                </Button>
              </Box>
            )}

            <Box sx={{ display: 'flex', justify_content: 'space-between', alignItems: 'center', mt: 2, background: '#090d13', border: '1px solid #1a2436', p: 1.2, borderRadius: '8px' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#718096', display: 'block', fontSize: '9px' }}>RSS FEED COUNTDOWN</Typography>
                <Typography variant="body2" sx={{ color: '#4fd1c5', fontWeight: 'bold', fontFamily: 'Courier New, monospace' }}>
                  {formatTime(nextScanSeconds)}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                disabled={forcingScan}
                onClick={triggerForceScan}
                sx={{
                  fontSize: '10px',
                  color: '#4fd1c5',
                  borderColor: '#4fd1c5',
                  py: 0.3,
                  ml: 2,
                  '&:hover': { background: 'rgba(79, 209, 197, 0.1)', borderColor: '#4fd1c5' }
                }}
              >
                {forcingScan ? <CircularProgress size={10} color="inherit" /> : 'FORCE SCAN'}
              </Button>
            </Box>
          </Paper>

          {/* 2. 15-Agent Workflow Status Log */}
          <Paper className="floating-overlay-card" sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', height: '240px' }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#4fd1c5', display: 'block', mb: 1 }}>
              ORCHESTRATOR LIVE LOG STREAM
            </Typography>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', background: '#090d13', border: '1px solid #1a2436', p: 1.5, borderRadius: '8px' }}>
              {agentLogs.length === 0 ? (
                <Typography variant="caption" sx={{ color: '#4a5568', fontStyle: 'italic' }}>
                  Initialize simulation scenario to stream agent news validation logs.
                </Typography>
              ) : (
                agentLogs.map((log, index) => {
                  const parts = log.split(':');
                  return (
                    <Typography key={index} sx={{ fontSize: '10px', fontFamily: 'Courier New, monospace', mb: 1, color: '#4fd1c5' }}>
                      <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{parts[0]}</span>: {parts[1]}
                    </Typography>
                  );
                })
              )}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Floating Right Panel: AI Advisor, Intelligence Wire, Chat & Sourcing */}
      {showRightPanel && activeTab !== 3 && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: isHormuzBlocked ? 170 : 105, 
            right: '2%', 
            width: '27%', 
            height: isHormuzBlocked ? 'calc(100vh - 250px)' : 'calc(100vh - 185px)', 
            zIndex: 10, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2,
            overflowY: 'auto',
            pl: 1
          }}
        >
          {/* 1. Geopolitical Intelligence Wire */}
          <Paper className="floating-overlay-card" sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '280px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#4fd1c5', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <SecurityIcon sx={{ fontSize: '16px' }} /> GEOPOLITICAL INTELLIGENCE WIRE
            </Typography>
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {recentAlerts.length === 0 ? (
                <Typography variant="caption" sx={{ color: '#718096', fontStyle: 'italic', textAlign: 'center', mt: 4, display: 'block' }}>
                  Ingesting global wires... Waiting for RSS feeds.
                </Typography>
              ) : (
                recentAlerts.map((alert) => (
                  <Box 
                    key={alert.id} 
                    sx={{ 
                      p: 1.2, 
                      border: '1px solid', 
                      borderColor: alert.severity === 'Critical' ? 'rgba(245, 101, 101, 0.3)' : 'rgba(79, 209, 197, 0.15)',
                      background: alert.severity === 'Critical' ? 'rgba(245, 101, 101, 0.05)' : 'rgba(13, 20, 30, 0.4)',
                      borderRadius: '8px'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip 
                          label={alert.severity.toUpperCase()} 
                          size="small" 
                          color={alert.severity === 'Critical' ? 'error' : alert.severity === 'High' ? 'warning' : 'info'}
                          sx={{ fontSize: '8px', height: '16px', fontWeight: 'bold' }} 
                        />
                        <Chip 
                          label={alert.event_type} 
                          size="small" 
                          sx={{ fontSize: '8px', height: '16px', background: '#1a202c', color: '#cbd5e0' }} 
                        />
                      </Box>
                      <Typography style={{ fontSize: '9px', color: '#718096' }}>
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#fff', fontSize: '11px', mb: 0.5 }}>
                      {alert.title}
                    </Typography>
                    <Typography style={{ fontSize: '10px', color: '#a0aec0', lineHeight: 1.4, marginBottom: '6px' }}>
                      {alert.content}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography style={{ fontSize: '9px', color: '#4fd1c5' }}>
                        Loc: <strong>{alert.location} ({alert.country})</strong>
                      </Typography>
                      <Typography style={{ fontSize: '9px', color: '#718096' }}>
                        Conf: <strong>{alert.confidence}%</strong>
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Paper>

          {/* 2. AI Executive Copilot & Recommendations */}
          <Paper className="floating-overlay-card" sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: '260px' }}>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <ExecutiveChat />
            </Box>

            {isHormuzBlocked && recommendations.length > 0 && (
              <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid rgba(79, 209, 197, 0.15)' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#ecc94b', display: 'block', mb: 0.5 }}>
                  RECOMMENDATIONS
                </Typography>
                <Box sx={{ maxHeight: '90px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  {recommendations.map((rec, idx) => (
                    <Box key={idx} sx={{ p: 0.8, border: '1px solid rgba(236, 201, 75, 0.2)', background: 'rgba(236, 201, 75, 0.03)', borderRadius: '6px' }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#ecc94b', display: 'block', fontSize: '9px' }}>
                        {rec.action}
                      </Typography>
                      <Typography style={{ fontSize: '9px', color: '#a0aec0' }}>
                        {rec.details}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* Floating Center Overlay Windows (For Knowledge Graph / Charts View) */}
      {activeTab === 1 && (
        <Paper 
          className="floating-overlay-card" 
          sx={{ 
            position: 'fixed', 
            top: isHormuzBlocked ? 170 : 105, 
            left: '30%', 
            width: '40%', 
            height: isHormuzBlocked ? 'calc(100vh - 250px)' : 'calc(100vh - 185px)', 
            zIndex: 10, 
            p: 2.5, 
            display: 'flex', 
            flexDirection: 'column' 
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#4fd1c5', mb: 1.5 }}>
            GEOPOLITICAL KNOWLEDGE RELATION GRAPH
          </Typography>
          <Box sx={{ flexGrow: 1, height: '90%' }}>
            <GraphExplorer isHormuzBlocked={isHormuzBlocked} />
          </Box>
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper 
          className="floating-overlay-card" 
          sx={{ 
            position: 'fixed', 
            top: isHormuzBlocked ? 170 : 105, 
            left: '30%', 
            width: '40%', 
            height: isHormuzBlocked ? 'calc(100vh - 250px)' : 'calc(100vh - 185px)', 
            zIndex: 10, 
            p: 2.5, 
            display: 'flex', 
            flexDirection: 'column',
            overflowY: 'auto' 
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#4fd1c5', mb: 1.5 }}>
            COMMODITY PRICING & SHOCK FORECASTS
          </Typography>
          <Box sx={{ flexGrow: 1 }}>
            <PriceCharts isHormuzBlocked={isHormuzBlocked} />
          </Box>
        </Paper>
      )}

      {/* Bottom Navigation command dock */}
      <Paper
        className="floating-overlay-card"
        sx={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 15,
          p: 0.8,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          height: '45px',
          background: 'rgba(8, 12, 20, 0.9) !important'
        }}
      >
        <Button 
          size="small" 
          onClick={() => setActiveTab(0)} 
          sx={{ 
            fontSize: '9px', 
            color: activeTab === 0 ? '#4fd1c5' : '#718096', 
            fontWeight: 'bold',
            border: activeTab === 0 ? '1px solid #4fd1c5' : '1px solid transparent',
            background: activeTab === 0 ? 'rgba(79, 209, 197, 0.15)' : 'transparent',
            fontFamily: 'Courier New, monospace'
          }}
        >
          THE MAP
        </Button>
        <Button 
          size="small" 
          onClick={() => setActiveTab(1)} 
          sx={{ 
            fontSize: '9px', 
            color: activeTab === 1 ? '#4fd1c5' : '#718096', 
            fontWeight: 'bold',
            border: activeTab === 1 ? '1px solid #4fd1c5' : '1px solid transparent',
            background: activeTab === 1 ? 'rgba(79, 209, 197, 0.15)' : 'transparent',
            fontFamily: 'Courier New, monospace'
          }}
        >
          THE GRAPH
        </Button>
        <Button 
          size="small" 
          onClick={() => setActiveTab(2)} 
          sx={{ 
            fontSize: '9px', 
            color: activeTab === 2 ? '#4fd1c5' : '#718096', 
            fontWeight: 'bold',
            border: activeTab === 2 ? '1px solid #4fd1c5' : '1px solid transparent',
            background: activeTab === 2 ? 'rgba(79, 209, 197, 0.15)' : 'transparent',
            fontFamily: 'Courier New, monospace'
          }}
        >
          THE CHARTS
        </Button>
        <Button 
          size="small" 
          onClick={() => setActiveTab(3)} 
          sx={{ 
            fontSize: '9px', 
            color: activeTab === 3 ? '#ecc94b' : '#718096', 
            fontWeight: 'bold',
            border: activeTab === 3 ? '1px solid #ecc94b' : '1px solid transparent',
            background: activeTab === 3 ? 'rgba(236, 201, 75, 0.15)' : 'transparent',
            fontFamily: 'Courier New, monospace'
          }}
        >
          PURE MAP
        </Button>
        
        <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <Button 
          size="small" 
          onClick={() => setShowLeftPanel(!showLeftPanel)} 
          disabled={activeTab === 3}
          sx={{ 
            fontSize: '9px', 
            color: showLeftPanel && activeTab !== 3 ? '#4fd1c5' : '#718096',
            fontWeight: 'bold',
            fontFamily: 'Courier New, monospace'
          }}
        >
          {showLeftPanel ? "HIDE LEFT" : "SHOW LEFT"}
        </Button>
        <Button 
          size="small" 
          onClick={() => setShowRightPanel(!showRightPanel)} 
          disabled={activeTab === 3}
          sx={{ 
            fontSize: '9px', 
            color: showRightPanel && activeTab !== 3 ? '#4fd1c5' : '#718096',
            fontWeight: 'bold',
            fontFamily: 'Courier New, monospace'
          }}
        >
          {showRightPanel ? "HIDE RIGHT" : "SHOW RIGHT"}
        </Button>
      </Paper>
    </ThemeProvider>
  );
}
