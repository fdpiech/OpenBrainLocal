#!/bin/bash
# Creates a portable zip of the full Open Brain installation.
# The recipient needs: Node.js and Ollama installed.
# They do NOT need to npm install - node_modules is included.
# Their memories.db is NOT included - this is code only.

BUNDLE_NAME="open-brain-$(date +%Y%m%d).zip"

echo "Building TypeScript..."
npm run build

echo "Creating bundle (excluding memories.db and .env)..."
zip -r "$BUNDLE_NAME" . \
  --exclude "*.git*" \
  --exclude "memories.db" \
  --exclude ".env" \
  --exclude "*.zip"

echo "Bundle created: $BUNDLE_NAME"
echo ""
echo "On the new machine:"
echo "  1. Unzip and cd into the folder"
echo "  2. Copy your memories.db into the folder (optional - starts fresh without it)"
echo "  3. Create .env from .env.example"
echo "  4. Run: ollama serve (in a separate terminal)"
echo "  5. Run: npm run install-models (if models not already present in Ollama)"
echo "  6. Update the absolute path in your MCP client config"
echo "  7. Test with: npm run capture 'Hello from new machine'"
