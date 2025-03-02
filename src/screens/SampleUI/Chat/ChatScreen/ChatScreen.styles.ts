import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },

  /* HEADER */
  chatHeader: {
    backgroundColor: '#075E54', // WhatsApp-like teal
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  chatHeaderTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  chatHeaderSubtitle: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
  },

  /* MAIN CHAT AREA */
  chatContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 6,
    justifyContent: 'flex-end',
  },

  /* MESSAGE BUBBLE */
  bubbleContainer: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 6,
  },
  bubbleText: {
    fontSize: 16,
    color: '#fff',
  },
  bubbleTime: {
    fontSize: 11,
    color: '#e0e0e0',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#128C7E', // greenish
    borderBottomLeftRadius: 0,
    marginLeft: 6,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#25D366', // lighter green
    borderBottomRightRadius: 0,
    marginRight: 6,
  },

  /* TYPING INDICATOR */
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginLeft: 6,
  },
  typingBubble: {
    backgroundColor: '#128C7E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '40%',
    marginRight: 8,
  },
  typingBubbleDot: {
    fontSize: 16,
    color: '#fff',
  },
  typingIndicatorText: {
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
  },

  /* INPUT ROW */
  inputRow: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#ECE5DD',
    alignItems: 'center',
  },
  inputField: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#25D366',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
