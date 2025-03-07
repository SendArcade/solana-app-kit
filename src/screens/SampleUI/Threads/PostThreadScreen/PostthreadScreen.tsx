// FILE: src/screens/PostThreadScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {useAppSelector} from '../../../../hooks/useReduxHooks';
import {
  findPostById,
  gatherAncestorChain,
} from '../../../../components/thread/thread.utils';
import {PostHeader, PostBody, PostFooter} from '../../../../components/thread';
import styles from './PostThreadScreen.style';
import {RootStackParamList} from '../../../../navigation/RootNavigator';

type PostThreadScreenRouteProp = RouteProp<RootStackParamList, 'PostThread'>;

const PostThreadScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<PostThreadScreenRouteProp>();
  const {postId} = route.params;

  // Get the nested posts from Redux
  const allPosts = useAppSelector(state => state.thread.allPosts);
  const currentPost = findPostById(allPosts, postId);

  if (!currentPost) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFoundText}>Post not found.</Text>
      </SafeAreaView>
    );
  }

  // If the post is a reply, get its immediate parent and ancestor chain
  const parentPost = currentPost.parentId
    ? findPostById(allPosts, currentPost.parentId)
    : null;
  const ancestors = currentPost.parentId
    ? gatherAncestorChain(currentPost.id, allPosts)
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conversation</Text>
        {/* Placeholder for symmetry */}
        <View style={{width: 40}} />
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {parentPost && (
          <View style={styles.parentCard}>
            <Text style={styles.parentLabel}>In reply to:</Text>
            <PostHeader post={parentPost} />
            <PostBody post={parentPost} />
          </View>
        )}
        {ancestors.length > 0 && (
          <View style={styles.ancestorChainContainer}>
            <Text style={styles.ancestorChainText}>
              {ancestors.map(a => a.user.handle).join(' → ')}
            </Text>
          </View>
        )}
        <View style={styles.currentPostContainer}>
          <PostHeader post={currentPost} />
          <PostBody post={currentPost} />
          <PostFooter post={currentPost} onPressComment={() => {}} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PostThreadScreen;
