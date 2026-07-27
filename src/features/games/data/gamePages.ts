/**
 * Page content for each game, in both locales.
 *
 * Kept lighter than `LANDING_PAGES`: those exist to rank for a search term and
 * carry a full editorial contract, while a game page exists so someone can play.
 * The copy is here to explain the rules and give the page something for a
 * crawler to read, not to compete as an article.
 */

import type { Locale } from '@/constants/i18n';
import type { FaqItem } from '@/types/seo';
import type { GameId } from '../domain/types';

export interface GamePageContent {
  readonly title: string;
  readonly h1: string;
  readonly description: string;
  readonly intro: string;
  readonly howToPlay: readonly string[];
  readonly keywords: readonly string[];
  readonly faq: readonly FaqItem[];
}

export interface GamePage {
  readonly id: GameId;
  readonly routeKey: string;
  /** Emoji shown on the hub card. Text, so there is no image request. */
  readonly icon: string;
  readonly content: Record<Locale, GamePageContent>;
}

export const GAME_PAGES: readonly GamePage[] = [
  {
    id: 'word-rain',
    routeKey: 'games/word-rain',
    icon: '🌧️',
    content: {
      en: {
        title: 'Word Rain — Typing Game',
        h1: 'Word Rain',
        description:
          'Words fall from the top of the screen. Type them to destroy them before they pile up on the floor and end your run.',
        intro:
          'A typing game about triage. Several words are always in the air, and the one nearest the floor is the one that matters — so the skill being trained is not raw speed but choosing what to type next under pressure.',
        howToPlay: [
          'Start typing any word on screen — the first letter you press picks your target.',
          'The lowest matching word is chosen automatically, because it is the most urgent one.',
          'Finish a word and it disappears. Miss one and it lands, filling part of the floor.',
          'Eight missed words fill the floor and end the run. Speed rises as you clear more.',
        ],
        keywords: ['word rain', 'falling words typing game', 'typing game', 'typing practice game'],
        faq: [
          {
            question: 'How do I choose which word to type?',
            answer:
              'You do not have to. Pressing a letter locks onto the lowest word that starts with it, which is almost always the one you should be typing. Once locked, every key goes to that word until you finish it or it lands.',
          },
          {
            question: 'Does a mistake switch me to a different word?',
            answer:
              'No. A wrong key counts as an error but keeps your current target. Retargeting on a mistake would move your half-typed progress to another word, which reads as the game misbehaving rather than as your error.',
          },
          {
            question: 'Do missed words hurt my accuracy?',
            answer:
              'Yes. Every character of a word that reaches the floor counts as missed, minus whatever you had already typed. Letting the screen fill up has to cost something, or panicking would be a free strategy.',
          },
          {
            question: 'Does this count toward my typing statistics?',
            answer:
              'It earns XP, achievements and keeps your daily streak alive, but game results are stored separately from your test history. Your average WPM on the statistics page reflects real tests only.',
          },
        ],
      },
      'pt-br': {
        title: 'Chuva de Palavras — Jogo de Digitação',
        h1: 'Chuva de Palavras',
        description:
          'Palavras caem do topo da tela. Digite para destruí-las antes que se acumulem no chão e encerrem a partida.',
        intro:
          'Um jogo de digitação sobre priorizar. Há sempre várias palavras no ar, e a mais próxima do chão é a que importa — então a habilidade treinada não é velocidade pura, e sim escolher o que digitar sob pressão.',
        howToPlay: [
          'Comece a digitar qualquer palavra da tela — a primeira letra escolhe seu alvo.',
          'A palavra mais baixa que combina é escolhida automaticamente, por ser a mais urgente.',
          'Termine uma palavra e ela some. Perca uma e ela cai, ocupando parte do chão.',
          'Oito palavras perdidas enchem o chão e encerram a partida. A velocidade sobe conforme você avança.',
        ],
        keywords: [
          'chuva de palavras',
          'jogo de digitação',
          'jogo de palavras caindo',
          'praticar digitação jogando',
        ],
        faq: [
          {
            question: 'Como escolho qual palavra digitar?',
            answer:
              'Você não precisa escolher. Ao pressionar uma letra, o jogo trava na palavra mais baixa que começa com ela, que quase sempre é a que você deveria digitar. Travado o alvo, todas as teclas vão para ela até você terminar ou ela cair.',
          },
          {
            question: 'Um erro me joga para outra palavra?',
            answer:
              'Não. A tecla errada conta como erro, mas mantém o alvo atual. Trocar de alvo no erro moveria seu progresso pela metade para outra palavra, o que parece defeito do jogo em vez de erro seu.',
          },
          {
            question: 'Palavras perdidas prejudicam minha precisão?',
            answer:
              'Sim. Cada caractere de uma palavra que chega ao chão conta como perdido, descontando o que você já havia digitado. Deixar a tela encher precisa custar algo, senão entrar em pânico seria uma estratégia gratuita.',
          },
          {
            question: 'Isso entra nas minhas estatísticas de digitação?',
            answer:
              'Rende XP, conquistas e mantém sua ofensiva diária, mas os resultados de jogo ficam guardados separadamente do histórico de testes. Sua média de PPM na página de estatísticas reflete apenas testes de verdade.',
          },
        ],
      },
    },
  },
  {
    id: 'bomb-defusal',
    routeKey: 'games/bomb-defusal',
    icon: '💣',
    content: {
      en: {
        title: 'Bomb Defusal — Typing Game',
        h1: 'Bomb Defusal',
        description:
          'One word, one burning fuse. Type it before the timer runs out. The fuse gets shorter the better you do.',
        intro:
          'A single target and a visible countdown. Where Word Rain trains triage, this trains committing to a word and finishing it — the fuse punishes hesitation far more than it punishes a slow top speed.',
        howToPlay: [
          'A word appears with a fuse. Type it correctly before the fuse burns out.',
          'Defusing with time to spare scores more, so speed is rewarded twice.',
          'A wrong key burns a second off the fuse — guessing letters is never free.',
          'You have three lives. The fuse shortens as your level rises, but never below 2.5 seconds.',
        ],
        keywords: ['bomb defusal typing', 'typing timer game', 'speed typing game', 'typing game'],
        faq: [
          {
            question: 'How long do I get for each word?',
            answer:
              'The fuse scales with the length of the word and shortens as your level rises, with a floor of 2.5 seconds. A nine-letter word at that floor is about 110 WPM — hard, but reachable, which is where a difficulty ramp should stop.',
          },
          {
            question: 'What happens when I mistype?',
            answer:
              'You lose one second of fuse and your combo resets. With only one target on screen, an error has to cost something concrete, or pressing keys at random would be a viable tactic.',
          },
          {
            question: 'Why three lives instead of one?',
            answer:
              'A single-mistake game on a timer is one most people lose in ten seconds and never open again. Three lives leave room to recover from one bad word.',
          },
          {
            question: 'Does the game get impossible eventually?',
            answer:
              'No. Every difficulty curve is capped — the fuse floors at 2.5 seconds no matter how deep the run goes. The run ends because you ran out of lives, never because the game became unwinnable.',
          },
        ],
      },
      'pt-br': {
        title: 'Desarme a Bomba — Jogo de Digitação',
        h1: 'Desarme a Bomba',
        description:
          'Uma palavra, um pavio aceso. Digite antes que o tempo acabe. O pavio encurta conforme você acerta.',
        intro:
          'Um alvo só e uma contagem visível. Onde a Chuva de Palavras treina priorização, aqui se treina assumir uma palavra e terminá-la — o pavio pune hesitação muito mais do que pune velocidade máxima baixa.',
        howToPlay: [
          'Uma palavra aparece com um pavio. Digite corretamente antes que ele queime.',
          'Desarmar com tempo sobrando pontua mais, então a velocidade é premiada duas vezes.',
          'Uma tecla errada queima um segundo do pavio — chutar letras nunca é de graça.',
          'Você tem três vidas. O pavio encurta com o nível, mas nunca abaixo de 2,5 segundos.',
        ],
        keywords: [
          'desarme a bomba digitação',
          'jogo de digitação com tempo',
          'jogo de velocidade de digitação',
          'jogo de digitação',
        ],
        faq: [
          {
            question: 'Quanto tempo tenho para cada palavra?',
            answer:
              'O pavio acompanha o tamanho da palavra e encurta conforme seu nível sobe, com piso de 2,5 segundos. Uma palavra de nove letras nesse piso equivale a cerca de 110 PPM — difícil, mas alcançável, que é onde uma curva de dificuldade deve parar.',
          },
          {
            question: 'O que acontece quando erro?',
            answer:
              'Você perde um segundo de pavio e o combo zera. Com um único alvo na tela, o erro precisa custar algo concreto, senão apertar teclas ao acaso seria uma tática viável.',
          },
          {
            question: 'Por que três vidas em vez de uma?',
            answer:
              'Um jogo cronometrado que acaba no primeiro erro é um jogo que a maioria perde em dez segundos e nunca mais abre. Três vidas dão espaço para se recuperar de uma palavra ruim.',
          },
          {
            question: 'O jogo fica impossível em algum momento?',
            answer:
              'Não. Toda curva de dificuldade tem teto — o pavio para em 2,5 segundos por mais longe que a partida vá. A partida acaba porque suas vidas acabaram, nunca porque o jogo virou invencível.',
          },
        ],
      },
    },
  },
  {
    id: 'survival',
    routeKey: 'games/survival',
    icon: '🛡️',
    content: {
      en: {
        title: 'Survival — One-Mistake Typing Game',
        h1: 'Survival',
        description:
          'Endless typing with a single life. One wrong key ends the run. Your score is how long you lasted.',
        intro:
          'The mode that inverts the usual incentive. Every other typing game rewards speed and tolerates errors, so players learn to type fast and sloppily. Here the only way to last is to not be wrong — which is the harder skill, and the one that actually transfers to real writing.',
        howToPlay: [
          'Words fall as they do in Word Rain, but the run ends on your first incorrect key.',
          'Letting a word reach the floor costs accuracy but does not end the run.',
          'Your score is time survived, not words cleared — so slowing down is a valid strategy.',
          'Difficulty rises continuously. There is no finish line, only how long you hold on.',
        ],
        keywords: [
          'survival typing game',
          'one mistake typing game',
          'typing accuracy game',
          'endless typing game',
        ],
        faq: [
          {
            question: 'Does one typo really end the run?',
            answer:
              'Yes. That is the entire design. Speed-focused practice teaches you to race past errors and fix them later; this mode makes the first error final, which forces the deliberate, accurate typing that speed practice erodes.',
          },
          {
            question: 'What if I let a word fall instead of typing it?',
            answer:
              'The run continues. Missed characters count against your accuracy, but skipping a word you are unsure of is a legitimate — and sometimes correct — choice. The mode punishes being wrong, not being slow.',
          },
          {
            question: 'How is the score calculated?',
            answer:
              'Purely by time survived. Clearing words earns no points, which is deliberate: it removes any incentive to rush and leaves lasting as the only goal.',
          },
          {
            question: 'Is this good practice or just frustrating?',
            answer:
              'Both, at first. Accuracy is the foundation speed is built on, and most plateaus come from typing fast enough to make errors and slow enough to fix them. A few short survival runs a session is usually the right dose.',
          },
        ],
      },
      'pt-br': {
        title: 'Sobrevivência — Jogo de Digitação Sem Erros',
        h1: 'Sobrevivência',
        description:
          'Digitação infinita com uma vida só. Uma tecla errada encerra a partida. Sua pontuação é quanto tempo você durou.',
        intro:
          'O modo que inverte o incentivo de sempre. Todo jogo de digitação premia velocidade e tolera erros, então o jogador aprende a digitar rápido e desleixado. Aqui, o único jeito de durar é não errar — a habilidade mais difícil, e a que de fato se transfere para a escrita real.',
        howToPlay: [
          'As palavras caem como na Chuva de Palavras, mas a partida acaba na primeira tecla errada.',
          'Deixar uma palavra chegar ao chão custa precisão, mas não encerra a partida.',
          'Sua pontuação é o tempo sobrevivido, não as palavras destruídas — desacelerar é estratégia válida.',
          'A dificuldade sobe continuamente. Não há linha de chegada, só quanto tempo você aguenta.',
        ],
        keywords: [
          'jogo de sobrevivência digitação',
          'jogo de digitação sem erros',
          'jogo de precisão de digitação',
          'jogo de digitação infinito',
        ],
        faq: [
          {
            question: 'Um erro de digitação encerra mesmo a partida?',
            answer:
              'Sim. É todo o projeto do modo. A prática focada em velocidade ensina a passar por cima dos erros e corrigir depois; aqui o primeiro erro é definitivo, o que força a digitação deliberada e precisa que o treino de velocidade corrói.',
          },
          {
            question: 'E se eu deixar uma palavra cair em vez de digitar?',
            answer:
              'A partida continua. Os caracteres perdidos contam contra sua precisão, mas pular uma palavra da qual você não tem certeza é uma escolha legítima — e às vezes correta. O modo pune errar, não ser lento.',
          },
          {
            question: 'Como a pontuação é calculada?',
            answer:
              'Apenas pelo tempo sobrevivido. Destruir palavras não rende pontos, e isso é proposital: remove qualquer incentivo à pressa e deixa durar como único objetivo.',
          },
          {
            question: 'Isso é bom treino ou só frustrante?',
            answer:
              'Os dois, no começo. Precisão é a base sobre a qual a velocidade se constrói, e a maioria dos platôs vem de digitar rápido o bastante para errar e devagar o bastante para corrigir. Algumas partidas curtas por sessão costuma ser a dose certa.',
          },
        ],
      },
    },
  },
];

const BY_ID = new Map(GAME_PAGES.map((page) => [page.id, page]));

export function getGamePage(id: string): GamePage | undefined {
  return BY_ID.get(id as GameId);
}
