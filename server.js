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
app.get('/parks', handelParkesRequest);

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
// const locationsRawData = require('./data/location.json');
// const location = new LocationCity(locationsRawData[0],search_uery);
// res.send(location);
// console.log(location);
// }

// function handelWeatherRequest(req, res) {
//   const city_search_query = req.query.city;
//   const url =`http://api.weatherbit.io/v2.0/forecast/daily?city=${city_search_query}$key=${WEATHER_API_KEY}`;

//   superagent.get(url).then(resData => {

//     const weatherData = new WeatherCity(resData.body.data);
//     res.status(200).send(weatherData);
//   }).catch((error) => {
//     console.log('ERROR', error);
//     res.status(500).send('Sorry, something went wrong');
//   });

// }
function handelWeatherRequest(req, res) {
  // const searchQuery1 = req.query.lat;
  // const searchQuery2 = req.query.lon;
  const searchQueryCity = req.query.city;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${searchQueryCity}&key=${WEATHER_CODE_API_KEY}`;
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
// const weatherArray=[];
// const weatherRawData = require('./data/weather.json');
// weatherRawData.data.forEach(element => {
//   const weatherDescription=element.weather.description;
//   const dateTime=element.datetime;
//   let weatherData= new WeatherCity(weatherDescription,dateTime);
//   weatherArray.push(weatherData);
// });
// res.send(weatherArray);

// console.log(weatherArray);

function handelParkesRequest(req,res){
  const search_query_city=req.query.city;
  // const url=`https://developer.nps.gov/api/v1/activities/parks?q=${search_query_city}&api_key=${PARKS_CODE_API_KEY}`;
  const url=`https://developer.nps.gov/api/v1/parks?city=${search_query_city}&api_key=${PARKS_CODE_API_KEY}`;
  superagent.get(url).then(resData => {
    let arrayParks=[];
    console.log(arrayParks);
    const parksMap= resData.body.data.map(element=>{
      const fullName=element.fullName;
      const url1=element.url;
      const description=element.description;
      const fees=element.entranceFees.cost;
      const address=`${element.addresses.postalCode}, ${element.addresses.city} , ${element.addresses.postalCode} , ${element.addresses.stateCode} , ${element.addresses.line1}`;
      const parkData= new Parks(fullName,address,fees,description,url1);
      arrayParks.push(parkData);

    });
    res.status(200).send(arrayParks);
  }).catch((error) => {
    res.status(500).send('Sorry, something went wrong');
  });
  // });
}
//constructor
function LocationCity(data, searchQuery) {
  this.search_query = searchQuery;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;

}
// function WeatherCity(weatherDescription) {
//   this.forecast = weatherDescription[0].weather.description;
//   this.time = weatherDescription[0].datetime;

// }
function WeatherCity(weatherDescription,dateTime){
  this.forecast=weatherDescription;
  this.time=dateTime;

}

function Parks(name,address,fee,description,url){
  this.name=name;
  this.address=address;
  this.fee=fee;
  this.description=description;
  this.url=url;
}

function notFoundHandler(request, response) {
  response.status(404).send('Handle Not Found?');
}
// function handelParkesRequest() {

// }
app.use('*', (req, res) => {
  res.send('all good nothing to see here!');
});


app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));

