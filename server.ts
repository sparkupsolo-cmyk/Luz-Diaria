import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { 
  getOrGenerateDailySharedDevotional, 
  getSaoPauloDate,
  fetchDailyFromSupabase,
  getServerSupabaseClient
} from './src/server/devotionalService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API: Today's Shared Devotional (America/Sao_Paulo)
app.get('/api/devotional/today', async (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
  try {
    const result = await getOrGenerateDailySharedDevotional();
    res.json({
      success: true,
      devotional: result.devotional,
      source: result.source,
      publishDate: result.publishDate
    });
  } catch (error: any) {
    console.error('Error in /api/devotional/today:', error);
    res.status(500).json({ success: false, error: error?.message });
  }
});

// API: Daily Devotional Cron Job (Protected with CRON_SECRET)
app.get('/api/cron/daily-devotional', async (req: Request, res: Response) => {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const currentDateBRT = getSaoPauloDate();

  // Regra 5: O Cron NÃO pode substituir um devocional que já foi publicado naquele dia.
  const supabase = getServerSupabaseClient();
  if (supabase) {
    const existing = await fetchDailyFromSupabase(supabase, currentDateBRT);
    if (existing) {
      console.log(`[Cron] Devocional já existe no Supabase para ${currentDateBRT}. Nenhuma nova geração necessária.`);
      return res.json({
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
    res.json({
      success: true,
      message: `Daily devotional processed for ${result.publishDate}`,
      source: result.source,
      title: result.devotional.title,
      reference: result.devotional.reference
    });
  } catch (error: any) {
    console.error('Error in /api/cron/daily-devotional:', error);
    res.status(500).json({ success: false, error: error?.message });
  }
});

// API: /api/devotional/generate (Deactivated: Architecture refactored to single daily shared devotional)
app.all('/api/devotional/generate', (_req: Request, res: Response) => {
  res.status(410).json({
    success: false,
    error: 'A geração manual sob demanda foi desativada. O aplicativo utiliza exclusivamente o devocional diário compartilhado por todos os usuários em /api/devotional/today.'
  });
});

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Luz Diária Devocionais API' });
});

// Integrate Vite dev server in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Luz Diária Server running on port ${PORT}`);
  });
}

startServer();
