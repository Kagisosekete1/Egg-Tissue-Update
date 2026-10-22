import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// rules.js is Metro-transformed by the app, so load its dependency-free ES
// source from a data module for this small Node smoke-test runner.
const rulesSource = await readFile(new URL('../src/game/rules.js', import.meta.url), 'utf8');
const { applySpray, createGame, nextSprayWouldFall, nextTurn, randomDie } = await import(
  `data:text/javascript;base64,${Buffer.from(rulesSource).toString('base64')}`
);

const base = createGame({ mode: 'computer', difficulty: 'normal', gameMode: 'classic' });
const nearFall = { ...base, threshold: 10, damage: 9.5, current: 2, roll: 1, sprayed: 0, phase: 'spraying' };

assert.equal(nextSprayWouldFall(nearFall), true, 'a lethal spray is recognized before it happens');
const blocked = applySpray(nearFall, true);
assert.equal(blocked.phase, 'waiting', 'a blocked final spray completes its turn');
assert.equal(blocked.damage, nearFall.damage, 'a shield cancels the lethal damage');
assert.equal(blocked.lastShieldBlock, true, 'the game marks a shield activation for its effect');
assert.equal(blocked.sprayed, 1, 'the blocked spray still uses the rolled spray');
assert.equal(nextTurn(blocked).lastShieldBlock, false, 'the shield flash resets on the next turn');

const safeSpray = { ...nearFall, damage: 9.2 };
assert.equal(nextSprayWouldFall(safeSpray), false, 'nonlethal sprays do not consume shield durability');
const safeResult = applySpray(safeSpray, true);
assert.equal(safeResult.lastShieldBlock, false, 'nonlethal sprays are not treated as shield blocks');
assert.ok(Math.abs(safeResult.damage - 9.9) < 1e-9, 'normal nonlethal damage is preserved');

const unprotected = applySpray(nearFall, false);
assert.equal(unprotected.phase, 'over', 'a missing or exhausted shield keeps the original loss rule');
assert.equal(unprotected.lastShieldBlock, false, 'an unprotected fall does not show a shield effect');

assert.notEqual(randomDie(5, () => 0), 5, 'the next die roll does not repeat the previous value');
assert.notEqual(randomDie(1, () => 0.999999), 1, 'the upper end of the random range also avoids a repeat');

const migration = await readFile(new URL('../supabase/migrations/007_username_and_game_shields.sql', import.meta.url), 'utf8');
assert.match(migration, /when 'basic' then price:=5000; hits:=1;/, 'Basic Shield price and durability are server configured');
assert.match(migration, /when 'golden' then price:=10000; hits:=2;/, 'Golden Shield price and durability are server configured');
assert.match(migration, /when 'super' then price:=20000; hits:=3;/, 'Super Shield price and durability are server configured');
assert.match(migration, /if balance < price then raise exception 'Not enough points'; end if;/, 'insufficient balances are rejected server-side');
assert.match(migration, /points=points-price/, 'points are deducted transactionally only when the purchase proceeds');

console.log('Shield gameplay and migration smoke tests passed.');
