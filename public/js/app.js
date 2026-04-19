/* app.js - KisanSaathi frontend logic */

let farms = [];
let selectedFarm = null;
let chatHistory = [];
let isTyping = false;
let pendingDelete = null;

const API = '/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return res.json();
}

function showPage(page) {
  document.querySelectorAll('.page').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('nav button').forEach((el) => el.classList.remove('active'));
  document.getElementById(page + '-page').classList.add('active');

  const navMap = { dashboard: 0, 'add-farm': 1, chat: 2 };
  document.querySelectorAll('nav button')[navMap[page]]?.classList.add('active');

  if (page === 'dashboard') loadAndRenderDashboard();
  if (page === 'chat') loadAndRenderChatSidebar();
}

async function loadAndRenderDashboard() {
  try {
    const res = await apiFetch('/farmers');
    if (res.success) {
      farms = res.data;
      renderStats();
      renderFarmList();
    }
  } catch (error) {
    document.getElementById('farms-list').innerHTML =
      '<div class="empty-state"><div>Warning</div>Could not connect to server.<br>Make sure server.js is running.</div>';
  }
}

function renderStats() {
  document.getElementById('stat-farms').textContent = farms.length;
  const totalArea = farms.reduce((sum, farm) => sum + (parseFloat(farm.area) || 0), 0);
  document.getElementById('stat-area').textContent = totalArea.toFixed(1);
  const crops = new Set(farms.map((farm) => farm.crop_name).filter(Boolean));
  document.getElementById('stat-crops').textContent = crops.size;
  const states = new Set(farms.map((farm) => farm.state).filter(Boolean));
  document.getElementById('stat-states').textContent = states.size;
}

const CROP_ICON = {
  'Wheat': 'W',
  'Rice / Paddy': 'R',
  'Maize': 'M',
  'Sugarcane': 'S',
  'Cotton': 'C',
  'Soybean': 'SB',
  'Mustard': 'MU',
  'Potato': 'P',
  'Tomato': 'T',
  'Onion': 'O',
  'Barley': 'B',
  'Sunflower': 'SF'
};

function renderFarmList() {
  const list = document.getElementById('farms-list');
  if (!farms.length) {
    list.innerHTML = '<div class="empty-state"><div>Farm</div>No farms added yet.<br>Click <strong>Add Farm</strong> to get started.</div>';
    return;
  }

  list.innerHTML = farms.map((farm) => `
    <div class="farm-item" id="farm-row-${farm.id}">
      <div class="farm-icon" onclick="openFarmChat(${farm.id})">${CROP_ICON[farm.crop_name] || 'F'}</div>
      <div class="farm-info" onclick="openFarmChat(${farm.id})">
        <div class="farm-name">${escHtml(farm.farm_name)}</div>
        <div class="farm-meta">${escHtml(farm.village)}, ${escHtml(farm.state)} • ${farm.area} acres</div>
      </div>
      <div class="farm-badge" onclick="openFarmChat(${farm.id})">${escHtml(farm.crop_name)}</div>
      <button class="delete-btn" onclick="askDelete(event, ${farm.id})" title="Delete farm">Delete</button>
    </div>
  `).join('');
}

async function saveFarm() {
  const payload = {
    farm_name: document.getElementById('farm-name').value.trim(),
    village: document.getElementById('farm-village').value.trim(),
    district: document.getElementById('farm-district').value.trim(),
    state: document.getElementById('farm-state').value,
    area: document.getElementById('farm-area').value,
    soil_type: document.getElementById('farm-soil').value,
    crop_name: document.getElementById('crop-name').value,
    crop_variety: document.getElementById('crop-variety').value.trim(),
    sowing_date: document.getElementById('sowing-date').value,
    harvest_date: document.getElementById('harvest-date').value,
    irrigation: document.getElementById('irrigation').value,
    fertilizer: document.getElementById('fertilizer').value.trim(),
    notes: document.getElementById('farm-notes').value.trim()
  };

  if (!payload.farm_name || !payload.village || !payload.state || !payload.area || !payload.crop_name) {
    showAlert('save-error', 'Please fill all required (*) fields.');
    return null;
  }

  try {
    const res = await apiFetch('/farmers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      farms.push(res.data);
      showAlert('save-alert', 'Farm saved to MySQL database.');
      clearForm();
      return res.data;
    }

    showAlert('save-error', res.error || 'Failed to save.');
    return null;
  } catch (error) {
    showAlert('save-error', 'Server not reachable. Is server.js running?');
    return null;
  }
}

async function saveFarmAndChat() {
  const farm = await saveFarm();
  if (!farm) return;

  setTimeout(() => {
    selectedFarm = farm;
    showPage('chat');
    loadFarmChat(farm);
  }, 600);
}

function clearForm() {
  ['farm-name', 'farm-village', 'farm-district', 'farm-area', 'crop-variety', 'sowing-date', 'harvest-date', 'fertilizer', 'farm-notes'].forEach((id) => {
    document.getElementById(id).value = '';
  });

  ['farm-state', 'farm-soil', 'crop-name', 'irrigation'].forEach((id) => {
    document.getElementById(id).value = '';
  });
}

function showAlert(id, message) {
  const el = document.getElementById(id);
  if (message) el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

function askDelete(event, id) {
  event?.stopPropagation();

  const farm = farms.find((item) => item.id === id);
  if (!farm) return;

  pendingDelete = id;
  document.getElementById('modal-farm-name').textContent =
    `"${farm.farm_name}" (${farm.crop_name}, ${farm.village}) will be permanently removed from the database.`;
  document.getElementById('delete-modal').classList.add('show');
}

function closeDeleteModal() {
  document.getElementById('delete-modal').classList.remove('show');
  pendingDelete = null;
}

async function confirmDelete() {
  if (!pendingDelete) return;

  const deleteId = pendingDelete;
  closeDeleteModal();
  try {
    const res = await apiFetch('/farmers/' + deleteId, { method: 'DELETE' });
    if (res.success) {
      farms = farms.filter((farm) => farm.id !== deleteId);
      if (selectedFarm && selectedFarm.id === deleteId) {
        selectedFarm = null;
        resetChat();
      }
      renderStats();
      renderFarmList();
      renderSidebarList();
    } else {
      alert('Delete failed: ' + (res.error || 'Unknown error'));
    }
  } catch (error) {
    alert('Server error during delete.');
  }

  pendingDelete = null;
}

async function loadAndRenderChatSidebar() {
  try {
    const res = await apiFetch('/farmers');
    if (res.success) {
      farms = res.data;
      renderSidebarList();

      if (selectedFarm) {
        const stillExists = farms.find((farm) => farm.id === selectedFarm.id);
        if (!stillExists) {
          selectedFarm = null;
          resetChat();
        }
      }
    }
  } catch (error) {
    // ignore sidebar refresh errors
  }
}

function renderSidebarList() {
  const selector = document.getElementById('farm-selector');
  if (!selector) return;

  if (!farms.length) {
    selector.innerHTML = '<div class="sidebar-empty">No farms yet. Add one first.</div>';
    return;
  }

  selector.innerHTML = farms.map((farm) => `
    <div class="farm-select-item ${selectedFarm && selectedFarm.id === farm.id ? 'selected' : ''}">
      <div style="flex:1;cursor:pointer;" onclick="selectFarm(${farm.id})">
        <div class="farm-select-name">${escHtml(farm.farm_name)}</div>
        <div class="farm-select-detail">${escHtml(farm.crop_name)} • ${farm.area} acres • ${escHtml(farm.state)}</div>
      </div>
      <button class="delete-btn" style="opacity:0.7;" onclick="askDelete(event, ${farm.id})" title="Delete">Delete</button>
    </div>
  `).join('');
}

function selectFarm(id) {
  const farm = farms.find((item) => item.id === id);
  if (!farm) return;
  selectedFarm = farm;
  chatHistory = [];
  renderSidebarList();
  loadFarmChat(farm);
}

function openFarmChat(id) {
  const farm = farms.find((item) => item.id === id);
  if (!farm) return;
  selectedFarm = farm;
  showPage('chat');
  loadFarmChat(farm);
}

function loadFarmChat(farm) {
  document.getElementById('no-farm-placeholder').style.display = 'none';
  document.getElementById('quick-prompts').style.display = 'flex';
  document.getElementById('chat-input-area').style.display = 'flex';

  const context = document.getElementById('farm-context-bar');
  context.textContent = `Advising on: ${farm.farm_name} - ${farm.crop_name}, ${farm.area} acres, ${farm.village}, ${farm.state}`;
  context.classList.add('show');

  document.getElementById('chat-messages').innerHTML = '';
  chatHistory = [];
  const sowingText = farm.sowing_date ? ` sown on ${farm.sowing_date}` : '';
  addBotMessage(`Namaskar! I'm your AI farm advisor for **${farm.farm_name}**.\n\nI can see you're growing **${farm.crop_name}**${sowingText} on **${farm.area} acres** in **${farm.village}, ${farm.state}**.\n\nHow can I help you today?`);
}

function resetChat() {
  document.getElementById('chat-messages').innerHTML =
    '<div class="no-farm-msg" id="no-farm-placeholder"><div class="big-emoji">Farm</div><div>Select a farm from the sidebar</div></div>';
  document.getElementById('quick-prompts').style.display = 'none';
  document.getElementById('chat-input-area').style.display = 'none';
  document.getElementById('farm-context-bar').classList.remove('show');
  chatHistory = [];
}

function addBotMessage(text) {
  const messages = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.innerHTML = `<div class="msg-avatar">AI</div><div class="msg-bubble">${formatMsg(text)}</div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function addUserMessage(text) {
  const messages = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg user';
  div.innerHTML = `<div class="msg-bubble">${escHtml(text)}</div><div class="msg-avatar">You</div>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function addTyping() {
  const messages = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.id = 'typing-msg';
  div.innerHTML = '<div class="msg-avatar">AI</div><div class="msg-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  document.getElementById('typing-msg')?.remove();
}

function formatMsg(text) {
  return escHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function escHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function handleKey(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function sendQuick(text) {
  document.getElementById('chat-input').value = text;
  sendMessage();
}

async function sendMessage() {
  if (isTyping || !selectedFarm) return;

  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';
  addUserMessage(text);
  chatHistory.push({ role: 'user', content: text });

  isTyping = true;
  document.getElementById('send-btn').disabled = true;
  addTyping();

  try {
    const res = await apiFetch('/chat', {
      method: 'POST',
      body: JSON.stringify({ farmId: selectedFarm.id, messages: chatHistory })
    });

    removeTyping();
    if (res.success) {
      chatHistory.push({ role: 'assistant', content: res.reply });
      addBotMessage(res.reply);
    } else {
      addBotMessage(res.error || 'Something went wrong.');
    }
  } catch (error) {
    removeTyping();
    addBotMessage('Could not reach the server. Make sure server.js is running.');
  }

  isTyping = false;
  document.getElementById('send-btn').disabled = false;
}

loadAndRenderDashboard();
initWeather();
