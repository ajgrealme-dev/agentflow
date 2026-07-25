import dotenv from 'dotenv';
import path from 'path';

// Set environment variable to test
process.env.NODE_ENV = 'test';

// Import bot
import { bot } from './bot.js';

// Mock telegram bot api functions
bot.sendMessage = async (chatId, text, options) => {
  console.log(`  -> [Mock SendMessage] ChatID: ${chatId}, Text: ${text?.substring(0, 80)}`);
  return { message_id: 1 };
};
bot.sendDocument = async (chatId, file, options) => {
  console.log(`  -> [Mock SendDocument] ChatID: ${chatId}, File: ${file}`);
  return { message_id: 2 };
};
bot.answerCallbackQuery = async (id, options) => {
  console.log(`  -> [Mock AnswerCallbackQuery] ID: ${id}, Options:`, options);
  return true;
};
bot.editMessageText = async (text, options) => {
  console.log(`  -> [Mock EditMessageText] Text: ${text?.substring(0, 80)}`);
  return true;
};
bot.editMessageReplyMarkup = async (markup, options) => {
  console.log(`  -> [Mock EditMessageReplyMarkup] Markup:`, markup);
  return true;
};

let failures = 0;

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  failures++;
});

process.on('uncaughtException', (err, origin) => {
  console.error('❌ Uncaught Exception:', err, 'origin:', origin);
  failures++;
});

function assertNoError(fn, description) {
  try {
    fn();
    console.log(`✅ [Resilience Event Dispatched] ${description}`);
  } catch (err) {
    console.error(`❌ [Resilience Event Dispatch Error] ${description}:`, err);
    failures++;
  }
}

async function runTests() {
  console.log('--- STARTING TELEGRAM BOT RESILIENCE TESTS ---');

  // Test 1: Send spam messages
  assertNoError(() => {
    bot.emit('text', { chat: { id: 12345 }, text: 'spam message' });
  }, 'Send spam message');

  // Test 2: Send invalid file types (photos/documents with missing parameters)
  assertNoError(() => {
    bot.emit('photo', { chat: { id: 12345 } });
  }, 'Send invalid photo (missing properties)');

  assertNoError(() => {
    bot.emit('document', { chat: { id: 12345 } });
  }, 'Send invalid document (missing properties)');

  // Test 3: Send messages from unauthorized chat IDs
  assertNoError(() => {
    bot.emit('text', { chat: { id: 999999 }, text: '/rekap' });
  }, 'Send /rekap from unauthorized chat ID');

  // Test 4: Send path traversal slips
  assertNoError(() => {
    bot.emit('text', { chat: { id: 12345 }, text: '/slip ../../passwd' });
  }, 'Send path traversal slip');

  // Test 5: Send unauthorized callback queries
  assertNoError(() => {
    bot.emit('callback_query', {
      id: 'cb_1',
      from: { id: 999999 },
      message: { chat: { id: 12345 }, message_id: 67890 },
      data: 'inv_app:123'
    });
  }, 'Send unauthorized callback query');

  console.log('\nWaiting for asynchronous handlers to resolve...');
  await new Promise(r => setTimeout(r, 1000));

  console.log('\n--- RESILIENCE TESTS SUMMARY ---');
  if (failures === 0) {
    console.log('🎉 All resilience tests passed with 0 crashes!');
    process.exit(0);
  } else {
    console.error(`❌ ${failures} resilience test(s) failed or caused crashes!`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(err => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
