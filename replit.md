# ODeals - Local Business Deals Platform

## Overview
ODeals is a mobile-first web application that connects local businesses with consumers through an innovative deals and rewards platform. The application features dual interfaces for consumers and partner businesses, enabling discovery, engagement, and rewards through a comprehensive visit and review system.

## Technology Stack
- **Frontend**: React with TypeScript, Wouter routing, TanStack Query, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with TypeScript, PostgreSQL database, Drizzle ORM
- **Authentication**: OTP-based secure authentication for both consumers and partners
- **Deployment**: Replit platform with auto-deployment capabilities

## Project Architecture

### Database Design
- **Users**: Consumer and partner authentication with OTP verification
- **Stores**: Partner business information and profiles
- **Deals**: Business offers with categories, descriptions, and validity periods
- **Visits**: Consumer visit scheduling and completion tracking
- **Reviews**: Star ratings and comments for completed visits
- **Rewards**: Point-based system for user engagement

### Key Features Implemented

#### Consumer Interface
- **Authentication**: OTP-based login/registration system
- **Deal Discovery**: Browse deals by category (Food, Shopping, Services, Entertainment)
- **Store Exploration**: View store details and available deals
- **Visit Scheduling**: Schedule visits to stores for specific deals
- **Visit Completion**: Mark visits as completed to earn 100 reward points
- **Review System**: Submit star ratings (1-5) and comments for completed visits (earn 100 points)
- **Rewards Tracking**: View accumulated points and transaction history

#### Partner Interface
- **Business Dashboard**: Analytics and performance metrics
- **Deal Management**: Create, edit, and manage business deals
- **Visit Tracking**: Monitor scheduled and completed visits
- **Analytics**: View store performance, deal popularity, and customer engagement

### Recent Changes (Latest Session)
- **Database Migration**: Switched from memory storage to persistent PostgreSQL database
- **Visit & Review System**: Complete implementation of visit completion and review functionality
- **Reward Points Integration**: Added point system (100 for visits + 100 for reviews)
- **Category Mapping**: Fixed Food category to properly display cafe and restaurant deals
- **Code Cleanup**: Resolved TypeScript warnings and improved error handling
- **Navigation Enhancement**: Added Visits tab to consumer navigation

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP for login/registration
- `POST /api/auth/verify-otp` - Verify OTP and authenticate
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/logout` - Logout user

### Consumer Endpoints
- `GET /api/consumer/deals` - Get deals with category filtering
- `GET /api/consumer/stores` - Get all stores
- `GET /api/consumer/stores/:id` - Get store details
- `POST /api/consumer/visits` - Schedule a visit
- `GET /api/consumer/visits` - Get user's visits
- `POST /api/consumer/visits/:id/complete` - Mark visit as completed
- `POST /api/consumer/reviews` - Submit a review
- `GET /api/consumer/rewards` - Get user's reward points and history

### Partner Endpoints
- `GET /api/partner/deals` - Get partner's deals
- `POST /api/partner/deals` - Create new deal
- `PUT /api/partner/deals/:id` - Update deal
- `DELETE /api/partner/deals/:id` - Delete deal
- `GET /api/partner/visits` - Get scheduled visits
- `GET /api/partner/analytics` - Get performance analytics

## User Engagement Flow
1. **Discovery**: Users browse deals by category or explore stores
2. **Scheduling**: Users schedule visits to participate in deals
3. **Completion**: Users mark visits as completed to earn 100 points
4. **Review**: Users rate and review completed visits to earn additional 100 points
5. **Rewards**: Points accumulate for future benefits and engagement

## Development Notes
- Database uses Drizzle ORM with PostgreSQL for reliable data persistence
- All authentication uses secure OTP verification
- Frontend uses modern React patterns with TypeScript for type safety
- Responsive design optimized for mobile-first experience
- Comprehensive error handling and user feedback systems

## Deployment
- Configured for Replit deployment with automatic builds
- Environment variables configured for database and external services
- Production-ready with rate limiting, security middleware, and proper error handling

## Project Status
✅ **Complete**: Full-stack application with authentication, deal management, visit tracking, and reward system
✅ **Database**: Persistent PostgreSQL storage with proper migrations
✅ **Security**: OTP authentication, rate limiting, input validation
✅ **User Experience**: Complete consumer and partner workflows
✅ **Ready for Production**: Deployable and scalable architecture