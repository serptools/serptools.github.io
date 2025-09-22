import os, asyncio, json, hashlib, base64, pathlib, time
import aiofiles
import httpx

API_URL = "https://api.zyte.com/v1/extract"
API_KEY = os.environ.get("ZYTE_API_KEY")
if not API_KEY:
    raise SystemExit("Set ZYTE_API_KEY environment variable.")

BASE = pathlib.Path(__file__).resolve().parents[1]
URLS = BASE / "data" / "urls.txt"
RAW = BASE / "raw"
RAW.mkdir(parents=True, exist_ok=True)

CONCURRENCY = int(os.environ.get("ZYTE_CONCURRENCY", "20"))
TIMEOUT = float(os.environ.get("ZYTE_TIMEOUT", "30"))

# GLOBAL rate limiting: either set requests-per-second OR min-interval seconds
REQUESTS_PER_SECOND = float(os.environ.get("ZYTE_RPS", "2"))  # e.g., 2 = 2 req/sec
MIN_INTERVAL = float(os.environ.get("ZYTE_MIN_INTERVAL", str(1.0 / REQUESTS_PER_SECOND)))

# jitter (optional) so you don't burst on exact boundaries
JITTER = float(os.environ.get("ZYTE_JITTER", "0.0"))  # e.g., 0.05

# Shared throttle state
_throttle_lock = asyncio.Lock()
_next_send_time = time.monotonic()

async def throttle():
    """Ensure a minimum interval between *all* requests globally."""
    global _next_send_time
    async with _throttle_lock:
        now = time.monotonic()
        wait = max(0.0, _next_send_time - now)
        if wait > 0:
            await asyncio.sleep(wait)
        # schedule next slot
        gap = MIN_INTERVAL
        if JITTER:
            # small randomization to avoid perfect cadence
            import random
            gap += random.uniform(0, JITTER)
        _next_send_time = max(now, _next_send_time) + gap

async def fetch(client: httpx.AsyncClient, url: str):
    key = hashlib.sha1(url.encode()).hexdigest()[:16]
    fn = RAW / f"{key}.html"
    if fn.exists() and fn.stat().st_size > 0:
        return

    # Acquire a *global* send slot
    await throttle()

    payload = {"url": url, "httpResponseBody": True}
    r = await client.post(API_URL, json=payload, auth=(API_KEY, ""))
    r.raise_for_status()
    data = r.json()

    if isinstance(data, str):
        print(f"[warn] unexpected string response for {url}: {data[:100]}")
        return

    body_b64 = None
    if "httpResponseBody" in data:
        http_response_body = data["httpResponseBody"]
        if isinstance(http_response_body, str):
            body_b64 = http_response_body
        elif isinstance(http_response_body, dict):
            body_b64 = http_response_body.get("data") or http_response_body.get("text")

    if not body_b64 and "browserHtml" in data:
        body_b64 = data["browserHtml"]

    if not body_b64:
        preview = json.dumps(data, indent=2)[:500]
        print(f"[warn] Could not find body content for {url}. Response structure: {preview}")
        return

    try:
        content = base64.b64decode(body_b64)
    except Exception:
        content = body_b64.encode() if isinstance(body_b64, str) else body_b64

    async with aiofiles.open(fn, "wb") as f:
        await f.write(content)

async def main():
    urls = [u.strip() for u in URLS.read_text().splitlines() if u.strip()]
    limits = httpx.Limits(max_keepalive_connections=CONCURRENCY, max_connections=CONCURRENCY)

    # Optional: retries with backoff for transient 429/5xx
    transport = httpx.AsyncHTTPTransport(retries=3)

    async with httpx.AsyncClient(timeout=TIMEOUT, limits=limits, transport=transport) as client:
        sem = asyncio.Semaphore(CONCURRENCY)

        async def run_one(u):
            async with sem:
                try:
                    await fetch(client, u)
                    print("ok  :", u)
                except httpx.HTTPStatusError as e:
                    print("fail:", u, "-", e.response.status_code, e)
                except Exception as e:
                    print("fail:", u, "-", e)

        # Launch all, but throttling controls send pace
        await asyncio.gather(*(run_one(u) for u in urls))

if __name__ == "__main__":
    asyncio.run(main())
