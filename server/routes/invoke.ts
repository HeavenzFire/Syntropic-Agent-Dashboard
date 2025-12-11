// Invoke routes - REST API for agent invocation
import { Router } from 'express';
import type { AgentOrchestrator } from '../orchestrator';

export function invokeRoutes(orchestrator: AgentOrchestrator): Router {
  const router = Router();

  // Braid invoke - query multiple agents
  router.post('/braid', async (req, res) => {
    try {
      const { query, agentIds } = req.body;

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      // Validate agent IDs if provided
      if (agentIds && Array.isArray(agentIds)) {
        const agents = orchestrator.getAgents();
        const validIds = agents.map((a) => a.id);
        const invalidIds = agentIds.filter((id: string) => !validIds.includes(id));

        if (invalidIds.length > 0) {
          return res.status(400).json({
            error: `Invalid agent IDs: ${invalidIds.join(', ')}`,
          });
        }

        const unavailable = agentIds.filter((id: string) => {
          const agent = agents.find((a) => a.id === id);
          return agent && agent.status !== 'online';
        });

        if (unavailable.length > 0) {
          return res.status(400).json({
            error: `Agents not online: ${unavailable.join(', ')}`,
          });
        }
      }

      const result = await orchestrator.braidInvoke(query, agentIds);
      res.json(result);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to invoke braid',
      });
    }
  });

  // Invoke single agent
  router.post('/single', async (req, res) => {
    try {
      const { agentId, query } = req.body;

      if (!agentId) {
        return res.status(400).json({ error: 'Agent ID is required' });
      }

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const agent = orchestrator.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      if (agent.status !== 'online') {
        return res.status(400).json({
          error: `Agent is not online (status: ${agent.status})`,
        });
      }

      const startTime = Date.now();
      const response = await orchestrator.invokeAgent(agentId, query);
      const duration = Date.now() - startTime;

      res.json({
        agentId: agent.id,
        agentName: agent.name,
        response,
        duration,
        timestamp: new Date(),
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to invoke agent',
      });
    }
  });

  // Get logs
  router.get('/logs', (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = orchestrator.getLogs(limit);
      res.json(logs);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to get logs',
      });
    }
  });

  // Update calibration
  router.patch('/calibration', (req, res) => {
    try {
      const { syncInterval, coherenceThreshold, maxConcurrentTasks, autoReconnect, logLevel } = req.body;

      const updates: Record<string, any> = {};

      if (syncInterval !== undefined) {
        if (typeof syncInterval !== 'number' || syncInterval < 1000 || syncInterval > 60000) {
          return res.status(400).json({
            error: 'syncInterval must be a number between 1000 and 60000',
          });
        }
        updates.syncInterval = syncInterval;
      }

      if (coherenceThreshold !== undefined) {
        if (typeof coherenceThreshold !== 'number' || coherenceThreshold < 0 || coherenceThreshold > 1) {
          return res.status(400).json({
            error: 'coherenceThreshold must be a number between 0 and 1',
          });
        }
        updates.coherenceThreshold = coherenceThreshold;
      }

      if (maxConcurrentTasks !== undefined) {
        if (typeof maxConcurrentTasks !== 'number' || maxConcurrentTasks < 1 || maxConcurrentTasks > 50) {
          return res.status(400).json({
            error: 'maxConcurrentTasks must be a number between 1 and 50',
          });
        }
        updates.maxConcurrentTasks = maxConcurrentTasks;
      }

      if (autoReconnect !== undefined) {
        updates.autoReconnect = Boolean(autoReconnect);
      }

      if (logLevel !== undefined) {
        const validLevels = ['debug', 'info', 'warning', 'error'];
        if (!validLevels.includes(logLevel)) {
          return res.status(400).json({
            error: `logLevel must be one of: ${validLevels.join(', ')}`,
          });
        }
        updates.logLevel = logLevel;
      }

      orchestrator.updateCalibration(updates);
      res.json(orchestrator.getCalibration());
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to update calibration',
      });
    }
  });

  // Get calibration
  router.get('/calibration', (req, res) => {
    try {
      res.json(orchestrator.getCalibration());
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to get calibration',
      });
    }
  });

  return router;
}
