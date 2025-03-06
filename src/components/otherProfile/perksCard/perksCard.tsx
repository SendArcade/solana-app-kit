import React from 'react';
import {Image, Text, View} from 'react-native';
import {styles} from './perksCard.style';
import COLORS from '../../../assets/colors';
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
              source={require('../../../assets/images/communityImg.png')}
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
