import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

export default function GraphExplorer({ isHormuzBlocked }) {
  const nodes = useMemo(() => {
    const defaultNodes = [
      {
        id: 'g_event',
        position: { x: 50, y: 150 },
        data: { label: (
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 'bold' }}>EVENT</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Hormuz Closure</div>
            <div style={{ fontSize: '9px', color: '#a0aec0' }}>Severity: Critical</div>
          </div>
        )},
        style: { background: 'rgba(239, 68, 68, 0.15)', border: '1px dashed #ef4444', width: 140 }
      },
      {
        id: 'g_choke',
        position: { x: 230, y: 150 },
        data: { label: (
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: '10px', color: '#ecc94b', fontWeight: 'bold' }}>CHOKEPOINT</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Strait of Hormuz</div>
            <div style={{ fontSize: '9px', color: isHormuzBlocked ? '#f87171' : '#48bb78' }}>
              {isHormuzBlocked ? 'Status: BLOCKED' : 'Status: OPEN'}
            </div>
          </div>
        )},
        style: { 
          background: isHormuzBlocked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(13, 20, 30, 0.6)', 
          border: isHormuzBlocked ? '2px solid #ef4444' : '1px solid #48bb78', 
          width: 140 
        }
      },
      {
        id: 'g_ship_oil',
        position: { x: 420, y: 80 },
        data: { label: (
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: '10px', color: '#4fd1c5', fontWeight: 'bold' }}>TANKER</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Neptune Glory</div>
            <div style={{ fontSize: '9px', color: '#a0aec0' }}>Cargo: 2.0M bbl Crude</div>
          </div>
        )},
        style: { background: 'rgba(13, 20, 30, 0.6)', border: isHormuzBlocked ? '1px solid #ecc94b' : '1px solid #4fd1c5', width: 140 }
      },
      {
        id: 'g_ship_lng',
        position: { x: 420, y: 220 },
        data: { label: (
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 'bold' }}>LNG CARRIER</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Qatargas Al Mayeda</div>
            <div style={{ fontSize: '9px', color: '#a0aec0' }}>Cargo: 266k m³ LNG</div>
          </div>
        )},
        style: { background: 'rgba(13, 20, 30, 0.6)', border: isHormuzBlocked ? '1px solid #ef4444' : '1px solid #a78bfa', width: 140 }
      },
      {
        id: 'g_refinery',
        position: { x: 610, y: 80 },
        data: { label: (
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: '10px', color: '#f6ad55', fontWeight: 'bold' }}>REFINERY</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Rotterdam Pernis</div>
            <div style={{ fontSize: '9px', color: isHormuzBlocked ? '#f87171' : '#48bb78' }}>
              {isHormuzBlocked ? 'Output: -25% (run cut)' : 'Output: 395k bpd'}
            </div>
          </div>
        )},
        style: { 
          background: 'rgba(13, 20, 30, 0.6)', 
          border: isHormuzBlocked ? '1px solid #ef4444' : '1px solid #f6ad55', 
          width: 140 
        }
      },
      {
        id: 'g_spr',
        position: { x: 610, y: 220 },
        data: { label: (
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: '10px', color: '#48bb78', fontWeight: 'bold' }}>STRATEGIC RESERVE</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>US SPR Reserve</div>
            <div style={{ fontSize: '9px', color: '#a0aec0' }}>Capacity: 714M bbl</div>
          </div>
        )},
        style: { background: 'rgba(13, 20, 30, 0.6)', border: '1px solid #48bb78', width: 140 }
      }
    ];
    return defaultNodes;
  }, [isHormuzBlocked]);

  const edges = useMemo(() => {
    const list = [
      { id: 'eg-1', source: 'g_choke', target: 'g_ship_oil', label: 'affects', animated: isHormuzBlocked, style: { stroke: isHormuzBlocked ? '#ecc94b' : '#718096' } },
      { id: 'eg-2', source: 'g_choke', target: 'g_ship_lng', label: 'blocks', animated: isHormuzBlocked, style: { stroke: isHormuzBlocked ? '#ef4444' : '#718096' } },
      { id: 'eg-3', source: 'g_ship_oil', target: 'g_refinery', label: 'supplies', style: { stroke: '#718096' } },
      { id: 'eg-4', source: 'g_spr', target: 'g_refinery', label: 'buffers', animated: isHormuzBlocked, style: { stroke: isHormuzBlocked ? '#48bb78' : '#718096', strokeDasharray: isHormuzBlocked ? '5,5' : 'none' } }
    ];
    
    if (isHormuzBlocked) {
      list.push({ id: 'eg-5', source: 'g_event', target: 'g_choke', label: 'blocked by', animated: true, style: { stroke: '#ef4444' } });
    }
    
    return list;
  }, [isHormuzBlocked]);

  return (
    <div style={{ height: '350px', width: '100%', border: '1px solid #1a202c', borderRadius: '8px', background: '#090d13' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesConnectable={false}
        nodesDraggable={false}
        elementsSelectable={false}
      >
        <Background color="#1a202c" gap={16} />
        <Controls showInteractive={false} style={{ button: { background: '#11151d', color: '#fff', border: '1px solid #2d3748' } }} />
      </ReactFlow>
    </div>
  );
}
