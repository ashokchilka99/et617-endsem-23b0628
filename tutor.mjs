const choices = (correct, wrong) => [correct, ...wrong];
const first = { a: 1, b: 5, x: 7 };
const second = { a: 3, b: 2, x: 6 };
const repair = { a: 2, b: 6, x: 4 };
const transfer = { a: 4, b: -3, x: 4 };

export const lessons = [
  { title: 'Keep both sides equal', text: 'An equation says the two sides have the same value. Think of the equals sign as the middle of a balance. A change to one side needs a matching change to the other.', equation: '3x + 4 = 19', action: 'Subtract 4 from both sides' },
  { title: 'Undo the added number', text: 'Subtract 4 on the left and on the right. The left side is now 3x and the right side is 15. The same value of x still works.', equation: '3x = 15', action: 'Divide both sides by 3' },
  { title: 'Check by substitution', text: 'Dividing gives x = 5. Put 5 back into the original equation. Both sides equal 19, so the solution works.', equation: '3 × 5 + 4 = 19', action: 'Continue to practice' },
];

export const objectives = [
  ['balance', 'Keep an equation balanced', 'Explain the same operation on both sides.'],
  ['repair', 'Spot and fix a step', 'Check that a division reaches every term.'],
  ['solve', 'Solve and verify', 'Use substitution to check a new equation.'],
];

export function fmt(value) {
  return String(value).replace('-', '−');
}

function term(a) {
  if (a === 1) return 'x';
  if (a === -1) return '−x';
  return fmt(a) + 'x';
}

function parts({ a, b, x }) {
  const c = a * x + b;
  const expression = term(a) + (b < 0 ? ' − ' : ' + ') + Math.abs(b);
  const undo = b < 0 ? 'Add' : 'Subtract';
  const opposite = b < 0 ? 'Subtract' : 'Add';
  return { a, b, x, c, expression, undo, opposite, eq: expression + ' = ' + fmt(c) };
}

function solveItem(kind, values) {
  const p = parts(values);
  const n = Math.abs(p.b);
  const asked = p.undo + ' ' + n + ' on both sides';
  const opWrong = p.opposite + ' ' + n + ' on both sides';
  return {
    ...p, kind, verifyExpression: kind === 'transfer',
    label: kind === 'transfer' ? 'Independent check' : kind === 'challenge' ? 'A step up' : 'Solve and check',
    title: kind === 'challenge' ? 'Try a negative coefficient' : 'What value makes this true?',
    prompt: kind === 'transfer'
      ? 'Solve for x, then write the left side with your value in place of x.'
      : 'Solve for x, then use your answer to find the value of the left side.',
    options: kind === 'solve' ? null : choices(asked, [opWrong, p.undo + ' ' + n + ' on the left only']),
    hint: 'Start with the ' + (p.b < 0 ? '−' : '+') + n + ' term. What operation would make it zero on the left?',
    solution: asked + ' to get ' + term(p.a) + ' = ' + fmt(p.a * p.x) + '. Divide both sides by ' + fmt(p.a) + ' to get x = ' + fmt(p.x) + '. Substitution gives ' + fmt(p.c) + '.',
  };
}

function stepItem(values) {
  const p = parts(values);
  const operation = p.undo + ' ' + Math.abs(p.b) + ' on both sides.';
  return {
    ...p, kind: 'step', label: 'Write a step', title: 'Write the next equation',
    prompt: operation + ' Enter the equation you get before dividing.',
    correction: term(p.a) + '=' + fmt(p.c - p.b),
    hint: 'The constant on the left becomes zero. Apply the same operation to the number on the right.',
    solution: operation + ' This gives ' + term(p.a) + ' = ' + fmt(p.c - p.b) + '.',
  };
}

function inverseItem(values) {
  const p = parts(values);
  const n = Math.abs(p.b);
  return {
    ...p, kind: 'inverse', label: 'Warm-up', title: 'Which step keeps it balanced?',
    prompt: 'Choose what you would do first to get x on its own.',
    options: choices(p.undo + ' ' + n + ' on both sides', [p.opposite + ' ' + n + ' on both sides', p.undo + ' ' + n + ' on the left side only']),
    hint: 'Think of the operation that makes the added or subtracted number become zero.',
    solution: p.undo + ' ' + n + ' on both sides to get x = ' + fmt(p.x) + '.',
  };
}

function explainItem(values) {
  const p = parts(values);
  const n = Math.abs(p.b);
  return {
    ...p, kind: 'explain', label: 'Explain your thinking', title: 'Why is the new equation still true?',
    prompt: 'Tell us the operation and what happens on each side. A short sentence is enough.',
    hint: 'Start with “I ' + p.undo.toLowerCase() + ' ' + n + ' …” and explain which sides you change.',
    solution: 'I ' + p.undo.toLowerCase() + ' ' + n + (p.b < 0 ? ' to both sides. ' : ' from both sides. ') + 'The left becomes ' + term(p.a) + ' and the right becomes ' + fmt(p.a * p.x) + '.',
    eq: p.eq + ' → ' + term(p.a) + ' = ' + fmt(p.a * p.x),
    options: choices(p.undo + ' ' + n + ' on both sides', [p.opposite + ' ' + n + ' on both sides', p.undo + ' ' + n + ' on the left only']),
  };
}

function repairItem(values, generated = false) {
  const p = parts(values);
  const divided = p.b / p.a;
  return {
    ...p, kind: 'repair', label: generated ? 'Try a fresh equation' : 'Spot and fix', title: 'Find the first step that went wrong',
    prompt: 'Someone tried dividing both sides by ' + p.a + '. Choose the first line that needs fixing, then enter the simplified corrected line.',
    options: [p.eq, 'x + ' + p.b + ' = ' + p.c / p.a],
    correction: 'x+' + divided + '=' + p.c / p.a,
    hint: 'Picture brackets around the entire left side. Which terms are inside those brackets?',
    solution: 'The second line should read x + ' + divided + ' = ' + p.c / p.a + '. The constant ' + p.b + ' is divided too.',
  };
}

export function draw(seed, min, max) {
  const number = Math.sin(seed * 9973 + 0.31) * 10000;
  return min + Math.floor((number - Math.floor(number)) * (max - min + 1));
}

export function plan(seed, repeat) {
  const a = draw(seed + 1, 2, 5);
  const solve = { a, b: draw(seed + 2, 2, 8), x: draw(seed + 3, 2, 7) };
  const divisor = draw(seed + 4, 2, 5);
  const flex = [
    stepItem({ a: 2, b: -3, x: draw(seed + 22, 5, 9) }),
    stepItem({ a: 3, b: 3, x: draw(seed + 23, 2, 8) }),
    repairItem({ a: 3, b: 6, x: draw(seed + 24, 2, 7) }),
  ].map((question, index) => ({ ...question, flex: index !== 0 }));
  if (!repeat) return [inverseItem(first), solveItem('solve', second), explainItem(second), repairItem(repair), ...flex, solveItem('transfer', transfer)];
  return [
    inverseItem({ a: 1, b: draw(seed + 5, 2, 9), x: draw(seed + 6, 3, 11) }),
    solveItem('solve', solve), explainItem(solve),
    repairItem({ a: divisor, b: divisor * draw(seed + 7, 2, 6), x: draw(seed + 8, 2, 8) }),
    ...flex,
    solveItem('transfer', { a: draw(seed + 9, 2, 6), b: -draw(seed + 10, 2, 8), x: draw(seed + 11, 2, 8) }),
  ];
}

export const challengeSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['a', 'b', 'c', 'x'],
  properties: { a: { type: 'integer' }, b: { type: 'integer' }, c: { type: 'integer' }, x: { type: 'integer' } },
};

export function validateChallenge(values) {
  const keys = challengeSchema.required;
  if (!values || Array.isArray(values) || typeof values !== 'object' || Object.keys(values).length !== keys.length ||
    !keys.every(key => Object.hasOwn(values, key) && Number.isInteger(values[key]))) return false;
  const { a, b, c, x } = values;
  return a >= -6 && a <= -2 && b >= 2 && b <= 9 && x >= -8 && x <= -2 &&
    (c - b) / a === x && a * x + b === c;
}

export function challenge(seed, generated) {
  const isGenerated = validateChallenge(generated);
  const values = isGenerated ? generated : { a: -draw(seed + 12, 2, 5), b: draw(seed + 13, 2, 8), x: -draw(seed + 14, 2, 6) };
  return {
    ...solveItem('challenge', values),
    sourceLabel: isGenerated ? 'AI-generated · checked' : 'Sample (offline)',
    why: 'You solved two tasks in a row independently. Try a negative coefficient.',
  };
}

export function followUp(source, seed) {
  if (source.kind === 'repair') {
    const a = source.a === 4 ? 3 : 4;
    return repairItem({ a, b: a * ((source.b / source.a) % 4 + 1), x: draw(seed + 15, 2, 7) }, true);
  }
  const sign = source.b < 0 ? -1 : 1;
  return inverseItem({ a: 1, b: sign * (Math.abs(source.b) % 8 + 2), x: draw(seed + 16, 3, 11) });
}

export function prerequisite(source) {
  const b = source.b ?? 5;
  const start = source.c ?? 12;
  const change = -b;
  const direction = change < 0 ? 'left' : 'right';
  const format = value => fmt(value) + (change < 0 ? ' − ' : ' + ') + Math.abs(change);
  const example = format(start);
  const nextStart = start - 1;
  const x = nextStart + change;
  const prompt = 'On a number line, start at ' + fmt(start) + ' and move ' + Math.abs(change) + ' steps ' + direction + ' to ' + fmt(start + change) + '. Use that same operation on both sides of a balance. Now try this smaller calculation.';
  return {
    kind: 'foundation', label: 'Integer mini-lesson', title: 'Practise the inverse operation',
    prompt, eq: format(nextStart), x,
    balance: source,
    why: 'The sign error appeared twice. Practise the integer operation before trying another equation.',
    visual: { start, change, end: start + change },
    hint: 'Start at ' + fmt(nextStart) + ' and move ' + Math.abs(change) + ' steps ' + direction + '.',
    solution: example + ' = ' + fmt(start + change) + '. For this question, ' + format(nextStart) + ' = ' + fmt(x) + '.',
  };
}

function normalized(text) {
  return String(text ?? '').toLowerCase().replace(/−/g, '-').trim();
}

function number(text) {
  const value = normalized(text);
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value)) return NaN;
  return Number(value);
}

function linearTerms(input) {
  const terms = input.match(/[+-]?(?:\d*x|\d+)/g);
  if (!terms || terms.join('') !== input || !/^[+-]?(?:\d*x|\d+)(?:[+-](?:\d*x|\d+))*$/.test(input)) return null;
  const values = [0, 0];
  for (const part of terms) {
    if (part.endsWith('x')) {
      const coefficient = part.slice(0, -1);
      values[0] += coefficient === '-' ? -1 : coefficient === '+' || !coefficient ? 1 : Number(coefficient);
    } else {
      values[1] += Number(part);
    }
  }
  return values.join(',');
}

function equationMatches(answer, expected) {
  const sides = normalized(answer).replace(/\s/g, '').split('=').map(linearTerms);
  if (sides.length !== 2 || !sides.every(Boolean)) return false;
  const target = normalized(expected).split('=').map(linearTerms);
  return sides.join('=') === target.join('=') || sides.reverse().join('=') === target.join('=');
}

function matchesSubstitution(answer, q) {
  const submitted = normalized(answer).replace(/\s/g, '').replace(/[×·]/g, '*');
  const constant = (q.b < 0 ? '-' : '+') + Math.abs(q.b);
  const x = String(q.x);
  return [q.a + '(' + x + ')' + constant, q.a + '*(' + x + ')' + constant, q.a + '*' + x + constant]
    .some(expression => submitted === expression || submitted === expression + '=' + q.c);
}

const numberWords = 'zero one two three four five six seven eight nine ten eleven twelve'.split(' ');

export function explain(text, b, result, rhs) {
  const s = normalized(text).replace(new RegExp('\\b(?:' + numberWords.join('|') + ')\\b', 'g'), word => String(numberWords.indexOf(word)));
  const n = Math.abs(b);
  const add = '(?:add\\w*|plus|increase\\w*\\s+by)';
  const subtract = '(?:subtract\\w*|minus|remove\\w*|reduce\\w*\\s+by)';
  const op = (word, amount) => new RegExp('\\b' + word + '\\s+' + amount + '\\b').test(s);
  const takeAway = new RegExp('\\b(?:take|taking|took)\\s+' + n + '\\s+away\\b').test(s);
  const namesOperation = b < 0 ? op(add, n) || op(subtract, -n) : op(subtract, n) || op(add, -n) || takeAway;
  const both = /\b(?:both|each|the two)\s+sides?\b|\bleft\b.*\bright\b|\bright\b.*\bleft\b/.test(s);
  const raw = s.replace(/\s/g, '').replace(/[.。]$/, '');
  const symbol = b < 0 ? '+' : '-';
  const rhsStep = raw.includes(String(rhs) + symbol + n);
  const lhsStep = raw.includes('x' + (b < 0 ? '-' : '+') + n + symbol + n) || raw.includes('x' + (b < 0 ? '-' : '+') + n + ')' + symbol + n);
  const wrong = b < 0 ? op(subtract, n) || takeAway : op(add, n);
  const declaredRight = s.match(/\bright(?:\s+side)?\s+(?:is(?:\s+now)?|becomes|gives|equals)\s+(-?\d+)\b/);
  const negation = /\b(?:do not|don't|never|cannot|can't|shouldn't|not)\b/.test(s);
  const oneSide = /\b(?:leave|leaving|keep|keeping|stays?|remains?)\b[^.!?]{0,55}\bunchanged\b|\bonly\b[^.!?]{0,25}\b(?:left|right|1 side)\b|\b(?:left|right|1 side)\b[^.!?]{0,16}\bonly\b/.test(s);
  const extraOperation = /\b(?:and|then|also|but|afterwards)\s+(?:i\s+)?(?:multiply|divide|add|subtract|remove|change)\w*\b/.test(s);
  if (oneSide && !negation) return 'one-side-only';
  if (negation || extraOperation || (declaredRight && Number(declaredRight[1]) !== result)) return 'clarify';
  if ((namesOperation && both || rhsStep && lhsStep) && !wrong) return 'correct';
  if (wrong && !namesOperation) return 'sign-flip';
  return 'clarify';
}

export function assess(q, response) {
  const { choice, x, check, explanation, correction, substitution } = response;
  if (q.kind === 'inverse') {
    if (choice === '0') return verdict('correct', q.solution);
    return choice === '1'
      ? verdict('sign-flip', 'That operation moves the constant farther from zero. Try the operation that makes ' + (q.b < 0 ? '−' : '+') + Math.abs(q.b) + ' cancel.')
      : verdict('one-side-only', 'One side changed. What could you do to the other side to keep the values equal?');
  }
  if (q.kind === 'explain') {
    const idea = choice === '0' ? 'correct' : choice === '1' ? 'sign-flip' : choice === '2' ? 'one-side-only' : explain(explanation, q.b, q.a * q.x, q.c);
    if (idea === 'correct') return verdict('correct', 'You named the operation on both sides. That keeps the two values equal.');
    if (idea === 'sign-flip') return verdict(idea, 'Check which operation cancels the constant. Then say what happens to both sides.');
    return verdict(idea, 'I need one more detail. Which operation do you apply, and does it change one side or both?');
  }
  if (q.kind === 'repair' || q.kind === 'step') {
    if (q.kind === 'repair' && choice !== '1') return verdict('locate-error', 'The first line gives the starting equation. Compare the second line with it and look at the constant.');
    if (equationMatches(correction, q.correction)) return verdict('correct', q.solution);
    const partial = q.kind === 'repair' && (
      equationMatches(correction, q.options[1]) || equationMatches(correction, 'x=' + (q.c / q.a + q.b))
    );
    const unchanged = equationMatches(correction, term(q.a) + '=' + q.c) || equationMatches(correction, q.expression + '=' + (q.c - q.b));
    if (partial || unchanged) return verdict('one-side-only', 'Apply the operation to the whole left side and the whole right side.');
    if (q.kind === 'step' && equationMatches(correction, term(q.a) + '=' + (q.c + q.b))) {
      return verdict('sign-flip', 'Choose the operation that makes the constant on the left become zero.');
    }
    return verdict('equation-step', 'Check what changed on the left and on the right, then try writing the equation again.');
  }
  if (q.kind === 'probe' || q.kind === 'foundation') {
    return number(x) === q.x
      ? verdict('correct', q.solution)
      : verdict('arithmetic', 'Let’s focus on that calculation before returning to the equation.');
  }
  if (q.options && choice !== '0') {
    return verdict(choice === '1' ? 'sign-flip' : 'one-side-only', 'Start by choosing an operation that cancels the constant and changes both sides equally.');
  }
  const verified = q.verifyExpression ? matchesSubstitution(substitution, q) : number(check) === q.c;
  if (number(x) === q.x && verified) return verdict('correct', 'Your substitution gives ' + fmt(q.c) + ' on both sides. The solution checks out.');
  if (number(x) === q.x) return verdict('verification', q.verifyExpression
    ? 'Your x value works. Replace x with your value in the original left-side expression.'
    : 'Your x value works. Replace x with your value and calculate the left side.');
  const wrongSign = (q.c + q.b) / q.a;
  return number(x) === wrongSign
    ? verdict('sign-flip', 'Look at the sign of the constant. Use its inverse operation on both sides, then try substituting your new answer.')
    : verdict('calculation', 'Your x value needs another look. Undo the constant first, then divide by the coefficient of x.');
}

function verdict(code, message) {
  return { code, message, correct: code === 'correct' };
}

export function nextRoute(result, streak, misconceptions) {
  if (result.correct && streak >= 2) return 'challenge';
  const repeated = misconceptions[result.code] ?? 0;
  if (repeated > 0 && repeated % 2 === 0) {
    if (result.code === 'sign-flip') return 'foundation';
    if (result.code === 'one-side-only') return 'alternative';
  }
  return '';
}
