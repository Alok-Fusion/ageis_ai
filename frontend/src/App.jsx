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
      <Box sx={{ background: '#080b0f', minHeight: '100vh', py: 2 }}>
        <Container maxWidth="xl">
          {/* Executive Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, borderBottom: '1px solid rgba(79, 209, 197, 0.2)', pb: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: '800', color: '#4fd1c5', display: 'flex', alignItems: 'center', gap: 1 }}>
                AEGIS AI
                <Typography variant="caption" sx={{ color: '#ecc94b', border: '1px solid #ecc94b', px: 1, borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' }}>
                  CONFIDENTIAL // NATIONAL ENERGY SECURITY
                </Typography>
              </Typography>
              <Typography variant="subtitle2" sx={{ color: '#718096', fontSize: '11px', mt: 0.5 }}>
                Autonomous Energy Geopolitical Intelligence & Supply-chain Operating System
              </Typography>
            </Box>

            {/* Quick KPI stats */}
            <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <Box sx={{ textAlign: 'right', borderRight: '1px solid rgba(255,255,255,0.1)', pr: 3 }}>
                <Typography variant="caption" sx={{ color: '#718096', fontSize: '10px' }}>NEXT FEED SCAN</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4fd1c5', fontFamily: 'Courier New, monospace' }}>
                  {formatTime(nextScanSeconds)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: '#718096', fontSize: '10px' }}>GLOBAL RISK INDEX</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: isHormuzBlocked ? '#f56565' : '#4fd1c5' }}>
                  {riskIndex} / 100
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: '#718096', fontSize: '10px' }}>ACTIVE TANKERS</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>
                  {ships.length}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: '#718096', fontSize: '10px' }}>SYSTEM STATE</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#48bb78', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CheckCircleIcon sx={{ fontSize: '16px' }} /> SECURE
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Crisis Alert Banner */}
          {isHormuzBlocked && (
            <Alert 
              severity="error" 
              icon={<WarningIcon />}
              sx={{ 
                mb: 3, 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid #ef4444', 
                color: '#fca5a5',
                '& .MuiAlert-icon': { color: '#ef4444' }
              }}
            >
              <strong>CRISIS DETECTED:</strong> Iran closes the Strait of Hormuz. All vessel traffic is blocked. Price shock algorithms and detours triggered.
            </Alert>
          )}

          {/* Core Grid Layout */}
          <Grid container spacing={3}>
            {/* LEFT COLUMN: Map & Agent Flow Visualizer (xs=12, md=8 - 66% width) */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>
                
                {/* 1. Main Viewport Panel: Map / Graph / Charts */}
                <Grid item xs={12}>
                  <Paper className="glass-panel" sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '620px' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'rgba(79, 209, 197, 0.15)', mb: 2 }}>
                      <Tabs 
                        value={activeTab} 
                        onChange={(e, val) => setActiveTab(val)}
                        textColor="primary"
                        indicatorColor="primary"
                        variant="fullWidth"
                      >
                        <Tab icon={<MapIcon />} label="GIS Situation Map" sx={{ fontSize: '11px', fontWeight: 'bold' }} />
                        <Tab icon={<HubIcon />} label="Knowledge Graph Explorer" sx={{ fontSize: '11px', fontWeight: 'bold' }} />
                        <Tab icon={<ShowChartIcon />} label="Market Prices & Forecasting" sx={{ fontSize: '11px', fontWeight: 'bold' }} />
                      </Tabs>
                    </Box>

                    <Box sx={{ flexGrow: 1, height: '480px' }}>
                      {activeTab === 0 && (
                        <InteractiveMap ships={ships} isHormuzBlocked={isHormuzBlocked} recentAlerts={recentAlerts} />
                      )}
                      {activeTab === 1 && (
                        <GraphExplorer isHormuzBlocked={isHormuzBlocked} />
                      )}
                      {activeTab === 2 && (
                        <PriceCharts isHormuzBlocked={isHormuzBlocked} />
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* 2. 15-Agent Orchestrator Graph & Logs Panel */}
                <Grid item xs={12}>
                  <Paper className="glass-panel" sx={{ p: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#cbd5e0', mb: 2 }}>
                      15-AGENT INTER-COMMUNICATION WORKFLOW ORCHESTRATION
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} lg={7}>
                        <AgentFlow activeAgentIndex={activeAgentIndex} />
                      </Grid>
                      <Grid item xs={12} lg={5}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#4fd1c5', display: 'block', mb: 1 }}>
                          ORCHESTRATOR LIVE LOG STREAM
                        </Typography>
                        <Box sx={{ height: '350px', overflowY: 'auto', background: '#090d13', border: '1px solid #1a2436', p: 1.5, borderRadius: '8px' }}>
                          {agentLogs.length === 0 ? (
                            <Typography variant="caption" sx={{ color: '#4a5568', fontStyle: 'italic' }}>
                              Initialize a simulation scenario to stream agent telemetry.
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
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>

            {/* RIGHT COLUMN: Crisis Control, Intelligence Wire, Chat & Sourcing (xs=12, md=4 - 33% width) */}
            <Grid item xs={12} md={4}>
              <Grid container spacing={3}>
                
                {/* 1. Control & Sourcing Panels */}
                <Grid item xs={12}>
                  <Paper className="glass-panel" sx={{ p: 2.5, border: isHormuzBlocked ? '1px solid #ef4444' : '1px solid rgba(79, 209, 197, 0.15)' }}>
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
                        {simulationRunning ? 'ORCHESTRATING AGENTS...' : 'Simulate: Strait of Hormuz Blockage'}
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

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, background: '#090d13', border: '1px solid #1a2436', p: 1.2, borderRadius: '8px' }}>
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
                          '&:hover': { background: 'rgba(79, 209, 197, 0.1)', borderColor: '#4fd1c5' }
                        }}
                      >
                        {forcingScan ? <CircularProgress size={10} color="inherit" /> : 'FORCE SCAN'}
                      </Button>
                    </Box>
                  </Paper>
                </Grid>

                {/* 2. Geopolitical Intelligence Wire (Dynamic Alerts) */}
                <Grid item xs={12}>
                  <Paper className="glass-panel" sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '400px' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#4fd1c5', mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SecurityIcon sx={{ fontSize: '16px' }} /> GEOPOLITICAL INTELLIGENCE WIRE
                    </Typography>
                    
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {recentAlerts.length === 0 ? (
                        <Typography variant="caption" sx={{ color: '#718096', fontStyle: 'italic', textAlign: 'center', mt: 4, display: 'block' }}>
                          Scanning global wire feeds... Waiting for RSS updates.
                        </Typography>
                      ) : (
                        recentAlerts.map((alert) => (
                          <Box 
                            key={alert.id} 
                            sx={{ 
                              p: 1.5, 
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
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#fff', fontSize: '12px', mb: 0.5 }}>
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
                                Confidence: <strong>{alert.confidence}%</strong>
                              </Typography>
                            </Box>
                          </Box>
                        ))
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* 3. Executive AI Chat and Recommendations */}
                <Grid item xs={12}>
                  <Paper className="glass-panel" sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '480px' }}>
                    <Box sx={{ flexGrow: 1, minHeight: '220px', overflowY: 'auto' }}>
                      <ExecutiveChat />
                    </Box>

                    {isHormuzBlocked && recommendations.length > 0 && (
                      <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(79, 209, 197, 0.15)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#ecc94b', display: 'block', mb: 1 }}>
                          DIRECTIVES & RECOMMENDATIONS
                        </Typography>
                        <Box sx={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {recommendations.map((rec, idx) => (
                            <Box key={idx} sx={{ p: 1, border: '1px solid rgba(236, 201, 75, 0.2)', background: 'rgba(236, 201, 75, 0.03)', borderRadius: '6px' }}>
                              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#ecc94b', display: 'block', fontSize: '10px' }}>
                                {rec.action}
                              </Typography>
                              <Typography style={{ fontSize: '9px', color: '#a0aec0', marginTop: '1px' }}>
                                {rec.details}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Grid>

              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
