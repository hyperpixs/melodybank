# Music Tasks Pro

A platform where users can earn by completing music-related tasks.

## Setup Instructions

1. Install Dependencies:
```bash
npm install
```

2. Configure Environment Variables:
- Copy `.env.example` to `.env`
- Update the following variables:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`

3. Run the Application:
```bash
npm start
```

## Development

Run in development mode with hot-reload:
```bash
npm run dev
```

## Deployment

### Heroku Deployment
1. Install Heroku CLI
2. Login to Heroku:
```bash
heroku login
```
3. Create Heroku app:
```bash
heroku create music-tasks-pro
```
4. Set environment variables:
```bash
heroku config:set STRIPE_SECRET_KEY=your_stripe_secret_key
heroku config:set STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```
5. Deploy:
```bash
git push heroku main
```

### Domain Setup
1. Purchase domain from preferred registrar
2. Add domain to Heroku:
```bash
heroku domains:add www.musictaskspro.com
```
3. Configure DNS settings with provided Heroku DNS target

## Features
- Multi-platform support (Windows, macOS, iOS, Android, Xbox, PlayStation)
- Secure payment processing with Stripe
- Admin dashboard
- Promotional code system
- Task management system
