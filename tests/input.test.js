import test from 'node:test';
import assert from 'node:assert/strict';
import { input } from '../src/input.js';

test('soltar um dedo/tecla não solta o escudo mantido por outro', () => {
  input.clear();
  input.press('defend', 'pointer:1'); input.press('defend', 'ShiftLeft');
  input.release('defend', 'pointer:1');
  assert.equal(input.isHeld('defend'), true);
  input.release('defend', 'ShiftLeft');
  assert.equal(input.isHeld('defend'), false);
  assert.equal(input.consume('defend'), true);
  assert.equal(input.consume('defend'), false);
});

test('esquiva espera uma janela curta sem executar depois de expirar', t => {
  input.clear(); let now = 0; t.mock.method(performance, 'now', () => now);
  input.press('dodge', 'pointer:2'); input.release('dodge', 'pointer:2');
  assert.equal(input.consume('dodge', false), false);
  now = 200; assert.equal(input.consume('dodge', true), true);
  assert.equal(input.consume('dodge'), false);
  input.press('dodge', 'pointer:2'); now = 451;
  assert.equal(input.consume('dodge'), false);
  input.press('item1', 'pointer:3'); now = 1052;
  assert.equal(input.consume('item1'), false);
});

test('cancelamento descarta só a ação pendente do dedo cancelado', () => {
  input.clear();
  input.press('dodge', 'pointer:1'); input.release('dodge', 'pointer:1', true);
  assert.equal(input.consume('dodge'), false);
  input.press('defend', 'pointer:1'); input.press('defend', 'pointer:2');
  input.release('defend', 'pointer:1', true);
  assert.equal(input.isHeld('defend'), true); assert.equal(input.consume('defend'), true);
  input.clear(); assert.equal(input.isHeld('defend'), false);
  assert.equal(input.sources.size, 0); assert.equal(input.pending.size, 0);
});
