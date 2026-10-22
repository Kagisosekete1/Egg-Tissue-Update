import React from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Screen, Title, s } from '../../src/components/ui';
import { NotificationSettings } from '../../src/components/NotificationSettings';

export default function Notifications() {
  return <Screen>
    <Title>Notifications</Title>
    <Card><Title small>Game invitations</Title><Text style={s.muted}>See who invited you, then accept or decline their challenge.</Text><Button title="Open challenges" onPress={() => router.push('/challenges')} /></Card>
    <NotificationSettings />
  </Screen>;
}
