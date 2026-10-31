export interface BibleBook {
  id: string;
  name: string;
  abbrev: string;
  testament: 'VT' | 'NT';
  category: 
    | 'Pentateuco'
    | 'Históricos'
    | 'Poéticos e Sapienciais'
    | 'Profetas Maiores'
    | 'Profetas Menores'
    | 'Evangelhos'
    | 'Histórico'
    | 'Cartas Paulinas'
    | 'Cartas Gerais'
    | 'Profético';
  chapters: number;
  summary: string;
}

export const BIBLE_BOOKS: BibleBook[] = [
  // Antigo Testamento (39 Livros)
  // Pentateuco
  { id: 'gn', name: 'Gênesis', abbrev: 'Gn', testament: 'VT', category: 'Pentateuco', chapters: 50, summary: 'A criação do mundo, a queda e a aliança com Abraão, Isaque e Jacó.' },
  { id: 'ex', name: 'Êxodo', abbrev: 'Êx', testament: 'VT', category: 'Pentateuco', chapters: 40, summary: 'A libertação do Egito, os Dez Mandamentos e a arca da aliança.' },
  { id: 'lv', name: 'Levítico', abbrev: 'Lv', testament: 'VT', category: 'Pentateuco', chapters: 27, summary: 'Leis cerimoniais, santidade a Deus e o dia da expiação.' },
  { id: 'nm', name: 'Números', abbrev: 'Nm', testament: 'VT', category: 'Pentateuco', chapters: 36, summary: 'O censo e os 40 anos de peregrinação de Israel pelo deserto.' },
  { id: 'dt', name: 'Deuteronômio', abbrev: 'Dt', testament: 'VT', category: 'Pentateuco', chapters: 34, summary: 'O último discurso de Moisés renovando a aliança com a nova geração.' },

  // Históricos
  { id: 'js', name: 'Josué', abbrev: 'Js', testament: 'VT', category: 'Históricos', chapters: 24, summary: 'A conquista e divisão da Terra Prometida sob a liderança de Josué.' },
  { id: 'jz', name: 'Juízes', abbrev: 'Jz', testament: 'VT', category: 'Históricos', chapters: 21, summary: 'Ciclos de pecado, opressão e libertação por juízes corajosos.' },
  { id: 'rt', name: 'Rute', abbrev: 'Rt', testament: 'VT', category: 'Históricos', chapters: 4, summary: 'História comovente de amor, lealdade e redenção na linhagem de Davi.' },
  { id: '1sm', name: '1 Samuel', abbrev: '1Sm', testament: 'VT', category: 'Históricos', chapters: 31, summary: 'A transição de juízes para reis: Samuel, Saul e a unção de Davi.' },
  { id: '2sm', name: '2 Samuel', abbrev: '2Sm', testament: 'VT', category: 'Históricos', chapters: 24, summary: 'O reinado glorioso de Davi, suas vitórias, quedas e o perdão divino.' },
  { id: '1rs', name: '1 Reis', abbrev: '1Rs', testament: 'VT', category: 'Históricos', chapters: 22, summary: 'O reinado sábio de Salomão, a construção do Templo e a divisão do reino.' },
  { id: '2rs', name: '2 Reis', abbrev: '2Rs', testament: 'VT', category: 'Históricos', chapters: 25, summary: 'A decadência dos reinos de Israel e Judá até o exílio babilônico.' },
  { id: '1cr', name: '1 Crônicas', abbrev: '1Cr', testament: 'VT', category: 'Históricos', chapters: 29, summary: 'Genealogias do povo de Deus e a história do reinado exemplar de Davi.' },
  { id: '2cr', name: '2 Crônicas', abbrev: '2Cr', testament: 'VT', category: 'Históricos', chapters: 36, summary: 'Salomão e os reis de Judá que buscaram o Senhor e trouxeram avivamento.' },
  { id: 'ed', name: 'Esdras', abbrev: 'Ed', testament: 'VT', category: 'Históricos', chapters: 10, summary: 'O retorno do exílio e a reconstrução fervorosa do Templo em Jerusalém.' },
  { id: 'ne', name: 'Neemias', abbrev: 'Ne', testament: 'VT', category: 'Históricos', chapters: 13, summary: 'A corajosa reconstrução dos muros de Jerusalém sob oração e liderança.' },
  { id: 'et', name: 'Ester', abbrev: 'Et', testament: 'VT', category: 'Históricos', chapters: 10, summary: 'A providência invisível de Deus que salva Seu povo através da corajosa rainha.' },

  // Poéticos e Sapienciais
  { id: 'jo', name: 'Jó', abbrev: 'Jó', testament: 'VT', category: 'Poéticos e Sapienciais', chapters: 42, summary: 'A soberania de Deus diante do sofrimento humano inocente e a fidelidade.' },
  { id: 'sl', name: 'Salmos', abbrev: 'Sl', testament: 'VT', category: 'Poéticos e Sapienciais', chapters: 150, summary: 'Orações, louvores, lamentos e celebrações de fé que tocam a alma.' },
  { id: 'pv', name: 'Provérbios', abbrev: 'Pv', testament: 'VT', category: 'Poéticos e Sapienciais', chapters: 31, summary: 'Sabedoria prática para a vida cotidiana, integridade e temor a Deus.' },
  { id: 'ec', name: 'Eclesiastes', abbrev: 'Ec', testament: 'VT', category: 'Poéticos e Sapienciais', chapters: 12, summary: 'Reflexões sobre o significado da vida e a centralidade do Criador.' },
  { id: 'ct', name: 'Cânticos', abbrev: 'Ct', testament: 'VT', category: 'Poéticos e Sapienciais', chapters: 8, summary: 'Cântico do amor matrimonial puro, reflexo do amor de Deus por Seu povo.' },

  // Profetas Maiores
  { id: 'is', name: 'Isaías', abbrev: 'Is', testament: 'VT', category: 'Profetas Maiores', chapters: 66, summary: 'O profeta messiânico que anuncia o Servo Sofredor e a nova criação.' },
  { id: 'jr', name: 'Jeremias', abbrev: 'Jr', testament: 'VT', category: 'Profetas Maiores', chapters: 52, summary: 'O profeta chorão com a mensagem da nova aliança gravada no coração.' },
  { id: 'lm', name: 'Lamentações', abbrev: 'Lm', testament: 'VT', category: 'Profetas Maiores', chapters: 5, summary: 'Poemas de luto por Jerusalém e a proclamação das misericórdias que se renovam.' },
  { id: 'ez', name: 'Ezequiel', abbrev: 'Ez', testament: 'VT', category: 'Profetas Maiores', chapters: 48, summary: 'Visões da glória de Deus, o vale de ossos secos e o novo Templo espiritual.' },
  { id: 'dn', name: 'Daniel', abbrev: 'Dn', testament: 'VT', category: 'Profetas Maiores', chapters: 12, summary: 'Fidelidade sob pressão na Babilônia e visões do Reino eterno de Deus.' },

  // Profetas Menores
  { id: 'os', name: 'Oséias', abbrev: 'Os', testament: 'VT', category: 'Profetas Menores', chapters: 14, summary: 'O amor incondicional e perdoador de Deus pelo Seu povo infiel.' },
  { id: 'jl', name: 'Joel', abbrev: 'Jl', testament: 'VT', category: 'Profetas Menores', chapters: 3, summary: 'O Dia do Senhor e o derramamento do Espírito Santo sobre toda carne.' },
  { id: 'am', name: 'Amós', abbrev: 'Am', testament: 'VT', category: 'Profetas Menores', chapters: 9, summary: 'Clamor por justiça social e retidão que corra como rio poderoso.' },
  { id: 'ob', name: 'Obadias', abbrev: 'Ob', testament: 'VT', category: 'Profetas Menores', chapters: 1, summary: 'Juízo contra o orgulho de Edom e a restauração do monte Sião.' },
  { id: 'jn', name: 'Jonas', abbrev: 'Jn', testament: 'VT', category: 'Profetas Menores', chapters: 4, summary: 'A compaixão infinita de Deus pelos perdidos e a fuga do profeta.' },
  { id: 'mq', name: 'Miqueias', abbrev: 'Mq', testament: 'VT', category: 'Profetas Menores', chapters: 7, summary: 'Praticar a justiça, amar a misericórdia e andar humildemente com Deus.' },
  { id: 'na', name: 'Naum', abbrev: 'Na', testament: 'VT', category: 'Profetas Menores', chapters: 3, summary: 'A justiça divina sobre a violenta e opressora Nínive.' },
  { id: 'hc', name: 'Habacuque', abbrev: 'Hc', testament: 'VT', category: 'Profetas Menores', chapters: 3, summary: 'O diálogo com Deus sobre o mal e a certeza de que o justo viverá pela fé.' },
  { id: 'sf', name: 'Sofonias', abbrev: 'Sf', testament: 'VT', category: 'Profetas Menores', chapters: 3, summary: 'O julgamento purificador e o cântico de alegria de Deus sobre os Seus.' },
  { id: 'ag', name: 'Ageu', abbrev: 'Ag', testament: 'VT', category: 'Profetas Menores', chapters: 2, summary: 'Chamado urgente para priorizar a Casa do Senhor em tempos difíceis.' },
  { id: 'zc', name: 'Zacarias', abbrev: 'Zc', testament: 'VT', category: 'Profetas Menores', chapters: 14, summary: 'Visões do Messias humilde montado em jumentinho e a Jerusalém celestial.' },
  { id: 'ml', name: 'Malaquias', abbrev: 'Ml', testament: 'VT', category: 'Profetas Menores', chapters: 4, summary: 'A promessa do mensageiro e o Sol da Justiça que trará cura nas Suas asas.' },

  // Novo Testamento (27 Livros)
  // Evangelhos
  { id: 'mt', name: 'Mateus', abbrev: 'Mt', testament: 'NT', category: 'Evangelhos', chapters: 28, summary: 'Jesus como o Rei prometido, o cumprimento de todas as profecias do Messias.' },
  { id: 'mc', name: 'Marcos', abbrev: 'Mc', testament: 'NT', category: 'Evangelhos', chapters: 16, summary: 'Jesus como o Servo obediente e poderoso que deu Sua vida em resgate por muitos.' },
  { id: 'lc', name: 'Lucas', abbrev: 'Lc', testament: 'NT', category: 'Evangelhos', chapters: 24, summary: 'Jesus como o Filho do Homem compassivo, que veio buscar e salvar o perdido.' },
  { id: 'joh', name: 'João', abbrev: 'Jo', testament: 'NT', category: 'Evangelhos', chapters: 21, summary: 'Jesus como o Verbo eterno feito carne, a Luz do Mundo e o Filho de Deus.' },

  // Histórico do NT
  { id: 'at', name: 'Atos', abbrev: 'At', testament: 'NT', category: 'Histórico', chapters: 28, summary: 'O nascimento da Igreja pelo poder do Espírito Santo até os confins da terra.' },

  // Cartas Paulinas
  { id: 'rm', name: 'Romanos', abbrev: 'Rm', testament: 'NT', category: 'Cartas Paulinas', chapters: 16, summary: 'A profunda exposição da graça, justificação pela fé e vida no Espírito.' },
  { id: '1co', name: '1 Coríntios', abbrev: '1Co', testament: 'NT', category: 'Cartas Paulinas', chapters: 16, summary: 'Soluções para divisões na igreja, os dons espirituais e o sublime hino ao amor.' },
  { id: '2co', name: '2 Coríntios', abbrev: '2Co', testament: 'NT', category: 'Cartas Paulinas', chapters: 13, summary: 'O ministério da reconciliação e o poder de Deus aperfeiçoado na fraqueza.' },
  { id: 'gl', name: 'Gálatas', abbrev: 'Gl', testament: 'NT', category: 'Cartas Paulinas', chapters: 6, summary: 'A gloriosa liberdade da graça em Cristo em contraste com o jugo da lei.' },
  { id: 'ef', name: 'Efésios', abbrev: 'Ef', testament: 'NT', category: 'Cartas Paulinas', chapters: 6, summary: 'A riqueza da herança em Cristo, a unidade da Igreja e a armadura de Deus.' },
  { id: 'fp', name: 'Filipenses', abbrev: 'Fp', testament: 'NT', category: 'Cartas Paulinas', chapters: 4, summary: 'A alegria inabalável no Senhor mesmo em meio às cadeias e circunstâncias.' },
  { id: 'cl', name: 'Colossenses', abbrev: 'Cl', testament: 'NT', category: 'Cartas Paulinas', chapters: 4, summary: 'A supremacia absoluta de Cristo sobre toda a criação e sobre a Igreja.' },
  { id: '1ts', name: '1 Tessalonicenses', abbrev: '1Ts', testament: 'NT', category: 'Cartas Paulinas', chapters: 5, summary: 'A esperança viva na volta gloriosa de Cristo e o chamado à santificação.' },
  { id: '2ts', name: '2 Tessalonicenses', abbrev: '2Ts', testament: 'NT', category: 'Cartas Paulinas', chapters: 3, summary: 'Perseverança firme até o Dia do Senhor e conforto em tempos de tribulação.' },
  { id: '1tm', name: '1 Timóteo', abbrev: '1Tm', testament: 'NT', category: 'Cartas Paulinas', chapters: 6, summary: 'Instruções pastorais sobre a liderança, sã doutrina e conduta piedosa.' },
  { id: '2tm', name: '2 Timóteo', abbrev: '2Tm', testament: 'NT', category: 'Cartas Paulinas', chapters: 4, summary: 'O testamento espiritual de Paulo: combater o bom combate e guardar a fé.' },
  { id: 'tt', name: 'Tito', abbrev: 'Tt', testament: 'NT', category: 'Cartas Paulinas', chapters: 3, summary: 'Organização da igreja em Creta, boas obras e sã doutrina na comunidade.' },
  { id: 'fm', name: 'Filemom', abbrev: 'Fm', testament: 'NT', category: 'Cartas Paulinas', chapters: 1, summary: 'O poder transformador do perdão e da fraternidade cristã em ação prática.' },

  // Cartas Gerais
  { id: 'hb', name: 'Hebreus', abbrev: 'Hb', testament: 'NT', category: 'Cartas Gerais', chapters: 13, summary: 'A superioridade eterna de Cristo como sumo sacerdote da Nova Aliança.' },
  { id: 'tg', name: 'Tiago', abbrev: 'Tg', testament: 'NT', category: 'Cartas Gerais', chapters: 5, summary: 'A fé viva comprovada em ações práticas, paciência e controle da língua.' },
  { id: '1pe', name: '1 Pedro', abbrev: '1Pe', testament: 'NT', category: 'Cartas Gerais', chapters: 5, summary: 'Esperança viva e perseverança cristã em tempos de sofrimento e provação.' },
  { id: '2pe', name: '2 Pedro', abbrev: '2Pe', testament: 'NT', category: 'Cartas Gerais', chapters: 3, summary: 'Crescimento na graça e conhecimento, e alerta vigilante contra falsos mestres.' },
  { id: '1jo', name: '1 João', abbrev: '1Jo', testament: 'NT', category: 'Cartas Gerais', chapters: 5, summary: 'A comunhão com Deus, que é luz e amor, e a certeza da vida eterna.' },
  { id: '2jo', name: '2 João', abbrev: '2Jo', testament: 'NT', category: 'Cartas Gerais', chapters: 1, summary: 'Andar na verdade e no amor mútuo, guardando-se do engano.' },
  { id: '3jo', name: '3 João', abbrev: '3Jo', testament: 'NT', category: 'Cartas Gerais', chapters: 1, summary: 'Hospitalidade e cooperação sincera com os cooperadores da verdade.' },
  { id: 'jd', name: 'Judas', abbrev: 'Jd', testament: 'NT', category: 'Cartas Gerais', chapters: 1, summary: 'Batalhar zelosamente pela fé que de uma vez por todas foi dada aos santos.' },

  // Profético
  { id: 'ap', name: 'Apocalipse', abbrev: 'Ap', testament: 'NT', category: 'Profético', chapters: 22, summary: 'A revelação de Jesus Cristo, a vitória final do Cordeiro e os novos céus e nova terra.' }
];

export const TOTAL_BIBLE_CHAPTERS = BIBLE_BOOKS.reduce((acc, book) => acc + book.chapters, 0); // 1,189 chapters
export const TOTAL_VT_CHAPTERS = BIBLE_BOOKS.filter(b => b.testament === 'VT').reduce((acc, b) => acc + b.chapters, 0); // 929 chapters
export const TOTAL_NT_CHAPTERS = BIBLE_BOOKS.filter(b => b.testament === 'NT').reduce((acc, b) => acc + b.chapters, 0); // 260 chapters
