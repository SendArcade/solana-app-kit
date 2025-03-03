import React from "react";
import { Text, View } from "react-native";
import { style } from "./portfolioBalance.style";
import Icons from  "../../assets/svgs/index";

/**
 * A component that displays the total portfolio value and quick actions
 * 
 * @component
 * @description
 * PortfolioBalance displays a user's total portfolio value along with profit/loss
 * indicators and quick action buttons. The component includes:
 * - Total portfolio value in USD
 * - Profit/loss amount and percentage
 * - Quick action buttons for:
 *   - Swap: Token swapping functionality
 *   - Send: Asset transfer functionality
 *   - On-Ramp: Fiat to crypto conversion via Mercuryo
 * 
 * The component uses a clean, modern design with clear typography and
 * iconography for easy understanding of portfolio performance.
 * 
 * @example
 * ```tsx
 * <PortfolioBalance />
 * ```
 */
const PortfolioBalance = () => {
  return (
    <>
      <View style={style.container}>
        <View>
          <Text style={{ fontWeight: "600", fontSize: 50 }}>$10,548</Text>
        </View>

        <View style={{ display: "flex", flexDirection: "row", gap: 8 }}>
          <Text style={{ fontWeight: "600", fontSize: 20, color: "#32DE6B" }}>
            +$0.00021113
          </Text>
          <Text style={{ fontWeight: "600", fontSize: 20, color: "#32DE6B" }}>
            +4.77%
          </Text>
        </View>

        <View>
          <Text style={{ fontSize: 12, fontWeight: 600, color: "#B7B7B7" }}>
            Portfolio balance
          </Text>
        </View>

        <View style={style.btnGrp}>
          <View style={style.btnWrapper}>
            <View style={style.btn} >
                <Icons.SwapIcon width={26} height={26}/>
            </View>

            <Text style={style.btnText} numberOfLines={1}>
              Swap
            </Text>
          </View>

          <View style={style.btnWrapper}>
            <View style={style.btn} >
            <Icons.SendIdle/>
            </View>

            <Text style={style.btnText} numberOfLines={1}>
              Send
            </Text>
          </View>

          <View style={style.btnWrapper}>
            <View style={style.btn} >
            <Icons.CryptoIcon/>
            </View>
            <Text style={style.btnText} numberOfLines={2}>
              On-Ramp{"\n"}via Mercuryo
            </Text>
          </View>
        </View>
      </View>
    </>
  );
};

export default PortfolioBalance;
