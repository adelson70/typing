/**
 * Lesson registry.
 *
 * Ordered by finger strength and reach difficulty rather than alphabetically —
 * the home row first, then the keys reachable without moving the hand, then the
 * awkward stretches. Each lesson points at the practice mode that drills it.
 */

import type { Locale } from '@/constants/i18n';

export interface Lesson {
  readonly id: string;
  /** Keys introduced, shown as a hint on the card. */
  readonly keys: string;
  /** Route key of the practice page this lesson sends you to. */
  readonly practiceRoute: string;
  readonly content: Record<Locale, { readonly title: string; readonly description: string }>;
}

export const LESSONS: readonly Lesson[] = [
  {
    id: 'home-row',
    keys: 'a s d f  j k l ;',
    practiceRoute: 'typing-test',
    content: {
      en: {
        title: 'Home Row Foundations',
        description:
          'The eight keys your fingers rest on. Everything else is measured from here, so this is the one lesson worth over-practising.',
      },
      'pt-br': {
        title: 'Fundamentos da Linha de Descanso',
        description:
          'As oito teclas onde seus dedos descansam. Todo o resto é medido a partir daqui, então esta é a lição que vale praticar em excesso.',
      },
    },
  },
  {
    id: 'top-row',
    keys: 'q w e r t  y u i o p',
    practiceRoute: 'typing-test',
    content: {
      en: {
        title: 'Upper Row Reaches',
        description:
          'Reaching up without lifting the hand. The index fingers stay anchored to F and J throughout.',
      },
      'pt-br': {
        title: 'Alcances da Linha Superior',
        description:
          'Alcançar para cima sem levantar a mão. Os indicadores permanecem ancorados em F e J o tempo todo.',
      },
    },
  },
  {
    id: 'bottom-row',
    keys: 'z x c v b  n m , . /',
    practiceRoute: 'typing-test',
    content: {
      en: {
        title: 'Lower Row and Punctuation',
        description:
          'The hardest row for most typists, worked by the weaker fingers curling under rather than reaching out.',
      },
      'pt-br': {
        title: 'Linha Inferior e Pontuação',
        description:
          'A linha mais difícil para a maioria, trabalhada pelos dedos mais fracos curvando para baixo em vez de esticar.',
      },
    },
  },
  {
    id: 'capitals',
    keys: 'Shift + letters',
    practiceRoute: 'typing-test',
    content: {
      en: {
        title: 'Capitals and Shift Technique',
        description:
          'Always use the opposite shift key from the letter. Same-hand shifting forces the hand off position and is the most common capitalisation error.',
      },
      'pt-br': {
        title: 'Maiúsculas e Técnica do Shift',
        description:
          'Sempre use o Shift do lado oposto à letra. Usar o mesmo lado tira a mão da posição e é o erro de maiúscula mais comum.',
      },
    },
  },
  {
    id: 'numbers',
    keys: '1 2 3 4 5  6 7 8 9 0',
    practiceRoute: 'numbers-typing',
    content: {
      en: {
        title: 'The Number Row',
        description:
          'The most neglected row in touch typing. Each finger owns the digit directly above its home key.',
      },
      'pt-br': {
        title: 'A Linha Numérica',
        description:
          'A linha mais negligenciada da digitação. Cada dedo é dono do dígito logo acima da sua tecla de descanso.',
      },
    },
  },
  {
    id: 'symbols',
    keys: '! @ # $ % ^ & * ( )',
    practiceRoute: 'symbols-typing',
    content: {
      en: {
        title: 'Symbols and Operators',
        description:
          'Shifted reaches at the keyboard edges. Learn the paired delimiters as pairs rather than as individual characters.',
      },
      'pt-br': {
        title: 'Símbolos e Operadores',
        description:
          'Alcances com Shift nas bordas do teclado. Aprenda os delimitadores pareados como pares, não como caracteres isolados.',
      },
    },
  },
  {
    id: 'common-words',
    keys: 'the, and, that, have…',
    practiceRoute: 'typing-test',
    content: {
      en: {
        title: 'High-Frequency Words',
        description:
          'The 200 most common English words make up roughly half of everyday writing. Drilling them as whole shapes pays back immediately.',
      },
      'pt-br': {
        title: 'Palavras de Alta Frequência',
        description:
          'As 200 palavras mais comuns representam cerca de metade da escrita cotidiana. Treiná-las como formas inteiras compensa imediatamente.',
      },
    },
  },
  {
    id: 'code',
    keys: '=> === {} [] ?.',
    practiceRoute: 'programming-typing',
    content: {
      en: {
        title: 'Code Syntax Patterns',
        description:
          'Operators and delimiters as single motions. This is where prose typists lose most of their speed in an editor.',
      },
      'pt-br': {
        title: 'Padrões de Sintaxe de Código',
        description:
          'Operadores e delimitadores como movimentos únicos. É aqui que digitadores de texto perdem a maior parte da velocidade no editor.',
      },
    },
  },
];
