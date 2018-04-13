const express = require('express');
const bodyParser = require('body-parser');
const https = require("https");
const server = express();


server.use(bodyParser.urlencoded({
    extended: true
}));
server.use(bodyParser.json());

server.get('/', (req, res) => {
    res.send('You must point the route to /webhook.')
});

server.post('/webhook', (req, response) => {
    const wwoApiKey = '95d09256b9464d7bbb1113011181304';    

    // Get entity parameters from req.body.result.parameters
    // console.log(req.body.result.parameters);

    var dateString = '';
    var todaysDate = new Date();

    // Get today's date in YYYY/MM/DD format
    dateString += todaysDate.getFullYear() + '-';
    dateString += ("0" + (todaysDate.getMonth() + 1)).slice(-2) + '-';  
    dateString += ("0" + todaysDate.getDate()).slice(-2);

    let date = req.body.result.parameters['date'] || dateString;
    let city = req.body.result.parameters['geo-city'];

    let path = 'https://api.worldweatheronline.com/premium/v1/weather.ashx?format=json&num_of_days=1' +
    '&q=' + encodeURIComponent(city) + '&key=' + wwoApiKey + '&date=' + date;

    https.get(path, res => {
        res.setEncoding("utf8");
        let body = "";

        res.on("data", data => {
            body += data;
        });

        res.on("end", () => {
            body = JSON.parse(body);
            
            // The structure of the API Response can be studied
            // at this URL: https://developer.worldweatheronline.com/api/docs/local-city-town-weather-api.aspx
            let forecast = body['data']['weather'][0];
            let location = body['data']['request'][0];
            let conditions = body['data']['current_condition'][0];
            let currentConditions = conditions['weatherDesc'][0]['value'];

            // Create response
            let responseText = `Current conditions in the ${location['type']} 
            ${location['query']} are ${currentConditions} with a projected high of
            ${forecast['maxtempC']}°C or ${forecast['maxtempF']}°F and a low of 
            ${forecast['mintempC']}°C or ${forecast['mintempF']}°F on 
            ${forecast['date']}.`;

            response.json({
                speech: responseText,
                displayText: responseText
            });
        });
    });

    
});

const port = process.env.PORT || 8000;

server.listen(port, () => {
    console.log("Server is up and running on port: " + port);
});