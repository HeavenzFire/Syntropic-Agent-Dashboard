// SystemIntegrationPanel - Agent management and status panel
import React from 'react';
import type { Agent } from '../types';

interface SystemIntegrationPanelProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  onSelectAgent: (id: string | null) => void;
  onUpdateStatus: (id: string, status: Agent['status']) => void;
}

export const SystemIntegrationPanel: React.FC<SystemIntegrationPanelProps> = ({
  agents,
  selectedAgent,
  onSelectAgent,
  onUpdateStatus,
}) => {
  const getStatusColor = (status: Agent['status']): string => {
    switch (status) {
      case 'online': return '#10B981';
      case 'busy': return '#F59E0B';
      case 'error': return '#EF4444';
      case 'initializing': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getProviderIcon = (provider: Agent['provider']): string => {
    switch (provider) {
      case 'anthropic': return '🔶';
      case 'openai': return '🟢';
      case 'google': return '🔵';
      case 'xai': return '🟣';
      case 'local': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div style={{
      background: '#1a1a2e',
      borderRadius: '12px',
      border: '1px solid #2d2d44',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #2d2d44',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: 600,
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>🔗</span> Agent Registry
        </h2>
        <span style={{
          fontSize: '12px',
          color: '#9CA3AF',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '4px 8px',
          borderRadius: '4px',
        }}>
          {agents.filter(a => a.status === 'online').length} active
        </span>
      </div>

      <div style={{ maxHeight: '400px', overflow: 'auto' }}>
        {agents.map((agent) => (
          <div
            key={agent.id}
            onClick={() => onSelectAgent(selectedAgent?.id === agent.id ? null : agent.id)}
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #2d2d44',
              cursor: 'pointer',
              background: selectedAgent?.id === agent.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (selectedAgent?.id !== agent.id) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedAgent?.id !== agent.id) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              {/* Status indicator */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: `${agent.color}20`,
                border: `2px solid ${getStatusColor(agent.status)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}>
                {getProviderIcon(agent.provider)}
              </div>

              {/* Agent info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#FFFFFF',
                  }}>
                    {agent.name}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: `${getStatusColor(agent.status)}20`,
                    color: getStatusColor(agent.status),
                    textTransform: 'uppercase',
                  }}>
                    {agent.status}
                  </span>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#9CA3AF',
                  marginTop: '2px',
                }}>
                  {agent.model} • {agent.frequency}Hz
                </div>
              </div>

              {/* Coherence bar */}
              <div style={{ width: '60px' }}>
                <div style={{
                  fontSize: '10px',
                  color: '#9CA3AF',
                  marginBottom: '4px',
                  textAlign: 'right',
                }}>
                  {(agent.coherenceScore * 100).toFixed(0)}%
                </div>
                <div style={{
                  height: '4px',
                  background: '#2d2d44',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${agent.coherenceScore * 100}%`,
                    height: '100%',
                    background: agent.coherenceScore > 0.8 ? '#10B981' :
                               agent.coherenceScore > 0.6 ? '#F59E0B' : '#EF4444',
                    borderRadius: '2px',
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            </div>

            {/* Expanded details when selected */}
            {selectedAgent?.id === agent.id && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
              }}>
                <p style={{
                  margin: '0 0 12px 0',
                  fontSize: '12px',
                  color: '#9CA3AF',
                  lineHeight: 1.5,
                }}>
                  {agent.description}
                </p>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginBottom: '12px',
                }}>
                  {agent.capabilities.map((cap) => (
                    <span
                      key={cap}
                      style={{
                        fontSize: '10px',
                        padding: '4px 8px',
                        background: `${agent.color}20`,
                        color: agent.color,
                        borderRadius: '4px',
                      }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '12px',
                }}>
                  <div style={{
                    padding: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '6px',
                  }}>
                    <div style={{ fontSize: '10px', color: '#9CA3AF' }}>Messages</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>
                      {agent.messageCount}
                    </div>
                  </div>
                  <div style={{
                    padding: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '6px',
                  }}>
                    <div style={{ fontSize: '10px', color: '#9CA3AF' }}>Tasks</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>
                      {agent.taskCount}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '8px',
                }}>
                  {agent.status !== 'online' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(agent.id, 'online');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      Activate
                    </button>
                  )}
                  {agent.status === 'online' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(agent.id, 'offline');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#6B7280',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemIntegrationPanel;
