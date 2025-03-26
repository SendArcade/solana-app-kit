// File: src/screens/SampleUI/Threads/OtherProfileScreen/OtherProfileScreen.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Platform, Alert, ActivityIndicator, Text } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../../../navigation/RootNavigator';
import { useAppDispatch, useAppSelector } from '../../../../hooks/useReduxHooks';
import { fetchUserProfile } from '../../../../state/auth/reducer';
import Profile from '../../../../components/Profile/profile';
import { ThreadPost } from '../../../../components/thread/thread.types';
import { fetchAllPosts } from '../../../../state/thread/reducer';
import { NftItem, useFetchNFTs } from '../../../../hooks/useFetchNFTs';
import COLORS from '../../../../assets/colors';

type OtherProfileRouteProp = RouteProp<RootStackParamList, 'OtherProfile'>;

export default function OtherProfileScreen() {
  const route = useRoute<OtherProfileRouteProp>();
  const { userId } = route.params; // The user's wallet address or ID from the route
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  // Get current wallet provider from Redux
  const provider = useAppSelector(state => state.auth.provider);
  const myWallet = useAppSelector(state => state.auth.address);

  // Data from Redux
  const allPosts = useAppSelector(state => state.thread.allPosts);
  const [myPosts, setMyPosts] = useState<ThreadPost[]>([]);
  const [username, setUsername] = useState('Loading...');
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [attachmentData, setAttachmentData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if the user we're trying to view is ourselves
  const isOwnProfile = useMemo(() => {
    if (!myWallet || !userId) return false;
    return myWallet.toLowerCase() === userId.toLowerCase();
  }, [myWallet, userId]);

  // If it's our own profile, redirect to ProfileScreen
  useEffect(() => {
    if (isOwnProfile) {
      navigation.navigate('ProfileScreen' as never);
    }
  }, [isOwnProfile, navigation]);

  // Fetch user profile from server (like we do in ProfileScreen)
  useEffect(() => {
    if (!userId) {
      setError('No user ID provided');
      setLoading(false);
      return;
    }
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const profileData = await dispatch(fetchUserProfile(userId)).unwrap();
        
        if (profileData.profilePicUrl) {
          console.log('Fetched profilePicUrl:', profileData);
          setProfilePicUrl(profileData.profilePicUrl);
        }
        if (profileData.username) {
          setUsername(profileData.username);
        }
        if (profileData.attachmentData) {
          setAttachmentData(profileData.attachmentData);
        }
      } catch (err: any) {
        console.warn('Failed to fetch user profile for other user:', err);
        setError(`Couldn't load profile data: ${err.message || 'Unknown error'}`);
        // Don't show the error to the user, just set default values
        setUsername('Unknown User');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId, dispatch, provider]); // Add provider dependency to refetch when wallet provider changes

  // Fetch all posts so we can filter
  useEffect(() => {
    dispatch(fetchAllPosts()).catch(err => {
      console.warn('Failed to fetch posts:', err);
    });
  }, [dispatch]);

  // Filter posts belonging to userId
  useEffect(() => {
    if (!userId) {
      setMyPosts([]);
      return;
    }
    
    try {
      const userPosts = allPosts.filter(
        p => p.user?.id?.toLowerCase() === userId.toLowerCase(),
      );
      // sort by createdAt desc
      userPosts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      setMyPosts(userPosts);
    } catch (error) {
      console.error('Error filtering posts:', error);
      setMyPosts([]);
    }
  }, [allPosts, userId]);

  // Custom useFetchNFTs hook with error handling for Dynamic wallet
  const { 
    nfts, 
    loading: loadingNfts, 
    error: nftsError 
  } = useFetchNFTs(userId, { providerType: provider });

  // Show a loading spinner while profile data is being fetched
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1d9bf0" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Show error message if something went wrong
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        Platform.OS === 'android' && styles.androidSafeArea,
      ]}>
      <Profile
        isOwnProfile={false}
        user={{
          address: userId,
          profilePicUrl: profilePicUrl || '',
          username: username,
          attachmentData: attachmentData,
        }}
        posts={myPosts}
        nfts={nfts}
        loadingNfts={loadingNfts || loading}
        fetchNftsError={nftsError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  androidSafeArea: {
    paddingTop: 30,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    padding: 20,
  },
});
