import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Brand, Button, Card, Flag, Screen, Title, s, C } from '../../src/components/ui';
import { countryName } from '../../src/components/CountryPicker';
import { useAuth } from '../../src/context/AuthContext';
import { useProfile } from '../../src/context/ProfileContext';
import { usernameFor } from '../../src/lib/profiles';

export default function Home(){
  const {user}=useAuth(),{profile}=useProfile();
  return <Screen><Brand/><Card style={{alignItems:'center',paddingVertical:24}}>
    <Avatar uri={profile?.avatar_url||user?.user_metadata?.avatar_url} size={166} square/>
    <Title>{usernameFor(user,profile)}</Title><View style={s.row}><Flag code={profile?.country_code}/><Text style={s.muted}>{countryName(profile?.country_code||'ZA')}</Text></View>
    <View style={{flexDirection:'row',gap:40,paddingVertical:8}}><View style={{alignItems:'center'}}><Text style={{fontSize:30,color:C.gold,fontWeight:'900'}}>{profile?.points||0}</Text><Text style={s.muted}>POINTS</Text></View><View style={{alignItems:'center'}}><Text style={{fontSize:30,color:C.gold,fontWeight:'900'}}>{profile?.wins||0}</Text><Text style={s.muted}>WINS</Text></View></View>
    <Text style={[s.muted,{textAlign:'center'}]}>One worried egg. One wet tissue.{"\n"}How long can you keep it safe?</Text><View style={{alignSelf:'stretch',gap:12}}><Button title="▶  Start a game" onPress={()=>router.push('/game')}/><Button title="🏆  Leaderboard" secondary onPress={()=>router.push('/(tabs)/leaderboard')}/></View>
  </Card><Card><Title small>Play together</Title><Button title="Challenge a player" secondary onPress={()=>router.push('/(tabs)/leaderboard')}/><Button title="Your invitations" secondary onPress={()=>router.push('/challenges')}/></Card></Screen>;
}
