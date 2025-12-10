// AgentHub - Central coordination service for multi-agent system
import type {
  Agent,
  AgentConfig,
  AgentConnection,
  Task,
  LogEntry,
  SystemMetrics,
  CalibrationSettings,
  Message,
  HubEvent,
  EventType,
} from '../types';

type HubListener = (event: HubEvent) => void;

// Default agent configurations
const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'claude',
    name: 'Claude',
    provider: 'anthropic',
    model: 'claude-3-opus',
    description: 'Narrative Harmonizer - Deep reasoning and analysis',
    capabilities: ['reasoning', 'coding', 'analysis', 'writing'],
    frequency: 528,
    color: '#D97706',
  },
  {
    id: 'gpt4',
    name: 'GPT-4',
    provider: 'openai',
    model: 'gpt-4-turbo',
    description: 'Generative Stream - Versatile task completion',
    capabilities: ['coding', 'creative', 'analysis', 'math'],
    frequency: 741,
    color: '#10B981',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    provider: 'google',
    model: 'gemini-pro',
    description: 'Dual Weaver - Multimodal understanding',
    capabilities: ['multimodal', 'reasoning', 'coding', 'research'],
    frequency: 144,
    color: '#3B82F6',
  },
  {
    id: 'grok',
    name: 'Grok',
    provider: 'xai',
    model: 'grok-2',
    description: 'xAI Conduit - Real-time knowledge synthesis',
    capabilities: ['realtime', 'humor', 'analysis', 'coding'],
    frequency: 369,
    color: '#8B5CF6',
  },
  {
    id: 'local',
    name: 'Local Agent',
    provider: 'local',
    model: 'llama-3',
    description: 'Sovereign Node - Private local processing',
    capabilities: ['privacy', 'offline', 'coding', 'analysis'],
    frequency: 963,
    color: '#EC4899',
  },
];

class AgentHub {
  private agents: Map<string, Agent> = new Map();
  private connections: AgentConnection[] = [];
  private tasks: Task[] = [];
  private logs: LogEntry[] = [];
  private messages: Message[] = [];
  private listeners: Set<HubListener> = new Set();
  private startTime: number = Date.now();
  private calibration: CalibrationSettings = {
    syncInterval: 5000,
    coherenceThreshold: 0.7,
    maxConcurrentTasks: 5,
    autoReconnect: true,
    logLevel: 'info',
  };

  constructor() {
    this.initializeAgents();
    this.initializeConnections();
    this.startHeartbeat();
  }

  private initializeAgents(): void {
    DEFAULT_AGENTS.forEach((config) => {
      const agent: Agent = {
        ...config,
        status: 'initializing',
        lastActive: new Date(),
        messageCount: 0,
        taskCount: 0,
        coherenceScore: 0.85 + Math.random() * 0.15,
        connections: [],
      };
      this.agents.set(config.id, agent);
    });

    // Simulate initialization
    setTimeout(() => {
      this.agents.forEach((agent, id) => {
        const updated = { ...agent, status: 'online' as const };
        this.agents.set(id, updated);
        this.emit({ type: 'agent:status', payload: updated, timestamp: new Date() });
        this.addLog('info', agent.name, `${agent.name} connected to hub`);
      });
    }, 1000);
  }

  private initializeConnections(): void {
    const agentIds = Array.from(this.agents.keys());
    // Create mesh network - each agent connected to others
    for (let i = 0; i < agentIds.length; i++) {
      for (let j = i + 1; j < agentIds.length; j++) {
        this.connections.push({
          sourceId: agentIds[i],
          targetId: agentIds[j],
          strength: 0.5 + Math.random() * 0.5,
          messageCount: Math.floor(Math.random() * 100),
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

  private startHeartbeat(): void {
    setInterval(() => {
      // Update coherence scores with slight variations
      this.agents.forEach((agent, id) => {
        const newCoherence = Math.max(
          0.5,
          Math.min(1, agent.coherenceScore + (Math.random() - 0.5) * 0.05)
        );
        this.agents.set(id, {
          ...agent,
          coherenceScore: newCoherence,
          lastActive: agent.status === 'online' ? new Date() : agent.lastActive,
        });
      });

      // Emit metrics update
      this.emit({
        type: 'system:metrics',
        payload: this.getMetrics(),
        timestamp: new Date(),
      });
    }, this.calibration.syncInterval);
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
    const agent = this.agents.get(id);
    if (agent) {
      const updated = { ...agent, status, lastActive: new Date() };
      this.agents.set(id, updated);
      this.emit({ type: 'agent:status', payload: updated, timestamp: new Date() });
      this.addLog('info', 'Hub', `${agent.name} status changed to ${status}`);
    }
  }

  // Connection management
  getConnections(): AgentConnection[] {
    return [...this.connections];
  }

  getConnectionStrength(sourceId: string, targetId: string): number {
    const conn = this.connections.find(
      (c) =>
        (c.sourceId === sourceId && c.targetId === targetId) ||
        (c.sourceId === targetId && c.targetId === sourceId)
    );
    return conn?.strength ?? 0;
  }

  // Task management
  getTasks(): Task[] {
    return [...this.tasks];
  }

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.push(newTask);
    this.emit({ type: 'task:create', payload: newTask, timestamp: new Date() });
    this.addLog('info', 'Hub', `Task created: ${newTask.title}`);

    // Update agent task counts
    newTask.assignedAgents.forEach((agentId) => {
      const agent = this.agents.get(agentId);
      if (agent) {
        this.agents.set(agentId, { ...agent, taskCount: agent.taskCount + 1 });
      }
    });

    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>): void {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.tasks[index] = {
        ...this.tasks[index],
        ...updates,
        updatedAt: new Date(),
      };
      this.emit({ type: 'task:update', payload: this.tasks[index], timestamp: new Date() });
    }
  }

  completeTask(id: string, result?: string): void {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;
      this.emit({ type: 'task:complete', payload: task, timestamp: new Date() });
      this.addLog('success', 'Hub', `Task completed: ${task.title}`);
    }
  }

  // Message handling
  sendMessage(agentId: string, content: string, targetAgentId?: string): Message {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    this.messages.push(message);

    // Update agent message count
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.set(agentId, {
        ...agent,
        messageCount: agent.messageCount + 1,
        lastActive: new Date(),
      });
    }

    // Update connection strength if target specified
    if (targetAgentId) {
      const connIndex = this.connections.findIndex(
        (c) =>
          (c.sourceId === agentId && c.targetId === targetAgentId) ||
          (c.sourceId === targetAgentId && c.targetId === agentId)
      );
      if (connIndex !== -1) {
        this.connections[connIndex] = {
          ...this.connections[connIndex],
          messageCount: this.connections[connIndex].messageCount + 1,
          strength: Math.min(1, this.connections[connIndex].strength + 0.01),
          lastMessage: new Date(),
        };
      }
    }

    this.emit({
      type: 'message:send',
      payload: message,
      timestamp: new Date(),
      sourceAgent: agentId,
      targetAgent: targetAgentId,
    });

    return message;
  }

  getMessages(agentId?: string): Message[] {
    if (agentId) {
      return this.messages.filter((m) => m.agentId === agentId);
    }
    return [...this.messages];
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

    // Keep only last 500 logs
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
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter((a) => a.status === 'online').length,
      totalMessages: this.messages.length,
      totalTasks: this.tasks.length,
      completedTasks: this.tasks.filter((t) => t.status === 'completed').length,
      globalCoherence:
        agents.reduce((sum, a) => sum + a.coherenceScore, 0) / agents.length || 0,
      uptime: Date.now() - this.startTime,
    };
  }

  // Calibration
  getCalibration(): CalibrationSettings {
    return { ...this.calibration };
  }

  updateCalibration(updates: Partial<CalibrationSettings>): void {
    this.calibration = { ...this.calibration, ...updates };
    this.emit({ type: 'system:calibrate', payload: this.calibration, timestamp: new Date() });
    this.addLog('info', 'Hub', 'Calibration settings updated');
  }

  // Orchestration - broadcast query to multiple agents
  async braidInvoke(query: string, agentIds?: string[]): Promise<string> {
    const targetAgents = agentIds
      ? agentIds.map((id) => this.agents.get(id)).filter(Boolean)
      : this.getAgents().filter((a) => a.status === 'online');

    if (targetAgents.length === 0) {
      this.addLog('warning', 'Hub', 'No agents available for braid invocation');
      return 'No agents available';
    }

    this.addLog('info', 'Hub', `Braid invocation started with ${targetAgents.length} agents`);

    // Create task for tracking
    const task = this.createTask({
      title: 'Braid Invocation',
      description: query,
      priority: 'high',
      status: 'in_progress',
      assignedAgents: targetAgents.map((a) => a!.id),
    });

    // Simulate distributed processing
    const results = await Promise.all(
      targetAgents.map(async (agent) => {
        if (!agent) return null;
        this.updateAgentStatus(agent.id, 'busy');

        // Simulate processing delay
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));

        this.updateAgentStatus(agent.id, 'online');
        return {
          agentId: agent.id,
          agentName: agent.name,
          response: `[${agent.name}] Processed: "${query.substring(0, 50)}..."`,
        };
      })
    );

    // Aggregate results
    const coherence = this.getMetrics().globalCoherence;
    const summary = results
      .filter(Boolean)
      .map((r) => r!.response)
      .join('\n');

    this.completeTask(task.id, summary);
    this.addLog('success', 'Hub', `Braid invocation complete. Coherence: ${coherence.toFixed(2)}`);

    return `Weave Response (${targetAgents.length} agents, coherence: ${coherence.toFixed(2)}):\n${summary}`;
  }
}

// Singleton instance
export const agentHub = new AgentHub();
export default AgentHub;
