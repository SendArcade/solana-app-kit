import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  Easing,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {styles} from './ChatScreen.styles';

// Types for message data
type Message = {
  id: string;
  text: string;
  createdAt: number;
  sender: 'me' | 'other';
};

const ChatScreen: React.FC = () => {
  // Local state for messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hey, how are you?',
      createdAt: Date.now() - 1000 * 60 * 60, // example: 1 hour ago
      sender: 'other',
    },
    {
      id: '2',
      text: 'Doing great! You?',
      createdAt: Date.now() - 1000 * 60 * 58,
      sender: 'me',
    },
    {
      id: '3',
      text: "I'm fine too, just exploring new UI designs!",
      createdAt: Date.now() - 1000 * 60 * 57,
      sender: 'other',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [listHeight, setListHeight] = useState(0);

  // For a little "typing" bubble animation
  const typingBubbleScale = useRef(new Animated.Value(0)).current;
  const [isTyping, setIsTyping] = useState(false);

  // Animate "typing" bubble
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingBubbleScale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(typingBubbleScale, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ]),
      ).start();
    } else {
      typingBubbleScale.stopAnimation(() => {
        typingBubbleScale.setValue(0);
      });
    }
  }, [isTyping, typingBubbleScale]);

  // Simulate "other user" typing after a short delay
  useEffect(() => {
    // For demonstration, mark typing state to true
    const timer = setTimeout(() => {
      setIsTyping(true);
    }, 1200);

    // And then turn it off after a while
    const timer2 = setTimeout(() => {
      setIsTyping(false);
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, []);

  // Handle sending a message
  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      createdAt: Date.now(),
      sender: 'me',
    };
    setMessages(prev => [newMessage, ...prev]);
    setInputText('');
  };

  // Chat message bubble component
  const renderMessage = ({item}: {item: Message}) => {
    const isMyMessage = item.sender === 'me';
    return (
      <View
        style={[
          styles.bubbleContainer,
          isMyMessage ? styles.bubbleRight : styles.bubbleLeft,
        ]}>
        <Text style={styles.bubbleText}>{item.text}</Text>
        <Text style={styles.bubbleTime}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top bar (simulate chat name, status, etc.) */}
      <View style={styles.chatHeader}>
        <Text style={styles.chatHeaderTitle}>Chat with Jane</Text>
        <Text style={styles.chatHeaderSubtitle}>online now</Text>
      </View>

      {/* Main chat area */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          inverted
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={{paddingBottom: 16}}
          onLayout={e => {
            setListHeight(e.nativeEvent.layout.height);
          }}
        />

        {/* Possibly show the other user's "typing" indicator at the bottom (if needed) */}
        {isTyping && (
          <View style={styles.typingIndicatorContainer}>
            <Animated.View
              style={[
                styles.typingBubble,
                {transform: [{scale: typingBubbleScale}]},
              ]}>
              <Text style={styles.typingBubbleDot}>• • •</Text>
            </Animated.View>
            <Text style={styles.typingIndicatorText}>Jane is typing</Text>
          </View>
        )}

        {/* Input area */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.inputField}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
