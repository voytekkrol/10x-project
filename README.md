# 10x-project

AI-powered flashcard creation for efficient learning

## Project Description

10x-project is a web application that enables users to quickly create and manage educational flashcard sets. The app leverages Large Language Model (LLM) APIs to automatically generate high-quality flashcards from provided text, significantly reducing the time and effort required for manual flashcard creation.

The application addresses the challenge of time-consuming manual flashcard creation that discourages users from adopting effective spaced repetition learning methods. With 10x-project, users can paste text (such as textbook excerpts) and instantly receive AI-generated flashcard suggestions, while still maintaining full control over manual creation and editing.

## Tech Stack

### Frontend
- **Astro 5** - Fast, efficient web framework with minimal JavaScript
- **React 19** - Interactive components where needed
- **TypeScript 5** - Static typing and enhanced IDE support
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/ui** - Accessible React component library

### Backend
- **Supabase** - Backend-as-a-Service providing:
  - PostgreSQL database
  - User authentication
  - SDK for multiple languages

### AI Integration
- **Openrouter.ai** - Access to multiple LLM providers (OpenAI, Anthropic, Google, etc.) with cost controls and API key limits

### Testing
- **Unit Testing**: 
  - **Vitest** - Fast testing framework compatible with Jest API
  - **React Testing Library** - Component testing with user-centric approach
  - **MSW** - Mock Service Worker for API mocking
- **E2E Testing**: 
  - **Playwright** - End-to-end testing across multiple browsers (Chrome, Firefox, Safari)
  - **Axe-core** - Accessibility testing
  - **Lighthouse CI** - Performance auditing

### CI/CD & Hosting
- **GitHub Actions** - CI/CD pipelines
- **DigitalOcean** - Application hosting with Docker

## Getting Started Locally

### Prerequisites
- Node.js version 22.14.0 (managed with nvm - see `.nvmrc`)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 10x-cards
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the project root with the following variables:
   ```env
   # Supabase configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key

   # Openrouter.ai API key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run astro` | Access Astro CLI commands |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Run ESLint and automatically fix issues |
| `npm run format` | Format code using Prettier |

## Project Scope

### MVP Features
- **AI Flashcard Generation**: Paste text (1000-10000 characters) to generate flashcard suggestions via LLM API
- **Manual Flashcard Management**: Create, edit, and delete flashcards manually
- **User Authentication**: Registration, login, and account management with GDPR compliance
- **Basic Spaced Repetition**: Integration with existing spaced repetition algorithm
- **Statistics Tracking**: Monitor AI generation success rates and user engagement

## Project Status

**Current Phase**: MVP Development

The project is currently in active development with all core requirements defined and user stories documented. Key development milestones include:

- ✅ Project setup with Astro, React, and TypeScript
- ✅ Basic UI components with Tailwind and Shadcn/ui
- 🔄 User authentication system
- 🔄 AI flashcard generation integration
- 🔄 Spaced repetition learning sessions
- 🔄 Manual flashcard management

### Success Metrics
- Target: 75% of AI-generated flashcards accepted by users
- Goal: 75% of new flashcards created using AI assistance

## License

Not specified. Consider adding a LICENSE file (MIT recommended for open-source projects).
