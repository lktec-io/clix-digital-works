# Deployment Guide — Clix Digital Works
**Target:** Contabo VPS · Ubuntu 22.04 LTS · Nginx · PM2 · MySQL 8 · Let's Encrypt SSL

---

## 1. VPS Initial Setup

```bash
# Connect as root, then create a deploy user
adduser deploy
usermod -aG sudo deploy
su - deploy

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install MySQL 8
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

---

## 2. Database Setup

```sql
-- Log in as root
sudo mysql -u root -p

CREATE DATABASE clix_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'clix_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON clix_db.* TO 'clix_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

-- Import schema
mysql -u clix_user -p clix_db < /var/www/clix/server/db/schema.sql
```

---

## 3. Application Deployment

```bash
# Clone / upload your project to the server
mkdir -p /var/www/clix
cd /var/www/clix

# --- FRONTEND ---
# Install frontend deps and build
npm install
npm run build
# Output: dist/ folder (served by Nginx)

# --- BACKEND ---
cd /var/www/clix/server
npm install

# Set up environment variables
cp .env.example .env
nano .env          # Fill in all values

# Generate admin password hash
npm run hash-password
# Copy the printed hash into .env as ADMIN_PASSWORD_HASH
```

---

## 4. PM2 Configuration

Create `/var/www/clix/ecosystem.config.cjs`:

```js
module.exports = {
  apps: [
    {
      name: 'clix-api',
      script: '/var/www/clix/server/index.js',
      cwd: '/var/www/clix/server',
      node_args: '--experimental-vm-modules',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      error_file: '/var/log/pm2/clix-api-error.log',
      out_file: '/var/log/pm2/clix-api-out.log',
    },
  ],
};
```

```bash
# Start and save PM2 process
pm2 start /var/www/clix/ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd    # follow the printed command to enable auto-start
```

---

## 5. Nginx Configuration

Create `/etc/nginx/sites-available/clixdigitalworks.co.tz`:

```nginx
server {
    listen 80;
    server_name clixdigitalworks.co.tz www.clixdigitalworks.co.tz;

    # Redirect HTTP → HTTPS (uncomment after SSL setup)
    # return 301 https://$host$request_uri;

    root /var/www/clix/dist;
    index index.html;

    # SPA fallback — serves index.html for all frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to Node.js backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static asset caching
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";

    # Block admin from public (security through obscurity)
    location /admin {
        try_files $uri /index.html;
        # Optional: IP whitelist
        # allow YOUR_OFFICE_IP;
        # deny all;
    }
}

# HTTPS server (add after SSL cert is issued)
# server {
#     listen 443 ssl http2;
#     server_name clixdigitalworks.co.tz www.clixdigitalworks.co.tz;
#
#     ssl_certificate     /etc/letsencrypt/live/clixdigitalworks.co.tz/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/clixdigitalworks.co.tz/privkey.pem;
#     include /etc/letsencrypt/options-ssl-nginx.conf;
#     ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
#
#     root /var/www/clix/dist;
#     index index.html;
#     ... (same location blocks as above)
# }
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/clixdigitalworks.co.tz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. SSL Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Issue certificate
sudo certbot --nginx -d clixdigitalworks.co.tz -d www.clixdigitalworks.co.tz

# Auto-renewal is set up automatically by Certbot
# Verify:
sudo certbot renew --dry-run
```

After certificate is issued, uncomment the `return 301 https://...` and the `server { listen 443 ... }` blocks in Nginx config, then reload Nginx.

---

## 7. Environment Variables Summary

### Frontend (`.env.local` at project root before building)
```env
VITE_API_URL=https://clixdigitalworks.co.tz
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Backend (`server/.env`)
```env
PORT=3001
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=clix_user
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=clix_db
JWT_SECRET=64_CHAR_HEX_STRING
JWT_EXPIRES_IN=8h
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$...
ALLOWED_ORIGIN=https://clixdigitalworks.co.tz,https://www.clixdigitalworks.co.tz
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@clixdigitalworks.co.tz
SMTP_PASS=YOUR_APP_PASSWORD
NOTIFY_EMAIL=info@clixdigitalworks.co.tz
```

---

## 8. Backup Strategy

### Automated daily MySQL backup

Create `/usr/local/bin/clix-backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR=/var/backups/clix-db
mkdir -p $BACKUP_DIR
mysqldump -u clix_user -p'YOUR_DB_PASSWORD' clix_db | gzip > "$BACKUP_DIR/clix_db_$DATE.sql.gz"
# Keep last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

```bash
chmod +x /usr/local/bin/clix-backup.sh
# Add to crontab (runs at 2 AM daily)
crontab -e
# Add line:
0 2 * * * /usr/local/bin/clix-backup.sh
```

### Application files backup

The `dist/` folder is re-generated on every deploy. Back up only the `server/.env` file separately (keep it secure and never commit it to git).

---

## 9. Deploy Checklist

Before each production deploy:

- [ ] Run `npm run build` locally and confirm no errors
- [ ] Set correct `VITE_API_URL` in `.env.local`
- [ ] Copy `dist/` to `/var/www/clix/dist/` on server
- [ ] Run `npm install --production` in `server/`
- [ ] Reload PM2: `pm2 reload clix-api`
- [ ] Reload Nginx: `sudo systemctl reload nginx`
- [ ] Test `/api/health` endpoint
- [ ] Test contact form submission
- [ ] Test admin login at `/admin/login`
- [ ] Check PM2 logs: `pm2 logs clix-api`

---

## 10. Google Search Console Setup

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property: `https://clixdigitalworks.co.tz`
3. Verify via HTML file (place in `public/` before building) or DNS TXT record
4. Submit sitemap: `https://clixdigitalworks.co.tz/sitemap.xml`
5. Monitor: Core Web Vitals, Index Coverage, Performance

---

## 11. Monitoring

```bash
# View PM2 process status
pm2 status

# Stream API logs
pm2 logs clix-api

# Nginx access log
sudo tail -f /var/log/nginx/access.log

# MySQL status
sudo systemctl status mysql
```

For uptime monitoring, use [UptimeRobot](https://uptimerobot.com) (free plan):
- Monitor: `https://clixdigitalworks.co.tz/api/health`
- Alert via email if down > 5 minutes
