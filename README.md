# 🔔 Quiet Hours Scheduler
##**Live Demo:** [https://quiet-hours-scheduler-liart.vercel.app](https://quiet-hours-scheduler-liart.vercel.app)

A NextJS application for scheduling quiet study time blocks with automated email notifications.

## 🚀 Features

- **User Authentication** - Secure login with Supabase
- **Block Management** - Create, view, and delete quiet hour blocks
- **Overlap Prevention** - No conflicting time slots allowed
- **Email Notifications** - 10-minute reminders via SendGrid
- **CRON Jobs** - Automated notification system
- **Professional UI** - Clean, responsive design

## 🛠️ Tech Stack

- **Frontend**: NextJS 15, React, TypeScript, Tailwind CSS
- **Backend**: NextJS API Routes
- **Database**: MongoDB Atlas
- **Authentication**: Supabase
- **Email Service**: SendGrid
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- Supabase account
- SendGrid account
- Git

## 🔧 Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/quiet-hours-scheduler.git
cd quiet-hours-scheduler
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=your_verified_email

# CRON Security
CRON_SECRET_KEY=your_secure_random_key
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. **Push to GitHub** (see steps below)
2. **Connect Vercel to GitHub**:
   - Visit [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Import your repository
3. **Add Environment Variables** in Vercel dashboard
4. **Deploy automatically** on each push

### Option 2: Netlify

1. **Build the project**:
   ```bash
   npm run build
   npm run export
   ```
2. **Deploy to Netlify**:
   - Drag `out/` folder to netlify.com/drop
   - Or connect GitHub repository

### Option 3: Self-Hosted

1. **Build for production**:
   ```bash
   npm run build
   npm start
   ```
2. **Use PM2 for production**:
   ```bash
   npm install -g pm2
   pm2 start npm --name "quiet-hours" -- start
   ```

## ⏰ CRON Job Setup

### External CRON Service (Recommended)

**Using cron-job.org:**
1. Create account at [cron-job.org](https://cron-job.org)
2. Add new job:
   - **URL**: `https://yourapp.com/api/cron`
   - **Schedule**: Every minute (`* * * * *`)
   - **Method**: POST
   - **Headers**: `x-cron-key: your_cron_secret_key`

**Using GitHub Actions:**
```yaml
# .github/workflows/cron.yml
name: CRON Notifications
on:
  schedule:
    - cron: '* * * * *'
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger CRON
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron \
            -H "x-cron-key: ${{ secrets.CRON_SECRET_KEY }}"
```

## 🧪 Testing

### Email System
```bash
# Test email functionality
curl -X POST https://yourapp.com/api/test-email \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

### CRON System
```bash
# Test CRON manually
curl -X POST https://yourapp.com/api/cron \
  -H "x-cron-key: your_secret_key"
```

## 📊 API Endpoints

- `GET /api/blocks` - Get user's blocks
- `POST /api/blocks` - Create new block
- `DELETE /api/blocks/[id]` - Delete block
- `POST /api/cron` - Trigger notifications (requires key)
- `POST /api/test-email` - Send test email

## 🔒 Security Features

- ✅ User authentication required for all operations
- ✅ API key protection for CRON endpoint
- ✅ Input validation and sanitization
- ✅ Rate limiting on email sends
- ✅ Atomic database operations

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For issues and questions:
- Create GitHub issue
- Check documentation in `IMPLEMENTATION.md`
- Review `TESTING_GUIDE.md` for debugging

---

Built with ❤️ using NextJS and TypeScript
