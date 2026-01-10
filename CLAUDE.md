# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SWH Website - A React single-page application built with Vite.

## Commands

- `npm run dev` - Start development server with hot module replacement
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Architecture

Standard Vite + React structure:
- `src/main.jsx` - Application entry point, renders root component
- `src/App.jsx` - Main application component
- `src/App.css` - Component-specific styles
- `src/index.css` - Global styles
- `src/assets/` - Static assets (images, fonts, etc.)
- `public/` - Public static files (copied as-is to build)
- `index.html` - HTML template
