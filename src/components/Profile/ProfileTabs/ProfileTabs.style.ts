import {StyleSheet} from 'react-native';
import COLORS from '../../../assets/colors';

export const styles = StyleSheet.create({
  tabView: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  tabContent: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centered: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.greyDark,
  },
  postList: {
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  postCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,

    // iOS shadow
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    // Android elevation
    elevation: 2,
  },
  replyLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
    borderRadius: 6,
    backgroundColor: '#F5F9FF', // Consider adding this to colors.ts
    color: '#2B8EF0', // Consider adding this to colors.ts
    fontSize: 12,
    fontWeight: '600',
  },
});

export const tabBarStyles = {
  container: {
    backgroundColor: COLORS.white,
    height: 50,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'none',
  },
  indicator: {
    backgroundColor: COLORS.black,
    height: 3,
    borderRadius: 2,
    marginBottom: 1,
  },
  activeColor: COLORS.black,
  inactiveColor: COLORS.greyMid,
};

// Retweet specific styles
export const retweetStyles = StyleSheet.create({
  retweetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 6,
    paddingTop: 4,
  },
  retweetHeaderText: {
    fontSize: 13,
    color: '#657786', // Consider adding this to colors.ts
    marginLeft: 6,
    fontWeight: '500',
  },
  retweetedContent: {
    marginTop: 4,
    width: '100%',
  },
  originalPostContainer: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: COLORS.greyLight,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.greyBorder,
  },
  retweetIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingLeft: 6,
  },
  retweetLabel: {
    fontSize: 12,
    color: '#657786', // Consider adding this to colors.ts
    marginLeft: 4,
    fontWeight: '500',
  },
  retweetedPostContainer: {
    marginTop: 8,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  quoteContent: {
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 12,
    color: '#657786', // Consider adding this to colors.ts
  },
}); 