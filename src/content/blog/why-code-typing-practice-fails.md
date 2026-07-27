---
title: 'Why Most Code Typing Practice Does Not Work'
description: 'Typing keywords from a shuffled list is not typing code. Here is what actually slows developers down, and what practice has to include to fix it.'
pubDate: 2026-03-26
category: 'programming'
locale: 'en'
relatedPages: ['programming-typing', 'javascript-typing', 'python-typing']
relatedArticles: ['programming-typing-practice', 'typing-symbols-and-brackets', 'best-keyboard-for-programming']
keywords: ['code typing practice', 'programming typing', 'typing indentation', 'developer typing speed']
readingTime: 7
---

There is a common shape to code typing practice: take a language, extract its keywords and common identifiers, shuffle them, and present them as a word list. `function`, `return`, `const`, `append`, `__init__`. You type them separated by spaces, one after another, and a number goes up.

This trains almost nothing that matters, and it is worth being precise about why.

## Keywords are the easy part

A developer who has written any JavaScript can already type `function` and `return` without thinking. Those words are frequent, alphabetic, and live in the comfortable centre of the keyboard. They were mastered years ago.

What is not automatic is everything around them.

Consider one ordinary line:

```javascript
const { name, email } = await res.json();
```

The alphabetic content — `const name email await res json` — is trivial. The difficulty is entirely in `{`, `}`, `=`, `(`, `)`, `.` and `;`, and in the transitions between them. Seven of the forty-one characters are alphabetic words you know; the rest is punctuation, spacing and shifted reaches.

Now strip that line into a word list. You get `const`, `name`, `email`, `await`, `res`, `json` — six easy words, and every hard character has been thrown away. The practice has removed exactly the part that needed practising.

## Structure is not decoration

The second thing a word list destroys is shape.

Code is not a stream of tokens. It is nested, and the nesting is expressed through indentation and line breaks that you produce with your hands as much as with your head. When an experienced developer closes a block, the newline and the outdent are part of one motion. When they open a callback, the indent that follows is anticipated before the brace is typed.

That rhythm is a real motor skill, and it only exists when there is more than one line. Flatten the code into a horizontal stream and the skill has nowhere to live.

## The whitespace question

This leaves an awkward problem, which is why so much practice avoids structured code entirely: what do you do about indentation?

Three answers are possible, and two of them are bad.

**Make the user type every space.** Faithful, and miserable. Eight spaces before a nested line is not a skill worth drilling, it is a chore. Worse, the natural key for it — Tab — is intercepted by the browser for focus navigation, so the honest version of this approach cannot even use the honest key.

**Skip the whitespace silently.** Jump the cursor past the indentation and let the user carry on. This sounds tidy and is quietly corrosive: the line breaks and indent keystrokes that are a natural part of a developer's flow simply vanish from the practice, so the rhythm being trained is not the rhythm being used at work. Typists who rely on that flow notice immediately that something feels wrong, even when they cannot name it.

**Insert the indentation, but require every code character.** Press Enter at the end of a line and the caret lands at the correct depth, ready for the first real character. You type every brace, every operator, every semicolon — but not the structural whitespace that an editor would have supplied anyway.

The third is the only one that trains the right thing. It preserves the line-break rhythm, keeps the symbol density intact, and does not turn practice into a spacebar endurance test.

## What honest code practice has to include

If a code typing exercise is doing its job, it will have all of these:

- **Real snippets, not shuffled tokens.** Enough context that the code reads as code.
- **Genuine indentation.** Nested blocks that look nested.
- **Full symbol density.** No filtering out the characters that are hard.
- **Line breaks you actually make.** Enter as a keystroke, not an invisible transition.
- **Scoring that ignores auto-inserted whitespace.** Otherwise a deeply nested snippet inflates your words-per-minute and the score stops meaning anything.

That last point is subtle and matters more than it looks. If auto-inserted indentation counted toward your character total, a heavily nested Python function would score dramatically higher than a flat SQL query of the same real length — and your code speed would no longer be comparable with your prose speed, or with anyone else's.

## Practise the language you write

Symbol distribution differs enough between languages that practising the wrong one builds the wrong reflexes:

- **JavaScript and TypeScript** are dense with braces, arrows and template literals.
- **Python** trades braces for colons and indentation, and puts the shifted underscore in constant use through `snake_case` and dunder methods.
- **SQL** convention capitalises keywords, so it is nearly continuous shift use.
- **HTML** is angle brackets and quote pairs, with heavy tag repetition.
- **CSS** is a rigid, highly repetitive cycle of colons, semicolons and braces.

## Where to start

[Programming typing practice](/programming-typing/) uses real snippets with real structure — indentation included, symbols intact, and Enter as a keystroke you actually press.

For a specific language, go straight to [JavaScript](/javascript-typing/) or [Python](/python-typing/). If a single reach is your bottleneck rather than code in general, [symbol practice](/symbols-typing/) isolates the brackets and operators directly.
