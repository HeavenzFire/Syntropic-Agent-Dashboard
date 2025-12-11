// AgentOrchestrator - Real backend coordination with AI provider integrations
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { GoogleProvider } from './providers/google';
import { XAIProvider } from './providers/xai';
import { LocalProvider } from './providers/local';
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
  AgentProvider,
} from '../types';

type HubListener = (event: HubEvent) => void;

export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  chat(messages: Array<{ role: string; content: string }>, options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<string>;
  streamChat?(messages: Array<{ role: string; content: string }>, onToken: (token: string) => void): Promise<string>;
}

// Default agent configurations
const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'claude',
    name: 'Claude',
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    description: 'Narrative Harmonizer - Deep reasoning and analysis',
    capabilities: ['reasoning', 'coding', 'analysis', 'writing'],
    frequency: 528,
    color: '#D97706',
    maxTokens: 4096,
    temperature: 0.7,
  },
  {
    id: 'gpt4',
    name: 'GPT-4',
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    description: 'Generative Stream - Versatile task completion',
    capabilities: ['coding', 'creative', 'analysis', 'math'],
    frequency: 741,
    color: '#10B981',
    maxTokens: 4096,
    temperature: 0.7,
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
    maxTokens: 4096,
    temperature: 0.7,
  },
  {
    id: 'grok',
    name: 'Grok',
    provider: 'xai',
    model: 'grok-beta',
    description: 'xAI Conduit - Real-time knowledge synthesis',
    capabilities: ['realtime', 'humor', 'analysis', 'coding'],
    frequency: 369,
    color: '#8B5CF6',
    maxTokens: 4096,
    temperature: 0.7,
  },
  {
    id: 'local',
    name: 'Local LLM',
    provider: 'local',
    model: 'llama-3',
    description: 'Sovereign Node - Private local processing via Ollama',
    capabilities: ['privacy', 'offline', 'coding', 'analysis'],
    frequency: 963,
    color: '#EC4899',
    apiEndpoint: 'http://localhost:11434',
    maxTokens: 2048,
    temperature: 0.7,
  },
];

export class AgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private providers: Map<AgentProvider, AIProvider> = new Map();
  private connections: AgentConnection[] = [];
  private tasks: Task[] = [];
  private logs: LogEntry[] = [];
  private messages: Message[] = [];
  private listeners: Set<HubListener> = new Set();
  private startTime: number = Date.now();
  private metricsInterval: NodeJS.Timeout | null = null;
  private calibration: CalibrationSettings = {
    syncInterval: 5000,
    coherenceThreshold: 0.7,
    maxConcurrentTasks: 5,
    autoReconnect: true,
    logLevel: 'info',
  };

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize all AI providers
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('anthropic', new AnthropicProvider());
    this.providers.set('google', new GoogleProvider());
    this.providers.set('xai', new XAIProvider());
    this.providers.set('local', new LocalProvider());
  }

  async initializeAgents(): Promise<void> {
    this.addLog('info', 'Orchestrator', 'Initializing AI agents...');

    // Create agent entries
    for (const config of DEFAULT_AGENTS) {
      const agent: Agent = {
        ...config,
        status: 'initializing',
        lastActive: new Date(),
        messageCount: 0,
        taskCount: 0,
        coherenceScore: 0,
        connections: [],
      };
      this.agents.set(config.id, agent);
      this.emit({ type: 'agent:status', payload: agent, timestamp: new Date() });
    }

    // Check availability of each provider
    const availabilityChecks = Array.from(this.agents.entries()).map(async ([id, agent]) => {
      const provider = this.providers.get(agent.provider);
      if (!provider) {
        this.updateAgentStatus(id, 'error');
        this.addLog('error', agent.name, `No provider found for ${agent.provider}`);
        return;
      }

      try {
        const isAvailable = await provider.isAvailable();
        if (isAvailable) {
          this.updateAgentStatus(id, 'online');
          this.agents.set(id, { ...this.agents.get(id)!, coherenceScore: 0.85 + Math.random() * 0.15 });
          this.addLog('success', agent.name, `${agent.name} connected successfully`);
        } else {
          this.updateAgentStatus(id, 'offline');
          this.addLog('warning', agent.name, `${agent.name} API not configured or unavailable`);
        }
      } catch (err) {
        this.updateAgentStatus(id, 'error');
        this.addLog('error', agent.name, `Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    });

    await Promise.all(availabilityChecks);

    // Initialize connections mesh
    this.initializeConnections();

    // Start metrics updates
    this.startMetricsUpdates();

    this.addLog('info', 'Orchestrator', `Initialization complete. ${this.getAgents().filter(a => a.status === 'online').length} agents online.`);
  }

  private initializeConnections(): void {
    const agentIds = Array.from(this.agents.keys());
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

  private startMetricsUpdates(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(() => {
      // Update coherence scores with slight variations
      this.agents.forEach((agent, id) => {
        if (agent.status === 'online') {
          const newCoherence = Math.max(
            0.5,
            Math.min(1, agent.coherenceScore + (Math.random() - 0.5) * 0.03)
          );
          this.agents.set(id, {
            ...agent,
            coherenceScore: newCoherence,
            lastActive: new Date(),
          });
        }
      });

      // Emit metrics update
      this.emit({
        type: 'system:metrics',
        payload: this.getMetrics(),
        timestamp: new Date(),
      });
    }, this.calibration.syncInterval);
  }

  // Subscribe to events
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
      this.addLog('info', 'Orchestrator', `${agent.name} status changed to ${status}`);
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
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.push(newTask);
    this.emit({ type: 'task:create', payload: newTask, timestamp: new Date() });
    this.addLog('info', 'Orchestrator', `Task created: ${newTask.title}`);

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
      this.addLog('success', 'Orchestrator', `Task completed: ${task.title}`);
    }
  }

  // Real AI invocation
  async invokeAgent(agentId: string, prompt: string): Promise<string> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const provider = this.providers.get(agent.provider);
    if (!provider) {
      throw new Error(`Provider ${agent.provider} not found`);
    }

    if (agent.status !== 'online') {
      throw new Error(`Agent ${agent.name} is not online (status: ${agent.status})`);
    }

    this.updateAgentStatus(agentId, 'busy');
    this.addLog('info', agent.name, `Processing query...`);

    try {
      const response = await provider.chat(
        [{ role: 'user', content: prompt }],
        {
          model: agent.model,
          maxTokens: agent.maxTokens,
          temperature: agent.temperature,
        }
      );

      // Update agent stats
      const updatedAgent = this.agents.get(agentId)!;
      this.agents.set(agentId, {
        ...updatedAgent,
        messageCount: updatedAgent.messageCount + 1,
        lastActive: new Date(),
      });

      this.updateAgentStatus(agentId, 'online');
      this.addLog('success', agent.name, `Response generated (${response.length} chars)`);

      return response;
    } catch (err) {
      this.updateAgentStatus(agentId, 'error');
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.addLog('error', agent.name, `Error: ${errorMessage}`);
      throw err;
    }
  }

  // Multi-agent braid invocation
  async braidInvoke(query: string, agentIds?: string[]): Promise<{
    responses: Array<{ agentId: string; agentName: string; response: string; error?: string }>;
    coherence: number;
    duration: number;
  }> {
    const startTime = Date.now();
    const targetAgents = agentIds
      ? agentIds.map((id) => this.agents.get(id)).filter((a): a is Agent => !!a && a.status === 'online')
      : this.getAgents().filter((a) => a.status === 'online');

    if (targetAgents.length === 0) {
      this.addLog('warning', 'Orchestrator', 'No agents available for braid invocation');
      return { responses: [], coherence: 0, duration: Date.now() - startTime };
    }

    this.addLog('info', 'Orchestrator', `Braid invocation started with ${targetAgents.length} agents`);

    // Create task for tracking
    const task = this.createTask({
      title: 'Braid Invocation',
      description: query.substring(0, 100),
      priority: 'high',
      status: 'in_progress',
      assignedAgents: targetAgents.map((a) => a.id),
    });

    // Invoke all agents in parallel
    const results = await Promise.all(
      targetAgents.map(async (agent) => {
        try {
          const response = await this.invokeAgent(agent.id, query);

          // Update connection strengths
          targetAgents.forEach((otherAgent) => {
            if (otherAgent.id !== agent.id) {
              const connIndex = this.connections.findIndex(
                (c) =>
                  (c.sourceId === agent.id && c.targetId === otherAgent.id) ||
                  (c.sourceId === otherAgent.id && c.targetId === agent.id)
              );
              if (connIndex !== -1) {
                this.connections[connIndex] = {
                  ...this.connections[connIndex],
                  messageCount: this.connections[connIndex].messageCount + 1,
                  strength: Math.min(1, this.connections[connIndex].strength + 0.02),
                  lastMessage: new Date(),
                };
              }
            }
          });

          return {
            agentId: agent.id,
            agentName: agent.name,
            response,
          };
        } catch (err) {
          return {
            agentId: agent.id,
            agentName: agent.name,
            response: '',
            error: err instanceof Error ? err.message : 'Unknown error',
          };
        }
      })
    );

    const duration = Date.now() - startTime;
    const coherence = this.getMetrics().globalCoherence;

    // Complete the task
    const successfulResponses = results.filter((r) => !r.error);
    this.completeTask(
      task.id,
      `${successfulResponses.length}/${results.length} agents responded successfully`
    );

    this.addLog(
      'success',
      'Orchestrator',
      `Braid invocation complete: ${successfulResponses.length}/${results.length} responses in ${duration}ms`
    );

    return { responses: results, coherence, duration };
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

    // Emit log event
    this.emit({
      type: 'message:receive' as any,
      payload: entry,
      timestamp: new Date(),
    });
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
      totalMessages: this.messages.length + agents.reduce((sum, a) => sum + a.messageCount, 0),
      totalTasks: this.tasks.length,
      completedTasks: this.tasks.filter((t) => t.status === 'completed').length,
      globalCoherence:
        agents.filter(a => a.status === 'online').reduce((sum, a) => sum + a.coherenceScore, 0) /
        Math.max(1, agents.filter(a => a.status === 'online').length),
      uptime: Date.now() - this.startTime,
    };
  }

  // Calibration
  getCalibration(): CalibrationSettings {
    return { ...this.calibration };
  }

  updateCalibration(updates: Partial<CalibrationSettings>): void {
    this.calibration = { ...this.calibration, ...updates };

    // Restart metrics interval with new sync rate
    if (updates.syncInterval) {
      this.startMetricsUpdates();
    }

    this.emit({ type: 'system:calibrate', payload: this.calibration, timestamp: new Date() });
    this.addLog('info', 'Orchestrator', 'Calibration settings updated');
  }

  // Cleanup
  shutdown(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    this.addLog('info', 'Orchestrator', 'Shutting down...');
  }
}
