import React from 'react';
import { Redirect } from 'expo-router';

export default function ShieldShopRedirect() {
  return <Redirect href={{ pathname: '/(tabs)/shop', params: { section: 'shield' } }} />;
}
