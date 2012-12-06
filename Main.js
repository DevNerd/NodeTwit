// modules
var Twit = require('twit');

// colors for console.log
var red, blue, reset;
red     = '\033[31m';
green   = '\033[32m';
yellow  = '\033[33m';
blue    = '\033[34m';
magenta = '\033[35m';
cyan    = '\033[36m';
reset   = '\033[0m';

var command = process.argv[2],
    arguments = process.argv.splice(3),
    arg = arguments,
    woeid = 1,
    DST = 1;

if (command != 'stream' && command != 'search' && command != 'lookup' && command != 'trends') {
  console.log('Usage: node app.js <command> <arguments>');
  console.log('<command> = search / stream / lookup / trends'); 
  return false;
}
if (arguments.length < 1) {
  if (command === 'trends'){

  } else if (command !== 'lookup'){
    console.log('Usage: node app.js '+command+' <arguments>');
    console.log('<arguments> = keyword keyword ...');   
    console.log('Supply one ore more keywords to find in the ' + command); 
    return false;
  } else {
    console.log('Usage: node app.js '+command+' <username>');
    return false;
  }  
};

/* maybe provide a list with countries + woeid, at the moment only worldwide (1) and Netherlands(23424909) is supported */

if (command === 'trends'){
  if (arguments.length >= 1 && arguments[0] == 'nl'){
    woeid = 23424909; // <-- This woeid, according to Yahoo, represents The Netherlands
  }
} else if (command === 'lookup'){
  console.log('Lookup user: '+ arguments[0]);
} else {
  console.log('Search '+ ((command == 'stream')?'in stream ':'') + 'for: "' + arguments + '"');
}

// New Twit object, insert tokens
var T = new Twit({
  consumer_key: '',
	consumer_secret: '',
	access_token: '',
	access_token_secret: ''
});
Date.prototype.addHours= function(h){
    var copiedDate = new Date(this.getTime());
    copiedDate.setHours(copiedDate.getHours()+h);
    return copiedDate;
}

var del = red + " | ";

function outputTweet(tweet,tijd,bericht){
  var x = reset;
  x += yellow + tijd + del; // tijd
  x += cyan + tweet.user.lang + del; // user language
  x += String("                   " + green + tweet.user.screen_name).slice(-20) + del; // screenname
  x += String("         " + cyan + tweet.user.friends_count).slice(-10) + del; // following
  x += String("         " + cyan + tweet.user.followers_count).slice(-10) + del; // followers
  x += yellow + ((tweet.in_reply_to_user_id || tweet.in_reply_to_status_id) ? "RP" : "OT") + del // Is it a reply (RP) or original tweet (OT)
  x += yellow + ((tweet.retweeted_status) ? "RT" : "  ") + del // Is it a retweet?
  x += cyan + bericht;
  x += reset;
  //console.log(tweet);
  console.log(x);
};

if (command == 'trends') {
  T.get('trends/place', { id : woeid }, function(err, reply) {
    if (err){console.log(err); return false}
    console.log('trends for: '+reply[0].locations[0].name+'\r\n');
    for (var i=0; i < reply[0].trends.length; i++) {
      console.log('--> '+ reply[0].trends[i].name);
    };
  });
};
if (command == 'lookup') {
  T.get('users/lookup', { screen_name : arguments[0]}, function(err, reply) {
    if (err){console.log(err); return false}
    console.log(reply[0]);
  });
};
if (command == 'search') {
  T.get('search/tweets', { q: arguments.join(' OR '), count: 50 }, function(err, reply) {
    if (err){console.log(err); return false}
    for (var i=0; i < reply.statuses.length; i++) {
      var tweet = reply.statuses[i];
      var bericht = reply.statuses[i].text;
      var tijd = new Date(reply.statuses[i].created_at).addHours(DST).toISOString().replace(/T/, ' ').replace(/\..+/, '');
      for(var woord in arg){
        r = new RegExp('(' + arg[woord].replace(/[A-z]+:(.*)/,'$1').split(' ').join('|') + ')','ig');
        bericht = bericht.replace(r, reset + magenta + '$1' + cyan);
      }
      outputTweet(tweet,tijd,bericht);
    };
  });
};
if (command == 'stream') {
  var stream1 = T.stream('statuses/filter', { track: arguments });
  stream1.on('tweet', function (tweet) {
    var bericht = tweet.text, r = null;
    var tijd = new Date(tweet.created_at).addHours(DST).toISOString().replace(/T/, ' ').replace(/\..+/, '');
    for(var woord in arg){
      r = new RegExp('(' + arg[woord].replace(/[A-z]+:(.*)/,'$1') + ')','ig');
      bericht = bericht.replace(r, reset + magenta + '$1' + cyan);
    };
    outputTweet(tweet,tijd,bericht);
  }).on('limit', function (limitMessage) {
    console.log(limitMessage);
  }).on('delete', function (deleteMessage) {
    console.log(deleteMessage);
  }).on('disconnect', function (disconnectMessage) {
    console.log(disconnectMessage);
  });
};