import {StyleSheet} from 'react-native';

export const chatBodyOverrides = StyleSheet.create({
  extraContentContainer: {marginVertical: 2},
  threadItemText: {fontSize: 14, color: '#232324'},
});

export const styles = StyleSheet.create({
  chatScreenContainer: {
    flex: 1,
    backgroundColor: '#F1F1F1',
  },
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  messageWrapper: {
    marginVertical: 6,
    width: '100%',
  },

  receivedWrapper: {
    alignSelf: 'flex-start',
    width: '90%',
  },
  sentWrapper: {
    alignSelf: 'flex-end',
    width: '80%',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  usernameContainer: {
    justifyContent: 'center',
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#232324',
  },

  /* BUBBLE */
  bubbleContainer: {
    borderRadius: 10,
    padding: 8,
  },
  receivedBubble: {
    backgroundColor: '#FFFFFF',
  },
  sentBubble: {
    backgroundColor: '#E7FEEB',
  },

  timeStampText: {
    fontSize: 10,
    color: '#757575',
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  composerContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 8,
    backgroundColor: '#FFFFFF',
  },
  quoteReplyButton: {
    // backgroundColor: '#1d9bf0',
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  quoteReplyText: {
    color: '#2558D4',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export const androidStyles = StyleSheet.create({
  safeArea: {
    paddingTop: 50,
  },
});
