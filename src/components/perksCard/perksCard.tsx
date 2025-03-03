import React from 'react';
import {Image, Text, View} from 'react-native';
import {styles} from './perksCard.style';
import COLORS from '../../assets/colors';

/**
 * A component that displays community benefits and token holding requirements
 * 
 * @component
 * @description
 * PerksCard is a component that showcases the benefits of joining a specific
 * community and the token holding requirements. The component displays:
 * - A "Perks" header
 * - Community image
 * - Community name and description
 * - Token holding requirement information
 * 
 * The component uses a clean, card-based design with consistent typography
 * and color schemes defined in the project's color palette.
 * 
 * @example
 * ```tsx
 * <PerksCard />
 * ```
 * 
 * Note: Currently uses hardcoded values for the Yash Community.
 * This could be made configurable through props in future iterations.
 */
const PerksCard = () => {
  return (
    <>
      <View style={styles.container}>
        <Text style={{fontWeight: 500, fontSize: 14}}>Perks</Text>
        {/* perk description box  */}
        <View style={styles.perkContainer}>
          {/* community image  */}
          <View style={styles.communityImgContainer}>
            <Image
              source={require('../../assets/images/communityImg.png')}
              style={styles.communityImg}
            />
          </View>

          <View>
            <Text style={{fontWeight: 500, fontSize: 14}}>
              Join the Yash Community
            </Text>
            <Text
              style={{fontWeight: 400, fontSize: 12, color: COLORS.greyMid}}>
              Get Access to exclusive alpha from...
            </Text>
            <Text
              style={{fontWeight: 400, fontSize: 12, color: COLORS.greyMid}}>
              Hold 10K+ $YASH
            </Text>
          </View>
        </View>
      </View>
    </>
  );
};

export default PerksCard;
