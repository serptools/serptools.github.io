
---

## (Optional) High‑concurrency fetch via Zyte API

If you have a Zyte subscription, use the async Python fetcher to pull pages quickly and safely through Zyte's infrastructure.

### Setup
```bash
cd scripts
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export ZYTE_API_KEY=YOUR_KEY
export ZYTE_CONCURRENCY=5   # optional
export ZYTE_TIMEOUT=30        # optional
python fetch_zyte_api.py      # writes HTML to ../raw/
```

Then run the same parse/enrich/combine steps from the app root:
```bash
cd ..
npm run build
```

---

## (Optional) High‑concurrency fetch via Zyte API

Use the async Python fetcher to pull pages via Zyte.

### Setup
```bash
cd scripts
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export ZYTE_API_KEY=YOUR_KEY
export ZYTE_CONCURRENCY=5   # optional
export ZYTE_TIMEOUT=30        # optional
python fetch_zyte_api.py      # writes HTML to ../raw/
```
Then from app root:
```bash
cd .. && npm run build
```
