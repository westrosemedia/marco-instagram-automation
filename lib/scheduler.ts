import { format, addHours, addDays, isAfter, isBefore } from 'date-fns';

export function shouldRunNow() {
  // simple ten minute cadence
  const now = new Date();
  const minutes = now.getUTCMinutes();
  return minutes % 10 === 0;
}

export interface ScheduledTask {
  id: string;
  type: 'comment' | 'message' | 'like' | 'follow' | 'unfollow';
  targetId: string;
  content?: string;
  scheduledFor: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
}

export interface ScheduleConfig {
  workingHours: {
    start: number; // 0-23
    end: number;   // 0-23
  };
  timezone: string;
  maxActionsPerHour: number;
  maxActionsPerDay: number;
  delayBetweenActions: number; // minutes
}

export class SchedulerService {
  private tasks: ScheduledTask[] = [];
  private config: ScheduleConfig;

  constructor(config?: Partial<ScheduleConfig>) {
    this.config = {
      workingHours: { start: 9, end: 17 },
      timezone: 'UTC',
      maxActionsPerHour: 10,
      maxActionsPerDay: 50,
      delayBetweenActions: 5,
      ...config,
    };
  }

  scheduleTask(task: Omit<ScheduledTask, 'id' | 'status' | 'retryCount'>): string {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const scheduledTask: ScheduledTask = {
      ...task,
      id,
      status: 'pending',
      retryCount: 0,
    };

    // Optimize scheduling time based on working hours and rate limits
    scheduledTask.scheduledFor = this.optimizeScheduleTime(scheduledTask.scheduledFor);

    this.tasks.push(scheduledTask);
    return id;
  }

  private optimizeScheduleTime(requestedTime: Date): Date {
    const now = new Date();
    let optimizedTime = new Date(requestedTime);

    // Ensure it's not in the past
    if (isBefore(optimizedTime, now)) {
      optimizedTime = addHours(now, 1);
    }

    // Check if it's within working hours
    const hour = optimizedTime.getHours();
    if (hour < this.config.workingHours.start || hour >= this.config.workingHours.end) {
      // Move to next working day
      optimizedTime = addDays(optimizedTime, 1);
      optimizedTime.setHours(this.config.workingHours.start, 0, 0, 0);
    }

    // Check rate limits
    optimizedTime = this.adjustForRateLimits(optimizedTime);

    return optimizedTime;
  }

  private adjustForRateLimits(scheduledTime: Date): Date {
    const tasksInSameHour = this.getTasksInTimeRange(
      scheduledTime,
      addHours(scheduledTime, 1)
    );

    const tasksInSameDay = this.getTasksInTimeRange(
      new Date(scheduledTime.getFullYear(), scheduledTime.getMonth(), scheduledTime.getDate()),
      addDays(scheduledTime, 1)
    );

    // If we've hit hourly limit, move to next hour
    if (tasksInSameHour.length >= this.config.maxActionsPerHour) {
      scheduledTime = addHours(scheduledTime, 1);
      scheduledTime.setMinutes(0, 0, 0);
    }

    // If we've hit daily limit, move to next day
    if (tasksInSameDay.length >= this.config.maxActionsPerDay) {
      scheduledTime = addDays(scheduledTime, 1);
      scheduledTime.setHours(this.config.workingHours.start, 0, 0, 0);
    }

    return scheduledTime;
  }

  private getTasksInTimeRange(start: Date, end: Date): ScheduledTask[] {
    return this.tasks.filter(task => 
      isAfter(task.scheduledFor, start) && isBefore(task.scheduledFor, end)
    );
  }

  getPendingTasks(): ScheduledTask[] {
    return this.tasks
      .filter(task => task.status === 'pending')
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  }

  getTasksForExecution(): ScheduledTask[] {
    const now = new Date();
    return this.tasks.filter(task => 
      task.status === 'pending' && 
      isBefore(task.scheduledFor, now)
    );
  }

  markTaskAsRunning(taskId: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'running';
    }
  }

  markTaskAsCompleted(taskId: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
    }
  }

  markTaskAsFailed(taskId: string, shouldRetry: boolean = true): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.retryCount++;
      
      if (shouldRetry && task.retryCount < task.maxRetries) {
        // Reschedule for retry with exponential backoff
        const retryDelay = Math.pow(2, task.retryCount) * 30; // 30, 60, 120 minutes
        task.scheduledFor = addHours(new Date(), retryDelay);
        task.status = 'pending';
      } else {
        task.status = 'failed';
      }
    }
  }

  getTaskStats(): {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  } {
    return {
      total: this.tasks.length,
      pending: this.tasks.filter(t => t.status === 'pending').length,
      running: this.tasks.filter(t => t.status === 'running').length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
      failed: this.tasks.filter(t => t.status === 'failed').length,
    };
  }

  getUpcomingTasks(limit: number = 10): ScheduledTask[] {
    return this.tasks
      .filter(task => task.status === 'pending')
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())
      .slice(0, limit);
  }

  cancelTask(taskId: string): boolean {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1 && this.tasks[taskIndex].status === 'pending') {
      this.tasks.splice(taskIndex, 1);
      return true;
    }
    return false;
  }

  clearCompletedTasks(): void {
    this.tasks = this.tasks.filter(task => task.status !== 'completed');
  }

  // Generate a schedule for bulk actions
  generateBulkSchedule(
    actions: Array<{ type: ScheduledTask['type']; targetId: string; content?: string }>,
    startTime?: Date
  ): string[] {
    const taskIds: string[] = [];
    const baseTime = startTime || new Date();

    actions.forEach((action, index) => {
      const delay = index * this.config.delayBetweenActions;
      const scheduledTime = addHours(baseTime, delay / 60);

      const taskId = this.scheduleTask({
        type: action.type,
        targetId: action.targetId,
        content: action.content,
        scheduledFor: scheduledTime,
        maxRetries: 3,
      });

      taskIds.push(taskId);
    });

    return taskIds;
  }
}
