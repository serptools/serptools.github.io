# 🚀 SerpTools Quick Reference Card

## Essential Commands

```bash
# 1. Import new tools from list
pnpm tools:import --file my-tools.txt --dry-run          # Analyze first
pnpm tools:import --file my-tools.txt --generate-content # Create tools

# 2. Generate React pages  
pnpm tools:generate

# 3. Build and deploy
pnpm build
git add . && git commit -m "Add new tools" && git push

# 4. Quality checks
pnpm tools:validate    # Check all tools
pnpm tools:stats       # Show statistics
```

## Input Format Examples

```txt
# All these formats work in your tool list:
jpg to webp
convert png to avif
gif 2 mp4  
pdf → docx
mp3 into flac
heic,jpg
```

## File Structure

```
📁 Your tool list → packages/app-core/src/data/tools.json
📁 Generated pages → apps/tools/app/(convert)/[tool]/page.tsx  
📁 Live website → https://serptools.github.io/[tool-name]
```

## Timeline

```
Input → Analysis → Import → Generate → Build → Deploy → Live
 30s      30s      1m       2m       3m      2m     ✅
```

## Troubleshooting

```bash
# Issues with import?
pnpm tools:import --test-parsing

# Build problems?  
pnpm lint

# Check tool quality?
pnpm tools:validate --tool your-tool-name
```

**🎯 Result: New conversion tools live on the internet in ~10 minutes!**