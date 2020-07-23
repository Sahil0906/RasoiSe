import { useEffect, useState } from 'react';
import { AsyncStorage } from 'react-native';
import trackerApi from '../api/tracker';
import { requestPermissionsAsync, watchPositionAsync, Accuracy } from 'expo-location';

export default () => {
    const [results, setResults] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [address, setAddress] = useState('Piprali Road, Sikar, Rajasthan');
    const [location, setLocation] = useState(

        {
            "coords": {
                "accuracy": 1799.9990234375,
                "altitude": 0,
                "heading": 0,
                "latitude": 27.6199571,
                "longitude": 75.1605576,
                "speed": 0
            },
            "mocked": false,
            "timestamp": 1586340319005,
        }

    );

    const startWatching = async () => {
        try {
            await requestPermissionsAsync();
            await watchPositionAsync({
                accuracy: Accuracy.BestForNavigation,
                timeInterval: 1000,
                distanceInterval: 10
            }, (location) => {
                setLocation(location);
            })
        } catch (e) {
            setErrorMessage(e);
        }
    }


    const searchApi = async (searchTerm, add) => {
        try {
            // console.log(add);
            setErrorMessage(null)
            setResults([])
            console.log('hii')
            const response = await trackerApi.post(`/home/search/${searchTerm}`, { lat: location.coords.latitude, long: location.coords.longitude, location: "current", address: add });
            // console.log(response.data.chefs);
            console.log('response', response.data);
            setResults(response.data.chefs);
            setAddress(response.data.location);
            await AsyncStorage.setItem('address', response.data.location)
        }
        catch (err) {
            console.log(err);
            setErrorMessage('Something went wrong');
        }
    };


    //bad code
    //searchApi('pasta);

    useEffect(() => {
        startWatching();
        searchApi('noodles', address);
    }, []);

    return [searchApi, results, errorMessage, location, address];
};