var http = require('http');
var fs = require("fs");
var request = require('sync-request');
var express = require('express');
var path = require('path');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ resave: true, saveUninitialized: true, secret:"asdfasdfasdf"}));
app.set('view engine', 'ejs');

function getEvents(keyWord) {
    var response = request('GET', `https://app.ticketmaster.com/discovery/v2/events.json?apikey=6plRYXF5IWdxFCn3qI5XADipf8BoJ4br&keyword=${keyWord}`);
    var events = JSON.parse(response.getBody())._embedded.events;
    var html = "";
    for(var i = 0; i < events.length; i++) {
        var event = fs.readFileSync('event.html', 'utf-8');
        var title = events[i].name;
        var buyLink = events[i].url;
        var venue = events[i]._embedded.venues[0].name;
        var date = events[i].dates.start.localDate;
        app.locals.date = date;
        app.locals.title = title;
        app.locals.buyLink = buyLink;
        app.locals.venue = venue;
        app.locals.venueLink = `/events/${venue}`;
        event = ejs.render(event, app.locals);
        html += event;
    }
    return html;
}

function getDraftRound(sport, league, round) {
    var response = request('GET', `http://api-app.espn.com/v1/sports/${sport}/${league}/draft`);
    var draft = JSON.parse(response.getBody()).draft;
    var html = ``;
    var numPicks = draft.rounds[round - 1].picks.length;
    for(var i = 0; i < numPicks; i++) {
        var draftPick = draft.rounds[round - 1].picks[i].athlete;
        var location = draft.rounds[round -1].picks[i].team.location;
        var color = draft.rounds[round -1].picks[i].team.color;
        var name = draft.rounds[round -1].picks[i].team.name;
        var teamName = location + " " + name;
        if(draft.rounds[round - 1].picks[i].athlete.schools != undefined) {
            var school = draft.rounds[round - 1].picks[i].athlete.schools[0].name;
        } else {
            var school = "NA"
        }
        var pick = draft.rounds[round - 1].picks[i].overall;
        var player = fs.readFileSync('player.html', 'utf-8');
        app.locals.buyLink = `/events/${teamName}`;
        app.locals.name = draftPick.fullName;
        app.locals.team = location;
        app.locals.school = school;
        app.locals.pick = pick;
        app.locals.color = color;
        app.locals.schoolLink = `/events/${school}`;
        player = ejs.render(player, app.locals);
        html += player;
    }
    return html;
}

app.get('/', function (req, res) {
   fs.readFile('./header.html', function read(err, data) {
        res.end(data);
    });
});

app.get('/nba', function (req, res) {
    fs.readFile('./header.html', function read(err, data) {
        fs.readFile('./nba.html', function read(err, nba) {
            data += nba;
            res.end(data);
        });
    });
});

app.get('/nba/:round', function (req, res) {
    var round = req.params.round;
    fs.readFile('./header.html', function read(err, data) {
        fs.readFile('./nba.html', function read(err, nba) {
            var html = getDraftRound('basketball', 'nba', round);
            data += nba;
            data += html;
            res.end(data);
        });
    });
});

app.get('/nfl', function (req, res) {
    fs.readFile('./header.html', function read(err, data) {
        fs.readFile('./nfl.html', function read(err, nfl) {
            data += nfl;
            res.end(data);
        });
    });
});

app.get('/nfl/:round', function (req, res) {
    var round = req.params.round;
    fs.readFile('./header.html', function read(err, data) {
        fs.readFile('./nfl.html', function read(err, nfl) {
            var html = getDraftRound('football', 'nfl', round);
            data += nfl;
            data += html;
            res.end(data);
        });
    });
});

app.get('/events/:keyWord', function (req, res) {
    var keyWord = req.params.keyWord;
    var html = "";
    fs.readFile('./header.html', function read(err, data) {
        html += getEvents(keyWord);
        data += html;
        res.end(data);
    });
});

app.listen(3000, function () {
    console.log('Listening on port 3000!')
});