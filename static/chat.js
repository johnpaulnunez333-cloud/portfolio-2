const socket = io({
  transports: ['websocket', 'polling']
});

const messagesEl = document.getElementById('chatMessages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const charCount = document.getElementById('charCount');
const chatStatus = document.getElementById('chatStatus');
const onlineCount = document.getElementById('onlineCount');
const onlineUsers = document.getElementById('onlineUsers');

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderMessage(msg) {
  const isMine = msg.username === USERNAME;
  const wrapper = document.createElement('div');
  wrapper.className = `msg-wrapper ${isMine ? 'mine' : 'theirs'}`;
  wrapper.innerHTML = `
    <div class="msg-meta">
      <span class="msg-username">${isMine ? 'You' : escapeHTML(msg.username)}</span>
      <span>${msg.time}</span>
    </div>
    <div class="msg-bubble">${escapeHTML(msg.content)}</div>
  `;
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function systemMsg(text) {
  const el = document.createElement('div');
  el.className = 'system-msg';
  el.textContent = text;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function updateOnline(users) {
  onlineCount.textContent = `● ${users.length} online`;
  onlineUsers.innerHTML = users.map(u => `
    <div class="online-user-item">
      <span class="dot"></span>
      <span>${escapeHTML(u)}</span>
    </div>
  `).join('');
}

socket.on('connect', () => {
  chatStatus.textContent = 'Connected ✓';
  chatStatus.classList.add('connected');
  socket.emit('join', { username: USERNAME });
});

socket.on('disconnect', () => {
  chatStatus.textContent = 'Disconnected';
  chatStatus.classList.remove('connected');
});

socket.on('load_messages', (messages) => {
  messagesEl.innerHTML = '';
  if (messages.length === 0) {
    systemMsg('No messages yet. Say hi! 👋');
  } else {
    messages.forEach(msg => renderMessage(msg));
  }
});

socket.on('new_message', (msg) => {
  renderMessage(msg);
});

socket.on('user_joined', (data) => {
  systemMsg(`${data.username} joined the chat`);
  updateOnline(data.online);
});

socket.on('user_left', (data) => {
  systemMsg(`${data.username} left the chat`);
  updateOnline(data.online);
});

function sendMessage() {
  const content = msgInput.value.trim();
  if (!content) return;
  socket.emit('send_message', { content });
  msgInput.value = '';
  charCount.textContent = '0/500';
  msgInput.focus();
}

sendBtn.addEventListener('click', sendMessage);
msgInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
msgInput.addEventListener('input', () => {
  charCount.textContent = `${msgInput.value.length}/500`;
});

const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');
if (navToggle) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
}
