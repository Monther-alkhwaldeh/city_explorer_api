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
const MOVIES_API_KEY =process.env.MOVIES_API_KEY;
const YELP_API_KEY=process.env.YELP_API_KEY;


const app = express();
app.use(cors());
const client=new pg.Client(DATABASE_URL);

app.get('/location', handelLocationRequest);
app.get('/weather', handelWeatherRequest);
app.get('/parks', handelParksRequest);
app.get('/movies', handelMoviesRequest);
app.get('/yelp', handelYelpRequest);



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
function handelYelpRequest(req,res){
  //https://www.yelp.com/developers/documentation/v3/business_search
  const search_query=req.query.location;

  const url=`https://api.yelp.com/v3/businesses/search`;
  const yelp_query={
    location : search_query
  };
  superagent.get(url).query(yelp_query).set('Authorization',`Bearer ${YELP_API_KEY}`).then(resData=>{
    const yelpArray=[];
    const yelp_list=resData.body.businesses.map(element=>{
      const name=element.name;
      console.log(name);
      const image_url=element.image_url;
      const price=element.price;
      const rating=element.rating;
      const url=element.url;
      const yelpL=new Yelp(name,image_url,price,rating,url);
      yelpArray.push(yelpL);
    });
    res.status(200).send(yelpArray);
  }).catch((error) => {
    res.status(500).send('Sorry, something went wrong');
  });
}

function handelMoviesRequest(req, res){
  const search_query=req.query.query;
  const url=`https://api.themoviedb.org/3/search/movie`;
  const movie_query={
    api_key:MOVIES_API_KEY,
    query: search_query
  };
  superagent.get(url).query(movie_query).then(resData=>{

    const movieListArray=[];
    const movieList=resData.body.results.map((element)=>{
      const title=element.title;
      const overview=element.overview;
      const average_votes=element.vote_average;
      const total_votes=element.vote_count;
      const image_url=element.poster_path;
      const popularity=element.popularity;
      const released_on=element.released_on;
      const movieList= new Movies(title,overview,average_votes,total_votes,image_url,popularity,released_on);
      movieListArray.push(movieList);
    });
    res.status(200).send(movieListArray);
  }).catch((error) => {
    res.status(500).send('Sorry, something went wrong');
  });
}

//constructor
function Yelp(name,image_url,price,rating,url){
  this.name=name;
  this.image_url=image_url;
  this.price=price;
  this.rating=rating;
  this.url=url;
}

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

function Movies (title,overview,average_votes,total_votes,image_url,popularity,released_on){
  this.title=title;
  this.overview=overview;
  this.average_votes=average_votes;
  this.total_votes=total_votes;
  this.image_url=image_url;
  this.popularity=popularity;
  this.released_on=released_on;
}
function notFoundHandler(request, response) {
  response.status(404).send('Handle Not Found?');
}


app.use('*', (req, res) => {
  res.send('all good nothing to see here!');
});


