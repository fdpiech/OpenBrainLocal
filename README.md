# Open Brain (Local)

A fully local, zero-cloud personal memory system using SQLite, sqlite-vec, and Ollama. Capture thoughts and notes from the CLI, search them semantically, and surface patterns via an MCP server connected to Claude Desktop.

**No Docker. No cloud accounts. No API keys.**

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install Ollama from https://ollama.com, then pull models
npm run install-models

# 3. Start Ollama in a separate terminal
ollama serve

# 4. Verify everything is ready
npm run health

# 5. Capture your first memory
npm run capture "Your first thought or note here"
```

## MCP Server (Claude Desktop)

```bash
# Build the server
npm run build

# Then add to Claude Desktop config - see docs/claude-desktop-setup.md
```

## Configuration

Copy `.env.example` to `.env` and edit as needed:

```bash
cp .env.example .env
```

Key settings:
- `OLLAMA_HOST` - Ollama API URL (default: `http://localhost:11434`)
- `DB_PATH` - Where to store `memories.db` (default: project root)
- `LLM_MODEL` - Metadata extraction model (default: `llama3.2:3b`; use `llama3.2` for 16GB+ RAM)

## Stack

| Component | Technology |
|-----------|-----------|
| Database | SQLite + sqlite-vec |
| Embeddings | Ollama + nomic-embed-text (768 dims) |
| Metadata extraction | Ollama + llama3.2:3b |
| MCP server | @modelcontextprotocol/sdk |
| Language | TypeScript / Node.js |

## MCP Tools

| Tool | Description |
|------|-------------|
| `semantic_search` | Find memories by meaning, not keywords |
| `list_recent` | Browse memories from the last N days |
| `thinking_stats` | Topics, type breakdown, active days, action items |

## Portability

The entire system lives in one folder. To move it:

```bash
bash scripts/bundle.sh
```

See `docs/claude-desktop-setup.md` for full setup and migration instructions.

## Database Backup

`memories.db` is your data. To back it up continuously, set `DB_PATH` in `.env` to a path inside Dropbox or OneDrive.
