# SpaceVista

## Introduction

SpaceVista is a modern React application designed to explore NASA data and imagery. The project is built with a focus on performance, maintainability, and a great developer experience. It uses Vite for fast builds and hot module replacement, React with TypeScript for type safety, and Tailwind CSS for utility-first styling. The app is dark-themed by default, but is ready for light mode and future theming via CSS variables.

## Design Choices

- **Vite**: Chosen for its lightning-fast development server, instant hot reloads, and modern build tooling. Vite replaces Create React App for a better developer experience and future-proof setup.
- **React + TypeScript**: Ensures robust, type-safe UI development and leverages the React ecosystem.
- **Tailwind CSS**: Enables rapid UI development with utility classes and easy customization. Tailwind is configured for dark mode using the `class` strategy.
- **Dark Mode by Default**: The app starts in dark mode, but is ready for light mode and future themes using CSS variables for colors. This makes it easy to expand or customize the theme.
- **CSS Variables for Theming**: All main colors are defined as CSS variables, making it simple to switch themes or add new ones in the future.

## Getting Started

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app in your browser.

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

---

If you want to switch to light mode, remove the `dark` class from the `<body>` tag in `index.html`. The app is ready for future theme toggling and expansion.
