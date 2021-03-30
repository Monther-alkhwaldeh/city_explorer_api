'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg=require('pg');

const PORT = process.env.PORT;
const GEO_CODE_API_KEY = process.env.GEO_CODE_API_KEY;
const WEATHER_CODE_API_KEY = process.env.WEATHER_API_KEY;
const PARKS_CODE_API_KEY = process.env.PARKS_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;


const app = express();
app.use(cors());
const client=new pg.Client(DATABASE_URL);

app.get('/location', handelLocationRequest);
app.get('/weather', handelWeatherRequest);
app.get('/parks', handelParksRequest);

app.get('/', (request, response) => {
  response.status(200).send('ok');
});


client.connect().then(()=>{
  app.listen(PORT, () => {
    console.log('Connected to database:', client.connectionParameters.database); //show what database we connected to
    console.log('Server up on', PORT);
  });
});


app.use('*', notFoundHandler);


function handelLocationRequest(req, res) {
  const sqlQuery=' SELECT * FROM citydb ';
  const search_query = req.query.city;
  client.query(sqlQuery).then(data=>{
    if(data.rows.length === 0){
      const url = `https://us1.locationiq.com/v1/search.php?key=${GEO_CODE_API_KEY}&city=${search_query}&format=json`;
      superagent.get(url).then(resData =>{
        const formatted_query=resData.body[0].display_name;
        const latitude=resData.body[0].lat;
        const longitude=resData.body[0].lon;
        const safeValues=[search_query,formatted_query,latitude,longitude];
        console.log(safeValues);
        const sqlQuery1='INSERT INTO citydb(search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4) RETURNING *;';
        client.query(sqlQuery1,safeValues).then(result=>{
          console.log(result);
          res.status(200).json(result);
        }).catch(error=>{
          console.log(error);
        });
      });
    }else {
      client.query(sqlQuery).then(data =>{
        res.status(200).json(data);
      });
    }
  });
 
}

function handelWeatherRequest(req, res) {
  const searchQuery1 = req.query.lat;
  const searchQuery2 = req.query.lon;
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
function LocationCity(searchQuery,formatted_query,latitude,longitude) {
  this.search_query = searchQuery;
  this.formatted_query = formatted_query;
  this.latitude = latitude;
  this.longitude = longitude;

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


