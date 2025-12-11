// WebSocketClient - Real-time connection to backend server
import type { HubEvent, Agent, Task, SystemMetrics, CalibrationSettings } from '../types';

type EventHandler = (event: HubEvent) => void;
type ConnectionHandler = (connected: boolean) => void;

interface InitialState {
  agents: Agent[];
  tasks: Task[];
  metrics: SystemMetrics;
  calibration: CalibrationSettings;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private eventHandlers: Set<EventHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private reconnectTimer: number | null = null;
  private isIntentionalClose = false;
  private initialState: InitialState | null = null;

  constructor(url?: string) {
    this.url = url || `ws://${window.location.hostname}:3001/ws`;
  }

  connect(): Promise<InitialState> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        if (this.initialState) {
          resolve(this.initialState);
        }
        return;
      }

      this.isIntentionalClose = false;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Handle initial state
            if (data.type === 'system:init') {
              this.initialState = data.payload as InitialState;
              resolve(this.initialState);
            }

            // Broadcast to all handlers
            this.eventHandlers.forEach((handler) => handler(data));
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.notifyConnectionHandlers(false);

          if (!this.isIntentionalClose) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(new Error('WebSocket connection failed'));
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  disconnect(): void {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = window.setTimeout(() => {
      this.connect().catch((err) => {
        console.error('Reconnect failed:', err);
      });
    }, delay);
  }

  send(message: { type: string; [key: string]: unknown }): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }

  // Update agent status
  updateAgentStatus(agentId: string, status: Agent['status']): void {
    this.send({ type: 'agent:status', agentId, status });
  }

  // Invoke braid
  async invokeBraid(query: string, agentIds?: string[]): Promise<void> {
    this.send({ type: 'invoke:braid', query, agentIds });
  }

  // Create task
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): void {
    this.send({ type: 'task:create', task });
  }

  // Update calibration
  updateCalibration(settings: Partial<CalibrationSettings>): void {
    this.send({ type: 'calibration:update', settings });
  }

  // Subscribe to events
  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  // Subscribe to connection state changes
  onConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => handler(connected));
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();
export default WebSocketClient;
