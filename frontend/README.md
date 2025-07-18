# NasaX

## Introduction

NasaX is a modern React application designed to explore NASA data and imagery. It uses Vite for fast builds and hot module replacement, React with TypeScript for type safety, and Tailwind CSS for utility-first styling. 

The idea is to showcase some NASA API content. 
Areas of focus:
* Web performance 
* User experience
* Fluid design that works well in any screen size or orientation
* Maximizing picture content on screen

### Custom carousel 
Shows sequences of pictures. It allows: 
* Navigation 
* Thumbnails navigation with dragging scroll for desktop and mobile
* Autoplay
* Fullscreen with zoom and pinch

## Design Choices

- **Vite**: Chosen for its lightning-fast development server, instant hot reloads, and modern build tooling. Vite replaces Create React App for a better developer experience and future-proof setup.
- **React + TypeScript**: Ensures robust, type-safe UI development and leverages the React ecosystem.
- **Tailwind CSS**: Enables rapid UI development with utility classes and easy customization. Tailwind is configured for dark mode using the `class` strategy.

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

