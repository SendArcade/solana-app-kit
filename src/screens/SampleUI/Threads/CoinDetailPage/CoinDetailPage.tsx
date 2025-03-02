import React, { useState } from 'react'
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native'
import { styles } from './CoinDetailPage.style'
import { TopScreen } from './subPages/TopScreen/TopSection';
import { LatestScreen } from './subPages/LatestScreen/LatestSection';
import { PeopleScreen } from './subPages/PeopleScreen/PeopleSection';
import { PhotosScreen } from './subPages/PhotosScreen/PhotosSection';
import { VideosScreen } from './subPages/VideosScreen/VideosSection';


const CoinDetailPage = () => {
    const [selectedItem, setSelectedItem] = useState('Top');
    const renderSection = () => {
        switch(selectedItem) {
            case 'Top':
                return <TopScreen />
            case 'Latest':
                return <LatestScreen />
            case 'People':
                return <PeopleScreen />
            case 'Photos':
                return <PhotosScreen />
            case 'Videos':
                return <VideosScreen />
            default:
                return <TopScreen />
        }
    }


    return (
        <SafeAreaView style={styles.container}>

            <View >
                <View style={styles.headerList}>
                    <View style={styles.list}>
                        {["Top", "Latest", "People", "Photos", "Videos"].map((item) => (
                            <TouchableOpacity
                                key={item}
                                onPress={() => setSelectedItem(item)}
                            >
                                <Text style={[
                                    styles.menuItem,
                                    selectedItem === item && styles.menuItemSelected
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

            </View>
            <View style={styles.MainSection}>
            {renderSection()}
            </View>
        </SafeAreaView>
    )
}

export default CoinDetailPage