// NetworkVisualizer - Canvas-based agent network visualization
import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { Agent, AgentConnection } from '../types';

interface NetworkVisualizerProps {
  agents: Agent[];
  connections: AgentConnection[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string | null) => void;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const NetworkVisualizer: React.FC<NetworkVisualizerProps> = ({
  agents,
  connections,
  selectedAgentId,
  onSelectAgent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const positionsRef = useRef<Map<string, NodePosition>>(new Map());
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  // Initialize node positions in a circular layout
  useEffect(() => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35;

    agents.forEach((agent, index) => {
      if (!positionsRef.current.has(agent.id)) {
        const angle = (index / agents.length) * Math.PI * 2 - Math.PI / 2;
        positionsRef.current.set(agent.id, {
          id: agent.id,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        });
      }
    });
  }, [agents, dimensions]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get agent by ID
  const getAgent = useCallback(
    (id: string) => agents.find((a) => a.id === id),
    [agents]
  );

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw background gradient
      const gradient = ctx.createRadialGradient(
        dimensions.width / 2,
        dimensions.height / 2,
        0,
        dimensions.width / 2,
        dimensions.height / 2,
        dimensions.width / 2
      );
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#0f0f1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Draw connections
      connections.forEach((conn) => {
        const sourcePos = positionsRef.current.get(conn.sourceId);
        const targetPos = positionsRef.current.get(conn.targetId);
        if (!sourcePos || !targetPos) return;

        const sourceAgent = getAgent(conn.sourceId);
        const targetAgent = getAgent(conn.targetId);
        if (!sourceAgent || !targetAgent) return;

        const isHighlighted =
          selectedAgentId === conn.sourceId || selectedAgentId === conn.targetId;
        const isHovered =
          hoveredAgent === conn.sourceId || hoveredAgent === conn.targetId;

        // Draw connection line
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetPos.x, targetPos.y);

        const alpha = isHighlighted || isHovered ? 0.8 : 0.2 + conn.strength * 0.3;
        ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
        ctx.lineWidth = isHighlighted ? 3 : 1 + conn.strength * 2;
        ctx.stroke();

        // Animated pulse along connection
        if (conn.strength > 0.5) {
          const pulsePos = (time * 0.5) % 1;
          const px = sourcePos.x + (targetPos.x - sourcePos.x) * pulsePos;
          const py = sourcePos.y + (targetPos.y - sourcePos.y) * pulsePos;

          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100, 200, 255, ${0.8 - pulsePos * 0.6})`;
          ctx.fill();
        }
      });

      // Draw nodes
      agents.forEach((agent) => {
        const pos = positionsRef.current.get(agent.id);
        if (!pos) return;

        const isSelected = selectedAgentId === agent.id;
        const isHovered = hoveredAgent === agent.id;
        const baseRadius = 30;
        const radius = baseRadius + (isSelected ? 8 : isHovered ? 4 : 0);

        // Outer glow
        const glowRadius = radius + 15 + Math.sin(time * 2 + agent.frequency * 0.01) * 5;
        const glowGradient = ctx.createRadialGradient(
          pos.x,
          pos.y,
          radius,
          pos.x,
          pos.y,
          glowRadius
        );
        glowGradient.addColorStop(0, `${agent.color}40`);
        glowGradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Status ring
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle =
          agent.status === 'online'
            ? '#10B981'
            : agent.status === 'busy'
              ? '#F59E0B'
              : agent.status === 'error'
                ? '#EF4444'
                : '#6B7280';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Main node
        const nodeGradient = ctx.createRadialGradient(
          pos.x - radius * 0.3,
          pos.y - radius * 0.3,
          0,
          pos.x,
          pos.y,
          radius
        );
        nodeGradient.addColorStop(0, agent.color);
        nodeGradient.addColorStop(1, `${agent.color}80`);

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = nodeGradient;
        ctx.fill();

        // Coherence indicator (arc around node)
        ctx.beginPath();
        ctx.arc(
          pos.x,
          pos.y,
          radius + 8,
          -Math.PI / 2,
          -Math.PI / 2 + Math.PI * 2 * agent.coherenceScore
        );
        ctx.strokeStyle = `rgba(255, 255, 255, 0.6)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Agent name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(agent.name, pos.x, pos.y);

        // Frequency label (below node)
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.fillText(`${agent.frequency}Hz`, pos.x, pos.y + radius + 16);
      });

      // Draw legend
      ctx.fillStyle = '#6B7280';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('● Online  ● Busy  ● Offline', 10, dimensions.height - 10);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    agents,
    connections,
    dimensions,
    selectedAgentId,
    hoveredAgent,
    getAgent,
  ]);

  // Handle mouse interactions
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if hovering over any agent
      let found = false;
      agents.forEach((agent) => {
        const pos = positionsRef.current.get(agent.id);
        if (!pos) return;

        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (dist < 35) {
          setHoveredAgent(agent.id);
          found = true;
        }
      });

      if (!found) {
        setHoveredAgent(null);
      }
    },
    [agents]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if clicking on any agent
      let clickedAgent: string | null = null;
      agents.forEach((agent) => {
        const pos = positionsRef.current.get(agent.id);
        if (!pos) return;

        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (dist < 35) {
          clickedAgent = agent.id;
        }
      });

      onSelectAgent(clickedAgent === selectedAgentId ? null : clickedAgent);
    },
    [agents, selectedAgentId, onSelectAgent]
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#0f0f1a',
      }}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          display: 'block',
          cursor: hoveredAgent ? 'pointer' : 'default',
        }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      {hoveredAgent && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '12px 16px',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '12px',
            maxWidth: '200px',
          }}
        >
          {(() => {
            const agent = getAgent(hoveredAgent);
            if (!agent) return null;
            return (
              <>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {agent.name}
                </div>
                <div style={{ color: '#9CA3AF', marginBottom: '4px' }}>
                  {agent.description}
                </div>
                <div>Status: {agent.status}</div>
                <div>Coherence: {(agent.coherenceScore * 100).toFixed(0)}%</div>
                <div>Messages: {agent.messageCount}</div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default NetworkVisualizer;
