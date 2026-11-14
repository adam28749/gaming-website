const STORAGE_KEY = 'novaquest-arena-state-v1';

const defaultState = {
  currentUser: 'adam28749',
  players: {
    adam28749: { username: 'adam28749', password: 'ownerpass', role: 'owner', money: 5000, banned: false },
    zuby: { username: 'zuby', password: 'adminpass', role: 'admin', money: 2300, banned: false },
    ben54: { username: 'ben54', password: 'adminpass', role: 'admin', money: 2400, banned: false },
    cilly14: { username: 'cilly14', password: 'testerpass', role: 'tester', money: 1500, banned: false },
    guest: { username: 'guest', password: '', role: 'player', money: 120, banned: false }
  },
  quests: [
    { id: 1, title: 'Daily loot run', reward: 120, description: 'Win 3 battles in the arena.' },
    { id: 2, title: 'Skyline sprint', reward: 180, description: 'Finish a timed race mode.' },
    { id: 3, title: 'Creator challenge', reward: 240, description: 'Submit and test a new game concept.' }
  ],
  games: [
    { id: 1, title: 'Neon Drift', description: 'A fast arcade racing challenge with power boosts.', reward: 180 },
    { id: 2, title: 'Dungeon Dash', description: 'Fight through randomized room layouts and boss waves.', reward: 250 },
    { id: 3, title: 'Pixel Tower', description: 'Stack and defend your way to the top of the tower.', reward: 200 }
  ]
};

const state = loadState();

const elements = {
  usernameInput: document.getElementById('usernameInput'),
  passwordInput: document.getElementById('passwordInput'),
  loginBtn: document.getElementById('loginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  displayUsername: document.getElementById('displayUsername'),
  displayRole: document.getElementById('displayRole'),
  displayMoney: document.getElementById('displayMoney'),
  displayStatus: document.getElementById('displayStatus'),
  questList: document.getElementById('questList'),
  gameList: document.getElementById('gameList'),
  roleList: document.getElementById('roleList'),
  gameTitleInput: document.getElementById('gameTitleInput'),
  gameDescInput: document.getElementById('gameDescInput'),
  gameRewardInput: document.getElementById('gameRewardInput'),
  createGameBtn: document.getElementById('createGameBtn'),
  ownerTargetInput: document.getElementById('ownerTargetInput'),
  ownerAmountInput: document.getElementById('ownerAmountInput'),
  giftMoneyBtn: document.getElementById('giftMoneyBtn'),
  setBalanceBtn: document.getElementById('setBalanceBtn'),
  banPlayerBtn: document.getElementById('banPlayerBtn')
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultState);

  try {
    return JSON.parse(saved);
  } catch (error) {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getCurrentPlayer() {
  return state.players[state.currentUser] || { username: 'Guest', role: 'player', money: 0, banned: false };
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString()} coins`;
}

function loginPlayer() {
  const username = elements.usernameInput.value.trim();
  const password = elements.passwordInput.value.trim();

  if (!username) {
    alert('Choose a username to enter the arena.');
    return;
  }

  const existing = state.players[username];

  if (existing) {
    if (existing.password && password !== existing.password) {
      alert('Incorrect password for this account.');
      return;
    }

    if (existing.banned) {
      alert('This account is banned.');
      return;
    }

    state.currentUser = username;
    saveState();
    render();
    return;
  }

  const newPlayer = {
    username,
    password: password || '',
    role: 'player',
    money: 100,
    banned: false
  };

  state.players[username] = newPlayer;
  state.currentUser = username;
  saveState();
  render();
}

function logoutPlayer() {
  state.currentUser = 'guest';
  saveState();
  render();
}

function renderQuests() {
  elements.questList.innerHTML = '';

  state.quests.forEach((quest) => {
    const card = document.createElement('div');
    card.className = 'quest-card';
    card.innerHTML = `
      <h4>${quest.title}</h4>
      <p>${quest.description}</p>
      <div class="meta-row">
        <span class="reward-tag">+${quest.reward} coins</span>
        <button class="quest-btn" data-quest-id="${quest.id}">Complete</button>
      </div>
    `;
    elements.questList.appendChild(card);
  });

  document.querySelectorAll('.quest-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const questId = Number(button.dataset.questId);
      const quest = state.quests.find((item) => item.id === questId);
      const current = getCurrentPlayer();

      if (!current || current.banned) {
        alert('You cannot complete quests while banned.');
        return;
      }

      if (quest) {
        const player = state.players[state.currentUser];
        if (player) {
          player.money = (player.money || 0) + quest.reward;
          saveState();
          render();
        }
      }
    });
  });
}

function renderGames() {
  elements.gameList.innerHTML = '';

  state.games.forEach((game) => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = `
      <h4>${game.title}</h4>
      <p>${game.description}</p>
      <div class="meta-row">
        <span class="reward-tag">+${game.reward} coins</span>
        <button class="play-btn" data-game-id="${game.id}">Play</button>
      </div>
    `;
    elements.gameList.appendChild(card);
  });

  document.querySelectorAll('.play-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const gameId = Number(button.dataset.gameId);
      const game = state.games.find((item) => item.id === gameId);
      const current = getCurrentPlayer();

      if (!current || current.banned) {
        alert('You are banned and cannot play.');
        return;
      }

      if (game) {
        const player = state.players[state.currentUser];
        if (player) {
          player.money = (player.money || 0) + game.reward;
          saveState();
          render();
        }
      }
    });
  });
}

function renderRoles() {
  elements.roleList.innerHTML = '';
  const roles = [
    { role: 'Owner', user: 'adam28749', note: 'Full access to economy and moderation settings.' },
    { role: 'Admin', user: 'zuby', note: 'Moderates quests and content.' },
    { role: 'Admin', user: 'ben54', note: 'Moderates quests and content.' },
    { role: 'Tester', user: 'cilly14', note: 'Tests games before release.' },
    { role: 'Player', user: 'guest', note: 'Guest entry without password-protected progress.' }
  ];

  roles.forEach((entry) => {
    const card = document.createElement('div');
    card.className = 'role-card';
    card.innerHTML = `
      <h4>${entry.user}</h4>
      <p>${entry.note}</p>
      <span class="role-badge">${entry.role}</span>
    `;
    elements.roleList.appendChild(card);
  });
}

function render() {
  const current = getCurrentPlayer();
  const isLoggedIn = !!state.players[state.currentUser];
  const isOwner = state.players[state.currentUser]?.role === 'owner';

  elements.displayUsername.textContent = current.username || 'Guest';
  elements.displayRole.textContent = current.role || 'player';
  elements.displayMoney.textContent = formatMoney(current.money || 0);
  elements.displayStatus.textContent = current.banned ? 'Banned' : 'Online';

  elements.logoutBtn.classList.toggle('hidden', !isLoggedIn || state.currentUser === 'guest');
  elements.displayStatus.style.color = current.banned ? '#ff6978' : '#45d483';

  document.getElementById('owner-tools').style.display = isOwner ? 'block' : 'none';

  renderQuests();
  renderGames();
  renderRoles();
}

function createGame() {
  const title = elements.gameTitleInput.value.trim();
  const description = elements.gameDescInput.value.trim();
  const reward = Number(elements.gameRewardInput.value || 100);
  const current = getCurrentPlayer();

  if (!title || !description) {
    alert('Add a title and description to publish a game.');
    return;
  }

  if (current.banned) {
    alert('Banned players cannot publish games.');
    return;
  }

  state.games.unshift({
    id: Date.now(),
    title,
    description,
    reward
  });

  elements.gameTitleInput.value = '';
  elements.gameDescInput.value = '';
  elements.gameRewardInput.value = '100';
  saveState();
  render();
}

function giftMoney() {
  if (state.players[state.currentUser]?.role !== 'owner') {
    alert('Only the owner can gift in-game money.');
    return;
  }

  const targetName = elements.ownerTargetInput.value.trim();
  const amount = Number(elements.ownerAmountInput.value || 0);

  if (!targetName) {
    alert('Choose a player to gift money to.');
    return;
  }

  const target = state.players[targetName];
  if (!target) {
    alert('That user does not exist yet.');
    return;
  }

  target.money = (target.money || 0) + amount;
  saveState();
  render();
}

function setBalance() {
  if (state.players[state.currentUser]?.role !== 'owner') {
    alert('Only the owner can set balances.');
    return;
  }

  const targetName = elements.ownerTargetInput.value.trim();
  const amount = Number(elements.ownerAmountInput.value || 0);

  if (!targetName) {
    alert('Choose a player to set the balance for.');
    return;
  }

  const target = state.players[targetName];
  if (!target) {
    alert('That user does not exist yet.');
    return;
  }

  target.money = amount;
  saveState();
  render();
}

function banPlayer() {
  if (state.players[state.currentUser]?.role !== 'owner') {
    alert('Only the owner can ban players.');
    return;
  }

  const targetName = elements.ownerTargetInput.value.trim();
  if (!targetName) {
    alert('Choose a player to ban.');
    return;
  }

  const target = state.players[targetName];
  if (!target) {
    alert('That user does not exist yet.');
    return;
  }

  target.banned = true;
  if (state.currentUser === targetName) {
    state.currentUser = 'guest';
  }
  saveState();
  render();
}

elements.loginBtn.addEventListener('click', loginPlayer);
elements.logoutBtn.addEventListener('click', logoutPlayer);
elements.createGameBtn.addEventListener('click', createGame);
elements.giftMoneyBtn.addEventListener('click', giftMoney);
elements.setBalanceBtn.addEventListener('click', setBalance);
elements.banPlayerBtn.addEventListener('click', banPlayer);

render();
