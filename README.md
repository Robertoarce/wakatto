# AI Diary 📔🤖

An AI-powered personal diary application with intelligent conversation management, entity extraction, and knowledge graph visualization.

## 🌐 Live Demo

🚀 **Coming Soon:** [GitHub Pages Deployment]

## ✨ Features

- 🔐 **Secure Authentication** - Powered by Supabase
- 💬 **AI Chat Interface** - Multi-provider support (OpenAI, Anthropic, Gemini)
- 📝 **Conversation Management** - Create, rename, search, and organize
- 🎯 **Entity Extraction** - Automatically identify people, places, and organizations
- 🔍 **Smart Search** - Find conversations instantly
- 📊 **Characters Screen** - Visualize extracted entities and relationships
- 🎨 **Modern UI** - Dark theme with responsive design
- 📱 **Cross-Platform** - iOS, Android, and Web

## Tech Stack

### Frontend
- [Expo](https://expo.io/) & [React Native](https://facebook.github.io/react-native/)
- [TypeScript](https://www.typescriptlang.org/)
- [Redux](https://redux.js.org/) + Redux Thunk
- [React Navigation](https://reactnavigation.org/)

### Backend & Services
- [Supabase](https://supabase.com/) - Authentication & PostgreSQL Database
- Multi-AI Provider Support:
  - [OpenAI](https://openai.com/) (GPT-4, GPT-3.5)
  - [Anthropic](https://anthropic.com/) (Claude 3)
  - [Google Gemini](https://deepmind.google/technologies/gemini/)

### Development Tools
- [Storybook](https://storybook.js.org/)
- [ESLint](https://eslint.org/)
- [Jest](https://jestjs.io/)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- Supabase account (free tier works)
- AI provider API key (OpenAI, Anthropic, or Gemini)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `docs/supabase_schema.sql`
3. Update `src/lib/supabase.ts` with your credentials:
   ```typescript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

### 4. Run the App

```bash
# Web
npm run web

# iOS (requires Mac + Xcode)
npm run ios

# Android (requires Android Studio)
npm run android

# All platforms
npm start
```

### 5. Configure AI Provider

1. Open the app and navigate to **Settings** tab
2. Select your AI provider (OpenAI, Anthropic, or Gemini)
3. Enter your API key
4. Optionally specify model (e.g., `gemini-2.0-flash-exp`)
5. Click **"Test AI Connection"** to verify
6. Start chatting! 🎉

---

## 📦 Deployment

### ⚡ Quick Deploy to GitHub Pages

**Automatic Deployment (Recommended):**
```bash
# 1. Update package.json with your GitHub username/repo
# 2. Push to GitHub
git push origin main

# 3. Enable GitHub Pages in Settings → Pages → gh-pages branch
# Done! GitHub Actions will auto-deploy on every push 🚀
```

**Manual Deployment:**
```bash
npm install --save-dev gh-pages
npm run deploy
```

Your app will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`

📖 **Complete Setup Guide:** See [`GITHUB_PAGES_SETUP.md`](GITHUB_PAGES_SETUP.md)  
📖 **Detailed Deployment Info:** See [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md)

---

## 📚 Documentation

- [App Assessment](docs/APP_ASSESSMENT.md) - Feature overview and architecture
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [PRD: Knowledge Graph](docs/PRD_KNOWLEDGE_GRAPH.md) - Knowledge graph feature specs
- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md) - Development history

---

## 🔒 Security

- **API Keys:** Stored locally in browser only (never sent to our servers)
- **Authentication:** Secure Supabase auth with Row Level Security (RLS)
- **Data:** All conversations/messages protected by RLS policies
- **Production:** Consider using Edge Functions for API calls (see Deployment Guide)

---

## 🛠️ Development

### Scripts

```bash
npm run start         # Start Expo dev server
npm run web          # Run web version
npm run ios          # Run on iOS
npm run android      # Run on Android
npm run web:build    # Build for web
npm run deploy       # Deploy to GitHub Pages
npm run lint         # Run ESLint
npm run test         # Run tests
npm run type-check   # TypeScript type checking
```

### Project Structure

```
src/
├── components/      # Reusable UI components
├── navigation/      # React Navigation setup
├── screens/         # Screen components
├── services/        # API services (AI, Supabase, entity extraction)
├── store/          # Redux store, actions, reducers
├── lib/            # Supabase client
└── assets/         # Images, fonts

docs/               # Documentation
```

---

## 🎯 Roadmap

- [x] Authentication & user management
- [x] AI chat interface with multi-provider support
- [x] Conversation CRUD operations
- [x] Entity extraction from diary entries
- [x] Characters screen visualization
- [x] Search functionality
- [x] Message editing/deletion
- [x] AI connection testing
- [ ] Knowledge graph visualization
- [ ] Export conversations
- [ ] Dark/light theme toggle
- [ ] Mobile app deployment (iOS/Android)
- [ ] Offline support
- [ ] Voice input

---

## 📄 License

MIT

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

## 👨‍💻 Author

Built with ❤️ using Expo + TypeScript

---

## 🙏 Acknowledgments

- Based on [expo-typescript-starter](https://github.com/Naturalclar/expo-typescript-starter)
- Powered by Supabase and AI providers
