// FILE: src/components/thread/RetweetPreview.styles.ts
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  handle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  previewText: {
    marginTop: 6,
    fontSize: 14,
    color: '#000',
  },
});
