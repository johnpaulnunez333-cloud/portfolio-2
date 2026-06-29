const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const messagesEl = document.getElementById('chatMessages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const charCount = document.getElementById('charCount');
const chatStatus = document.getElementById('chatStatus');
const onlineCount = document.getElementById('onlineCount');
const onlineUsers = document.getElementById('onlineUsers');

let channel;
let presenceChannel;
const onlineMap = {};

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderMessage(msg, prepend = false) {
  const isMine = msg.username === USERNAME;
  const wrapper = document.createElement('div');
  wrapper.className = `msg-wrapper ${isMine ? 'mine' : 'theirs'}`;
  wrapper.innerHTML = `
    <div class="msg-meta">
      <span class="msg-username">${isMine ? 'You' : msg.username}</span>
      <span>${formatTime(msg.created_at)}</span>
    </div>
    <div class="msg-bubble">${escapeHTML(msg.content)}</div>
  `;
  if (prepend) {
    messagesEl.insertBefore(wrapper, messagesEl.firstChild);
  } else {
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

function systemMsg(text) {
  const el = document.createElement('div');
  el.className = 'system-msg';
  el.textContent = text;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function updateOnlineUsers() {
  const users = Object.values(onlineMap);
  onlineCount.textContent = `● ${users.length} online`;
  onlineUsers.innerHTML = users.map(u => `
    <div class="online-user-item">
      <span class="dot"></span>
      <span>${escapeHTML(u)}</span>
    </div>
  `).join('');
}

async function loadMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(50);

  messagesEl.innerHTML = '';

  if (error) {
    systemMsg('Could not load messages.');
    return;
  }

  if (data.length === 0) {
    systemMsg('No messages yet. Say hi! 👋');
  } else {
    data.forEach(msg => renderMessage(msg));
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage() {
  const content = msgInput.value.trim();
  if (!content) return;

  sendBtn.disabled = true;
  msgInput.value = '';
  charCount.textContent = '0/500';

  const { error } = await supabase.from('messages').insert([{
    username: USERNAME,
    content: content
  }]);

  if (error) {
    systemMsg('Failed to send message. Try again.');
  }

  sendBtn.disabled = false;
  msgInput.focus();
}

function subscribeRealtime() {
  channel = supabase
    .channel('mdn-chat')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages'
    }, payload => {
      renderMessage(payload.new);
    })
    .subscribe(status => {
      if (status === 'SUBSCRIBED') {
        chatStatus.textContent = 'Connected ✓';
        chatStatus.classList.add('connected');
      } else {
        chatStatus.textContent = 'Connecting...';
        chatStatus.classList.remove('connected');
      }
    });

  presenceChannel = supabase.channel('mdn-presence');
  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      Object.keys(onlineMap).forEach(k => delete onlineMap[k]);
      Object.values(state).forEach(presences => {
        presences.forEach(p => { onlineMap[p.user_id] = p.username; });
      });
      updateOnlineUsers();
    })
    .subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({
          user_id: USERNAME + '_' + Date.now(),
          username: USERNAME
        });
      }
    });
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

loadMessages();
subscribeRealtime();
