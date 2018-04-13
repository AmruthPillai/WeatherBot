const express = require('express'); // Express allows you to create servers in Node.js
const bodyParser = require('body-parser'); // BodyParser allows you to intercept and understand HTTP requests
const https = require("https"); // HTTPS is a module to help us make REST API Requests
const server = express(); // Bootstrapping our Server

// Setting up BodyParser
server.use(bodyParser.urlencoded({
    extended: true
}));
server.use(bodyParser.json());

// If people visit '/' route, show this message
server.get('/', (req, res) => {
    res.send('You must point the route to /webhook.')
});

// Simple Barebones Webhook, just sends text to Dialogflow
server.post('/webhook', (req, res) => {
    let responseText = 'This is from the webhook!';

    // Send the response to Dialogflow
    // speech: what assistant should speak
    // displayText: what assistant should display
    res.json({
        speech: responseText,
        displayText: responseText
    });
});

// Completed Webhook for Weather Forecasting
server.post('/weather', (req, response) => {
    const wwoApiKey = process.env.WWO_API_KEY || ''; // Get your free API key here: https://developer.worldweatheronline.com/

    // The following lines of code, from 35 to 41, are to generate a default date (today) if not specified by the user
    var dateString = '';
    var todaysDate = new Date();

    // Get today's date in YYYY/MM/DD format
    dateString += todaysDate.getFullYear() + '-';
    dateString += ("0" + (todaysDate.getMonth() + 1)).slice(-2) + '-';  
    dateString += ("0" + todaysDate.getDate()).slice(-2);

    // Store the parameters we need in a easy to access variable
    // You can check out the documentation for Dialogflow Fulfillment Webhook Request and Repsonse
    // JSON Structure at this url: https://dialogflow.com/docs/fulfillment
    let date = req.body.result.parameters['date'] || dateString;
    let city = req.body.result.parameters['geo-city'];

    // Path to World Weather Online is predefined in their website documentation,
    // which can be found here: https://developer.worldweatheronline.com/api/docs/local-city-town-weather-api.aspx
    let path = 'https://api.worldweatheronline.com/premium/v1/weather.ashx?format=json&num_of_days=1' +
    '&q=' + encodeURIComponent(city) + '&key=' + wwoApiKey + '&date=' + date;

    // Send a HTTP GET Request to the above URL
    // The response (result) will be a JSON of Weather Information
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
            let responseText = `Current conditions in the ${location['type']} ${location['query']} are ${currentConditions} with a projected high of ${forecast['maxtempC']}°C or ${forecast['maxtempF']}°F and a low of ${forecast['mintempC']}°C or ${forecast['mintempF']}°F on ${forecast['date']}.`;

            // Send the response to Dialogflow
            // speech: what assistant should speak
            // displayText: what assistant should display
            response.json({
                speech: responseText,
                displayText: responseText
            });
        });
    });
});

// Define PORT in .env, or default to 8080
const port = process.env.PORT || 8080;

// Start the server, listening to a specific port
server.listen(port, () => {
    console.log("Server is up and running on port: " + port);
});