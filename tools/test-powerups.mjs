import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/game/rules.js', import.meta.url), 'utf8');
const rules = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const { applyCounter, applyLuckyRoll, applyPowerup, applySpray, canUsePowerup, completeRoll, createGame, declineCounter, nextSprayWouldFall, POWERUP_CATALOG, TENSION_STEP } = rules;

const base = createGame({ mode: 'friend', difficulty: 'normal', gameMode: 'classic' });
const ready = { ...base, threshold: 10, damage: 0, current: 1, phase: 'ready' };
assert.equal(POWERUP_CATALOG.find(item => item.type === 'tension_boost').price, 500);

// Counter Attack gets first-class response state and restores the exact prior tension.
const attack = applyPowerup(ready, 'tension_boost');
assert.equal(attack.phase, 'counter');
assert.equal(attack.current, 2, 'the opponent receives the next turn');
assert.ok(Math.abs(attack.damage - (10 - TENSION_STEP * 2)) < 1e-9, 'one safe spray remains before a second is dangerous');
assert.equal(applyCounter(attack).damage, ready.damage, 'a counter cancels a pending boost');
assert.equal(declineCounter(attack).damage, attack.damage, 'declining the counter preserves the attack');
const maxDanger = { ...ready, damage: 10 - TENSION_STEP };
assert.equal(applyPowerup(maxDanger, 'pressure_blast'), maxDanger, 'attacks do not overflow the maximum danger state');

// The next normal spray sequence, not the attack itself, resolves a fall.
let next = completeRoll({ ...declineCounter(attack), gameMode: 'classic' }, 2, () => 0.5);
assert.equal(next.phase, 'spraying');
assert.equal(nextSprayWouldFall(next), false);
next = applySpray(next);
assert.equal(next.phase, 'spraying', 'the remaining safe spray can be used');
assert.equal(nextSprayWouldFall(next), true);
assert.equal(applySpray(next).phase, 'over', 'the next spray resolves the fall normally');

// The AI target is not dropped by attack activation; the following game action decides it.
const aiAttack = applyPowerup({ ...ready, mode: 'computer' }, 'pressure_blast');
assert.equal(aiAttack.phase, 'ready');
assert.equal(aiAttack.current, 2);
assert.ok(aiAttack.damage < aiAttack.threshold, 'an attack itself never ends the round');
const aiCounterable = applyPowerup({ ...ready, mode: 'computer', current: 2 }, 'tension_boost');
assert.equal(aiCounterable.phase, 'counter', 'computer attacks offer a player response window');
assert.equal(aiCounterable.current, 1);
const escapeAgainstAttack = applyPowerup({ ...ready, mode: 'computer', current: 2, quickEscape: true, quickEscapeOwner: 1 }, 'pressure_blast');
assert.equal(escapeAgainstAttack.damage, ready.damage, 'Quick Escape also blocks an incoming pressure increase');
assert.equal(escapeAgainstAttack.pendingCounter, null, 'a blocked attack cannot open a redundant counter window');

// Emergency Stabilizer never goes below zero; Quick Escape protects exactly one own increase.
assert.equal(applyPowerup(ready, 'emergency_stabilizer'), ready, 'there is no charge for a no-op stabilization');
const stabilized = applyPowerup({ ...ready, damage: 1.1 }, 'emergency_stabilizer');
assert.equal(stabilized.damage, 1.1 - TENSION_STEP);
const escape = applyPowerup(ready, 'quick_escape');
const protectedGame = { ...escape, threshold: 10, damage: 9.7, roll: 1, lastRoll: 1, phase: 'spraying' };
assert.equal(nextSprayWouldFall(protectedGame), false, 'quick escape prevents a shield from being needlessly consumed');
const escapedSpray = applySpray(protectedGame);
assert.equal(escapedSpray.damage, 9.7);
assert.equal(escapedSpray.quickEscape, false, 'the protection is consumed once');

// Lucky Roll consumes only before the first spray and does not create extra actions.
const rolled = completeRoll({ ...ready, mode: 'computer', lastRoll: 6 }, 6, () => 0.5);
const rerolled = applyLuckyRoll(rolled, 3);
assert.equal(rerolled.roll, 3);
assert.equal(rerolled.luckyUsed, true);
assert.equal(applyLuckyRoll(rerolled, 4), rerolled, 'a second reroll in the same turn is rejected');
assert.equal(canUsePowerup({ ...rolled, sprayed: 1 }, 'lucky_roll'), false);

// The future cash store remains absent; the current catalog contains point prices only.
const migration = await readFile(new URL('../supabase/migrations/008_game_powerups.sql', import.meta.url), 'utf8');
for (const [type, price] of [['tension_boost',500],['pressure_blast',1000],['emergency_stabilizer',750],['quick_escape',1500],['counter_attack',1000],['lucky_roll',750]]) {
  assert.match(migration, new RegExp(`when '${type}' then price:=${price};`), `${type} has a server-side gameplay-point price`);
}
assert.match(migration, /points=points-price/, 'point deductions happen in the purchase transaction');
assert.match(migration, /if balance < price then raise exception 'Not enough points'; end if;/, 'insufficient point purchases are rejected');
assert.match(migration, /where p\.id=auth\.uid\(\) for update/, 'concurrent purchases serialize against the server points row');
assert.match(migration, /primary key \(user_id,game_id,action_id\)/, 'power-up uses have an idempotency key');
assert.doesNotMatch(migration, /R25|checkout|google_play_billing|store_purchase/i, 'the migration contains no paid store integration');

const scene = await readFile(new URL('../src/game/originalScene.js', import.meta.url), 'utf8');
for (const variant of ['wobble','spin','bounce','dizzy','confetti']) assert.ok(scene.includes(`'${variant}'`), `${variant} fall presentation is supported`);
assert.match(scene, /function crash\(\)[\s\S]*?onImpact\(\)/, 'the original floor-impact callback remains in the fall path');

console.log('Power-up rules and Supabase migration checks passed.');
