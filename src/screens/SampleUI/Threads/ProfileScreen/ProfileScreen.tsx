/*
  FILE: src/screens/SampleUI/Threads/ProfileScreen/ProfileScreen.tsx
  TYPE: Modified (entire file)
*/

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {styles} from './ProfileScreen.styles';
import {useAppSelector} from '../../../../hooks/useReduxHooks';
import {ThreadPost} from '../../../../components/thread/thread.types';
import ProfileIcons from '../../../../assets/svgs';

const CURRENT_USER_ID = 'user-1'; // example

export default function ProfileScreen() {
  const {allPosts} = useAppSelector(state => state.thread);
  const [myPosts, setMyPosts] = useState<ThreadPost[]>([]);

  useEffect(() => {
    const userPosts = allPosts.filter(p => p.user.id === CURRENT_USER_ID);
    userPosts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    setMyPosts(userPosts);
  }, [allPosts]);

  const renderPostItem = ({item}: {item: ThreadPost}) => {
    const firstTextSection = item.sections.find(s => !!s.text)?.text;
    return (
      <View style={styles.postItemContainer}>
        <Image source={item.user.avatar} style={styles.postItemAvatar} />
        <View style={styles.postItemContent}>
          <View style={styles.postHeaderRow}>
            <Text style={styles.postUsername}>{item.user.username}</Text>
            <Text style={styles.postHandle}>{item.user.handle}</Text>
          </View>
          {item.parentId ? (
            <Text style={styles.replyNote}>Replying to {item.parentId}</Text>
          ) : null}
          {firstTextSection && (
            <Text style={styles.postText}>{firstTextSection}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top banner area */}
      <View style={styles.bannerContainer}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?fit=crop&w=1200&q=80',
          }}
          style={styles.bannerImage}
        />
      </View>

      {/* Profile header area */}
      <View style={styles.profileHeaderContainer}>
        {/* Avatar overlaps the banner slightly */}
        <View style={styles.profileAvatarWrapper}>
          <Image
            source={require('../../../../assets/images/User.png')}
            style={styles.profileAvatar}
          />
        </View>

        <View style={styles.profileTextInfo}>
          <Text style={styles.profileUsername}>Alice</Text>
          <View style={styles.usernameRow}>
            <Text style={styles.profileHandle}>@aliceSmith</Text>
            <ProfileIcons.BlueCheck
              width={14}
              height={14}
              style={styles.verifiedIcon}
            />
          </View>
          <Text style={styles.profileBio}>
            Explorer, builder, and #Solana advocate. Sharing my journey in web3.
            Opinions are my own. Wagmi, frens.
          </Text>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.editProfileBtn}>
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>42</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>98</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
        </View>
      </View>

      {/* Post list */}
      <FlatList
        data={myPosts}
        keyExtractor={post => post.id}
        renderItem={renderPostItem}
        ListEmptyComponent={
          <View style={styles.noPostContainer}>
            <Text style={styles.noPostText}>
              You haven&apos;t posted or replied yet!
            </Text>
          </View>
        }
        style={{flex: 1}}
        contentContainerStyle={styles.flatListContent}
      />
    </SafeAreaView>
  );
}
