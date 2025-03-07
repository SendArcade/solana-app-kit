import React, {memo, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';

import {ThreadPost} from '../../thread/thread.types';
import {PostHeader, PostBody, PostFooter} from '../../thread';
import Collectibles, {NftItem} from '../collectibles/collectibles';

import {styles, tabBarStyles} from './slider.style';

type SwipeTabsProps = {
  /** The user’s array of posts. */
  myPosts: ThreadPost[];

  /** The user’s array of NFTs. */
  myNFTs: NftItem[];

  /** Whether the NFT data is loading. */
  loadingNfts?: boolean;

  /** If there was an error loading NFTs. */
  fetchNftsError?: string | null;
};

/**
 * Renders the user's posts in a FlatList with improved UI/UX.
 * We use PostHeader, PostBody, and PostFooter from the existing thread components.
 */
function PostPage({myPosts}: {myPosts: ThreadPost[]}) {
  if (!myPosts || myPosts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          You haven&apos;t posted or replied yet!
        </Text>
      </View>
    );
  }

  const renderPostItem = ({item}: {item: ThreadPost}) => {
    const isReply = !!item.parentId;

    return (
      <View style={styles.postCard}>
        {isReply && <Text style={styles.replyLabel}>Reply Post</Text>}
        <PostHeader
          post={item}
          // Optional: you could pass onDeletePost or onPressMenu if desired
        />
        <PostBody
          post={item}
          // Optionally pass styleOverrides or themeOverrides
        />
        <PostFooter
          post={item}
          // For a feed list, you might not handle new replies here, so:
          onPressComment={() => {
            // No-op or show a simple alert
          }}
        />
      </View>
    );
  };

  return (
    <FlatList
      data={myPosts}
      keyExtractor={post => post.id}
      renderItem={renderPostItem}
      contentContainerStyle={styles.postList}
    />
  );
}

/**
 * Renders the user’s NFT collectibles.
 */
function CollectiblesPage({
  nfts,
  loading,
  fetchNftsError,
}: {
  nfts: NftItem[];
  loading?: boolean;
  fetchNftsError?: string | null;
}) {
  return (
    <View style={styles.tabContent}>
      <Collectibles nfts={nfts} loading={loading} error={fetchNftsError} />
    </View>
  );
}

/**
 * Placeholder for the "Actions" tab (third tab).
 */
function ActionsPage() {
  return (
    <View style={[styles.tabContent, styles.centered]}>
      <Text style={styles.emptyText}>No Actions defined yet.</Text>
    </View>
  );
}

/**
 * Main component with tab navigation for "Posts", "Collectibles" and "Actions"
 */
function SwipeTabs({
  myPosts,
  myNFTs,
  loadingNfts,
  fetchNftsError,
}: SwipeTabsProps) {
  const [index, setIndex] = useState<number>(0);
  const [routes] = useState([
    {key: 'posts', title: 'Posts'},
    {key: 'collectibles', title: 'Collectibles'},
    {key: 'actions', title: 'Actions'},
  ]);

  // Scenes for each tab
  const renderScene = SceneMap({
    posts: () => <PostPage myPosts={myPosts} />,
    collectibles: () => (
      <CollectiblesPage
        nfts={myNFTs}
        loading={loadingNfts}
        fetchNftsError={fetchNftsError}
      />
    ),
    actions: ActionsPage,
  });

  // Custom tab bar with styling
  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      style={tabBarStyles.container}
      labelStyle={tabBarStyles.label}
      activeColor={tabBarStyles.activeColor}
      inactiveColor={tabBarStyles.inactiveColor}
      indicatorStyle={tabBarStyles.indicator}
    />
  );

  return (
    <View style={styles.tabView}>
      <TabView
        navigationState={{index, routes}}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={renderTabBar}
        swipeEnabled={true}
        tabBarPosition="top"
        initialLayout={{width: 400}}
        style={styles.tabView}
        lazy
      />
    </View>
  );
}

export default memo(SwipeTabs);
