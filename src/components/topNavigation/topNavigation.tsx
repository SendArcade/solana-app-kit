import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './topNavigation.style';
import Icons from '../../assets/svgs/index';

interface TopNavigationProps {
  sectionName?: string;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ sectionName }) => {
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

export default TopNavigation;
