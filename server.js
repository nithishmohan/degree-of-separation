var async=require('async');
var zlib=require('zlib');
var zip = zlib.createUnzip();
var _=require('underscore');
var createGraph = require('ngraph.graph');
var g = createGraph();


var readline = require('readline');
var http = require('http');

var firstName= '';
var lastName= '';
var i=0;
var chekingArray=[];


var rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt('Please enter as specified in the documentation > ');
rl.prompt();
rl.on('line', function(line) {
	var str=line.split(/[ ]+/);
	if(str.length!=3){
		console.log("Wrong format, please check the documentation");
		rl.close();
	}
	else{
		firstName= str[1];
		lastName= str[2];
		g.addNode(firstName , {parent :1});
		chekingArray.push(firstName);
		module.exports = movieBuff;
		module.exports.start();
		rl.pause();
	}

    if (line === "exit") rl.close();
}).on('close',function(){
    process.exit(0);
});



var movieBuff = {
  start: function () {
	moviebuffFetch(firstName).then(function(data){
	    if(data.movies)
			moviebuffData=data.movies;
		else
			moviebuffData=data.cast;
		module.exports.arrangeData(moviebuffData);

		// arrangeData(moviebuffData, function(error,data){

		// })
	});
  },

  arrangeData: function (moviebuffData) {
	Promise.all(moviebuffData.map(urlList)).then((data) => {
		data=_.difference(data, chekingArray);
		chekingArray.push(data);
		module.exports.dataProcess(data);
  	});
  },

  dataProcess: function(data){
	Promise.all(data.map(moviebuffFetch)).then(function(data1){
  			Promise.all(data1.map(movieTree)).then(function(data2){
  				var newArr = data2.toString().split(',');
  				newArr=_.difference(newArr, chekingArray);
  				chekingArray.push(newArr);
				if (newArr.indexOf(lastName) > -1) {
					var server = g.getNode(lastName);
					console.log("Degrees of Separation: " + i+1);
					console.log("Fetching data, Please wait...");
					last(server);
				} else {
					i+=1;
					console.log("No "+ i+'st degree connection.');					
					var ar2= _.uniq(newArr);
					module.exports.dataProcess(ar2);
				}

  			});
  		});
  }


};


function urlList(name){
	return new Promise(function (fulfill, reject){
		g.addNode(name.url , {name: firstName, parent :firstName , movie: name.name, role: name.role});
		g.addLink(firstName, name.url)

		fulfill(name.url);
	});
}

function movieTree(cinema){
	return new Promise(function (fulfill, reject){
		if(cinema.type== 'Person'){
			var i=0;
	        _.each(cinema.movies,function(movies){
	        	if(!g.getNode(movies.url)){
	        		g.addNode(movies.url , {parent :cinema.url , movie:cinema.name, name : movies.name, role: movies.role });
	        		g.addLink(movies.url, cinema.url);
	        	}
            });
			fulfill(_.pluck(cinema.movies, "url"));
		}
		else{
			var i=0;
			_.each(cinema.cast,function(movies){
				if(!g.getNode(movies.url)){
					g.addNode(movies.url , {parent :cinema.url, movie:cinema.name, name : movies.name, role: movies.role});
					g.addLink(movies.url, cinema.url)
				}
            });
			_.each(cinema.crew,function(movies){
				if(!g.getNode(movies.url)){
	        		g.addNode(movies.url , {parent :cinema.url, movie:cinema.name, name : movies.name, role: movies.role});
            		g.addLink(movies.url, cinema.url)
            	}
            });
			var newArray=cinema.crew.concat(cinema.cast);
			fulfill(_.pluck(newArray, "url"));
		}
		
	});
}


function last(node, callback){
	console.log("\n\nMovie: ", node.data.movie);
	console.log("\n"+node.data.role + ": ", node.data.name);
	if(g.getNode(node.data.parent).data.parent==1){
		callback();
		process.exit(0)
		return false;
	}
	else{
		last(g.getNode(node.data.parent));
	} 
}


// function last(parent, callback){
// 	if(g.getNode(parent).data.parent==1){
// 		callback();
// 		process.exit(0)
// 		return false;
// 	}
// 	else{
// 		console.log(g.getNode(parent).data);
// 		last(g.getNode(parent).data.parent);
// 	} 
// }
function moviebuffFetch(name){
	return new Promise(function (fulfill, reject){
			var req = http.request({
				host: 'data.moviebuff.com',
				path: '/'+name,
				headers: {"authorization":"Basic xxxxxxx","accept":"application/json, application/xml, text/json, text/x-json, text/javascript, text/xml","content-type":"Application/Json", "accept-encoding":"gzip, deflate"},
				json:true
			}, function(response) {
				    //var decoder = new StringDecoder('utf8');

				var body = '';


			    if( response.headers['content-encoding'] == 'gzip' ) {
			      var gzip = zlib.createGunzip();
			      response.pipe(gzip);
			      output = gzip;
			    } else {
			    	//console.log(response);
			     // output = response;
			    }

			    output.on('data', function (data) {
			       data = data.toString('utf-8');
			       body += data;
			    });

			    output.on('end', function() {
			    	//console.log(JSON.parse(body));
			    	fulfill(JSON.parse(body));
			    	//callback(null,JSON.parse(body))
			    });


				response.on('error', function(error){
					console.log("error", error)
				})
			});
	 
			req.end();
	});

};
