/**
 * UI string dictionary.
 *
 * `TranslationKey` is derived from the English dictionary, and every other
 * locale is typed as `Record<TranslationKey, string>`. A missing or misspelled
 * key is therefore a build error rather than a blank space in production.
 *
 * Page *content* (titles, descriptions, article bodies) lives in data files and
 * content collections — this holds only chrome and UI labels.
 */

import { DEFAULT_LOCALE, type Locale } from '@/constants/i18n';

const en = {
  // Navigation
  'nav.typingTest': 'Typing Test',
  'nav.lessons': 'Lessons',
  'nav.programming': 'Programming',
  'nav.games': 'Games',
  'nav.statistics': 'Statistics',
  'nav.blog': 'Blog',
  'nav.menu': 'Menu',
  'nav.openMenu': 'Open menu',
  'nav.closeMenu': 'Close menu',
  'nav.home': 'Home',

  // Typing test UI
  'test.start': 'Start typing to begin',
  'test.restart': 'Restart',
  'test.restartHint': 'Press Tab then Enter to restart',
  'test.wpm': 'WPM',
  'test.cpm': 'CPM',
  'test.accuracy': 'Accuracy',
  'test.time': 'Time',
  'test.errors': 'Errors',
  'test.consistency': 'Consistency',
  'test.rawWpm': 'Raw WPM',
  'test.characters': 'Characters',
  'test.duration': 'Duration',
  'test.mode': 'Mode',
  'test.results': 'Results',
  'test.tryAgain': 'Try again',
  'test.newTest': 'New test',
  'test.personalBest': 'Personal best',
  'test.seconds': 'seconds',
  'test.minutes': 'minutes',
  'test.words': 'words',
  'test.focusPrompt': 'Click here or press any key to focus',
  'test.paused': 'Paused',

  // Results
  'results.title': 'Your result',
  'results.share': 'Share result',
  'results.copied': 'Copied to clipboard',
  'results.saveHint': 'Saved to your device only',

  // Settings
  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.themeDark': 'Dark',
  'settings.themeLight': 'Light',
  'settings.themeSystem': 'System',
  'settings.sound': 'Sound',
  'settings.language': 'Language',
  'settings.smoothCaret': 'Smooth caret',
  'settings.blindMode': 'Blind mode',
  'settings.stopOnError': 'Stop on error',

  // Statistics
  'stats.title': 'Statistics',
  'stats.testsCompleted': 'Tests completed',
  'stats.averageWpm': 'Average WPM',
  'stats.bestWpm': 'Best WPM',
  'stats.averageAccuracy': 'Average accuracy',
  'stats.timeTyping': 'Time typing',
  'stats.empty': 'No results yet. Complete a typing test to see your statistics.',
  'stats.history': 'History',

  // Common
  'common.readMore': 'Read more',
  'common.relatedPages': 'Related pages',
  'common.relatedLessons': 'Related lessons',
  'common.relatedArticles': 'Related articles',
  'common.relatedModes': 'Related typing modes',
  'common.faq': 'Frequently asked questions',
  'common.search': 'Search',
  'common.searchPlaceholder': 'Search lessons, articles and tools',
  'common.noResults': 'No results found',
  'common.previous': 'Previous',
  'common.next': 'Next',
  'common.page': 'Page',
  'common.minuteRead': 'min read',
  'common.updated': 'Updated',
  'common.published': 'Published',
  'common.category': 'Category',
  'common.allCategories': 'All categories',
  'common.startTyping': 'Start typing test',
  'common.viewAll': 'View all',

  // Accessibility
  'a11y.skipToContent': 'Skip to main content',
  'a11y.breadcrumb': 'Breadcrumb',
  'a11y.pagination': 'Pagination',
  'a11y.typingInput': 'Typing input',
  'a11y.liveResults': 'Live typing statistics',
  'a11y.toggleTheme': 'Toggle colour theme',
  'a11y.selectLanguage': 'Select language',

  // PWA
  'pwa.install': 'Install app',
  'pwa.installPrompt': 'Install Typing Studio for offline practice',
  'pwa.dismiss': 'Not now',
  'pwa.offline': 'You are offline. Practice still works.',

  // Ads
  'ads.adblock.title': 'Ad blocker detected',
  'ads.adblock.body':
    'Typing Studio is free because of ads. Please disable your ad blocker for this site so we can keep it that way.',
  'ads.adblock.reassurance':
    'Our ads are discreet and won\'t get in the way of your practice.',
  'ads.adblock.refresh': 'After disabling, refresh this page',

  // Errors
  'error.notFound': 'Page not found',
  'error.notFoundBody': 'The page you are looking for does not exist or has moved.',
  'error.backHome': 'Back to home',

  // Progression
  'xp.level': 'Level',
  'xp.xp': 'XP',
  'xp.toNextLevel': 'to level {n}',
  'xp.gained': 'XP earned',
  'xp.levelUp': 'Level up!',
  'xp.newLevel': 'You reached level {n}',
  'xp.breakdown': 'How you earned it',
  'xp.combo': 'Combo',
  'xp.bestCombo': 'Best combo',
  'xp.streak': 'Day streak',
  'xp.streakActive': '{n}-day streak',
  'xp.streakStart': 'Start a streak',
  'xp.streakKeep': 'Practise today to keep it',
  'xp.nextUp': 'Next up',
  'xp.achievements': 'Achievements',
  'xp.unlocked': 'Unlocked',
  'xp.locked': 'Locked',
  'xp.newAchievement': 'Achievement unlocked',
  'xp.progressTo': '{current} of {target}',

  // Achievement names
  'ach.first-test': 'First Steps',
  'ach.tests-10': 'Getting Started',
  'ach.tests-50': 'Committed',
  'ach.tests-250': 'Relentless',
  'ach.streak-3': 'Three in a Row',
  'ach.streak-7': 'Full Week',
  'ach.streak-30': 'Unbreakable',
  'ach.wpm-40': 'Warmed Up',
  'ach.wpm-60': 'Professional Pace',
  'ach.wpm-80': 'Quick Hands',
  'ach.wpm-100': 'Century',
  'ach.accuracy-95': 'Steady Hands',
  'ach.accuracy-99': 'Precision',
  'ach.accuracy-100': 'Flawless',
  'ach.combo-100': 'On a Roll',
  'ach.combo-300': 'Unstoppable',
  'ach.time-1h': 'An Hour In',
  'ach.time-10h': 'Ten Hours Deep',

  // Game achievements
  'ach.game-first-run': 'First Play',
  'ach.game-runs-25': 'Arcade Regular',
  'ach.game-rain-100': 'Cloudburst',
  'ach.game-rain-500': 'Storm Front',
  'ach.game-rain-2000': 'Downpour',
  'ach.game-survive-60': 'One Minute Down',
  'ach.game-survive-180': 'Three Minute Wall',
  'ach.game-survive-300': 'Five Minute Legend',
  'ach.game-bomb-25': 'Bomb Squad',
  'ach.game-bomb-100': 'Demolition Expert',
  'ach.game-combo-150': 'Chain Reaction',

  // Games
  'game.score': 'Score',
  'game.level': 'Level',
  'game.best': 'Best',
  'game.lives': 'Lives',
  'game.floor': 'Floor',
  'game.fuse': 'Fuse',
  'game.survived': 'Survived',
  'game.wordsDestroyed': 'Words destroyed',
  'game.wordsMissed': 'Words missed',
  'game.gameOver': 'Game over',
  'game.newBest': 'New best score',
  'game.playAgain': 'Play again',
  'game.quit': 'End run',
  'game.paused': 'Paused',
  'game.pausedHint': 'Return to this tab to continue',
  'game.startHint': 'Just start typing a word',
  'game.endedFloor': 'The floor filled up',
  'game.endedError': 'One wrong key ended the run',
  'game.endedTimeout': 'You ran out of lives',
  'game.endedQuit': 'Run ended',
  'game.tooShort': 'Too short to earn XP — play at least a few seconds',
  'game.stage': 'Game area',
  'game.allGames': 'All games',
  'game.timedChallenges': 'Timed challenges',
  'game.howToPlay': 'How to play',

  // Code mode
  'code.enterHint': 'Press Enter at the end of each line — indentation is added for you',
  'code.lines': 'lines',
  'code.language': 'Language',
} as const;

export type TranslationKey = keyof typeof en;

const ptBr: Record<TranslationKey, string> = {
  // Navegação
  'nav.typingTest': 'Teste de Digitação',
  'nav.lessons': 'Lições',
  'nav.programming': 'Programação',
  'nav.games': 'Jogos',
  'nav.statistics': 'Estatísticas',
  'nav.blog': 'Blog',
  'nav.menu': 'Menu',
  'nav.openMenu': 'Abrir menu',
  'nav.closeMenu': 'Fechar menu',
  'nav.home': 'Início',

  // Interface do teste
  'test.start': 'Comece a digitar para iniciar',
  'test.restart': 'Reiniciar',
  'test.restartHint': 'Pressione Tab e Enter para reiniciar',
  'test.wpm': 'PPM',
  'test.cpm': 'CPM',
  'test.accuracy': 'Precisão',
  'test.time': 'Tempo',
  'test.errors': 'Erros',
  'test.consistency': 'Consistência',
  'test.rawWpm': 'PPM bruto',
  'test.characters': 'Caracteres',
  'test.duration': 'Duração',
  'test.mode': 'Modo',
  'test.results': 'Resultados',
  'test.tryAgain': 'Tentar novamente',
  'test.newTest': 'Novo teste',
  'test.personalBest': 'Recorde pessoal',
  'test.seconds': 'segundos',
  'test.minutes': 'minutos',
  'test.words': 'palavras',
  'test.focusPrompt': 'Clique aqui ou pressione qualquer tecla para focar',
  'test.paused': 'Pausado',

  // Resultados
  'results.title': 'Seu resultado',
  'results.share': 'Compartilhar resultado',
  'results.copied': 'Copiado para a área de transferência',
  'results.saveHint': 'Salvo apenas no seu dispositivo',

  // Configurações
  'settings.title': 'Configurações',
  'settings.theme': 'Tema',
  'settings.themeDark': 'Escuro',
  'settings.themeLight': 'Claro',
  'settings.themeSystem': 'Sistema',
  'settings.sound': 'Som',
  'settings.language': 'Idioma',
  'settings.smoothCaret': 'Cursor suave',
  'settings.blindMode': 'Modo cego',
  'settings.stopOnError': 'Parar no erro',

  // Estatísticas
  'stats.title': 'Estatísticas',
  'stats.testsCompleted': 'Testes concluídos',
  'stats.averageWpm': 'PPM médio',
  'stats.bestWpm': 'Melhor PPM',
  'stats.averageAccuracy': 'Precisão média',
  'stats.timeTyping': 'Tempo digitando',
  'stats.empty': 'Nenhum resultado ainda. Complete um teste para ver suas estatísticas.',
  'stats.history': 'Histórico',

  // Comum
  'common.readMore': 'Ler mais',
  'common.relatedPages': 'Páginas relacionadas',
  'common.relatedLessons': 'Lições relacionadas',
  'common.relatedArticles': 'Artigos relacionados',
  'common.relatedModes': 'Modos de digitação relacionados',
  'common.faq': 'Perguntas frequentes',
  'common.search': 'Buscar',
  'common.searchPlaceholder': 'Buscar lições, artigos e ferramentas',
  'common.noResults': 'Nenhum resultado encontrado',
  'common.previous': 'Anterior',
  'common.next': 'Próxima',
  'common.page': 'Página',
  'common.minuteRead': 'min de leitura',
  'common.updated': 'Atualizado',
  'common.published': 'Publicado',
  'common.category': 'Categoria',
  'common.allCategories': 'Todas as categorias',
  'common.startTyping': 'Iniciar teste de digitação',
  'common.viewAll': 'Ver todos',

  // Acessibilidade
  'a11y.skipToContent': 'Pular para o conteúdo principal',
  'a11y.breadcrumb': 'Trilha de navegação',
  'a11y.pagination': 'Paginação',
  'a11y.typingInput': 'Campo de digitação',
  'a11y.liveResults': 'Estatísticas de digitação ao vivo',
  'a11y.toggleTheme': 'Alternar tema de cores',
  'a11y.selectLanguage': 'Selecionar idioma',

  // PWA
  'pwa.install': 'Instalar aplicativo',
  'pwa.installPrompt': 'Instale o Typing Studio para praticar offline',
  'pwa.dismiss': 'Agora não',
  'pwa.offline': 'Você está offline. A prática continua funcionando.',

  // Anúncios
  'ads.adblock.title': 'Bloqueador de anúncios detectado',
  'ads.adblock.body':
    'O Typing Studio é gratuito graças aos anúncios. Desative o bloqueador de anúncios neste site para que possamos continuar assim.',
  'ads.adblock.reassurance':
    'Nossos anúncios são discretos e não atrapalham a sua prática.',
  'ads.adblock.refresh': 'Depois de desativar, atualize esta página',

  // Erros
  'error.notFound': 'Página não encontrada',
  'error.notFoundBody': 'A página que você procura não existe ou foi movida.',
  'error.backHome': 'Voltar ao início',

  // Progressão
  'xp.level': 'Nível',
  'xp.xp': 'XP',
  'xp.toNextLevel': 'para o nível {n}',
  'xp.gained': 'XP ganho',
  'xp.levelUp': 'Subiu de nível!',
  'xp.newLevel': 'Você chegou ao nível {n}',
  'xp.breakdown': 'Como você ganhou',
  'xp.combo': 'Combo',
  'xp.bestCombo': 'Melhor combo',
  'xp.streak': 'Dias seguidos',
  'xp.streakActive': '{n} dias seguidos',
  'xp.streakStart': 'Comece uma sequência',
  'xp.streakKeep': 'Pratique hoje para manter',
  'xp.nextUp': 'Próxima meta',
  'xp.achievements': 'Conquistas',
  'xp.unlocked': 'Desbloqueada',
  'xp.locked': 'Bloqueada',
  'xp.newAchievement': 'Conquista desbloqueada',
  'xp.progressTo': '{current} de {target}',

  // Nomes das conquistas
  'ach.first-test': 'Primeiros Passos',
  'ach.tests-10': 'Engrenando',
  'ach.tests-50': 'Dedicado',
  'ach.tests-250': 'Implacável',
  'ach.streak-3': 'Três Seguidos',
  'ach.streak-7': 'Semana Cheia',
  'ach.streak-30': 'Inquebrável',
  'ach.wpm-40': 'Aquecido',
  'ach.wpm-60': 'Ritmo Profissional',
  'ach.wpm-80': 'Mãos Rápidas',
  'ach.wpm-100': 'Century',
  'ach.accuracy-95': 'Mão Firme',
  'ach.accuracy-99': 'Precisão',
  'ach.accuracy-100': 'Impecável',
  'ach.combo-100': 'Embalado',
  'ach.combo-300': 'Imparável',
  'ach.time-1h': 'Uma Hora',
  'ach.time-10h': 'Dez Horas',

  // Conquistas de jogo
  'ach.game-first-run': 'Primeira Partida',
  'ach.game-runs-25': 'Frequentador do Arcade',
  'ach.game-rain-100': 'Aguaceiro',
  'ach.game-rain-500': 'Frente de Tempestade',
  'ach.game-rain-2000': 'Temporal',
  'ach.game-survive-60': 'Um Minuto',
  'ach.game-survive-180': 'Muralha de Três Minutos',
  'ach.game-survive-300': 'Lenda dos Cinco Minutos',
  'ach.game-bomb-25': 'Esquadrão Antibombas',
  'ach.game-bomb-100': 'Perito em Demolição',
  'ach.game-combo-150': 'Reação em Cadeia',

  // Jogos
  'game.score': 'Pontos',
  'game.level': 'Nível',
  'game.best': 'Recorde',
  'game.lives': 'Vidas',
  'game.floor': 'Chão',
  'game.fuse': 'Pavio',
  'game.survived': 'Sobreviveu',
  'game.wordsDestroyed': 'Palavras destruídas',
  'game.wordsMissed': 'Palavras perdidas',
  'game.gameOver': 'Fim de jogo',
  'game.newBest': 'Novo recorde',
  'game.playAgain': 'Jogar de novo',
  'game.quit': 'Encerrar partida',
  'game.paused': 'Pausado',
  'game.pausedHint': 'Volte para esta aba para continuar',
  'game.startHint': 'É só começar a digitar uma palavra',
  'game.endedFloor': 'O chão encheu',
  'game.endedError': 'Uma tecla errada encerrou a partida',
  'game.endedTimeout': 'Suas vidas acabaram',
  'game.endedQuit': 'Partida encerrada',
  'game.tooShort': 'Curta demais para render XP — jogue ao menos alguns segundos',
  'game.stage': 'Área de jogo',
  'game.allGames': 'Todos os jogos',
  'game.timedChallenges': 'Desafios cronometrados',
  'game.howToPlay': 'Como jogar',

  // Modo código
  'code.enterHint': 'Pressione Enter ao fim de cada linha — a indentação é inserida para você',
  'code.lines': 'linhas',
  'code.language': 'Linguagem',
};

const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  en,
  'pt-br': ptBr,
};

/**
 * Resolves a UI string. Falls back to the default locale rather than rendering
 * an empty node if a dictionary is somehow incomplete at runtime.
 */
export function t(locale: Locale, key: TranslationKey): string {
  return dictionaries[locale][key] ?? dictionaries[DEFAULT_LOCALE][key];
}

/** Curried variant for components that resolve many keys in one locale. */
export function useTranslations(locale: Locale): (key: TranslationKey) => string {
  return (key) => t(locale, key);
}
