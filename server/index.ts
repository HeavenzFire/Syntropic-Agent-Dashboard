// Server entry point - Express + WebSocket for real-time agent coordination
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { AgentOrchestrator } from './orchestrator';
import { agentRoutes } from './routes/agents';
import { taskRoutes } from './routes/tasks';
import { invokeRoutes } from './routes/invoke';
import type { HubEvent } from '../types';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Middleware
app.use(cors());
app.use(express.json());

// Initialize orchestrator
const orchestrator = new AgentOrchestrator();

// Store connected clients
const clients = new Set<WebSocket>();

// Broadcast to all connected clients
function broadcast(event: HubEvent): void {
  const message = JSON.stringify(event);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Subscribe orchestrator events to WebSocket broadcast
orchestrator.subscribe((event) => {
  broadcast(event);
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`Client connected. Total clients: ${clients.size}`);

  // Send initial state
  ws.send(JSON.stringify({
    type: 'system:init',
    payload: {
      agents: orchestrator.getAgents(),
      tasks: orchestrator.getTasks(),
      metrics: orchestrator.getMetrics(),
      calibration: orchestrator.getCalibration(),
    },
    timestamp: new Date(),
  }));

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'agent:status':
          orchestrator.updateAgentStatus(message.agentId, message.status);
          break;
        case 'invoke:braid':
          const result = await orchestrator.braidInvoke(message.query, message.agentIds);
          ws.send(JSON.stringify({
            type: 'invoke:result',
            payload: result,
            timestamp: new Date(),
          }));
          break;
        case 'task:create':
          orchestrator.createTask(message.task);
          break;
        case 'calibration:update':
          orchestrator.updateCalibration(message.settings);
          break;
      }
    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Client disconnected. Total clients: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    clients.delete(ws);
  });
});

// REST API routes
app.use('/api/agents', agentRoutes(orchestrator));
app.use('/api/tasks', taskRoutes(orchestrator));
app.use('/api/invoke', invokeRoutes(orchestrator));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    agents: orchestrator.getAgents().length,
    activeAgents: orchestrator.getAgents().filter(a => a.status === 'online').length,
    connectedClients: clients.size,
    uptime: process.uptime(),
  });
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  res.json(orchestrator.getMetrics());
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║         Syntropic Agent Hub - Backend Server         ║
╠══════════════════════════════════════════════════════╣
║  REST API:    http://localhost:${PORT}/api            ║
║  WebSocket:   ws://localhost:${PORT}/ws               ║
║  Health:      http://localhost:${PORT}/api/health     ║
╚══════════════════════════════════════════════════════╝
  `);

  // Initialize agents
  orchestrator.initializeAgents();
});

export { app, server, orchestrator };
