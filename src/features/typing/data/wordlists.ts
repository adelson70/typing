/**
 * Word sources for every typing mode.
 *
 * Lists are static data, not fetched — they ship in the bundle so practice
 * works offline on first load. Language lists are the most frequent words in
 * that language, which is what makes practice transfer to real writing.
 *
 * Code lists use real syntax fragments rather than prose, so programming
 * practice trains the symbol reach patterns that actually slow developers down.
 */

import type { Locale } from '@/constants/i18n';

export type SourceCategory = 'language' | 'code' | 'drill';

export interface WordSource {
  readonly id: string;
  readonly label: string;
  readonly category: SourceCategory;
  /** Locale this source is intended for; `null` when language-agnostic. */
  readonly locale: Locale | null;
  readonly words: readonly string[];
  /** Preserve original casing and symbols (code); language lists are lowercase. */
  readonly caseSensitive: boolean;
}

const ENGLISH_200 = `the be to of and a in that have I it for not on with he as you do at this
but his by from they we say her she or an will my one all would there their what so up out if about who get
which go me when make can like time no just him know take people into year your good some could them see other
than then now look only come its over think also back after use two how our work first well way even new want
because any these give day most us man find here thing tell very still try last ask need too feel three state
never become between high really something most another much family own out leave put old while mean on keep
student why let great same big group begin seem country help talk where turn problem every start hand might
american show part about against place over such again few case week company system each right program hear
question during play government run small number off always move night live point believe hold today bring
happen next without before large million must home under water room write mother area national money story
young fact month different lot right study book eye job word though business issue side kind four head far
black long both little house yes since provide service around friend important father sit away until power
hour game often yet line political end among ever stand bad lose however member pay law meet car city almost
include continue set later community much name five once white least president learn real change team minute
best several idea kid body information nothing ago right lead social understand whether watch together follow
around parent only stop face anything create public already speak others read level allow add office spend
door health person art sure such war history party within grow result open change morning walk reason low win
research girl guy early food moment himself air teacher force offer`
  .split(/\s+/)
  .filter(Boolean);

const PORTUGUESE_200 = `de a o que e do da em um para é com não uma os no se na por mais as dos como mas foi
ao ele das tem à seu sua ou ser quando muito há nos já está eu também só pelo pela até isso ela entre era
depois sem mesmo aos ter seus quem nas me esse eles estão você tinha foram essa num nem suas meu às minha têm
numa pelos elas havia seja qual será nós tenho lhe deles essas esses pelas este fosse dele tu te vocês vos lhes
meus minhas teu tua teus tuas nosso nossa nossos nossas dela delas esta estes estas aquele aquela aqueles
aquelas isto aquilo estou está estamos estão estive esteve estivemos estiveram estava estávamos estavam
estivera estivéramos esteja estejamos estejam estivesse estivéssemos estivessem estiver estivermos estiverem
hei há havemos hão houve houvemos houveram houvera houvéramos haja hajamos hajam houvesse houvéssemos
houvessem houver houvermos houverem houverei houverá houveremos houverão houveria houveríamos houveriam sou
somos são era éramos eram fui foi fomos foram fora fôramos seja sejamos sejam fosse fôssemos fossem for
formos forem serei será seremos serão seria seríamos seriam tenho tem temos tém tinha tínhamos tinham tive
teve tivemos tiveram tivera tivéramos tenha tenhamos tenham tivesse tivéssemos tivessem tiver tivermos
tiverem terei terá teremos terão teria teríamos teriam trabalho tempo pessoa ano dia casa vida mundo forma
parte coisa homem estado governo cidade grupo problema empresa lugar caso ponto momento força água nome`
  .split(/\s+/)
  .filter(Boolean);

const JAVASCRIPT = [
  'const', 'let', 'function', 'return', 'async', 'await', 'import', 'export',
  'default', 'class', 'extends', 'constructor', 'this', 'super', 'new', 'typeof',
  'instanceof', 'null', 'undefined', 'true', 'false', 'if', 'else', 'switch',
  'case', 'break', 'continue', 'for', 'while', 'do', 'try', 'catch', 'finally',
  'throw', 'Promise', 'resolve', 'reject', 'then', 'map', 'filter', 'reduce',
  'forEach', 'find', 'some', 'every', 'push', 'pop', 'slice', 'splice', 'concat',
  'Object.keys', 'Array.from', 'JSON.parse', 'JSON.stringify', 'console.log',
  '=>', '===', '!==', '&&', '||', '??', '?.', '...', '${', '`', '{', '}', '(', ')',
  '[', ']', ';', ':', ',', '=>{', '()', '{}', '[]', 'useState', 'useEffect',
  'useMemo', 'useCallback', 'useRef', 'props', 'state', 'render', 'component',
];

const PYTHON = [
  'def', 'class', 'return', 'import', 'from', 'as', 'if', 'elif', 'else', 'for',
  'while', 'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False', 'try',
  'except', 'finally', 'raise', 'with', 'lambda', 'yield', 'global', 'nonlocal',
  'pass', 'break', 'continue', 'assert', 'del', 'self', '__init__', '__name__',
  '__main__', 'print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter',
  'sorted', 'sum', 'min', 'max', 'abs', 'str', 'int', 'float', 'list', 'dict',
  'set', 'tuple', 'append', 'extend', 'items', 'keys', 'values', 'get', 'format',
  'f"', '":', '->', '==', '!=', '>=', '<=', '**', '//', '%', '#', ':', ',', '(', ')',
];

const SQL = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
  'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'VIEW', 'JOIN',
  'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'ON', 'AS', 'AND', 'OR', 'NOT',
  'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE', 'ORDER', 'BY', 'GROUP', 'HAVING',
  'LIMIT', 'OFFSET', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'PRIMARY',
  'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'DEFAULT', 'CONSTRAINT', 'CASCADE',
  'INTEGER', 'VARCHAR', 'TEXT', 'BOOLEAN', 'TIMESTAMP', 'DATE', 'DECIMAL',
  'UNION', 'CASE', 'WHEN', 'THEN', 'END', 'EXISTS', 'ASC', 'DESC', '=', '<>',
  '>=', '<=', '(', ')', ',', ';', '*',
];

const HTML_TOKENS = [
  '<div>', '</div>', '<span>', '</span>', '<p>', '</p>', '<a', 'href=', '<img',
  'src=', 'alt=', '<ul>', '</ul>', '<li>', '</li>', '<h1>', '</h1>', '<h2>',
  '</h2>', '<section>', '</section>', '<article>', '</article>', '<header>',
  '</header>', '<footer>', '</footer>', '<nav>', '</nav>', '<main>', '</main>',
  '<form>', '</form>', '<input', 'type=', 'name=', 'value=', '<button>',
  '</button>', '<label>', '</label>', '<table>', '</table>', '<tr>', '</tr>',
  '<td>', '</td>', 'class=', 'id=', 'data-', 'aria-label=', 'role=', '/>', '"',
  '<!DOCTYPE', 'html', 'lang=', '<meta', 'charset=', '<link', 'rel=',
];

const CSS_TOKENS = [
  'display', 'flex', 'grid', 'block', 'inline-block', 'none', 'position',
  'relative', 'absolute', 'fixed', 'sticky', 'top', 'right', 'bottom', 'left',
  'width', 'height', 'margin', 'padding', 'border', 'radius', 'background',
  'color', 'font-size', 'font-weight', 'line-height', 'text-align', 'justify-content',
  'align-items', 'gap', 'flex-direction', 'column', 'row', 'wrap', 'overflow',
  'hidden', 'auto', 'scroll', 'opacity', 'transform', 'translate', 'scale',
  'rotate', 'transition', 'animation', 'z-index', 'cursor', 'pointer', ':hover',
  ':focus', ':active', '::before', '::after', '@media', '@keyframes', 'var(',
  'rem', 'px', '%', 'vh', 'vw', '{', '}', ':', ';', '#fff', 'rgba(',
];

const NUMBERS = Array.from({ length: 120 }, (_, i) => {
  // Mix of digit lengths so drills cover single keys and number-row runs.
  const lengths = [1, 2, 3, 4, 5, 6];
  const length = lengths[i % lengths.length] ?? 3;
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  // Deterministic pseudo-random keeps the list stable across builds.
  const value = min + ((i * 7919) % (max - min + 1));
  return String(value);
});

const SYMBOLS = [
  '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=', '+', '[', ']',
  '{', '}', '\\', '|', ';', ':', "'", '"', ',', '.', '<', '>', '/', '?', '~', '`',
  '!@#', '$%^', '&*(', ')_+', '{}|', '<>?', '~`', '[]\\', ";'", '.,/',
  '()', '[]', '{}', '<>', '""', "''", '&&', '||', '=>', '->', '::', '!=', '>=',
  '<=', '++', '--', '**', '//', '/*', '*/', '<!--', '-->', '$#', '@_', '%^&',
];

export const WORD_SOURCES: readonly WordSource[] = [
  { id: 'english-200', label: 'English', category: 'language', locale: 'en', words: ENGLISH_200, caseSensitive: false },
  { id: 'portuguese-200', label: 'Português', category: 'language', locale: 'pt-br', words: PORTUGUESE_200, caseSensitive: false },
  { id: 'javascript', label: 'JavaScript', category: 'code', locale: null, words: JAVASCRIPT, caseSensitive: true },
  { id: 'python', label: 'Python', category: 'code', locale: null, words: PYTHON, caseSensitive: true },
  { id: 'sql', label: 'SQL', category: 'code', locale: null, words: SQL, caseSensitive: true },
  { id: 'html', label: 'HTML', category: 'code', locale: null, words: HTML_TOKENS, caseSensitive: true },
  { id: 'css', label: 'CSS', category: 'code', locale: null, words: CSS_TOKENS, caseSensitive: true },
  { id: 'numbers', label: 'Numbers', category: 'drill', locale: null, words: NUMBERS, caseSensitive: false },
  { id: 'symbols', label: 'Symbols', category: 'drill', locale: null, words: SYMBOLS, caseSensitive: true },
];

const SOURCE_BY_ID = new Map(WORD_SOURCES.map((source) => [source.id, source]));

export function getWordSource(id: string): WordSource | undefined {
  return SOURCE_BY_ID.get(id);
}

/** The language source matching a locale, used as the default test content. */
export function defaultSourceForLocale(locale: Locale): WordSource {
  const match = WORD_SOURCES.find(
    (source) => source.category === 'language' && source.locale === locale,
  );
  // The English list is guaranteed present, so this is a real fallback.
  return match ?? WORD_SOURCES[0]!;
}
