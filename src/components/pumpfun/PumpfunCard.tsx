import React from 'react';
import {View, StyleProp, ViewStyle} from 'react-native';

export interface PumpfunCardProps {
  /** Optional style override for the card container */
  containerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const PumpfunCard: React.FC<PumpfunCardProps> = ({
  containerStyle,
  children,
}) => {
  return <View style={[defaultCardStyle, containerStyle]}>{children}</View>;
};

const defaultCardStyle: ViewStyle = {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 16,
  marginVertical: 8,
  shadowColor: '#000',
  shadowOffset: {width: 0, height: 2},
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
};

export default PumpfunCard;
