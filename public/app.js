// ============================================
// NEXUS — AI Social Network (Frontend)
// ============================================

const API = {
  feed: '/api/feed',
  tweet: '/api/tweet',
  like: '/api/like',
  bookmark: '/api/bookmark',
  bookmarks: '/api/bookmarks',
  generate: '/api/generate',
  personas: '/api/personas',
  config: '/api/config',
  configStatus: '/api/config/status',
  deleteTweet: '/api/tweet',
  model: '/api/model'
};

let currentView = 'feed';
let personas = [];
let allTweets = [];
let isGenerating = false;

// ============================================
// Init
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  await checkApiKey();
  await loadPersonas();
  await loadFeed();
  setupNavigation();
  setupCompose();
  setupGenerate();
  setupAddPersona();
  setupModelInput();
  setupInfiniteScroll();
  renderSuggestedPersonas();
});

// ============================================
// API Key Modal
// ============================================

async function checkApiKey() {
  try {
    const res = await fetch(API.configStatus);
    const data = await res.json();
    if (!data.configured) {
      showApiModal();
    }
  } catch {
    showApiModal();
  }
}

function showApiModal() {
  const modal = document.getElementById('api-modal');
  modal.style.display = 'flex';

  const input = document.getElementById('api-key-input');
  const btn = document.getElementById('api-key-submit');

  btn.onclick = async () => {
    const key = input.value.trim();
    if (!key) return;

    btn.textContent = 'Connecting...';
    btn.disabled = true;

    try {
      const res = await fetch(API.config, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });
      if (res.ok) {
        modal.style.display = 'none';
        showToast('Connected successfully!');
      } else {
        throw new Error('Failed');
      }
    } catch {
      btn.textContent = 'Try Again';
      btn.disabled = false;
    }
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btn.click();
  });
}

// ============================================
// Navigation
// ============================================

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      switchView(view);
    });
  });
}

function switchView(view) {
  currentView = view;

  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });

  // Update views
  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('active', v.id === `view-${view}`);
  });

  // Load content
  if (view === 'bookmarks') loadBookmarks();
  if (view === 'personas') renderPersonas();
  if (view === 'explore') renderExplore();
  if (view === 'feed') loadFeed();
}

// ============================================
// Compose
// ============================================

function setupCompose() {
  const textarea = document.getElementById('compose-input');
  const charCount = document.getElementById('char-count');
  const postBtn = document.getElementById('btn-post');
  const composeSidebar = document.getElementById('btn-compose-sidebar');

  textarea.addEventListener('input', () => {
    // Auto-resize
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';

    // Char count
    const remaining = 280 - textarea.value.length;
    charCount.textContent = remaining;
    charCount.className = 'char-count';
    if (remaining <= 20) charCount.classList.add('danger');
    else if (remaining <= 50) charCount.classList.add('warning');

    // Enable/disable post
    postBtn.disabled = textarea.value.trim().length === 0;
  });

  postBtn.addEventListener('click', async () => {
    const content = textarea.value.trim();
    if (!content) return;

    postBtn.disabled = true;
    postBtn.textContent = 'Posting...';

    try {
      const res = await fetch(API.tweet, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const tweet = await res.json();

      textarea.value = '';
      textarea.style.height = 'auto';
      charCount.textContent = '280';
      charCount.className = 'char-count';

      // Prepend to feed
      const container = document.getElementById('feed-container');
      const el = createTweetElement(tweet, true);
      container.prepend(el);

      updateStats();
      showToast('Posted!');
    } catch (err) {
      showToast('Failed to post');
    }

    postBtn.textContent = 'Post';
    postBtn.disabled = true;
  });

  composeSidebar.addEventListener('click', () => {
    switchView('feed');
    textarea.focus();
  });
}

// ============================================
// Generate AI Tweets
// ============================================

function setupGenerate() {
  const btn = document.getElementById('btn-generate');

  btn.addEventListener('click', () => generateTweets(false));
}

// ============================================
// Add Persona
// ============================================

function setupAddPersona() {
  const btnOpen = document.getElementById('btn-add-persona');
  const modal = document.getElementById('add-persona-modal');
  const btnCancel = document.getElementById('ap-cancel');
  const form = document.getElementById('add-persona-form');

  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      modal.style.display = 'none';
      form.reset();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      let handle = document.getElementById('ap-handle').value.trim();
      if (!handle.startsWith('@')) handle = '@' + handle;

      const newPersona = {
        name: document.getElementById('ap-name').value.trim(),
        handle: handle,
        field: document.getElementById('ap-field').value.trim(),
        color: document.getElementById('ap-color').value,
        bio: document.getElementById('ap-bio').value.trim(),
        avatar: document.getElementById('ap-avatar').value.trim() || '🤖',
        systemPrompt: document.getElementById('ap-prompt').value.trim(),
        feeds: document.getElementById('ap-feeds').value.trim()
      };

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Creating...';
      submitBtn.disabled = true;

      try {
        const res = await fetch(API.personas, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPersona)
        });
        
        if (res.ok) {
          showToast('Persona created!');
          await loadPersonas();
          if (currentView === 'personas') renderPersonas();
          if (currentView === 'explore') renderExplore();
          renderSuggestedPersonas();
          updateStats();
          
          modal.style.display = 'none';
          form.reset();
        } else {
          const err = await res.json();
          showToast('Error: ' + (err.error || 'Failed to create'));
        }
      } catch {
        showToast('Failed to create persona');
      }
      
      submitBtn.textContent = 'Create Persona';
      submitBtn.disabled = false;
    });
  }
}

// ============================================
// Feed
// ============================================

async function loadFeed() {
  const container = document.getElementById('feed-container');
  const emptyState = document.getElementById('feed-empty');
  const loading = document.getElementById('feed-loading');

  loading.style.display = 'flex';
  container.innerHTML = '';

  try {
    const res = await fetch(API.feed);
    allTweets = await res.json();

    loading.style.display = 'none';

    if (allTweets.length === 0) {
      emptyState.style.display = 'flex';
    } else {
      emptyState.style.display = 'none';
      allTweets.forEach(tweet => {
        container.appendChild(createTweetElement(tweet));
      });
    }

    updateStats();
  } catch (err) {
    loading.style.display = 'none';
    emptyState.style.display = 'flex';
  }
}

// ============================================
// Bookmarks
// ============================================

async function loadBookmarks() {
  const container = document.getElementById('bookmarks-container');
  const emptyState = document.getElementById('bookmarks-empty');

  container.innerHTML = '';

  try {
    const res = await fetch(API.bookmarks);
    const tweets = await res.json();

    if (tweets.length === 0) {
      emptyState.style.display = 'flex';
    } else {
      emptyState.style.display = 'none';
      tweets.forEach(tweet => {
        container.appendChild(createTweetElement(tweet));
      });
    }
  } catch {
    emptyState.style.display = 'flex';
  }
}

// ============================================
// Personas
// ============================================

async function loadPersonas() {
  try {
    const res = await fetch(API.personas);
    personas = await res.json();
  } catch {
    personas = [];
  }
}

function renderPersonas() {
  const container = document.getElementById('personas-container');
  container.innerHTML = '';

  personas.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'persona-card';
    card.style.animationDelay = `${i * 0.05}s`;
    card.style.position = 'relative';
    
    const deleteBtnHTML = p.isCustom ? `
      <button class="delete-persona-btn" title="Delete Persona" style="position: absolute; right: 16px; top: 16px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    ` : '';

    card.innerHTML = `
      <div class="persona-avatar" style="color:${p.color}">
        ${p.avatar}
      </div>
      <div class="persona-info">
        <div class="persona-name">${p.name}</div>
        <div class="persona-handle">${p.handle}</div>
        <div class="persona-bio">${p.bio}</div>
        <span class="persona-field-tag" style="background:${p.color}20;color:${p.color}">${p.isNews ? '📡 ' : ''}${p.field}</span>
      </div>
      ${deleteBtnHTML}
    `;

    if (p.isCustom) {
      const delBtn = card.querySelector('.delete-persona-btn');
      if (delBtn) {
        delBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm('Are you sure you want to delete ' + p.name + '?')) {
            try {
              await fetch(API.personas + '/' + p.id, { method: 'DELETE' });
              showToast('Persona deleted');
              await loadPersonas();
              renderPersonas();
              renderSuggestedPersonas();
              updateStats();
            } catch {
              showToast('Failed to delete');
            }
          }
        });
      }
    }

    container.appendChild(card);
  });
}

function renderExplore() {
  const container = document.getElementById('explore-grid');
  container.innerHTML = '';

  const shuffled = [...personas].sort(() => Math.random() - 0.5);
  shuffled.forEach(p => {
    const card = document.createElement('div');
    card.className = 'explore-card';
    card.innerHTML = `
      <div class="explore-field" style="color:${p.color}">${p.field}</div>
      <div class="explore-persona-name">${p.name}</div>
      <div class="explore-handle">${p.handle}</div>
      <div class="explore-bio">${p.bio}</div>
    `;
    container.appendChild(card);
  });
}

function renderSuggestedPersonas() {
  const container = document.getElementById('suggested-personas');
  const shuffled = [...personas].sort(() => Math.random() - 0.5).slice(0, 4);

  shuffled.forEach(p => {
    const el = document.createElement('div');
    el.className = 'suggested-persona';
    el.innerHTML = `
      <div class="suggested-avatar" style="color:${p.color}">${p.avatar}</div>
      <div class="suggested-info">
        <div class="suggested-name">${p.name}</div>
        <div class="suggested-handle">${p.handle}</div>
      </div>
    `;
    container.appendChild(el);
  });
}

// ============================================
// Tweet Element Builder
// ============================================

function createTweetElement(tweet, isNew = false) {
  const el = document.createElement('article');
  el.className = `tweet${isNew ? ' new-tweet' : ''}`;
  el.dataset.id = tweet.id;

  const timeStr = formatTime(tweet.createdAt);

  // Build badge
  let badgeHTML = '';
  if (!tweet.isUser) {
    const persona = personas.find(p => p.id === tweet.personaId);
    const color = persona?.color || tweet.color;
    const isNews = persona?.isNews;
    if (isNews) {
      badgeHTML = `<span class="tweet-badge" style="background:${color}18;color:${color}">📡 NEWS</span>`;
    } else {
      badgeHTML = `<span class="tweet-badge" style="background:${color}18;color:${color}">AI</span>`;
    }
  }

  let linkHTML = '';
  if (tweet.link) {
    linkHTML = `
      <div class="tweet-link" style="margin-top: 10px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--bg-secondary); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        <a href="${tweet.link}" target="_blank" rel="noopener noreferrer" style="color: var(--accent); text-decoration: none;">Read Source Article</a>
      </div>
    `;
  }

  el.innerHTML = `
    <div class="tweet-avatar" style="color:${tweet.color}">
      ${tweet.avatar}
    </div>
    <div class="tweet-body">
      <div class="tweet-header">
        <span class="tweet-name">${tweet.name}</span>
        ${badgeHTML}
        <span class="tweet-handle">${tweet.handle}</span>
        <span class="tweet-dot">·</span>
        <span class="tweet-time">${timeStr}</span>
      </div>
      <div class="tweet-content">${escapeHTML(tweet.content)}</div>
      ${linkHTML}
      <div class="tweet-actions">
        <button class="tweet-action like ${tweet.liked ? 'active' : ''}" data-id="${tweet.id}" title="Like">
          <svg viewBox="0 0 24 24" fill="${tweet.liked ? 'var(--like-color)' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>${tweet.likes > 0 ? formatCount(tweet.likes) : ''}</span>
        </button>
        <button class="tweet-action bookmark ${tweet.bookmarked ? 'active' : ''}" data-id="${tweet.id}" title="Bookmark">
          <svg viewBox="0 0 24 24" fill="${tweet.bookmarked ? 'var(--bookmark-color)' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        ${tweet.isUser ? `
          <button class="tweet-action delete" data-id="${tweet.id}" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        ` : ''}
      </div>
    </div>
  `;

  // Event listeners
  el.querySelector('.tweet-action.like').addEventListener('click', (e) => {
    e.stopPropagation();
    handleLike(tweet.id, el);
  });

  el.querySelector('.tweet-action.bookmark').addEventListener('click', (e) => {
    e.stopPropagation();
    handleBookmark(tweet.id, el);
  });

  const deleteBtn = el.querySelector('.tweet-action.delete');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleDelete(tweet.id, el);
    });
  }

  // Remove new-tweet glow after a while
  if (isNew) {
    setTimeout(() => el.classList.remove('new-tweet'), 5000);
  }

  return el;
}

// ============================================
// Actions
// ============================================

async function handleLike(id, el) {
  const btn = el.querySelector('.tweet-action.like');
  try {
    const res = await fetch(`${API.like}/${id}`, { method: 'POST' });
    const tweet = await res.json();

    btn.classList.toggle('active', tweet.liked);
    const svg = btn.querySelector('svg');
    svg.setAttribute('fill', tweet.liked ? 'var(--like-color)' : 'none');
    btn.querySelector('span').textContent = tweet.likes > 0 ? formatCount(tweet.likes) : '';
  } catch {}
}

async function handleBookmark(id, el) {
  const btn = el.querySelector('.tweet-action.bookmark');
  try {
    const res = await fetch(`${API.bookmark}/${id}`, { method: 'POST' });
    const tweet = await res.json();

    btn.classList.toggle('active', tweet.bookmarked);
    const svg = btn.querySelector('svg');
    svg.setAttribute('fill', tweet.bookmarked ? 'var(--bookmark-color)' : 'none');

    showToast(tweet.bookmarked ? 'Bookmarked!' : 'Removed from bookmarks');
  } catch {}
}

async function handleDelete(id, el) {
  try {
    await fetch(`${API.deleteTweet}/${id}`, { method: 'DELETE' });
    el.style.transition = 'all 0.3s ease';
    el.style.opacity = '0';
    el.style.maxHeight = '0';
    el.style.padding = '0';
    el.style.margin = '0';
    setTimeout(() => el.remove(), 300);
    showToast('Tweet deleted');
    updateStats();
  } catch {}
}

// ============================================
// Model Input
// ============================================

async function setupModelInput() {
  const input = document.getElementById('model-input');
  const saveBtn = document.getElementById('model-save');

  // Load current model
  try {
    const res = await fetch(API.model);
    const data = await res.json();
    input.value = data.model || '';
  } catch {}

  saveBtn.addEventListener('click', async () => {
    const model = input.value.trim();
    if (!model) return;

    saveBtn.textContent = 'Saving...';
    try {
      const res = await fetch(API.model, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      });
      if (res.ok) {
        showToast(`Model set to ${model}`);
      }
    } catch {
      showToast('Failed to update model');
    }
    saveBtn.textContent = 'Save';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveBtn.click();
  });
}

// ============================================
// Generate Tweets (shared logic)
// ============================================

async function generateTweets(silent = false) {
  if (isGenerating) return;
  isGenerating = true;

  const btn = document.getElementById('btn-generate');
  const textEl = btn.querySelector('.generate-text');
  const spinnerEl = btn.querySelector('.generate-spinner');
  const loadingEl = document.getElementById('feed-loading');

  btn.disabled = true;
  textEl.style.display = 'none';
  spinnerEl.style.display = 'block';
  btn.querySelector('svg').style.display = 'none';
  if (silent) loadingEl.style.display = 'flex';

  try {
    const res = await fetch(API.generate, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 3 })
    });
    const tweets = await res.json();

    if (tweets.length > 0) {
      const container = document.getElementById('feed-container');
      const emptyState = document.getElementById('feed-empty');
      emptyState.style.display = 'none';

      tweets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (silent) {
        // Infinite scroll: append to bottom
        tweets.reverse().forEach(tweet => {
          container.appendChild(createTweetElement(tweet, true));
        });
      } else {
        // Manual generate: prepend to top
        tweets.forEach((tweet, i) => {
          setTimeout(() => {
            const el = createTweetElement(tweet, true);
            container.prepend(el);
          }, i * 200);
        });
      }

      updateStats();
      if (!silent) showToast(`${tweets.length} new tweets from AI personas!`);
    } else if (!silent) {
      showToast('No tweets generated. Check your API key.');
    }
  } catch (err) {
    if (!silent) showToast('Generation failed. Check your API key.');
    console.error(err);
  }

  btn.disabled = false;
  textEl.style.display = 'inline';
  spinnerEl.style.display = 'none';
  btn.querySelector('svg').style.display = 'inline';
  loadingEl.style.display = 'none';
  isGenerating = false;
}

// ============================================
// Infinite Scroll
// ============================================

function setupInfiniteScroll() {
  const mainContent = document.querySelector('.main-content');
  let topRefreshReady = true;

  mainContent.addEventListener('scroll', () => {
    if (currentView !== 'feed') return;
    if (isGenerating) return;

    const { scrollTop, scrollHeight, clientHeight } = mainContent;
    
    // Trigger when within 200px of the bottom (append to bottom)
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      generateTweets(true);
    }
    
    // Trigger when scrolled to the top (prepend to top)
    if (scrollTop <= 0 && topRefreshReady) {
      generateTweets(false);
      topRefreshReady = false;
    }
    
    // Require scrolling down a bit before allowing another top refresh
    if (scrollTop > 100) {
      topRefreshReady = true;
    }
  });
}

// ============================================
// Utilities
// ============================================

function formatTime(isoString) {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return `${diffSec}s`;
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCount(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function updateStats() {
  fetch(API.feed).then(r => r.json()).then(tweets => {
    document.getElementById('stat-tweets').textContent = tweets.length;
  }).catch(() => {});
  fetch(API.personas).then(r => r.json()).then(p => {
    document.getElementById('stat-personas').textContent = p.length;
  }).catch(() => {});
}

function showToast(message) {
  // Remove old toast
  const old = document.querySelector('.toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}
