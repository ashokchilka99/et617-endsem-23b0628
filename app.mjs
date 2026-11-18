import { assess, challenge, draw, fmt, followUp, lessons, nextRoute, objectives, plan, prerequisite, validateChallenge } from './tutor.mjs';

const storageKey = 'balance-lab-v1';
const main = document.querySelector('#main');
const header = document.querySelector('#header');
const footer = document.querySelector('#footer');
const iconPaths = {
  equal: '<path d="M5 9h14M5 15h14"/>',
  arrow: '<path d="M4.5 12h14m-5.5-5.5L18.5 12 13 17.5"/>',
  back: '<path d="M19.5 12h-14m5.5 5.5L5.5 12 11 6.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3 1.5"/>',
  book: '<path d="M12 5.5c-1.8-1.6-5.4-1.8-8-1v13.8c3-.8 5.5-.4 8 1.2 2.5-1.6 5-2 8-1.2V4.5c-2.6-.8-6.2-.6-8 1Zm0 0v14"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  hint: '<path d="M9 18h6m-5 3h4M8.6 15.2a5.8 5.8 0 1 1 6.8 0c-.4.3-.4.8-.4 1.3H9c0-.5 0-1-.4-1.3Z"/>',
  pause: '<path d="M9 5v14m6-14v14"/>',
  lock: '<rect x="5.5" y="10" width="13" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  card: '<rect x="4" y="5" width="16" height="14" rx="3"/><path d="M8 10h8m-8 4h5"/>',
  layers: '<path d="m12 4 8 5-8 5-8-5 8-5Zm-8 9 8 5 8-5m-16 4 8 5 8-5"/>',
  sparkle: '<path d="M12 3c.7 5 2.2 6.8 7 7.5-4.8.7-6.3 2.5-7 7.5-.7-5-2.2-6.8-7-7.5 4.8-.7 6.3-2.5 7-7.5Z"/><path d="M19 16v5m-2.5-2.5h5"/>',
};

function icon(name, size = 20) {
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name]}</svg>`;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

let storageReady = true;
let data = { number: 0, session: null, last: null };
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (saved?.version === 1 && Number.isInteger(saved.number)) data = saved;
} catch {
  storageReady = false;
}
let demo = null;
let route = 'home';
let previewStep = 0;
let welcomeLine = '';
let clock = null;
let pendingAdvance = null;
let lastMathField = null;

function saveTaskTime(stop = false) {
  if (!clock) return;
  const now = performance.now();
  const times = clock.session.taskTimes;
  times[clock.step] = (times[clock.step] || 0) + now - clock.started;
  if (stop) clock = null;
  else clock.started = now;
}

function startTaskTime() {
  const s = session();
  if (!clock && route === 'learn' && s?.view === 'task' && !document.hidden && pendingAdvance?.session !== s) {
    clock = { session: s, step: s.step, started: performance.now() };
  }
}

function save() {
  saveTaskTime();
  if (!storageReady) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify({ ...data, version: 1 }));
  } catch {
    storageReady = false;
  }
}

function session() {
  return demo || data.session;
}

function persist() {
  if (!demo) save();
}

function go(page) {
  const next = page === 'home' ? '#home' : '#' + page;
  if (location.hash === next) {
    route = page;
    render(true);
  } else {
    location.hash = next;
  }
}

function readRoute() {
  const next = location.hash.slice(1);
  if (next === 'main') return;
  route = ['home', 'learn', 'concept', 'progress', 'about'].includes(next) ? next : 'home';
  if (route === 'learn' && !session() && !data.last) route = 'home';
  render(true);
}

const descriptions = [
  ['Warm-up', 'Choose the move that keeps both sides equal.', 'clock'],
  ['Worked example', 'See how a balance makes each step visible.', 'book'],
  ['Practice & feedback', 'Solve, explain and repair equations.', 'layers'],
  ['Independent check', 'Try a new equation and verify your answer.', 'check'],
];

function newSession(seed, repeat = false) {
  return {
    seed, step: 0, lesson: 0, lessonComplete: false, view: 'task', questions: plan(seed, repeat), history: [],
    draft: {}, feedback: null, attempts: 0, hints: false, hintEver: false, guided: false, guidedEver: false, model: false,
    streak: 0, misconceptions: {}, status: {}, ability: {}, taskTimes: {},
    events: [],
  };
}

function extendSavedSession(s) {
  if (!s?.questions) return;
  if (s.questions.length === 5) {
    const extra = plan(s.seed, true).slice(4, 7);
    s.questions.splice(s.step === 4 ? 5 : 4, 0, ...extra);
  }
  if (s.branch) {
    const replacement = s.questions.findLastIndex((q, i) => i > s.step && q.flex);
    if (replacement >= 0) {
      s.questions.splice(replacement, 1);
      s.questions.splice(s.step, 0, { ...s.branch.question, why: 'Continue the support you opened last time.' });
    }
    delete s.branch;
  }
  if (s.feedback?.route === 'probe') s.feedback.route = '';
  s.streak ??= 0;
  s.misconceptions ??= {};
  s.taskTimes ??= {};
  s.lessonComplete ??= s.view !== 'worked' && s.lesson === lessons.length - 1;
  s.hintEver ??= Boolean(s.hints || s.events?.some(event => event.type === 'hint_opened' && event.step === s.step + 1));
  s.guidedEver ??= Boolean(s.guided);
}

extendSavedSession(data.session);

function start() {
  demo = null;
  if (!data.session) {
    data.session = newSession(Date.now() % 10000000, data.number > 0);
    record('session_started');
    save();
  }
  welcomeLine = '';
  go('learn');
}

function startDemo(type) {
  demo = newSession(617);
  demo.demoType = type;
  demo.step = { challenge: 1, misconception: 3, foundation: 0 }[type];
  go('learn');
}

function record(type, details = {}) {
  const s = session();
  if (s) s.events.push({ type, step: s.step + 1, at: Date.now(), ...details });
}

function render(focus = false) {
  saveTaskTime(true);
  document.title = (route === 'home' ? 'Balance Lab · Class 8 Algebra' : ({ learn: 'Practice', concept: 'Worked example', progress: 'Progress', about: 'About' })[route] + ' · Balance Lab');
  header.innerHTML = `<div class="site-header wrap">
    <a class="brand" href="#home" aria-label="Balance Lab home">
      <span class="brand-mark">${icon('equal', 23)}</span><span>Balance Lab</span>
    </a>
    <nav aria-label="Main navigation">
      <a href="#home" ${['home', 'learn', 'concept'].includes(route) ? 'aria-current="page"' : ''}>Learn</a>
      <a href="#progress" ${route === 'progress' ? 'aria-current="page"' : ''}>My progress</a>
      <a href="#about" ${route === 'about' ? 'aria-current="page"' : ''}>About</a>
    </nav>
    <span class="course">ET 617</span>
  </div>`;
  footer.innerHTML = `<div class="wrap footer-inner"><span><strong>Balance Lab</strong> · Class 8 Algebra</span><span>ET 617 <b>·</b> 23B0628</span></div>`;

  switch (route) {
    case 'learn': main.innerHTML = learning(); break;
    case 'concept': main.innerHTML = worked(true); break;
    case 'progress': main.innerHTML = progress(); break;
    case 'about': main.innerHTML = about(); break;
    default: main.innerHTML = home();
  }
  startTaskTime();
  if (focus) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    main.querySelector('h1')?.focus({ preventScroll: true });
  }
}

function scale(question = { a: 3, b: 4, c: 19, expression: '3x + 4' }) {
  const coefficient = question.a === -1 ? '−x' : fmt(question.a) + 'x';
  const xTiles = question.a >= 1 && question.a <= 3 ? '<i>x</i>'.repeat(question.a) : '<i>' + esc(coefficient) + '</i>';
  const constant = question.b >= 0 ? '+' + question.b : fmt(question.b);
  return `<figure class="scale-panel" aria-label="Balance diagram. ${esc(question.expression)} equals ${esc(fmt(question.c))}.">
    <div class="scale-caption">${icon('equal', 18)} The balance model</div>
    <div class="scale-art" aria-hidden="true">
      <div class="scale-grid"></div>
      <div class="scale-pan pan-left">
        <div class="pan-tiles">${xTiles}<i class="plus-tile">${esc(constant)}</i></div>
        <div class="pan-base"></div>
      </div>
      <div class="scale-pan pan-right"><div class="pan-tiles"><i class="right-tile">${esc(fmt(question.c))}</i></div><div class="pan-base"></div></div>
      <div class="scale-beam"></div><div class="scale-pin">=</div><div class="scale-stand"></div><div class="scale-foot"></div>
    </div>
    <figcaption><span>${esc(question.expression)}</span><b>=</b><span>${esc(fmt(question.c))}</span></figcaption>
  </figure>`;
}

function home() {
  const active = data.session;
  const progress = data.last?.ability || {};
  return `<div class="wrap home">
    ${welcomeLine ? ' <p class="notice" role="status">' + esc(welcomeLine) + '</p>' : ''}
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow"><span></span> Class 8 mathematics</p>
        <h1 tabindex="-1">Find the<br><em>balance.</em></h1>
        <p class="lede">Hi, Meera. Let’s practise linear equations one small step at a time.</p>
        <div class="hero-actions">
          <button class="button primary" data-action="start">${active ? 'Resume practice' : 'Start practice'} ${icon('arrow')}</button>
          <a class="button quiet" href="#concept">${icon('book', 18)} See an example</a>
        </div>
        <p class="time-note">${icon('clock', 17)} About 10 minutes <span>·</span> Pause anytime</p>
      </div>
      ${scale()}
    </section>
    <div class="home-grid">
      <section class="panel session-map" aria-labelledby="map-title">
        <div class="section-top"><div class="icon-chip">${icon('layers')}</div><div><h2 id="map-title">Your session</h2><p>From the first move to checking your own answer.</p></div></div>
        <div class="map-items">
        ${descriptions.map(([title, description, glyph]) => `<div class="map-row"><span class="small-icon">${icon(glyph, 17)}</span><div><strong>${title}</strong><span>${description}</span></div></div>`).join('')}
        </div>
      </section>
      <aside class="panel skills" aria-labelledby="skills-title">
        <div class="section-top"><div class="icon-chip green">${icon('check')}</div><div><h2 id="skills-title">What you’ll learn</h2><p>Three skills to practise at your pace.</p></div></div>
        <ul class="skills-list">${objectives.map(([key, title, detail]) => `<li><span class="skill-status ${progress[key] ? 'done' : ''}">${progress[key] ? icon('check', 14) : ''}</span><div><strong>${title}</strong><span>${detail}</span></div></li>`).join('')}</ul>
        <p class="privacy">${icon('lock', 16)} ${storageReady ? 'Progress stays on this device.' : 'This browser could not save your progress.'}</p>
      </aside>
    </div>
  </div>`;
}

function learningShell(s, inner) {
  const total = s.questions.length;
  const step = s.view === 'recap' ? total : s.step + 1;
  return `<div class="wrap learning">
    <div class="lesson-top"><a class="button quiet back" href="#home">${icon('back',17)} Home</a>
    ${s.view !== 'recap' ? ' <button class="button secondary" data-action="pause">' + icon('pause', 17) + (demo ? 'Exit demo' : 'Save & stop') + '</button>' : ''}</div>
    ${s.demoType ? '<p class="notice">Demo session · Your practice progress is unchanged.</p>' : ''}
    <div class="session-progress">
      <label for="session-bar">Step ${step} of ${total}</label>
      <progress id="session-bar" value="${step}" max="${total}"></progress>
    </div>
    ${inner}
  </div>`;
}

function worked(preview) {
  const s = session();
  const stage = preview ? previewStep : s.lesson;
  const lesson = lessons[stage];
  const panel = `<section class="panel lesson-card">
    <p class="eyebrow"><span></span> Worked example · ${stage + 1} of ${lessons.length}</p>
    <h1 tabindex="-1">${lesson.title}</h1><p class="intro">${lesson.text}</p>
    <div class="example-balance" aria-label="${esc(lesson.equation)}">
      ${lesson.equation.split(' = ').map((side, index) => (index ? '<span class="equation-equal">=</span>' : '') + '<span>' + esc(side) + '</span>').join('')}
    </div>
    ${stage < 2 ? '<p class="callout">Same operation on the left and the right.</p>' : '<p class="callout">Substitution answers the question “Does this value work?”</p>'}
    <div class="actions">
      <button class="button primary" data-action="${preview ? stage === 2 ? 'start' : 'preview-next' : 'worked-next'}">${preview && stage === 2 ? 'Start or resume practice' : lesson.action} ${icon('arrow')}</button>
      ${stage > 0 ? '<button class="button quiet" data-action="' + (preview ? 'preview-back' : 'worked-back') + '">Previous step</button>' : ''}
    </div>
  </section>`;
  if (!preview) return learningShell(s, panel);
  return `<div class="wrap learning"><div class="lesson-top"><a class="button quiet back" href="#home">${icon('back', 17)} Home</a></div>${panel}</div>`;
}

function activeQuestion(s) {
  return s.questions[s.step];
}

function learning() {
  const s = session();
  if (!s) return `<div class="wrap learning">${recap(data.last, false)}</div>`;
  if (s.view === 'worked') return worked(false);
  if (s.view === 'recap') return learningShell(s, recap(s, Boolean(demo)));
  return learningShell(s, activity(s));
}

function fields(q, s) {
  const d = s.draft;
  const field = (name, label, placeholder, numeric = false) => `<label class="field">
    <span>${label}</span><input data-math name="${name}" ${numeric ? 'inputmode="text" spellcheck="false"' : ''} autocomplete="off" required
    maxlength="${numeric ? 24 : 60}" placeholder="${placeholder}" value="${esc(d[name])}"></label>`;
  const options = q.options && (q.kind !== 'explain' || s.guided);
  const firstOption = draw(s.seed + 31 + s.step * 3, 0, 2);
  const ordered = q.kind === 'repair' ? [0, 1] : [firstOption, (firstOption + 1) % 3, (firstOption + 2) % 3];
  const radios = options ? `<fieldset><legend>${q.kind === 'repair' ? 'Select the first incorrect line' : q.kind === 'explain' ? 'Choose the matching explanation' : 'Choose your first step'}</legend>
    <div class="options">${ordered.map((index, display) => `<label class="option">
    <input type="radio" name="choice" value="${index}" ${d.choice === String(index) ? 'checked' : ''} required>
    <span class="option-letter" aria-hidden="true">${'ABC'[display]}</span><span>${esc(q.options[index])}</span></label>`).join('')}</div>
    </fieldset>` : '';
  if (q.kind === 'inverse') return radios;
  if (q.kind === 'repair' || q.kind === 'step') return radios + field('correction', q.kind === 'repair' ? 'Corrected equation' : 'Next equation', 'Enter an equation');
  if (q.kind === 'explain') return options ? radios : `<label class="field">
    <span>Your explanation</span><textarea data-math name="explanation" rows="3" required maxlength="400" placeholder="I would…">${esc(d.explanation)}</textarea></label>`;
  if (q.kind === 'probe' || q.kind === 'foundation') return field('x', 'Your answer', 'Enter a number', true);
  return radios + `<div class="answer-grid">${field('x', 'Value of x', 'Enter x', true)}${q.verifyExpression
    ? field('substitution', 'Left side after substitution', 'Enter the full expression')
    : field('check', 'Value of the left side', 'After substituting x', true)}</div>`;
}

function workedScaffold(visual) {
  if (!visual) return '';
  if (Number.isFinite(visual.start)) {
    const order = visual.change < 0 ? [visual.end, visual.start] : [visual.start, visual.end];
    const arrow = visual.change < 0 ? '←' : '→';
    return `<div class="scaffold number-steps" aria-label="Number line from ${fmt(visual.start)} to ${fmt(visual.end)}">
      <span>${fmt(order[0])}</span> <span aria-hidden="true">${arrow} ${Math.abs(visual.change)} ${arrow}</span> <span>${fmt(order[1])}</span>
    </div>`;
  }
  if (visual.numberLine) {
    return `<div class="scaffold number-steps" aria-label="From 9, move left 9 to zero, then left 5 to negative 5">
      <span>−5</span> <span aria-hidden="true">← 5 ←</span> <span>0</span> <span aria-hidden="true">← 9 ←</span> <span>9</span>
    </div>`;
  }
  const dots = '<i></i>'.repeat(visual.size);
  return `<div class="scaffold group-model" aria-label="${visual.groups} equal groups with ${visual.size} objects in each group">
    ${('<span aria-hidden="true">' + dots + '</span>').repeat(visual.groups)}
  </div>`;
}

function activity(s) {
  const q = activeQuestion(s);
  const feedback = s.feedback;
  let feedbackTitle = '';
  if (feedback) {
    feedbackTitle = feedback.correct ? 'That works' : "Not yet, let's look together.";
    if (feedback.route === 'challenge') feedbackTitle = 'Ready for a step up';
  }
  const buttons = feedback ? `<div class="actions">
    ${feedback.correct || feedback.route
      ? '<button class="button primary" type="button" data-action="advance">' + ({ challenge: 'Try a harder question', alternative: 'Try the balance model', foundation: 'Practise integers' }[feedback.route] || 'Continue') + ' ' + icon('arrow') + '</button>'
      : '<button class="button primary" type="button" data-action="retry">Try again ' + icon('arrow') + '</button><button class="button quiet" type="button" data-action="show-solution">See a worked answer</button>'}
    ${feedback.code === 'clarify' && q.kind === 'explain' && !s.guided ? '<button class="button quiet" type="button" data-action="guided">Use guided choices</button>' : ''}
    </div>` : `<div class="actions">
    <button class="button primary" type="submit">Check my answer ${icon('arrow')}</button>
    <button class="button quiet" type="button" data-action="hint" aria-expanded="${s.hints}">${icon('hint', 18)} ${s.hints ? 'Hide hint' : 'Show a hint'}</button>
    ${q.kind === 'explain' ? '<button class="button quiet" type="button" data-action="guided">' + (s.guided ? 'Write an explanation' : 'Use guided choices') + '</button>' : ''}
    </div>`;
  const model = s.model ? `<div class="callout model"><strong>Worked answer</strong><p>${esc(q.solution)}</p><button class="button secondary" type="button" data-action="advance">Continue ${icon('arrow', 16)}</button></div>` : '';
  return `<section class="panel lesson-card activity">
    <p class="eyebrow"><span></span> ${esc(q.label)}${q.sourceLabel ? ' · ' + esc(q.sourceLabel) : ''}</p>
    <h1 tabindex="-1">${esc(q.title)}</h1><p class="intro">${esc(q.prompt)}</p>
    ${q.why ? '<p class="callout"><strong>Why this next?</strong> ' + esc(q.why) + '</p>' : ''}
    ${workedScaffold(q.visual)}
    ${q.teaching ? '<div class="callout"><strong>Another way to see it</strong><p>' + esc(q.teaching) + '</p></div>' : ''}
    ${q.balance?.expression ? scale(q.balance) : ''}
    <div class="equation">${esc(q.eq)}</div>
    <form id="answer-form">
    <fieldset class="answer-set" ${feedback ? 'disabled' : ''}><legend class="sr-only">Answer</legend>${fields(q, s)}</fieldset>
    ${!feedback && q.kind !== 'inverse' && !(q.kind === 'explain' && s.guided) ? symbolKeypad() : ''}
    ${s.hints ? '<div class="callout hint" role="status"><strong>' + icon('hint', 17) + ' Hint</strong><p>' + esc(q.hint) + '</p></div>' : ''}
    ${feedback ? '<div id="feedback" class="feedback ' + (feedback.correct ? 'success' : 'support') + '" tabindex="-1"><strong>' + icon(feedback.correct ? 'check' : 'hint', 18) + ' ' + feedbackTitle + '</strong><p>' + esc(feedback.message) + '</p></div>' : ''}
    ${model}${s.model ? '' : buttons}
    </form>
  </section>`;
}

const symbols = [['x', 'x'], ['+', 'plus'], ['−', 'minus'], ['÷', 'divide'], ['=', 'equals'], ['×', 'multiply'], ['(', 'open parenthesis'], [')', 'close parenthesis']];

function symbolKeypad() {
  return `<div class="keypad" role="group" aria-label="Math symbols">
    ${symbols.map(([symbol, name]) => `<button class="button secondary" type="button" data-action="symbol" data-symbol="${symbol}" aria-label="Insert ${name}">${symbol}</button>`).join('')}
  </div>`;
}

function practiceDetails(s) {
  if (!s) return '';
  const hintCount = s.events.filter(event => event.type === 'hint_opened').length;
  const retries = s.history.reduce((total, item) => total + Math.max(0, (item?.attempts || 0) - 1), 0);
  const tasks = Object.entries(s.taskTimes || {}).filter(([, milliseconds]) => milliseconds > 0);
  return `<details class="practice-details">
    <summary>Practice details</summary><p>Hints used: ${hintCount} · Retries: ${retries}</p>
    ${tasks.length ? '<ul aria-label="Time per task">' + tasks.map(([step, ms]) => {
      const seconds = Math.max(1, Math.round(ms / 1000));
      const duration = seconds >= 60 ? Math.floor(seconds / 60) + ' min ' + (seconds % 60) + ' sec' : seconds + ' sec';
      return '<li>Task ' + (Number(step) + 1) + ': ' + duration + '</li>';
    }).join('') + '</ul>' : '<p>Task times appear as you practise.</p>'}
  </details>`;
}

function recap(s, isDemo) {
  const notes = {
    challenge: 'You were ready for a harder question after solving and explaining a step.',
    alternative: 'You saw the same operation another way and tried a fresh equation.',
    foundation: 'You practised a smaller arithmetic step and returned to your equation.',
  };
  const outcome = s.status?.route;
  const nextSkill = objectives.find(([key]) => s.ability?.[key] !== 'independent');
  return `<section class="panel lesson-card recap">
    <div class="icon-chip green">${icon('check', 25)}</div>
    <h1 tabindex="-1">Session complete</h1>
    <p class="intro">Take a moment to notice what you can do now.</p>
    <ul class="skills-list">${objectives.map(([key, title, detail]) => `<li>
      <span class="skill-status ${s.ability?.[key] ? 'done' : ''}">${s.ability?.[key] ? icon('check', 14) : ''}</span>
      <div><strong>${title}</strong><span>${outcomeLabel(s.ability?.[key], 'Keep practising. ' + detail)}</span></div>
    </li>`).join('')}</ul>
    ${notes[outcome] ? '<p class="callout">' + notes[outcome] + '</p>' : ''}
    <p class="muted"><strong>Next time</strong> ${nextSkill ? nextSkill[2] : 'Try a new set and explain why each step keeps the two sides equal.'}</p>
    ${practiceDetails(s)}
    <div class="actions"><button class="button primary" data-action="finish">${isDemo ? 'Exit demo' : 'Back to learning home'} ${icon('arrow')}</button><a href="#progress" class="button quiet">View progress</a></div>
  </section>`;
}

function progress() {
  const s = data.session || data.last;
  return `<div class="wrap reading-page">
    <p class="eyebrow"><span></span> Practice on this device</p><h1 tabindex="-1">My progress</h1>
    <p class="intro">Review the skills you have shown and pick up where you left off.</p>
    <section class="panel section-card"><h2>Learning outcomes</h2>
      <ul class="skills-list">${objectives.map(([key, title, detail]) => `<li><span class="skill-status ${s?.ability?.[key] ? 'done' : ''}">${s?.ability?.[key] ? icon('check', 14) : ''}</span><div><strong>${title}</strong><span>${outcomeLabel(s?.ability?.[key], detail)}</span></div></li>`).join('')}</ul>
      <p class="muted">${data.number} ${data.number === 1 ? 'session' : 'sessions'} completed.</p>
      ${practiceDetails(s)}
      <button class="button primary" data-action="start">${data.session ? 'Resume practice' : 'Start practice'} ${icon('arrow')}</button>
    </section>
    <section class="panel section-card"><h2>Try the tutor’s paths</h2><p class="muted">These short demos use the same checks as a normal session. They do not affect your progress.</p>
      <div class="demo-grid">
      <button class="button secondary" data-action="demo-challenge">Correct reasoning ${icon('arrow', 16)}</button>
      <button class="button secondary" data-action="demo-misconception">Division misconception ${icon('arrow', 16)}</button>
      <button class="button secondary" data-action="demo-foundation">Prerequisite gap ${icon('arrow', 16)}</button>
      </div>
      <details class="demo-notes"><summary>Show demo walkthroughs</summary><ul>
        <li><strong>Correct reasoning</strong> — enter 6 and 20, then write “I subtract 2 from both sides.” The tutor offers a harder equation.</li>
        <li><strong>Division misconception</strong> — select the second line and enter <code>x = 7 + 6</code>. Try again with the same response. The tutor explains the division using a balance.</li>
        <li><strong>Prerequisite gap</strong> — choose “Add 5 on both sides” twice on <code>x + 5 = 12</code>. The tutor offers an integer mini-lesson.</li>
      </ul></details>
    </section>
  </div>`;
}

function about() {
  return `<div class="wrap reading-page">
    <p class="eyebrow"><span></span> Course ET 617</p><h1 tabindex="-1">About Balance Lab</h1>
    <p class="intro">An adaptive tutor for Class 8 learners who want another chance at linear equations.</p>
    <div class="about-grid">
      <section class="panel section-card"><h2>Who it’s for</h2><p>Meera is 13. She knows her multiplication facts and can substitute small integers, but she often loses track of two-sided operations and feels anxious after failing a unit test. She has a shared Android phone for about ten minutes after school.</p>
      <p>She can try a hint, use guided choices for an explanation, and pause without losing her place. Feedback names the mathematical step she can change.</p></section>
      <section class="panel section-card"><h2>How the tutor adapts</h2><p>Two independent correct answers in a row lead to a harder question when a practice slot remains. A repeated one-side-only error leads to a balance explanation. A repeated sign error leads to a short integer lesson.</p>
      <p>The tutor can use AI to generate a harder equation. It checks the answer in code and uses a labelled sample if the service is unavailable. A rule-based rubric checks short explanations. Responses stay in this browser.</p></section>
    </div>
    <section class="panel section-card"><h2>Exam card</h2><dl class="card-fields">
      <div><dt>P4</dt><dd>Adaptive tutor with automatic question generation</dd></div>
      <div><dt>P4-T3</dt><dd>Linear equations in one variable · Class 8</dd></div>
      <div><dt>L5</dt><dd>Learner repeating the topic after failing once</dd></div>
      <div><dt>C4</dt><dd>10-minute sessions with pause and resume</dd></div>
      <div><dt>ID</dt><dd>23B0628</dd></div>
    </dl></section>
    <section class="panel section-card"><h2>What counts as learning</h2>
      <p>A learner who can recite “move it across” may still change only one side or divide only the x term. The worked example uses a balance to show why a step is valid. The repair task asks the learner to find the first mistake and correct it before attempting a fresh equation.</p>
      <p>The recap checks three pieces of evidence. The learner must explain the operation on both sides, repair an incorrect division, and solve and verify a new equation by substitution. It distinguishes independent work from success with a hint, guided choices, or a retry.</p>
    </section>
  </div>`;
}

function outcomeLabel(level, missing) {
  if (!level) return missing;
  return level === 'supported' ? 'Demonstrated with support.' : 'Demonstrated independently.';
}

function resetAnswer(s) {
  lastMathField = null;
  s.draft = {};
  s.feedback = null;
  s.hints = false;
  s.hintEver = false;
  s.guided = false;
  s.guidedEver = false;
  s.attempts = 0;
  s.model = false;
}

function nextCore(s) {
  const q = s.questions[s.step];
  const prior = s.history[s.step] || {};
  const solved = prior.correct || Boolean(s.feedback?.correct);
  s.history[s.step] = { ...prior, correct: solved };
  const outcome = { explain: 'balance', repair: 'repair', transfer: 'solve' }[q.kind];
  if (solved && outcome) s.ability[outcome] = prior.supported ? 'supported' : 'independent';

  if (s.step === s.questions.length - 1) {
    s.view = 'recap';
    record('session_completed', { ability: s.ability });
    if (!demo) {
      data.last = s;
      data.number += 1;
      data.session = null;
    }
    return;
  }
  if (!demo && !s.lessonComplete && !s.questions[s.step + 1]?.why) s.view = 'worked';
  s.step += 1;
  resetAnswer(s);
}

function reserveSlot(s) {
  return s.questions.findLastIndex((q, index) => index > s.step && q.flex);
}

async function generatedChallenge(seed) {
  try {
    const response = await fetch('/api/question?variant=' + draw(seed + 101, 0, 3), { signal: AbortSignal.timeout(5400) });
    if (!response.ok) return null;
    const { source, question } = await response.json();
    return source === 'ai' && validateChallenge(question) ? question : null;
  } catch {
    return null;
  }
}

async function move(s, button) {
  if (pendingAdvance?.session === s) return;
  saveTaskTime(true);
  const next = s.feedback?.route;
  const reserved = next ? reserveSlot(s) : -1;
  if (reserved >= 0) {
    const source = activeQuestion(s);
    const seed = s.seed + s.step;
    let generated = null;
    if (next === 'challenge') {
      const request = { session: s, step: s.step };
      pendingAdvance = request;
      button.disabled = true;
      button.textContent = 'Preparing your question…';
      generated = await generatedChallenge(seed);
      if (pendingAdvance !== request) return;
      pendingAdvance = null;
      if (route !== 'learn' || session() !== s || s.step !== request.step) return;
    }
    let question = next === 'challenge' ? challenge(seed, generated) : next === 'foundation' ? prerequisite(source) : {
      ...followUp(source, seed),
      why: 'The same operation was missed twice. Try applying it to both sides of a balance.',
      balance: source,
      teaching: source.kind === 'repair'
        ? 'Place brackets around the whole left side: (' + source.expression + ') ÷ ' + source.a + '. Divide the x term, the constant, and the right side by ' + source.a + '.'
        : 'Picture two equal sides. Make the constant zero on the left and do the same thing to the right.',
    };
    if (next === 'challenge') {
      for (let offset = 1; offset <= 12 && s.questions.some(item => item.eq === question.eq); offset += 1) {
        question = challenge(seed + offset);
      }
    }
    s.questions.splice(reserved, 1);
    s.questions.splice(s.step + 1, 0, question);
    s.status.route = next;
    s.streak = 0;
    record('adaptive_route', { route: next });
  }
  nextCore(s);
  persist();
  render(true);
}

main.addEventListener('input', event => {
  const field = event.target;
  if (field.form?.id !== 'answer-form' || !session()) return;
  session().draft[field.name] = field.value;
  persist();
});

main.addEventListener('focusin', event => {
  if (event.target.matches('[data-math]')) lastMathField = event.target.name;
});

main.addEventListener('submit', event => {
  if (event.target.id !== 'answer-form') return;
  event.preventDefault();
  const s = session();
  if (!s || s.feedback) return;
  s.draft = Object.fromEntries(new FormData(event.target));
  const q = activeQuestion(s);
  const result = assess(q, s.draft);
  s.attempts += 1;
  const prior = s.history[s.step];
  const supported = Boolean(prior?.supported || s.guidedEver || s.hintEver || s.attempts > 1);
  s.history[s.step] = {
    ...prior,
    firstCorrect: prior?.firstCorrect ?? result.correct,
    correct: prior?.correct || result.correct,
    supported,
    attempts: (prior?.attempts || 0) + 1,
    code: result.code,
  };
  s.streak = result.correct && !supported ? s.streak + 1 : 0;
  if (!result.correct) s.misconceptions[result.code] = (s.misconceptions[result.code] || 0) + 1;
  const next = reserveSlot(s) < 0 ? '' : nextRoute(result, s.streak, s.misconceptions);
  s.feedback = { ...result, route: next };
  record('answer_checked', { format: q.kind, result: result.code, guided: s.guided });
  persist();
  render();
  document.querySelector('#feedback')?.focus();
});

main.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const s = session();
  if (action === 'start') return start();
  if (action.startsWith('demo-')) return startDemo(action.slice(5));
  if (action === 'preview-next' || action === 'preview-back') {
    previewStep += action === 'preview-next' ? 1 : -1;
    return render(true);
  }
  if (action === 'pause' || action === 'finish') {
    saveTaskTime(true);
    if (pendingAdvance?.session === s) pendingAdvance = null;
    if (s?.demoType) demo = null;
    else if (action === 'pause') {
      record('session_paused');
      save();
      welcomeLine = storageReady ? 'Your place is saved. Resume whenever you’re ready.' : 'Your place is available while this tab stays open.';
    } else {
      welcomeLine = '';
    }
    return go('home');
  }
  if (!s) return;
  switch (action) {
    case 'worked-next':
      if (s.lesson === lessons.length - 1) {
        s.lessonComplete = true;
        s.view = 'task';
      }
      else s.lesson += 1;
      break;
    case 'worked-back':
      s.lesson -= 1;
      break;
    case 'advance':
      return move(s, button);
    case 'symbol': {
      const fields = [...main.querySelectorAll('#answer-form [data-math]:enabled')];
      const field = fields.find(item => item.name === lastMathField) || fields[0];
      if (field) {
        const start = field.selectionStart ?? field.value.length;
        const end = field.selectionEnd ?? start;
        const symbol = button.dataset.symbol;
        if (field.value.length - (end - start) + symbol.length > field.maxLength) return;
        field.focus();
        field.setRangeText(symbol, start, end, 'end');
        field.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }
    case 'retry':
      s.feedback = null;
      s.model = false;
      break;
    case 'hint':
      s.hints = !s.hints;
      if (s.hints && !s.hintEver) {
        s.hintEver = true;
        record('hint_opened');
      }
      break;
    case 'guided':
      s.guided = !s.guided;
      if (s.guided) s.guidedEver = true;
      s.feedback = null;
      delete s.draft.choice;
      break;
    case 'show-solution':
      s.model = true;
      record('worked_answer_opened');
      break;
    default:
      return;
  }
  persist();
  const localChange = ['retry', 'hint', 'guided', 'show-solution'].includes(action);
  render(!localChange);
  if (action === 'hint') main.querySelector('[data-action="hint"]')?.focus({ preventScroll: true });
  if (action === 'retry' || action === 'guided') main.querySelector('#answer-form input, #answer-form textarea')?.focus({ preventScroll: true });
  if (action === 'show-solution') main.querySelector('.model button')?.focus({ preventScroll: true });
});

window.addEventListener('hashchange', event => {
  if (new URL(event.oldURL).hash === '#concept') previewStep = 0;
  if (new URL(event.newURL).hash === '#learn' && session()) {
    record('session_entered');
    persist();
  }
  readRoute();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    saveTaskTime(true);
    persist();
  } else {
    startTaskTime();
  }
});
window.addEventListener('pagehide', () => {
  saveTaskTime(true);
  persist();
});
readRoute();
