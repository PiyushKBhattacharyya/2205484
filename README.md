# Social Media Analytics Platform

A full-stack React and Express application that provides real-time insights into social media engagement, trending content, and user interactions.

## Features

- **Dashboard Analytics**: Visualize platform metrics and key performance indicators
- **Feed Views**: Browse latest posts with intelligent sorting options
- **Trending Content**: Discover popular and fastest-growing content
- **Top Users**: See the most active users on the platform
- **User Details**: View detailed user profiles with their posts
- **Real-Time Updates**: Refresh data to get the latest information
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Backend**: Express.js with TypeScript
- **Data Validation**: Zod
- **API Communication**: Axios with React Query
- **UI Framework**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Storage**: In-memory data store with persistence capability
- **State Management**: React Query for server state, React hooks for local state

## Setup Instructions

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install --force
   ```
3. Create a `.env` file with the following variables:
   ```
   MODE=api
   ACCESS_CODE=your_access_code
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_client_secret
   ```

### Running the Application

#### Development Mode
Run the development server:
```
npm run dev
```

The application will be available at:
- **Application**: http://localhost:3000
- **Backend API**: http://localhost:3000/api

## API Integration

The application integrates with the evaluation service API. Authentication is handled using:
- Email
- Name
- Roll number
- Access code
- Client ID
- Client secret

If the API is unavailable, the application will fall back to demo mode with mock data.

## Code Structure

- `/client`: React frontend code
  - `/src/components`: UI components
  - `/src/pages`: Application pages/views
  - `/src/lib`: Utility functions and API client
  - `/src/hooks`: Custom React hooks
- `/server`: Express backend
  - `/api`: API routes
  - `/storage.ts`: Data storage layer
- `/shared`: Shared code between client and server
  - `/schema.ts`: Data models and validation schemas
