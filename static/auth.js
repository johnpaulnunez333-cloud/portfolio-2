 (function() {
  const container = document.getElementById('particles');
  if (!container) return;
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  class P {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.2 + 0.3;
      this.sx = (Math.random() - 0.5) * 0.35;
      this.sy = (Math.random() - 0.5) * 0.35;
      this.o = Math.random() * 0.4 + 0.1;
      this.color = Math.random() > 0.7 ? '#ffd700' : '#4fc3f7';
    }
    update() {
      this.x += this.sx; this.y += this.sy;
      if (this.x < 0 || this.x > canvas.width) this.sx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.sy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.o;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  for (let i = 0; i < 50; i++) particles.push(new P());

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 100) {
          ctx.beginPath();
          ctx.strokeStyle = '#4fc3f7';
          ctx.globalAlpha = (1 - d/100) * 0.08;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
    requestAnimationFrame(loop);
  }
  loop();
})();

document.querySelectorAll('.toggle-pw').forEach(btn => {
  btn.addEventListener('click', () => {
    const wrap = btn.closest('.input-wrap');
    const input = wrap.querySelector('input');
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁' : '🙈';
  });
});

function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    let valid = true;
    const l = document.getElementById('login_input');
    const p = document.getElementById('password');
    const lErr = document.getElementById('loginErr');
    const pErr = document.getElementById('passwordErr');

    lErr.textContent = ''; pErr.textContent = '';
    l.classList.remove('error'); p.classList.remove('error');

    if (!l.value.trim()) {
      lErr.textContent = 'Username or email is required.';
      l.classList.add('error'); valid = false;
    }
    if (!p.value.trim()) {
      pErr.textContent = 'Password is required.';
      p.classList.add('error'); valid = false;
    }

    if (!valid) { e.preventDefault(); return; }

    const btn = document.getElementById('loginBtn');
    const txt = document.getElementById('btnText');
    const spin = document.getElementById('spinner');
    txt.classList.add('hidden');
    spin.classList.remove('hidden');
    btn.disabled = true;
  });
}

const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', function(e) {
    let valid = true;
    const u = document.getElementById('username');
    const em = document.getElementById('email');
    const p = document.getElementById('password');
    const c = document.getElementById('confirm');
    const uErr = document.getElementById('usernameErr');
    const emErr = document.getElementById('emailErr');
    const pErr = document.getElementById('passwordErr');
    const cErr = document.getElementById('confirmErr');

    [uErr, emErr, pErr, cErr].forEach(el => el.textContent = '');
    [u, em, p, c].forEach(el => el.classList.remove('error'));

    if (!u.value.trim()) {
      uErr.textContent = 'Username is required.';
      u.classList.add('error'); valid = false;
    }
    if (!em.value.trim()) {
      emErr.textContent = 'Email is required.';
      em.classList.add('error'); valid = false;
    } else if (!validateEmail(em.value.trim())) {
      emErr.textContent = 'Enter a valid email.';
      em.classList.add('error'); valid = false;
    }
    if (!p.value.trim()) {
      pErr.textContent = 'Password is required.';
      p.classList.add('error'); valid = false;
    } else if (p.value.trim().length < 6) {
      pErr.textContent = 'At least 6 characters.';
      p.classList.add('error'); valid = false;
    }
    if (!c.value.trim()) {
      cErr.textContent = 'Please confirm your password.';
      c.classList.add('error'); valid = false;
    } else if (p.value !== c.value) {
      cErr.textContent = 'Passwords do not match.';
      c.classList.add('error'); valid = false;
    }

    if (!valid) { e.preventDefault(); return; }

    const btn = document.getElementById('signupBtn');
    const txt = document.getElementById('btnText');
    const spin = document.getElementById('spinner');
    txt.classList.add('hidden');
    spin.classList.remove('hidden');
    btn.disabled = true;
  });
}
