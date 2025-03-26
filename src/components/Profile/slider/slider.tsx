// File: src/components/Profile/slider/slider.tsx
import React, {memo, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, Alert, RefreshControl} from 'react-native';
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
  refreshing?: boolean;
  onRefresh?: () => void;
};

function PostPage({
  myPosts,
  onPressPost,
  refreshing,
  onRefresh,
}: {
  myPosts: ThreadPost[];
  onPressPost?: (post: ThreadPost) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
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
      refreshControl={
        <RefreshControl
          refreshing={refreshing || false}
          onRefresh={onRefresh}
          colors={['#1d9bf0']}
          tintColor="#1d9bf0"
        />
      }
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
  // If portfolio data is provided, use that instead of legacy nfts
  const hasPortfolioData = portfolioData?.items && portfolioData.items.length > 0;
  
  return (
    <View style={styles.tabContent}>
      <Collectibles 
        nfts={hasPortfolioData ? [] : nfts} 
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

function ActionsPageWrapper({
  myActions,
  loadingActions,
  fetchActionsError,
  refreshing,
  onRefresh,
}: {
  myActions: any[];
  loadingActions?: boolean;
  fetchActionsError?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <ActionsPage
      myActions={myActions}
      loadingActions={loadingActions}
      fetchActionsError={fetchActionsError}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
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
  refreshing,
  onRefresh,
}: SwipeTabsProps) {
  const [index, setIndex] = useState<number>(0);
  const [routes] = useState([
    {key: 'posts', title: 'Posts'},
    {key: 'collectibles', title: 'Portfolio'},
    {key: 'actions', title: 'Actions'},
  ]);
  
  const renderScene = SceneMap({
    posts: () => (
      <PostPage 
        myPosts={myPosts} 
        onPressPost={onPressPost} 
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    ),
    collectibles: () => (
      <CollectiblesPage
        nfts={myNFTs}
        loading={loadingNfts}
        fetchNftsError={fetchNftsError}
        portfolioData={portfolioData}
        onRefresh={onRefresh || onRefreshPortfolio}
        refreshing={refreshing || refreshingPortfolio}
        onAssetPress={onAssetPress}
      />
    ),
    actions: () => (
      <ActionsPageWrapper
        myActions={myActions}
        loadingActions={loadingActions}
        fetchActionsError={fetchActionsError}
        refreshing={refreshing}
        onRefresh={onRefresh}
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
