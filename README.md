# Decentraland Landing Site

[![Coverage Status](https://coveralls.io/repos/github/decentraland/landing-site/badge.svg?branch=main)](https://coveralls.io/github/decentraland/landing-site?branch=main)

A modern Vite-based Decentraland landing page serving a dynamic, API-driven homepage with sections for hero content, missions/features, trending news, social proof, FAQ, and banner CTAs — all content managed via a backend landing API.

## Table of Contents

- [Features](#features)
- [Dependencies & Related Services](#dependencies--related-services)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [AI Agent Context](#ai-agent-context)

## Features

- **Hero Section**: Primary CTA section with platform intro, loaded first for fast perceived performance
- **Missions**: Platform feature highlights with CTAs for new users
- **Banner CTAs**: "Create your Avatar" and "Start Exploring" banners driving onboarding
- **Trending News / What's Hot**: Live feed of popular platform content
- **Social Proof**: Statistics and testimonials from the platform
- **FAQ**: Frequently asked questions, server-driven
- **Text Marquee**: Animated scrolling highlights
- **Sign-In Redirect**: Handles authentication redirects for users coming from the landing page
- **New User Flow**: Detects `?newUser=` query param to hide navbar for onboarding-optimized views

## Dependencies & Related Services

- **Landing Content API**: backend service providing all section content (hero, missions, banners, trending, FAQ) via RTK Query
- **Auth UI** (decentraland.org/auth): sign-in flow for onboarding CTAs

### What This UI Does NOT Handle

- User authentication (auth site)
- Event listings (events site)
- Blog content (blog-site)
- Governance (governance-ui)
- Profile management (profile site)
- Place discovery (places)

## Getting Started

### Prerequisites

- Node 20+
- npm

### Installation

```bash
npm install
```

### Configuration

Create a copy of `.env.example` and name it `.env.development`:

```bash
cp .env.example .env.development
```

### Running the UI

```bash
npm run start
```

## Testing

### Running Tests

```bash
npm test
```

### Test Structure

Test files are located in `src/tests/`, using the `*.test.ts` naming convention.

## AI Agent Context

For detailed AI Agent context, see [docs/ai-agent-context.md](docs/ai-agent-context.md).

---
