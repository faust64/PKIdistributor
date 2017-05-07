PKImgr - a NodeJS&express.js based service, distributing certificates and keys
==============================================================================

[![Greenkeeper badge](https://badges.greenkeeper.io/faust64/PKIdistributor.svg)](https://greenkeeper.io/)

Assuming your DNS databases are properly configured, your local hosts should have their own PTR record.
PKImgr allows you to install both certiicates and keys to your servers by downloading them directly from your PKI server. Any host may query for the files corresponding to its PTR record, and nothing else.

I've been using it with puppet. Integration with ansible could be done with `get_url` plugin. It could be usefull in any configuration deployment solution, or scripts you could use installing a new host.

Content
-------
 - `app.js` goes pretty much anywhere. Should be run as a service.
 - `package.json` should be in the same directory as `app.js`, prior to running `npm install`

Installation Instructions
-------------------------

For detailed installation instructions, check out [https://gitlab.unetresgrossebite.com/DevOps/puppet/tree/master/modules/pki/](my PKI puppet module)

Short version (jessie/xenial)

```
# apt-get update
# apt-get install nodejs nginx
# ln -sf /usr/bin/nodejs /usr/bin/node
# apt-get install npm
# npm install -g pm2
# mkdir /var/log/pm2 /etc/nginx/sites-enabled \
    /etc/nginx/sites-available /etc/nginx/ssl
# systemctl stop nginx
# adduser pm2RuntimeUser
# chown pm2RuntimeUser /var/log/pm2
# pm2 startup systemd --hp /home/pm2RuntimeUser/.pm2 -u pm2RuntimeUser >/dev/null 2>&1
# cd /path/to/PKIdistributor
# npm install
# su -l pm2RuntimeUser -s /bin/bash
$ export PKI_ROOT=/path/to/pki/root
$ export LISTEN_PORT=8080
$ pm2 start ./app.js --name PKIdistributor -i 2 \
    --output /var/log/pm2/stdout.log \
    --error /var/log/pm2/stderr.log
$ pm2 save
$ exit
# cd /etc/nginx/ssl
# openssl dhparam -out dh.pem 4096
# openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes -subj "/CN=pki.example.com"
# chmod 0640 server.key dh.pem
# chmod 0644 server.crt
# cat <<EOF >/etc/nginx/sites-available/pki.conf
server {
    listen 80;
    server_name pki.example.com;
    server_tokens off;
    error_log /var/log/nginx/error-pki.example.com.log;
    access_log /var/log/nginx/access-pki.example.com.log main;
    add_header Content-Security-Policy "default-src 'self'; style-src 'none'; script-src 'self'; img-src 'none'; font-src 'none'; frame-src 'none'; object-src 'none'; report-uri https://example.report-uri.io/r/default/csp/enforce";
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    root /var/www;
    location / {
	try_files $uri $uri/ /index.html =404;
    }
}

server {
    listen 443;
    server_name pki.example.com;
    server_tokens off;
    error_log /var/log/nginx/ssl-error-pki.example.com.log;
    access_log /var/log/nginx/ssl-access-pki.example.com.log main;
    ssl on;
    ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";
    ssl_protocols TLSv1.2;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    add_header Content-Security-Policy "default-src 'self'; style-src 'none'; script-src 'self'; img-src 'none'; font-src 'none'; frame-src 'none'; object-src 'none'; report-uri https://example.report-uri.io/r/default/csp/enforce";
    add_header Strict-Transport-Security "max-age=63072000; includeSubdomains; preload";
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    ssl_certificate /etc/nginx/ssl/server-full.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;
    ssl_dhparam /etc/nginx/ssl/dh.pem;
    root /var/www;
    location /certificate/ {
	proxy_redirect off;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_pass http://PKIdistrib/certificate/;
    }
    location /key/ {
	proxy_redirect off;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_pass http://PKIdistrib/key/;
    }
    location / {
	try_files $uri $uri/ /index.html =404;
    }
}
EOF
# cat <<EOF >/etc/nginx/nginx.conf
user www-data;
worker_processes 4;
pid /var/run/nginx.pid;

events {
    worker_connections 768;
}

http {
    sendfile off;
    tcp_nopush on;
    tcp_nodelay on;
    server_names_hash_bucket_size 64;
    keepalive_timeout 25;
    server_tokens off;
    include /etc/nginx/mime.types;
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
		    '$status $body_bytes_sent "$http_referer" '
		    '"$http_user_agent" "$http_x_forwarded_for"';
    default_type application/octet-stream;
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;
    gzip on;
    gzip_disable "msie6";
    include /etc/nginx/sites-enabled/*.conf;
}
EOF
# ln -sf /etc/nginx/sites-available/pki.conf /etc/nginx/sites-enabled/
# nginx -t && systemctl start nginx
```

Obviously
---------
This service shouldn't be exposed as is. Keep it behind any SSL capable proxy.
