import { getOrGenerateDailySharedDevotional } from '../../src/server/devotionalService.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');

  try {
    const result = await getOrGenerateDailySharedDevotional();
    return res.status(200).json({
      success: true,
      devotional: result.devotional,
      source: result.source,
      publishDate: result.publishDate
    });
  } catch (error: any) {
    console.error('Error fetching today devotional:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Error fetching today devotional'
    });
  }
}
