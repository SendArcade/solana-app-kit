// File: src/components/Profile/slider/slider.tsx
import React, {memo, useState} from 'react';
import {View, Text, FlatList} from 'react-native';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';
import {ThreadPost} from '../../thread/thread.types';
import Collectibles, {NftItem} from '../collectibles/collectibles';
import {PostHeader, PostBody, PostFooter} from '../../thread';
import {styles, tabBarStyles} from './slider.style';
import ActionsPage from './ActionsPage';

type SwipeTabsProps = {
  myPosts: ThreadPost[];
  myNFTs: NftItem[];
  loadingNfts?: boolean;
  fetchNftsError?: string | null;
  myActions: any[];
  loadingActions?: boolean;
  fetchActionsError?: string | null;
  onPressPost?: (post: ThreadPost) => void;
};

function PostPage({
  myPosts,
  onPressPost,
}: {
  myPosts: ThreadPost[];
  onPressPost?: (post: ThreadPost) => void;
}) {
  if (!myPosts || myPosts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No posts yet!</Text>
      </View>
    );
  }
  
  const renderPost = ({item}: {item: ThreadPost}) => {
    const isReply = !!item.parentId;
    return (
      <View style={styles.postCard}>
        {isReply && <Text style={styles.replyLabel}>Reply Post</Text>}
        <View>
          <PostHeader post={item} />
          <PostBody post={item} />
          <PostFooter post={item} />
        </View>
      </View>
    );
  };
  
  return (
    <FlatList
      data={myPosts}
      renderItem={renderPost}
      keyExtractor={p => p.id}
      contentContainerStyle={styles.postList}
    />
  );
}

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

function SwipeTabs({
  myPosts,
  myNFTs,
  loadingNfts,
  fetchNftsError,
  myActions,
  loadingActions,
  fetchActionsError,
  onPressPost,
}: SwipeTabsProps) {
  const [index, setIndex] = useState<number>(0);
  const [routes] = useState([
    {key: 'posts', title: 'Posts'},
    {key: 'collectibles', title: 'Collectibles'},
    {key: 'actions', title: 'Actions'},
  ]);
  
  const renderScene = SceneMap({
    posts: () => <PostPage myPosts={myPosts} onPressPost={onPressPost} />,
    collectibles: () => (
      <CollectiblesPage
        nfts={myNFTs}
        loading={loadingNfts}
        fetchNftsError={fetchNftsError}
      />
    ),
    actions: () => (
      <ActionsPage
        myActions={myActions}
        loadingActions={loadingActions}
        fetchActionsError={fetchActionsError}
      />
    ),
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
        lazy
        style={styles.tabView}
      />
    </View>
  );
}

export default memo(SwipeTabs);
