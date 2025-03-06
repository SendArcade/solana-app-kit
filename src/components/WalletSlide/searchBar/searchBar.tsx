import React, { useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { style } from "./searchBar.style";
import Icons from "../../../assets/svgs/index"; 

/**
 * A reusable search input component with clear functionality
 * 
 * @component
 * @description
 * SearchBar is a reusable component that provides a search input field with
 * additional features. The component includes:
 * - A magnifying glass icon for visual indication
 * - A text input field with placeholder
 * - Text clearing functionality
 * - Consistent styling with the app's design
 * 
 * The component maintains its own state for the search text and provides
 * a clean interface for text input and clearing.
 * 
 * @example
 * ```tsx
 * <SearchBar />
 * ```
 * 
 * Note: Future iterations could include props for:
 * - Custom placeholder text
 * - Search callback function
 * - Custom styling options
 */
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
