import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { ensureGameProfile, loadProfile, syncPendingResults } from '../lib/profiles';

const ProfileContext=createContext({profile:null,refreshProfile:async()=>{}});
export function ProfileProvider({children}) {
  const {user}=useAuth(); const [loaded,setLoaded]=useState({userId:null,profile:null});
  const profile=loaded.userId===user?.id?loaded.profile:null;
  const refreshProfile=useCallback(async()=>{
    if(!user?.id)return null;
    await ensureGameProfile(user); const next=await loadProfile(user.id,user);
    setLoaded({userId:user.id,profile:next}); await AsyncStorage.setItem(`egg-profile-${user.id}`,JSON.stringify(next)); return next;
  },[user]);
  useEffect(()=>{let active=true;if(!user?.id)return;
    (async()=>{const cached=await AsyncStorage.getItem(`egg-profile-${user.id}`);if(active&&cached)setLoaded({userId:user.id,profile:JSON.parse(cached)});await syncPendingResults(user.id);if(active)await refreshProfile();})().catch(()=>{});
    return()=>{active=false};
  },[user?.id,refreshProfile]);
  const value=useMemo(()=>({profile,refreshProfile}),[profile,refreshProfile]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
export function useProfile(){return useContext(ProfileContext);}
