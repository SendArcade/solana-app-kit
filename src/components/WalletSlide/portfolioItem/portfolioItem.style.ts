import { StyleSheet } from "react-native";

export const style = StyleSheet.create({
  container: {
    marginVertical:5,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F6F7F9",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  image: {
   
  },
  tokenInfo: {
    flexDirection: "column",
    gap: 4,
  },
  tokenName: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  tokenText: {
    fontSize: 15,
    fontWeight: "600",
  },
  tokenAmount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#999999",
  },
  rightSection: {
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-end",
  },
  usdValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#999999",
  },
  profit: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    backgroundColor: "#E8FFEA",
    borderRadius: 4,
    color: "#32DE6B",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
