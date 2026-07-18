import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
        width: 32px; 
        height: 32px; 
        box-shadow: 0 0 10px ${color};
        animation: pulse 2s infinite;
      ">
        <span style="font-size: 14px;">${emoji}</span>
      </div>
    `,
    className: 'custom-ship-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const chokepoints = [
  { id: 'c_hormuz', name: 'Strait of Hormuz', pos: [26.58, 56.25], type: 'Oil/LNG' },
  { id: 'c_suez', name: 'Suez Canal', pos: [30.60, 32.50], type: 'Oil/LNG/Coal' },
  { id: 'c_malacca', name: 'Strait of Malacca', pos: [1.43, 102.77], type: 'Oil/LNG/Coal' },
  { id: 'c_bab', name: 'Bab-el-Mandeb', pos: [12.60, 43.33], type: 'Oil/LNG' }
];

export default function InteractiveMap({ ships, isHormuzBlocked }) {
  const [mapCenter] = useState([20.0, 50.0]); // Centered on Persian Gulf/Middle East
  const [mapZoom] = useState(3);

  // Cape of Good Hope reroute coordinates path helper
  // Persian Gulf (25, 55) -> Arabian Sea (15, 60) -> Cape of Good Hope (-34, 18) -> West Africa (5, -15) -> Rotterdam (51.9, 4.1)
  const capePath = [
    [25.0, 54.5],
    [15.0, 60.0],
    [5.0, 50.0],
    [-20.0, 35.0],
    [-34.3, 18.5], // Cape Point
    [-15.0, -10.0],
    [5.0, -15.0],
    [20.0, -20.0],
    [35.0, -15.0],
    [48.0, -6.0],
    [51.9, 4.1]   // Rotterdam
  ];

  const normalPath = [
    [25.0, 54.5],
    [15.0, 60.0],
    [12.6, 43.3], // Bab-el-Mandeb
    [22.0, 38.0], // Red Sea
    [30.6, 32.5], // Suez Canal
    [33.0, 25.0], // Mediterranean
    [37.0, 10.0],
    [36.0, -5.0], // Gibraltar
    [45.0, -9.0],
    [51.9, 4.1]   // Rotterdam
  ];

  return (
    <div style={{ height: '100%', width: '100%', minHeight: '380px', position: 'relative' }}>
      <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
        {/* Using CartoDB Dark Matter tile layer for premium look without API keys */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{{s}}.basemaps.cartocdn.com/dark_all/{{z}}/{{x}}/{{y}}{r}.png"
        />

        {/* Chokepoint circles */}
        {chokepoints.map((cp) => {
          const isBlocked = isHormuzBlocked && cp.id === 'c_hormuz';
          return (
            <Circle
              key={cp.id}
              center={cp.pos}
              radius={350000} // meters
              pathOptions={{
                color: isBlocked ? '#f56565' : '#48bb78',
                fillColor: isBlocked ? '#f56565' : '#48bb78',
                fillOpacity: 0.25,
                weight: isBlocked ? 3 : 1
              }}
            >
              <Popup>
                <div style={{ color: '#000' }}>
                  <strong>{cp.name}</strong><br/>
                  Security Status: {isBlocked ? 'RED ALERT: BLOCKED' : 'GREEN: OPERATIONAL'}<br/>
                  Primary Cargo: {cp.type}
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* Dynamic Reroute Polyline */}
        {isHormuzBlocked && (
          <>
            <Polyline
              positions={capePath}
              pathOptions={{ color: '#ecc94b', weight: 4, dashArray: '8, 8', opacity: 0.8 }}
            />
            <Polyline
              positions={normalPath}
              pathOptions={{ color: '#f56565', weight: 3, opacity: 0.4 }}
            />
          </>
        )}

        {/* Ships Markers */}
        {ships.map((ship) => {
          // Adjust ship positions if Hormuz blocked
          let lat = ship.lat;
          let lng = ship.lng;
          let status = ship.status;

          if (isHormuzBlocked && (ship.name === 'Neptune Glory' || ship.name === 'Qatargas Al Mayeda')) {
            // Reposition ships to detour points on the map for visualization
            if (ship.name === 'Neptune Glory') {
              lat = -34.3;
              lng = 18.5; // at Cape of Good Hope
              status = 'Rerouting (Cape detour)';
            } else if (ship.name === 'Qatargas Al Mayeda') {
              lat = 26.5;
              lng = 56.5; // stuck outside Hormuz
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
                  <strong style={{ fontSize: '14px' }}>{ship.name}</strong><br/>
                  <strong>Type:</strong> {ship.ship_type}<br/>
                  <strong>Status:</strong> <span style={{ color: status.includes('Rerouting') ? '#c084fc' : status === 'Blocked' ? '#f87171' : '#22c55e' }}>{status}</span><br/>
                  <strong>Cargo:</strong> {ship.cargo_type} ({ship.cargo_volume.toLocaleString()} units)<br/>
                  <strong>Speed:</strong> {ship.speed} knots<br/>
                  <strong>Destination:</strong> {ship.destination}<br/>
                  <strong>Country Flag:</strong> {ship.country}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
