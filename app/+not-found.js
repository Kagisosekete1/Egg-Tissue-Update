import React from 'react';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { C } from '../src/components/ui';

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 }}>
      <Text style={{ color: C.ink, fontSize: 24, fontWeight: '900', textAlign: 'center' }}>Egg & Wet Tissue</Text>
      <Text style={{ color: C.muted, fontSize: 16, textAlign: 'center' }}>That screen isn’t available. Return to the game to continue.</Text>
      <Link href="/" asChild>
        <Pressable style={{ minHeight: 50, paddingHorizontal: 22, borderRadius: 18, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#08336e', fontWeight: '900', fontSize: 15 }}>Return to game</Text>
        </Pressable>
      </Link>
    </View>
  );
}
