import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Avatar, Button, Card, Flag, Header, Screen, Title, s, C } from '../src/components/ui';
import { countryName } from '../src/components/CountryPicker';
import { useAuth } from '../src/context/AuthContext';
import { loadProfile } from '../src/lib/profiles';
import { supabase } from '../src/lib/supabase';

export default function Profile(){
  const {id}=useLocalSearchParams(),{user}=useAuth();const [profile,setProfile]=useState(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  useFocusEffect(useCallback(()=>{let live=true;setLoading(true);loadProfile(id||user?.id,user).then(data=>{if(live)setProfile(data)}).catch(()=>{}).finally(()=>{if(live)setLoading(false)});return()=>{live=false};},[id,user]));
  async function challenge(){if(!profile||!user)return;setBusy(true);try{const {data,error}=await supabase.from('game_challenges').insert({challenger_id:user.id,challenged_id:profile.id}).select('id').single();if(error)throw error;await supabase.functions.invoke('send-challenge',{body:{challenge_id:data.id}});Alert.alert('Challenge sent','Your opponent can accept or decline your invitation.');router.push('/challenges');}catch(e){Alert.alert('Could not send challenge',e.message);}finally{setBusy(false)}}
  return <Screen><Header title="Player profile"/><Card style={{alignItems:'center',paddingVertical:26}}>{loading?<ActivityIndicator color={C.gold}/>:profile?<><Avatar uri={profile.avatar_url} size={136} square/><Title>{profile.username}</Title><View style={s.row}><Flag code={profile.country_code}/><Text style={s.muted}>{countryName(profile.country_code)}</Text></View><View style={{alignSelf:'stretch',flexDirection:'row',justifyContent:'space-around',padding:20,borderRadius:20,backgroundColor:C.pale}}><Text style={{color:C.gold,fontSize:25,fontWeight:'900',textAlign:'center'}}>{profile.points}{'\n'}<Text style={s.muted}>Points</Text></Text><Text style={{color:C.gold,fontSize:25,fontWeight:'900',textAlign:'center'}}>{profile.wins}{'\n'}<Text style={s.muted}>Wins</Text></Text></View>{profile.id===user?.id?<Text style={s.muted}>Edit your profile from Settings in the bottom navigation.</Text>:<Button title={busy?'Sending…':'Challenge player'} onPress={challenge} disabled={busy}/>}</>:<Text style={s.muted}>This player profile is not available. Please refresh the leaderboard and try again.</Text>}</Card></Screen>;
}
