import React from 'react';
import {View, StyleProp, ViewStyle} from 'react-native';

/**
 * Props for the PumpfunCard component
 * @interface PumpfunCardProps
 */
export interface PumpfunCardProps {
  /** Optional style override for the card container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Child elements to render inside the card */
  children: React.ReactNode;
}

/**
 * A card component used in the Pumpfun feature
 * 
 * @component
 * @description
 * PumpfunCard is a container component that provides a consistent card-like appearance
 * for content in the Pumpfun feature. It supports custom styling through the containerStyle
 * prop and can contain any child components.
 * 
 * @example
 * ```tsx
 * <PumpfunCard containerStyle={styles.customCard}>
 *   <Text>Card Content</Text>
 * </PumpfunCard>
 * ```
 */
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
