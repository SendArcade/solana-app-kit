import React from "react";
import { Image, Text, View } from "react-native";
import { style } from "./portfolioItem.style";
import Icons from "../../assets/svgs/index";

/**
 * Props for the PortfolioItem component
 */
interface PortfolioItemProps {
  /** Image source for the token's icon/logo */
  imagePath: any;
  /** Name of the token */
  tokenName: string;
  /** Amount of tokens held */
  tokenAmount: string;
  /** Value in USD */
  usdValue: string;
  /** Profit/loss value */
  profit: string;
}

/**
 * A component that displays individual token information in a portfolio
 * 
 * @component
 * @description
 * PortfolioItem is a reusable component that displays detailed information
 * about a single token in a user's portfolio. It shows:
 * - Token icon/logo
 * - Token name with verification badge
 * - Token amount
 * - USD value
 * - Profit/loss information
 * 
 * The component is designed to be used in a list of portfolio items,
 * providing a consistent and clean layout for token information.
 * 
 * @example
 * ```tsx
 * <PortfolioItem
 *   imagePath={require('./token-icon.png')}
 *   tokenName="Solana"
 *   tokenAmount="123.45"
 *   usdValue="$1,234.56"
 *   profit="+12.34%"
 * />
 * ```
 */
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
