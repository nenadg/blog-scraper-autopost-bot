var OAuth = require('oauth'),
	jsdom 	= require('jsdom'),
	DOMParser = require('xmldom').DOMParser;

global.DOMParser = DOMParser;

// twitter api configuration, target configuration etc. configurations
var config = (function(){

	var apiKey 			    = 'your-api-key',							// api key
		apiKeySecret  	    = 'your-api-key-secret',					// api key secret
		accessToken 	    = 'your-api-key-token',					// access token
		accessTokenSecret  = 'your-api-key-token-secret',			// access token secret
		targetBlog 			 = 'http://your-blog.com';					// address of your blog

	return {
		apiKey			    : apiKey,
		apiKeySecret 	    : apiKeySecret,
		accessToken 	    : accessToken,
		accessTokenSecret  : accessTokenSecret,
		targetBlog 			 : targetBlog,
		posts 				 : [],
		backInterval 		 : null
	}
})();

// oauth to twitter api
var oauth = new OAuth.OAuth(
	'https://api.twitter.com/oauth/request_token',
	'https://api.twitter.com/oauth/access_token',
	config.apiKey,
	config.apiKeySecret,
	'1.0A',
	null,
	'HMAC-SHA1');

// scraps article title, link and excerpt with jsdom
var scrap = function() {
	console.log('>> scraping ' + config.targetBlog + ' started.'); 
	jsdom.env({
		url: config.targetBlog,
		done: function (errors, window) {
			if (!errors) {

				// NOTE: this part is orientational and will vary.
				//			You'll have to change selectors to mach your blog.
				var document = window.document,
					entryTitles = document.querySelectorAll('.entry-title > a'), i;

				global.document = document;

				for(i in entryTitles){ 
					if(entryTitles.hasOwnProperty(i) && typeof entryTitles[i] == 'object'){

						var post = { title: entryTitles[i].innerHTML, url: entryTitles[i].getAttribute('href') },
							excerpt;

						var parentArticle = findParent(entryTitles[i], 'article');

						if(parentArticle){
							var entrySummary = findChild(parentArticle, '.entry-summary');

							if(entrySummary){
								excerpt = entrySummary[0].innerHTML.replace(/(<([^>]+)>)|(\Read more »)|(\n)|(\t)|(\&nbsp;)/ig, '');
								post.excerpt = excerpt;
							}
						}

						config.posts.push(post); 
					}
				}

				console.log('>> scraping ' + config.targetBlog + ' done. We\'ve got ' + config.posts.length + ' articles.');

			} else {
				// throw error
				return new Error(errors);
			}
		}
	});
};

var run = function(){
	
	if(config.backInterval){
		clearInterval(config.backInterval);
	}

	var tweet = function(){
		// these things, like hash tags and recommendation texts will be put out of randomness to make tweets more colorful
		var hashTags = ['#Code', '#JavaScript', '#Blog'],
			goForIt = ['check it out at', 'read more', 'find out', 'more at'],
			randomFromPosts = config.posts[Math.floor(Math.random() * config.posts.length)],
			tweetText =  randomFromPosts.title + ' ... ' + hashTags[Math.floor(Math.random() * hashTags.length)] + ' ' + goForIt[Math.floor(Math.random() * goForIt.length)] + ' ' + randomFromPosts.url;
		
		// i've decided to show title instead of excerpt, because links can be long so tweet can be > 140 chars long
		// until i figure out how to get shorturl from some service this shall remain like this.
		var shortenedExcerpt = randomFromPosts.title.split(' ');
			
		while(tweetText.length > 140){
			shortenedExcerpt.pop();
			tweetText = shortenedExcerpt.join(' ') + ' ... ' + hashTags[Math.floor(Math.random() * hashTags.length)] + ' ' + goForIt[Math.floor(Math.random() * goForIt.length)] + ' ' + randomFromPosts.url;
		}

		console.log('>> tweeting: "'  + tweetText + '"');

		oauth.post(
			"https://api.twitter.com/1.1/statuses/update.json",
			config.accessToken,
			config.accessTokenSecret,
			{ "status": tweetText },
			function(e, d) { if(e) console.log(e); else  console.log('>> tweet posted, waiting for another 8 hours for next.\n'); } );

		// tweet every 12 hours
		config.backInterval = setInterval(run, 43200000);
			
	};

	var cnt = 0;
	var waitInterval = setInterval(function(){

		if(config.posts.length > 0){
			clearInterval(waitInterval);
			tweet();
		}

		if(cnt == 60000/10){
			clearInterval(waitInterval);
			
			console.log('>> timeout, site unresponsive, I\'ll try again in 4 hours');
			config.backInterval = setInterval(run, 43200000);
			
		} else {
			cnt++;
		}
	}, 10);

	scrap();
};

run();

function collectionHas(a, b) {
	
	for(var i = 0, len = a.length; i < len; i ++) {
		if(a[i] == b) return true;
	}

	return false;
};

function findParent(element, selector) {
	
	var all = document.querySelectorAll(selector),
		current = element.parentNode;

	while(current && !collectionHas(all, current)) {
		current = current.parentNode;
	}

	return current; // will return null if not found
};

function findChild(element, selector) {

	return element.querySelectorAll('.' + element.getAttribute('class').replace(/\s/g, '.') + ' > ' + selector );
};