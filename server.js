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
  console.log(location);
}

function handelWeatherRequest(req,res){
  const weatherArray=[];
//   const searchQuery = req.query.city;
  const weatherRawData = require('./data/weather.json');
  weatherRawData.data.forEach(element => {
    const weatherDescription=element.weather.description;
    const dateTime=element.datetime;
    let weatherData= new WeatherCity(weatherDescription,dateTime);
    // res.send(weatherData);
    weatherArray.push(weatherData);
  });
//   console.log(weatherArray);
}
//constructor
handelWeatherRequest();
function LocationCity (data,searchQuery){
  this.formatted_query = data.display_name;
  this.searchQuery= searchQuery;
  this.latitude = data.lat;
  this.longitude = data.lon;

}
function WeatherCity(weatherDescription,dateTime){
  this.forcaste=weatherDescription;
  this.time=dateTime;
}

app.use('*', (req, res) => {
  res.send('all good nothing to see here!');
});


app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));

