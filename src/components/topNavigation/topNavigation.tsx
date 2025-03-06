import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './topNavigation.style';
import Icons from '../../assets/svgs/index';

/**
 * Props for the TopNavigation component
 */
interface TopNavigationProps {
  /** Name of the current section to display in the navigation bar */
  sectionName?: string;
}

/**
 * A navigation bar component for the top of the screen
 * 
 * @component
 * @description
 * TopNavigation provides a consistent navigation bar at the top of the screen.
 * The component features:
 * - Section name display with customizable text
 * - Back arrow navigation
 * - Contextual icons based on view:
 *   - Messages icon
 *   - Notifications bell
 *   - Menu dots
 * 
 * The component adapts its display based on whether a section name is provided,
 * showing different sets of icons accordingly.
 * 
 * @example
 * ```tsx
 * // With section name
 * <TopNavigation sectionName="Profile" />
 * 
 * // Without section name (shows all icons)
 * <TopNavigation />
 * ```
 */
export const TopNavigation: React.FC<TopNavigationProps> = ({ sectionName }) => {
  return (
    <View style={styles.container}>
      <View style={{ alignItems: "center", paddingLeft: 2, display: "flex", flexDirection: "row" }}>
        <View style={{ transform: [{ rotate: '90deg' }] }}>
          <Icons.Arrow />
        </View>
        <Text style={{ color: "#B7B7B7" }}>{sectionName}</Text>
      </View>

      {/* Hide icons if sectionName exists */}
      {!sectionName ? (
        <View style={styles.rightIconGrp}>
          <Icons.MessageIcon />
          <Icons.BellIcon />
          <Icons.DotsThree />
        </View>
      ):(
        <View style={styles.rightIconGrp}>
        
          <Icons.DotsThree />
        </View>
      )}
    </View>
  );
};
