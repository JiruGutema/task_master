# Task Management System

## Overview

This is a full-stack task management application built with a React frontend and Express backend. The system allows users to create, organize, and manage tasks with categories, priorities, and due dates. The application uses PostgreSQL for data persistence and features a modern UI built with shadcn/ui components.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Wouter for client-side routing

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod schemas shared between client and server
- **Development**: tsx for TypeScript execution in development

### Database Schema
The application uses two main entities:
- **Categories**: For organizing tasks with name and color properties
- **Tasks**: Main entities with title, description, category reference, completion status, priority levels, and due dates
- **Users**: Basic user management (schema defined but not fully implemented)

## Key Components

### Frontend Components
- **CategoryModal**: Form for creating and editing task categories
- **TaskModal**: Form for creating and editing tasks with full CRUD operations
- **DeleteConfirmationModal**: Safety dialog for deletion operations
- **Home Page**: Main dashboard displaying tasks and categories with search and filtering

### Backend Components
- **Storage Layer**: Abstract interface with in-memory implementation for development
- **Routes**: RESTful API endpoints for categories and tasks
- **Schema**: Shared Drizzle schema with Zod validation

### UI Framework Integration
- Comprehensive shadcn/ui component library implementation
- Custom Tailwind configuration with design system variables
- Responsive design with mobile-first approach

## Data Flow

1. **Client Requests**: React components use TanStack Query for data fetching
2. **API Layer**: Express routes handle HTTP requests with Zod validation
3. **Storage Layer**: Abstract storage interface allows for flexible data persistence
4. **Database**: Drizzle ORM manages PostgreSQL interactions with type safety
5. **Response Handling**: Server responses are cached and managed by React Query

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@hookform/resolvers**: Form validation integration
- **wouter**: Lightweight React router

### UI Dependencies
- **@radix-ui/***: Comprehensive UI primitive components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with PostgreSQL 16
- **Development Server**: tsx for TypeScript execution
- **Hot Reload**: Vite dev server with HMR support
- **Database**: Drizzle Kit for schema management and migrations

### Production Build
- **Frontend Build**: Vite builds React app to static assets
- **Backend Build**: esbuild bundles server code for production
- **Deployment Target**: Autoscale deployment on Replit
- **Asset Serving**: Express serves static files in production

### Configuration
- **Environment Variables**: DATABASE_URL for PostgreSQL connection
- **Build Commands**: Separate build processes for client and server
- **Start Command**: Production server serves both API and static assets

## Changelog

Changelog:
- June 26, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.