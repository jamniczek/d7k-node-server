const express = require('express');
const bodyParser = require('body-parser');
const dialogflow = require('dialogflow');
const axios = require('axios');
const uuid = require('uuid');
const cors = require('cors');

const projectId = process.env.KEY;
const tasteDiveKey = process.env.TASTEDIVE;
const sessionClient = new dialogflow.SessionsClient();


const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json());

app.post('/recognize', (req, res) => {
console.log(req.body)
    const sessionId = uuid();
    const { query } = req.body;
    const languageCode = 'en-US';

    const sessionPath = sessionClient.sessionPath(projectId, sessionId);

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: query,
                languageCode: languageCode,
            },
        },
    };

    sessionClient
        .detectIntent(request)
        .then(responses => {
            console.log('Detected intent');
            const result = responses[0].queryResult;
            console.log(`  Query: ${result.queryText}`);
            if (result.intent) {
                console.log(`  Intent: ${result.intent.displayName}`);
                const response = {
                    intent: result.intent.displayName,
                    message: {
                        type: result.fulfillmentMessages[0].payload.fields.type.stringValue,
                        text: result.fulfillmentMessages[0].payload.fields.text.stringValue,
                    }
                }
                res.send(response)
            } else {
                console.log(`  No intent matched.`);
            }
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
});

app.post('/recommend', (req, res) => {
    const titles = req.body.titles.map(title => encodeURI(title));
  
    axios.get(`https://tastedive.com/api/similar?info=1&limit=5&q=${titles[0]}%2C${titles[1]}&%2C${titles[2]}&k=${tasteDiveKey}`)
      .then((results) => {
        return res.send(results.data);
      })
      .catch(err => res.status(500).send(err.message));
  });

app.listen(PORT);
