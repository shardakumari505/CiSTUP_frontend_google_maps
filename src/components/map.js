import React, { useState } from 'react';
import '../stylesheets/map.scss';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import TextField from '@mui/material/TextField';
import TripOriginIcon from '@mui/icons-material/TripOrigin';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ScheduleIcon from '@mui/icons-material/Schedule';

const drawerWidth = 240;

const openedMixin = (theme) => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
});

const closedMixin = (theme) => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});



const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        variants: [
            {
                props: ({ open }) => open,
                style: {
                    ...openedMixin(theme),
                    '& .MuiDrawer-paper': openedMixin(theme),
                },
            },
            {
                props: ({ open }) => !open,
                style: {
                    ...closedMixin(theme),
                    '& .MuiDrawer-paper': closedMixin(theme),
                },
            },
        ],
    }),
);

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

function Map() {
    const [origin, setOrigin] = useState([12.9716, 77.5946]); // Default origin
    const [destination, setDestination] = useState([12.9716, 77.6046]); // Default destination
    const [originLocation, setOriginLocation] = useState('');
    const [destinationLocation, setDestinationLocation] = useState('');
    const [route, setRoute] = useState([]);
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = () => {
        setIsClicked(!isClicked); // Toggle state
    };

    const theme = useTheme();
    const [open, setOpen] = React.useState(false);
    const handleDrawerToggle = () => setOpen((prev) => !prev);

    const handleOriginLocationChange = async (e) => {
        const value = e.target.value;
        setOriginLocation(value);

        if (value.length > 2) { // Fetch suggestions when the user types more than 2 characters
            const suggestions = await geocodeLocation(value);
            setOriginSuggestions(suggestions);
        } else {
            setOriginSuggestions([]);
        }
    };

    const handleDestinationLocationChange = async (e) => {
        const value = e.target.value;
        setDestinationLocation(value);

        if (value.length > 2) {
            const suggestions = await geocodeLocation(value);
            setDestinationSuggestions(suggestions);
        } else {
            setDestinationSuggestions([]);
        }
    };

    const geocodeLocation = async (locationName) => {
        try {
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                mode: "cors",
                params: {
                    q: locationName,
                    format: 'json',
                    addressdetails: 1,
                    limit: 5, // Fetch up to 5 suggestions
                    bounded: 1, // Restrict results to a bounding box
                    viewbox: '77.5,12.8,77.8,13.1', // Bounding box for Bangalore
                },
            });
            return response.data || [];
        } catch (error) {
            console.error('Error geocoding location:', error);
            return [];
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        const originCoords = await geocodeLocation(originLocation);
        if (originCoords.length > 0) setOrigin([parseFloat(originCoords[0].lat), parseFloat(originCoords[0].lon)]);
        else {
            alert('Origin location not found');
            return;
        }

        const destinationCoords = await geocodeLocation(destinationLocation);
        if (destinationCoords.length > 0) setDestination([parseFloat(destinationCoords[0].lat), parseFloat(destinationCoords[0].lon)]);
        else {
            alert('Destination location not found');
            return;
        }

        if (originCoords.length > 0 && destinationCoords.length > 0) {
            try {
                const response = await axios.get('https://maximum-darya-shardakumari505-c8370fe9.koyeb.app/get-route', {
                    mode: "cors",
                    params: {
                        origin_lat: originCoords[0].lat,
                        origin_lon: originCoords[0].lon,
                        destination_lat: destinationCoords[0].lat,
                        destination_lon: destinationCoords[0].lon,
                    },
                });
                setRoute(response.data); // Set the route data
            } catch (error) {
                console.error('Error fetching route:', error);
            }
        }
    };

    const UpdateMapView = () => {
        const map = useMap();
        if (route.length > 0) {
            map.fitBounds(route);
        } else {
            map.setView(origin, 13);
        }
        return null;
    };

    const finalRoute = route.length > 0 ? route : [];

    return (
        <div id="map" style={{ height: '100vh', width: '100%' }}>


            <Box sx={{ display: 'flex' }}>
                {/* <CssBaseline /> */}
                <Drawer variant="permanent" open={open}>
                    <IconButton
                        color="inherit"
                        aria-label="toggle drawer"
                        onClick={handleDrawerToggle}
                    >
                        {open ? (
                            theme.direction === 'rtl' ? <ChevronRightIcon edge="end" sx={{ marginRight: 5 }} /> : <ChevronLeftIcon edge="end" sx={{ marginRight: 5 }} />
                        ) : (
                            <MenuIcon />
                        )}
                    </IconButton>
                    <Divider />

                    <List>
                        {['Saved', 'Recents'].map((text, index) => (
                            <ListItem key={text} disablePadding sx={{ display: 'block' }}>
                                <ListItemButton
                                    sx={[
                                        {
                                            minHeight: 48,
                                            px: 2.5,
                                        },
                                        open
                                            ? {
                                                justifyContent: 'initial',
                                            }
                                            : {
                                                justifyContent: 'center',
                                            },
                                    ]}
                                >
                                    <ListItemIcon
                                        sx={[
                                            {
                                                minWidth: 0,
                                                justifyContent: 'center',
                                            },
                                            open
                                                ? {
                                                    mr: 3,
                                                }
                                                : {
                                                    mr: 'auto',
                                                },
                                        ]}
                                    >
                                        {index % 2 === 0 ? <BookmarkBorderIcon /> : <ScheduleIcon />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={text}
                                        sx={[
                                            open
                                                ? {
                                                    opacity: 1,
                                                }
                                                : {
                                                    opacity: 0,
                                                },
                                        ]}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                    {/* <List>
                        {['All mail', 'Trash', 'Spam'].map((text, index) => (
                            <ListItem key={text} disablePadding sx={{ display: 'block' }}>
                                <ListItemButton
                                    sx={[
                                        {
                                            minHeight: 48,
                                            px: 2.5,
                                        },
                                        open
                                            ? {
                                                justifyContent: 'initial',
                                            }
                                            : {
                                                justifyContent: 'center',
                                            },
                                    ]}
                                >
                                    <ListItemIcon
                                        sx={[
                                            {
                                                minWidth: 0,
                                                justifyContent: 'center',
                                            },
                                            open
                                                ? {
                                                    mr: 3,
                                                }
                                                : {
                                                    mr: 'auto',
                                                },
                                        ]}
                                    >
                                        {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={text}
                                        sx={[
                                            open
                                                ? {
                                                    opacity: 1,
                                                }
                                                : {
                                                    opacity: 0,
                                                },
                                        ]}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List> */}
                </Drawer>
                <Box component="main" sx={{ flexGrow: 1, padding: 3 }}>
                    {/* <DrawerHeader /> */}

                    <div className="map-container-page">

                        <div className="form-container">
                            <form onSubmit={handleSubmit}>
                                <div className="input-field">
                                    <div className='input-field-origin'>
                                        <TripOriginIcon
                                            sx={{
                                                height: '100%',
                                                margin: '0 8px 0 0',
                                                color: 'gray',
                                            }}
                                        />
                                        <TextField
                                            id="outlined-basic"
                                            label="Origin"
                                            value={originLocation}
                                            onChange={handleOriginLocationChange}
                                            variant="outlined"
                                            fullWidth
                                        />
                                    </div>

                                </div>
                                <div className="input-field">
                                    <div className='input-field-destination'>
                                        <RoomOutlinedIcon
                                            sx={{
                                                height: '100%',
                                                transform: 'scale(1.3)',
                                                margin: '0 8px 0 0',
                                                color: 'red',
                                            }}
                                        />
                                        <TextField
                                            id="outlined-basic"
                                            label="Destination"
                                            value={destinationLocation}
                                            onChange={handleDestinationLocationChange}
                                            variant="outlined"
                                            fullWidth
                                        />
                                    </div>



                                    <button
                                        className={`get-route-button ${isClicked ? "clicked" : ""}`}
                                        type="submit"
                                        onClick={handleClick}
                                    >
                                        Get Route
                                    </button>

                                    <div className='input-field-suggestions'>
                                        {originSuggestions.length > 0 && (
                                            <div className="suggestions-list">
                                                {originSuggestions.map((suggestion, index) => (
                                                    <div
                                                        key={index}
                                                        className="suggestion-item"
                                                        onClick={() => {
                                                            setOriginLocation(suggestion.display_name);
                                                            setOrigin([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
                                                            setOriginSuggestions([]);
                                                        }}
                                                    >
                                                        <RoomOutlinedIcon
                                                            sx={{
                                                                height: '100%',
                                                                margin: '0 8px 0 0',
                                                                color: 'gray',
                                                            }}
                                                        /><span>{suggestion.display_name}</span>
                                                    </div>

                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className='input-field-suggestions'>
                                        {destinationSuggestions.length > 0 && (
                                            <div className="suggestions-list">
                                                {destinationSuggestions.map((suggestion, index) => (
                                                    <div
                                                        key={index}
                                                        className="suggestion-item"
                                                        onClick={() => {
                                                            setDestinationLocation(suggestion.display_name);
                                                            setDestination([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
                                                            setDestinationSuggestions([]);
                                                        }}
                                                    ><RoomOutlinedIcon
                                                            sx={{
                                                                height: '100%',
                                                                margin: '0 8px 0 0',
                                                                color: 'gray',
                                                            }}
                                                        /><span>{suggestion.display_name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </form>
                        </div>

                        <div className="map-container">
                            <MapContainer
                                key={route.length}
                                center={origin}
                                zoom={13}
                                style={{ height: '100%', width: '100%', borderRadius: '10px' }}
                                maxBounds={[[12.8, 77.5], [13.1, 77.8]]}
                                maxBoundsViscosity={1.0}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">'
                                />
                                <UpdateMapView />
                                <Marker position={origin}>
                                    <Popup>Origin</Popup>
                                </Marker>
                                <Marker position={destination}>
                                    <Popup>Destination</Popup>
                                </Marker>
                                {finalRoute.length > 0 && <Polyline positions={finalRoute} color="red" weight={5} />}
                            </MapContainer>
                        </div>

                    </div>

                </Box>
            </Box>




        </div>
    );
}

export default Map;