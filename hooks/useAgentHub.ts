// React hook for AgentHub integration
import { useState, useEffect, useCallback } from 'react';
import { agentHub } from '../services/AgentHub';
import type {
  Agent,
  Task,
  LogEntry,
  SystemMetrics,
  CalibrationSettings,
  HubEvent,
  AgentConnection,
} from '../types';

export interface UseAgentHubReturn {
  // State
  agents: Agent[];
  tasks: Task[];
  logs: LogEntry[];
  metrics: SystemMetrics;
  calibration: CalibrationSettings;
  connections: AgentConnection[];
  selectedAgent: Agent | null;
  isLoading: boolean;

  // Actions
  selectAgent: (id: string | null) => void;
  updateAgentStatus: (id: string, status: Agent['status']) => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  completeTask: (id: string, result?: string) => void;
  sendMessage: (agentId: string, content: string, targetAgentId?: string) => void;
  updateCalibration: (updates: Partial<CalibrationSettings>) => void;
  braidInvoke: (query: string, agentIds?: string[]) => Promise<string>;
  refreshState: () => void;
}

export function useAgentHub(): UseAgentHubReturn {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalAgents: 0,
    activeAgents: 0,
    totalMessages: 0,
    totalTasks: 0,
    completedTasks: 0,
    globalCoherence: 0,
    uptime: 0,
  });
  const [calibration, setCalibration] = useState<CalibrationSettings>(
    agentHub.getCalibration()
  );
  const [connections, setConnections] = useState<AgentConnection[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refresh all state from hub
  const refreshState = useCallback(() => {
    setAgents(agentHub.getAgents());
    setTasks(agentHub.getTasks());
    setLogs(agentHub.getLogs());
    setMetrics(agentHub.getMetrics());
    setCalibration(agentHub.getCalibration());
    setConnections(agentHub.getConnections());
  }, []);

  // Subscribe to hub events
  useEffect(() => {
    // Initial load
    refreshState();
    setIsLoading(false);

    // Subscribe to updates
    const unsubscribe = agentHub.subscribe((event: HubEvent) => {
      switch (event.type) {
        case 'agent:status':
        case 'agent:connect':
        case 'agent:disconnect':
          setAgents(agentHub.getAgents());
          setConnections(agentHub.getConnections());
          break;
        case 'task:create':
        case 'task:update':
        case 'task:complete':
          setTasks(agentHub.getTasks());
          break;
        case 'system:metrics':
          setMetrics(event.payload as SystemMetrics);
          break;
        case 'system:calibrate':
          setCalibration(event.payload as CalibrationSettings);
          break;
        case 'message:send':
        case 'message:receive':
          setLogs(agentHub.getLogs());
          setAgents(agentHub.getAgents());
          break;
      }
    });

    // Periodic log refresh
    const logInterval = setInterval(() => {
      setLogs(agentHub.getLogs());
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(logInterval);
    };
  }, [refreshState]);

  // Computed selected agent
  const selectedAgent = selectedAgentId
    ? agents.find((a) => a.id === selectedAgentId) || null
    : null;

  // Actions
  const selectAgent = useCallback((id: string | null) => {
    setSelectedAgentId(id);
  }, []);

  const updateAgentStatus = useCallback(
    (id: string, status: Agent['status']) => {
      agentHub.updateAgentStatus(id, status);
    },
    []
  );

  const createTask = useCallback(
    (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      return agentHub.createTask(task);
    },
    []
  );

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    agentHub.updateTask(id, updates);
  }, []);

  const completeTask = useCallback((id: string, result?: string) => {
    agentHub.completeTask(id, result);
  }, []);

  const sendMessage = useCallback(
    (agentId: string, content: string, targetAgentId?: string) => {
      agentHub.sendMessage(agentId, content, targetAgentId);
    },
    []
  );

  const updateCalibration = useCallback(
    (updates: Partial<CalibrationSettings>) => {
      agentHub.updateCalibration(updates);
    },
    []
  );

  const braidInvoke = useCallback(
    async (query: string, agentIds?: string[]) => {
      return agentHub.braidInvoke(query, agentIds);
    },
    []
  );

  return {
    agents,
    tasks,
    logs,
    metrics,
    calibration,
    connections,
    selectedAgent,
    isLoading,
    selectAgent,
    updateAgentStatus,
    createTask,
    updateTask,
    completeTask,
    sendMessage,
    updateCalibration,
    braidInvoke,
    refreshState,
  };
}

export default useAgentHub;
