import { supabase } from './supabase';

export async function loadPowerupInventory(userId) {
  if (!userId) return {};
  const { data, error } = await supabase.from('game_powerup_inventory')
    .select('powerup_type,quantity').eq('user_id', userId);
  if (error) throw error;
  return Object.fromEntries((data || []).map(row => [row.powerup_type, Number(row.quantity) || 0]));
}

export async function purchasePowerup(powerupType, requestId) {
  const { data, error } = await supabase.rpc('purchase_game_powerup', {
    p_powerup_type: powerupType, p_request_id: requestId,
  });
  if (error) throw error;
  return data;
}

export async function consumePowerup(powerupType, gameId, actionId) {
  const { data, error } = await supabase.rpc('consume_game_powerup', {
    p_powerup_type: powerupType, p_game_id: gameId, p_action_id: actionId,
  });
  if (error) throw error;
  return data;
}
