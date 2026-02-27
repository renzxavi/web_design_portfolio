// =============================================
//   RENZO XAVIER — script.js
//   Supabase contact form
// =============================================

// ─── SUPABASE CONFIG ─────────────────────────
const SUPABASE_URL  = 'https://jecbmjrzvzofhovrgqau.supabase.co';
const SUPABASE_ANON = 'sb_publishable_D_yFRcefnZUkKn4BnAYgDg_cZ8Zk--O';


document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('contactForm');
  const btn  = form && form.querySelector('button[type="submit"]');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/contacts', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':        SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON,
          'Prefer':        'return=minimal'
        },
        body: JSON.stringify({ name, email, message })
      });

      if (res.ok || res.status === 201 || res.status === 204) {
        showMsg('Message sent. I\'ll be in touch soon.', 'success');
        form.reset();
      } else {
        const err = await res.json().catch(() => ({}));
        showMsg('Error ' + res.status + ': ' + (err.message || 'Something went wrong.'), 'error');
      }

    } catch (err) {
      // Log real error to console for debugging
      console.error('Supabase fetch error:', err);
      showMsg('Could not connect. Check console for details (F12).', 'error');
    } finally {
      btn.textContent = 'Send message';
      btn.disabled = false;
    }
  });

  function showMsg(text, type) {
    const el = document.getElementById('form-message');
    if (!el) return;
    // reset any previous fade
    el.style.transition = '';
    el.style.opacity = '1';
    el.style.display = 'block';
    el.textContent = text;
    el.className = 'form-msg ' + type;
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s';
      el.style.opacity = '0';
      setTimeout(() => {
        el.className = 'form-msg';
        el.style.opacity = '';
        el.style.transition = '';
        el.style.display = '';
        el.textContent = '';
      }, 400);
    }, 6000);
  }

  // ─── ACTIVE NAV ──────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav a');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => {
          const active = a.getAttribute('href') === '#' + entry.target.id;
          a.style.color       = active ? 'var(--black)' : '';
          a.style.borderColor = active ? 'var(--black)' : '';
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => obs.observe(s));

});