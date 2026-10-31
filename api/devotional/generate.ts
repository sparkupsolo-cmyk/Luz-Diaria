import { GoogleGenAI, Type } from '@google/genai';

// Initialize Gemini with telemetry header
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
    }
  ];

  const randomIndex = Math.floor(Math.random() * confrontingPool.length);
  const selected = confrontingPool[randomIndex];
  
  return {
    id: `dev-${Date.now()}`,
    ...selected,
    theme: theme ? `${theme}` : selected.theme,
    date: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  };
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { theme, customPrompt, mood, toneMode } = req.body || {};
  const isConfronting = toneMode === 'confronting' || (theme && /confront|ego|arrepend|cruz|hipocrisia|ren[úu]ncia|santidade|ju[íi]zo|quebrant/i.test(theme));

  try {
    const ai = getAIClient();

    if (!ai) {
      console.log('Gemini API key not found; returning resilient curated devotional.');
      const fallback = generateFallbackDevotional(theme, customPrompt, isConfronting);
      return res.status(200).json({ success: true, devotional: fallback, source: 'curated' });
    }

    const promptContext = `
Crie um devocional cristão diário em português brasileiro PROFUNDO, BÍBLICO, TEOCÊNTRICO E CONFRONTADOR para a alma.
${isConfronting ? 'DIRETRIZ PRIORITÁRIA: Este devocional DEVE SER CONFRONTADOR. Não use clichês de autoajuda, nem tente massagear o ego do leitor. Confronte o orgulho humano, a autossuficiência, a hipocrisia religiosa, a carnalidade e a ilusão de controle, convocando com seriedade ao quebrantamento, à renúncia da vontade própria (tomar a cruz) e à obediência santa a Deus.' : 'DIRETRIZ DE RIGOR BÍBLICO: Fuja de autoajuda e de mensagens antropocêntricas que exaltam a autossuficiência humana. Seja biblicamente fiel, sóbrio e centrado na graça da cruz de Cristo.'}
${theme ? `Tema específico: "${theme}".` : ''}
${mood ? `Estado espiritual / atitude: "${mood}".` : ''}
${customPrompt ? `Pedido específico / situação: "${customPrompt}".` : ''}

Requisitos essenciais:
1. "title": Título forte, sóbrio e penetrante (sem chavões de autoajuda).
2. "verse": Texto exato de um versículo bíblico clássico e cirúrgico.
3. "reference": Referência bíblica com livro, capítulo e versículo exatos.
4. "version": Versão (ex: "ARA", "NVI" ou "ARC").
5. "theme": Nome do tema espiritual em 2 a 4 palavras.
6. "reflection": Reflexão contundente e teologicamente rica de 2 a 3 parágrafos.
7. "prayer": Oração de humilhação, confissão sincera de dependência e quebrantamento diante do Senhor.
8. "actionStep": Um desafio prático de renúncia, arrependimento concreto ou obediência sem desculpas carnais.
9. "tags": Lista de 3 a 5 palavras-chave.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptContext,
      config: {
        systemInstruction: 'Você é um pregador e expositor bíblico sóbrio, profundo e sem rodeios humanos. Você JAMAIS massageia o ego humano nem escreve autoajuda barata. Você prega a soberania de Deus, a necessidade de tomar a cruz e a mortificação da carne.',
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

    return res.status(200).json({ success: true, devotional, source: 'gemini' });
  } catch (error: any) {
    console.error('Error generating devotional in Vercel function:', error?.message || error);
    const fallback = generateFallbackDevotional(theme, customPrompt, isConfronting);
    return res.status(200).json({ success: true, devotional: fallback, source: 'fallback' });
  }
}
