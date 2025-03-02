import {StyleSheet} from 'react-native';
import COLORS from '../../../../assets/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  profileHeaderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyBorder,
    backgroundColor: COLORS.white,
  },
  profileInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileAvatarBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileUsername: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
  handleFollowsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  profileHandle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.greyDark,
  },
  profileFollowsYouBadge: {
    backgroundColor: COLORS.greyLight,
    paddingHorizontal: 12,
    borderRadius: 6,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.greyDark,
  },
  profileBio: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 8,
  },
  profileStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  profileStat: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  profileStatLocation: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.greyMid,
  },
  btnGrp: {
    flexDirection: 'row',
    gap: 10,
  },
  disabledBtn: {
    height: 40,
    flex: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.greyBorder,
    backgroundColor: COLORS.greyLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtnText: {
    color: '#2A2A2A',
    fontSize: 14,
    fontWeight: '600',
  },

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
  postItemContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyBorder,
  },
  postItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  postItemContent: {
    flex: 1,
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 2,
  },
  postUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  postHandle: {
    fontSize: 12,
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
