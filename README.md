# ODeals - Local Business Deals Platform

A mobile-first web application connecting local businesses with consumers through deals and rewards.

## Features

### For Consumers
- 🔍 **Discover Deals**: Browse deals by category (Food, Shopping, Services, Entertainment)
- 📍 **Find Stores**: Explore local partner businesses
- 📅 **Schedule Visits**: Book visits to participate in deals
- ✅ **Complete Visits**: Mark visits as completed to earn points
- ⭐ **Write Reviews**: Rate and review experiences
- 🎁 **Earn Rewards**: Accumulate points through engagement

### For Partners
- 📊 **Analytics Dashboard**: Track performance and customer engagement
- 🏷️ **Deal Management**: Create and manage business offers
- 👥 **Visit Tracking**: Monitor scheduled and completed visits
- 📈 **Performance Metrics**: View store analytics and deal popularity

## Tech Stack

- **Frontend**: React + TypeScript, Wouter, TanStack Query, Tailwind CSS, shadcn/ui
- **Backend**: Express.js + TypeScript, PostgreSQL, Drizzle ORM
- **Authentication**: OTP-based secure authentication
- **Deployment**: Replit platform ready

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Database**
   ```bash
   npm run db:push
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Open browser to `http://localhost:5000`
   - Consumer interface: `/consumer/login`
   - Partner interface: `/partner/login`

## Environment Variables

Required environment variables (automatically configured on Replit):
- `DATABASE_URL` - PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Database connection details

Optional:
- `SENDGRID_API_KEY` - For email notifications (if needed)

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   │   ├── consumer/  # Consumer interface
│   │   │   └── partner/   # Partner interface
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/          # Utilities and constants
├── server/                # Express backend
│   ├── routes.ts         # API endpoints
│   ├── databaseStorage.ts # Database operations
│   ├── db.ts            # Database connection
│   └── index.ts         # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts        # Database schema definitions
└── public/              # Static assets
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/send-otp` - Send OTP for login/registration
- `POST /api/auth/verify-otp` - Verify OTP and authenticate
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/logout` - Logout user

### Consumer Endpoints
- `GET /api/consumer/deals` - Get deals with filtering
- `GET /api/consumer/stores` - Get all stores
- `POST /api/consumer/visits` - Schedule a visit
- `GET /api/consumer/visits` - Get user's visits
- `POST /api/consumer/visits/:id/complete` - Mark visit completed
- `POST /api/consumer/reviews` - Submit review
- `GET /api/consumer/rewards` - Get reward points

### Partner Endpoints
- `GET /api/partner/deals` - Get partner's deals
- `POST /api/partner/deals` - Create new deal
- `PUT /api/partner/deals/:id` - Update deal
- `DELETE /api/partner/deals/:id` - Delete deal
- `GET /api/partner/visits` - Get scheduled visits
- `GET /api/partner/analytics` - Get analytics

## Reward System

- **Visit Completion**: 100 points
- **Review Submission**: 100 points
- **Registration Bonus**: 500 points

## Development Commands

```bash
# Start development server
npm run dev

# Push database schema changes
npm run db:push

# Generate database migrations
npm run db:generate

# Build for production
npm run build

# Type checking
npm run type-check
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary. All rights reserved.