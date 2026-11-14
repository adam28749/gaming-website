const STORAGE_KEY = 'novaquest-arena-studio-v1';
const OWNER_EMAIL = 'oconnoradam1@icloud.com';
const ROLES = { zuby: 'admin', 'ben 54': 'admin', ben54: 'admin', cilly14: 'tester' };
const initial = {
  currentUser: null,
  players: {},
  games: [
    { id: 'star-catcher', title: 'Star Catcher', description: 'Tap the button 10 times to catch enough stars.', template: 'tap', reward: 180, creator: 'NovaQuest' },
    { id: 'target-hunt', title: 'Target Hunt', description: 'Pick the hidden target number from 1 to 3.', template: 'target', reward: 150, creator: 'NovaQuest' },
    { id: 'quick-quiz', title: 'Quick Quiz', description: 'Answer the question correctly to win.', template: 'quiz', reward: 200, creator: 'NovaQuest', answer: 'planet', question: 'Which word means a world orbiting a star?' }
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
let toastTimer;
const $ = id => document.getElementById(id);
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && typeof saved === 'object' ? { ...structuredClone(initial), ...saved, players: saved.players || {}, completed: saved.completed || {}, audit: saved.audit || [] } : structuredClone(initial);
  } catch { return structuredClone(initial); }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function keyFor(name) { return name.trim().toLowerCase(); }
function player() { return state.currentUser ? state.players[state.currentUser] : null; }
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}
function safeElement(tag, text, className) {
  const el = document.createElement(tag);
  el.textContent = text;
  if (className) el.className = className;
  return el;
}
function login(event) {
  event.preventDefault();
  const username = $('usernameInput').value.trim();
  const email = $('emailInput').value.trim().toLowerCase();
  const password = $('passwordInput').value;
  if (!username) return toast('Choose a username to join.');
  const key = keyFor(username);
  let person = state.players[key];
  if (!person) {
    // Demo behavior only. Email/username are not verified and cannot secure privileged access.
    const role = email === OWNER_EMAIL ? 'owner' : (ROLES[key] || 'player');
    person = state.players[key] = { username, email, passwordDemo: Boolean(password), role, money: 100, banned: false };
  } else {
    if (person.banned) return toast('This account is banned in this browser demo.');
    if (email === OWNER_EMAIL) person.role = 'owner';
  }
  if (person.banned) return toast('This account is banned in this browser demo.');
  state.currentUser = key;
  save();
  render();
  $('welcomeBanner').textContent = `Welcome to NovaQuest, ${person.username}! Ready to play?`;
  $('welcomeBanner').classList.remove('hidden');
  toast(`Welcome, ${person.username}!`);
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
  const person = player();
  if (!person) return;
  person.money = (Number(person.money) || 0) + amount;
  save();
  renderStatus();
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
    const button = safeElement('button', 'Play game', 'play-btn');
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
  if (game.template === 'target') {
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
  } else if (game.template === 'quiz') {
    area.append(safeElement('p', game.question || 'Which word means a world orbiting a star?'));
    const input = document.createElement('input');
    input.className = 'quiz-answer';
    input.placeholder = 'Type your answer';
    input.setAttribute('aria-label', 'Your answer');
    area.append(input);
    const button = safeElement('button', 'Check answer', 'primary-btn');
    button.type = 'button';
    button.addEventListener('click', () => finishGame(input.value.trim().toLowerCase() === (game.answer || 'planet')));
    area.append(button);
  } else {
    const progress = document.createElement('div');
    progress.className = 'game-progress';
    const fill = document.createElement('div');
    progress.append(fill);
    area.append(progress);
    const counter = safeElement('p', '0 / 10', 'progress-text');
    area.append(counter);
    const button = safeElement('button', 'TAP!', 'game-tap-btn');
    button.type = 'button';
    button.addEventListener('click', () => {
      if (taps >= 10) return;
      taps++;
      counter.textContent = `${taps} / 10`;
      fill.style.width = `${taps * 10}%`;
      if (taps >= 10) finishGame(true);
    });
    area.append(button);
  }
  $('gameDialog').showModal();
}
function finishGame(won) {
  if (!activeGame || $('gameResult').textContent) return;
  if (won) {
    award(Number(activeGame.reward) || 0);
    $('gameResult').textContent = `You won! +${activeGame.reward} coins.`;
    const quest = state.quests.find(item => item.id === 'first-game');
    if (quest && !completed().includes(quest.id)) completeQuest(quest, true);
  } else {
    $('gameResult').textContent = 'Not quite! Close the game and try again.';
  }
}
function updatePreview() {
  $('previewTitle').textContent = $('studioTitle').value.trim() || 'Your game title';
  $('previewDescription').textContent = $('studioDescription').value.trim() || 'Your game instructions will appear here.';
  const template = $('studioTemplate').value;
  $('previewTemplate').textContent = `${template === 'tap' ? 'Tap challenge' : template === 'target' ? 'Target hunt' : 'Quick quiz'} · ${Number($('studioReward').value) || 0} coins`;
}
function publishGame(event) {
  event.preventDefault();
  if (!player()) return toast('Join before publishing.');
  if (player().banned) return toast('Banned players cannot publish games.');
  const title = $('studioTitle').value.trim();
  const description = $('studioDescription').value.trim();
  const reward = Number($('studioReward').value);
  const template = $('studioTemplate').value;
  if (!title || !description || !Number.isInteger(reward) || reward < 0 || reward > 1000) return toast('Check the game name, description, and reward (0–1000).');
  const game = { id: `community-${Date.now()}`, title, description, template, reward, creator: player().username };
  if (template === 'quiz') {
    game.question = 'Which word means a world orbiting a star?';
    game.answer = 'planet';
  }
  state.games.unshift(game);
  save();
  renderGames();
  const quest = state.quests.find(item => item.id === 'creator');
  if (quest && !completed().includes(quest.id)) completeQuest(quest, true);
  $('studioForm').reset();
  updatePreview();
  toast('Published! Your playable game is in the Games list.');
  $('play').scrollIntoView({ behavior: 'smooth' });
}
function ownerAction(action) {
  if (player()?.role !== 'owner') return toast('Owner access required.');
  const name = $('ownerTargetInput').value.trim();
  const key = keyFor(name);
  const amount = Number($('ownerAmountInput').value);
  const reason = $('ownerReasonInput').value.trim() || 'No reason provided';
  if (!name || !Number.isFinite(amount) || amount < 0 || amount > 1000000) return toast('Enter a player and valid amount.');
  const target = state.players[key];
  if (!target && action !== 'ban') return toast('That player has not joined in this browser.');
  if (action === 'ban' && target?.role === 'owner') return toast('The owner account cannot be banned here.');
  if (action === 'gift') target.money = (Number(target.money) || 0) + amount;
  if (action === 'set') target.money = amount;
  if (action === 'ban') {
    state.players[key] ||= { username: name, role: 'player', money: 0 };
    state.players[key].banned = true;
  }
  if (action === 'unban') {
    if (!target) return toast('Player not found.');
    target.banned = false;
  }
  const actor = player().username;
  state.audit.unshift(`${new Date().toLocaleString()}: ${actor} ${action} ${name}${action === 'gift' ? ` (${amount} coins)` : action === 'set' ? ` (balance ${amount})` : ''} — ${reason}`);
  state.audit = state.audit.slice(0, 20);
  if (action === 'ban' && state.currentUser === key) state.currentUser = null;
  save();
  render();
  toast(`${name} updated; action added to the local demo log.`);
}
function renderRoles() {
  const list = $('roleList');
  if (!list) return;
  list.replaceChildren();
  const people = Object.values(state.players).sort((a, b) => a.username.localeCompare(b.username));
  people.forEach(person => {
    const card = document.createElement('article');
    card.className = 'role-card';
    card.append(safeElement('h3', person.username), safeElement('p', person.banned ? 'Banned (local demo)' : 'Active (local demo)'), safeElement('span', person.role, 'role-badge'));
    list.append(card);
  });
  if (!people.length) list.append(safeElement('p', 'No demo accounts yet.', 'disclaimer'));
}
function renderAudit() {
  const list = $('auditList');
  if (!list) return;
  list.replaceChildren();
  (state.audit.length ? state.audit : ['No actions yet.']).slice(0, 10).forEach(item => list.append(safeElement('li', item)));
}
function renderStatus() {
  const person = player();
  $('displayUsername').textContent = person?.username || 'Guest';
  $('displayRole').textContent = person?.role || 'Player';
  $('displayMoney').textContent = `${Number(person?.money || 0).toLocaleString()} coins`;
  $('displayStatus').textContent = person?.banned ? 'Banned' : (person ? 'Online' : 'Guest');
  $('displayStatus').className = person?.banned ? 'status-banned' : '';
  $('logoutBtn').classList.toggle('hidden', !person);
  const owner = person?.role === 'owner';
  $('admin-panel').classList.toggle('hidden', !owner);
  $('adminNav').classList.toggle('hidden', !owner);
}
function render() { renderStatus(); renderGames(); renderQuests(); renderRoles(); renderAudit(); }
$('loginForm').addEventListener('submit', login);
$('logoutBtn').addEventListener('click', logout);
$('studioForm').addEventListener('submit', publishGame);
['studioTitle', 'studioDescription', 'studioTemplate', 'studioReward'].forEach(id => $(id).addEventListener('input', updatePreview));
$('giftMoneyBtn').addEventListener('click', () => ownerAction('gift'));
$('setBalanceBtn').addEventListener('click', () => ownerAction('set'));
$('banPlayerBtn').addEventListener('click', () => ownerAction('ban'));
$('unbanPlayerBtn').addEventListener('click', () => ownerAction('unban'));
render();
updatePreview();
