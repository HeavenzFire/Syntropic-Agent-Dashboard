// DragonDeploymentPanel - Task orchestration and braid invocation
import React, { useState } from 'react';
import type { Task, Agent } from '../types';

interface DragonDeploymentPanelProps {
  agents: Agent[];
  tasks: Task[];
  onCreateTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onCompleteTask: (id: string, result?: string) => void;
  onBraidInvoke: (query: string, agentIds?: string[]) => Promise<string>;
}

export const DragonDeploymentPanel: React.FC<DragonDeploymentPanelProps> = ({
  agents,
  tasks,
  onCreateTask,
  onUpdateTask,
  onCompleteTask,
  onBraidInvoke,
}) => {
  const [query, setQuery] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isInvoking, setIsInvoking] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  const handleBraidInvoke = async () => {
    if (!query.trim()) return;

    setIsInvoking(true);
    setLastResult(null);

    try {
      const agentIds = selectedAgents.length > 0 ? selectedAgents : undefined;
      const result = await onBraidInvoke(query, agentIds);
      setLastResult(result);
      setQuery('');
    } catch (err) {
      setLastResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsInvoking(false);
    }
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;

    onCreateTask({
      title: newTaskTitle,
      description: newTaskDesc,
      priority: 'medium',
      status: 'pending',
      assignedAgents: selectedAgents.length > 0 ? selectedAgents : agents.filter(a => a.status === 'online').map(a => a.id),
    });

    setNewTaskTitle('');
    setNewTaskDesc('');
    setShowNewTask(false);
  };

  const toggleAgentSelection = (id: string) => {
    setSelectedAgents((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status: Task['status']): string => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'failed': return '#EF4444';
      case 'cancelled': return '#6B7280';
      default: return '#F59E0B';
    }
  };

  const getPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      default: return '#6B7280';
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
      }}>
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '14px',
          fontWeight: 600,
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>🐉</span> Dragon Deployment
        </h2>

        {/* Agent selection */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            fontSize: '11px',
            color: '#9CA3AF',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '8px',
          }}>
            Select Agents (optional)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {agents.filter(a => a.status === 'online').map((agent) => (
              <button
                key={agent.id}
                onClick={() => toggleAgentSelection(agent.id)}
                style={{
                  padding: '6px 10px',
                  fontSize: '11px',
                  background: selectedAgents.includes(agent.id)
                    ? `${agent.color}30`
                    : 'rgba(0, 0, 0, 0.3)',
                  border: `1px solid ${selectedAgents.includes(agent.id) ? agent.color : '#2d2d44'}`,
                  borderRadius: '6px',
                  color: selectedAgents.includes(agent.id) ? agent.color : '#9CA3AF',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {agent.name}
              </button>
            ))}
          </div>
        </div>

        {/* Braid invocation input */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            fontSize: '11px',
            color: '#9CA3AF',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '8px',
          }}>
            Braid Invocation Query
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query to invoke the agent braid..."
              onKeyDown={(e) => e.key === 'Enter' && handleBraidInvoke()}
              style={{
                flex: 1,
                padding: '10px 12px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #2d2d44',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleBraidInvoke}
              disabled={isInvoking || !query.trim()}
              style={{
                padding: '10px 20px',
                background: isInvoking
                  ? '#4B5563'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 500,
                cursor: isInvoking ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isInvoking ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    animation: 'spin 1s linear infinite',
                  }}>⟳</span>
                  Invoking...
                </>
              ) : (
                <>⚡ Invoke</>
              )}
            </button>
          </div>
        </div>

        {/* Last result */}
        {lastResult && (
          <div style={{
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            border: '1px solid #2d2d44',
          }}>
            <div style={{
              fontSize: '10px',
              color: '#9CA3AF',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Response
            </div>
            <pre style={{
              margin: 0,
              fontSize: '12px',
              color: '#FFFFFF',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
            }}>
              {lastResult}
            </pre>
          </div>
        )}
      </div>

      {/* Tasks section */}
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 600,
            color: '#FFFFFF',
          }}>
            Task Queue ({tasks.length})
          </h3>
          <button
            onClick={() => setShowNewTask(!showNewTask)}
            style={{
              padding: '6px 12px',
              background: showNewTask ? '#EF4444' : '#3B82F6',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            {showNewTask ? 'Cancel' : '+ New Task'}
          </button>
        </div>

        {/* New task form */}
        {showNewTask && (
          <div style={{
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            marginBottom: '12px',
          }}>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #2d2d44',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '12px',
                marginBottom: '8px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <textarea
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              placeholder="Task description"
              rows={2}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #2d2d44',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '12px',
                marginBottom: '8px',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleCreateTask}
              disabled={!newTaskTitle.trim()}
              style={{
                width: '100%',
                padding: '8px',
                background: newTaskTitle.trim() ? '#10B981' : '#4B5563',
                border: 'none',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '12px',
                cursor: newTaskTitle.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Create Task
            </button>
          </div>
        )}

        {/* Task list */}
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          {tasks.length === 0 ? (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: '#6B7280',
              fontSize: '12px',
            }}>
              No tasks in queue
            </div>
          ) : (
            tasks.slice().reverse().map((task) => (
              <div
                key={task.id}
                style={{
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: '1px solid #2d2d44',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#FFFFFF',
                      }}>
                        {task.title}
                      </span>
                      <span style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: `${getPriorityColor(task.priority)}20`,
                        color: getPriorityColor(task.priority),
                        textTransform: 'uppercase',
                      }}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p style={{
                        margin: 0,
                        fontSize: '11px',
                        color: '#9CA3AF',
                        lineHeight: 1.4,
                      }}>
                        {task.description.substring(0, 100)}
                        {task.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '8px',
                      fontSize: '10px',
                      color: '#6B7280',
                    }}>
                      <span>{task.assignedAgents.length} agents</span>
                      <span>•</span>
                      <span>{new Date(task.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '4px',
                  }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: `${getStatusColor(task.status)}20`,
                      color: getStatusColor(task.status),
                      textTransform: 'uppercase',
                    }}>
                      {task.status.replace('_', ' ')}
                    </span>
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => onCompleteTask(task.id)}
                        style={{
                          padding: '4px 8px',
                          background: '#10B981',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#FFFFFF',
                          fontSize: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        Complete
                      </button>
                    )}
                    {task.status === 'pending' && (
                      <button
                        onClick={() => onUpdateTask(task.id, { status: 'in_progress' })}
                        style={{
                          padding: '4px 8px',
                          background: '#3B82F6',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#FFFFFF',
                          fontSize: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DragonDeploymentPanel;
