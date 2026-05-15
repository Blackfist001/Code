# 🛡️ CONFIGURATION SÉCURITÉ SERVEUR

## Configuration Apache (.htaccess)

**Créer `public/.htaccess` :**

```apache
# Désactiver affichage du répertoire
Options -Indexes

# Protéger les fichiers sensibles
<FilesMatch "\.env|\.git|\.htaccess|composer.json">
    Order allow,deny
    Deny from all
</FilesMatch>

# Redirection vers index.php
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Protéger app, sql, test répertoires
    RewriteRule ^(app|sql|test|vendor|composer\.) - [F,L]
    
    # Tous les fichiers non existants vont à index.php
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php?route=$1 [QSA,L]
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/javascript application/javascript application/json
</IfModule>

# Cache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 0 seconds"
    ExpiresByType application/json "access plus 0 seconds"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/* "access plus 1 month"
</IfModule>
```

---

## Configuration PHP (php.ini)

**Settings recommandés pour production :**

```ini
; ============================================
; SECURITY SETTINGS
; ============================================

; Display & Logging
display_errors = Off
display_startup_errors = Off
log_errors = On
error_log = /var/log/php/error.log
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT

; Session
session.name = APPID
session.use_strict_mode = 1
session.use_only_cookies = 1
session.cookie_httponly = 1
session.cookie_samesite = Lax
session.cookie_secure = 1  ; Si HTTPS
session.gc_maxlifetime = 3600  ; 1 heure
session.gc_probability = 1
session.gc_divisor = 100

; File uploads
file_uploads = On
upload_max_filesize = 10M
post_max_size = 10M
upload_tmp_dir = /tmp
max_file_uploads = 5

; Exécution
max_execution_time = 30
max_input_time = 30
memory_limit = 128M

; Sécurité
expose_php = Off
disable_functions = exec,passthru,shell_exec,system,proc_open,popen,curl_exec
allow_url_fopen = Off
allow_url_include = Off

; Open basedir (optionnel)
; open_basedir = /var/www/html:/tmp:/var/lib/php/sessions

; Cryptographie
openssl.cafile = /etc/ssl/certs/ca-certificates.crt

; ============================================
; PERFORMANCE
; ============================================

; Opcache
opcache.enable = 1
opcache.memory_consumption = 128
opcache.interned_strings_buffer = 8
opcache.max_accelerated_files = 10000
opcache.revalidate_freq = 0
opcache.validate_timestamps = 1
opcache.save_comments = 1

; PDO
pdo.default_charset = utf8

; Réglage des limites pour localhost
max_input_vars = 1000
; (augmenter si formulaires complexes)
```

---

## Configuration Web Server (nginx)

**Si nginx au lieu d'Apache :**

```nginx
server {
    listen 127.0.0.1:8000;
    server_name _;
    
    root /var/www/sortie_ecole/public;
    index index.php;

    # Protéger répertoires sensibles
    location ~ ^/(app|sql|test|vendor|composer)/ {
        return 403;
    }

    location ~ /\.env {
        return 403;
    }

    location ~ /\.git {
        return 403;
    }

    # PHP
    location ~ \.php$ {
        try_files $uri =404;
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        
        # Sécurité
        fastcgi_param PHP_ADMIN_VALUE "display_errors=off";
        fastcgi_param PHP_ADMIN_VALUE "log_errors=on";
    }

    # Rewrite rules
    try_files $uri $uri/ /index.php?$args;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net qrserver.com; style-src 'self' 'unsafe-inline' cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' cdn.jsdelivr.net" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), usb=()" always;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.(html|json)$ {
        expires 0;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Logs
    access_log /var/log/nginx/sortie_ecole_access.log;
    error_log /var/log/nginx/sortie_ecole_error.log warn;
}
```

---

## Dossier des logs sécurisé

**Créer structure :**

```bash
# Créer dossier logs en dehors du web root
mkdir -p /var/log/sortie_ecole
chmod 700 /var/log/sortie_ecole

# Ou en local (dans le projet)
mkdir -p app/logs
chmod 700 app/logs
touch app/logs/php-errors.log
chmod 600 app/logs/php-errors.log
```

**Configuration rotation (logrotate) :**

```bash
# Créer /etc/logrotate.d/sortie_ecole
/var/log/sortie_ecole/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    postrotate
        systemctl reload php-fpm > /dev/null 2>&1 || true
    endscript
}
```

---

## Firewall & Network (Local Network)

**Pour réseau local sécurisé :**

### UFW (Ubuntu/Debian)

```bash
# Autoriser seulement réseau local
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.0.0/16 to any port 8000
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

### Windows Firewall (Powershell)

```powershell
# Permettre port 8000 seulement depuis réseau local
netsh advfirewall firewall add rule name="School App Port 8000" `
  dir=in action=allow protocol=tcp localport=8000 `
  remoteip=192.168.0.0/16 enable=yes profile=private
```

---

## HTTPS Setup (Optionnel pour Local)

**Si on veut HTTPS même en local :**

### Générer certificat auto-signé

```bash
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes \
  -subj "/C=FR/ST=State/L=City/O=School/CN=127.0.0.1"

# Copier dans Apache/nginx config
cp server.key /etc/ssl/private/
cp server.crt /etc/ssl/certs/
```

### Apache SSL config

```apache
<VirtualHost *:443>
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/server.crt
    SSLCertificateKeyFile /etc/ssl/private/server.key
    
    # Redirections HTTP vers HTTPS
    # DocumentRoot et autres configs...
</VirtualHost>

<VirtualHost *:80>
    Redirect permanent / https://127.0.0.1:443/
</VirtualHost>
```

---

## Vérification Configuration

```bash
# Vérifier PHP settings
php -r "phpinfo();"

# Vérifier sécurité headers
curl -I https://127.0.0.1:8000/

# Tester SSL/TLS
openssl s_client -connect 127.0.0.1:443

# Vérifier permissions fichiers
ls -la app/config/
# Doivent être 644 (.env.example) et 600 (.env)
```

---

## Checklist Configuration Serveur

```
WEB SERVER
[ ] Apache/nginx configuré
[ ] .htaccess ou nginx.conf appliqué
[ ] Répertoires sensibles bloqués (app, vendor, sql, test)
[ ] Rewrite rules fonctionnelles
[ ] Headers de sécurité présents
[ ] Compression gzip activée
[ ] Cache configuré

PHP
[ ] display_errors = Off
[ ] log_errors = On
[ ] Session settings sécurisés
[ ] Opcache activé
[ ] Limit functions dangereuses

FICHIERS
[ ] app/logs/ avec permissions 700
[ ] app/config/.env avec permissions 600
[ ] app/config/.env.example avec permissions 644
[ ] public/ accessible
[ ] app/ non accessible directement

LOGS
[ ] Rotation configurée
[ ] Accès restreint
[ ] Monitoring en place

FIREWALL
[ ] Port 8000 seulement réseau local
[ ] SSH seulement réseau local
[ ] Outbound restreint si possible
```

---

## Monitoring Sécurité Continu

**Script de monitoring `monitor_security.sh` :**

```bash
#!/bin/bash

LOG_FILE="/var/log/sortie_ecole_security.log"

echo "[$(date)] === Security Monitoring ===" >> $LOG_FILE

# Check permissions
echo "[CHECK] File Permissions" >> $LOG_FILE
find /var/www/sortie_ecole/app/config -type f ! -perm /022 >> $LOG_FILE

# Check for exposed secrets in logs
echo "[CHECK] Secrets in logs" >> $LOG_FILE
grep -i "password\|secret\|credential" /var/log/php/error.log | tail -5 >> $LOG_FILE

# Check failed login attempts
echo "[CHECK] Failed logins" >> $LOG_FILE
grep "Identifiants invalides" /var/log/sortie_ecole_access.log | wc -l >> $LOG_FILE

# Check disk space
echo "[CHECK] Disk Usage" >> $LOG_FILE
df -h / | tail -1 >> $LOG_FILE

# Alert if issues
if grep -q "FAIL\|ERROR" $LOG_FILE; then
    # Send alert (mail, webhook, etc.)
    echo "Security alert!" | mail -s "School App Security Alert" admin@school.local
fi
```

**Programmer avec cron :**

```bash
# Exécuter chaque 6 heures
0 */6 * * * /path/to/monitor_security.sh
```

---

**Configuration testée et recommandée pour :**
- Apache 2.4+
- Nginx 1.18+
- PHP 8.0+
- MySQL 8.0+

**Mise à jour :** Mai 2026
