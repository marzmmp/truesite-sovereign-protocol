# Sovereign Protocol — Deploy Guide
3565 | TrueSite Technologies

## On the DGX (spark-59b1)

```bash
cd /home/truesite-tech/truesite-sovereign
git pull origin main  # or wherever you keep this
wget -O sovereign-protocol.html <URL>  # or git pull from this repo

pm2 start ecosystem.config.cjs --only sovereign-protocol
pm2 save
```

## Access
- LAN:  http://192.168.68.80:4000
- Web:  https://sovereign.true-site.tech (Cloudflare tunnel)

## Trigger
- Double clap (< 800ms)
- Say "ADAMA"
