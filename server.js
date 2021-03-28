'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT;
const app = express();
app.use(cors());

app.get('/location', handelLocationRequest);
app.get('/weather', handelWeatherRequest);

function handelLocationRequest(req,res){
  const searchQuery = req.query.city;
  //   console.log(searchQuery);
  const locationsRawData = require('./data/location.json');
  const location = new LocationCity(locationsRawData[0],searchQuery);
  res.send(location);
//   console.log(location,searchQuery);
}

function handelWeatherRequest(req,res){
  const weatherArray=[];
//   const searchQuery = req.query.city;
  const weatherRawData = require('./data/weather.json');
  weatherRawData.data.forEach(element => {
    // const weatherDescription=element.weather.description;
    // const dateTime=element.datetime;
    let weatherData= new WeatherCity(element);
    // res.send(weatherData);
    weatherArray.push(weatherData);
  });
  res.send(weatherArray);

//   console.log(weatherArray);
}

//constructor
function LocationCity (data,searchQuery){
  this.formatted_query = data.display_name;
  this.searchQuery= searchQuery;
  this.city=data.city;
  this.latitude = data.lat;
  this.longitude = data.lon;

}
function WeatherCity(data,searchQuery){
  this.forcaste=data.weather.description;
  this.time=data.datetime;
//   this.searchQuery=searchQuery;
//   console.log(this);

}
app.use('*', (req, res) => {
  res.send('all good nothing to see here!');
});


app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));

