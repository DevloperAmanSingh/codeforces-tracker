# Codeforces Student Tracker

A comprehensive platform to track and analyze student performance on Codeforces with automated notifications and detailed analytics.

## 🎯 Features

### Student Management
- **Profile Sync**: Automatically sync student data from Codeforces API when profile is created/edited.
- **Contest History**: Track participation and performance in contests (last 365 days)
- **Problem Solving**: Monitor solved problems with difficulty ratings and timestamps
- **Auto Reminders**: Automated email notifications for inactive students (7+ days)

### Analytics Dashboard
- **Problem Stats**: Detailed statistics with 7/30/90 day filters
  - Most difficult problem solved
  - Total problems count
  - Average rating and daily solve rate
- **Rating Distribution**: Visual breakdown of problems by difficulty ranges
- **Contest Performance**: Historical contest participation and ratings

### App Features
- **Cron Management**: Configure automated sync schedules
- **Manual Sync**: Trigger immediate data synchronization
- **Email Settings**: Manage automated reminder system
- **CSV Export**: Download student data and analytics

## 🛠️ Tech Stack

**Backend**
- Node.js + Express.js
- MongoDB with Prisma ORM
- Node-cron for scheduling
- Nodemailer for email notifications

**Frontend**
- Next.js 14 with TypeScript
- TailwindCSS + shadcn/ui
- Recharts for data visualization
- Dark/Light theme support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB instance
- SMTP credentials for email notifications

### Backend Setup
```bash
cd cf-tracker-backend
npm install
cp .env.example .env
# Configure your .env file
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend Setup
```bash
cd cf-tracker-dashboard
npm install
npm run dev
```

### Environment Variables
```env
# Backend (.env)
DATABASE_URL="mongodb://localhost:27017/cf-tracker"
PORT=3001
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## 📱 Demo

[**Live Demo Video**](https://drive.google.com/file/d/1hLp7_KLg7A7WVgd2lVcK4_LyQdT85B5D/view?usp=sharing)

## 🔧 API Endpoints

- `GET /students` - List all students
- `POST /students` - Add new student
- `POST /sync/:id` - Sync student data
- `GET /analytics/:id/problem-stats` - Problem solving analytics
- `GET /analytics/:id/contest-history` - Contest participation data


## 📊 Key Metrics Tracked

- **Contest Performance**: Rating changes, rank, problem solve count
- **Problem Difficulty**: Rating distribution from 800 to 3500+
- **Activity Patterns**: Daily/weekly solving trends
- **Progress Tracking**: Rating progression over time

## ⚡ Performance Optimizations

### Database Indexing
- **Student Queries**: Indexed on `cfHandle` (unique) for fast lookups
- **Contest History**: Composite indexes on `[studentId]`, `[studentId, timestamp]`
- **Problem Solving**: Multi-field indexes on `[studentId]`, `[studentId, solvedAt]`, `[studentId, rating]`

### Query Optimizations
- **Time-based Filtering**: Efficient date range queries for 7/30/90 day analytics

---