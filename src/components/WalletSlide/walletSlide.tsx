import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, FlatList } from "react-native";
import TopNavigation from "../topNavigation/topNavigation";
import PortfolioBalance from "./portfolioBalance/portfolioBalance";
import SearchBar from "./searchBar/searchBar";
import PortfolioItem from "./portfolioItem/portfolioItem";
import { portfolioData } from "../../mocks/portfolio";

/**
 * A screen component that displays wallet and portfolio information
 * 
 * @component
 * @description
 * WalletSlide is a comprehensive screen component that combines multiple sub-components
 * to display a user's wallet and portfolio information. It includes:
 * - A top navigation bar
 * - Portfolio balance display
 * - Search functionality
 * - A scrollable list of portfolio items
 * 
 * The component uses SafeAreaView for proper layout on different devices and
 * integrates with mock portfolio data for demonstration purposes.
 * 
 * @example
 * ```tsx
 * <WalletSlide />
 * ```
 */
const WalletSlide = () => {
  return (
    <SafeAreaView style={{ backgroundColor: "white", flex: 1 }}>
      <TopNavigation sectionName="Profile" />
      <View style={{ alignItems: "center" }}>
        <PortfolioBalance />
      </View>
      <View style={{ paddingHorizontal: 10, gap: 10, flex: 1 }}>
        <SearchBar />
        <FlatList
          data={portfolioData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PortfolioItem
              imagePath={item.imagePath}
              tokenName={item.tokenName}
              tokenAmount={item.tokenAmount}
              usdValue={item.usdValue}
              profit={item.profit}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

export default WalletSlide;
