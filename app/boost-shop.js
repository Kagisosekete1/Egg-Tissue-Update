import React from 'react';
import { Redirect } from 'expo-router';

export default function BoostShopRedirect() {
  return <Redirect href={{ pathname: '/(tabs)/shop', params: { section: 'boost' } }} />;
}
