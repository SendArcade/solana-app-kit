import React, {useEffect, useState} from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import { ThreadCTAButton, ThreadPost, ThreadUser } from '../../../../components/thread/thread.types';
import { useAppSelector } from '../../../../hooks/useReduxHooks';
import { Thread } from '../../../../components/thread';
import COLORS from '../../../../assets/colors';


/** Example: Current user is "Alice" */
const currentUser: ThreadUser = {
  id: 'user-1',
  username: 'Alice',
  handle: '@aliceSmith',
  avatar: require('../../../../assets/images/User.png'),
  verified: true,
};

export default function FeedScreen() {
  const allPosts = useAppSelector(state => state.thread.allPosts);
  const [rootPosts, setRootPosts] = useState<ThreadPost[]>([]);

  // Example CTA buttons
  const ctaButtons: ThreadCTAButton[] = [
    {
      label: 'Mint NFT',
      onPress: post => console.log('Liked:', post.id),
      buttonStyle: {
        backgroundColor: '#2A2A2A',
        width: 130,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
      },
      buttonLabelStyle: {color: '#FFFFFF'},
    },
    {
      label: 'Trade',
      onPress: post => console.log('Shared:', post.id),
      buttonStyle: {
        backgroundColor: '#2A2A2A',
        width: 140,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
      },
      buttonLabelStyle: {color: '#FFFFFF'},
    },
    // {
    //   label: 'Copy Trade',
    //   onPress: post => console.log('Saved:', post.id),
    //   buttonStyle: {backgroundColor: '#F6F7F9'},
    //   buttonLabelStyle: {color: '#000000'},
    // },
  ];

  useEffect(() => {
    const roots = allPosts.filter(p => !p.parentId);
    roots.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    setRootPosts(roots);
  }, [allPosts]);

  const handleRootPostCreated = () => {
    // Handle post creation logic here
  };

  return (
    <SafeAreaView style={styles.container}>
      <Thread
        rootPosts={rootPosts}
        currentUser={currentUser}
        ctaButtons={ctaButtons}
        themeOverrides={{'--thread-bg-primary': '#F0F0F0'}}
        styleOverrides={{
          container: {padding: 10},
          button: {borderRadius: 8}, // Global button style override
          buttonLabel: {fontWeight: 'bold'}, // Global label style override
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});
