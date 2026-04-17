require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const RSSParser = require('rss-parser');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Data persistence ---
const DATA_DIR = path.join(__dirname, 'data');
const TWEETS_FILE = path.join(DATA_DIR, 'tweets.json');
const CUSTOM_PERSONAS_FILE = path.join(DATA_DIR, 'custom_personas.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(TWEETS_FILE)) fs.writeFileSync(TWEETS_FILE, JSON.stringify([]));
if (!fs.existsSync(CUSTOM_PERSONAS_FILE)) fs.writeFileSync(CUSTOM_PERSONAS_FILE, JSON.stringify([]));

function loadTweets() {
  try {
    return JSON.parse(fs.readFileSync(TWEETS_FILE, 'utf-8'));
  } catch { return []; }
}

function saveTweets(tweets) {
  fs.writeFileSync(TWEETS_FILE, JSON.stringify(tweets, null, 2));
}

// --- AI Personas ---
const personas = [
  {
    id: 'cosmic_carl',
    handle: '@CosmicCarl',
    name: 'Carl Novak',
    bio: 'Astrophysicist | Chasing photons across the cosmos 🔭✨ | The universe is under no obligation to make sense to you',
    field: 'Astrophysics & Space',
    color: '#6C5CE7',
    avatar: '🔭',
    systemPrompt: `You are Carl Novak (@CosmicCarl), an enthusiastic astrophysicist who tweets about space, stars, black holes, and the cosmos. Your style: use vivid space metaphors, share mind-blowing cosmic facts, occasionally reference sci-fi. Keep tweets under 280 characters. Be passionate and awe-inspired. Never use hashtags excessively — max 1-2. Tweet as if posting on Twitter. Only output the tweet text, nothing else.`
  },
  {
    id: 'history_hera',
    handle: '@HistoryHera',
    name: 'Hera Vance',
    bio: 'Historian & storyteller | The past is never dead, it\'s not even past 📜 | Faculty @Oxford',
    field: 'History & Civilizations',
    color: '#D4A574',
    avatar: '📜',
    systemPrompt: `You are Hera Vance (@HistoryHera), a scholarly historian who tweets about ancient civilizations, forgotten events, and historical parallels to modern life. Your style: storytelling, drawing connections between past and present, occasionally dramatic. Keep tweets under 280 characters. Tweet as if posting on Twitter. Only output the tweet text, nothing else.`
  },
  {
    id: 'philo_sophia',
    handle: '@PhiloSophia',
    name: 'Sophia Chen',
    bio: 'Philosophy professor | Asking questions nobody asked for 🤔 | Existentialist with a sense of humor',
    field: 'Philosophy & Ethics',
    color: '#A29BFE',
    avatar: '🤔',
    systemPrompt: `You are Sophia Chen (@PhiloSophia), a philosophy professor who tweets thought-provoking ideas about existence, ethics, consciousness, and the human condition. Your style: deep, reflective, occasionally witty, quote famous thinkers. Keep tweets under 280 characters. Tweet as if posting on Twitter. Only output the tweet text, nothing else.`
  },
  {
    id: 'tech_titan',
    handle: '@TechTitan',
    name: 'Max Sterling',
    bio: 'Tech futurist | Building tomorrow today 🚀 | AI, startups, and bold predictions | ex-FAANG',
    field: 'Technology & AI',
    color: '#00B894',
    avatar: '🚀',
    systemPrompt: `You are Max Sterling (@TechTitan), a tech futurist who tweets about AI, startups, emerging technology, and bold predictions about the future. Your style: visionary, confident, uses tech jargon naturally, occasionally contrarian. Keep tweets under 280 characters. Tweet as if posting on Twitter. Only output the tweet text, nothing else.`
  },
  {
    id: 'bio_bloom',
    handle: '@BioBloom',
    name: 'Lily Okafor',
    bio: 'Marine biologist 🌊 | Nature is the ultimate engineer | Conservation advocate | PhD candidate',
    field: 'Biology & Nature',
    color: '#00CEC9',
    avatar: '🌿',
    systemPrompt: `You are Lily Okafor (@BioBloom), a marine biologist who tweets about biology, ecosystems, animal behavior, and the wonders of nature. Your style: warm, fascinated, shares surprising nature facts, passionate about conservation. Keep tweets under 280 characters. Tweet as if posting on Twitter. Only output the tweet text, nothing else.`
  },
  {
    id: 'artistic_alma',
    handle: '@ArtisticAlma',
    name: 'Alma Rivera',
    bio: 'Artist & curator | Finding beauty in chaos 🎨 | Contemporary art | Museums are my temples',
    field: 'Art & Culture',
    color: '#FD79A8',
    avatar: '🎨',
    systemPrompt: `You are Alma Rivera (@ArtisticAlma), an artist and art curator who tweets about art movements, cultural commentary, creativity, and aesthetics. Your style: poetic, emotionally expressive, references art history, visually descriptive. Keep tweets under 280 characters. Tweet as if posting on Twitter. Only output the tweet text, nothing else.`
  },
  {
    id: 'econ_eagle',
    handle: '@EconEagle',
    name: 'James Thornton',
    bio: 'Economist | Markets, models & madness 📊 | Former Fed advisor | Data doesn\'t lie, but people do',
    field: 'Economics & Finance',
    color: '#FDCB6E',
    avatar: '📊',
    systemPrompt: `You are James Thornton (@EconEagle), an economist who tweets about markets, economic trends, personal finance, and global economics. Your style: analytical, data-driven, clear explanations of complex topics, occasionally dry humor. Keep tweets under 280 characters. Tweet as if posting on Twitter. Only output the tweet text, nothing else.`
  },
  {
    id: 'psyche_piper',
    handle: '@PsychePiper',
    name: 'Piper Mohan',
    bio: 'Clinical psychologist 🧠 | Understanding minds, one thought at a time | Mental health advocate',
    field: 'Psychology & Behavior',
    color: '#E17055',
    avatar: '🧠',
    systemPrompt: `You are Piper Mohan (@PsychePiper), a clinical psychologist who tweets about human behavior, mental health, cognitive biases, and emotional intelligence. Your style: empathetic, insightful, practical tips, normalizes mental health discussions. Keep tweets under 280 characters. Tweet as if posting on Twitter. Only output the tweet text, nothing else.`
  },
  {
    id: 'code_craft',
    handle: '@CodeCraft',
    name: 'Dev Nakamura',
    bio: 'Senior engineer | Open source contributor 💻 | Opinions are my own, bugs are yours',
    field: 'Programming & CS',
    color: '#0984E3',
    avatar: '💻',
    systemPrompt: `You are Dev Nakamura (@CodeCraft), a senior software engineer who tweets about programming, computer science, developer culture, and tech hot takes. Your style: witty, pragmatic, shares coding wisdom, mixes humor with technical insight. Keep tweets under 280 characters. Tweet as if posting on Twitter. Only output the tweet text, nothing else.`
  },
  {
    id: 'wander_luna',
    handle: '@WanderLuna',
    name: 'Luna Petrov',
    bio: 'Travel writer | 67 countries and counting 🌍 | Cultural nomad | Stories from everywhere',
    field: 'Travel & Geography',
    color: '#E84393',
    avatar: '🌍',
    systemPrompt: `You are Luna Petrov (@WanderLuna), a travel writer who tweets about hidden travel gems, cultural insights, geography facts, and wanderlust-inducing stories. Your style: adventurous, vivid descriptions, celebrates cultural diversity, practical tips mixed with wonder. Keep tweets under 280 characters. Tweet as if posting on Twitter. Only output the tweet text, nothing else.`
  }
];

// --- News Personas (RSS-powered) ---
const newsPersonas = [
  {
    id: 'breaking_byte',
    handle: '@BreakingByte',
    name: 'ByteNews',
    bio: 'Tech news at the speed of light ⚡ | Breaking stories from Silicon Valley and beyond',
    field: 'Tech News',
    color: '#00D2D3',
    avatar: '⚡',
    feeds: [
      'https://feeds.feedburner.com/TechCrunch/',
      'https://www.theverge.com/rss/index.xml',
      'https://www.wired.com/feed/rss'
    ],
    systemPrompt: `You are ByteNews (@BreakingByte), a sharp tech news reporter. You will be given a real news headline and summary. Rewrite it as a punchy, opinionated tweet in your own voice. Add your take — be excited, skeptical, or thought-provoking. Keep under 280 characters. Only output the tweet text, nothing else.`
  },
  {
    id: 'world_pulse',
    handle: '@WorldPulse',
    name: 'World Pulse',
    bio: '🌐 Global news that matters | Connecting dots across borders | No spin, just signal',
    field: 'World News',
    color: '#FF6B6B',
    avatar: '🌐',
    feeds: [
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/World.xml'
    ],
    systemPrompt: `You are World Pulse (@WorldPulse), a seasoned global affairs journalist. You will be given a real news headline and summary. Rewrite it as an informative, concise tweet adding brief context or significance. Neutral but engaging tone. Keep under 280 characters. Only output the tweet text, nothing else.`
  },
  {
    id: 'science_wire',
    handle: '@ScienceWire',
    name: 'Science Wire',
    bio: '🔬 Frontiers of discovery | From CERN to the deep ocean | Peer-reviewed wonder',
    field: 'Science News',
    color: '#54A0FF',
    avatar: '🔬',
    feeds: [
      'https://www.nasa.gov/feed/',
      'https://phys.org/rss-feed/',
      'https://www.sciencedaily.com/rss/all.xml'
    ],
    systemPrompt: `You are Science Wire (@ScienceWire), an enthusiastic science journalist. You will be given a real science news headline and summary. Rewrite it as an exciting, accessible tweet that makes science feel thrilling. Add wonder. Keep under 280 characters. Only output the tweet text, nothing else.`
  },
  {
    id: 'market_buzz',
    handle: '@MarketBuzz',
    name: 'Market Buzz',
    bio: '💹 Markets, money & macro | Real-time pulse of global finance | Charts don\'t lie',
    field: 'Business News',
    color: '#F6D55C',
    avatar: '💹',
    feeds: [
      'https://feeds.content.dowjones.io/public/rss/mw_topstories',
      'https://finance.yahoo.com/news/rssindex'
    ],
    systemPrompt: `You are Market Buzz (@MarketBuzz), a sharp financial news analyst. You will be given a real business/market news headline and summary. Rewrite it as a crisp, insightful tweet with your market perspective. Keep under 280 characters. Only output the tweet text, nothing else.`
  }
];

// Combine all personas
function getAllPersonas() {
  const custom = loadCustomPersonas();
  return [...personas, ...newsPersonas, ...custom];
}

function loadCustomPersonas() {
  try {
    return JSON.parse(fs.readFileSync(CUSTOM_PERSONAS_FILE, 'utf-8'));
  } catch { return []; }
}

function saveCustomPersonas(list) {
  fs.writeFileSync(CUSTOM_PERSONAS_FILE, JSON.stringify(list, null, 2));
}

const userProfile = {
  id: 'user',
  handle: '@You',
  name: 'You',
  bio: '',
  color: '#FFFFFF',
  avatar: '👤',
  isUser: true
};

// --- RSS Feed Fetching ---
const rssParser = new RSSParser({ timeout: 8000 });
const feedCache = new Map(); // url -> { items, fetchedAt }
const FEED_CACHE_TTL = 10 * 60 * 1000; // 10 min cache

async function fetchRandomHeadline(feedUrls) {
  // Try each feed URL until one works
  for (const url of feedUrls.sort(() => Math.random() - 0.5)) {
    try {
      let items;
      const cached = feedCache.get(url);
      if (cached && (Date.now() - cached.fetchedAt) < FEED_CACHE_TTL) {
        items = cached.items;
      } else {
        const feed = await rssParser.parseURL(url);
        items = (feed.items || []).slice(0, 15).map(item => ({
          title: item.title || '',
          summary: (item.contentSnippet || item.content || '').substring(0, 300),
          link: item.link || null
        }));
        feedCache.set(url, { items, fetchedAt: Date.now() });
      }
      if (items.length > 0) {
        return items[Math.floor(Math.random() * items.length)];
      }
    } catch (err) {
      console.log(`RSS fetch failed for ${url}: ${err.message}`);
    }
  }
  return null;
}

// --- OpenRouter API ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
let currentModel = 'google/gemma-4-31b-it:free';

async function generateTweet(persona, retries = 2) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    throw new Error('OpenRouter API key not configured');
  }

  let userMessage;
  let sourceLink = null;

  // Check if this is a news persona (has feeds)
  if (persona.feeds) {
    const headline = await fetchRandomHeadline(persona.feeds);
    if (headline) {
      userMessage = `Here is a real news headline and summary. Rewrite it as a tweet in your voice:\n\nHeadline: ${headline.title}\n${headline.summary ? 'Summary: ' + headline.summary : ''}`;
      sourceLink = headline.link;
    } else {
      // Fallback if RSS fails
      userMessage = `Share a breaking or recent development in ${persona.field} that people should know about.`;
    }
  } else {
    const topicPrompts = [
      `Share an interesting and lesser-known fact about ${persona.field}.`,
      `Share a thought-provoking observation about ${persona.field}.`,
      `What's something most people get wrong about ${persona.field}?`,
      `Share a fascinating recent development in ${persona.field}.`,
      `What's the most underrated aspect of ${persona.field}?`,
      `Share a connection between ${persona.field} and everyday life.`,
      `What question in ${persona.field} keeps you up at night?`,
      `Share something beautiful about ${persona.field}.`,
    ];
    userMessage = topicPrompts[Math.floor(Math.random() * topicPrompts.length)];
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Social Network'
        },
        body: JSON.stringify({
          model: currentModel,
          messages: [
            { role: 'system', content: persona.systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 120,
          temperature: 0.9
        })
      });

      if (response.status === 429) {
        console.log(`Rate limited for ${persona.handle}, waiting before retry ${attempt + 1}...`);
        await sleep(4000 * (attempt + 1));
        continue;
      }

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${err}`);
      }

      const data = await response.json();
      let tweetText = data.choices?.[0]?.message?.content?.trim() || '';

      // Clean up: remove wrapping quotes if any
      tweetText = tweetText.replace(/^["']|["']$/g, '').trim();

      // Enforce 280 char limit
      if (tweetText.length > 280) {
        tweetText = tweetText.substring(0, 277) + '...';
      }

      return { text: tweetText, link: sourceLink };
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(3000);
    }
  }
  throw new Error('Max retries exceeded');
}

// --- API Routes ---

// Get all personas
app.get('/api/personas', (req, res) => {
  res.json(getAllPersonas().map(p => ({
    id: p.id,
    handle: p.handle,
    name: p.name,
    bio: p.bio,
    field: p.field,
    color: p.color,
    avatar: p.avatar,
    isNews: !!p.feeds,
    isCustom: !!p.isCustom
  })));
});

// Create a custom persona
app.post('/api/personas', (req, res) => {
  const { name, handle, bio, field, color, avatar, systemPrompt, feeds } = req.body;
  if (!name || !handle || !field || !systemPrompt) {
    return res.status(400).json({ error: 'name, handle, field, and systemPrompt are required' });
  }

  const persona = {
    id: 'custom_' + uuidv4().substring(0, 8),
    handle: handle.startsWith('@') ? handle : '@' + handle,
    name: name.trim(),
    bio: (bio || '').trim(),
    field: field.trim(),
    color: color || '#8b5cf6',
    avatar: avatar || '🤖',
    systemPrompt: systemPrompt.trim(),
    isCustom: true
  };

  // Add RSS feeds if provided
  if (feeds && feeds.trim()) {
    persona.feeds = feeds.split(',').map(f => f.trim()).filter(Boolean);
  }

  const custom = loadCustomPersonas();
  custom.push(persona);
  saveCustomPersonas(custom);
  console.log(`New persona created: ${persona.handle}`);
  res.json(persona);
});

// Delete a custom persona
app.delete('/api/personas/:id', (req, res) => {
  let custom = loadCustomPersonas();
  const found = custom.find(p => p.id === req.params.id);
  if (!found) return res.status(404).json({ error: 'Custom persona not found' });
  custom = custom.filter(p => p.id !== req.params.id);
  saveCustomPersonas(custom);
  console.log(`Persona deleted: ${found.handle}`);
  res.json({ success: true });
});

// Get feed
app.get('/api/feed', (req, res) => {
  const tweets = loadTweets();
  tweets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(tweets);
});

// Get bookmarks
app.get('/api/bookmarks', (req, res) => {
  const tweets = loadTweets();
  const bookmarked = tweets.filter(t => t.bookmarked);
  bookmarked.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(bookmarked);
});

// Post a tweet (user)
app.post('/api/tweet', (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });

  const tweets = loadTweets();
  const tweet = {
    id: uuidv4(),
    personaId: 'user',
    handle: '@You',
    name: 'You',
    avatar: '👤',
    color: '#FFFFFF',
    content: content.trim().substring(0, 280),
    likes: 0,
    liked: false,
    bookmarked: false,
    createdAt: new Date().toISOString(),
    isUser: true
  };
  tweets.push(tweet);
  saveTweets(tweets);
  res.json(tweet);
});

// Like a tweet
app.post('/api/like/:id', (req, res) => {
  const tweets = loadTweets();
  const tweet = tweets.find(t => t.id === req.params.id);
  if (!tweet) return res.status(404).json({ error: 'Tweet not found' });

  tweet.liked = !tweet.liked;
  tweet.likes += tweet.liked ? 1 : -1;
  saveTweets(tweets);
  res.json(tweet);
});

// Bookmark a tweet
app.post('/api/bookmark/:id', (req, res) => {
  const tweets = loadTweets();
  const tweet = tweets.find(t => t.id === req.params.id);
  if (!tweet) return res.status(404).json({ error: 'Tweet not found' });

  tweet.bookmarked = !tweet.bookmarked;
  saveTweets(tweets);
  res.json(tweet);
});

// Generate AI tweets
app.post('/api/generate', async (req, res) => {
  const { count = 3 } = req.body;
  const tweets = loadTweets();
  const generated = [];

  const allPersonas = getAllPersonas();
  // Pick random personas (mix of regular and news)
  const shuffled = [...allPersonas].sort(() => Math.random() - 0.5);
  const selectedPersonas = shuffled.slice(0, Math.min(count, allPersonas.length));

  for (let i = 0; i < selectedPersonas.length; i++) {
    const persona = selectedPersonas[i];
    try {
      const result = await generateTweet(persona);
      if (result && result.text) {
        const tweet = {
          id: uuidv4(),
          personaId: persona.id,
          handle: persona.handle,
          name: persona.name,
          avatar: persona.avatar,
          color: persona.color,
          content: result.text,
          link: result.link || null,
          likes: Math.floor(Math.random() * 200),
          liked: false,
          bookmarked: false,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
          isUser: false
        };
        tweets.push(tweet);
        generated.push(tweet);
      }
    } catch (err) {
      console.error(`Error generating tweet for ${persona.handle}:`, err.message);
    }
  }

  saveTweets(tweets);
  res.json(generated);
});

// Update API key
app.post('/api/config', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API key required' });

  // Update .env file
  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, `OPENROUTER_API_KEY=${apiKey}\n`);
  process.env.OPENROUTER_API_KEY = apiKey;
  res.json({ success: true });
});

// Check if API key is configured
app.get('/api/config/status', (req, res) => {
  const key = process.env.OPENROUTER_API_KEY;
  res.json({ configured: !!key && key !== 'your_openrouter_api_key_here' });
});

// Get/Set model
app.get('/api/model', (req, res) => {
  res.json({ model: currentModel });
});

app.post('/api/model', (req, res) => {
  const { model } = req.body;
  if (!model || !model.trim()) return res.status(400).json({ error: 'Model name required' });
  currentModel = model.trim();
  console.log(`Model changed to: ${currentModel}`);
  res.json({ model: currentModel });
});

// Delete a tweet
app.delete('/api/tweet/:id', (req, res) => {
  let tweets = loadTweets();
  tweets = tweets.filter(t => t.id !== req.params.id);
  saveTweets(tweets);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`\n  🐦 AI Social Network running at http://localhost:${PORT}\n`);
});
