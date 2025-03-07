// FILE: src/components/thread/RetweetModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ThreadUser, ThreadSection } from './thread.types';
import { createRetweetAsync, addRetweetLocally } from '../../state/thread/reducer';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { useAuth } from '../../hooks/useAuth';
import retweetModalStyles from './RetweetModal.styles';
import { nanoid } from '@reduxjs/toolkit';

/**
 * Props for the RetweetModal.
 */
interface RetweetModalProps {
  visible: boolean;
  onClose: () => void;
  retweetOf: string;            // postId of the post we retweet
  currentUser: ThreadUser;
  styleOverrides?: {
    container?: StyleProp<ViewStyle>;
    input?: StyleProp<TextStyle>;
    button?: StyleProp<ViewStyle>;
    buttonText?: StyleProp<TextStyle>;
  };
}

/**
 * RetweetModal - allows user to optionally add text ("quote retweet").
 */
export default function RetweetModal({
  visible,
  onClose,
  retweetOf,
  currentUser,
  styleOverrides,
}: RetweetModalProps) {
  const dispatch = useAppDispatch();
  const { solanaWallet } = useAuth();

  const [loading, setLoading] = useState(false);
  const [retweetText, setRetweetText] = useState('');

  const handleRetweet = async () => {
    // Build optional sections if user has typed text - moved outside of try block
    let sections: ThreadSection[] = [];
    if (retweetText.trim()) {
      sections.push({
        id: `section-${nanoid()}`,
        type: 'TEXT_ONLY',
        text: retweetText.trim(),
      });
    }
    
    try {
      setLoading(true);

      // Attempt server retweet
      await dispatch(
        createRetweetAsync({
          retweetOf,
          user: currentUser,
          sections,
        }),
      ).unwrap();

      onClose();
      setRetweetText('');
    } catch (err: any) {
      // Fallback approach: add retweet locally
      console.warn('[RetweetModal] Network error, adding retweet locally:', err.message);
      const fallbackPost = {
        id: 'local-' + nanoid(),
        parentId: null,
        user: currentUser,
        sections,
        createdAt: new Date().toISOString(),
        replies: [],
        reactionCount: 0,
        retweetCount: 0,
        quoteCount: 0,
        reactions: {},
        retweetOf: {
          id: retweetOf,
          parentId: undefined,
          user: {
            id: 'unknown-user',
            username: 'UnknownUser',
            handle: '@unknown',
            verified: false,
            avatar: {} as any, // Changed from null to empty object cast as any
          },
          sections: [],
          createdAt: new Date().toISOString(),
          replies: [],
          reactionCount: 0,
          retweetCount: 0,
          quoteCount: 0,
          reactions: {},
          retweetOf: null,
        },
      };

      dispatch(addRetweetLocally(fallbackPost));
      onClose();
      setRetweetText('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Background overlay that closes the modal on press */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={retweetModalStyles.overlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={retweetModalStyles.centeredContainer}
      >
        {/* Tap inside won't close modal */}
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={[retweetModalStyles.modalContainer, styleOverrides?.container]}>
            <Text style={retweetModalStyles.modalTitle}>Retweet</Text>
            <TextInput
              style={[retweetModalStyles.textInput, styleOverrides?.input]}
              placeholder="Add a comment (optional)"
              multiline
              value={retweetText}
              onChangeText={setRetweetText}
            />
            {loading ? (
              <ActivityIndicator style={{ marginTop: 10 }} />
            ) : (
              <TouchableOpacity
                style={[retweetModalStyles.retweetButton, styleOverrides?.button]}
                onPress={handleRetweet}
              >
                <Text style={[retweetModalStyles.retweetButtonText, styleOverrides?.buttonText]}>
                  {retweetText.trim() ? 'Quote Retweet' : 'Retweet'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
