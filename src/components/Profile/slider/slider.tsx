// FILE: src/components/Profile/slider/slider.tsx

import React, {memo, useState, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';
import {ThreadPost} from '../../thread/thread.types';
import Collectibles, {NftItem} from '../collectibles/collectibles';
import {PostHeader, PostBody, PostFooter} from '../../thread';
import {styles, tabBarStyles} from './slider.style';
import ActionsPage from '../actions/ActionsPage';
import {useAppDispatch, useAppSelector} from '../../../hooks/useReduxHooks';
import {deletePostAsync} from '../../../state/thread/reducer';
import {AssetItem, PortfolioData} from '../../../hooks/useFetchTokens';

/**
 * Props for the swipeable tabs used on the Profile screen.
 */
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

// Create a loading placeholder for lazy loading
const renderLazyPlaceholder = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <ActivityIndicator size="large" color="#1d9bf0" />
  </View>
);

/**
 * A simple list of the user's posts.
 */
function PostPage({
  myPosts,
  onPressPost,
  externalRefreshTrigger,
}: {
  myPosts: ThreadPost[];
  onPressPost?: (post: ThreadPost) => void;
  externalRefreshTrigger?: number;
}) {
  const dispatch = useAppDispatch();
  const [editingPost, setEditingPost] = React.useState<ThreadPost | null>(null);
  const userWallet = useAppSelector(state => state.auth.address);

  const handleDeletePost = (post: ThreadPost) => {
    if (post.user.id !== userWallet) {
      alert('You are not the owner of this post.');
      return;
    }
    dispatch(deletePostAsync(post.id));
  };

  const handleEditPost = (post: ThreadPost) => {
    if (post.user.id !== userWallet) {
      alert('You are not the owner of this post.');
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
          {/**
           * NOTE: The key fix for the chart’s PanResponder conflict is below in the TabView
           * (swipeEnabled={false}), so the user can smoothly hover inside the chart.
           */}
          <PostBody
            post={item}
            externalRefreshTrigger={externalRefreshTrigger}
          />
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

/**
 * A page displaying collectibles or portfolio items.
 */
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
  // If portfolio data is provided, use that instead of the older NFT approach
  const hasPortfolioData =
    portfolioData?.items && portfolioData.items.length > 0;

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

/**
 * The main tab-swipe container on the Profile screen: shows Posts, Portfolio, Actions
 */
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

  // Increment a counter each time we come back to the Posts tab (so any charts can refresh).
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleIndexChange = (newIndex: number) => {
    setIndex(newIndex);
    if (newIndex === 0) {
      setRefreshCounter(prev => prev + 1);
    }
  };

  // Memoize sub-components so they don't re-render unnecessarily
  const PostScene = useMemo(
    () => () =>
      (
        <PostPage
          myPosts={myPosts}
          onPressPost={onPressPost}
          externalRefreshTrigger={refreshCounter}
        />
      ),
    [myPosts, onPressPost, refreshCounter],
  );

  const CollectiblesScene = useMemo(
    () => () =>
      (
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
    [
      myNFTs,
      loadingNfts,
      fetchNftsError,
      portfolioData,
      onRefreshPortfolio,
      refreshingPortfolio,
      onAssetPress,
    ],
  );

  const ActionsScene = useMemo(
    () => () =>
      (
        <ActionsPage
          myActions={myActions}
          loadingActions={loadingActions}
          fetchActionsError={fetchActionsError}
        />
      ),
    [myActions, loadingActions, fetchActionsError],
  );

  const renderScene = useMemo(
    () =>
      SceneMap({
        posts: PostScene,
        collectibles: CollectiblesScene,
        actions: ActionsScene,
      }),
    [PostScene, CollectiblesScene, ActionsScene],
  );

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
        onIndexChange={handleIndexChange}
        renderTabBar={renderTabBar}
        // Key fix: Disables horizontal swipe gestures so the chart’s PanResponder
        // does not conflict with the tab swipes.
        swipeEnabled={false}
        lazy
        lazyPreloadDistance={0}
        renderLazyPlaceholder={renderLazyPlaceholder}
        removeClippedSubviews={false}
        initialLayout={{width: 300, height: 300}}
      />
    </View>
  );
}

export default memo(SwipeTabs, (prevProps, nextProps) => {
  // Compare post arrays by length and IDs:
  if (prevProps.myPosts.length !== nextProps.myPosts.length) return false;
  for (let i = 0; i < prevProps.myPosts.length; i++) {
    if (prevProps.myPosts[i].id !== nextProps.myPosts[i].id) return false;
  }

  // Compare NFT arrays by reference only
  if (prevProps.myNFTs !== nextProps.myNFTs) return false;

  // Compare simple props
  if (prevProps.loadingNfts !== nextProps.loadingNfts) return false;
  if (prevProps.fetchNftsError !== nextProps.fetchNftsError) return false;
  if (prevProps.onPressPost !== nextProps.onPressPost) return false;

  // Compare actions just by length
  if (prevProps.myActions?.length !== nextProps.myActions?.length) return false;
  if (prevProps.loadingActions !== nextProps.loadingActions) return false;
  if (prevProps.fetchActionsError !== nextProps.fetchActionsError) return false;

  // Compare portfolio references
  if (prevProps.portfolioData !== nextProps.portfolioData) return false;
  if (prevProps.onRefreshPortfolio !== nextProps.onRefreshPortfolio)
    return false;
  if (prevProps.refreshingPortfolio !== nextProps.refreshingPortfolio)
    return false;
  if (prevProps.onAssetPress !== nextProps.onAssetPress) return false;

  return true;
});
