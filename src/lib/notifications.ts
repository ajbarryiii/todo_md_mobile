import * as Notifications from 'expo-notifications';
import type { TodoItem } from './markdown';

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_RE = /^(\d{4})-(\d{2})-(\d{2})\s(\d{1,2}):(\d{2})\s(AM|PM)$/i;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function parseDueDate(dueDate: string): { dueAt: Date; hasTime: boolean } | null {
  const dateTimeMatch = dueDate.match(DATE_TIME_RE);
  if (dateTimeMatch) {
    const [, year, month, day, hourRaw, minute, periodRaw] = dateTimeMatch;
    let hour = Number(hourRaw);
    const period = periodRaw.toUpperCase();
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    }
    if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    const dueAt = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      hour,
      Number(minute),
      0,
      0,
    );

    if (Number.isNaN(dueAt.getTime())) {
      return null;
    }
    return { dueAt, hasTime: true };
  }

  const dateOnlyMatch = dueDate.match(DATE_ONLY_RE);
  if (!dateOnlyMatch) {
    return null;
  }

  const [, year, month, day] = dateOnlyMatch;
  const dueAt = new Date(Number(year), Number(month) - 1, Number(day), 9, 0, 0, 0);
  if (Number.isNaN(dueAt.getTime())) {
    return null;
  }
  return { dueAt, hasTime: false };
}

function buildReminderDate(dueAt: Date, hasTime: boolean): Date | null {
  const now = Date.now();
  if (dueAt.getTime() <= now) {
    return null;
  }

  if (hasTime) {
    const thirtyMinutesBefore = new Date(dueAt.getTime() - 30 * 60 * 1000);
    if (thirtyMinutesBefore.getTime() > now) {
      return thirtyMinutesBefore;
    }
    return dueAt;
  }

  const eveningBefore = new Date(dueAt);
  eveningBefore.setDate(eveningBefore.getDate() - 1);
  eveningBefore.setHours(18, 0, 0, 0);
  if (eveningBefore.getTime() > now) {
    return eveningBefore;
  }

  return dueAt;
}

async function ensurePermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function clearUpcomingTaskNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleUpcomingTaskNotifications(todos: TodoItem[]): Promise<void> {
  await clearUpcomingTaskNotifications();

  const reminders = todos
    .filter(todo => !todo.done && !!todo.dueDate)
    .map(todo => {
      const parsed = parseDueDate(todo.dueDate as string);
      if (!parsed) {
        return null;
      }
      const reminderAt = buildReminderDate(parsed.dueAt, parsed.hasTime);
      if (!reminderAt) {
        return null;
      }
      return { todo, reminderAt };
    })
    .filter((item): item is { todo: TodoItem; reminderAt: Date } => item !== null);

  if (reminders.length === 0) {
    return;
  }

  const hasPermission = await ensurePermission();
  if (!hasPermission) {
    return;
  }

  await Promise.all(
    reminders.map(({ todo, reminderAt }) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Upcoming task',
          body: `"${todo.name}" is due ${todo.dueDate}`,
          sound: 'default',
          data: { todoId: todo.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderAt,
        },
      }),
    ),
  );
}
