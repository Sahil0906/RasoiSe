import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TextInput, TouchableOpacity, StatusBar, ImageBackground, SafeAreaView } from 'react-native';
import trackerApi from '../api/tracker';
import ResultShowDetail from '../components/ResultShowDetails';
import { AntDesign, Entypo, Feather } from '@expo/vector-icons';
import { ScrollView } from 'react-native-gesture-handler';
import StarRating from 'react-native-star-rating';
import { NavigationEvents } from 'react-navigation';
// import Geocoder from 'react-native-geocoding';
// import { Permissions, Location } from 'expo';
// Geocoder.init("AIzaSyA4R47lkG-0zcnpIYdX4pWeJocfmTI8Ujs"); 
// Geocoder.init("AIzaSyA4R47lkG-0zcnpIYdX4pWeJocfmTI8Ujs", {language : "en"});

const ResultsShowScreen = ({ navigation }) => {
    const [result, setResult] = useState(null);
    const id = navigation.getParam('id');




    const getResult = async (id) => {
        // console.log('inside get result');
        // console.log(id);
        const response = await trackerApi.get(`/home/chef/${id}`);
        console.log('chef', response.data);
        setResult(response.data);
    };

    useEffect(() => {
        // console.log('inside use effect', id);
        getResult(id);
    }, []);


    if (!result) {
        return null;
    }

    // // console.log('location',location);
    // _attemptGeocodeAsync = async () => {
    //     this.setState({ inProgress: true, error: null });
    //     try {
    //       let result = await Location.geocodeAsync(this.state.selectedExample);
    //       this.setState({ result });
    //     } catch (e) {
    //       this.setState({ error: e.message });
    //     } finally {
    //       this.setState({ inProgress: false });
    //     }
    //   };




    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <NavigationEvents onDidFocus={() => getResult(id)} />
            <StatusBar backgroundColor='#EA3C53' />
            <ImageBackground source={require('../../assets/bg3.jpeg')} style={{ width: '100%' }}>
                <SafeAreaView style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <NavigationEvents onDidFocus={() => getResult(id)} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, marginTop: 5 }}>
                        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Search')}>
                            <AntDesign name='arrowleft' color='white' size={24} />
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.8} style={{ marginLeft: 'auto', marginRight: 20 }} onPress={() => navigation.navigate('RateReview', { chefId: result.chef_details._id, chefName: result.chef_details.name, chef_profile: result.chef_details })} >
                            <Feather name='edit' color='white' size={24} />
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.8} style={{ marginRight: 10 }} onPress={() => navigation.navigate('Cart')}>
                            <AntDesign name='shoppingcart' color='white' size={24} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ marginTop: 30, marginLeft: 20, marginBottom: 50 }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 25 }}>{result.chef_details.name}'s Kitchen</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -5 }}>
                            <Entypo name="location-pin" size={24} color="white" />
                            <Text style={{ color: 'white', fontSize: 15 }}> {result.chef_details.location}</Text>
                        </View>
                        <View style={{ marginTop: 20, marginBottom: 20 }}>
                            <FlatList
                                data={result.slots}
                                keyExtractor={(result) => result._id}
                                renderItem={({ item }) => {
                                    return <View>
                                        <Text style={{ color: 'white', fontSize: 12, marginBottom: 2 }}>{item}</Text>
                                    </View>
                                }}
                            />
                        </View>
                        {/* <View >

                            <StarRating
                                disabled={true}
                                maxStars={5}
                                rating={result.chef_details.rating}
                                fullStarColor={'#ffcc00'}
                                emptyStarColor={'#ffcc00'}
                                starSize={22}
                                containerStyle={{ width: 30, marginBottom: 10 }}
                            />

                        </View> */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
                            <View>
                                {/* <Text style={{ color: 'white', fontSize: 14, alignSelf: 'center' }}>{result.chef_details.rating}</Text> */}
                                <StarRating
                                    disabled={true}
                                    maxStars={5}
                                    rating={result.chef_details.rating}
                                    fullStarColor={'#fff'}
                                    emptyStarColor={'#fff'}
                                    starSize={16}
                                    containerStyle={{ width: 18, marginBottom: 3 }}
                                />
                                <Text style={{ color: '#cccccc', fontSize: 14 }}>351 Ratings</Text>
                            </View>
                            <View>
                                <Text style={{ color: 'white', fontSize: 14, alignSelf: 'center' }}>137k</Text>
                                <Text style={{ color: '#cccccc', fontSize: 14 }}>Bookmarks</Text>
                            </View>
                            <View>
                                <Text style={{ color: 'white', fontSize: 14, alignSelf: 'center' }}>347</Text>
                                <Text style={{ color: '#cccccc', fontSize: 14 }}>Photos</Text>

                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            </ImageBackground>
            <ScrollView showsVerticalScrollIndicator={false} style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, backgroundColor: 'rgb(250,250,250)', elevation: 25 }}>
                <View style={{ marginTop: 30, backgroundColor: 'rgb(250,250,250)' }}>

                </View>
                <FlatList
                    data={result.menu}
                    keyExtractor={(result) => result._id}
                    renderItem={({ item }) => {
                        return <View>
                            <ResultShowDetail result={item} availability={result.availability} />
                        </View>
                    }}
                />
            </ScrollView>
        </View>
    );
};



const styles = StyleSheet.create({
    kitchenName: {
        fontWeight: 'bold',
        fontSize: 25,
        marginTop: 10,
        marginHorizontal: 10,
        textTransform: "capitalize"
    },
    backgroundStyle: {
        backgroundColor: 'rgb(230,230,230)',
        height: 50,
        borderRadius: 5,
        marginHorizontal: 15,
        flexDirection: 'row',
        marginTop: 10,
        marginBottom: 10
    },
    inputStyle: {
        flex: 1,
        fontSize: 18
    },
    iconStyle: {
        fontSize: 35,
        alignSelf: 'center',
        marginHorizontal: 15
    },
    cart: {
        fontSize: 25,
        marginTop: 20,
        marginLeft: 40
    }
});

export default ResultsShowScreen;