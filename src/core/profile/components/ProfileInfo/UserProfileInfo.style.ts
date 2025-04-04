import {StyleSheet} from 'react-native';
import COLORS from '../../../../assets/colors';

export const styles = StyleSheet.create({
  profileInfo: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  profImgContainer: {
    width: 72,
    height: 72,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
    color: COLORS.textDark,
  },
  handleText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.greyDark,
  },
  followsBadge: {
    backgroundColor: COLORS.greyLight,
    paddingHorizontal: 12,
    borderRadius: 6,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'left',
    color: COLORS.greyDark,
  },
  bioSection: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'left',
    color: COLORS.textDark,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    gap: 2,
  },
  statCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.greyMid,
  },
  editProfileBtn: {
    borderWidth: 1,
    borderColor: COLORS.greyBorderdark,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  editProfileBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
}); 