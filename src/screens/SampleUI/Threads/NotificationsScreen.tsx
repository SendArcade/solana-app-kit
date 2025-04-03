import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SearchIcon from '../../../assets/svg/SearchIcon';
import CloseIcon from '../../../assets/svg/CloseIcon';
import { SERVER_URL } from '@env';
import { RootStackParamList } from '../../../navigation/RootNavigator';

const { width } = Dimensions.get('window');

type User = {
  id: string;
  username: string;
  profile_picture_url: string | null;
};

export default function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Get the status bar height for Android
  const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching users from:', `${SERVER_URL}/api/profile/search`);
      const response = await fetch(`${SERVER_URL}/api/profile/search`);

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      console.log('Fetched user data:', data);

      if (data.success && data.users) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      } else {
        console.error('Invalid response format:', data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (user: User) => {
    navigation.navigate('OtherProfile', { userId: user.id });
  };

  const renderUserItem = ({ item }: { item: User }) => {
    // Handle profile picture URL for Android - transform IPFS URLs to avoid 403/429 errors
    const getProfileImageSource = () => {
      // Default fallback image
      if (!item.profile_picture_url) {
        return require('../../../assets/images/User.png');
      }

      // On iOS, use the original URL directly - no transformations needed
      if (Platform.OS === 'ios') {
        return { uri: item.profile_picture_url };
      }

      // ANDROID ONLY - Transform IPFS URLs to avoid loading issues
      const profileUrl = String(item.profile_picture_url);

      // Handle ipfs.io URLs
      if (profileUrl.includes('ipfs.io/ipfs/')) {
        const parts = profileUrl.split('/ipfs/');
        if (parts.length > 1) {
          const ipfsHash = parts[1].split('?')[0]?.split('#')[0];
          if (ipfsHash) {
            return { uri: `https://nftstorage.link/ipfs/${ipfsHash}` };
          }
        }
      }
      // Handle ipfs:// protocol
      else if (profileUrl.startsWith('ipfs://')) {
        const ipfsHash = profileUrl.slice(7).split('?')[0]?.split('#')[0];
        if (ipfsHash) {
          return { uri: `https://nftstorage.link/ipfs/${ipfsHash}` };
        }
      }

      // Not an IPFS URL or couldn't extract hash, use original
      return { uri: profileUrl };
    };

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={getProfileImageSource()}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.userId}>@{item.id.substring(0, 6)}...{item.id.substring(item.id.length - 4)}</Text>
        </View>
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {Platform.OS === 'android' && <View style={{ height: STATUSBAR_HEIGHT, backgroundColor: '#fff' }} />}
      <SafeAreaView style={[
        styles.safeArea,
        Platform.OS === 'android' && androidStyles.safeArea
      ]}>
        <View style={[
          styles.header,
          Platform.OS === 'android' && androidStyles.header
        ]}>
          <Text style={styles.headerTitle}>Search Users</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchIcon}>
            <SearchIcon size={20} color="#666" />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <CloseIcon size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0099ff" style={styles.loader} />
            <Text style={styles.loaderText}>Searching for users...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery.length > 0 ? 'No users found matching your search' : 'No users available'}
                </Text>
                <Text style={styles.emptySubText}>
                  {searchQuery.length > 0 ? 'Try different keywords' : 'Check back later'}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 15,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginBottom: 10,
  },
  loaderText: {
    fontSize: 14,
    color: '#666',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  userId: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  arrowContainer: {
    padding: 8,
  },
  arrow: {
    fontSize: 20,
    color: '#999',
    fontWeight: '300',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#555',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

// Enhanced Android-specific styles
const androidStyles = StyleSheet.create({
  safeArea: {
    paddingTop: 0,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 15,
  },
  // Add any other Android-specific style overrides here
});

