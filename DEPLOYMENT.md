# Deployment Guide

## Prerequisites for Deployment

1. **OpenAI API Key**: Get from https://platform.openai.com/
2. **Domain/Hosting**: Choose your deployment platform
3. **Environment Setup**: Configure production environment variables

## Backend Deployment Options

### Option 1: Heroku
1. Install Heroku CLI
2. Create new Heroku app: `heroku create your-app-name`
3. Set environment variables:
   ```bash
   heroku config:set OPENAI_API_KEY=your_key_here
   heroku config:set NODE_ENV=production
   heroku config:set FRONTEND_URL=https://your-frontend-domain.com
   ```
4. Deploy: `git push heroku main`

### Option 2: Railway
1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### Option 3: AWS/DigitalOcean
1. Set up server with Node.js
2. Clone repository and install dependencies
3. Configure PM2 for process management
4. Set up reverse proxy with Nginx

## Frontend Deployment Options

### Option 1: Netlify
1. Build the project: `npm run build`
2. Connect GitHub repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `build`
5. Set environment variable: `REACT_APP_API_URL=https://your-backend-url.com/api`

### Option 2: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in frontend directory
3. Set environment variables in Vercel dashboard

### Option 3: AWS S3 + CloudFront
1. Build the project: `npm run build`
2. Upload build folder to S3 bucket
3. Configure CloudFront distribution
4. Set up custom domain

## Environment Variables

### Backend Production Variables
```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Production Variables
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_APP_NAME=Credit Card Advisor
REACT_APP_VERSION=1.0.0
```

## Security Checklist

- [ ] OpenAI API key is secure and not exposed
- [ ] CORS is configured for production domains only
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced
- [ ] Environment variables are properly set
- [ ] Error messages don't expose sensitive information

## Performance Optimization

1. **Frontend**:
   - Enable gzip compression
   - Use CDN for static assets
   - Implement proper caching headers
   - Optimize images and assets

2. **Backend**:
   - Enable compression middleware
   - Implement database caching if needed
   - Use PM2 for clustering
   - Monitor API response times

## Monitoring and Maintenance

1. **Error Tracking**: Set up error monitoring (Sentry, LogRocket)
2. **Analytics**: Add usage analytics (Google Analytics)
3. **Uptime Monitoring**: Monitor API endpoints
4. **Logs**: Set up centralized logging
5. **Backups**: Regular data backups if using database

## Testing Before Deployment

1. Test all API endpoints
2. Test chat functionality end-to-end
3. Test recommendations with various user profiles
4. Test on different devices and browsers
5. Verify error handling
6. Check performance under load

## Domain Setup

1. **Backend**: api.yourcardadvisor.com
2. **Frontend**: yourcardadvisor.com
3. **SSL/TLS**: Ensure HTTPS for both domains

## Cost Estimation

### OpenAI API Costs
- GPT-4: ~$0.03 per 1K tokens (input) + $0.06 per 1K tokens (output)
- Estimated cost: $0.10-0.50 per conversation
- Monthly estimate: $50-500 depending on usage

### Hosting Costs
- **Backend**: $5-25/month (Heroku Hobby/Railway Pro)
- **Frontend**: Free-$10/month (Netlify/Vercel)
- **Total**: $5-35/month for low to medium traffic

## Launch Checklist

- [ ] OpenAI API key configured
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] CORS configured correctly
- [ ] All environment variables set
- [ ] SSL certificates configured
- [ ] Error monitoring set up
- [ ] Analytics configured
- [ ] Domain name configured
- [ ] Legal pages added (Privacy Policy, Terms)
- [ ] Final testing completed

## Post-Launch

1. Monitor API usage and costs
2. Collect user feedback
3. Monitor error rates
4. Track conversion metrics
5. Plan feature updates
6. Scale infrastructure as needed
