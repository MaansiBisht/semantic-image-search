# Semantic Image Search Frontend

A modern, responsive React application built with Next.js 16 that provides an intuitive interface for advanced semantic image search with AI-powered features.

## Features

### 🎯 **Advanced Search Interface**
- **Multi-Modal Search**: Text, image, and hybrid search modes
- **Real-Time Filtering**: Color, orientation, date range, and similarity threshold controls
- **Weighted Scoring**: Interactive sliders for custom score fusion
- **Smart Suggestions**: AI-powered search recommendations

### 🎨 **Modern UI/UX**
- **Responsive Design**: Mobile-first approach with Tailwind CSS v4
- **Dark/Light Theme**: Persistent theme switching with system preference detection
- **Smooth Animations**: Framer Motion for polished interactions
- **Glassmorphism Effects**: Modern visual aesthetics with backdrop blur

### 📱 **User Experience**
- **Favorites System**: Save and manage favorite images with localStorage
- **Search History**: Automatic tracking of recent searches
- **High-Resolution Downloads**: Direct image downloads with proper file naming
- **Progressive Loading**: Lazy loading and skeleton states

### 🔧 **Developer Experience**
- **TypeScript**: Full type safety throughout the application
- **Component Library**: shadcn/ui for consistent, accessible components
- **Modern Icons**: Lucide React for crisp, scalable icons
- **ESLint + Prettier**: Code quality and formatting enforcement

## Technology Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Components**: shadcn/ui
- **State Management**: React Hooks
- **HTTP Client**: Fetch API with custom wrapper

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Backend API running on http://127.0.0.1:8000

### Installation

1. **Install Dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. **Start Development Server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

3. **Open Application**
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```text
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css         # Global styles and theme variables
│   │   ├── layout.tsx          # Root layout with theme provider
│   │   └── page.tsx            # Main search page
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── SearchBar.tsx       # Advanced search interface
│   │   ├── ResultsGrid.tsx     # Image results with favorites
│   │   ├── FiltersPanel.tsx    # Category and stats panel
│   │   └── ThemeToggle.tsx     # Dark/light theme switcher
│   └── lib/                    # Utilities and services
│       ├── api.ts              # Backend API client
│       ├── favorites.ts        # Favorites and history management
│       └── utils.ts            # Helper functions
├── public/                     # Static assets
├── tailwind.config.ts          # Tailwind CSS configuration
├── next.config.js              # Next.js configuration
└── package.json                # Dependencies and scripts
```

## Key Components

### SearchBar
Advanced search interface with multiple modes and filtering options:

```typescript
// Search modes
type SearchMode = 'text' | 'image' | 'hybrid';

// Advanced options
interface SearchOptions {
  mode: SearchMode;
  imageUrl?: string;
  useAdvancedScoring: boolean;
  imageWeight: number;
  textWeight: number;
  metadataWeight: number;
  // ... filters
}
```

### ResultsGrid
Responsive image grid with favorites and download functionality:

- **Masonry Layout**: Pinterest-style responsive grid
- **Image Modal**: Full-screen view with metadata
- **Favorites**: Heart button with localStorage persistence
- **Downloads**: High-resolution image downloads
- **Similarity Scores**: Visual score indicators

### FiltersPanel
Sidebar with categories, statistics, and quick actions:

- **Live Stats**: Real-time Pinecone index statistics
- **Popular Categories**: Unsplash category suggestions
- **Quick Actions**: Predefined search shortcuts

## Advanced Features

### Weighted Scoring Interface
Interactive controls for multi-modal search score fusion:

```typescript
// Real-time weight adjustment
const [weights, setWeights] = useState({
  imageWeight: 0.6,    // Visual similarity
  textWeight: 0.2,     // Semantic text matching
  metadataWeight: 0.2  // Color/attribute matching
});
```

### Theme System
Comprehensive dark/light theme with CSS variables:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### Favorites & History
LocalStorage-based persistence for user preferences:

```typescript
// Favorites management
export const addToFavorites = (result: SearchResult) => {
  const favorites = getFavorites();
  const updated = [result, ...favorites.slice(0, 99)];
  localStorage.setItem('semantic-search-favorites', JSON.stringify(updated));
};

// Recent searches tracking
export const addToRecentSearches = (query: string, resultCount: number) => {
  // Implementation with deduplication and limits
};
```

## Development

### Code Quality
```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Build
npm run build
```

### Environment Variables
Create `.env.local` for local development:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Deployment

### Vercel (Recommended)
The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Docker
```bash
# Build Docker image
docker build -t semantic-search-frontend .

# Run container
docker run -p 3000:3000 semantic-search-frontend
```

### Static Export
```bash
# Generate static files
npm run build
npm run export
```

## Performance Optimizations

### Image Loading
- **Lazy Loading**: Images load as they enter viewport
- **Responsive Images**: Multiple sizes for different screen densities
- **Blur Placeholders**: Smooth loading transitions

### Bundle Optimization
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination
- **Dynamic Imports**: Component-level code splitting

### Caching Strategy
- **API Responses**: Smart caching with SWR patterns
- **Static Assets**: CDN optimization
- **Service Worker**: Offline capability (future enhancement)

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Features**: ES2020, CSS Grid, Flexbox, CSS Custom Properties

## Contributing

1. **Code Style**: Follow ESLint and Prettier configurations
2. **Components**: Use TypeScript interfaces for all props
3. **Styling**: Prefer Tailwind classes over custom CSS
4. **Accessibility**: Ensure WCAG 2.1 AA compliance
5. **Testing**: Add tests for new components and features

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Tailwind CSS](https://tailwindcss.com/docs) - utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - animation library
- [shadcn/ui](https://ui.shadcn.com/) - component library
- [TypeScript](https://www.typescriptlang.org/docs/) - typed JavaScript
