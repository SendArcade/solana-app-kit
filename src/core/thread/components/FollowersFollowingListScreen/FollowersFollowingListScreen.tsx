import React from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../../navigation/RootNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type FollowersFollowingRouteProp = RouteProp<RootStackParamList, 'FollowersFollowingList'>;
type FollowersFollowingNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SimpleUserItem {
  id: string;
  username: string;
  handle?: string;
  profile_picture_url?: string;
}

export default function FollowersFollowingListScreen() {
  const route = useRoute<FollowersFollowingRouteProp>();
  const navigation = useNavigation<FollowersFollowingNavigationProp>();
  const { mode, userId, userList }: any = route.params;

  const navigateToUserProfile = (user: SimpleUserItem) => {
    if (!user.id) return;

    // Navigate to the OtherProfile screen with the user ID
    navigation.navigate('OtherProfile', { userId: user.id });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>
        {mode === 'followers' ? 'Followers' : 'Following'}
      </Text>

      <FlatList
        data={userList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userRow}
            onPress={() => navigateToUserProfile(item)}
          >
            <View style={styles.avatarContainer}>
              {item.profile_picture_url ? (
                <Image
                  source={{ uri: item.profile_picture_url }}
                  style={styles.avatar}
                />
              ) : (
                <Image
                  source={require('../../../../assets/images/User.png')}
                  style={styles.avatar}
                />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.username}>
                {item.username ?? 'Unnamed'}
              </Text>
              <Text style={styles.handle}>
                {item.handle ?? `@${item.id.slice(0, 6)}`}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
  },
  handle: {
    fontSize: 12,
    color: '#666',
  },
});
