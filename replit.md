# Overview

This is a **Freemium Chord Riff Generator** web application that helps musicians practice and create musical chord progressions. The app features a 12x11 grid representing 12 musical keys and 11 chord types, with a color-coding system to distinguish major and minor contexts. Users can generate single chords or 4-chord progressions using virtual dice rolls. The app includes a comprehensive freemium business model with usage limits, ad-supported extra tokens, subscription upgrades, and a referral program for user acquisition.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React SPA**: Built with Vite for fast development and modern build tooling
- **Component Library**: Uses shadcn/ui components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom CSS variables for musical key color-coding
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First**: Touch-optimized interface designed for iPhone usage

## Backend Architecture
- **Express.js Server**: RESTful API with middleware for request logging and error handling
- **Development Setup**: Vite integration for HMR and development tooling
- **Storage Layer**: Abstracted storage interface (currently using in-memory storage)
- **Session Management**: PostgreSQL session store integration ready

## Data Storage Solutions
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Design**: Users and chord progressions tables with JSON storage for chord arrays
- **Migration System**: Drizzle Kit for database schema management
- **Connection**: Neon Database serverless PostgreSQL integration

## Key Features

### Core Musical Features
- **Dice Rolling System**: Two 8-sided dice for generating random chord progressions
- **Musical Theory Integration**: Color-coded key groups and numbered exotic chord types
- **Chord Chart Visualization**: Interactive 12x11 grid showing all key/chord combinations
- **Pentatonic Scale Guide**: Visual aid for improvisation practice
- **Progressive Enhancement**: Works as single chord generator or full riff creator

### Freemium Business Model
- **Authentication Gate**: Required sign-up before any app usage using Replit Auth
- **Usage Tracking**: 5 free riff generations per user with atomic counter system
- **Ad-Supported Model**: Watch short ads to earn additional roll tokens (daily limit system)
- **Premium Subscription**: $4.99/month for unlimited generations and premium features
- **Stripe Integration**: Secure payment processing for subscription upgrades

### Referral Program
- **Code Generation**: Unique referral codes for each user with collision-resistant generation
- **Reward System**: 1-month free Premium subscription when referred users upgrade
- **Comprehensive Dashboard**: Stats tracking, recent referrals, sharing tools
- **Signup Integration**: Referral code input during authentication with URL parameter support
- **Atomic Processing**: Race-condition-free reward claiming with database transactions

## External Dependencies

- **Database**: Neon Database (PostgreSQL) for persistent storage
- **UI Framework**: Radix UI for accessible component primitives
- **Development Tools**: 
  - Replit-specific plugins for development environment
  - TypeScript for type safety
  - ESLint/Prettier for code quality
- **Fonts**: Google Fonts integration (Inter, Architects Daughter, DM Sans, Fira Code)