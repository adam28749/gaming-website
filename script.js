const STORAGE_KEY = 'novaquest-arena-studio-v2';
const OWNER_EMAIL = 'oconnoradam1@icloud.com';
const STAFF_ROLES = { zuby: 'admin', 'ben 54': 'admin', ben54: 'admin', cilly14: 'tester' };
const initial = {
  currentUser: null,
  players: {},
  games: [
    { id: 'star-catcher', title: 'Star Catcher', description: 'Tap ten times to catch enough stars.', template: 'tap', reward: 180, creator: 'NovaQuest' },
    { id: 'target-hunt', title: 'Target Hunt', description: 'Pick the box hiding the star.', template: 'target', reward: 150, creator: 'NovaQuest' },
    { id: 'quick-quiz', title: 'Quick Quiz', description: 'Answer the question correctly to win.', template: 'quiz', reward: 200, creator: 'NovaQuest', question: 'Which word means a world orbiting a star?', answer: 'planet' },
    { id: 'crystal-obby', title: 'Crystal Cave Obby', description: 'Dodge the lava and reach the glowing goal. Use arrow keys, WASD, or the buttons.', template: 'obby', reward: 250, creator: 'NovaQuest' }
  ],
  quests: [
    { id: 'first-game', title: 'First game', description: 'Finish any mini-game round.', reward: 120 },
    { id: 'quest-runner', title: 'Quest runner', description: 'Complete a quest on the board.', reward: 80 },
    { id: 'creator', title: 'Creator idea', description: 'Publish a game from Studio.', reward: 100 }
  ],
  completed: {},
  audit: []
};
let state = loadState();
let activeGame = null;
let taps = 0;
let obbyPosition = { x: 0, y: 6 };
let toastTimer;
const $ = id => document.getElementById(id);
const OBSTACLES = new Set(['1,6','2,6','2,5','4,5','5,5','1,4','3,4','4,3','6,3','0,2','1,2','3,2','5,1','2,0']);
const GRID_SIZE = 7;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return structuredClone(initial);
    const merged = { ...structuredClone(initial), ...saved, players: saved.players || {}, completed: saved.completed || {}, audit: saved.audit || [] };
    // Keep newer built-in games available for returning users too.
    const known = new Set(merged.games.map(game => game.id));
    initial.games.forEach(game => { if (!known.has(game.id)) merged.games.push(game); });
    return merged;
  } catch { return structuredClone(initial); }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { toast('Could not save: browser storage may be full or disabled.'); }
}
function keyFor(name) { return name.trim().toLowerCase(); }
function player() { return state.currentUser ? state.players[state.currentUser] : null; }
function safeElement(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}
function toast(message) {
  const element = $('toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 3000);
}
function login(event) {
  event.preventDefault();
  const username = $('usernameInput').value.trim();
  const email = $('emailInput').value.trim().toLowerCase();
  if (!username) return toast('Choose a username to join.');
  const key = keyFor(username);
  let account = state.players[key];
  if (account?.banned) return toast('This account is banned in this browser demo.');
  if (!account) {
    // Demo roles only. Typed usernames/emails are not verified identity.
    const role = email === OWNER_EMAIL ? 'owner' : (STAFF_ROLES[key] || 'player');
    account = state.players[key] = { username, email, role, money: 100, banned: false, createdAt: new Date().toISOString() };
  } else {
    account.lastSeen = new Date().toISOString();
    if (email && !account.email) account.email = email;
    if (email === OWNER_EMAIL) account.role = 'owner';
  }
  state.currentUser = key;
  save();
  render();
  $('welcomeBanner').textContent = `Welcome to NovaQuest, ${account.username}! Your account is saved in this browser.`;
  $('welcomeBanner').classList.remove('hidden');
  toast(`Welcome, ${account.username}!`);
  $('welcomeBanner').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function logout() {
  state.currentUser = null;
  save();
  render();
  $('welcomeBanner').classList.add('hidden');
}
function completed() {
  const key = state.currentUser || 'guest';
  state.completed[key] ||= [];
  return state.completed[key];
}
function award(amount) {
  const account = player();
  if (!account) return;
  account.money = (Number(account.money) || 0) + amount;
  save();
  renderStatus();
  renderRoles();
}
function completeQuest(quest, quiet = false) {
  if (!player()) return toast('Join before completing quests.');
  if (player().banned) return toast('Banned players cannot complete quests.');
  const done = completed();
  if (done.includes(quest.id)) return;
  done.push(quest.id);
  award(quest.reward);
  save();
  renderQuests();
  if (!quiet) toast(`Quest completed: +${quest.reward} coins!`);
}
function renderQuests() {
  const list = $('questList');
  list.replaceChildren();
  state.quests.forEach(quest => {
    const card = document.createElement('article');
    card.className = 'quest-card';
    card.append(safeElement('h3', quest.title), safeElement('p', quest.description));
    const row = document.createElement('div');
    row.className = 'meta-row';
    row.append(safeElement('span', `+${quest.reward} coins`, 'reward-tag'));
    const done = completed().includes(quest.id);
    const button = safeElement('button', done ? 'Completed' : 'Complete quest', 'quest-btn');
    button.type = 'button';
    button.disabled = done;
    button.addEventListener('click', () => completeQuest(quest));
    row.append(button);
    card.append(row);
    list.append(card);
  });
}
function renderGames() {
  const list = $('gameList');
  list.replaceChildren();
  state.games.forEach(game => {
    const card = document.createElement('article');
    card.className = 'game-card';
    card.append(safeElement('h3', game.title), safeElement('p', game.description));
    const row = document.createElement('div');
    row.className = 'meta-row';
    row.append(safeElement('span', `+${game.reward} coins per win`, 'reward-tag'));
    const button = safeElement('button', game.template === 'obby' ? 'Play obby' : 'Play game', 'play-btn');
    button.type = 'button';
    button.addEventListener('click', () => openGame(game));
    row.append(button);
    if (game.creator) row.append(safeElement('span', `by ${game.creator}`, 'game-credit'));
    card.append(row);
    list.append(card);
  });
}
function openGame(game) {
  if (!player()) return toast('Join with a username before playing.');
  if (player().banned) return toast('Banned players cannot play.');
  activeGame = game;
  taps = 0;
  $('activeGameTitle').textContent = game.title;
  $('gameInstructions').textContent = game.description;
  $('gameResult').textContent = '';
  const area = $('gameArea');
  area.replaceChildren();
  if (game.template === 'obby') startObby(area);
  else if (game.template === 'target') startTargetGame(area);
  else if (game.template === 'quiz') startQuiz(area, game);
  else startTapGame(area);
  $('gameDialog').showModal();
}
function startTargetGame(area) {
  area.append(safeElement('p', 'Which box hides the star? Choose one.'));
  const target = Math.floor(Math.random() * 3);
  const choices = document.createElement('div');
  choices.className = 'target-choices';
  for (let i = 0; i < 3; i++) {
    const button = safeElement('button', `☆ ${i + 1}`, 'game-tap-btn target-button');
    button.type = 'button';
    button.addEventListener('click', () => finishGame(i === target));
    choices.append(button);
  }
  area.append(choices);
}
function startQuiz(area, game) {
  area.append(safeElement('p', game.question || 'Which word means a world orbiting a star?'));
  const answer = document.createElement('input');
  answer.className = 'quiz-answer';
  answer.placeholder = 'Type your answer';
  answer.setAttribute('aria-label', 'Your answer');
  area.append(answer);
  const button = safeElement('button', 'Check answer', 'primary-btn');
  button.type = 'button';
  button.addEventListener('click', () => finishGame(answer.value.trim().toLowerCase() === (game.answer || 'planet')));
  area.append(button);
}
function startTapGame(area) {
  const progress = document.createElement('div');
  progress.className = 'game-progress';
  const fill = document.createElement('div');
  progress.append(fill);
  area.append(progress);
  const count = safeElement('p', '0 / 10', 'progress-text');
  area.append(count);
  const button = safeElement('button', 'TAP!', 'game-tap-btn');
  button.type = 'button';
  button.addEventListener('click', () => {
    if (taps >= 10) return;
    taps++;
    count.textContent = `${taps} / 10`;
    fill.style.width = `${taps * 10}%`;
    if (taps >= 10) finishGame(true);
  });
  area.append(button);
}
function startObby(area) {
  obbyPosition = { x: 0, y: GRID_SIZE - 1 };
  const help = safeElement('p', 'Reach the green goal. Avoid lava. Use arrow keys / WASD or the controls.');
  help.className = 'obby-help';
  area.append(help);
  const board = document.createElement('div');
  board.id = 'obbyBoard';
  board.className = 'obby-board';
  board.setAttribute('role', 'grid');
  board.setAttribute('aria-label', 'Obstacle course grid');
  area.append(board);
  const controls = document.createElement('div');
  controls.className = 'obby-controls';
  [['up','↑'],['left','←'],['down','↓'],['right','→']].forEach(([direction, label]) => {
    const button = safeElement('button', label, 'obby-control');
    button.type = 'button';
    button.setAttribute('aria-label', `Move ${direction}`);
    button.addEventListener('click', () => moveObby(direction));
    controls.append(button);
  });
  area.append(controls);
  renderObbyBoard();
}
function renderObbyBoard() {
  const board = $('obbyBoard');
  if (!board) return;
  board.replaceChildren();
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = document.createElement('div');
      cell.className = 'obby-cell';
      cell.setAttribute('role', 'gridcell');
      if (OBSTACLES.has(`${x},${y}`)) { cell.classList.add('lava'); cell.textContent = '🔥'; cell.setAttribute('aria-label','Lava obstacle'); }
      if (x === GRID_SIZE - 1 && y === 0) { cell.classList.add('goal'); cell.textContent = '🏁'; cell.setAttribute('aria-label','Goal'); }
      if (x === obbyPosition.x && y === obbyPosition.y) { cell.classList.add('player-cell'); cell.textContent = '🧑'; cell.setAttribute('aria-label','Your player'); }
      board.append(cell);
    }
  }
}
function moveObby(direction) {
  if (!activeGame || activeGame.template !== 'obby' || $('gameResult').textContent) return;
  const delta = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] }[direction];
  if (!delta) return;
  const x = obbyPosition.x + delta[0];
  const y = obbyPosition.y + delta[1];
  if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return;
  if (OBSTACLES.has(`${x},${y}`)) { toast('Ouch! That is lava. Try another path.'); return; }
  obbyPosition = { x, y };
  renderObbyBoard();
  if (x === GRID_SIZE - 1 && y === 0) finishGame(true);
}
function onGameKeydown(event) {
  if (!$('gameDialog').open || activeGame?.template !== 'obby') return;
  const directions = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
  const direction = directions[event.key];
  if (direction) { event.preventDefault(); moveObby(direction); }
}
function finishGame(won) {
  if (!activeGame || $('gameResult').textContent) return;
  if (!won) { $('gameResult').textContent = 'Not quite! Try again.'; return; }
  award(Number(activeGame.reward) || 0);
  $('gameResult').textContent = `You won! +${activeGame.reward} coins.`;
  const firstGameQuest = state.quests.find(item => item.id === 'first-game');
  if (firstGameQuest && !completed().includes(firstGameQuest.id)) completeQuest(firstGameQuest, true);
}
function updatePreview() {
  $('previewTitle').textContent = $('studioTitle').value.trim() || 'Your game title';
  $('previewDescription').textContent = $('studioDescription').value.trim() || 'Your game instructions will appear here.';
  const names = { tap: 'Tap challenge', target: 'Target hunt', quiz: 'Quick quiz', obby: 'Obstacle course' };
  $('previewTemplate').textContent = `${names[$('studioTemplate').value]} · ${Number($('studioReward').value) || 0} coins`;
}
function publishGame(event) {
  event.preventDefault();
  if (!player()) return toast('Join before publishing.');
  if (player().banned) return toast('Banned players cannot publish games.');
  const title = $('studioTitle').value.trim();
  const description = $('studioDescription').value.trim();
  const reward = Number($('studioReward').value);
  const template = $('studioTemplate').value;
  if (!title || !description || !Number.isInteger(reward) || reward < 0 || reward > 1000) return toast('Check the title, description, and reward (0–1000).');
  const game = { id: `community-${Date.now()}`, title, description, template, reward, creator: player().username };
  if (template === 'quiz') { game.question = 'Which word means a world orbiting a star?'; game.answer = 'planet'; }
  state.games.unshift(game);
  save();
  renderGames();
  const creatorQuest = state.quests.find(item => item.id === 'creator');
  if (creatorQuest && !completed().includes(creatorQuest.id)) completeQuest(creatorQuest, true);
  $('studioForm').reset();
  updatePreview();
  toast('Published! Your playable game is in the Games list.');
  $('play').scrollIntoView({ behavior: 'smooth' });
}
function ownerAction(action) {
  if (player()?.role !== 'owner') return toast('Owner access required.');
  const name = $('ownerTargetInput').value.trim();
  if (!name) return toast('Enter the player username.');
  const key = keyFor(name);
  const target = state.players[key];
  const reason = $('ownerReasonInput').value.trim() || 'No reason provided';
  const needsAmount = action === 'gift' || action === 'set';
  const amount = needsAmount ? Number($('ownerAmountInput').value) : 0;
  if (needsAmount && (!Number.isInteger(amount) || amount < 0 || amount > 1000000)) return toast('Enter a whole coin amount from 0 to 1,000,000.');
  if (!target && action !== 'ban') return toast('That player has not joined in this browser.');
  if (action === 'ban' && target?.role === 'owner') return toast('The owner account cannot be banned.');
  if (action === 'gift') target.money = (Number(target.money) || 0) + amount;
  if (action === 'set') target.money = amount;
  if (action === 'ban') { state.players[key] ||= { username: name, role: 'player', money: 0 }; state.players[key].banned = true; }
  if (action === 'unban') { if (!target) return toast('Player not found.'); target.banned = false; }
  const actor = player().username;
  const detail = action === 'gift' ? ` (${amount} coins)` : action === 'set' ? ` (balance ${amount})` : '';
  state.audit.unshift(`${new Date().toLocaleString()}: ${actor} ${action} ${name}${detail} — ${reason}`);
  state.audit = state.audit.slice(0, 20);
  if (action === 'ban' && state.currentUser === key) state.currentUser = null;
  save();
  render();
  toast(`${action === 'gift' ? `${amount} coins gifted to` : action === 'set' ? 'Balance set for' : action === 'ban' ? 'Banned' : 'Unbanned'} ${name}.`);
}
function renderRoles() {
  const list = $('roleList');
  if (!list) return;
  list.replaceChildren();
  const accounts = Object.values(state.players).sort((a,b) => a.username.localeCompare(b.username));
  if (!accounts.length) list.append(safeElement('p', 'No accounts yet. Join to create a local demo profile.', 'disclaimer'));
  accounts.forEach(account => {
    const card = document.createElement('article');
    card.className = 'role-card';
    card.append(safeElement('h3', account.username), safeElement('p', account.banned ? 'Banned (local demo)' : `${Number(account.money || 0).toLocaleString()} coins · active`), safeElement('span', account.role, 'role-badge'));
    list.append(card);
  });
}
function renderAudit() {
  const list = $('auditList');
  if (!list) return;
  list.replaceChildren();
  (state.audit.length ? state.audit : ['No actions yet.']).slice(0,10).forEach(item => list.append(safeElement('li', item)));
}
function renderStatus() {
  const account = player();
  $('displayUsername').textContent = account?.username || 'Guest';
  $('displayRole').textContent = account?.role || 'Player';
  $('displayMoney').textContent = `${Number(account?.money || 0).toLocaleString()} coins`;
  $('displayStatus').textContent = account?.banned ? 'Banned' : (account ? 'Online' : 'Guest');
  $('displayStatus').className = account?.banned ? 'status-banned' : '';
  $('logoutBtn').classList.toggle('hidden', !account);
  const isOwner = account?.role === 'owner';
  $('admin-panel').classList.toggle('hidden', !isOwner);
  $('adminNav').classList.toggle('hidden', !isOwner);
}
function render() { renderStatus(); renderGames(); renderQuests(); renderRoles(); renderAudit(); }
$('loginForm').addEventListener('submit', login);
$('logoutBtn').addEventListener('click', logout);
$('studioForm').addEventListener('submit', publishGame);
['studioTitle','studioDescription','studioTemplate','studioReward'].forEach(id => $(id).addEventListener('input', updatePreview));
$('giftMoneyBtn').addEventListener('click', () => ownerAction('gift'));
$('setBalanceBtn').addEventListener('click', () => ownerAction('set'));
$('banPlayerBtn').addEventListener('click', () => ownerAction('ban'));
$('unbanPlayerBtn').addEventListener('click', () => ownerAction('unban'));
document.addEventListener('keydown', onGameKeydown);
render();
updatePreview();
if (player()) {
  $('welcomeBanner').textContent = `Welcome back to NovaQuest, ${player().username}! Your demo account loaded from this browser.`;
  $('welcomeBanner').classList.remove('hidden');
}
