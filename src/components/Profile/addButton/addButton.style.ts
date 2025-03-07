import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap:4
  },
  btn: {
    position:"relative",
    flex: 1,
    backgroundColor: "black",
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  text: {
    color: "white",
    fontSize: 10,
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
  icon:{
position:"absolute",
top:-11,
right:-11,

  }
});
