export default async function handler(_req: any, res: any) {
  return res.status(410).json({
    success: false,
    error: 'A geração manual sob demanda foi desativada. O aplicativo utiliza exclusivamente o devocional diário compartilhado por todos os usuários em /api/devotional/today.'
  });
}
