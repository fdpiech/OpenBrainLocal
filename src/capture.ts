import { captureMemory } from './capture-core';

const text = process.argv.slice(2).join(' ');

if (!text) {
  console.error('Usage: npm run capture "Your thought or note here"');
  process.exit(1);
}

console.log('Capturing...');

captureMemory(text)
  .then(result => {
    console.log('\nCaptured successfully.\n');
    console.log(`ID:           ${result.id}`);
    console.log(`Type:         ${result.type}`);
    console.log(`Topics:       ${result.topics.join(', ') || 'none'}`);
    console.log(`People:       ${result.people.join(', ') || 'none'}`);
    console.log(`Action Items: ${result.action_items.join(' | ') || 'none'}`);
    console.log(`Captured at:  ${result.created_at}`);
  })
  .catch(err => {
    console.error('\nCapture failed:', err.message);
    process.exit(1);
  });
