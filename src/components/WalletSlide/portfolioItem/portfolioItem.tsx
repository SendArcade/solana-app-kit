import React from "react";
import { Image, Text, View } from "react-native";
import { style } from "./portfolioItem.style";
import Icons from "../../../assets/svgs/index";

interface PortfolioItemProps {
  imagePath: any; // Image source
  tokenName: string;
  tokenAmount: string;
  usdValue: string;
  profit: string;
}

const PortfolioItem: React.FC<PortfolioItemProps> = ({ imagePath, tokenName, tokenAmount, usdValue, profit }) => {
  return (
    <View style={style.container}>
      <View style={style.leftSection}>
        <Image source={imagePath} style={style.image} />

        <View style={style.tokenInfo}>
          <View style={style.tokenName}>
            <Text style={style.tokenText}>{tokenName}</Text>
            <Icons.BlueCheck />
          </View>
          <Text style={style.tokenAmount}>{tokenAmount}</Text>
        </View>
      </View>

      <View style={style.rightSection}>
        <Text style={style.usdValue}>{usdValue}</Text>
        <Text style={style.profit}>{profit}</Text>
      </View>
    </View>
  );
};

export default PortfolioItem;
