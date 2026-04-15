import test from 'node:test';
import assert from 'node:assert/strict';
import { assertAllowedAssistantSourceType, redactSensitiveText } from './openai.js';

test('redactSensitiveText removes emails, phones, urls', () => {
  const input = 'Contact me at alice@example.com or +44 7700 900123 and see https://example.com';
  const r = redactSensitiveText(input);
  assert.equal(r.includes('alice@example.com'), false);
  assert.equal(r.includes('+44 7700 900123'), false);
  assert.equal(r.includes('https://example.com'), false);
  assert.equal(r.includes('[redacted-email]'), true);
  assert.equal(r.includes('[redacted-phone]'), true);
  assert.equal(r.includes('[redacted-url]'), true);
});

test('assertAllowedAssistantSourceType accepts public sources', () => {
  const result = assertAllowedAssistantSourceType('linkedin_profile_table');
  assert.equal(result, 'linkedin_profile_table');
});

test('assertAllowedAssistantSourceType rejects private sources', () => {
  assert.throws(() => assertAllowedAssistantSourceType('instagram_dm_thread'), /not allowed/i);
});
