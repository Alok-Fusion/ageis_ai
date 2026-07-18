import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

export default function AgentFlow({ activeAgentIndex }) {
  const agents = useMemo(() => [
    { name: "News Agent", x: 20, y: 50 },
    { name: "Verification Agent", x: 180, y: 50 },
    { name: "Geopolitical Agent", x: 340, y: 50 },
    { name: "Commodity Agent", x: 20, y: 150 },
    { name: "Weather Agent", x: 180, y: 150 },
    { name: "Shipping Agent", x: 340, y: 150 },
    { name: "Supplier Agent", x: 500, y: 150 },
    { name: "Knowledge Graph Agent", x: 20, y: 250 },
    { name: "Simulation Agent", x: 180, y: 250 },
    { name: "Forecast Agent", x: 340, y: 250 },
    { name: "Risk Agent", x: 500, y: 250 },
    { name: "Procurement Agent", x: 100, y: 350 },
    { name: "Reserve Agent", x: 420, y: 350 },
    { name: "Executive Agent", x: 260, y: 440 },
    { name: "Report Agent", x: 420, y: 440 }
  ], []);

  const nodes = useMemo(() => {
    return agents.map((agent, index) => {
      const isActive = index === activeAgentIndex;
      const isPast = index < activeAgentIndex;
      
      let border = 'rgba(79, 209, 197, 0.2)';
      let bg = 'rgba(13, 20, 30, 0.6)';
      let textShadow = 'none';

      if (isActive) {
        border = '#4fd1c5';
        bg = 'rgba(79, 209, 197, 0.2)';
        textShadow = '0 0 8px rgba(79, 209, 197, 0.6)';
      } else if (isPast) {
        border = 'rgba(72, 187, 120, 0.6)';
        bg = 'rgba(72, 187, 120, 0.1)';
      }

      return {
        id: `node-${index}`,
        position: { x: agent.x, y: agent.y },
        data: { 
          label: (
            <div style={{ textShadow, color: '#f7fafc', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{agent.name}</div>
              <div style={{ fontSize: '9px', color: isActive ? '#4fd1c5' : isPast ? '#48bb78' : '#718096', marginTop: '2px' }}>
                {isActive ? 'THINKING...' : isPast ? 'COMPLETED' : 'IDLE'}
              </div>
            </div>
          )
        },
        style: {
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: '8px',
          width: 140,
          boxShadow: isActive ? '0 0 15px rgba(79, 209, 197, 0.4)' : 'none',
          transition: 'all 0.3s ease'
        }
      };
    });
  }, [activeAgentIndex, agents]);

  // Connect them sequentially to show workflow pipeline
  const edges = useMemo(() => {
    const edgeList = [];
    // Sequential edges
    for (let i = 0; i < agents.length - 1; i++) {
      const isPassed = i < activeAgentIndex;
      edgeList.push({
        id: `e-${i}-${i+1}`,
        source: `node-${i}`,
        target: `node-${i+1}`,
        animated: i === activeAgentIndex - 1,
        style: { 
          stroke: isPassed ? '#48bb78' : 'rgba(79, 209, 197, 0.1)',
          strokeWidth: isPassed ? 2 : 1
        }
      });
    }
    return edgeList;
  }, [activeAgentIndex, agents]);

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
