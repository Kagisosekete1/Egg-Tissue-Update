import React, { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import { Button, Card, Title, s } from './ui';
import { enableNotifications, initializeNotifications } from '../lib/notifications';

export function NotificationSettings(){
  const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false);
  useEffect(()=>{initializeNotifications();OneSignal.Notifications.getPermissionAsync().then(setEnabled).catch(()=>{});const listener=granted=>setEnabled(granted);OneSignal.Notifications.addEventListener('permissionChange',listener);return()=>OneSignal.Notifications.removeEventListener('permissionChange',listener);},[]);
  async function enable(){setBusy(true);try{const {granted}=await enableNotifications();setEnabled(granted);if(!granted)Alert.alert('Notifications are off','Allow notifications in your phone settings.');}catch{Alert.alert('Could not enable notifications','Please try again.');}finally{setBusy(false);}}
  return <Card><Title small>Notifications</Title>{enabled?<Text style={s.muted}>Notifications enabled</Text>:<Button title={busy?'Enabling…':'Enable notifications'} secondary onPress={enable} disabled={busy}/>}</Card>;
}
