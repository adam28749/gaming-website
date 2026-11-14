(() => {
  'use strict';

  const catalog = [
    { id: 'classic', name: 'Classic Explorer', emoji: '🧑‍🚀', cost: 0, color: '#5267ad', description: 'Your starter look.' },
    { id: 'ninja', name: 'Shadow Ninja', emoji: '🥷', cost: 250, color: '#382d58', description: 'A stealthy look for obby runs.' },
    { id: 'robot', name: 'Neon Robot', emoji: '🤖', cost: 400, color: '#197c8d', description: 'A bright, futuristic bot.' },
    { id: 'wizard', name: 'Star Wizard', emoji: '🧙', cost: 550, color: '#7646a8', description: 'Ready to quest with a little magic.' },
    { id: 'dragon', name: 'Dragon Rider', emoji: '🐲', cost: 750, color: '#a34242', description: 'A fiery fantasy avatar.' },
    { id: 'alien', name: 'Cosmic Alien', emoji: '👽', cost: 900, color: '#438246', description: 'A visitor from another world.' }
  ];
  const $ = id => document.getElementById(id);

  function currentAccount() {
    // script.js declares these in the shared classic-script global lexical scope.
    return typeof player === 'function' ? player() : null;
  }
  function persist() {
    if (typeof save === 'function') save();
  }
  function toastShop(message) {
    if (typeof toast === 'function') toast(message);
  }
  function ensureAvatar(account) {
    account.avatar ||= { owned: ['classic'], equipped: 'classic' };
    if (!Array.isArray(account.avatar.owned)) account.avatar.owned = ['classic'];
    if (!account.avatar.owned.includes('classic')) account.avatar.owned.unshift('classic');
    if (!catalog.some(item => item.id === account.avatar.equipped) || !account.avatar.owned.includes(account.avatar.equipped)) {
      account.avatar.equipped = 'classic';
    }
    return account.avatar;
  }
  function render() {
    const account = currentAccount();
    const catalogElement = $('avatarCatalog');
    if (!catalogElement) return;
    catalogElement.replaceChildren();

    if (!account) {
      $('avatarPreviewEmoji').textContent = '🧑‍🚀';
      $('avatarPreview').style.setProperty('--avatar-color', '#5267ad');
      $('avatarPreviewName').textContent = 'Classic Explorer';
      $('avatarPreviewStatus').textContent = 'Join first to buy and equip avatar looks.';
      catalog.forEach(item => catalogElement.append(buildCard(item, null, null)));
      return;
    }

    const avatar = ensureAvatar(account);
    const equipped = catalog.find(item => item.id === avatar.equipped) || catalog[0];
    $('avatarPreviewEmoji').textContent = equipped.emoji;
    $('avatarPreview').style.setProperty('--avatar-color', equipped.color);
    $('avatarPreviewName').textContent = equipped.name;
    $('avatarPreviewStatus').textContent = `Equipped · ${Number(account.money || 0).toLocaleString()} coins available`;
    catalog.forEach(item => catalogElement.append(buildCard(item, avatar, account)));
    persist();
  }
  function buildCard(item, avatar, account) {
    const card = document.createElement('article');
    card.className = 'avatar-item';
    const icon = document.createElement('div');
    icon.className = 'avatar-item-icon';
    icon.style.setProperty('--avatar-color', item.color);
    icon.textContent = item.emoji;
    const details = document.createElement('div');
    details.className = 'avatar-item-details';
    const title = document.createElement('h3'); title.textContent = item.name;
    const description = document.createElement('p'); description.textContent = item.description;
    const price = document.createElement('span'); price.className = 'avatar-price'; price.textContent = item.cost === 0 ? 'Free' : `${item.cost.toLocaleString()} coins`;
    details.append(title, description, price);
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'avatar-action secondary-btn';
    if (!account) {
      action.textContent = item.cost === 0 ? 'Join to use' : 'Join to buy';
      action.disabled = true;
    } else if (avatar.owned.includes(item.id)) {
      const isEquipped = avatar.equipped === item.id;
      action.textContent = isEquipped ? 'Equipped' : 'Equip';
      action.disabled = isEquipped;
      action.addEventListener('click', () => equip(item.id));
    } else {
      action.textContent = item.cost === 0 ? 'Get free' : 'Buy';
      action.classList.add('buy-action');
      action.addEventListener('click', () => buy(item.id));
    }
    card.append(icon, details, action);
    return card;
  }
  function buy(id) {
    const account = currentAccount();
    const item = catalog.find(entry => entry.id === id);
    if (!account || !item) return toastShop('Join before buying an avatar.');
    if (account.banned) return toastShop('Banned players cannot shop.');
    const avatar = ensureAvatar(account);
    if (avatar.owned.includes(id)) return equip(id);
    const coins = Number(account.money) || 0;
    if (coins < item.cost) return toastShop(`You need ${item.cost.toLocaleString()} coins for ${item.name}.`);
    account.money = coins - item.cost;
    avatar.owned.push(id);
    avatar.equipped = id;
    persist();
    if (typeof renderStatus === 'function') renderStatus();
    if (typeof renderRoles === 'function') renderRoles();
    render();
    toastShop(`${item.name} unlocked and equipped!`);
  }
  function equip(id) {
    const account = currentAccount();
    if (!account) return toastShop('Join to equip an avatar.');
    const avatar = ensureAvatar(account);
    if (!avatar.owned.includes(id)) return toastShop('Buy this avatar before equipping it.');
    avatar.equipped = id;
    persist();
    render();
    toastShop(`${catalog.find(item => item.id === id).name} equipped!`);
  }

  // Main script's join handler runs first, then this listener refreshes the shop UI.
  $('loginForm')?.addEventListener('submit', () => setTimeout(render, 0));
  $('logoutBtn')?.addEventListener('click', () => setTimeout(render, 0));
  document.addEventListener('novaquest:account-updated', render);
  render();
})();
