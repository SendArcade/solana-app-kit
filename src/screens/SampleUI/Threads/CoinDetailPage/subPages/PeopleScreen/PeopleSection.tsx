import React from 'react'
import { View, Text } from 'react-native'
import { styles } from './PeopleSection.style'
import { FlatList } from 'react-native-gesture-handler'
import { SuggestionsCard, UserListing } from '../../../../../../components'
import Icons from '../../../../../../assets/svgs'

const cardData = Array(10).fill({})
export const PeopleScreen = () => {
  const renderCard = () => (
    <View style={styles.cardContainer}>
      <SuggestionsCard />
    </View>
  )
  return (
    <View style={styles.container}>
      <View style={styles.content}>

        <View style={styles.holdersHeader}>
          <Icons.infoIcon />
          <Text style={styles.holdersTitle}>Top Holders of SEND</Text>
        </View>
      </View>
      <View>
        <FlatList
          horizontal
          data={cardData}
          renderItem={renderCard}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardList}
        />
      </View>
      <View style={styles.userList}>
        <UserListing />
      </View>
    </View>
  )
}
