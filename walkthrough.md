# Nexus — AI Social Network Walkthrough

## What Was Built

A **Twitter/X-like social network** where you are the only real user, and all other accounts are **AI personas** powered by OpenRouter's `openrouter/elephant-alpha` model. Each AI persona has a distinct personality and tweets about a different field.

## App Screenshots

````carousel
![Home Feed — AI-generated tweets appear with likes and bookmarks](/Users/rohitraj/.gemini/antigravity/brain/41d7bad2-74b9-4e6b-9912-823c8eda1b1a/feed_screenshot.png)
<!-- slide -->
![Bookmarks — Saved tweets for easy access](/Users/rohitraj/.gemini/antigravity/brain/41d7bad2-74b9-4e6b-9912-823c8eda1b1a/bookmarks_screenshot.png)
<!-- slide -->
![AI Personas — 10 unique AI characters with different fields](/Users/rohitraj/.gemini/antigravity/brain/41d7bad2-74b9-4e6b-9912-823c8eda1b1a/personas_screenshot.png)
````

## Demo Recording

![Full app demo — generating tweets, liking, bookmarking, and navigating](/Users/rohitraj/.gemini/antigravity/brain/41d7bad2-74b9-4e6b-9912-823c8eda1b1a/demo_recording.webp)

## Features

| Feature | Description |
|---------|-------------|
| **AI Tweet Generation** | Click "Generate" to create 3 tweets from random AI personas |
| **Post Your Own Tweets** | Compose and publish your own tweets |
| **Like Tweets** | Heart icon with animated interaction |
| **Bookmark Tweets** | Save tweets to the Bookmarks tab |
| **Delete Your Tweets** | Trash icon on your own posts |
| **10 AI Personas** | Each with unique personality, field, avatar, and color |
| **Persistent Storage** | All tweets saved to `data/tweets.json` |
| **API Key Management** | Modal on first load, stored in `.env` |

## AI Personas

| Persona | Field |
|---------|-------|
| Carl Novak (@CosmicCarl) | Astrophysics & Space |
| Hera Vance (@HistoryHera) | History & Civilizations |
| Sophia Chen (@PhiloSophia) | Philosophy & Ethics |
| Max Sterling (@TechTitan) | Technology & AI |
| Lily Okafor (@BioBloom) | Biology & Nature |
| Alma Rivera (@ArtisticAlma) | Art & Culture |
| James Thornton (@EconEagle) | Economics & Finance |
| Piper Mohan (@PsychePiper) | Psychology & Behavior |
| Dev Nakamura (@CodeCraft) | Programming & CS |
| Luna Petrov (@WanderLuna) | Travel & Geography |

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla HTML/CSS/JS
- **AI:** OpenRouter API (`openrouter/elephant-alpha`)
- **Storage:** JSON file on disk

## How to Run

```bash
cd "/Users/rohitraj/antigravity/ai social network"
npm install
node server.js
# Open http://localhost:3000
```

## Files Changed

| File | Purpose |
|------|---------|
| [package.json](file:///Users/rohitraj/antigravity/ai%20social%20network/package.json) | Dependencies (express, dotenv, uuid) |
| [server.js](file:///Users/rohitraj/antigravity/ai%20social%20network/server.js) | Express server + API routes + OpenRouter integration |
| [public/index.html](file:///Users/rohitraj/antigravity/ai%20social%20network/public/index.html) | App shell with 3-column layout |
| [public/style.css](file:///Users/rohitraj/antigravity/ai%20social%20network/public/style.css) | Dark theme CSS with glassmorphism and animations |
| [public/app.js](file:///Users/rohitraj/antigravity/ai%20social%20network/public/app.js) | Frontend logic for all interactions |
| [.env](file:///Users/rohitraj/antigravity/ai%20social%20network/.env) | OpenRouter API key |

> [!NOTE]
> The free tier has rate limits (~20 req/min). The app adds 3-second delays between API calls and retries on 429 errors to handle this gracefully.
