# Couple - Private Chat for Two

A production-ready private couples chat application built with Next.js, TypeScript, PostgreSQL, and real-time WebSocket messaging.

## Features

- **Private Chat** - Real-time one-to-one messaging between partners
- **Image Sharing** - Send and receive images in chat
- **Message Reactions** - React to messages with emojis
- **Read Receipts** - See when messages are delivered and read
- **Typing Indicators** - Know when your partner is typing
- **Online Presence** - See when your partner is online
- **Shared Memories** - Create and share photo memories together
- **Relationship Timeline** - Track your journey together
- **Notifications** - In-app notification system
- **Privacy Controls** - Control what others can see
- **Admin Dashboard** - Manage users, couples, and reports
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Real-time**: Socket.IO WebSocket server
- **Cache**: Redis (optional, for presence and rate limiting)
- **Auth**: Auth.js (NextAuth v5) with JWT strategy
- **Validation**: Zod
- **Testing**: Vitest

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Login, Register pages
│   ├── (dashboard)/       # Main app pages
│   ├── admin/             # Admin dashboard
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # shadcn/ui primitives
│   ├── chat/              # Chat components
│   ├── couple/            # Couple connection
│   ├── memories/          # Memory sharing
│   ├── timeline/          # Relationship timeline
│   ├── notifications/     # Notification system
│   ├── settings/          # User settings
│   ├── admin/             # Admin dashboard
│   ├── landing/           # Public landing page
│   ├── layout/            # Navigation, sidebar
│   └── profile/           # User profile
├── lib/                   # Utilities and configs
│   ├── auth.ts            # Auth.js configuration
│   ├── db.ts              # Prisma client
│   ├── redis.ts           # Redis client
│   ├── validation.ts      # Zod schemas
│   ├── utils.ts           # Utility functions
│   ├── errors.ts          # Error classes
│   └── api-utils.ts       # API helpers
├── hooks/                 # React hooks
├── server/                # WebSocket server
└── __tests__/             # Test files
```

## Database Schema

- **User** - Application users with auth
- **Account/Session** - Auth.js session management
- **Couple** - Connected pairs
- **CoupleMember** - Couple membership
- **CoupleInvitation** - Invitation codes
- **Conversation** - Chat conversations
- **Message** - Chat messages
- **MessageReaction** - Emoji reactions
- **Attachment** - File attachments
- **Memory** - Shared memories
- **TimelineEvent** - Relationship events
- **Notification** - In-app notifications
- **Report** - Content reports
- **UserPrivacySetting** - Privacy preferences

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+ (optional)
- Docker (optional, for local DB)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd couple_chat
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Start PostgreSQL and Redis (using Docker):
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Seed the database:
```bash
npx prisma db seed
```

7. Start the development server:
```bash
npm run dev
```

8. (Optional) Start the WebSocket server:
```bash
npm run ws
```

### Default Accounts

After seeding, you can log in with:

- **Admin**: admin@example.com / Admin123!
- **Alice**: alice@example.com / Password123!
- **Bob**: bob@example.com / Password123!

## Development Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript check
npm run test         # Run tests
npm run ws           # Start WebSocket server
```

## API Routes

- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - Auth.js endpoints
- `GET/POST /api/couples` - Get/create couple
- `GET/POST /api/invitations` - Get/create invitations
- `POST /api/invitations/accept` - Accept invitation
- `GET/PUT /api/users/profile` - User profile
- `GET /api/conversations` - Get conversations
- `GET/POST /api/messages` - Get/send messages
- `DELETE /api/messages/[id]` - Delete message
- `POST/DELETE /api/messages/[id]/reactions` - Manage reactions
- `POST /api/attachments` - Upload file
- `GET/POST /api/memories` - Get/create memories
- `GET/POST /api/timeline` - Get/create timeline events
- `GET/PATCH /api/notifications` - Get/mark notifications
- `GET /api/notifications/unread` - Unread count
- `POST /api/reports` - Create report
- `GET/PATCH /api/settings` - User settings
- `PUT /api/settings/password` - Change password
- Admin routes: `/api/admin/*`

## Security

- Password hashing with bcryptjs
- JWT-based session management
- Server-side authorization on all private resources
- Input validation with Zod
- CSRF protection via SameSite cookies
- File upload validation (type, size)
- Rate limiting (when Redis is available)
- No IDOR/BOLA vulnerabilities

## Testing

```bash
npm run test         # Run all tests
npm run test:watch   # Watch mode
```

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables

3. Run database migrations:
```bash
npx prisma migrate deploy
```

4. Start the server:
```bash
npm start
```

## License

MIT
