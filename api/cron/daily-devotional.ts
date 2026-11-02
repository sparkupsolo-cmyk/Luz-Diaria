import { 
  getOrGenerateDailySharedDevotional, 
  getSaoPauloDate,
  fetchDailyFromSupabase,
  getServerSupabaseClient
} from '../../src/server/devotionalService.js';

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
  console.log(`[Vercel Cron] Executando rotina diária para a data: ${currentDateBRT} (America/Sao_Paulo)`);

  // Regra 5: O Cron NÃO pode substituir um devocional que já foi publicado naquele dia.
  const supabase = getServerSupabaseClient();
  if (supabase) {
    const existing = await fetchDailyFromSupabase(supabase, currentDateBRT);
    if (existing) {
      console.log(`[Vercel Cron] Devocional já existe no Supabase para ${currentDateBRT}. Nenhuma nova geração necessária.`);
      return res.status(200).json({
        success: true,
        message: `Devocional oficial de ${currentDateBRT} já está publicado e imutável no Supabase.`,
        source: 'supabase_already_published',
        title: existing.title,
        reference: existing.reference
      });
    }
  }

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
