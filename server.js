'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

const PORT = process.env.PORT;
const GEO_CODE_API_KEY = process.env.GEO_CODE_API_KEY;
const WEATHER_CODE_API_KEY = process.env.WEATHER_API_KEY;
const PARKS_CODE_API_KEY = process.env.PARKS_API_KEY;

const app = express();
app.use(cors());

app.get('/location', handelLocationRequest);
app.get('/weather', handelWeatherRequest);
app.get('/parks', handelParksRequest);

app.use('*', notFoundHandler);

function handelLocationRequest(req, res) {
  const search_query = req.query.city;
  const url = `https://us1.locationiq.com/v1/search.php?key=${GEO_CODE_API_KEY}&city=${search_query}&format=json`;

  if (!search_query) {
    res.status(404).send('no search query was provided');
  }
  superagent.get(url).then(resData => {

    // console.log(resData.body[0]);
    const location = new LocationCity(resData.body[0], search_query);
    res.status(200).send(location);
  }).catch((error) => {
    console.log('ERROR', error);
    res.status(500).send('Sorry, something went wrong');
  });

}

function handelWeatherRequest(req, res) {
  const searchQuery1 = req.query.lat;
  const searchQuery2 = req.query.lon;
  // const searchQueryCity = req.query.city;
  const url =`https://api.weatherbit.io/v2.0/forecast/daily?lat=${searchQuery1}&lon=${searchQuery2}&key=${WEATHER_CODE_API_KEY}&include=minutely`;
  superagent.get(url).then(resData => {
    let weatherArray=[];
    const weatherMap=resData.body.data.map((element)=>{
      const weatherDescription=element.weather.description;
      const weatherDateTime=element.datetime;
      console.log(weatherDescription);
      const weather = new WeatherCity(weatherDescription,weatherDateTime);
      weatherArray.push(weather);
    });
    res.status(200).send(weatherArray);
  }).catch((error) => {
    res.status(500).send('Sorry, something went wrong');
  });
}

function handelParksRequest(req, res) {
  const searchQuery = req.query.city;
  const url = `https://developer.nps.gov/api/v1/parks?city=${searchQuery}&api_key=${PARKS_CODE_API_KEY}`;
  superagent.get(url).then(resData => {
    const tenParks = resData.body.data.map((element) => {
      return new Park(element);
    });
    res.status(200).send(tenParks.slice(0, 10));
  }).catch((error) => {
    res.status(500).send('Sorry, something went wrong');
  });
}


//constructor

function Park(parkData) {
  this.name = parkData.fullName;
  this.address = parkData.addresses[0].postalCode + ' ' + parkData.addresses[0].line1 + ' ' + parkData.addresses[0].city + ' ' + parkData.addresses[0].stateCode;
  this.fee = '0';
  this.description = parkData.description;
  this.url = parkData.url;
}
function LocationCity(data, searchQuery) {
  this.search_query = searchQuery;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;

}

function WeatherCity(weatherDescription,dateTime){
  this.forecast=weatherDescription;
  this.time=dateTime;
}

function notFoundHandler(request, response) {
  response.status(404).send('Handle Not Found?');
}

app.use('*', (req, res) => {
  res.send('all good nothing to see here!');
});


app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));

