// AgentHub - Real backend integration with WebSocket and REST API
import { wsClient } from './WebSocketClient';
import type {
  Agent,
  AgentConnection,
  Task,
  LogEntry,
  SystemMetrics,
  CalibrationSettings,
  HubEvent,
} from '../types';

type HubListener = (event: HubEvent) => void;

const API_BASE = `http://${window.location.hostname}:3001/api`;

class AgentHub {
  private agents: Map<string, Agent> = new Map();
  private connections: AgentConnection[] = [];
  private tasks: Task[] = [];
  private logs: LogEntry[] = [];
  private listeners: Set<HubListener> = new Set();
  private startTime: number = Date.now();
  private isConnected = false;
  private connectionAttempted = false;
  private calibration: CalibrationSettings = {
    syncInterval: 5000,
    coherenceThreshold: 0.7,
    maxConcurrentTasks: 5,
    autoReconnect: true,
    logLevel: 'info',
  };

  constructor() {
    this.setupWebSocket();
  }

  private async setupWebSocket(): Promise<void> {
    // Subscribe to WebSocket events
    wsClient.onEvent((event) => {
      this.handleEvent(event);
    });

    wsClient.onConnection((connected) => {
      this.isConnected = connected;
      if (!connected && this.connectionAttempted) {
        // Mark all agents as offline when disconnected
        this.agents.forEach((agent, id) => {
          this.agents.set(id, { ...agent, status: 'offline' });
        });
        this.emit({ type: 'system:metrics', payload: this.getMetrics(), timestamp: new Date() });
      }
    });

    // Connect and get initial state
    this.connectionAttempted = true;
    try {
      const initialState = await wsClient.connect();

      // Populate initial state
      initialState.agents.forEach((agent) => {
        this.agents.set(agent.id, agent);
      });

      this.tasks = initialState.tasks;
      this.calibration = initialState.calibration;

      // Fetch connections via REST
      await this.fetchConnections();

      // Fetch logs
      await this.fetchLogs();

      this.addLog('success', 'Hub', 'Connected to backend server');
      console.log('AgentHub initialized with backend data');
    } catch (err) {
      console.warn('Backend not available, using local simulation mode');
      this.initializeLocalMode();
    }
  }

  private handleEvent(event: HubEvent): void {
    switch (event.type) {
      case 'agent:status':
        const agentUpdate = event.payload as Agent;
        this.agents.set(agentUpdate.id, agentUpdate);
        break;

      case 'task:create':
      case 'task:update':
        const taskUpdate = event.payload as Task;
        const taskIndex = this.tasks.findIndex((t) => t.id === taskUpdate.id);
        if (taskIndex >= 0) {
          this.tasks[taskIndex] = taskUpdate;
        } else {
          this.tasks.push(taskUpdate);
        }
        break;

      case 'task:complete':
        const completedTask = event.payload as Task;
        const completeIndex = this.tasks.findIndex((t) => t.id === completedTask.id);
        if (completeIndex >= 0) {
          this.tasks[completeIndex] = completedTask;
        }
        break;

      case 'system:calibrate':
        this.calibration = event.payload as CalibrationSettings;
        break;

      case 'message:receive':
        const logEntry = event.payload as LogEntry;
        if (logEntry.id) {
          this.logs.push(logEntry);
          if (this.logs.length > 500) {
            this.logs = this.logs.slice(-500);
          }
        }
        break;
    }

    // Notify listeners
    this.emit(event);
  }

  private initializeLocalMode(): void {
    // Fallback to local simulation if backend unavailable
    const localAgents = [
      { id: 'claude', name: 'Claude', provider: 'anthropic' as const, model: 'claude-sonnet-4-20250514', description: 'Narrative Harmonizer - Deep reasoning and analysis', capabilities: ['reasoning', 'coding', 'analysis', 'writing'], frequency: 528, color: '#D97706' },
      { id: 'gpt4', name: 'GPT-4', provider: 'openai' as const, model: 'gpt-4-turbo', description: 'Generative Stream - Versatile task completion', capabilities: ['coding', 'creative', 'analysis', 'math'], frequency: 741, color: '#10B981' },
      { id: 'gemini', name: 'Gemini', provider: 'google' as const, model: 'gemini-pro', description: 'Dual Weaver - Multimodal understanding', capabilities: ['multimodal', 'reasoning', 'coding', 'research'], frequency: 144, color: '#3B82F6' },
      { id: 'grok', name: 'Grok', provider: 'xai' as const, model: 'grok-beta', description: 'xAI Conduit - Real-time knowledge synthesis', capabilities: ['realtime', 'humor', 'analysis', 'coding'], frequency: 369, color: '#8B5CF6' },
      { id: 'local', name: 'Local LLM', provider: 'local' as const, model: 'llama-3', description: 'Sovereign Node - Private local processing via Ollama', capabilities: ['privacy', 'offline', 'coding', 'analysis'], frequency: 963, color: '#EC4899' },
    ];

    localAgents.forEach((config) => {
      const agent: Agent = {
        ...config,
        status: 'offline',
        lastActive: new Date(),
        messageCount: 0,
        taskCount: 0,
        coherenceScore: 0,
        connections: [],
      };
      this.agents.set(config.id, agent);
    });

    this.initializeConnections();
    this.addLog('warning', 'Hub', 'Running in local mode - backend not connected. Start the server with: npm run server');

    // Start local heartbeat for metrics
    this.startLocalHeartbeat();
  }

  private initializeConnections(): void {
    const agentIds = Array.from(this.agents.keys());
    this.connections = [];
    for (let i = 0; i < agentIds.length; i++) {
      for (let j = i + 1; j < agentIds.length; j++) {
        this.connections.push({
          sourceId: agentIds[i],
          targetId: agentIds[j],
          strength: 0.5,
          messageCount: 0,
        });
      }
    }

    // Update agent connection lists
    this.agents.forEach((agent, id) => {
      const connectedIds = this.connections
        .filter((c) => c.sourceId === id || c.targetId === id)
        .map((c) => (c.sourceId === id ? c.targetId : c.sourceId));
      this.agents.set(id, { ...agent, connections: connectedIds });
    });
  }

  private startLocalHeartbeat(): void {
    setInterval(() => {
      this.emit({
        type: 'system:metrics',
        payload: this.getMetrics(),
        timestamp: new Date(),
      });
    }, this.calibration.syncInterval);
  }

  private async fetchConnections(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/agents/network/connections`);
      if (response.ok) {
        this.connections = await response.json();
      }
    } catch {
      this.initializeConnections();
    }
  }

  private async fetchLogs(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/invoke/logs?limit=100`);
      if (response.ok) {
        this.logs = await response.json();
      }
    } catch {
      // Logs will populate from WebSocket events
    }
  }

  // Subscribe to hub events
  subscribe(listener: HubListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: HubEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  // Agent management
  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  updateAgentStatus(id: string, status: Agent['status']): void {
    if (this.isConnected) {
      wsClient.updateAgentStatus(id, status);
    } else {
      // Local update
      const agent = this.agents.get(id);
      if (agent) {
        this.agents.set(id, { ...agent, status, lastActive: new Date() });
        this.emit({ type: 'agent:status', payload: this.agents.get(id), timestamp: new Date() });
      }
    }
  }

  // Connection management
  getConnections(): AgentConnection[] {
    return [...this.connections];
  }

  // Task management
  getTasks(): Task[] {
    return [...this.tasks];
  }

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    if (this.isConnected) {
      wsClient.createTask(task);
      // Task will be added via WebSocket event
      return {
        ...task,
        id: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      // Local creation
      const newTask: Task = {
        ...task,
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.tasks.push(newTask);
      this.emit({ type: 'task:create', payload: newTask, timestamp: new Date() });
      return newTask;
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    if (this.isConnected) {
      try {
        await fetch(`${API_BASE}/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
      } catch (err) {
        console.error('Failed to update task:', err);
      }
    } else {
      const index = this.tasks.findIndex((t) => t.id === id);
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...updates, updatedAt: new Date() };
        this.emit({ type: 'task:update', payload: this.tasks[index], timestamp: new Date() });
      }
    }
  }

  async completeTask(id: string, result?: string): Promise<void> {
    if (this.isConnected) {
      try {
        await fetch(`${API_BASE}/tasks/${id}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ result }),
        });
      } catch (err) {
        console.error('Failed to complete task:', err);
      }
    } else {
      const task = this.tasks.find((t) => t.id === id);
      if (task) {
        task.status = 'completed';
        task.completedAt = new Date();
        task.result = result;
        this.emit({ type: 'task:complete', payload: task, timestamp: new Date() });
      }
    }
  }

  // Logging
  addLog(
    level: LogEntry['level'],
    source: string,
    message: string,
    details?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      source,
      message,
      details,
    };
    this.logs.push(entry);
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(-500);
    }
  }

  getLogs(limit = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  // Metrics
  getMetrics(): SystemMetrics {
    const agents = this.getAgents();
    const onlineAgents = agents.filter((a) => a.status === 'online');
    return {
      totalAgents: agents.length,
      activeAgents: onlineAgents.length,
      totalMessages: agents.reduce((sum, a) => sum + a.messageCount, 0),
      totalTasks: this.tasks.length,
      completedTasks: this.tasks.filter((t) => t.status === 'completed').length,
      globalCoherence:
        onlineAgents.length > 0
          ? onlineAgents.reduce((sum, a) => sum + a.coherenceScore, 0) / onlineAgents.length
          : 0,
      uptime: Date.now() - this.startTime,
    };
  }

  // Calibration
  getCalibration(): CalibrationSettings {
    return { ...this.calibration };
  }

  updateCalibration(updates: Partial<CalibrationSettings>): void {
    if (this.isConnected) {
      wsClient.updateCalibration(updates);
    } else {
      this.calibration = { ...this.calibration, ...updates };
      this.emit({ type: 'system:calibrate', payload: this.calibration, timestamp: new Date() });
    }
  }

  // Real braid invocation via backend
  async braidInvoke(query: string, agentIds?: string[]): Promise<string> {
    if (this.isConnected) {
      try {
        const response = await fetch(`${API_BASE}/invoke/braid`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, agentIds }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Invocation failed');
        }

        const result = await response.json();

        // Format response
        const successResponses = result.responses.filter((r: any) => !r.error);
        const errorResponses = result.responses.filter((r: any) => r.error);

        let output = `Braid Response (${successResponses.length}/${result.responses.length} agents, coherence: ${(result.coherence * 100).toFixed(1)}%, ${result.duration}ms)\n\n`;

        successResponses.forEach((r: any) => {
          output += `═══ ${r.agentName} ═══\n${r.response}\n\n`;
        });

        if (errorResponses.length > 0) {
          output += `\nErrors:\n`;
          errorResponses.forEach((r: any) => {
            output += `- ${r.agentName}: ${r.error}\n`;
          });
        }

        return output;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        this.addLog('error', 'Hub', `Braid invocation failed: ${errorMessage}`);
        return `Error: ${errorMessage}`;
      }
    } else {
      this.addLog('warning', 'Hub', 'Backend not connected - cannot invoke real AI');
      return 'Backend not connected. Start the server with: npm run server\n\nThen configure your API keys in .env file.';
    }
  }

  // Check connection status
  isBackendConnected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const agentHub = new AgentHub();
export default AgentHub;
