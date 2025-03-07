// FILE: src/components/Profile/slider/slider.tsx
import React, {memo, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';

import {ThreadPost} from '../../thread/thread.types';
import {PostHeader, PostBody, PostFooter} from '../../thread';
import Collectibles, {NftItem} from '../collectibles/collectibles';

import {styles, tabBarStyles} from './slider.style';

type SwipeTabsProps = {
  /** The user's array of posts (flattened or not) */
  myPosts: ThreadPost[];

  /** The user's array of NFTs. */
  myNFTs: NftItem[];

  /** Whether the NFT data is loading. */
  loadingNfts?: boolean;

  /** NFT fetch error message (if any). */
  fetchNftsError?: string | null;

  /** Callback to refresh posts. */
  onRefreshPosts?: () => void;
  /** Whether posts data is refreshing. */
  refreshingPosts?: boolean;

  /** Callback to refresh NFTs. */
  onRefreshNfts?: () => void;
  /** Whether NFTs data is refreshing. */
  refreshingNfts?: boolean;

  /**
   * **New:** Fired when a post is pressed (or the “Reply Post” label is pressed).
   */
  onPressPost?: (post: ThreadPost) => void;
};

/**
 * Renders the user's posts in a FlatList.
 */
function PostPage({
  myPosts,
  onRefresh,
  refreshing,
  onPressPost,
}: {
  myPosts: ThreadPost[];
  onRefresh?: () => void;
  refreshing?: boolean;
  onPressPost?: (post: ThreadPost) => void;
}) {
  const [localRefreshing, setLocalRefreshing] = useState(false);

  const handleLocalRefresh = () => {
    setLocalRefreshing(true);
    setTimeout(() => {
      setLocalRefreshing(false);
    }, 800);
  };

  const finalRefreshing =
    refreshing !== undefined ? refreshing : localRefreshing;
  const finalOnRefresh =
    onRefresh !== undefined ? onRefresh : handleLocalRefresh;

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
        {isReply ? (
          <TouchableOpacity
            onPress={() => {
              if (onPressPost) {
                onPressPost(item);
              }
            }}>
            <Text style={styles.replyLabel}>Reply Post</Text>
          </TouchableOpacity>
        ) : null}

        <PostHeader post={item} />
        <PostBody post={item} />
        <PostFooter
          post={item}
          onPressComment={() => {
            // No-op or open a composer for replying
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
      refreshing={finalRefreshing}
      onRefresh={finalOnRefresh}
    />
  );
}

/**
 * Renders the user's NFT collectibles.
 */
function CollectiblesPage({
  nfts,
  loading,
  fetchNftsError,
  onRefresh,
  refreshing,
}: {
  nfts: NftItem[];
  loading?: boolean;
  fetchNftsError?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <View style={styles.tabContent}>
      <Collectibles
        nfts={nfts}
        loading={loading}
        error={fetchNftsError}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    </View>
  );
}

/**
 * Placeholder for the "Actions" tab.
 */
function ActionsPage() {
  return (
    <View style={[styles.tabContent, styles.centered]}>
      <Text style={styles.emptyText}>No Actions defined yet.</Text>
    </View>
  );
}

/**
 * Main component with tab navigation for "Posts", "Collectibles" and "Actions".
 */
function SwipeTabs({
  myPosts,
  myNFTs,
  loadingNfts,
  fetchNftsError,
  onRefreshPosts,
  refreshingPosts,
  onRefreshNfts,
  refreshingNfts,
  onPressPost,
}: SwipeTabsProps) {
  const [index, setIndex] = useState<number>(0);
  const [routes] = useState([
    {key: 'posts', title: 'Posts'},
    {key: 'collectibles', title: 'Collectibles'},
    {key: 'actions', title: 'Actions'},
  ]);

  const renderScene = SceneMap({
    posts: () => (
      <PostPage
        myPosts={myPosts}
        onRefresh={onRefreshPosts}
        refreshing={refreshingPosts}
        onPressPost={onPressPost}
      />
    ),
    collectibles: () => (
      <CollectiblesPage
        nfts={myNFTs}
        loading={loadingNfts}
        fetchNftsError={fetchNftsError}
        onRefresh={onRefreshNfts}
        refreshing={refreshingNfts}
      />
    ),
    actions: ActionsPage,
  });

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
        swipeEnabled
        tabBarPosition="top"
        initialLayout={{width: 400}}
        style={styles.tabView}
        lazy
      />
    </View>
  );
}

export default memo(SwipeTabs);
