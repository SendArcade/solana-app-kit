import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, Image, SafeAreaView, Alert} from 'react-native';
import {styles} from './ProfileScreen.styles';
import { useAppSelector } from '../../../../hooks/useReduxHooks';
import { ThreadPost } from '../../../../components/thread/thread.types';
import WalletSlide from '../../../../components/WalletSlide/walletSlide';

/** Current user ID for demonstration */
const CURRENT_USER_ID = 'user-1';

export default function ProfileScreen() {
  const {allPosts} = useAppSelector(state => state.thread);
  const [myPosts, setMyPosts] = useState<ThreadPost[]>([]);

  useEffect(() => {
    const userPosts = allPosts.filter(post => post.user.id === CURRENT_USER_ID);
    userPosts.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    setMyPosts(userPosts);
  }, [allPosts]);

  const renderPostItem = ({item}: {item: ThreadPost}) => {
    return (
      <View style={styles.postItemContainer}>
        <Image source={item.user.avatar} style={styles.postItemAvatar} />
        <View style={styles.postItemContent}>
          <View style={styles.postHeaderRow}>
            <Text style={styles.postUsername}>{item.user.username}</Text>
            <Text style={styles.postHandle}>{item.user.handle}</Text>
          </View>
          {item.parentId && (
            <Text style={styles.replyNote}>Replied to: {item.parentId}</Text>
          )}
          {/* Show first text section, if any */}
          {item.sections.length > 0 && item.sections[0].text && (
            <Text style={styles.postText}>{item.sections[0].text}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <WalletSlide />
    </>
    // <SafeAreaView style={styles.container}>
    //   <View style={styles.profileHeaderContainer}>
    //     <View style={styles.profileInnerRow}>
    //       <View style={styles.profileAvatarBox}>
    //         <Image
    //           source={require('../../assets/images/User.png')}
    //           style={styles.profileAvatar}
    //         />
    //       </View>

    //       <View style={{flex: 1, marginLeft: 12}}>
    //         <View style={styles.profileNameRow}>
    //           <Text style={styles.profileUsername}>Alice</Text>
    //           <ProfileIcons.SubscriptionTick />
    //         </View>

    //         <View style={styles.handleFollowsRow}>
    //           <Text style={styles.profileHandle}>@aliceSmith</Text>
    //           <Text style={styles.profileFollowsYouBadge}>It’s you!</Text>
    //         </View>
    //       </View>
    //     </View>

    //     {/* Bio section (example) */}
    //     <Text style={styles.profileBio}>
    //       Lorem ipsum about me. I love building on Solana and exploring Web3.
    //       Based in @someLocation.
    //     </Text>

    //     {/* Stats row */}
    //     <View style={styles.profileStatsRow}>
    //       <View style={styles.profileStat}>
    //         <Text style={styles.statNumber}>42</Text>
    //         <Text style={styles.statLabel}>Followers</Text>
    //       </View>

    //       <View style={styles.profileStat}>
    //         <Text style={styles.statNumber}>89</Text>
    //         <Text style={styles.statLabel}>Following</Text>
    //       </View>

    //       <View style={styles.profileStatLocation}>
    //         <ProfileIcons.PinLocation width={16} height={16} />
    //         <Text style={styles.statLabel}>Mars</Text>
    //       </View>
    //     </View>

    //     <View style={styles.btnGrp}>
    //       <View style={styles.disabledBtn}>
    //         <Text style={styles.disabledBtnText}>Edit Profile</Text>
    //       </View>
    //       <View style={styles.disabledBtn}>
    //         <Text style={styles.disabledBtnText}>Send to Wallet</Text>
    //       </View>
    //     </View>
    //   </View>

    //   <FlatList
    //     data={myPosts}
    //     keyExtractor={post => post.id}
    //     renderItem={renderPostItem}
    //     ListEmptyComponent={
    //       <View style={styles.noPostContainer}>
    //         <Text style={styles.noPostText}>
    //           You haven't posted or replied yet!
    //         </Text>
    //       </View>
    //     }
    //     style={{flex: 1}}
    //     contentContainerStyle={styles.flatListContent}
    //   />
    // </SafeAreaView>
  );
}
