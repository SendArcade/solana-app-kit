import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Collectibles from '../collectibles/collectibles';

const { width } = Dimensions.get('window');

const PostPage = () => (
  <View style={{ width: '100%', height: 400 }}>
  <Text>Posts</Text>
  </View>
);
const CollectiblesPage = () => (
  <View style={{ width: '100%', height: 400 }}>
      <Collectibles/>
   
  </View>
);
const ActionsPage = () => (
  <View style={{ width: '100%', height: 400 }}>
    <Text>Actions</Text>
  </View>
);

/**
 * A component that provides swipeable tab navigation between different sections
 * 
 * @component
 * @description
 * SwipeTabs is a component that implements a tab-based navigation system with
 * swipeable functionality. Features include:
 * - Three main sections: Posts, Collectibles, and Actions
 * - Smooth swipe transitions between tabs
 * - Custom styled tab bar with indicators
 * - Lazy loading of tab content
 * - Responsive design adapting to screen width
 * 
 * The component uses react-native-tab-view for the core functionality and
 * implements custom styling for the tab bar and content areas.
 * 
 * @example
 * ```tsx
 * <SwipeTabs />
 * ```
 * 
 * Note: The Posts and Actions sections currently display placeholder content.
 * The Collectibles section is fully implemented.
 */
const SwipeTabs = memo(() => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
  }, [index]);

  const renderScene = useCallback(
    SceneMap({
      posts: PostPage,
      collectibles: CollectiblesPage,
      actions: ActionsPage,
    }),
    [] 
  );

  useEffect(() => {
    if (index === null || index === undefined) {
      setIndex(0); 
    }
  }, [index]);


  const renderTabBar = (props:any) => (
    <TabBar
      {...props}
      style={{
        backgroundColor: 'white', 
        height: 50, 
        elevation: 4, 
      }}
      labelStyle={{
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'none', 
      }}
      activeColor="black" 
      inactiveColor="#aaa" 
      indicatorStyle={{
        backgroundColor: 'black', 
        height: 3,
        borderRadius: 2,
        marginBottom:1
      }}
    />
  );
  return (
    <TabView
    renderTabBar={renderTabBar}
      key={`tabview-${index}`} 
      navigationState={{
        index, 
        routes: [
          { key: 'posts', title: 'Posts' },
          { key: 'collectibles', title: 'Collectibles' },
          { key: 'actions', title: 'Actions' },
        ],
      }}
      renderScene={renderScene}
      onIndexChange={setIndex} 
      swipeEnabled={true} 
      tabBarPosition="top"
      initialLayout={{ width }}
      lazy={true} 
      style={styles.tabView}
    />
  );
});

const styles = StyleSheet.create({
  tabView: {
    flex: 1,
    backgroundColor: 'white', 
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', 
    width: '100%', 
  },
});

export default SwipeTabs;
