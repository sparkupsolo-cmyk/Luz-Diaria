import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { getOrGenerateDailySharedDevotional } from './src/server/devotionalService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API: Today's Shared Devotional (America/Sao_Paulo)
app.get('/api/devotional/today', async (_req: Request, res: Response) => {
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

// Initialize Gemini SDK with telemetry header
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Fallback generator when API key is missing or quota is exhausted
const generateFallbackDevotional = (theme?: string, customPrompt?: string, isConfronting?: boolean) => {
  const confrontingPool = [
    {
      title: 'A Ilusão de Seguir o Próprio Coração',
      verse: 'Enganoso é o coração, mais do que todas as coisas, e desesperadamente corrupto; quem o conhecerá? Eu, o Senhor, esquadrinho o coração, eu provo os pensamentos.',
      reference: 'Jeremias 17:9-10',
      version: 'ARA',
      theme: 'Quebrantamento & Verdade',
      reflection: 'O mundo moderno nos bombardeia com o mantra sedutor: "siga o seu coração, confie em si mesmo". No entanto, as Escrituras rasgam essa ilusão humanista e revelam a verdade nua: nosso coração sem Deus é inclinado ao egoísmo, à soberba e à autojustificação.\n\nQuando colocamos nossos sentimentos e desejos no trono da nossa vida, nos tornamos idólatras de nós mesmos. Deus não nos chamou para sermos bajulados ou para termos nosso ego massageado; Ele nos chamou para o arrependimento genuíno. A verdadeira liberdade espiritual começa no dia em que admitimos nossa falência moral e dependência absoluta do Senhor.',
      prayer: 'Senhor Deus Santo, desmascara a hipocrisia e o orgulho escondidos nos recessos da minha alma. Não permitas que eu viva na ilusão da minha própria justiça. Quebranta a minha dureza e governa sobre as minhas vontades. Que Cristo cresça e eu diminua. Amém.',
      actionStep: 'Identifique uma área da sua vida onde você tem justificado atitudes carnais com desculpas confortáveis. Confesse isso a Deus hoje com honestidade e dê meia-volta.',
      tags: ['Quebrantamento', 'Arrependimento', 'Humildade', 'Verdade']
    },
    {
      title: 'Tomar a Cruz: A Morte do Eu',
      verse: 'Dizia a todos: Se alguém quer vir após mim, a si mesmo se negue, dia a dia tome a sua cruz e siga-me. Pois quem quiser salvar a sua vida a perderá; mas quem perder a sua vida por minha causa, esse a salvará.',
      reference: 'Lucas 9:23-24',
      version: 'ARA',
      theme: 'Discipulado Radical & Renúncia',
      reflection: 'Muitos procuram em Deus um mero assistente para seus projetos pessoais, alguém que abençoe seus caprichos e garanta conforto terreno. Mas as palavras de Jesus são cortantes como espada: seguir a Cristo não é uma massagem na autoestima, é uma sentença de morte para o ego.\n\nTomar a cruz não significa carregar uma dor de cabeça passageira; significa levar o instrumento de execução da nossa vontade própria. O evangelho não veio para melhorar a sua vida carnal, veio para terminá-la, a fim de que a vida ressurreta de Cristo habite em você. Não existe cristianismo bíblico sem renúncia diária e obediência incondicional.',
      prayer: 'Pai Eterno, perdoa-me pelas vezes em que tentei moldar o Evangelho aos meus caprichos egoístas. Renuncio hoje ao trono da minha existência. Entrego meus direitos, meu orgulho e minhas ambições vãs para viver exclusivamente sob o Teu senhorio. Em nome de Jesus, amém.',
      actionStep: 'Abra mão deliberadamente hoje de uma preferência ou desejo egoísta em favor de servir e abençoar alguém que você tem dificuldade de amar.',
      tags: ['Cruz', 'Renúncia', 'Discipulado', 'Obediência']
    },
    {
      title: 'A Farsa da Religiosidade de Aparência',
      verse: 'Nem todo o que me diz: Senhor, Senhor! entrará no reino dos céus, mas aquele que faz a vontade de meu Pai, que está nos céus. Muitos, naquele dia, hão de dizer-me: Senhor, Senhor! Porventura, não temos nós profetizado em teu nome? (...) Então, lhes direi explicitamente: Nunca vos conheci.',
      reference: 'Mateus 7:21-23',
      version: 'ARA',
      theme: 'Santidade & Temor do Senhor',
      reflection: 'Existe uma tragédia silenciosa nos arraiais religiosos: pessoas que conhecem o vocabulário da fé, frequentam templos e praticam boas obras externas, mas cujo coração permanece intocado pelo temor do Senhor. Elas confiam em sua própria folha de serviços espirituais em vez de viverem em íntima obediência a Deus.\n\nJesus não se impressiona com manifestações barulhentas ou com a aprovação de multidões. Ele busca corações contritos que tremem diante da Sua Palavra e abandonam o pecado em secreto. Não se iluda com uma fé de fachada que agrada aos homens mas não resiste ao olhar de fogo dAquele que tudo vê.',
      prayer: 'Soberano Senhor, sonda o meu íntimo e livra-me do veneno mortal da hipocrisia e do farisaísmo. Que a minha devoção a Ti seja real na intimidade do meu quarto e na retidão das minhas ações secretas. Em nome de Jesus, amém.',
      actionStep: 'Examine sua vida em secreto: existe algum pecado oculto que você tem tolerado enquanto mantém uma aparência piedosa na frente dos outros? Arrependa-se agora diante de Deus.',
      tags: ['Santidade', 'Temor', 'Obediência', 'Integridade']
    }
  ];

  const classicPool = [
    {
      title: 'Renovação da Mente e do Coração',
      verse: 'Não se amoldem ao padrão deste mundo, mas transformem-se pela renovação da sua mente, para que sejam capazes de experimentar e comprovar a boa, agradável e perfeita vontade de Deus.',
      reference: 'Romanos 12:2',
      version: 'NVI',
      theme: theme || 'Renovação & Propósito',
      reflection: 'O mundo ao nosso redor tenta constantemente ditar como devemos pensar, sentir e agir. Somos bombardeados por estímulos que muitas vezes alimentam o medo, a comparação e o imediatismo. No entanto, a Palavra de Deus nos convida a um caminho contracultural: a transformação através da mente renovada pelo Espírito Santo.\n\nQuando alinhamos os nossos pensamentos com a verdade das Escrituras, nossa perspectiva muda. Os problemas deixam de ser gigantes intransponíveis e passam a ser oportunidades para contemplar a fidelidade de Deus.',
      prayer: 'Senhor meu Deus, limpa a minha mente de pensamentos de medo, dúvida ou autossuficiência. Que a Tua verdade seja o filtro através do qual vejo o mundo e a mim mesmo. Concede-me sabedoria para fazer escolhas que Te honrem neste dia. Amém.',
      actionStep: 'Reserve 5 minutos no início da tarde para desconectar do celular e meditar em uma promessa de Deus para sua vida.',
      tags: ['Renovação', 'Mente', 'Sabedoria', 'Propósito']
    }
  ];

  const pool = isConfronting || (theme && theme.toLowerCase().includes('confronto')) ? confrontingPool : [...confrontingPool, ...classicPool];
  const randomIndex = Math.floor(Math.random() * pool.length);
  const selected = pool[randomIndex];
  
  return {
    id: `dev-${Date.now()}`,
    ...selected,
    theme: theme ? `${theme}` : selected.theme,
    date: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  };
};

// API: Generate daily devotional using Gemini
app.post('/api/devotional/generate', async (req: Request, res: Response) => {
  const { theme, customPrompt, mood, toneMode } = req.body || {};
  const isConfronting = toneMode === 'confronting' || (theme && /confront|ego|arrepend|cruz|hipocrisia|ren[úu]ncia|santidade|ju[íi]zo|quebrant/i.test(theme));

  try {
    const ai = getAIClient();

    if (!ai) {
      console.log('Gemini API key not found; returning resilient curated devotional.');
      const fallback = generateFallbackDevotional(theme, customPrompt, isConfronting);
      return res.json({ success: true, devotional: fallback, source: 'curated' });
    }

    const promptContext = `
Crie um devocional cristão diário em português brasileiro PROFUNDO, BÍBLICO, TEOCÊNTRICO E CONFRONTADOR para a alma.
${isConfronting ? 'DIRETRIZ PRIORITÁRIA: Este devocional DEVE SER CONFRONTADOR. Não use clichês de autoajuda, nem tente massagear o ego do leitor. Confronte o orgulho humano, a autossuficiência, a hipocrisia religiosa, a carnalidade e a ilusão de controle, convocando com seriedade ao quebrantamento, à renúncia da vontade própria (tomar a cruz) e à obediência santa a Deus.' : 'DIRETRIZ DE RIGOR BÍBLICO: Fuja de autoajuda e de mensagens antropocêntricas que exaltam a autossuficiência humana. Seja biblicamente fiel, sóbrio e centrado na graça da cruz de Cristo.'}
${theme ? `Tema específico: "${theme}".` : ''}
${mood ? `Estado espiritual / atitude: "${mood}".` : ''}
${customPrompt ? `Pedido específico / situação: "${customPrompt}".` : ''}

Requisitos essenciais:
1. "title": Título forte, sóbrio e penetrante (sem chavões de autoajuda).
2. "verse": Texto exato de um versículo bíblico clássico e cirúrgico (ex: Lucas 9:23, Jeremias 17:9, Tiago 4:4-6, Gálatas 6:7, Mateus 7:21, Romanos 8:13, Hebreus 4:12, Apocalipse 3:17).
3. "reference": Referência bíblica com livro, capítulo e versículo exatos.
4. "version": Versão (ex: "ARA", "NVI" ou "ARC").
5. "theme": Nome do tema espiritual em 2 a 4 palavras.
6. "reflection": Reflexão contundente e teologicamente rica de 2 a 3 parágrafos. A Palavra deve cortar o orgulho humano e apontar para a santidade de Deus e a cruz de Cristo.
7. "prayer": Oração de humilhação, confissão sincera de dependência e quebrantamento diante do Senhor.
8. "actionStep": Um desafio prático de renúncia, arrependimento concreto ou atitude de obediência sem desculpas carnais.
9. "tags": Lista de 3 a 5 palavras-chave (ex: Quebrantamento, Renúncia, Cruz, Santidade).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptContext,
      config: {
        systemInstruction: 'Você é um pregador e expositor bíblico sóbrio, profundo e sem rodeios humanos (no espírito de Charles Spurgeon, A.W. Tozer e dos apóstolos bíblicos). Você JAMAIS massageia o ego humano nem escreve autoajuda barata. Você prega a soberania de Deus, a necessidade de tomar a cruz, a mortificação da carne e o arrependimento sincero sob a luz da graça verdadeira.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            verse: { type: Type.STRING },
            reference: { type: Type.STRING },
            version: { type: Type.STRING },
            theme: { type: Type.STRING },
            reflection: { type: Type.STRING },
            prayer: { type: Type.STRING },
            actionStep: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['title', 'verse', 'reference', 'version', 'theme', 'reflection', 'prayer', 'actionStep']
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Sem resposta textual de Gemini');
    }

    const parsed = JSON.parse(textOutput);
    const devotional = {
      id: `dev-ai-${Date.now()}`,
      ...parsed,
      date: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    return res.json({ success: true, devotional, source: 'gemini' });
  } catch (error: any) {
    console.error('Error generating devotional with Gemini:', error?.message || error);
    // Graceful fallback so app always functions smoothly
    const fallback = generateFallbackDevotional(theme, customPrompt, isConfronting);
    return res.json({ success: true, devotional: fallback, source: 'fallback', note: 'Gerado com modo de contingência inspirador' });
  }
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
