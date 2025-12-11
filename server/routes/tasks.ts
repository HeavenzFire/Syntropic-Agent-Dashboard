// Task routes - REST API for task management
import { Router } from 'express';
import type { AgentOrchestrator } from '../orchestrator';

export function taskRoutes(orchestrator: AgentOrchestrator): Router {
  const router = Router();

  // Get all tasks
  router.get('/', (req, res) => {
    try {
      const tasks = orchestrator.getTasks();

      // Optional filtering
      const { status, priority, agentId } = req.query;

      let filtered = tasks;

      if (status) {
        filtered = filtered.filter((t) => t.status === status);
      }

      if (priority) {
        filtered = filtered.filter((t) => t.priority === priority);
      }

      if (agentId) {
        filtered = filtered.filter((t) =>
          t.assignedAgents.includes(agentId as string)
        );
      }

      res.json(filtered);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to get tasks',
      });
    }
  });

  // Get single task
  router.get('/:id', (req, res) => {
    try {
      const tasks = orchestrator.getTasks();
      const task = tasks.find((t) => t.id === req.params.id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to get task',
      });
    }
  });

  // Create new task
  router.post('/', (req, res) => {
    try {
      const { title, description, priority, assignedAgents } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const validPriorities = ['critical', 'high', 'medium', 'low'];
      if (priority && !validPriorities.includes(priority)) {
        return res.status(400).json({
          error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
        });
      }

      // Validate assigned agents
      if (assignedAgents && Array.isArray(assignedAgents)) {
        const agents = orchestrator.getAgents();
        const agentIds = agents.map((a) => a.id);
        const invalidAgents = assignedAgents.filter((id: string) => !agentIds.includes(id));

        if (invalidAgents.length > 0) {
          return res.status(400).json({
            error: `Invalid agent IDs: ${invalidAgents.join(', ')}`,
          });
        }
      }

      const task = orchestrator.createTask({
        title,
        description: description || '',
        priority: priority || 'medium',
        status: 'pending',
        assignedAgents: assignedAgents || [],
      });

      res.status(201).json(task);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to create task',
      });
    }
  });

  // Update task
  router.patch('/:id', (req, res) => {
    try {
      const tasks = orchestrator.getTasks();
      const task = tasks.find((t) => t.id === req.params.id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const { title, description, priority, status, assignedAgents } = req.body;

      const updates: Record<string, any> = {};

      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (priority !== undefined) {
        const validPriorities = ['critical', 'high', 'medium', 'low'];
        if (!validPriorities.includes(priority)) {
          return res.status(400).json({
            error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`,
          });
        }
        updates.priority = priority;
      }
      if (status !== undefined) {
        const validStatuses = ['pending', 'in_progress', 'completed', 'failed', 'cancelled'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          });
        }
        updates.status = status;
      }
      if (assignedAgents !== undefined) {
        updates.assignedAgents = assignedAgents;
      }

      orchestrator.updateTask(req.params.id, updates);

      const updatedTask = orchestrator.getTasks().find((t) => t.id === req.params.id);
      res.json(updatedTask);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to update task',
      });
    }
  });

  // Complete task
  router.post('/:id/complete', (req, res) => {
    try {
      const tasks = orchestrator.getTasks();
      const task = tasks.find((t) => t.id === req.params.id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const { result } = req.body;
      orchestrator.completeTask(req.params.id, result);

      const completedTask = orchestrator.getTasks().find((t) => t.id === req.params.id);
      res.json(completedTask);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to complete task',
      });
    }
  });

  return router;
}
