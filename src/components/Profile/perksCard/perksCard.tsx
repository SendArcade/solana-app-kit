import React from 'react';
import {Image, Text, View} from 'react-native';
import {styles} from './perksCard.style';
import COLORS from '../../../assets/colors';

export interface PerksCardProps {
  /** Title or label for the perk. e.g. “Join the Yash Community” */
  title?: string;
  /** Additional lines describing the perk. */
  descriptionLines?: string[];
  /** An image or icon displayed in the circle. */
  communityImage?: any;
  containerStyle?: object;
}

const PerksCard: React.FC<PerksCardProps> = ({
  title = 'Join the Yash Community',
  descriptionLines = [
    'Get Access to exclusive alpha from...',
    'Hold 10K+ $YASH',
  ],
  communityImage = require('../../../assets/images/communityImg.png'),
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={{fontWeight: '500', fontSize: 14}}>Perks</Text>

      {/* perk description box  */}
      <View style={styles.perkContainer}>
        {/* community image  */}
        <View style={styles.communityImgContainer}>
          <Image source={communityImage} style={styles.communityImg} />
        </View>

        <View>
          <Text style={{fontWeight: 500, fontSize: 14}}>{title}</Text>
          {descriptionLines.map((line, idx) => (
            <Text
              key={idx}
              style={{fontWeight: 400, fontSize: 12, color: COLORS.greyMid}}>
              {line}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

export default PerksCard;
