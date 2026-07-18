import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Paper, Typography, FormControlLabel, Checkbox, Divider, Chip } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import HubIcon from '@mui/icons-material/Hub';

// Fix leaflet default icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom glowing HTML markers using L.divIcon
const createShipIcon = (type, status) => {
  const isRerouting = status.includes('Rerouting') || status === 'Rerouting';
  const color = isRerouting ? '#ecc94b' : status === 'Blocked' ? '#f56565' : '#4fd1c5';
  
  let emoji = '🚢';
  if (type.includes('Oil')) emoji = '🛢️';
  else if (type.includes('LNG') || type.includes('Gas')) emoji = '🔥';
  else if (type.includes('Coal')) emoji = '🪨';
  else if (type.includes('Hydrogen')) emoji = '🧪';

  return L.divIcon({
    html: `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        background: rgba(8, 11, 15, 0.85); 
        border: 2px solid ${color}; 
        border-radius: 50%; 
        width: 30px; 
        height: 30px; 
        box-shadow: 0 0 8px ${color};
      ">
        <span style="font-size: 13px;">${emoji}</span>
      </div>
    `,
    className: 'custom-ship-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const chokepoints = [
  { id: 'c_hormuz', name: 'Strait of Hormuz', pos: [26.58, 56.25], type: 'Oil/LNG' },
  { id: 'c_suez', name: 'Suez Canal', pos: [30.60, 32.50], type: 'Oil/LNG/Coal' },
  { id: 'c_malacca', name: 'Strait of Malacca', pos: [1.43, 102.77], type: 'Oil/LNG/Coal' },
  { id: 'c_bab', name: 'Bab-el-Mandeb', pos: [12.60, 43.33], type: 'Oil/LNG' }
];

export default function InteractiveMap({ ships, isHormuzBlocked, recentAlerts = [] }) {
  const [mapCenter] = useState([20.0, 45.0]); // Centered on Persian Gulf/Suez
  const [mapZoom] = useState(3);
  
  // Layer toggles
  const [showLanes, setShowLanes] = useState(true);
  const [showPipelines, setShowPipelines] = useState(true);
  const [showGrids, setShowGrids] = useState(true);
  const [showThreats, setShowThreats] = useState(true);

  // 1. Defined Shipping Lane Coordinates
  const shippingLanes = {
    "PG-Suez-Rotterdam": [
      [25.0, 54.5], [18.0, 58.0], [12.6, 43.3], [20.0, 38.0], [30.6, 32.5], 
      [34.0, 25.0], [37.0, 10.0], [36.0, -5.0], [45.0, -9.0], [51.9, 4.1]
    ],
    "PG-Malacca-Tokyo": [
      [25.0, 54.5], [12.0, 60.0], [5.0, 80.0], [1.4, 102.8], [10.0, 110.0], 
      [20.0, 120.0], [35.6, 139.8]
    ],
    "US-Atlantic-Europe": [
      [29.8, -94.0], [25.0, -80.0], [35.0, -45.0], [48.0, -10.0], [51.9, 4.1]
    ]
  };

  const capeReroute = [
    [25.0, 54.5], [15.0, 60.0], [5.0, 50.0], [-20.0, 35.0], [-34.3, 18.5], 
    [-15.0, -10.0], [5.0, -15.0], [20.0, -20.0], [35.0, -15.0], [48.0, -6.0], [51.9, 4.1]
  ];

  // 2. Defined Pipeline Coordinates (Nord Stream, Saudi East-West, Norway Gas, Keystone)
  const pipelines = {
    "Nord Stream 1 (Gas)": [
      [60.7, 28.7], [59.5, 25.0], [57.5, 20.0], [55.0, 15.0], [54.1, 13.6]
    ],
    "Saudi East-West Pipeline (Crude)": [
      [26.3, 49.7], [24.7, 46.7], [24.0, 38.0]
    ],
    "Norway-Germany Gas (Europipe)": [
      [59.2, 5.4], [56.5, 6.0], [53.6, 7.4]
    ],
    "Keystone Pipeline XL": [
      [52.6, -111.3], [49.0, -108.0], [40.0, -97.2], [35.9, -96.7]
    ]
  };

  // 3. Power Grid Trans-Border Cables
  const gridInterconnectors = {
    "UK-France Undersea Interconnector": [
      [51.1, 1.2], [50.9, 1.7]
    ],
    "West India Transmission Corridor": [
      [23.0, 72.0], [21.0, 72.5], [19.0, 72.8]
    ]
  };

  // 4. Pirate Threat Zone Polygon (Red Sea / Gulf of Aden)
  const pirateThreatPolygon = [
    [15.0, 41.0],
    [11.0, 43.0],
    [11.5, 52.0],
    [15.0, 52.0]
  ];

  return (
    <div style={{ height: '100%', width: '100%', minHeight: '400px', position: 'relative' }}>
      
      {/* Floating Layer Controls (Top Left) */}
      <Paper 
        className="glass-panel" 
        sx={{ 
          position: 'absolute', 
          top: 15, 
          left: 15, 
          zIndex: 1000, 
          p: 1.5, 
          background: 'rgba(8, 11, 15, 0.85)', 
          border: '1px solid rgba(79, 209, 197, 0.3)',
          width: '180px'
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#4fd1c5', display: 'block', mb: 1 }}>
          COMMAND LAYER SELECTOR
        </Typography>
        <Divider sx={{ mb: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
        <FormControlLabel
          control={<Checkbox size="small" checked={showLanes} onChange={(e) => setShowLanes(e.target.checked)} sx={{ color: 'rgba(79, 209, 197, 0.3)', '&.Mui-checked': { color: '#4fd1c5' } }} />}
          label={<span style={{ fontSize: '10px', color: '#cbd5e0' }}>Shipping Lanes</span>}
          sx={{ my: -0.5 }}
        />
        <FormControlLabel
          control={<Checkbox size="small" checked={showPipelines} onChange={(e) => setShowPipelines(e.target.checked)} sx={{ color: 'rgba(246, 173, 85, 0.3)', '&.Mui-checked': { color: '#f6ad55' } }} />}
          label={<span style={{ fontSize: '10px', color: '#cbd5e0' }}>Oil/Gas Pipelines</span>}
          sx={{ my: -0.5 }}
        />
        <FormControlLabel
          control={<Checkbox size="small" checked={showGrids} onChange={(e) => setShowGrids(e.target.checked)} sx={{ color: 'rgba(159, 122, 234, 0.3)', '&.Mui-checked': { color: '#9f7aea' } }} />}
          label={<span style={{ fontSize: '10px', color: '#cbd5e0' }}>Grid Interconnects</span>}
          sx={{ my: -0.5 }}
        />
        <FormControlLabel
          control={<Checkbox size="small" checked={showThreats} onChange={(e) => setShowThreats(e.target.checked)} sx={{ color: 'rgba(245, 101, 101, 0.3)', '&.Mui-checked': { color: '#f56565' } }} />}
          label={<span style={{ fontSize: '10px', color: '#cbd5e0' }}>Threat Alert Zones</span>}
          sx={{ my: -0.5 }}
        />
      </Paper>

      {/* Floating Geopolitical Live Ticker (Top Right) */}
      <Paper
        className="glass-panel"
        sx={{
          position: 'absolute',
          top: 15,
          right: 15,
          zIndex: 1000,
          p: 1.5,
          background: 'rgba(8, 11, 15, 0.85)',
          border: '1px solid rgba(79, 209, 197, 0.3)',
          width: '260px',
          maxHeight: '280px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <SecurityIcon sx={{ fontSize: '14px', color: '#4fd1c5' }} />
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#4fd1c5' }}>
            GEOPOLITICAL SITUATION SENSOR
          </Typography>
        </Box>
        <Divider sx={{ mb: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
        
        {/* Simple scrolling alerts ticker */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {recentAlerts.length === 0 ? (
            <Typography variant="caption" sx={{ color: '#718096', fontStyle: 'italic' }}>
              Monitoring wire feeds... No active risk alerts detected.
            </Typography>
          ) : (
            recentAlerts.map((alert) => (
              <Box key={alert.id} sx={{ p: 0.8, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Chip 
                    label={alert.severity.toUpperCase()} 
                    size="small" 
                    color={alert.severity === 'Critical' ? 'error' : alert.severity === 'High' ? 'warning' : 'info'}
                    sx={{ fontSize: '7px', height: '14px', px: -1 }} 
                  />
                  <Typography style={{ fontSize: '8px', color: '#718096' }}>
                    {alert.created_at.slice(11, 16)}
                  </Typography>
                </Box>
                <Typography style={{ fontSize: '9px', fontWeight: 'bold', color: '#cbd5e0', lineHeight: 1.2 }}>
                  {alert.title}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </Paper>

      {/* Leaflet Map rendering */}
      <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; CartoDB Dark Matter'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* 1. Draw Shipping Lanes */}
        {showLanes && (
          <>
            {/* Draw standard routes in glowing teal */}
            {Object.entries(shippingLanes).map(([name, path]) => (
              <Polyline
                key={name}
                positions={path}
                pathOptions={{ 
                  color: isHormuzBlocked && name.includes('PG-Suez') ? 'rgba(245, 101, 101, 0.3)' : '#4fd1c5', 
                  weight: 2, 
                  opacity: 0.5,
                  dashArray: '5, 10'
                }}
              >
                <Popup><span style={{ color: '#000' }}>Shipping Corridor: {name}</span></Popup>
              </Polyline>
            ))}

            {/* Draw active reroute path around Africa if Hormuz is blocked */}
            {isHormuzBlocked && (
              <Polyline
                positions={capeReroute}
                pathOptions={{ color: '#ecc94b', weight: 3, opacity: 0.8, dashArray: '6, 6' }}
              >
                <Popup><span style={{ color: '#000' }}>Active Cape detour line</span></Popup>
              </Polyline>
            )}
          </>
        )}

        {/* 2. Draw Oil/Gas Pipelines */}
        {showPipelines && (
          Object.entries(pipelines).map(([name, path]) => (
            <Polyline
              key={name}
              positions={path}
              pathOptions={{ 
                color: name.includes('Nord Stream') ? '#f56565' : '#f6ad55', // Nord stream damaged/shutdown is red, others orange
                weight: name.includes('Nord Stream') ? 1.5 : 2.5, 
                opacity: 0.7 
              }}
            >
              <Popup><span style={{ color: '#000' }}>Pipeline: {name}</span></Popup>
            </Polyline>
          ))
        )}

        {/* 3. Draw Grid Interconnectors */}
        {showGrids && (
          Object.entries(gridInterconnectors).map(([name, path]) => (
            <Polyline
              key={name}
              positions={path}
              pathOptions={{ color: '#9f7aea', weight: 2.5, opacity: 0.8, dashArray: '3, 6' }}
            >
              <Popup><span style={{ color: '#000' }}>Power Interconnector: {name}</span></Popup>
            </Polyline>
          ))
        )}

        {/* 4. Draw Threat Circles & Polygons */}
        {showThreats && (
          <>
            {/* Strait of Hormuz threat zone */}
            <Circle
              center={[26.58, 56.25]}
              radius={isHormuzBlocked ? 400000 : 150000} // radius expand under threat
              pathOptions={{
                color: isHormuzBlocked ? '#f56565' : '#ecc94b',
                fillColor: isHormuzBlocked ? '#f56565' : '#ecc94b',
                fillOpacity: isHormuzBlocked ? 0.3 : 0.1,
                weight: 1.5
              }}
            />
            {/* Red Sea piracy hazard polygon */}
            <Polygon
              positions={pirateThreatPolygon}
              pathOptions={{
                color: '#ecc94b',
                fillColor: '#ecc94b',
                fillOpacity: 0.08,
                weight: 1
              }}
            />
          </>
        )}

        {/* 5. Pulsing Chokepoint Target Reticles */}
        {chokepoints.map((cp) => {
          const isBlocked = isHormuzBlocked && cp.id === 'c_hormuz';
          return (
            <Circle
              key={cp.id}
              center={cp.pos}
              radius={80000}
              pathOptions={{
                color: isBlocked ? '#f56565' : '#48bb78',
                fillColor: isBlocked ? '#f56565' : '#48bb78',
                fillOpacity: 0.6,
                weight: 2
              }}
            >
              <Popup>
                <div style={{ color: '#000', fontSize: '11px' }}>
                  <strong>{cp.name}</strong><br/>
                  Security: {isBlocked ? 'RED ALERT: BLOCKED' : 'GREEN: STABLE'}<br/>
                  Monitored Energy: {cp.type}
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* 6. Ships Markers */}
        {ships.map((ship) => {
          let lat = ship.lat;
          let lng = ship.lng;
          let status = ship.status;

          // Rerouting logic mapping for visualization
          if (isHormuzBlocked && (ship.name === 'Neptune Glory' || ship.name === 'Qatargas Al Mayeda')) {
            if (ship.name === 'Neptune Glory') {
              lat = -34.3;
              lng = 18.5; 
              status = 'Rerouting (Cape detour)';
            } else if (ship.name === 'Qatargas Al Mayeda') {
              lat = 26.5;
              lng = 56.5; 
              status = 'Blocked';
            }
          }

          return (
            <Marker
              key={ship.id}
              position={[lat, lng]}
              icon={createShipIcon(ship.ship_type, status)}
            >
              <Popup>
                <div style={{ color: '#000', fontSize: '12px' }}>
                  <strong style={{ fontSize: '13px' }}>{ship.name}</strong><br/>
                  <strong>Type:</strong> {ship.ship_type}<br/>
                  <strong>Status:</strong> <span style={{ color: status.includes('Rerouting') ? '#ecc94b' : status === 'Blocked' ? '#f56565' : '#48bb78' }}>{status}</span><br/>
                  <strong>Cargo:</strong> {ship.cargo_type} ({ship.cargo_volume.toLocaleString()} units)<br/>
                  <strong>Destination:</strong> {ship.destination}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
