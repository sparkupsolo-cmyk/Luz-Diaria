import { getOrGenerateDailySharedDevotional, getSaoPauloDate } from '../../src/server/devotionalService';

export default async function handler(req: any, res: any) {
  // 1. Verify Vercel Cron Secret if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const expectedAuth = `Bearer ${cronSecret}`;
    if (authHeader !== expectedAuth) {
      console.warn('Unauthorized attempt to trigger daily devotional cron job.');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const currentDateBRT = getSaoPauloDate();
  console.log(`[Vercel Cron] Running daily devotional task for date: ${currentDateBRT} (America/Sao_Paulo)`);

  try {
    const result = await getOrGenerateDailySharedDevotional();
    return res.status(200).json({
      success: true,
      message: `Daily devotional processed for ${result.publishDate}`,
      source: result.source,
      title: result.devotional.title,
      reference: result.devotional.reference
    });
  } catch (error: any) {
    console.error('[Vercel Cron] Error processing daily devotional:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Error executing daily devotional cron'
    });
  }
}
