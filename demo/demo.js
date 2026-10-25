// Demo behavior: sample data that moves, so the shapes can be judged alive.
// A classic script, not a module, so the page also opens from the file system.
// Everything stops with the Pause button (WCAG 2.2.2).
(function () {
  'use strict';

  const root = document.documentElement;
  const SVG = 'http://www.w3.org/2000/svg';
  let running = true;

  function pad(number) { return String(number).padStart(2, '0'); }
  function clockText(date) { return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`; }
  function svg(tag, attributes, text) {
    const node = document.createElementNS(SVG, tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // ——— controls ———
  const buttonFx = document.getElementById('button-fx');
  const buttonPause = document.getElementById('button-pause');
  try {
    if (localStorage.getItem('kanshi.fx') === 'off') { root.classList.remove('k-fx'); buttonFx.setAttribute('aria-pressed', 'false'); }
  } catch (error) { /* storage blocked: the default stays */ }
  buttonFx.addEventListener('click', () => {
    const on = root.classList.toggle('k-fx');
    buttonFx.setAttribute('aria-pressed', String(on));
    try { localStorage.setItem('kanshi.fx', on ? 'on' : 'off'); } catch (error) { /* not remembered */ }
  });
  // Emergency mode: the button, or #emergency in the address to open in it.
  const buttonEmergency = document.getElementById('button-emergency');
  function setEmergency(on) {
    if (on) root.dataset.mode = 'emergency';
    else delete root.dataset.mode;
    buttonEmergency.setAttribute('aria-pressed', String(on));
  }
  setEmergency(location.hash === '#emergency');
  buttonEmergency.addEventListener('click', () => setEmergency(root.dataset.mode !== 'emergency'));
  buttonPause.addEventListener('click', () => {
    running = !running;
    root.classList.toggle('k-running', running);
    buttonPause.setAttribute('aria-pressed', String(!running));
    buttonPause.textContent = running ? 'Pause' : 'Resume';
    if (running) startCountdown();
  });

  // ——— clock ———
  const clock = document.getElementById('clock');
  const tickClock = () => { clock.textContent = clockText(new Date()); };
  tickClock();
  setInterval(tickClock, 1000);

  // ——— hex grid ———
  const hexgrid = document.getElementById('hexgrid');
  const RADIUS = 46;
  const WIDTH = Math.sqrt(3) * RADIUS;
  const hexes = [];
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 5; column++) {
      const cx = 48 + column * WIDTH + (row % 2 ? WIDTH / 2 : 0);
      const cy = 52 + row * 1.5 * RADIUS;
      const points = [];
      for (let corner = 0; corner < 6; corner++) {
        const angle = (Math.PI / 180) * (60 * corner - 90);
        points.push(`${(cx + (RADIUS - 3) * Math.cos(angle)).toFixed(1)},${(cy + (RADIUS - 3) * Math.sin(angle)).toFixed(1)}`);
      }
      const group = svg('g', { class: 'k-hex' });
      const sign = svg('text', { x: cx, y: cy + 4 });
      const label = svg('text', { x: cx, y: cy + 22, class: 'k-hex-sub' });
      group.append(svg('polygon', { points: points.join(' ') }), sign, label);
      hexgrid.append(group);
      hexes.push({ group, sign, label, id: row * 5 + column });
    }
  }
  const offZones = [4, 10];
  const alarmClusters = [[6, 7, 11], [2, 3, 8], [12, 13], [0, 5, 6, 1], [8, 9, 14]];
  let clusterIndex = 0;
  function paintHexes() {
    const alarm = alarmClusters[clusterIndex % alarmClusters.length];
    for (const hex of hexes) {
      const state = alarm.includes(hex.id) ? 'alert' : offZones.includes(hex.id) ? 'off' : 'ok';
      hex.group.dataset.state = state;
      hex.group.classList.toggle('k-blink', state === 'alert');
      hex.sign.textContent = { alert: '警報', off: '停止', ok: '正常' }[state];
      hex.label.textContent = `${{ alert: 'WARN', off: 'OFF', ok: 'ZONE' }[state]} ${pad(hex.id + 1)}`;
    }
    document.getElementById('alert-chip').textContent = `${alarm.length} zones in alarm`;
  }
  paintHexes();

  // ——— vote ———
  const voters = [...document.querySelectorAll('.k-voter')];
  const proposals = ["publish today's brief", 'commit 4 files', 'update the container CLI', 'archive 3 daily notes', 'install a new skill'];
  const voteText = { yes: '承認 yes', no: '否決 no', wait: '審議 …' };
  let round = 41;
  function vote() {
    round++;
    document.getElementById('vote-round').textContent = `ROUND ${String(round).padStart(3, '0')}`;
    const votes = voters.map(() => { const roll = Math.random(); return roll < 0.62 ? 'yes' : roll < 0.9 ? 'no' : 'wait'; });
    voters.forEach((voter, index) => { voter.dataset.vote = votes[index]; voter.querySelector('.k-label').textContent = voteText[votes[index]]; });
    const yes = votes.filter((v) => v === 'yes').length;
    const no = votes.filter((v) => v === 'no').length;
    const [word, tone, chipText] = yes >= 2 ? ['可決', 'ok', `Approved ${yes}/3`] : no >= 2 ? ['否決', 'critical', `Rejected ${no}/3`] : ['保留', 'warning', 'On hold'];
    const verdict = document.getElementById('verdict');
    const chip = document.getElementById('verdict-chip');
    verdict.textContent = word;
    verdict.className = `k-verdict-word k-tone-${tone}`;
    chip.textContent = chipText;
    chip.className = `k-chip k-tone-${tone}`;
    document.getElementById('vote-proposal').textContent = `Proposal: ${proposals[round % proposals.length]}.`;
  }

  // ——— countdown ———
  const countdown = document.getElementById('countdown');
  const segments = document.getElementById('segments');
  for (let i = 0; i < 20; i++) segments.append(document.createElement('i'));
  const TOTAL_SECONDS = 300;
  const RED_BELOW_SECONDS = 60;
  let remaining = 214.37;
  let last = performance.now();
  let frame = 0;
  function drawCountdown() {
    const seconds = Math.max(0, remaining);
    const minutesPart = pad(Math.floor(seconds / 60));
    const secondsPart = pad(Math.floor(seconds % 60));
    const centiseconds = document.createElement('small');
    centiseconds.textContent = `.${pad(Math.floor((seconds * 100) % 100))}`;
    countdown.replaceChildren(`${minutesPart}:${secondsPart}`, centiseconds);
    const low = seconds <= RED_BELOW_SECONDS;
    countdown.toggleAttribute('data-low', low);
    segments.toggleAttribute('data-low', low);
    const lit = Math.ceil((seconds / TOTAL_SECONDS) * 20);
    [...segments.children].forEach((segment, index) => segment.toggleAttribute('data-on', index < lit));
  }
  function tick(now) {
    if (!running) return;
    remaining -= (now - last) / 1000;
    last = now;
    if (remaining <= 0) remaining = TOTAL_SECONDS;
    drawCountdown();
    frame = requestAnimationFrame(tick);
  }
  function startCountdown() {
    cancelAnimationFrame(frame);
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }
  drawCountdown();
  startCountdown();

  // ——— chart ———
  const chart = document.getElementById('chart');
  const POINTS = 40;
  const THRESHOLD = 80;
  const data = [];
  let level = 38;
  for (let i = 0; i < POINTS; i++) { level = Math.min(96, Math.max(8, level + (Math.random() - 0.48) * 12)); data.push(level); }
  const LEFT = 34, RIGHT = 412, TOP = 12, BOTTOM = 128;
  const y = (value) => BOTTOM - (value / 100) * (BOTTOM - TOP);
  const x = (index) => LEFT + (index * (RIGHT - LEFT)) / (POINTS - 1);
  function drawChart() {
    const nodes = [];
    for (const value of [0, 25, 50, 75, 100]) {
      nodes.push(svg('line', { class: 'k-chart-grid', x1: LEFT, x2: RIGHT, y1: y(value), y2: y(value) }));
      nodes.push(svg('text', { class: 'k-chart-axis', x: LEFT - 6, y: y(value) + 3, 'text-anchor': 'end' }, String(value)));
    }
    nodes.push(svg('text', { class: 'k-chart-axis', x: LEFT, y: 146 }, '−80 s'));
    nodes.push(svg('text', { class: 'k-chart-axis', x: RIGHT, y: 146, 'text-anchor': 'end' }, 'now'));
    const line = data.map((value, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)} ${y(value).toFixed(1)}`).join(' ');
    nodes.push(svg('path', { class: 'k-chart-area', d: `${line} L${RIGHT} ${BOTTOM} L${LEFT} ${BOTTOM} Z` }));
    nodes.push(svg('line', { class: 'k-chart-threshold', x1: LEFT, x2: RIGHT, y1: y(THRESHOLD), y2: y(THRESHOLD) }));
    nodes.push(svg('text', { class: 'k-chart-threshold-label', x: LEFT + 6, y: y(THRESHOLD) - 5 }, `LIMIT ${THRESHOLD}%`));
    nodes.push(svg('path', { class: 'k-chart-line', d: line }));
    nodes.push(svg('circle', { class: 'k-chart-end', r: 4.5, cx: x(POINTS - 1), cy: y(data[POINTS - 1]) }));
    chart.replaceChildren(...nodes);
    const now = Math.round(data[POINTS - 1]);
    const meta = document.getElementById('cpu-now');
    meta.textContent = `${now}%`;
    meta.classList.toggle('k-tone-critical', now >= THRESHOLD);
  }
  drawChart();

  // ——— log ———
  const log = document.getElementById('log');
  const events = [
    ['SYNC', 'ok', 'committed and pushed 4 files'],
    ['BRIEF', 'ok', "today's note written"],
    ['LOCK', '', 'lock taken by an interactive session'],
    ['INBOX', '', 'new note from a project agent'],
    ['AUDIT', 'critical', 'dashboard container unreachable'],
    ['EVAL', 'ok', 'skill suite: 58 cases out of 58'],
    ['LOCK', '', 'lock released, sync unblocked'],
    ['SYNC', '', 'skipped: a file was touched under 5 minutes ago'],
    ['INDEX', 'ok', 'vault index rebuilt'],
  ];
  let eventIndex = 0;
  function addLogLine(time) {
    const [tag, tone, text] = events[eventIndex++ % events.length];
    const line = document.createElement('div');
    const tagNode = document.createElement('span');
    tagNode.className = tone ? `k-log-tag k-tone-${tone}` : 'k-log-tag';
    tagNode.textContent = `[${tag}]`;
    line.append(`${clockText(time)}  `, tagNode, ` ${text}`);
    log.querySelector('[data-newest]')?.removeAttribute('data-newest');
    line.setAttribute('data-newest', '');
    log.append(line);
    while (log.children.length > 8) log.firstElementChild.remove();
  }
  const start = Date.now() - 8 * 37000;
  for (let i = 0; i < 7; i++) addLogLine(new Date(start + i * 37000));

  // ——— swatches, read live from tokens.css ———
  const roles = ['background', 'surface', 'border', 'text', 'text-dim', 'accent', 'ok', 'warning', 'critical'];
  const swatches = document.getElementById('swatches');
  const computed = getComputedStyle(root);
  for (const role of roles) {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    const color = document.createElement('div');
    color.className = 'swatch-color';
    color.style.background = `var(--k-color-${role})`;
    const text = document.createElement('div');
    text.className = 'swatch-text';
    const name = document.createElement('b');
    name.textContent = role;
    text.append(name, computed.getPropertyValue(`--k-color-${role}`).trim());
    swatch.append(color, text);
    swatches.append(swatch);
  }

  // ——— one beat for everything that moves on its own ———
  let beat = 0;
  setInterval(() => {
    if (!running) return;
    beat++;
    data.shift();
    data.push(Math.min(96, Math.max(8, data[POINTS - 2] + (Math.random() - 0.47) * 14)));
    drawChart();
    if (beat % 3 === 0) addLogLine(new Date());
    if (beat % 4 === 0) vote();
    if (beat % 5 === 0) { clusterIndex++; paintHexes(); }
  }, 2000);
})();
