// Core Types for Syntropic Agent Dashboard

// Agent status states
export type AgentStatus = 'online' | 'offline' | 'busy' | 'error' | 'initializing';

// Supported AI providers
export type AgentProvider = 'openai' | 'anthropic' | 'google' | 'xai' | 'local' | 'custom';

// Message roles in conversations
export type MessageRole = 'user' | 'assistant' | 'system';

// Task priority levels
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

// Task status
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

// Agent configuration
export interface AgentConfig {
  id: string;
  name: string;
  provider: AgentProvider;
  model: string;
  description: string;
  capabilities: string[];
  frequency: number; // Resonance frequency for visualization
  color: string;
  apiEndpoint?: string;
  maxTokens?: number;
  temperature?: number;
}

// Agent instance with runtime state
export interface Agent extends AgentConfig {
  status: AgentStatus;
  lastActive: Date;
  messageCount: number;
  taskCount: number;
  coherenceScore: number; // 0-1 system health metric
  connections: string[]; // IDs of connected agents
}

// Message structure
export interface Message {
  id: string;
  agentId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Task for agent orchestration
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedAgents: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  result?: string;
  subtasks?: Task[];
}

// Connection between agents
export interface AgentConnection {
  sourceId: string;
  targetId: string;
  strength: number; // 0-1 connection strength
  messageCount: number;
  lastMessage?: Date;
}

// System metrics
export interface SystemMetrics {
  totalAgents: number;
  activeAgents: number;
  totalMessages: number;
  totalTasks: number;
  completedTasks: number;
  globalCoherence: number;
  uptime: number;
}

// Log entry for mission log
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  source: string;
  message: string;
  details?: Record<string, unknown>;
}

// Calibration settings
export interface CalibrationSettings {
  syncInterval: number;
  coherenceThreshold: number;
  maxConcurrentTasks: number;
  autoReconnect: boolean;
  logLevel: 'debug' | 'info' | 'warning' | 'error';
}

// Network node for visualization
export interface NetworkNode {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  status: AgentStatus;
  pulseIntensity: number;
}

// Network edge for visualization
export interface NetworkEdge {
  source: string;
  target: string;
  strength: number;
  active: boolean;
}

// Event types for WebSocket communication
export type EventType =
  | 'agent:connect'
  | 'agent:disconnect'
  | 'agent:status'
  | 'message:send'
  | 'message:receive'
  | 'task:create'
  | 'task:update'
  | 'task:complete'
  | 'system:metrics'
  | 'system:calibrate';

// WebSocket event structure
export interface HubEvent {
  type: EventType;
  payload: unknown;
  timestamp: Date;
  sourceAgent?: string;
  targetAgent?: string;
}

// Dashboard view state
export interface DashboardState {
  agents: Agent[];
  tasks: Task[];
  logs: LogEntry[];
  metrics: SystemMetrics;
  calibration: CalibrationSettings;
  selectedAgent: string | null;
  selectedTask: string | null;
}
