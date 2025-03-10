import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
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
  },
  text: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
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
