// File: src/components/Profile/slider/slider.tsx
import React, {memo, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, Alert} from 'react-native';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';
import {ThreadPost} from '../../thread/thread.types';
import Collectibles, {NftItem} from '../collectibles/collectibles';
import {PostHeader, PostBody, PostFooter} from '../../thread';
import {styles, tabBarStyles} from './slider.style';
import ActionsPage from '../actions/ActionsPage';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import { deletePostAsync } from '../../../state/thread/reducer';
import { AssetItem, PortfolioData } from '../../../hooks/useFetchTokens';

type SwipeTabsProps = {
  myPosts: ThreadPost[];
  myNFTs: NftItem[];
  loadingNfts?: boolean;
  fetchNftsError?: string | null;
  myActions: any[];
  loadingActions?: boolean;
  fetchActionsError?: string | null;
  onPressPost?: (post: ThreadPost) => void;
  portfolioData?: PortfolioData;
  onRefreshPortfolio?: () => void;
  refreshingPortfolio?: boolean;
  onAssetPress?: (asset: AssetItem) => void;
};

function PostPage({
  myPosts,
  onPressPost,
}: {
  myPosts: ThreadPost[];
  onPressPost?: (post: ThreadPost) => void;
}) {
  const dispatch = useAppDispatch();
  const [editingPost, setEditingPost] = useState<ThreadPost | null>(null);
  const userWallet = useAppSelector(state => state.auth.address);
  const handleDeletePost = (post: ThreadPost) => {
    if (post.user.id !== userWallet) {
      Alert.alert('Cannot Delete', 'You are not the owner of this post.');
      return;
    }
    dispatch(deletePostAsync(post.id));
  };

  const handleEditPost = (post: ThreadPost) => {
    if (post.user.id !== userWallet) {
      Alert.alert('Cannot Edit', 'You are not the owner of this post.');
      return;
    }
    setEditingPost(post);
  };

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

        {/* Entire post clickable if you like: */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            onPressPost?.(item);
          }}>
          <PostHeader
            post={item}
            onDeletePost={handleDeletePost}
            onEditPost={handleEditPost}
          />
          <PostBody post={item} />
          <PostFooter post={item} />
        </TouchableOpacity>
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
  portfolioData,
  onRefresh,
  refreshing,
  onAssetPress,
}: {
  nfts: NftItem[];
  loading?: boolean;
  fetchNftsError?: string | null;
  portfolioData?: PortfolioData;
  onRefresh?: () => void;
  refreshing?: boolean;
  onAssetPress?: (asset: AssetItem) => void;
}) {
  return (
    <View style={styles.tabContent}>
      <Collectibles 
        nfts={nfts} 
        loading={loading} 
        error={fetchNftsError} 
        portfolioItems={portfolioData?.items}
        nativeBalance={portfolioData?.nativeBalance?.lamports}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onItemPress={onAssetPress}
      />
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
  portfolioData,
  onRefreshPortfolio,
  refreshingPortfolio,
  onAssetPress,
}: SwipeTabsProps) {
  const [index, setIndex] = useState<number>(0);
  const [routes] = useState([
    {key: 'posts', title: 'Posts'},
    {key: 'collectibles', title: 'Portfolio'},
    {key: 'actions', title: 'Actions'},
  ]);
  
  const renderScene = SceneMap({
    posts: () => <PostPage myPosts={myPosts} onPressPost={onPressPost} />,
    collectibles: () => (
      <CollectiblesPage
        nfts={myNFTs}
        loading={loadingNfts}
        fetchNftsError={fetchNftsError}
        portfolioData={portfolioData}
        onRefresh={onRefreshPortfolio}
        refreshing={refreshingPortfolio}
        onAssetPress={onAssetPress}
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
