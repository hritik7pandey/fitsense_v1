# Security Guidelines

## ⚠️ BEFORE PUSHING TO GITHUB

### 1. Environment Variables
- **NEVER** commit `.env.local` or any file containing real credentials
- `.env.local` is already in `.gitignore` - keep it there!
- Only commit `.env.example` with placeholder values

### 2. Sensitive Data to Protect
- Database connection strings (DATABASE_URL)
- JWT secrets (JWT_SECRET, JWT_REFRESH_SECRET)
- Email credentials (SMTP_USER, SMTP_PASS)
- API keys (GEMINI_API_KEY, SUPABASE keys)
- CRON secrets

### 3. Check Before Commit
```bash
# Make sure these files are NOT staged:
git status

# Should NOT see:
# - .env.local
# - Any file with real passwords/keys
```

### 4. If You Accidentally Committed Secrets
1. **Immediately rotate all credentials**:
   - Change database password
   - Generate new JWT secrets
   - Create new Gmail app password
   - Get new Gemini API key
   - Update Supabase keys

2. **Remove from Git history**:
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch .env.local" \
   --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push** (if already pushed):
   ```bash
   git push origin --force --all
   ```

## Production Deployment

### Environment Variables Setup
1. **Vercel/Netlify**: Add all env vars in dashboard
2. **Never** use development credentials in production
3. **Always** use strong, unique secrets for production

### Security Best Practices
1. ✅ Use HTTPS only in production
2. ✅ Enable CORS restrictions
3. ✅ Set secure JWT expiration times
4. ✅ Use rate limiting for APIs
5. ✅ Validate all user inputs
6. ✅ Sanitize database queries (already using parameterized queries)
7. ✅ Keep dependencies updated

## Current Security Features
- ✅ Parameterized SQL queries (prevents SQL injection)
- ✅ Password hashing with bcrypt
- ✅ JWT authentication
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation
- ✅ CORS headers
- ✅ Security headers (X-Frame-Options, etc.)
- ✅ Blocked user session invalidation

## Reporting Security Issues
If you find a security vulnerability, please email: [your-security-email@example.com]
**Do NOT** create a public GitHub issue for security vulnerabilities.
