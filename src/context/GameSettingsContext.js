import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'egg-game-settings-v1';
const DEFAULTS = { mode: 'computer', player1: '', player2: 'Player 2', difficulty: 'normal', gameMode: 'classic', countryCode: 'ZA', soundEnabled: true };
const SettingsContext = createContext(null);

export function GameSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((value) => {
      if (value) setSettings({ ...DEFAULTS, ...JSON.parse(value) });
    }).catch(() => {}).finally(() => setReady(true));
  }, []);
  const update = useCallback(patch=>setSettings(previous=>({...previous,...patch})),[]);
  useEffect(()=>{if(ready)AsyncStorage.setItem(KEY,JSON.stringify(settings)).catch(()=>{});},[settings,ready]);
  const value = useMemo(() => ({ settings, update, ready }), [settings, update, ready]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
export function useGameSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useGameSettings must be used inside GameSettingsProvider');
  return value;
}
