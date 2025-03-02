/*
  FILE: src/screens/SampleUI/Threads/ProfileScreen/ProfileScreen.styles.ts
  TYPE: Modified (entire file)
*/

import {StyleSheet} from 'react-native';
import COLORS from '../../../../assets/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // Banner
  bannerContainer: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.greyLight,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Profile Header
  profileHeaderContainer: {
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
  },
  profileAvatarWrapper: {
    marginTop: -36, // overlap
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.white,
    width: 80,
    height: 80,
    overflow: 'hidden',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileTextInfo: {
    marginTop: 12,
  },
  profileUsername: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  profileHandle: {
    fontSize: 14,
    color: COLORS.greyDark,
    marginRight: 4,
  },
  verifiedIcon: {
    marginTop: 2,
  },
  profileBio: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  actionButtonsRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  editProfileBtn: {
    borderWidth: 1,
    borderColor: COLORS.greyBorderdark,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  editProfileBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 12,
  },
  statItem: {
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.greyDark,
  },

  // Post list
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  noPostContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  noPostText: {
    fontSize: 14,
    color: '#999',
  },

  // Post items
  postItemContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.greyBorder,
  },
  postItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postItemContent: {
    flex: 1,
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  postUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  postHandle: {
    fontSize: 13,
    color: COLORS.greyDark,
  },
  postText: {
    fontSize: 14,
    color: COLORS.black,
    marginTop: 2,
  },
  replyNote: {
    fontSize: 12,
    color: COLORS.greyMid,
  },
});
