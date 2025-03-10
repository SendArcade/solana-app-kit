// File: src/screens/SampleUI/Threads/OtherProfileScreen/OtherProfileScreen.tsx
import React, {useEffect, useState, useMemo} from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import {useRoute, RouteProp, useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../../../../navigation/RootNavigator';
import {useAppDispatch, useAppSelector} from '../../../../hooks/useReduxHooks';
import {fetchUserProfile} from '../../../../state/auth/reducer';
import Profile from '../../../../components/Profile/profile';
import {ThreadPost} from '../../../../components/thread/thread.types';
import {fetchAllPosts} from '../../../../state/thread/reducer';
import {NftItem, useFetchNFTs} from '../../../../hooks/useFetchNFTs';
import COLORS from '../../../../assets/colors';

type OtherProfileRouteProp = RouteProp<RootStackParamList, 'OtherProfile'>;

export default function OtherProfileScreen() {
  const route = useRoute<OtherProfileRouteProp>();
  const {userId} = route.params; // The user's wallet address or ID from the route
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  // Data from Redux
  const allPosts = useAppSelector(state => state.thread.allPosts);
  const [myPosts, setMyPosts] = useState<ThreadPost[]>([]);
  const [username, setUsername] = useState('Loading...');
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);

  // Fetch user profile from server (like we do in ProfileScreen)
  useEffect(() => {
    if (!userId) return;
    dispatch(fetchUserProfile(userId))
      .unwrap()
      .then(value => {
        if (value.profilePicUrl) {
          setProfilePicUrl(value.profilePicUrl);
        }
        if (value.username) {
          setUsername(value.username);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch user profile for other user:', err);
      });
  }, [userId, dispatch]);

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
    const userPosts = allPosts.filter(
      p => p.user.id.toLowerCase() === userId.toLowerCase(),
    );
    // sort by createdAt desc
    userPosts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    setMyPosts(userPosts);
  }, [allPosts, userId]);

  // Also fetch NFTs using the custom hook
  const {nfts, loading: loadingNfts, error: nftsError} = useFetchNFTs(userId);

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
        }}
        posts={myPosts}
        nfts={nfts}
        loadingNfts={loadingNfts}
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
});
