import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getDb, searchByEmbedding, listRecent, getStats } from './db';
import { getEmbedding, checkHealth } from './ollama';

const server = new McpServer({
  name: 'open-brain',
  version: '1.0.0'
});

server.tool(
  'semantic_search',
  'Search your memories by meaning. Finds relevant notes even if you use different words than what was originally captured.',
  {
    query: z.string().describe('What you are looking for in plain language'),
    limit: z.number().optional().default(10).describe('Max results. Default 10.'),
  },
  async ({ query, limit }) => {
    const healthy = await checkHealth();
    if (!healthy) {
      return { content: [{ type: 'text', text: 'Ollama is not running. Start it with: ollama serve' }] };
    }

    const db = getDb();
    const embedding = await getEmbedding(query);
    const results = searchByEmbedding(db, embedding, limit);

    if (results.length === 0) {
      return { content: [{ type: 'text', text: `No memories found for: "${query}"` }] };
    }

    const formatted = results.map((r, i) => {
      const lines = [
        `[${i + 1}] ${r.created_at.substring(0, 10)} | ${r.type} | similarity: ${(1 - r.distance).toFixed(3)}`,
        r.raw_text,
      ];
      if (r.action_items.length > 0) lines.push(`Action items: ${r.action_items.join(' | ')}`);
      if (r.topics.length > 0) lines.push(`Topics: ${r.topics.join(', ')}`);
      return lines.join('\n');
    }).join('\n\n---\n\n');

    return { content: [{ type: 'text', text: formatted }] };
  }
);

server.tool(
  'list_recent',
  'Browse memories captured in the last N days. Use this to review recent activity or find something you captured this week.',
  {
    days: z.number().optional().default(7).describe('How many days back to look. Default 7.'),
    type_filter: z.string().optional().describe('Filter by type: decision | person_note | insight | meeting_debrief | general')
  },
  async ({ days, type_filter }) => {
    const db = getDb();
    const results = listRecent(db, days, type_filter);

    if (results.length === 0) {
      const filterNote = type_filter ? ` with type "${type_filter}"` : '';
      return { content: [{ type: 'text', text: `No memories found in the last ${days} days${filterNote}.` }] };
    }

    const header = `${results.length} memories from the last ${days} days:\n\n`;
    const body = results.map(r => {
      const preview = r.raw_text.length > 200 ? r.raw_text.substring(0, 200) + '...' : r.raw_text;
      return `${r.created_at.substring(0, 10)} | ${r.type}\n${preview}`;
    }).join('\n\n---\n\n');

    return { content: [{ type: 'text', text: header + body }] };
  }
);

server.tool(
  'thinking_stats',
  'Show thinking patterns: top topics, type breakdown, most active capture days, and open action items.',
  {
    days: z.number().optional().default(30).describe('Analysis window in days. Default 30.')
  },
  async ({ days }) => {
    const db = getDb();
    const stats = getStats(db, days);

    const lines: string[] = [`THINKING STATS - last ${days} days\n`];

    if (stats.topTopics.length > 0) {
      lines.push('Top Topics:');
      lines.push(stats.topTopics.map(t => `  ${t.topic} (${t.count})`).join('\n'));
    }

    if (stats.typeDistribution.length > 0) {
      lines.push('\nType Breakdown:');
      lines.push(stats.typeDistribution.map(t => `  ${t.type}: ${t.count}`).join('\n'));
    }

    if (stats.mostActiveDays.length > 0) {
      lines.push('\nMost Active Days:');
      lines.push(stats.mostActiveDays.map(d => `  ${d.day}: ${d.count} captures`).join('\n'));
    }

    if (stats.openActionItems.length > 0) {
      lines.push(`\nOpen Action Items (${stats.openActionItems.length}):`);
      lines.push(stats.openActionItems.map(m => {
        const items = m.action_items.join(' | ');
        return `  ${m.created_at.substring(0, 10)}: ${items}`;
      }).join('\n'));
    } else {
      lines.push('\nNo open action items.');
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }
);

const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  process.stderr.write('Open Brain MCP server running\n');
});
