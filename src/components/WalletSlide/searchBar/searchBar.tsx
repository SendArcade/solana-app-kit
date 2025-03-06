import React, { useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { style } from "./searchBar.style";
import Icons from "../../../assets/svgs/index"; 

const SearchBar = () => {
  const [searchText, setSearchText] = useState("");

  return (
    <View style={style.container}>
      <Icons.MagnifyingGlass style={style.icon} /> 
      
      <TextInput
        style={style.input}
        placeholder="Search..."
        placeholderTextColor="#B7B7B8"
        value={searchText}
        onChangeText={setSearchText}
      />

      {searchText.length > 0 && (
        <TouchableOpacity onPress={() => setSearchText("")}>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchBar;
