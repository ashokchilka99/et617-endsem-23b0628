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
    ...p, kind,
    label: kind === 'transfer' ? 'Independent check' : kind === 'challenge' ? 'A step up' : 'Solve and check',
    title: kind === 'challenge' ? 'Try a negative coefficient' : 'What value makes this true?',
    prompt: 'Solve for x, then use your answer to find the value of the left side.',
    options: kind === 'solve' ? null : choices(asked, [opWrong, p.undo + ' ' + n + ' on the left only']),
    hint: 'Start with the ' + (p.b < 0 ? '−' : '+') + n + ' term. What operation would make it zero on the left?',
    solution: asked + ' to get ' + term(p.a) + ' = ' + fmt(p.a * p.x) + '. Divide both sides by ' + fmt(p.a) + ' to get x = ' + fmt(p.x) + '. Substitution gives ' + fmt(p.c) + '.',
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
  if (!repeat) return [inverseItem(first), solveItem('solve', second), explainItem(second), repairItem(repair), solveItem('transfer', transfer)];
  const a = draw(seed + 1, 2, 5);
  const solve = { a, b: draw(seed + 2, 2, 8), x: draw(seed + 3, 2, 7) };
  const divisor = draw(seed + 4, 2, 5);
  return [
    inverseItem({ a: 1, b: draw(seed + 5, 2, 9), x: draw(seed + 6, 3, 11) }),
    solveItem('solve', solve), explainItem(solve),
    repairItem({ a: divisor, b: divisor * draw(seed + 7, 2, 6), x: draw(seed + 8, 2, 8) }),
    solveItem('transfer', { a: draw(seed + 9, 2, 6), b: -draw(seed + 10, 2, 8), x: draw(seed + 11, 2, 8) }),
  ];
}

export function challenge(seed) {
  return solveItem('challenge', { a: -draw(seed + 12, 2, 5), b: draw(seed + 13, 2, 8), x: -draw(seed + 14, 2, 6) });
}

export function followUp(source, seed) {
  if (source.kind === 'repair') {
    const a = source.a === 4 ? 3 : 4;
    return repairItem({ a, b: a * ((source.b / source.a) % 4 + 1), x: draw(seed + 15, 2, 7) }, true);
  }
  const sign = source.b < 0 ? -1 : 1;
  return inverseItem({ a: 1, b: sign * (Math.abs(source.b) % 8 + 2), x: draw(seed + 16, 3, 11) });
}

export function probe(source, teach = false) {
  const division = source.kind === 'repair';
  const left = division ? source.b + (teach ? source.a : 0) : teach ? 7 : 9;
  const right = division ? source.a : teach ? 10 : 14;
  const eq = fmt(left) + (division ? ' ÷ ' : ' − ') + fmt(right);
  const x = division ? left / right : left - right;
  const concept = division
    ? 'Split ' + source.b + ' objects into ' + right + ' equal groups. Each group has ' + source.b / right + '. Try sharing ' + (source.b + right) + ' objects into the same number of groups.'
    : 'Start at 9 on a number line. Move 9 steps left to reach zero, then 5 more to reach −5. For this new example, start at 7 and move left 10 steps.';
  return {
    kind: teach ? 'foundation' : 'probe', label: teach ? 'Prerequisite practice' : 'Quick check',
    title: teach ? (division ? 'Review equal groups' : 'Review subtracting past zero') : 'Check one smaller step',
    prompt: teach ? concept : 'This helps the tutor decide what sort of help will be useful.',
    eq, x, hint: concept,
    visual: teach ? (division ? { groups: right, size: source.b / right } : { numberLine: true }) : null,
    solution: eq + ' = ' + fmt(x) + '.',
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

export function explain(text, b, result, rhs) {
  const s = normalized(text);
  const n = Math.abs(b);
  const operation = b < 0 ? '(?:add\\w*|plus|increase\\w*\\s+by)' : '(?:subtract\\w*|minus|take\\w*\\s+away|remove\\w*|reduce\\w*\\s+by)';
  const namesOperation = new RegExp('\\b' + operation + '\\s+' + n + '\\b').test(s);
  const both = /\bboth\b|\beach\s+side\b|\bsame\s+(?:operation|thing)\b|\bleft\b.*\bright\b|\bright\b.*\bleft\b/.test(s);
  const raw = s.replace(/\s/g, '');
  const symbol = b < 0 ? '+' : '-';
  const rhsStep = raw.includes(String(rhs) + symbol + n);
  const lhsStep = raw.includes('x' + (b < 0 ? '-' : '+') + n + symbol + n) || raw.includes('x' + (b < 0 ? '-' : '+') + n + ')' + symbol + n);
  const wrong = new RegExp('\\b' + (b < 0 ? '(?:subtract\\w*|minus)' : '(?:add\\w*|plus)') + '\\s+' + n + '\\b').test(s);
  const values = s.match(/(?<![\w.])-?\d+(?:\.\d+)?(?![\w.])/g)?.map(Number) || [];
  const declaredRight = s.match(/\bright(?:\s+side)?\s+(?:is now|becomes|gives|equals)\s+(-?\d+)\b/);
  const contradictory = /\bonly\b|\bnot\b.{0,15}\bboth\b/.test(s) || (declaredRight && Number(declaredRight[1]) !== result) || (values.length > 1 && /\b(?:right|equals?|becomes?)\b/.test(s) && values.some(v => ![n, -n, result, rhs].includes(v)));
  if ((namesOperation && both || rhsStep && lhsStep) && !wrong && !contradictory) return 'correct';
  if (wrong && !namesOperation) return 'inverse';
  return 'clarify';
}

export function assess(q, response) {
  const { choice, x, check, explanation, correction } = response;
  if (q.kind === 'inverse') {
    if (choice === '0') return verdict('correct', q.solution);
    return choice === '1'
      ? verdict('inverse', 'That operation moves the constant farther from zero. Try the operation that makes ' + (q.b < 0 ? '−' : '+') + Math.abs(q.b) + ' cancel.')
      : verdict('balance', 'One side changed. What could you do to the other side to keep the values equal?');
  }
  if (q.kind === 'explain') {
    const idea = choice === '0' ? 'correct' : choice === '1' ? 'inverse' : choice === '2' ? 'balance' : explain(explanation, q.b, q.a * q.x, q.c);
    if (idea === 'correct') return verdict('correct', 'You named the operation on both sides. That keeps the two values equal.');
    if (idea === 'inverse') return verdict('inverse', 'Check which operation cancels the constant. Then say what happens to both sides.');
    return verdict(idea, 'I need one more detail. Which operation do you apply, and does it change one side or both?');
  }
  if (q.kind === 'repair') {
    const fixed = normalized(correction).replace(/\s/g, '');
    const [left, right] = q.correction.split('=');
    if (choice === '1' && [q.correction, right + '=' + left].includes(fixed)) return verdict('correct', q.solution);
    if (choice === '0') return verdict('division', 'The first line gives the starting equation. Compare the second line with it and look at the constant.');
    return verdict('division', 'You found the line to inspect. Trace the division through the x term, the constant, and the right side.');
  }
  if (q.kind === 'probe' || q.kind === 'foundation') {
    return number(x) === q.x
      ? verdict('correct', q.solution)
      : verdict('arithmetic', 'Let’s focus on that calculation before returning to the equation.');
  }
  if (q.options && choice !== '0') {
    return verdict(choice === '1' ? 'inverse' : 'balance', 'Start by choosing an operation that cancels the constant and changes both sides equally.');
  }
  if (number(x) === q.x && number(check) === q.c) return verdict('correct', 'Your substitution gives ' + fmt(q.c) + ' on both sides. The solution checks out.');
  if (number(x) === q.x) return verdict('verification', 'Your x value works. Substitute it into the original left side and calculate that value before checking again.');
  const wrongSign = (q.c + q.b) / q.a;
  return number(x) === wrongSign
    ? verdict('inverse', 'Look at the sign of the constant. Use its inverse operation on both sides, then try substituting your new answer.')
    : verdict('calculation', 'Your x value needs another look. Undo the constant first, then divide by the coefficient of x.');
}

function verdict(code, message) {
  return { code, message, correct: code === 'correct' };
}

export function firstRoute(result, history, usedBranch, step) {
  if (usedBranch || step === 4) return '';
  if (!result.correct && ['inverse', 'balance', 'division', 'calculation'].includes(result.code)) return 'probe';
  const previous = history[step - 1];
  const current = history[step];
  if (step === 2 && result.correct && previous?.firstCorrect && !previous.supported && current?.firstCorrect && !current.supported) return 'challenge';
  return '';
}
