import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { processElo } from "./process-elo";

const QUEUE_NAME = "elo-recalc";

export function createEloQueue(redisUrl: string) {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  return new Queue(QUEUE_NAME, { connection });
}

export function createEloWorker(redisUrl: string) {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  return new Worker(
    QUEUE_NAME,
    async (job: Job<{ matchId: string }>) => {
      await processElo(job.data.matchId);
    },
    { connection, concurrency: 1 }
  );
}
