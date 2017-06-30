
// Lex Hangman Bot

// Jacopo Mangiavacchi.

'use strict';

var HangmanGame = require("./HangmanGame");

var maxNumberOfTry = 9;

// Close dialog with the customer, reporting fulfillmentState of Failed or Fulfilled ("Thanks, your pizza will arrive in 20 minutes")
function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        }
    };
}

// --------------- Events -----------------------
function dispatch(intentRequest, callback) {
    console.log(`request received for userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    let sessionAttributes = {};
    if (intentRequest.sessionAttributes != null) {
       sessionAttributes = intentRequest.sessionAttributes
    }
    const slots = intentRequest.currentIntent.slots;
    const intent = intentRequest.currentIntent.name
    
    let game = new HangmanGame.HangmanGame();

    if (sessionAttributes['persistedGame'] == undefined) {
        getSecret( (secret) => {
            console.log(`secret = ${secret}`)
            if (secret.length > 0) {
                game = new HangmanGame.HangmanGame(secret, maxNumberOfTry);
                sessionAttributes['persistedGame'] = game.saveToString();
                console.log(`persistedGame = ${sessionAttributes['persistedGame']}`)

                processIntent(intent, slots, game, sessionAttributes, callback);
            }
            else {
                console.log(`Error: not able to generate a new secret word at the moment`)
                callback(close(sessionAttributes, 'Fulfilled', {'contentType': 'PlainText', 'content': `I am deeply sorry, I am not able to generate a new secret word at the moment. Please retry in a bit.`}));
            }
        });
    }
    else {
        game.loadFromString(sessionAttributes['persistedGame']);
        processIntent(intent, slots, game, sessionAttributes, callback);
    }
}


// --------------- Main handler -----------------------
// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        dispatch(event,
            (response) => {
                callback(null, response);
            });
    } catch (err) {
        callback(err);
    }
};


function processIntent(intent, slots, game, sessionAttributes, callback) {
    switch (intent) {
        case "Explain":
            break;
    
        case "Point":
            break;
    
        case "Surrender":
            break;
    
        case "TryLetter":
            if (slots.letter === undefined || slots.letter.length === 0) {
                callback(close(sessionAttributes, 'Fulfilled', {'contentType': 'PlainText', 'content': `Naaah, you didn't provide a letter (${slots.letter}) !`}));
            }   
            else {
                const letter = slots.letter.toLowerCase().substr(0, 1);
                callback(close(sessionAttributes, 'Fulfilled', {'contentType': 'PlainText', 'content': `Okay, You asked the letter ${letter}.  The secret is (${game.secret})!`}));
            }
            break;
    
        case "Guess":
            if (slots.word === undefined || slots.word.length === 0) {
                callback(close(sessionAttributes, 'Fulfilled', {'contentType': 'PlainText', 'content': `Naaah, you didn't provide a word (${slots.word}) !`}));
            }   
            else {
                const word = slots.word.toLowerCase();
                console.log(sessionAttributes)
                callback(close(sessionAttributes, 'Fulfilled', {'contentType': 'PlainText', 'content': `Okay, You asked the word ${word} (${slots.word}) and The secret is (${game.secret})!`}));
            }
            break;

        default:
            console.log(`wrong intent - ${intent}`)
            callback(close(sessionAttributes, 'Fulfilled', {'contentType': 'PlainText', 'content': `Wrong intent`}));
            break;
    }
}


function getSecret(callback) {
    //var url = `http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=true&minCorpusCount=0&minLength=5&maxLength=12&limit=1&api_key=${process.env.WORDNIK_APIKEY}`
    var url = `http://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=true&includePartOfSpeech=noun&excludePartOfSpeech=proper-noun&minCorpusCount=1&maxCorpusCount=-1&minDictionaryCount=3&maxDictionaryCount=-1&minLength=5&maxLength=8&limit=1&api_key=${process.env.WORDNIK_APIKEY}`

    var request = require('request');
    request(url, function (error, response, body) {
        if (error !== null) {
            console.log(`***** ERROR ***** getSecret (${error})`);
            callback("");
        }
        else {
            var jsonBody = [];

            try {
                jsonBody = JSON.parse(body);
                var secret = jsonBody[0].word;
                callback(secret);
            }
            catch (e) {
                console.log(`***** ERROR CATCH ***** getSecret (${e}) (${jsonBody})`);
                callback("");
            }
        }
    });
}

function getDefinition(secret, callback) {
    let url = `http://api.wordnik.com/v4/word.json/${secret}/definitions?api_key=${process.env.WORDNIK_APIKEY}`

    let request = require('request');
    request(url, function (error, response, body) {
        let definition = ""
        if (error !== null) {
            console.log(`***** ERROR ***** getDefinition (${error})`);
        }
        else {
            if (body.length <= 2) {
                console.log(`WARNING no definition for (${secret})`);
            }
            else {
                let jsonBody = [];

                try {
                    jsonBody = JSON.parse(body);
                    definition = jsonBody[0].text;
                }
                catch (e) {
                    console.log(`***** ERROR CATCH ***** getDefinition (${e}) (${jsonBody})`);
                }
            }
        }

        callback(definition);
    });
}