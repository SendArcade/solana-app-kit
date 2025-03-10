// File: src/components/Profile/ProfileInfo/profileInfo.style.ts
import {StyleSheet} from 'react-native';
import COLORS from '../../../assets/colors';

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
  bioSection: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'left',
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
