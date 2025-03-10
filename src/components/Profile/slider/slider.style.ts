// FILE: src/components/Profile/slider/slider.style.ts
import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  tabView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  postList: {
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  postCard: {
    backgroundColor: '#fefefe',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,

    // iOS shadow
    shadowColor: '#000',
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
    backgroundColor: '#F5F9FF',
    color: '#2B8EF0',
    fontSize: 12,
    fontWeight: '600',
  },
});

export const tabBarStyles = {
  container: {
    backgroundColor: '#ffffff',
    height: 50,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'none',
  },
  indicator: {
    backgroundColor: '#000',
    height: 3,
    borderRadius: 2,
    marginBottom: 1,
  },
  activeColor: '#000',
  inactiveColor: '#aaa',
};
