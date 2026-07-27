/**
 * Blog category metadata.
 *
 * The category vocabulary lives in `@/constants/blog` (a plain module, so tests
 * can read it without `astro:content`); this adds the localised labels and
 * descriptions used for category landing pages and their metadata.
 */

import type { Locale } from '@/constants/i18n';
import type { BlogCategory } from '@/constants/blog';

export interface CategoryMeta {
  readonly slug: BlogCategory;
  readonly content: Record<Locale, { readonly label: string; readonly description: string }>;
}

export const CATEGORY_META: readonly CategoryMeta[] = [
  {
    slug: 'typing-tips',
    content: {
      en: { label: 'Typing Tips', description: 'Practical techniques for typing faster and more comfortably.' },
      'pt-br': { label: 'Dicas de Digitação', description: 'Técnicas práticas para digitar mais rápido e com mais conforto.' },
    },
  },
  {
    slug: 'learning',
    content: {
      en: { label: 'Learning', description: 'How typing skill develops, and how to structure your practice.' },
      'pt-br': { label: 'Aprendizado', description: 'Como a habilidade de digitação se desenvolve e como estruturar a prática.' },
    },
  },
  {
    slug: 'keyboard',
    content: {
      en: { label: 'Keyboard', description: 'Layouts, switches and hardware — what actually affects your typing.' },
      'pt-br': { label: 'Teclado', description: 'Layouts, switches e hardware — o que realmente afeta sua digitação.' },
    },
  },
  {
    slug: 'programming',
    content: {
      en: { label: 'Programming', description: 'Typing practice built around code, symbols and developer workflows.' },
      'pt-br': { label: 'Programação', description: 'Prática de digitação voltada a código, símbolos e fluxos de desenvolvimento.' },
    },
  },
  {
    slug: 'ergonomics',
    content: {
      en: { label: 'Ergonomics', description: 'Posture, wrist position and avoiding strain during long typing sessions.' },
      'pt-br': { label: 'Ergonomia', description: 'Postura, posição dos pulsos e como evitar lesões em sessões longas.' },
    },
  },
  {
    slug: 'productivity',
    content: {
      en: { label: 'Productivity', description: 'Building habits and turning practice into lasting improvement.' },
      'pt-br': { label: 'Produtividade', description: 'Criando hábitos e transformando prática em melhora duradoura.' },
    },
  },
  {
    slug: 'beginner',
    content: {
      en: { label: 'Beginner', description: 'Starting from zero — touch typing fundamentals and first steps.' },
      'pt-br': { label: 'Iniciante', description: 'Começando do zero — fundamentos da digitação e primeiros passos.' },
    },
  },
  {
    slug: 'advanced',
    content: {
      en: { label: 'Advanced', description: 'Pushing past a plateau once the fundamentals are automatic.' },
      'pt-br': { label: 'Avançado', description: 'Superando o platô quando os fundamentos já estão automáticos.' },
    },
  },
  {
    slug: 'statistics',
    content: {
      en: { label: 'Statistics', description: 'Typing speed data, benchmarks and how to interpret your numbers.' },
      'pt-br': { label: 'Estatísticas', description: 'Dados de velocidade, referências e como interpretar seus números.' },
    },
  },
  {
    slug: 'speed',
    content: {
      en: { label: 'Speed', description: 'Getting faster — the methods that work and the ones that waste time.' },
      'pt-br': { label: 'Velocidade', description: 'Ficando mais rápido — os métodos que funcionam e os que desperdiçam tempo.' },
    },
  },
  {
    slug: 'accuracy',
    content: {
      en: { label: 'Accuracy', description: 'Reducing errors, because mistakes cost more time than slow typing.' },
      'pt-br': { label: 'Precisão', description: 'Reduzindo erros, porque enganos custam mais tempo que digitar devagar.' },
    },
  },
  {
    slug: 'gaming',
    content: {
      en: { label: 'Gaming', description: 'Typing games and gamified practice — what helps and what distracts.' },
      'pt-br': { label: 'Jogos', description: 'Jogos de digitação e prática gamificada — o que ajuda e o que distrai.' },
    },
  },
];

const BY_SLUG = new Map(CATEGORY_META.map((category) => [category.slug, category]));

export function getCategoryMeta(slug: string): CategoryMeta | undefined {
  return BY_SLUG.get(slug as BlogCategory);
}
