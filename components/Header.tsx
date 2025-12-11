// Header - System status bar and navigation
import React from 'react';
import type { SystemMetrics } from '../types';

interface HeaderProps {
  metrics: SystemMetrics;
}

export const Header: React.FC<HeaderProps> = ({ metrics }) => {
  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const coherenceColor =
    metrics.globalCoherence >= 0.8 ? '#10B981' :
    metrics.globalCoherence >= 0.6 ? '#F59E0B' : '#EF4444';

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      borderBottom: '1px solid #2d2d44',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
        }}>
          ⚡
        </div>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
          }}>
            Syntropic Agent Hub
          </h1>
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: '#9CA3AF',
          }}>
            Multi-Agent Coordination System
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
      }}>
        {/* Metrics badges */}
        <MetricBadge
          label="Agents"
          value={`${metrics.activeAgents}/${metrics.totalAgents}`}
          color="#3B82F6"
        />
        <MetricBadge
          label="Tasks"
          value={`${metrics.completedTasks}/${metrics.totalTasks}`}
          color="#8B5CF6"
        />
        <MetricBadge
          label="Messages"
          value={metrics.totalMessages.toString()}
          color="#EC4899"
        />

        {/* Coherence indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          border: `1px solid ${coherenceColor}40`,
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: coherenceColor,
            boxShadow: `0 0 10px ${coherenceColor}`,
            animation: 'pulse 2s infinite',
          }} />
          <div>
            <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>
              Coherence
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: coherenceColor }}>
              {(metrics.globalCoherence * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Uptime */}
        <div style={{
          padding: '8px 16px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          border: '1px solid #2d2d44',
        }}>
          <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>
            Uptime
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>
            {formatUptime(metrics.uptime)}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </header>
  );
};

interface MetricBadgeProps {
  label: string;
  value: string;
  color: string;
}

const MetricBadge: React.FC<MetricBadgeProps> = ({ label, value, color }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '4px 12px',
    background: `${color}15`,
    borderRadius: '6px',
    border: `1px solid ${color}30`,
  }}>
    <span style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>
      {label}
    </span>
    <span style={{ fontSize: '16px', fontWeight: 700, color }}>
      {value}
    </span>
  </div>
);

export default Header;
