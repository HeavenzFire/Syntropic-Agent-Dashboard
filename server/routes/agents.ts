// Agent routes - REST API for agent management
import { Router } from 'express';
import type { AgentOrchestrator } from '../orchestrator';

export function agentRoutes(orchestrator: AgentOrchestrator): Router {
  const router = Router();

  // Get all agents
  router.get('/', (req, res) => {
    try {
      const agents = orchestrator.getAgents();
      res.json(agents);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to get agents',
      });
    }
  });

  // Get single agent
  router.get('/:id', (req, res) => {
    try {
      const agent = orchestrator.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      res.json(agent);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to get agent',
      });
    }
  });

  // Update agent status
  router.patch('/:id/status', (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const validStatuses = ['online', 'offline', 'busy', 'error', 'initializing'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }

      orchestrator.updateAgentStatus(req.params.id, status);
      const agent = orchestrator.getAgent(req.params.id);
      res.json(agent);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to update agent status',
      });
    }
  });

  // Chat with single agent
  router.post('/:id/chat', async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const agent = orchestrator.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      if (agent.status !== 'online') {
        return res.status(400).json({
          error: `Agent is not online (status: ${agent.status})`,
        });
      }

      const response = await orchestrator.invokeAgent(req.params.id, message);
      res.json({
        agentId: agent.id,
        agentName: agent.name,
        response,
        timestamp: new Date(),
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to chat with agent',
      });
    }
  });

  // Get connections for agent
  router.get('/:id/connections', (req, res) => {
    try {
      const agent = orchestrator.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const connections = orchestrator.getConnections().filter(
        (c) => c.sourceId === req.params.id || c.targetId === req.params.id
      );

      res.json(connections);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to get connections',
      });
    }
  });

  // Get all connections
  router.get('/network/connections', (req, res) => {
    try {
      const connections = orchestrator.getConnections();
      res.json(connections);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to get connections',
      });
    }
  });

  return router;
}
