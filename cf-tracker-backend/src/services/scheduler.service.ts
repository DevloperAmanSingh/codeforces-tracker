import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { syncContestHistory } from "./cf.service";
import { getProblemSolvingStats } from "./cf.service";
import { sendReminderEmail } from "./email.service";

let scheduledTask: cron.ScheduledTask | null = null;

export const initScheduler = async () => {
  const settings = await getCronSettings();
  scheduleJob(settings.cronExpression, settings.enabled);
};

export const rescheduleCron = async (
  cronExpression: string,
  enabled: boolean
) => {
  // Update DB
  await prisma.adminSettings.upsert({
    where: { id: "singleton" },
    update: { cronExpression, enabled },
    create: { cronExpression, enabled, id: undefined as unknown as string },
  });
  // Reschedule job
  scheduleJob(cronExpression, enabled);
};

const scheduleJob = (cronExpression: string, enabled: boolean) => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
  if (!enabled) return;
  scheduledTask = cron.schedule(cronExpression, async () => {
    console.log("Running scheduled Codeforces sync job...");
    await runDailySync();
  });
  console.log(`Scheduler initialized with cron: ${cronExpression}`);
};

const runDailySync = async () => {
  const students = await prisma.student.findMany();
  for (const student of students) {
    if (!student.cfHandle) continue;
    try {
      await syncContestHistory(student.cfHandle, student.id);
      // After sync, check activity in last 7 days
      const stats = await getProblemSolvingStats(student.id, 7);
      if (
        stats.totalProblemsSolved === 0 &&
        student.autoReminder &&
        student.email
      ) {
        await sendReminderEmail(student.email, student.name);
        await prisma.student.update({
          where: { id: student.id },
          data: { remindersSent: student.remindersSent + 1 },
        });
      }
    } catch (error) {
      console.error(`Failed to sync for student ${student.id}:`, error);
    }
  }
};

const getCronSettings = async () => {
  const settings = await prisma.adminSettings.findFirst();
  if (settings) return settings;
  return { cronExpression: "0 2 * * *", enabled: true };
};

export const manualRun = async () => {
  await runDailySync();
};
