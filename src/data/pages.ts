/**
 * The landing-page registry.
 *
 * Every tool page is a data entry, not a hand-written `.astro` file. Adding a
 * page means appending one object here; routing, metadata, sitemap inclusion,
 * breadcrumbs, FAQ schema and internal linking all follow automatically. This
 * is what lets the site scale to hundreds of pages without new architecture.
 *
 * `related` is intentionally explicit rather than computed — editorial control
 * over internal linking beats a similarity heuristic, and it guarantees no page
 * is orphaned.
 */

import type { Locale } from '@/constants/i18n';
import type { FaqItem } from '@/types/seo';

export type PageGroup = 'test' | 'practice' | 'lesson' | 'game' | 'tool';

export interface LandingPage {
  /** Locale-agnostic route key, e.g. `typing-test-1-minute`. */
  readonly key: string;
  readonly group: PageGroup;
  /** Word source driving the embedded test. */
  readonly sourceId: string;
  readonly mode: 'time' | 'words';
  readonly limit: number;
  /** Route keys of related pages — the internal-linking graph. */
  readonly related: readonly string[];
  /** Blog article slugs to surface on this page. */
  readonly relatedArticles: readonly string[];
  readonly content: Record<Locale, LandingPageContent>;
}

export interface LandingPageContent {
  readonly title: string;
  readonly h1: string;
  readonly description: string;
  readonly intro: string;
  readonly keywords: readonly string[];
  /** Body sections rendered above the fold-out content. */
  readonly sections: readonly { readonly heading: string; readonly body: string }[];
  readonly faq: readonly FaqItem[];
}

export const LANDING_PAGES: readonly LandingPage[] = [
  {
    key: 'typing-test',
    group: 'test',
    sourceId: 'english-200',
    mode: 'time',
    limit: 60,
    related: ['typing-test-1-minute', 'typing-test-5-minutes', 'typing-lessons', 'programming-typing'],
    relatedArticles: [
      'how-to-improve-typing-speed',
      'typing-accuracy-tips',
      'average-typing-speed',
    ],
    content: {
      en: {
        title: 'Free Typing Test — Measure Your WPM and Accuracy',
        h1: 'Typing Speed Test',
        description:
          'Take a free typing test and measure your words per minute, accuracy and consistency. No signup, no tracking — everything runs in your browser.',
        intro:
          'Start typing to begin. Your speed, accuracy and consistency are measured in real time and saved only on your own device.',
        keywords: ['typing test', 'wpm test', 'typing speed test', 'words per minute'],
        sections: [
          {
            heading: 'How your typing speed is calculated',
            body: 'Words per minute is calculated using the standard definition of a word as five characters, including spaces. Your net WPM counts only correctly typed characters, so accuracy is built into the score rather than reported separately from it. Raw WPM counts everything you typed, and the gap between the two numbers tells you how much speed you are losing to errors.',
          },
          {
            heading: 'What counts as a good score',
            body: 'The average adult types between 35 and 45 words per minute. Around 60 WPM is a comfortable professional standard, and sustained speeds above 90 WPM put you in roughly the top few percent of typists. Accuracy matters more than raw speed: typing at 70 WPM with 99% accuracy is faster in practice than 90 WPM with 90% accuracy, because every error costs you the time to notice and fix it.',
          },
          {
            heading: 'Practising deliberately',
            body: 'Repeating a test you already find easy builds very little. Improvement comes from working slightly above your comfortable speed, keeping accuracy above 97%, and targeting the specific keys and transitions that slow you down. Short daily sessions of ten to fifteen minutes outperform occasional long ones.',
          },
        ],
        faq: [
          {
            question: 'Is this typing test free?',
            answer:
              'Yes. Every test, lesson and game on Typing Studio is free, with no account and no signup. There is no paid tier.',
          },
          {
            question: 'Is my typing data sent anywhere?',
            answer:
              'No. There is no backend and no database. Your results are stored in your own browser using IndexedDB and never leave your device. Clearing your browser data erases them permanently.',
          },
          {
            question: 'How is WPM calculated?',
            answer:
              'A word is defined as five characters including spaces. Net WPM divides your correctly typed characters by five and scales to a minute, so errors reduce your score directly.',
          },
          {
            question: 'What is a good typing speed?',
            answer:
              'Most adults type 35–45 WPM. About 60 WPM is a solid professional benchmark, and above 90 WPM is fast. Consistent accuracy above 97% matters more than peak speed.',
          },
          {
            question: 'Does the test work offline?',
            answer:
              'Yes. Typing Studio is a progressive web app. Once you have loaded it, tests and lessons keep working with no internet connection.',
          },
        ],
      },
      'pt-br': {
        title: 'Teste de Digitação Grátis — Meça suas PPM e Precisão',
        h1: 'Teste de Velocidade de Digitação',
        description:
          'Faça um teste de digitação grátis e meça suas palavras por minuto, precisão e consistência. Sem cadastro e sem rastreamento — tudo roda no seu navegador.',
        intro:
          'Comece a digitar para iniciar. Sua velocidade, precisão e consistência são medidas em tempo real e salvas apenas no seu dispositivo.',
        keywords: ['teste de digitação', 'teste ppm', 'velocidade de digitação', 'palavras por minuto'],
        sections: [
          {
            heading: 'Como sua velocidade é calculada',
            body: 'As palavras por minuto usam a definição padrão de uma palavra como cinco caracteres, incluindo espaços. Suas PPM líquidas contam apenas os caracteres digitados corretamente, então a precisão já está embutida na pontuação. As PPM brutas contam tudo o que você digitou, e a diferença entre os dois números mostra quanta velocidade você perde com erros.',
          },
          {
            heading: 'O que é uma boa pontuação',
            body: 'O adulto médio digita entre 35 e 45 palavras por minuto. Cerca de 60 PPM é um bom padrão profissional, e velocidades acima de 90 PPM colocam você entre os melhores. A precisão importa mais que a velocidade bruta: digitar a 70 PPM com 99% de precisão é mais rápido na prática que 90 PPM com 90%, porque cada erro custa o tempo de perceber e corrigir.',
          },
          {
            heading: 'Praticando de forma deliberada',
            body: 'Repetir um teste que você já acha fácil constrói muito pouco. A melhora vem de trabalhar um pouco acima da sua velocidade confortável, manter a precisão acima de 97% e focar nas teclas e transições específicas que te atrasam. Sessões diárias curtas de dez a quinze minutos superam sessões longas ocasionais.',
          },
        ],
        faq: [
          {
            question: 'Este teste de digitação é gratuito?',
            answer:
              'Sim. Todos os testes, lições e jogos do Typing Studio são gratuitos, sem conta e sem cadastro. Não existe versão paga.',
          },
          {
            question: 'Meus dados de digitação são enviados para algum lugar?',
            answer:
              'Não. Não há backend nem banco de dados. Seus resultados ficam no seu navegador via IndexedDB e nunca saem do seu dispositivo. Limpar os dados do navegador os apaga permanentemente.',
          },
          {
            question: 'Como as PPM são calculadas?',
            answer:
              'Uma palavra equivale a cinco caracteres, incluindo espaços. As PPM líquidas dividem os caracteres corretos por cinco e ajustam para um minuto, então os erros reduzem sua pontuação diretamente.',
          },
          {
            question: 'Qual é uma boa velocidade de digitação?',
            answer:
              'A maioria dos adultos digita de 35 a 45 PPM. Cerca de 60 PPM é uma boa referência profissional, e acima de 90 PPM é rápido. Precisão consistente acima de 97% importa mais que velocidade máxima.',
          },
          {
            question: 'O teste funciona offline?',
            answer:
              'Sim. O Typing Studio é um progressive web app. Depois de carregado, os testes e lições continuam funcionando sem conexão com a internet.',
          },
        ],
      },
    },
  },
  {
    key: 'typing-test-1-minute',
    group: 'test',
    sourceId: 'english-200',
    mode: 'time',
    limit: 60,
    related: ['typing-test', 'typing-test-5-minutes', 'typing-lessons', 'daily-challenge'],
    relatedArticles: ['how-to-improve-typing-speed', 'average-typing-speed', 'typing-warm-up-routine'],
    content: {
      en: {
        title: '1 Minute Typing Test — Quick WPM Check',
        h1: '1 Minute Typing Test',
        description:
          'A focused one-minute typing test. Measure your WPM and accuracy in sixty seconds, free and without signup.',
        intro: 'Sixty seconds, one score. The clock starts on your first keystroke.',
        keywords: ['1 minute typing test', 'one minute typing test', '60 second typing test'],
        sections: [
          {
            heading: 'Why one minute is the standard',
            body: 'The one-minute test is the most widely used benchmark because it is long enough to average out a lucky or unlucky start, but short enough to repeat often. Most published typing speed statistics — including the averages quoted by employers — are based on tests of roughly this length.',
          },
          {
            heading: 'Getting an honest score',
            body: 'Take the test with your hands in their normal position and resist the urge to slow down for the score. A single minute is short enough that a burst of unusually careful typing can flatter your result. If you want a number that predicts real work, take three tests and use the middle one.',
          },
        ],
        faq: [
          {
            question: 'How many words should I type in one minute?',
            answer:
              'Around 40 words per minute is average for an adult. 60 WPM is a strong professional level, and above 90 WPM is genuinely fast.',
          },
          {
            question: 'Does the timer start immediately?',
            answer:
              'No. The clock starts on your first keystroke, so you can read the prompt and position your hands first.',
          },
          {
            question: 'Can I take the test more than once?',
            answer:
              'Yes, as often as you like. Each result is saved to your own device so you can watch your progress over time.',
          },
        ],
      },
      'pt-br': {
        title: 'Teste de Digitação de 1 Minuto — PPM Rápido',
        h1: 'Teste de Digitação de 1 Minuto',
        description:
          'Um teste de digitação focado de um minuto. Meça suas PPM e precisão em sessenta segundos, grátis e sem cadastro.',
        intro: 'Sessenta segundos, uma pontuação. O cronômetro começa na primeira tecla.',
        keywords: ['teste de digitação 1 minuto', 'teste digitação um minuto', 'teste 60 segundos'],
        sections: [
          {
            heading: 'Por que um minuto é o padrão',
            body: 'O teste de um minuto é a referência mais usada porque é longo o bastante para compensar um início bom ou ruim, mas curto o suficiente para repetir com frequência. A maioria das estatísticas publicadas de velocidade de digitação — incluindo as médias citadas por empregadores — usa testes desse tamanho.',
          },
          {
            heading: 'Conseguindo uma pontuação honesta',
            body: 'Faça o teste com as mãos na posição normal e resista à vontade de desacelerar pela pontuação. Um único minuto é curto o bastante para que um surto de digitação cuidadosa distorça o resultado. Se quiser um número que reflita o trabalho real, faça três testes e use o do meio.',
          },
        ],
        faq: [
          {
            question: 'Quantas palavras devo digitar em um minuto?',
            answer:
              'Cerca de 40 palavras por minuto é a média para um adulto. 60 PPM é um bom nível profissional, e acima de 90 PPM é realmente rápido.',
          },
          {
            question: 'O cronômetro começa imediatamente?',
            answer:
              'Não. O tempo começa na sua primeira tecla, então você pode ler o texto e posicionar as mãos antes.',
          },
          {
            question: 'Posso fazer o teste mais de uma vez?',
            answer:
              'Sim, quantas vezes quiser. Cada resultado é salvo no seu dispositivo para você acompanhar seu progresso.',
          },
        ],
      },
    },
  },
  {
    key: 'typing-test-5-minutes',
    group: 'test',
    sourceId: 'english-200',
    mode: 'time',
    limit: 300,
    related: ['typing-test', 'typing-test-1-minute', 'typing-lessons', 'statistics'],
    relatedArticles: ['typing-endurance-and-stamina', 'how-to-improve-typing-speed', 'typing-ergonomics-guide'],
    content: {
      en: {
        title: '5 Minute Typing Test — Measure Sustained Speed',
        h1: '5 Minute Typing Test',
        description:
          'A five-minute typing test that measures sustained speed, accuracy and stamina — a truer picture of real working pace than a short burst.',
        intro: 'Five minutes of continuous typing. This is where stamina shows.',
        keywords: ['5 minute typing test', 'five minute typing test', 'typing endurance test'],
        sections: [
          {
            heading: 'What a longer test reveals',
            body: 'Short tests measure your peak; long tests measure what you can actually sustain. Most people lose between five and fifteen percent of their one-minute speed over five minutes, as attention drifts and hand fatigue sets in. That decline is the number that predicts how fast you really work.',
          },
          {
            heading: 'Reading your consistency score',
            body: 'The consistency figure compares your speed second by second across the whole test. A high score means you held a steady rhythm; a low one means you alternated between bursts and stalls. Steady typists are usually faster over a working day even when their peak speed is lower, because rhythm is what survives fatigue.',
          },
        ],
        faq: [
          {
            question: 'Why is my five-minute score lower than my one-minute score?',
            answer:
              'That is normal and expected. Sustained typing exposes fatigue and attention drift that a single minute hides. A drop of five to fifteen percent is typical.',
          },
          {
            question: 'Should I take breaks during the test?',
            answer:
              'The timer does not pause, so the test measures unbroken typing. If your hands need a rest, that information is itself useful — it suggests working on posture and technique rather than raw speed.',
          },
          {
            question: 'Which test should I use to track progress?',
            answer:
              'Use the same test length every time. Comparing a one-minute score against a five-minute score will always look like a regression even when you are improving.',
          },
        ],
      },
      'pt-br': {
        title: 'Teste de Digitação de 5 Minutos',
        h1: 'Teste de Digitação de 5 Minutos',
        description:
          'Um teste de digitação de cinco minutos que mede velocidade sustentada, precisão e resistência — um retrato mais fiel do ritmo real de trabalho.',
        intro: 'Cinco minutos de digitação contínua. É aqui que a resistência aparece.',
        keywords: ['teste de digitação 5 minutos', 'teste digitação cinco minutos', 'teste de resistência'],
        sections: [
          {
            heading: 'O que um teste longo revela',
            body: 'Testes curtos medem seu pico; testes longos medem o que você consegue sustentar. A maioria das pessoas perde entre cinco e quinze por cento da velocidade de um minuto ao longo de cinco minutos, conforme a atenção dispersa e a fadiga chega. Esse declínio é o número que prevê sua velocidade real de trabalho.',
          },
          {
            heading: 'Lendo sua pontuação de consistência',
            body: 'A consistência compara sua velocidade segundo a segundo em todo o teste. Uma pontuação alta significa ritmo estável; uma baixa significa alternância entre picos e paradas. Digitadores constantes costumam ser mais rápidos ao longo do dia mesmo com pico menor, porque o ritmo é o que sobrevive à fadiga.',
          },
        ],
        faq: [
          {
            question: 'Por que minha pontuação de cinco minutos é menor que a de um minuto?',
            answer:
              'Isso é normal e esperado. A digitação sustentada expõe fadiga e dispersão que um único minuto esconde. Uma queda de cinco a quinze por cento é típica.',
          },
          {
            question: 'Devo fazer pausas durante o teste?',
            answer:
              'O cronômetro não pausa, então o teste mede digitação ininterrupta. Se suas mãos precisam de descanso, essa informação já é útil — sugere trabalhar postura e técnica antes de velocidade bruta.',
          },
          {
            question: 'Qual teste devo usar para acompanhar o progresso?',
            answer:
              'Use sempre a mesma duração. Comparar um resultado de um minuto com um de cinco minutos sempre parecerá uma piora, mesmo quando você está melhorando.',
          },
        ],
      },
    },
  },
  {
    key: 'javascript-typing',
    group: 'practice',
    sourceId: 'javascript',
    mode: 'words',
    limit: 40,
    related: ['programming-typing', 'python-typing', 'symbols-typing', 'typing-test'],
    relatedArticles: ['programming-typing-practice', 'typing-symbols-and-brackets', 'how-to-improve-typing-speed'],
    content: {
      en: {
        title: 'JavaScript Typing Practice — Code Faster',
        h1: 'JavaScript Typing Practice',
        description:
          'Practice typing real JavaScript syntax: arrow functions, destructuring, template literals and the bracket patterns that slow developers down.',
        intro: 'Type real JavaScript tokens instead of prose. Symbols included.',
        keywords: ['javascript typing practice', 'code typing practice', 'programming typing test'],
        sections: [
          {
            heading: 'Why code typing is different',
            body: 'Prose typing lives on the home row and the alphabet. Code lives on the symbol keys: braces, brackets, semicolons, arrows, template backticks. These require pinky reaches and modifier combinations that ordinary typing practice never trains, which is why fast prose typists often slow to a crawl in an editor.',
          },
          {
            heading: 'The patterns worth drilling',
            body: 'The arrow function `=>`, the strict equality `===`, optional chaining `?.` and the nullish coalescing `??` operator all involve awkward transitions that become automatic with repetition. So do the paired delimiters — `()`, `[]`, `{}` — where the closing character is on a different reach from the opening one.',
          },
        ],
        faq: [
          {
            question: 'Does this practice include symbols and brackets?',
            answer:
              'Yes. The word list is built from real JavaScript tokens including operators, delimiters and common API names, not filtered prose.',
          },
          {
            question: 'Will this help with other languages?',
            answer:
              'Partly. The symbol reaches transfer directly to TypeScript, Java, C# and similar C-family languages. Python and SQL have their own dedicated practice modes.',
          },
          {
            question: 'Should I type code with autocomplete off?',
            answer:
              'For practice, yes. Autocomplete hides exactly the reaches you are trying to train. In real work, keep it on — the goal is to remove the friction, not to type more.',
          },
        ],
      },
      'pt-br': {
        title: 'Prática de Digitação JavaScript — Programe Mais Rápido',
        h1: 'Prática de Digitação JavaScript',
        description:
          'Pratique digitar sintaxe JavaScript real: arrow functions, destructuring, template literals e os padrões de colchetes que atrasam desenvolvedores.',
        intro: 'Digite tokens reais de JavaScript em vez de texto comum. Com símbolos.',
        keywords: ['prática digitação javascript', 'digitação de código', 'teste digitação programação'],
        sections: [
          {
            heading: 'Por que digitar código é diferente',
            body: 'Digitar texto vive na linha de descanso e no alfabeto. Código vive nas teclas de símbolo: chaves, colchetes, ponto e vírgula, setas, crases. Isso exige alcances de mindinho e combinações com modificadores que a prática comum nunca treina — por isso digitadores rápidos de texto travam no editor.',
          },
          {
            heading: 'Os padrões que valem treinar',
            body: 'A arrow function `=>`, a igualdade estrita `===`, o optional chaining `?.` e o operador `??` envolvem transições desconfortáveis que ficam automáticas com repetição. O mesmo vale para os delimitadores pareados — `()`, `[]`, `{}` — onde o caractere de fechamento está num alcance diferente do de abertura.',
          },
        ],
        faq: [
          {
            question: 'Esta prática inclui símbolos e colchetes?',
            answer:
              'Sim. A lista é construída com tokens reais de JavaScript, incluindo operadores, delimitadores e nomes comuns de API — não texto filtrado.',
          },
          {
            question: 'Isso ajuda com outras linguagens?',
            answer:
              'Em parte. Os alcances de símbolos transferem diretamente para TypeScript, Java, C# e linguagens da família C. Python e SQL têm modos próprios.',
          },
          {
            question: 'Devo digitar código com o autocomplete desligado?',
            answer:
              'Para praticar, sim. O autocomplete esconde exatamente os alcances que você quer treinar. No trabalho real, mantenha ligado — o objetivo é remover o atrito, não digitar mais.',
          },
        ],
      },
    },
  },
  {
    key: 'python-typing',
    group: 'practice',
    sourceId: 'python',
    mode: 'words',
    limit: 40,
    related: ['programming-typing', 'javascript-typing', 'sql-typing', 'typing-test'],
    relatedArticles: ['programming-typing-practice', 'typing-symbols-and-brackets', 'typing-accuracy-tips'],
    content: {
      en: {
        title: 'Python Typing Practice — Type Python Faster',
        h1: 'Python Typing Practice',
        description:
          'Practice typing Python syntax: keywords, dunder methods, comprehensions, f-strings and the punctuation patterns unique to Python.',
        intro: 'Real Python keywords and syntax, including the colons and underscores.',
        keywords: ['python typing practice', 'python code typing', 'programming typing test'],
        sections: [
          {
            heading: 'What Python demands from your hands',
            body: 'Python trades braces for colons and indentation, which changes the typing profile completely. The underscore becomes one of the most-used characters through snake_case and dunder methods like `__init__`, and it sits on an awkward shifted reach that most typists never drill.',
          },
          {
            heading: 'High-value patterns',
            body: 'Practise `def`, `self`, `return` and `import` until they are single motions rather than letter sequences. Then work on `__init__`, f-string prefixes and the `->` return annotation, which are the reaches that most often break a Python developer’s rhythm.',
          },
        ],
        faq: [
          {
            question: 'Does this include indentation practice?',
            answer:
              'The mode focuses on tokens and symbols rather than block structure, since editors handle indentation automatically. The reaches it trains are the ones your editor cannot type for you.',
          },
          {
            question: 'Why is the underscore so important in Python?',
            answer:
              'Python convention uses snake_case for names and double underscores for special methods, so the shifted underscore reach appears far more often than in most other languages.',
          },
          {
            question: 'Is this suitable for beginners?',
            answer:
              'It assumes you can already touch-type letters. If you are still hunting for keys, start with the typing lessons and return here once the alphabet is automatic.',
          },
        ],
      },
      'pt-br': {
        title: 'Prática de Digitação Python',
        h1: 'Prática de Digitação Python',
        description:
          'Pratique sintaxe Python: palavras-chave, métodos dunder, comprehensions, f-strings e os padrões de pontuação exclusivos do Python.',
        intro: 'Palavras-chave e sintaxe Python reais, incluindo os dois-pontos e underscores.',
        keywords: ['prática digitação python', 'digitação código python', 'teste digitação programação'],
        sections: [
          {
            heading: 'O que o Python exige das suas mãos',
            body: 'Python troca chaves por dois-pontos e indentação, o que muda completamente o perfil de digitação. O underscore vira um dos caracteres mais usados via snake_case e métodos dunder como `__init__`, e fica num alcance com Shift que quase ninguém treina.',
          },
          {
            heading: 'Padrões de alto valor',
            body: 'Pratique `def`, `self`, `return` e `import` até virarem movimentos únicos em vez de sequências de letras. Depois trabalhe `__init__`, prefixos de f-string e a anotação `->`, que são os alcances que mais quebram o ritmo de um desenvolvedor Python.',
          },
        ],
        faq: [
          {
            question: 'Isso inclui prática de indentação?',
            answer:
              'O modo foca em tokens e símbolos em vez de estrutura de blocos, já que editores cuidam da indentação. Os alcances treinados são os que o editor não digita por você.',
          },
          {
            question: 'Por que o underscore é tão importante em Python?',
            answer:
              'A convenção Python usa snake_case para nomes e underscores duplos para métodos especiais, então esse alcance com Shift aparece muito mais que em outras linguagens.',
          },
          {
            question: 'Isso serve para iniciantes?',
            answer:
              'Presume que você já digita letras sem olhar. Se ainda procura as teclas, comece pelas lições e volte quando o alfabeto estiver automático.',
          },
        ],
      },
    },
  },
  {
    key: 'programming-typing',
    group: 'practice',
    sourceId: 'javascript',
    mode: 'words',
    limit: 50,
    related: ['javascript-typing', 'python-typing', 'sql-typing', 'symbols-typing'],
    relatedArticles: ['programming-typing-practice', 'typing-symbols-and-brackets', 'best-keyboard-for-programming'],
    content: {
      en: {
        title: 'Programming Typing Practice — Code Typing Test',
        h1: 'Programming Typing Practice',
        description:
          'Typing practice built for developers. Train the symbols, operators and bracket patterns that ordinary typing tests never cover.',
        intro: 'Choose a language and train the reaches that actually slow you down in an editor.',
        keywords: ['programming typing practice', 'code typing test', 'developer typing speed'],
        sections: [
          {
            heading: 'Why developers plateau',
            body: 'A developer who types 90 WPM in prose often manages barely half that in code. The bottleneck is almost never the letters — it is the symbol reaches, the shifted characters and the constant switching between alphabetic and punctuation zones of the keyboard.',
          },
          {
            heading: 'Choosing a practice language',
            body: 'Practise the language you actually write. The symbol distribution differs sharply: JavaScript is dense with braces and arrows, Python with colons and underscores, SQL with uppercase keywords, and HTML with angle brackets and quote pairs. Training on the wrong distribution builds the wrong reflexes.',
          },
        ],
        faq: [
          {
            question: 'Which languages are available?',
            answer:
              'JavaScript, Python, SQL, HTML and CSS each have a dedicated mode, plus focused drills for numbers and symbols.',
          },
          {
            question: 'Does typing speed actually matter for programming?',
            answer:
              'Beyond a threshold, thinking dominates typing. But friction below that threshold interrupts your train of thought, and that cost is real even though the raw seconds are small.',
          },
          {
            question: 'How often should I practise?',
            answer:
              'Ten minutes a day beats an hour a week. Symbol reaches are muscle memory, and muscle memory responds to frequency more than duration.',
          },
        ],
      },
      'pt-br': {
        title: 'Digitação para Programadores',
        h1: 'Prática de Digitação para Programação',
        description:
          'Prática de digitação feita para desenvolvedores. Treine os símbolos, operadores e padrões de colchetes que testes comuns nunca cobrem.',
        intro: 'Escolha uma linguagem e treine os alcances que realmente te atrasam no editor.',
        keywords: ['digitação para programadores', 'teste digitação código', 'velocidade digitação dev'],
        sections: [
          {
            heading: 'Por que desenvolvedores estagnam',
            body: 'Um desenvolvedor que digita 90 PPM em texto comum muitas vezes faz metade disso em código. O gargalo quase nunca são as letras — são os alcances de símbolos, os caracteres com Shift e a troca constante entre as zonas alfabética e de pontuação do teclado.',
          },
          {
            heading: 'Escolhendo uma linguagem para praticar',
            body: 'Pratique a linguagem que você realmente escreve. A distribuição de símbolos muda bastante: JavaScript é denso em chaves e setas, Python em dois-pontos e underscores, SQL em palavras maiúsculas, e HTML em sinais de menor/maior e aspas. Treinar a distribuição errada constrói o reflexo errado.',
          },
        ],
        faq: [
          {
            question: 'Quais linguagens estão disponíveis?',
            answer:
              'JavaScript, Python, SQL, HTML e CSS têm modos dedicados, além de treinos focados em números e símbolos.',
          },
          {
            question: 'Velocidade de digitação importa mesmo para programar?',
            answer:
              'Acima de certo limiar, pensar domina digitar. Mas o atrito abaixo desse limiar interrompe o raciocínio, e esse custo é real mesmo quando os segundos são poucos.',
          },
          {
            question: 'Com que frequência devo praticar?',
            answer:
              'Dez minutos por dia superam uma hora por semana. Alcances de símbolos são memória muscular, e ela responde mais à frequência que à duração.',
          },
        ],
      },
    },
  },
  {
    key: 'sql-typing',
    group: 'practice',
    sourceId: 'sql',
    mode: 'words',
    limit: 40,
    related: ['programming-typing', 'python-typing', 'javascript-typing', 'typing-test'],
    relatedArticles: ['programming-typing-practice', 'typing-accuracy-tips', 'how-to-improve-typing-speed'],
    content: {
      en: {
        title: 'SQL Typing Practice — Query Faster',
        h1: 'SQL Typing Practice',
        description:
          'Practice typing SQL keywords, clauses and operators. Train the uppercase keyword patterns that make queries slow to write.',
        intro: 'SELECT, JOIN, WHERE — typed until they are muscle memory.',
        keywords: ['sql typing practice', 'sql keyword typing', 'database typing test'],
        sections: [
          {
            heading: 'The uppercase problem',
            body: 'SQL convention writes keywords in uppercase, which means a shift press on almost every keyword. That constant modifier use is a distinct skill from lowercase typing, and it is the main reason SQL feels slower to type than its short keyword list suggests.',
          },
          {
            heading: 'Clause order as muscle memory',
            body: 'Queries follow a fixed skeleton: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY. Drilling that order as a typed sequence, rather than recalling it clause by clause, removes a surprising amount of hesitation from everyday query writing.',
          },
        ],
        faq: [
          {
            question: 'Should SQL keywords be uppercase?',
            answer:
              'It is a widely followed convention rather than a requirement — SQL itself is case-insensitive for keywords. Most teams and style guides use uppercase for readability, so this mode trains that habit.',
          },
          {
            question: 'Does this cover a specific SQL dialect?',
            answer:
              'The keyword list is standard SQL common to PostgreSQL, MySQL, SQL Server and SQLite, so the practice transfers across databases.',
          },
          {
            question: 'Will this help me learn SQL?',
            answer:
              'It builds typing fluency, not query design. It pairs well with learning SQL properly — the syntax becomes automatic while you concentrate on the logic.',
          },
        ],
      },
      'pt-br': {
        title: 'Prática de Digitação SQL — Escreva Queries Mais Rápido',
        h1: 'Prática de Digitação SQL',
        description:
          'Pratique digitar palavras-chave, cláusulas e operadores SQL. Treine os padrões em maiúsculas que tornam queries lentas de escrever.',
        intro: 'SELECT, JOIN, WHERE — digitados até virarem memória muscular.',
        keywords: ['prática digitação sql', 'digitação palavras-chave sql', 'teste digitação banco de dados'],
        sections: [
          {
            heading: 'O problema das maiúsculas',
            body: 'A convenção SQL escreve palavras-chave em maiúsculas, o que significa apertar Shift em quase todas. Esse uso constante de modificador é uma habilidade distinta da digitação em minúsculas, e é a principal razão de SQL parecer mais lento do que sua lista curta de palavras sugere.',
          },
          {
            heading: 'Ordem das cláusulas como memória muscular',
            body: 'Queries seguem um esqueleto fixo: SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY. Treinar essa ordem como sequência digitada, em vez de lembrar cláusula por cláusula, remove bastante hesitação do dia a dia.',
          },
        ],
        faq: [
          {
            question: 'Palavras-chave SQL devem ser maiúsculas?',
            answer:
              'É uma convenção amplamente seguida, não uma exigência — SQL não diferencia maiúsculas em palavras-chave. A maioria dos times e guias de estilo usa maiúsculas por legibilidade, e este modo treina esse hábito.',
          },
          {
            question: 'Isso cobre algum dialeto SQL específico?',
            answer:
              'A lista é de SQL padrão, comum a PostgreSQL, MySQL, SQL Server e SQLite, então a prática transfere entre bancos.',
          },
          {
            question: 'Isso vai me ajudar a aprender SQL?',
            answer:
              'Constrói fluência de digitação, não design de queries. Funciona bem junto com o aprendizado real — a sintaxe fica automática enquanto você foca na lógica.',
          },
        ],
      },
    },
  },
  {
    key: 'numbers-typing',
    group: 'practice',
    sourceId: 'numbers',
    mode: 'words',
    limit: 40,
    related: ['symbols-typing', 'typing-lessons', 'typing-test', 'programming-typing'],
    relatedArticles: ['typing-numbers-and-numpad', 'typing-accuracy-tips', 'how-to-improve-typing-speed'],
    content: {
      en: {
        title: 'Number Typing Practice — Master the Number Row',
        h1: 'Number Typing Practice',
        description:
          'Practice typing numbers accurately. Train the number row and build the reach patterns that data entry and coding depend on.',
        intro: 'Numbers only. The row most typists never learned properly.',
        keywords: ['number typing practice', 'number row typing', 'numeric typing test'],
        sections: [
          {
            heading: 'The row everyone skips',
            body: 'Most typing courses teach the alphabet thoroughly and the number row barely at all. The result is that even fast typists look down for digits, which breaks rhythm badly in any work involving figures — invoices, data entry, spreadsheets, code with numeric literals.',
          },
          {
            heading: 'Finding the numbers without looking',
            body: 'Each finger owns the digit directly above its home key: index fingers cover 4, 5, 6 and 7, and the reach extends outward from there. Practising until the reach is automatic — rather than a glance-and-hunt — is what separates comfortable numeric typing from constant interruption.',
          },
        ],
        faq: [
          {
            question: 'Should I use the number row or the numpad?',
            answer:
              'For numbers mixed into text or code, the number row is faster because your hands stay in place. For long runs of pure digits, a numpad wins. Most people benefit from being competent at both.',
          },
          {
            question: 'Why do I keep looking down for numbers?',
            answer:
              'Because the reach was never trained to the point of automaticity. It is a fixable gap, and usually a fast one — the number row has only ten keys.',
          },
          {
            question: 'Does this practice include symbols?',
            answer:
              'This mode is digits only. The symbols practice covers the shifted characters that share the number row.',
          },
        ],
      },
      'pt-br': {
        title: 'Digitação de Números — Linha Numérica',
        h1: 'Prática de Digitação de Números',
        description:
          'Pratique digitar números com precisão. Treine a linha numérica e construa os padrões de alcance que entrada de dados e programação exigem.',
        intro: 'Somente números. A linha que quase ninguém aprendeu direito.',
        keywords: ['prática digitação números', 'digitação linha numérica', 'teste digitação numérica'],
        sections: [
          {
            heading: 'A linha que todo mundo pula',
            body: 'A maioria dos cursos ensina o alfabeto a fundo e a linha numérica quase nada. O resultado é que até digitadores rápidos olham para o teclado ao digitar dígitos, o que quebra o ritmo em qualquer trabalho com números — notas fiscais, entrada de dados, planilhas, código com literais numéricos.',
          },
          {
            heading: 'Achando os números sem olhar',
            body: 'Cada dedo é dono do dígito logo acima da sua tecla de descanso: os indicadores cobrem 4, 5, 6 e 7, e o alcance se estende para fora a partir daí. Praticar até o alcance ficar automático — em vez de olhar e procurar — é o que separa digitação numérica confortável de interrupção constante.',
          },
        ],
        faq: [
          {
            question: 'Devo usar a linha numérica ou o teclado numérico?',
            answer:
              'Para números misturados a texto ou código, a linha numérica é mais rápida porque as mãos ficam no lugar. Para sequências longas de dígitos, o numpad ganha. Vale ser competente nos dois.',
          },
          {
            question: 'Por que continuo olhando para digitar números?',
            answer:
              'Porque o alcance nunca foi treinado até virar automático. É uma lacuna corrigível, e geralmente rápida — a linha numérica tem só dez teclas.',
          },
          {
            question: 'Esta prática inclui símbolos?',
            answer:
              'Este modo é só de dígitos. A prática de símbolos cobre os caracteres com Shift que dividem a linha numérica.',
          },
        ],
      },
    },
  },
  {
    key: 'symbols-typing',
    group: 'practice',
    sourceId: 'symbols',
    mode: 'words',
    limit: 40,
    related: ['numbers-typing', 'programming-typing', 'javascript-typing', 'typing-lessons'],
    relatedArticles: ['typing-symbols-and-brackets', 'programming-typing-practice', 'typing-accuracy-tips'],
    content: {
      en: {
        title: 'Symbol Typing Practice — Brackets and Operators',
        h1: 'Symbol Typing Practice',
        description:
          'Drill the symbol keys: brackets, braces, operators and punctuation. The reaches that slow down every programmer and technical writer.',
        intro: 'Pure symbol drilling. Awkward on purpose.',
        keywords: ['symbol typing practice', 'bracket typing', 'special characters typing'],
        sections: [
          {
            heading: 'Why symbols feel so awkward',
            body: 'Almost every symbol requires a shifted reach to the edges of the keyboard, where the weakest fingers work. Unlike letters, symbols appear in unpredictable positions rather than in familiar word shapes, so pattern recognition cannot rescue you — each one has to be found deliberately.',
          },
          {
            heading: 'Pairs before singles',
            body: 'Delimiters travel in pairs, so practise them as pairs: `()`, `[]`, `{}`, `<>`, and the quote characters. Training the opening and closing motion as one unit is markedly faster than learning each character in isolation and assembling them later.',
          },
        ],
        faq: [
          {
            question: 'Why are symbols harder than letters?',
            answer:
              'They sit at the keyboard edges, need the shift key, and are struck by the weakest fingers. They also lack the word-shape patterns that make letter sequences predictable.',
          },
          {
            question: 'Does keyboard layout change which symbols are hard?',
            answer:
              'Considerably. ANSI, ISO and locale-specific layouts place several symbols differently, and some require AltGr. Practise on the layout you actually use day to day.',
          },
          {
            question: 'How long until symbols feel natural?',
            answer:
              'Most people notice a clear difference within one to two weeks of short daily sessions. It is a small key set, so progress is quick once it is trained deliberately.',
          },
        ],
      },
      'pt-br': {
        title: 'Digitação de Símbolos — Colchetes e Operadores',
        h1: 'Prática de Digitação de Símbolos',
        description:
          'Treine as teclas de símbolos: colchetes, chaves, operadores e pontuação. Os alcances que atrasam programadores e redatores técnicos.',
        intro: 'Treino puro de símbolos. Desconfortável de propósito.',
        keywords: ['prática digitação símbolos', 'digitação colchetes', 'caracteres especiais digitação'],
        sections: [
          {
            heading: 'Por que símbolos são tão desconfortáveis',
            body: 'Quase todo símbolo exige um alcance com Shift até as bordas do teclado, onde trabalham os dedos mais fracos. Diferente das letras, símbolos aparecem em posições imprevisíveis em vez de formas de palavra familiares, então o reconhecimento de padrões não ajuda — cada um precisa ser encontrado deliberadamente.',
          },
          {
            heading: 'Pares antes de individuais',
            body: 'Delimitadores andam em pares, então pratique-os como pares: `()`, `[]`, `{}`, `<>` e as aspas. Treinar o movimento de abrir e fechar como uma unidade é bem mais rápido que aprender cada caractere isolado e juntá-los depois.',
          },
        ],
        faq: [
          {
            question: 'Por que símbolos são mais difíceis que letras?',
            answer:
              'Ficam nas bordas do teclado, exigem Shift e são digitados pelos dedos mais fracos. Também não têm os padrões de forma de palavra que tornam sequências de letras previsíveis.',
          },
          {
            question: 'O layout do teclado muda quais símbolos são difíceis?',
            answer:
              'Bastante. Layouts ANSI, ISO e locais posicionam vários símbolos de forma diferente, e alguns exigem AltGr. Pratique no layout que você usa de verdade.',
          },
          {
            question: 'Quanto tempo até símbolos ficarem naturais?',
            answer:
              'A maioria nota diferença clara em uma a duas semanas de sessões diárias curtas. É um conjunto pequeno de teclas, então o progresso é rápido quando treinado de propósito.',
          },
        ],
      },
    },
  },
  {
    key: 'daily-challenge',
    group: 'tool',
    sourceId: 'english-200',
    mode: 'words',
    limit: 50,
    related: ['typing-test', 'statistics', 'typing-test-1-minute', 'typing-lessons'],
    relatedArticles: ['typing-warm-up-routine', 'how-to-improve-typing-speed', 'building-a-typing-habit'],
    content: {
      en: {
        title: 'Daily Typing Challenge — One Test, Everyone, Every Day',
        h1: 'Daily Typing Challenge',
        description:
          'A new typing challenge every day. The same words for everyone, generated fresh at midnight UTC — build a streak and track your progress.',
        intro: 'Today’s words are the same for every visitor. Come back tomorrow for a new set.',
        keywords: ['daily typing challenge', 'typing challenge', 'daily typing test'],
        sections: [
          {
            heading: 'How the daily challenge works',
            body: 'The word list is generated from the date itself using a deterministic seed, so every visitor worldwide gets an identical test without any server involvement. At midnight UTC the seed changes and a new challenge begins.',
          },
          {
            heading: 'Why streaks work',
            body: 'Typing improvement comes from frequency far more than session length. A daily challenge gives you a reason to show up for five minutes, and the streak counter turns that into a habit worth protecting — which is the entire mechanism behind sustained progress.',
          },
        ],
        faq: [
          {
            question: 'Does everyone get the same words?',
            answer:
              'Yes. The prompt is derived from the date with a fixed algorithm, so every visitor sees the same challenge on the same day without any data being sent anywhere.',
          },
          {
            question: 'When does the challenge reset?',
            answer:
              'At midnight UTC. Using UTC rather than local time keeps the challenge identical worldwide.',
          },
          {
            question: 'What happens if I miss a day?',
            answer:
              'Your streak resets, but your history and statistics are kept. Nothing is lost except the streak count itself.',
          },
        ],
      },
      'pt-br': {
        title: 'Desafio Diário de Digitação — Um Teste, Todo Dia',
        h1: 'Desafio Diário de Digitação',
        description:
          'Um novo desafio de digitação todo dia. As mesmas palavras para todos, geradas à meia-noite UTC — construa uma sequência e acompanhe seu progresso.',
        intro: 'As palavras de hoje são as mesmas para todos os visitantes. Volte amanhã para um novo conjunto.',
        keywords: ['desafio diário digitação', 'desafio de digitação', 'teste diário digitação'],
        sections: [
          {
            heading: 'Como funciona o desafio diário',
            body: 'A lista de palavras é gerada a partir da própria data com uma semente determinística, então todos os visitantes do mundo recebem um teste idêntico sem qualquer servidor envolvido. À meia-noite UTC a semente muda e começa um novo desafio.',
          },
          {
            heading: 'Por que sequências funcionam',
            body: 'A melhora na digitação vem muito mais da frequência que da duração da sessão. Um desafio diário te dá um motivo para aparecer por cinco minutos, e o contador de sequência transforma isso em um hábito que vale proteger — que é todo o mecanismo por trás do progresso sustentado.',
          },
        ],
        faq: [
          {
            question: 'Todo mundo recebe as mesmas palavras?',
            answer:
              'Sim. O texto é derivado da data com um algoritmo fixo, então todos veem o mesmo desafio no mesmo dia sem que nenhum dado seja enviado a lugar algum.',
          },
          {
            question: 'Quando o desafio reinicia?',
            answer:
              'À meia-noite UTC. Usar UTC em vez do horário local mantém o desafio idêntico no mundo todo.',
          },
          {
            question: 'O que acontece se eu perder um dia?',
            answer:
              'Sua sequência zera, mas seu histórico e estatísticas são mantidos. Nada se perde além da contagem da sequência.',
          },
        ],
      },
    },
  },
];

const PAGE_BY_KEY = new Map(LANDING_PAGES.map((page) => [page.key, page]));

export function getLandingPage(key: string): LandingPage | undefined {
  return PAGE_BY_KEY.get(key);
}

export function getPagesByGroup(group: PageGroup): readonly LandingPage[] {
  return LANDING_PAGES.filter((page) => page.group === group);
}

/** Resolves related route keys into full page objects, skipping unknown keys. */
export function getRelatedPages(page: LandingPage): readonly LandingPage[] {
  return page.related
    .map((key) => PAGE_BY_KEY.get(key))
    .filter((related): related is LandingPage => related !== undefined);
}
