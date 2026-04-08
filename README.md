# SafeTNet - Personal Safety App

A modern, accessible personal safety application built with React, TypeScript, Supabase, and Twilio. SafeTNet helps users stay safe by providing emergency alerts, check-ins, and location sharing with trusted contacts.

## ✨ Features

- 🚨 **Emergency SOS Button** - One-tap emergency alerts with automated SMS
- 📍 **Real-time Location Sharing** - Share your location with emergency contacts
- 👥 **Emergency Contacts** - Manage up to 5 trusted contacts
- ⏰ **Safety Check-ins** - Set timed check-ins for peace of mind
- 🔐 **Secure Authentication** - Email/password authentication via Supabase
- 📱 **Mobile-First Design** - Optimized for mobile devices
- ♿ **Accessible** - WCAG AA compliant design
- 🎨 **Soft Guardian Design** - Approachable, trustworthy UI

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **SMS/Calls**: Twilio API
- **State Management**: Zustand
- **Routing**: React Router v7
- **Testing**: Vitest, Testing Library

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- Twilio account ([twilio.com](https://twilio.com))

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd safetnet
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **API** and copy:
   - Project URL
   - anon public key
3. Go to **SQL Editor** and run the migration from `supabase/migrations/001_initial_schema.sql`
4. Run the fix migration from `supabase/migrations/003_fix_profiles_insert.sql`

### 4. Set up Twilio

1. Sign up at [twilio.com](https://twilio.com)
2. Get a phone number with SMS capabilities
3. Copy your Account SID and Auth Token from the console
4. Verify phone numbers you want to send to (required for trial accounts)

### 5. Configure environment variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 6. Deploy Supabase Edge Function

Add Twilio secrets in Supabase Dashboard (**Settings** → **Edge Functions** → **Secrets**):

```
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890
```

Deploy the `dispatch-alert` function via Supabase Dashboard or CLI.

### 7. Run the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📱 Usage

1. **Sign Up** - Create an account with email and password
2. **Add Contacts** - Add up to 5 emergency contacts
3. **Emergency SOS** - Press the red button to send automated alerts
4. **Check-ins** - Set timed check-ins for safety
5. **Profile** - Upload avatar and update display name

## 🏗️ Project Structure

```
safetnet/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Supabase client
│   ├── store/          # Zustand state management
│   ├── types/          # TypeScript types
│   ├── utils/          # Utility functions
│   └── test/           # Test files
├── supabase/
│   ├── functions/      # Edge Functions
│   └── migrations/     # Database migrations
└── ...config files
```

## 🧪 Testing

Run tests:

```bash
npm run test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## 🏭 Building for Production

```bash
npm run build
```

The build output will be in the `dist/` folder.

## 🔒 Security

- All sensitive data is stored securely in Supabase
- Row-level security (RLS) policies protect user data
- Environment variables keep API keys secure
- HTTPS enforced for all connections
- Phone numbers verified via Twilio

## 🎨 Design System

SafeTNet uses the "Soft Guardian" design system:

- **Colors**: Light baby pink primary, red for emergencies
- **Typography**: Plus Jakarta Sans font family
- **Spacing**: 4px base grid
- **Touch Targets**: Minimum 44×44px
- **Accessibility**: WCAG AA compliant

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for personal safety
