import { db } from '../../db/index.js';

export function getDashboardMetrics() {
  const tasks = db.prepare('SELECT status, priority FROM tasks').all() as Array<{ status: string; priority: string }>;
  const files = db.prepare("SELECT COUNT(*) as total FROM files WHERE status != 'trash'").get() as { total: number };

  const completed = tasks.filter((t) => t.status === 'completed').length;
  const total = tasks.length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const urgent = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length;
  const high = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length;
  const mediumLow = pending - urgent - high;

  return {
    tasksCompleted: completed,
    tasksTotal: total || 1,
    efficiency: total ? Math.round((completed / total) * 100) : 0,
    timeSaved: Number(((completed / (total || 1)) * 8).toFixed(1)),
    filesProcessed: files.total,
    pendingTasks: pending,
    pendingBreakdown: `${urgent} urgentes · ${high} medias · ${Math.max(0, mediumLow)} baixas`,
  };
}
