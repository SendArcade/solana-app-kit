// File: src/components/thread/PostCTA.tsx
import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import type {ThreadPost, ThreadCTAButton} from './thread.types';
import {createThreadStyles, getMergedTheme} from './thread.styles';
import PriorityFeeSelector from '../PriorityFeeSelector';
import {useSelector} from 'react-redux';
import {RootState} from '../../state/store';
import {useTradeTransaction} from '../../hooks/useTradeTransaction';

interface PostCTAProps {
  post: ThreadPost;
  buttons?: ThreadCTAButton[];
  themeOverrides?: Partial<Record<string, any>>;
  styleOverrides?: {
    container?: StyleProp<ViewStyle>;
    button?: StyleProp<ViewStyle>;
    buttonLabel?: StyleProp<TextStyle>;
  };
  userStyleSheet?: {
    container?: StyleProp<ViewStyle>;
    button?: StyleProp<ViewStyle>;
    buttonLabel?: StyleProp<TextStyle>;
  };
}

export default function PostCTA({
  post,
  buttons,
  themeOverrides,
  styleOverrides,
  userStyleSheet,
}: PostCTAProps) {
  const mergedTheme = getMergedTheme(themeOverrides);
  const styles = createThreadStyles(
    mergedTheme,
    styleOverrides as {[key: string]: object} | undefined,
    userStyleSheet as {[key: string]: object} | undefined,
  );

  const [showTradeModal, setShowTradeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'priority' | 'jito'>(
    'priority',
  );
  const selectedFeeTier = useSelector(
    (state: RootState) => state.transaction.selectedFeeTier,
  );

  // Use the trade hook (now modularized)
  const {sendTrade} = useTradeTransaction();

  const handleTradeButtonPress = () => {
    setShowTradeModal(true);
  };

  const handleSubmitTrade = async () => {
    setLoading(true);
    await sendTrade(selectedMode);
    setShowTradeModal(false);
    setLoading(false);
  };

  return (
    <View
      style={[
        styles.threadPostCTAContainer,
        styleOverrides?.container,
        userStyleSheet?.container,
      ]}>
      {buttons &&
        buttons.map((btn, index) => (
          <TouchableOpacity
            key={`${btn.label}-${index}`}
            style={[
              styles.threadPostCTAButton,
              styleOverrides?.button,
              userStyleSheet?.button,
              btn.buttonStyle,
            ]}
            onPress={() => {
              if (btn.label.toLowerCase() === 'trade') {
                handleTradeButtonPress();
              } else {
                btn.onPress(post);
              }
            }}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.threadPostCTAButtonLabel,
                styleOverrides?.buttonLabel,
                userStyleSheet?.buttonLabel,
                btn.buttonLabelStyle,
              ]}>
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}

      <Modal
        visible={showTradeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTradeModal(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            padding: 20,
          }}>
          <View
            style={{backgroundColor: '#fff', borderRadius: 10, padding: 20}}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 10,
                  backgroundColor:
                    selectedMode === 'priority' ? '#1d9bf0' : '#f0f0f0',
                  borderRadius: 5,
                  marginRight: 5,
                  alignItems: 'center',
                }}
                onPress={() => setSelectedMode('priority')}>
                <Text
                  style={{
                    color: selectedMode === 'priority' ? '#fff' : '#000',
                  }}>
                  Priority Fee
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 10,
                  backgroundColor:
                    selectedMode === 'jito' ? '#1d9bf0' : '#f0f0f0',
                  borderRadius: 5,
                  marginLeft: 5,
                  alignItems: 'center',
                }}
                onPress={() => setSelectedMode('jito')}>
                <Text
                  style={{color: selectedMode === 'jito' ? '#fff' : '#000'}}>
                  Jito Bundling
                </Text>
              </TouchableOpacity>
            </View>

            {selectedMode === 'priority' ? (
              <>
                <PriorityFeeSelector />
                {loading ? (
                  <ActivityIndicator size="large" color="#1d9bf0" />
                ) : (
                  <TouchableOpacity
                    style={{
                      marginTop: 20,
                      backgroundColor: '#1d9bf0',
                      padding: 15,
                      borderRadius: 5,
                      alignItems: 'center',
                    }}
                    onPress={handleSubmitTrade}>
                    <Text style={{color: '#fff', fontWeight: 'bold'}}>
                      Submit Trade
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {loading ? (
                  <ActivityIndicator size="large" color="#1d9bf0" />
                ) : (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#1d9bf0',
                      padding: 15,
                      borderRadius: 5,
                      alignItems: 'center',
                    }}
                    onPress={handleSubmitTrade}>
                    <Text style={{color: '#fff', fontWeight: 'bold'}}>
                      Send Trade
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <TouchableOpacity
              style={{marginTop: 10, alignItems: 'center'}}
              onPress={() => setShowTradeModal(false)}>
              <Text style={{color: '#1d9bf0'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
