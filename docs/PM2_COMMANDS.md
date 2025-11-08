# PM2 Commands for 3DDServices (Updated for Production Issues)

## Install PM2 (if you don't have it)
```bash
npm install -g pm2
```

## URGENT: Fix for ERR_CONNECTION_RESET Issues

### If you're getting connection reset errors:

```bash
# 1. Complete restart with cleanup
pm2 stop 3ddservices
pm2 delete 3ddservices
pm2 flush

# 2. Start with new optimized configuration
pm2 start ecosystem.config.js --env production

# 3. Run diagnostics
./diagnose.sh
# or on Windows:
./diagnose.ps1

# 4. Monitor real-time
pm2 logs 3ddservices --lines 0
```

### Test these URLs after restart:
- http://157.230.112.247:3000/health
- http://157.230.112.247:3000/api/info
- http://157.230.112.247:3000/admin

## Production Commands for Dashboard Issues

### Start the service with PM2 (FIXED CONFIG)
```bash
pm2 start ecosystem.config.js --env production
```

### Check process status
```bash
pm2 status
```

### Restart, stop, and view service logs (TROUBLESHOOTING)
```bash
pm2 restart 3ddservices
pm2 stop 3ddservices
pm2 logs 3ddservices --lines 50
```

### For CORS/CSP errors - complete restart
```bash
pm2 stop 3ddservices
pm2 delete 3ddservices
pm2 start ecosystem.config.js --env production
```

### Enable automatic startup after server reboot
```bash
pm2 startup
pm2 save
```

### Monitor real-time (CPU/Memory usage)
```bash
pm2 monit
```

### Check if API is responding
Test these URLs:
- http://157.230.112.247:3000/api/info
- http://157.230.112.247:3000/admin

### View logs by type
```bash
pm2 logs 3ddservices --err    # Error logs only
pm2 logs 3ddservices --out    # Output logs only
pm2 flush                     # Clear all logs
```

## Quick Fix for Current Issues
```bash
# 1. Stop current instance
pm2 stop 3ddservices

# 2. Clear logs
pm2 flush

# 3. Start with new configuration
pm2 start ecosystem.config.js --env production

# 4. Check status
pm2 status
pm2 logs 3ddservices --lines 20
```

## Other utilities
- To view all logs: `pm2 logs`
- To delete the PM2 process: `pm2 delete 3ddservices`
- To list all managed processes: `pm2 list`

---

> **Remember:** Run these commands from the project's root folder.

## Manual healthcheck
You can check if the service is alive with:
```
curl http://localhost:3000/
```
Or from PowerShell:
```
Invoke-WebRequest http://localhost:3000/
```

## PostgreSQL database backup

### Full backup (dump)
```
pg_dump -h <host> -U <user> -d <database> -F c -b -v -f backup_3ddservices.backup
```

### Restore backup
```
pg_restore -h <host> -U <user> -d <database> -v backup_3ddservices.backup
```

> Replace <host>, <user>, and <database> with your environment values.

## View PM2 logs in real time
```
pm2 logs 3ddservices --lines 100
```

## View PM2 process memory and CPU usage
```
pm2 monit
```

---

> If you need more useful commands, add them here to always have them handy.

## Final production tests

### 1. Test root endpoint (healthcheck)
```
curl http://<YOUR_DOMAIN_OR_IP>:3000/
```
Expected response: welcome or warning message.

### 2. Test API Key authentication
```
curl -H "x-api-key: <YOUR_API_KEY>" http://<YOUR_DOMAIN_OR_IP>:3000/artwork/count-likes
```
Expected response: JSON with likes grouped by artwork.

### 3. Test endpoint protection (without API Key)
```
curl http://<YOUR_DOMAIN_OR_IP>:3000/artwork/count-likes
```
Expected response: 401 Unauthorized error.

### 4. Test rate limiting
Send more than 100 requests in 15 minutes from the same IP and verify you get the error message:
```
{"ok":false,"error":"Too many requests, try again later."}
```

### 5. Test like insertion and query
You can use the test_artwork_likes.http or test_artwork_likes.ps1 scripts, adapting the host to production.

### 6. Check service logs and status
```
pm2 logs 3ddservices --lines 100
pm2 status
```

### 7. Check database connection
```
curl -H "x-api-key: <YOUR_API_KEY>" http://<YOUR_DOMAIN_OR_IP>:3000/test-db
```
Expected response: current date/time from the database.

---

> Perform these tests after each deployment to ensure everything works correctly in production.
