import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between", // Changed from flex-start to space-between
    alignItems: "center",
    width: "100%", // Ensure container takes full width
    gap: 8,
  },
  btn: {
    position: "relative",
    backgroundColor: "black",
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    flex: 1, // Make buttons grow equally to fill space
  },
  text: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center", // Ensure text is centered
  },
  lastBtn: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#32D4DE",
  },
  lastBtnText: {
    color: "black",
    fontSize: 14,
    fontWeight: "bold",
  },
});
