# Claude Desktop Setup

## Prerequisites

1. **Build the project first** - Claude Desktop runs the compiled JS, not ts-node:
   ```bash
   npm run build
   ```
   Re-run this after any changes to `src/`.

2. **Ollama must be running** when Claude Desktop starts:
   ```bash
   ollama serve
   ```

## Adding Open Brain to Claude Desktop

Open your Claude Desktop config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the following under `mcpServers` (see `docs/claude-config-snippet.json`):

```json
{
  "mcpServers": {
    "open-brain": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/open-brain/dist/mcp-server.js"],
      "env": {
        "OLLAMA_HOST": "http://localhost:11434",
        "DB_PATH": "/ABSOLUTE/PATH/TO/open-brain/memories.db"
      }
    }
  }
}
```

**Important:** Replace `/ABSOLUTE/PATH/TO/open-brain/` with the actual absolute path to your project folder. Relative paths do not work in Claude Desktop's MCP config.

## Verifying the Connection

After saving the config and restarting Claude Desktop:
1. Open a new conversation
2. You should see "open-brain" in the connected tools/integrations list
3. All three tools should appear: `semantic_search`, `list_recent`, `thinking_stats`

## Troubleshooting

**Server not connecting:**
- Confirm you ran `npm run build` and `dist/mcp-server.js` exists
- Check that the path in `args` is the correct absolute path
- Ensure Ollama is running (`ollama serve`)

**Tools not appearing:**
- Restart Claude Desktop after updating the config
- Check Claude Desktop logs for MCP errors

**Search returns no results:**
- Capture some memories first: `npm run capture "Your first note"`
- Ollama must be running when you capture

## Database Backup

The entire memory store is the `memories.db` file. To back it up:
- Copy it to Dropbox/OneDrive: set `DB_PATH` in `.env` to a path inside your cloud folder
- Or simply copy the file periodically

## Moving to a New Machine

Run `scripts/bundle.sh` to create a portable zip that includes everything except your database and credentials. On the new machine:
1. Unzip the bundle
2. Copy your `memories.db` (optional)
3. Create `.env` from `.env.example`
4. Update the absolute path in your Claude Desktop config
5. Run `ollama serve` and `npm run install-models` if needed
