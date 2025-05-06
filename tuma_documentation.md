# Tuma - Location-Aware Service Search Engine Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Application Overview](#application-overview)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Authentication System](#authentication-system)
7. [Key Features](#key-features)
8. [API Endpoints](#api-endpoints)
9. [Frontend Components](#frontend-components)
10. [Development Guidelines](#development-guidelines)
11. [Common Operations](#common-operations)
12. [Troubleshooting](#troubleshooting)

## Introduction

Tuma is a location-aware service search platform designed specifically for Liberia. It enables users to discover and connect with local services through an intuitive and dynamic interface. The platform allows service providers to register, manage their profiles, and make their services discoverable by users based on location, service type, and other criteria.

The application serves two primary user groups:
- **Service Providers**: Businesses and individuals who offer services across Liberia
- **End Users**: Consumers looking to find and engage with services in their area

The platform also includes an admin interface for platform management, analytics, and oversight.

## Application Overview

### Purpose

Tuma addresses the challenge of discovering local services in Liberia by providing a centralized, searchable platform where service providers can list their businesses and users can find services near them. The application focuses on providing rich information about each service, including location data, contact information, operating hours, and service descriptions.

### Core Functionality

- **Service Registration**: Service providers can register and create detailed profiles
- **Location-Based Search**: Users can search for services based on geographic location
- **Advanced Filtering**: Services can be filtered by category, location, availability
- **Service Management**: Providers can update their service information, add images, and toggle availability
- **Analytics**: Both service providers and admins have access to analytics dashboards
- **Admin Controls**: Platform administrators can manage the platform, view statistics, and make announcements

## Technology Stack

### Frontend
- **Framework**: React with TypeScript
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **UI Components**: Custom components built on Shadcn UI
- **Styling**: Tailwind CSS with custom theme
- **Form Handling**: React Hook Form with Zod validation

### Backend
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Custom session-based authentication
- **File Uploads**: Express-fileupload
- **API Structure**: RESTful API design

### Development Tools
- **Build Tool**: Vite
- **Package Manager**: npm
- **Database Migrations**: Drizzle Kit
- **Type Checking**: TypeScript

## Project Structure

The project follows a standard fullstack application structure, with clear separation between client and server code.

```
/
├── attached_assets/                # Assets attached during development
├── client/                         # Frontend application code
│   ├── src/                        # Source code
│   │   ├── components/             # Reusable UI components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utility functions
│   │   ├── pages/                  # Application pages
│   │   ├── App.tsx                 # Main application component
│   │   ├── index.css               # Global styles
│   │   └── main.tsx                # Entry point
│   └── index.html                  # HTML template
├── db/                             # Database configuration and migrations
│   ├── migrations/                 # Database migration files
│   ├── index.ts                    # Database connection setup
│   ├── seed.ts                     # Database seeding logic
│   └── create-admin.ts             # Admin account creation utility
├── public/                         # Static assets
├── server/                         # Backend server code
│   ├── index.ts                    # Server entry point
│   ├── routes.ts                   # API route definitions
│   ├── auth.ts                     # Authentication logic
│   ├── storage.ts                  # Database interaction logic
│   ├── uploads.ts                  # File upload handling
│   ├── admin-routes.ts             # Admin-specific routes
│   └── vite.ts                     # Vite integration for development
├── shared/                         # Shared code between client and server
│   └── schema.ts                   # Database schema and type definitions
├── components.json                 # Shadcn UI component configuration
├── drizzle.config.ts               # Drizzle ORM configuration
├── package.json                    # Project dependencies and scripts
├── postcss.config.js               # PostCSS configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
└── vite.config.ts                  # Vite build configuration
```

## Database Schema

The database schema is defined in `shared/schema.ts` using Drizzle ORM. It includes the following main tables:

### Main Tables

1. **creators**
   - Stores information about service providers
   - Contains authentication credentials, contact information

2. **services**
   - Stores detailed information about each service
   - Linked to creators with a foreign key relationship
   - Contains location data, service type, availability, etc.

3. **analyticsEvents**
   - Tracks user interactions with services
   - Used for generating analytics insights

4. **serviceStats**
   - Aggregated statistics for services
   - Tracks views, interactions, etc.

5. **admins**
   - Admin user accounts
   - Contains admin credentials and permissions

6. **announcements**
   - Platform announcements created by admins
   - Displayed to service providers

7. **adminLogs**
   - Audit trail of admin actions
   - Used for tracking administrative activities

### Relationships

The schema establishes relationships between tables using Drizzle's relations API:

- Each creator can have one service (one-to-one)
- Each service belongs to one creator (one-to-one)
- Each service can have multiple analytics events (one-to-many)
- Each admin can create multiple announcements (one-to-many)

## Authentication System

Tuma uses a custom session-based authentication system that supports both service providers and admin users.

### Authentication Flow

1. **Registration** (Service Providers only):
   - User provides phone number, password, and service details
   - Password is hashed using bcrypt
   - Creator and service records are created in the database

2. **Login** (Both Service Providers and Admins):
   - User provides phone number and password/PIN
   - System first checks if it's an admin login attempt
   - If not an admin, it checks for a creator account
   - Upon successful authentication, the user ID is stored in the session
   - Session includes flags for admin status

3. **Authorization**:
   - Protected routes check for the presence of a valid session
   - Admin-only routes verify admin status in the session
   - Frontend uses the auth status to control navigation

### Security Features

- Passwords are hashed using bcrypt for service providers
- Admin PINs are hashed using SHA-256
- Sessions are stored server-side
- CSRF protection through session tokens
- Input validation using Zod schemas

## Key Features

### Service Provider Features

1. **Service Registration**
   - Service providers can register with a phone number and password
   - Registration includes basic service information like name, type, and location

2. **Service Management**
   - Providers can update their service details
   - Upload up to 3 images for their service
   - Set service description, operating hours, and pricing
   - Toggle service availability

3. **Analytics Dashboard**
   - View service performance metrics
   - Track views, interactions, and trends
   - See geographical distribution of viewers

### User Features

1. **Service Discovery**
   - Search for services by keyword
   - Browse services by category
   - Filter services by location

2. **Advanced Search**
   - Fuzzy matching for typo-tolerant searches
   - Location-based priority in results
   - Smart handling of location name variations (e.g., "Tubman Burg" vs "Tubmanburg")

3. **Service Details**
   - View comprehensive service information
   - See service images
   - Access contact information
   - View operating hours and pricing

### Admin Features

1. **Dashboard**
   - View platform-wide statistics
   - Monitor service provider growth
   - Track daily activity metrics

2. **Platform Management**
   - Manage service providers
   - Issue announcements
   - Monitor system activity

3. **Analytics**
   - View detailed platform analytics
   - See geographical distribution of services
   - Track service category trends

## API Endpoints

### Authentication Endpoints

- `POST /api/auth/login` - Authenticate a user (service provider or admin)
- `POST /api/auth/logout` - Log out a user
- `GET /api/auth/status` - Check authentication status

### Service Provider Endpoints

- `POST /api/creators` - Register a new service provider
- `GET /api/creator/profile` - Get the logged-in creator's profile
- `PUT /api/creator/profile` - Update creator profile
- `POST /api/creators/profile-image` - Upload a profile image

### Service Endpoints

- `GET /api/services` - Get all services (with filtering options)
- `GET /api/services/me` - Get the current user's service
- `PUT /api/services/:id` - Update a service
- `DELETE /api/services/:id` - Delete a service
- `POST /api/services/:id/images` - Upload service images
- `PUT /api/services/:id/description` - Update service description
- `PATCH /api/services/:id/details` - Update service details
- `POST /api/services/:id/toggle-availability` - Toggle service availability

### Search Endpoints

- `GET /api/search` - Search for services
- `GET /api/services/location` - Get services by location

### Analytics Endpoints

- `GET /api/analytics` - Get analytics for the user's service

### Admin Endpoints

- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/creators` - Get all creators
- `POST /api/admin/announcements` - Create a new announcement
- `GET /api/admin/announcements` - Get all announcements
- `PUT /api/admin/announcements/:id` - Update an announcement
- `DELETE /api/admin/announcements/:id` - Delete an announcement
- `GET /api/admin/logs` - Get admin activity logs
- `POST /api/admin/warn/:creatorId` - Issue a warning to a creator

## Frontend Components

### Pages

1. **Home.tsx**
   - Landing page with service categories and search
   - Featured locations display
   - Quick access to popular services

2. **SearchResults.tsx**
   - Displays search results with filtering options
   - Service cards with preview information
   - Pagination for results

3. **CreatorSignup.tsx**
   - Registration form for new service providers
   - Validation and error handling
   - Service information collection

4. **Login.tsx** (formerly CreatorLogin.tsx)
   - Unified login page for both service providers and admins
   - Form with phone number and password/PIN fields
   - Redirects based on user role

5. **CreatorPortal.tsx**
   - Service management dashboard for providers
   - Service information editing
   - Image upload interface

6. **CreatorDashboard.tsx**
   - Analytics and insights for service providers
   - Performance metrics visualization
   - Service viewer demographics

7. **CreatorProfile.tsx**
   - Public view of a service provider's profile
   - Detailed service information
   - Contact options

8. **AdminDashboard.tsx**
   - Platform management interface for admins
   - System statistics and metrics
   - Creator management tools

### Reusable Components

1. **Header.tsx**
   - Navigation header with search bar
   - Authentication status display
   - Application branding

2. **Footer.tsx**
   - Site navigation links
   - About information
   - Contact details

3. **SearchBar.tsx**
   - Search input with suggestions
   - Category selector
   - Search submission handling

4. **ServiceCard.tsx**
   - Service preview card component
   - Image display
   - Basic service information

5. **ImageUploader.tsx**
   - Drag-and-drop image upload
   - Image preview
   - Multiple file handling

6. **DescriptionEditor.tsx**
   - Rich text editor for service descriptions
   - Character counting
   - Save functionality

### Custom Hooks

1. **use-mobile.tsx**
   - Responsive design utility
   - Screen size detection
   - Mobile-specific behavior

2. **use-toast.ts**
   - Toast notification system
   - Success/error messaging
   - Notification queue management

3. **queryClient.ts**
   - API request utilities
   - Query caching setup
   - Error handling functions

## Development Guidelines

### Adding New Features

When adding new features to Tuma, follow these guidelines to maintain code quality and consistency:

1. **Database Changes**:
   - Add new schemas to `shared/schema.ts`
   - Create proper relations with existing tables
   - Run database migrations after schema changes
   - Update seed data if necessary

2. **Backend API Endpoints**:
   - Add new routes to `server/routes.ts` or `server/admin-routes.ts`
   - Group related endpoints together
   - Use middleware for authentication when needed
   - Validate inputs using Zod schemas
   - Follow REST principles for endpoint design

3. **Frontend Components**:
   - Create new page components in `client/src/pages/`
   - Add reusable components to `client/src/components/`
   - Register routes in `client/src/App.tsx`
   - Use existing design patterns and UI components
   - Maintain responsive design for all screens

4. **Authentication**:
   - Protect sensitive routes with proper authentication checks
   - Use the existing auth system for new user types
   - Follow the established session management pattern

### Modifying Existing Features

When modifying existing features, follow these guidelines:

1. **Database Modifications**:
   - Avoid destructive changes to existing tables
   - Add new columns rather than modifying existing ones
   - Update all affected queries after schema changes
   - Test with existing data to ensure compatibility

2. **API Changes**:
   - Maintain backward compatibility when possible
   - Version significant API changes
   - Update frontend code that depends on modified endpoints
   - Document changes thoroughly

3. **UI/UX Changes**:
   - Maintain consistent design language
   - Use existing color schemes and component styles
   - Test responsive behavior across device sizes
   - Ensure accessibility is preserved

### Code Quality Standards

1. **TypeScript**:
   - Use strong typing for all variables and functions
   - Avoid `any` type when possible
   - Create interfaces for complex data structures
   - Use TypeScript features for type safety

2. **React Components**:
   - Use functional components with hooks
   - Keep components focused on single responsibilities
   - Extract reusable logic to custom hooks
   - Use React Query for data fetching

3. **API Handling**:
   - Use existing query utilities for API requests
   - Handle loading and error states properly
   - Implement proper cache invalidation
   - Add proper error handling

4. **CSS/Styling**:
   - Use Tailwind utility classes for styling
   - Follow the established color scheme
   - Maintain responsiveness across breakpoints
   - Use existing component variants when possible

## Common Operations

### Adding a New Service Type

1. Update the service type options in `shared/schema.ts`
2. Add related frontend display assets (icons, colors)
3. Update filter options in applicable components
4. Ensure search functionality handles the new service type

### Implementing a New Analytics Metric

1. Add new tracking in appropriate API endpoints
2. Update the analytics event schema if needed
3. Create aggregation logic in the storage service
4. Add visualization components to dashboards

### Adding Admin Capabilities

1. Create new admin-specific endpoints in `server/admin-routes.ts`
2. Add authorization checks for admin-only features
3. Update admin dashboard UI with new functionality
4. Add audit logging for new admin actions

### Modifying the Search Algorithm

1. Update the search functionality in `server/storage.ts`
2. Adjust query normalization in search routes
3. Test with various search terms and edge cases
4. Update frontend search components as needed

## Troubleshooting

### Common Issues

1. **Authentication Problems**:
   - Check session configuration
   - Verify password hashing is working correctly
   - Ensure routes have proper authentication middleware

2. **Database Errors**:
   - Check for schema mismatches
   - Verify foreign key constraints
   - Ensure proper error handling in database queries

3. **Image Upload Issues**:
   - Check upload directory permissions
   - Verify file size limits
   - Check MIME type validation

4. **API Response Errors**:
   - Verify request format and payload
   - Check error handling in API routes
   - Confirm proper response status codes

### Debugging Tools

1. **Server Logs**:
   - Check console output for errors
   - Look for specific error messages
   - Trace request flow through middleware

2. **Database Inspection**:
   - Use pg-admin or other tools to inspect data
   - Verify table structures match schema
   - Check for orphaned or invalid records

3. **Frontend Debugging**:
   - Use React DevTools for component inspection
   - Check browser console for errors
   - Use network tab to inspect API requests

### Performance Optimization

1. **Database Queries**:
   - Add indexes for frequently queried fields
   - Optimize complex joins
   - Use pagination for large result sets

2. **API Response Time**:
   - Implement caching for frequent requests
   - Optimize heavyweight operations
   - Use proper database indexing

3. **Frontend Performance**:
   - Optimize component rendering
   - Implement virtualization for long lists
   - Use code splitting for large bundles

---

This documentation provides a comprehensive overview of the Tuma application architecture, features, and development guidelines. By following these guidelines, you can maintain a high-quality codebase while adding new features or modifying existing functionality.