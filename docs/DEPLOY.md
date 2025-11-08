# Deployment of 3DDServices with Git and PM2

## 1. Push changes to the remote repository
On your local machine:
```powershell
cd e:\3DDServices
git add .
git commit -m "Production-ready changes"
git push origin main
```

## 2. Update the code on the server
On the server (via SSH):
```bash
cd /path/to/3DDServices
git pull origin main
```

## 3. Install dependencies (if package.json changed)
```bash
npm install
```

## 4. (First time only) Create the .env file on the server
Do not upload .env to git. Copy it manually or edit it with:
```bash
nano .env
```

## 5. Start or restart the service with PM2
```bash
pm2 start ecosystem.config.js # First time only
pm2 restart 3ddservices      # To restart after changes
pm2 save                     # Save the state for automatic restart
```

## 6. Check status and logs
```bash
pm2 status
pm2 logs 3ddservices
```

---

> Repeat steps 1 and 2 every time you want to deploy a new version.
> Keep this file out of the repository (added to .gitignore).
