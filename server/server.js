Meteor.publish("shares", function (fbid) {
  return Shares.find({ud:fbid,problem:"none"}, {sort: {dt: -1}});
});


Meteor.methods({
	getFBid : function() {
		try {
		  this.unblock();	
		  return Meteor.user().services.facebook.id;
		} catch(e) {
		  return null;
		}
	},
	getFBname : function() {
		  try {
			this.unblock();  
			return Meteor.user().profile.name;		
		} catch(e) {
			return null;
		}
	},
	getFBaccesstoken : function() {
		  try {
			this.unblock();  
			return Meteor.user().services.facebook.accessToken;		
		} catch(e) {
			return null;
		}
	},
	getfriendList: function() {
		this.unblock();
			var url = "https://graph.facebook.com/me/friends?access_token="+Meteor.user().services.facebook.accessToken;
			//synchronous GET
			var result = Meteor.http.get(url, {timeout:30000});
			if(result.statusCode==200) {
				var respJson = JSON.parse(result.content);
				console.log("response received.");
				return respJson;
			} else {
				console.log("Response issue: ", result.statusCode);
				var errorJson = JSON.parse(result.content);
				throw new Meteor.Error(result.statusCode, errorJson.error);
			}
	},
	removeErroneousVideo: function(errVid) {
		this.unblock();
		if(errVid !== undefined || errVid !== "")
		{
			//Shares.remove({_id:errVid._id});
			//Videos.remove({_id:errVid.sl});
			console.log("will remove following ERRONEOUS share"+errVid._id+"!!");
			console.log("will remove following ERRONEOUS video"+errVid.sl+"!!");
		}
	},
	checkYoutubeVidsForMusicLinks: function(id) {
		this.unblock();
		var linkCount = 0;
		var vidIDSet = new Array();
		var uncheckedShares = Shares.find({ud:id,problem:"unchecked"}, {sort: {dt: -1}}).fetch();
		while(linkCount < uncheckedShares.length)
		{
			var ytValidityCheckURL = "https://gdata.youtube.com/feeds/api/videos/#URL#?v=2";
			var vidID = fbLinkList[linkCount].url.toString().substring(fbLinkList[linkCount].url.toString().indexOf("v=")+2);
			vidIDSet[linkCount] = vidID;
			//console.log("validityCheck URL: "+ ytValidityCheckURL.replace("#URL#",vidID));
			console.log("VIDID: "+vidID);

			linkCount++;
		}

		linkCount = 0;
		while(linkCount < vidIDSet.length)
		{

		}
	},
	shareFind: function(id,datesort,mode) {
		try
		{
			this.unblock();
			//synchronous GET
			console.log("sharefind called with id:"+id+"!! datesort of:"+datesort+"!! and mode of:"+ mode);
			if(id != null)
			{
				if(mode == "all")
				{
					var validVids = Videos.find({}).fetch();
					var vidCount = 0;
					var validVidArray = new Array();
					while(vidCount < validVids.length)
					{
						validVidArray.push("'"+validVids[vidCount]["_id"]+"'");
						vidCount++;
					}
					//console.log("%%%%%%% THIS IS THE VALID vid array length: "+ validVidArray +"%%%%%%%%%%%%%%%%%%%%%%%%%!!!!!");
					var shareFindResult = Shares.find({ud:id,problem:"none",sl: { $in: validVidArray}}, {sort: {dt: datesort}}).fetch();
					//var shareFindResult = Shares.find({ud:id,problem:"none"}, {sort: {dt: datesort}}).fetch();
					console.log("################shareFindResult size is: "+ shareFindResult.length);
					return shareFindResult;
				}
				else if(mode == "unidentifiable")
				{
					var shareFindResult = Shares.find({ud:id,problem: "unidentifiable"}, {sort: {dt: datesort}}).fetch();
					//var pCount = 0;
					
					//console.log("shareFindResult size is: "+ shareFindResult.length);
					return shareFindResult;
				}
				else
				{
					//find one using _id and not user id
					var shareFindResult = Shares.findOne({_id:id});
					return shareFindResult;
				}
				
				if(shareFindResult != "")
				{
					console.log("returning the sharefind result: "+shareFindResult);
					return shareFindResult;
				}
				else
				{
					console.log("returning the blankk sharefind result: "+shareFindResult);
					return "";
				}
			}
			else
			{
				console.log("returning the blank result: "+shareFindResult);
				return "";
			}
		}
		catch(err)
		{
			console.log("Encountered error while finding shares:" + err);
		}
	},
	vidFindMatch: function(link) {
		try
		{
			this.unblock();
			//synchronous GET
			console.log("vidfindMATCH called with link:"+link);
			var vidFindMatchResult = Videos.findOne({_id:link});
			console.log("vidFindMatchResult is: "+ vidFindMatchResult);

			if(vidFindMatchResult !== "" && vidFindMatchResult !== [])
			{
				console.log("returning the vidFindMatchResult result: "+vidFindMatchResult);
				return vidFindMatchResult;
			}
			else
			{
				console.log("returning the blankk vidFindMatchResult result: "+vidFindMatchResult);
				return "";
			}
			
		}
		catch(err)
		{
			console.log("Encountered error while finding shares:" + err);
		}
	},
	getPersonalFBYTLinkList: function() {
		this.unblock();
		var lastFBTimeStampObject = Shares.find({ud:Meteor.user().services.facebook.id, "dataSource" : "FB"}, {sort: {dt: -1}, limit: 1}).fetch();
		//Shares.find({ud:Meteor.user().services.facebook.id, "dataSource" : "FB"}).sort({dt: -1}).limit(1).dt;
		console.log("this is what the last FB time stamp object is: "+ lastFBTimeStampObject);
		if(typeof lastFBTimeStampObject == "undefined" || lastFBTimeStampObject == "")
		{
			var lastFBTimeStamp = 0;
		}
		else if(typeof lastFBTimeStampObject == "object")
		{
			var lastFBTimeStamp = lastFBTimeStampObject[0].dt / 1000;
		}
		//ONLY Get FB links newer than the last FB timestam
		console.log("this is the last FB timestamp:"+ lastFBTimeStamp);
		var personalFBLinkQuery = "SELECT link_id, title, created_time, owner_comment, picture, summary, owner, url FROM link WHERE owner = me() AND strpos(url,'youtube.com') >=0 AND created_time > "+lastFBTimeStamp;		
		var url = "https://graph.facebook.com/fql?q="+personalFBLinkQuery+"&access_token="+Meteor.user().services.facebook.accessToken;
		//console.log("url for link list is: "+ url);
		//synchronous GET
		var result = Meteor.http.get(url, {timeout:30000});
		if(result.statusCode==200) {
			var respJson = JSON.parse(result.content);
			console.log("response received.");
			return respJson;
		} else {
			console.log("Response issue: ", result.statusCode);
			//var errorJson = JSON.parse(result.content);
			throw new Meteor.Error(result.statusCode, result.content);
		}
	},
	//get pure youtube links from fb - first get latest timestamp of pure youtube non-groovit video internally
	getPureFBYTLinkList: function() {
		this.unblock();
		var lastPureYTFBTimeStampObject = Shares.find({postedUsing: {$ne: "Groovit"},dataSource: "FB",ud:Meteor.user().services.facebook.id}, {sort: {dt: -1}, limit: 1}).fetch();
		Shares.find({ud:Meteor.user().services.facebook.id, "dataSource" : "FB"}, {sort: {dt: -1}, limit: 1}).fetch();
		//Shares.find({ud:Meteor.user().services.facebook.id, "dataSource" : "FB"}).sort({dt: -1}).limit(1).dt;
		console.log("this is what the last pure FB time stamp object is: "+ lastPureYTFBTimeStampObject);
		if(typeof lastPureYTFBTimeStampObject == "undefined" || lastPureYTFBTimeStampObject == "")
		{
			var lastPureYTFBTimeStamp = 0;
		}
		else if(typeof lastPureYTFBTimeStampObject == "object")
		{
			var lastPureYTFBTimeStamp = lastPureYTFBTimeStampObject[0].dt / 1000;
		}
		//ONLY Get FB links newer than the last FB timestam
		console.log("this is the last PURE Youtube FB timestamp:"+ lastPureYTFBTimeStamp);
		var personalFBLinkQuery = "SELECT link_id, title, created_time, owner_comment, picture, summary, owner, url FROM link WHERE owner = me() AND strpos(url,'youtube.com') >=0 AND created_time > "+lastPureYTFBTimeStamp;		
		var url = "https://graph.facebook.com/fql?q="+personalFBLinkQuery+"&access_token="+Meteor.user().services.facebook.accessToken;
		//console.log("url for link list is: "+ url);
		//synchronous GET
		var result = Meteor.http.get(url, {timeout:30000});
		if(result.statusCode==200) {
			var respJson = JSON.parse(result.content);
			console.log("got pure youtube facebook response received: "+ respJson.data);
			return respJson;
		} else {
			console.log("Response issue while trying to get pure youtube facebook result: ", result.statusCode);
			//var errorJson = JSON.parse(result.content);
			throw new Meteor.Error(result.statusCode, result.content);
		}
	},
	//NOT IN USE NOW//To cross check validity of FB link list with YouTube, to only bring in MUSIC links //NOT IN USE NOW
	updatePeronalShareListWithFBYTLinkList : function(linklist) {
	  try {
			this.unblock();
			//console.log("this is the linklist: "+ linklist);
			if(linklist != null)
			{
				var fbLinkList = linklist;
				var linkCount = 0;
				//console.log("length of link list: "+fbLinkList.length);
				var vidIDSet = new Array();
				while(linkCount < fbLinkList.length)
				{
					//console.log("inside the while loop now iterating on element: "+linkCount);
					
					//console.log("converted to Date object: "+convertedDate);
					//var modifiedMonth = convertedDate.getMonth() + 1;
					//console.log("modified month: "+modifiedMonth);
					//var cleanedDate = convertedDate.getDate()+"/"+modifiedMonth+"/"+convertedDate.getFullYear()+" "+convertedDate.getHours()+":"+convertedDate.getMinutes()+":"+convertedDate.getSeconds()
					//console.log("will convert the date of: "+ fbLinkList[linkCount].title + " from : "+fbLinkList[linkCount].created_time + " to: "+ cleanedDate);
					try
					{
						var ytValidityCheckURL = "https://gdata.youtube.com/feeds/api/videos/#URL#?v=2";
						var vidID = fbLinkList[linkCount].url.toString().substring(fbLinkList[linkCount].url.toString().indexOf("v=")+2);
						vidIDSet[linkCount] = vidID;
						//console.log("validityCheck URL: "+ ytValidityCheckURL.replace("#URL#",vidID));
						console.log("VIDID: "+vidID);
						//var validityResult = Meteor.http.get(ytValidityCheckURL.replace("#URL#",vidID), {timeout:30000});
						
						 /*
						 Meteor.http.get(ytValidityCheckURL.replace("#URL#",vidID), function (err, result) {
							console.log("THIS IS THE RESULT FROM THE API CHECK: "+result.statusCode+"!!!!!!AND THE DATA IS: "+ result.data);
							var validityResult =  result;
							Session.set("validityResult", validityResult);
						});*/
						//console.log("validity result of: " +fbLinkList[linkCount].url+ "|||||||| this video is: "+validityResult[0]);
						//Session.set("validityResult",validityResult);
						/*Shares.insert({
							_id : fbLinkList[linkCount].link_id.toString(), 
							dataSource : "FB", 
							dt : millisecondDate,
							msg : fbLinkList[linkCount].owner_comment, 
							ntw : "FB",
							sl : fbLinkList[linkCount].url,
							st : fbLinkList[linkCount].title, 
							ud : fbLinkList[linkCount].owner.toString()});*/
					}
					catch(err)
					{
						if(err.message.indexOf("E11000 duplicate key error") < 0) //valid error
						{
							console.log("INDEX RESULT: " + err.message.indexOf("MongoError: E11000 duplicate key error index"));
							console.log("error while updating internal data: "+ err.message + ": this one already exists: "+ fbLinkList[linkCount].title);						
							return "error";//console.log("error while updating internal data: "+ err + ": this one already exists: "+ fbLinkList[linkCount].title);						
						}
					}
					
					linkCount++;
				}
				//now check if youtube ID is a music related link
				console.log("LINKCOUNT starts as this: "+ linkCount);
				linkCount = 0;
				console.log("THIS IS THE LINKCOUNT NOW: "+ linkCount);
				console.log("and this is the VIDSET length: "+ vidIDSet.length);
				//console.log("STARTING YT ID CHECK with index at: "+ linkCount);
				var validityResult = new Array();
				while(linkCount < vidIDSet.length)
				{
					
					//console.log("INSIDE YT ID CHECK loop with index at: "+ linkCount);
					/*var params = {
							videoid: vidIDSet[linkCount]
						  };*/
					//this.unblock();
					console.log("calling YT check with index at : "+ ytValidityCheckURL.replace("#URL#",vidIDSet[linkCount]));	  
					Meteor.http.get(ytValidityCheckURL.replace("#URL#",vidIDSet[linkCount]), function (error, result) {
				   if (result.statusCode === 200) {
					  //try
						//{
						 //console.log("CURRENT INDEX IS : "+ linkCount+"||||THIS IS THE RESULT FROM THE API CHECK for VID: "+params.videoid+"!!!!!!AND THE DATA IS: "+ result.content.toString().indexOf("categories.cat' term='Music'"));
						 //Session.set("validityResult", result.content);
						 //if(result.content.toString().indexOf("categories.cat' term='Music'") < 0)
						 var linkBegin = result.content.toString().indexOf("<link");
						 var linkEnd = result.content.toString().indexOf("/>",linkBegin);
						 var idBegin = result.content.toString().indexOf("watch?v=",linkBegin)+8;
						 var idEnd = result.content.toString().indexOf("&amp",idBegin);
						 var linkID = result.content.toString().substring(idBegin,idEnd);
						 var fbResult = fbLinkList[vidIDSet.indexOf(linkID)]
						 var millisecondDate = fbResult.created_time*1000;
						 
						 if(result.content.toString().indexOf("categories.cat' term='Music'") < 0)
						 {	
							console.log("INVALID video: "+result.content.toString().substring(linkBegin,linkEnd)+"!!!!!! for MUSIC is: "+result.content.toString().indexOf("categories.cat' term='Music'"));
							console.log("the vidID for that link is: "+linkID);
							console.log("FB result for same link is: "+fbResult.url+"!!!! and title is: "+fbResult.title);
							try//insert unidentifiable shares found from FB to shares collection, tagged as unidentifiable
							{//can be cleaned up by user as required
								Shares.insert({
								_id : fbResult.link_id.toString(), 
								dataSource : "FB", 
								dt : millisecondDate,
								msg : fbResult.owner_comment, 
								ntw : "FB",
								sl : fbResult.url,
								st : fbResult.title, 
								ud : fbResult.owner.toString(),
								problem: "unidentifiable"});
							}
							catch(err)
							{
								if(err.message.indexOf("E11000 duplicate key error") < 0) //valid error
								{
									console.log("Error while inserting unidentifiable LINK in SHARES collection: " + err.message.indexOf("MongoError: E11000 duplicate key error index"));
									console.log("error while updating internal data: "+ err.message + ": this one already exists: "+ fbResult.title);						
									return "error";//console.log("error while updating internal data: "+ err + ": this one already exists: "+ fbLinkList[linkCount].title);						
								}
							}
						 }
						 else
						 {	
							 try//insert identifiable shares found from FB to shares collection
							 {							 
								Shares.insert({
								_id : fbResult.link_id.toString(), 
								dataSource : "FB", 
								dt : millisecondDate,
								msg : fbResult.owner_comment, 
								ntw : "FB",
								sl : fbResult.url,
								st : fbResult.title, 
								ud : fbResult.owner.toString(),
								problem: "none"});
							}
							catch(err)
							{
								if(err.message.indexOf("E11000 duplicate key error") < 0) //valid error
								{
									//console.log("Error while inserting proper LINK in SHARES collection: " + err.message.indexOf("MongoError: E11000 duplicate key error index"));
									console.log("Error while inserting proper LINK in SHARES collection: "+ err.message + ": this one already exists: "+ fbResult.title);						
									return "error";//console.log("error while updating internal data: "+ err + ": this one already exists: "+ fbLinkList[linkCount].title);						
								}
							}
							
							try//insert identifiable vids found from FB to videos collection
							{
								var artist = "";
								var title = "";
								if(fbResult.title.indexOf("-") >= 0)
								{
									artist = fbResult.title.split("-")[0].toUpperCase();
									title = fbResult.title.split("-")[1].toUpperCase();
								}
								else if(fbResult.title.indexOf(":") >= 0)
								{
									artist = fbResult.title.split(":")[0].toUpperCase();
									title = fbResult.title.split(":")[1].toUpperCase();
								}
								else if(fbResult.title != "")
								{
									artist = "";
									title = fbResult.title.toUpperCase();
								}
								Videos.insert({
								_id : fbResult.url, 
								dataSource : "FB", 
								sa : artist,
								st : title,
								count: 1, 
								sharedBy : [fbResult.owner.toString()+"||"+millisecondDate]});
							}
							catch(err)
							{
								if(err.message.indexOf("E11000 duplicate key error") < 0) //valid error
								{
									//console.log("Error while inserting proper Video in Videos collection: " + err.message.indexOf("MongoError: E11000 duplicate key error index"));
									console.log("OTHER VID error while updating internal data: "+ err.message + ": this one already exists: "+ fbResult.title);						
									//console.log("error while updating internal data: "+ err + ": this one already exists: "+ fbLinkList[linkCount].title);						
								}
								else if(err.message.indexOf("E11000 duplicate key error") >= 0)
								{
									console.log("duplicate VID error:"+err+"; WILL update: "+ fbResult.title);
									Videos.update({_id:fbResult.url}, {$set: {dataSource: "FB"},$push: {sharedBy: fbResult.owner.toString()+"||"+millisecondDate}});
								}
								return "error";
							}
						 }
						}						  
					  });
					  linkCount++;
				  }
					//console.log("CALL OVER, waiting for result with index at : "+ vidIDSet[linkCount] + " and statusCODE of: "+ validityResult[linkCount].statusCode);	
					/*if (validityResult[linkCount].statusCode === 200) {
						 //console.log("this ID: "+validityResult[linkCount]+" got something back from YT!");
						 //console.log("SUCCESS!!!! CURRENT INDEX IS : "+ linkCount+"||||THIS IS THE RESULT FROM THE API CHECK !!!!!!AND THE DATA IS: "+ validityResult[linkCount].content.toString().substring(0,validityResult[linkCount].content.toString().indexOf(vidIDSet[linkCount])+50));
						 //Session.set("validityResult"+linkCount.toString(), validityResult[linkCount].content);
						 //if(result.content.toString().indexOf("categories.cat' term='Music'") < 0)
						 if(validityResult[linkCount].content.toString().indexOf("categories.cat' term='Music'") < 0)
							console.log("this video:"+vidIDSet[linkCount]+"!!!!!! for MUSIC is: "+validityResult[linkCount].content.toString().indexOf("categories.cat' term='Music'"));
					   }*/   
					
				}
				console.log("finished all YT checks");
				//Session.set("validityResult", validityResult[0]);
				Meteor.defer(function() {
					Meteor.flush();
				});
				return "success||"+fbLinkList.length;		
		
    } catch(e) {
		console.log("update error: ", e.message);
		return null;
    }
  },//To further filter FB link list based on application used to share, i.e. Groovit
  updatePeronalFBListWithGroovitLinkList : function(linklist) {
	  try {
			this.unblock();
			
			//console.log("this is the linklist: "+ linklist);
			if(linklist != null)
			{
				var fbLinkList = linklist;
				var linkCount = 0;
				//console.log("length of link list: "+fbLinkList.length);
				var vidIDSet = new Array();
				var postFilter = "";
				while(linkCount < fbLinkList.length)//5//generate the post_id filter to get the attribution / application name for all post_ids
				{
					if(linkCount < fbLinkList.length - 1)//testing: 4
						postFilter += "'"+Meteor.user().services.facebook.id+"_"+fbLinkList[linkCount].link_id + "',";
					else
						postFilter += "'"+Meteor.user().services.facebook.id+"_"+fbLinkList[linkCount].link_id +"'";
						
					linkCount++;
				}
				
				var groovitFBLinkQuery = "SELECT message,created_time,attachment,post_id,attribution FROM stream WHERE post_id IN ("+postFilter+")";		
				var groovitFBLinkUrl = "https://graph.facebook.com/fql?q="+groovitFBLinkQuery+"&access_token="+Meteor.user().services.facebook.accessToken;
				console.log("the full FQL query is: "+ groovitFBLinkQuery);
				//console.log("url for link list is: "+ url);
				//synchronous GET
				var groovitPostResult = Meteor.http.get(groovitFBLinkUrl, {timeout:30000});
				console.log("fb groovit query sent to space! waiting now!!!");
				if(groovitPostResult.statusCode==200) {
					var groovitFBResultSet = JSON.parse(groovitPostResult.content).data;
					console.log("fb groovit response received; first object is:"+groovitFBResultSet[0].message);
					var gCount = 0
					var trackQuery = "";
					var lastFmURL = "http://ws.audioscrobbler.com/2.0/?method=track.search&track=###TRACKQUERY###&api_key=3135d1eacd6085271c24a02d4195cccf&format=json";
					var callsRemaining = groovitFBResultSet.length;
					while(gCount < groovitFBResultSet.length)//JUST FOR TESTING//3
					{
						//console.log("groovit attribution is: "+groovitFBResultSet[gCount].attribution);
						if(groovitFBResultSet[gCount].attribution == "Groovit") {
							//clean up track information for searching Last.FM
							trackQuery = groovitFBResultSet[gCount].attachment.media[0].alt;
							if(trackQuery.indexOf("(") >= 0 && trackQuery.indexOf(")") >= 0)
							{
								var insideBraces = trackQuery.substring(trackQuery.indexOf("(")+1,trackQuery.indexOf(")"));
								trackQuery = trackQuery.replace(insideBraces," ");
								//console.log("what's inside the braces" + insideBraces);
							}
							else if(trackQuery.indexOf("[") >= 0 && trackQuery.indexOf("]") >= 0)
							{
								var insideBraces = trackQuery.substring(trackQuery.indexOf("[")+1,trackQuery.indexOf("]"));
								trackQuery = trackQuery.replace(insideBraces," ");
								//console.log("what's inside the braces" + insideBraces);
							}
							else if(trackQuery.indexOf("{") >= 0 && trackQuery.indexOf("}") >= 0)
							{
								var insideBraces = trackQuery.substring(trackQuery.indexOf("{")+1,trackQuery.indexOf("}"));
								trackQuery = trackQuery.replace(insideBraces," ");
								//console.log("what's inside the braces" + insideBraces);
							}
							
							trackQuery = trackQuery.toUpperCase();
							trackQuery = trackQuery.replace("LYRICS"," ");
							trackQuery = trackQuery.replace("OFFICIAL VIDEO"," ");
							trackQuery = trackQuery.replace("MUSIC VIDEO"," ");
							trackQuery = trackQuery.replace(" FT."," ");
							trackQuery = trackQuery.replace(" BY "," ");
								
							//console.log("the track query ISSS1: "+ trackQuery);					
							
							trackQuery = trackQuery.replace(/[^A-Za-z0-9]/g, " "); //remove special characters - simpler regex
							//trackQuery = trackQuery.replace(/[\|&;\$%@"-<>\(\)\+,]/g, " "); //remove special characters
							//console.log("the track query ISSS2: "+ trackQuery);
							//trackQuery = trackQuery.replace(/[\[\]']+/g, " "); //remove square brackets
							//console.log("the track query ISSS3: "+ trackQuery);
							//trackQuery = trackQuery.replace(/[\{\}']+/g, " "); //remove curly braces
							//console.log("the track query ISSS4: "+ trackQuery);
							trackQuery = trackQuery.replace(/\s{2,}/g, " "); //remove extra whitespace
							//console.log("the track query ISSS5: "+ trackQuery);
							
							var millisecondDate = groovitFBResultSet[gCount].created_time*1000;
							//insert track that has been confirmed to be from Groovit:
							try//insert identifiable shares found from FB to shares collection
							 {							 
								Shares.insert({
								_id : groovitFBResultSet[gCount].post_id.split("_")[1], 
								dataSource : "FB", 
								postedUsing : groovitFBResultSet[gCount].attribution,
								dt : millisecondDate,
								msg : groovitFBResultSet[gCount].message, 
								ntw : "FB",
								sl : groovitFBResultSet[gCount].attachment.media[0].href,
								st : trackQuery, 
								ud : groovitFBResultSet[gCount].post_id.split("_")[0],
								problem: "none"});
							}
							catch(err)
							{
								if(err.message.indexOf("E11000 duplicate key error") < 0) //valid error
								{
									//console.log("Error while inserting proper LINK in SHARES collection: " + err.message.indexOf("MongoError: E11000 duplicate key error index"));
									console.log("Error while inserting proper LINK in SHARES collection: "+ err.message + ": this one already exists: "+ trackQuery +"!!!WILL UPDATE IT with any new info");						
									Shares.update({_id: groovitFBResultSet[gCount].post_id.split("_")[1]}, 
									{
										dataSource : "FB", 
										postedUsing : groovitFBResultSet[gCount].attribution,
										dt : millisecondDate,
										msg : groovitFBResultSet[gCount].message, 
										ntw : "FB",
										sl : groovitFBResultSet[gCount].attachment.media[0].href,
										st : trackQuery, 
										ud : groovitFBResultSet[gCount].post_id.split("_")[0],
										problem: "none"
									});
									//return "error";//console.log("error while updating internal data: "+ err + ": this one already exists: "+ fbLinkList[linkCount].title);						
								}
							}
														
							//console.log("the title was: "+groovitFBResultSet[gCount].attachment.media[0].alt+"and the track query ISSS: "+ trackQuery);
							
							//insert confirmed Groovit video into Videos collection
							try{
								Videos.insert({
									_id : groovitFBResultSet[gCount].attachment.media[0].href, 
									dataSource : "FB", 
									sa : trackQuery,
									st : trackQuery,
									count: 1
								});

								Videos.update({_id : groovitFBResultSet[gCount].attachment.media[0].href},
							                  {$addToSet: {sharedBy: groovitFBResultSet[gCount].post_id.split("_")[0].toString()+"||"+millisecondDate}});	
							}
							catch(err)
							{
								if(err.message.indexOf("E11000 duplicate key error") < 0) //valid error
								{
									//console.log("Error while inserting proper Video in Videos collection: " + err.message.indexOf("MongoError: E11000 duplicate key error index"));
									console.log("OTHER VID error while updating internal data: "+ err.message + ": this one already exists: "+ trackQuery);						
									//console.log("error while updating internal data: "+ err + ": this one already exists: "+ fbLinkList[linkCount].title);						
								}
								else if(err.message.indexOf("E11000 duplicate key error") >= 0)
								{
									console.log("duplicate VID error:"+err+"; WILL update: "+ trackQuery);
									Videos.update({_id:groovitFBResultSet[gCount].attachment.media[0].href}, 
												  {$set: {dataSource: "FB"}}, 
												  {$addToSet: {sharedBy: groovitFBResultSet[gCount].post_id.split("_")[0].toString()+"||"+millisecondDate}});
									Videos.update({_id:groovitFBResultSet[gCount].attachment.media[0].href}, 
												  {$inc: {count: 1}});
								}
								//return "error";
							}
							
							
							//check Last.FM for song confirmation
							Meteor.http.get(lastFmURL.replace("###TRACKQUERY###",trackQuery),{timeout:30000}, function (error, LFMResult) {
							if (LFMResult.statusCode === 200) {
								//console.log("Last fm query result is: "+ LFMResult.content);
								var LFMResultList = JSON.parse(LFMResult.content);//y.results.trackmatches.track[0]
								//if last.fm has a track match get the artist / song / album art details to update DB with
								if(LFMResultList.results != undefined && LFMResultList.results.trackmatches.track != undefined && LFMResultList.results.trackmatches.track.length > 0){
									var LFMArtist = "";
									var LFMTitle = "";
									if(LFMResultList.results.trackmatches.track[0].artist != "[unknown]")
									{
										LFMArtist = LFMResultList.results.trackmatches.track[0].artist;
										LFMTitle = LFMResultList.results.trackmatches.track[0].name;
									}
									else if(LFMResultList.results.trackmatches.track[1] != undefined && LFMResultList.results.trackmatches.track[1].artist != "[unknown]")
									{
										LFMArtist = LFMResultList.results.trackmatches.track[1].artist;
										LFMTitle = LFMResultList.results.trackmatches.track[1].name;
									}								
									
									var LFMlargeAlbumArt = "";
									var LFMmediumAlbumArt = "";
									if(LFMResultList.results.trackmatches.track[0].image != undefined)
									{
										if(LFMResultList.results.trackmatches.track[0].image.length == 4)
										{
											LFMlargeAlbumArt = LFMResultList.results.trackmatches.track[0].image[3]["#text"];
											LFMmediumAlbumArt = LFMResultList.results.trackmatches.track[0].image[2]["#text"];
										}
										else if(LFMResultList.results.trackmatches.track[0].image.length > 0)
										{
											var artIndex = LFMResultList.results.trackmatches.track[0].image.length -1;
											LFMlargeAlbumArt = LFMResultList.results.trackmatches.track[0].image[artIndex]["#text"];
										}
										//console.log("the working result album art is: "+ LFMlargeAlbumArt);
									}
									//console.log("the working result ARTIST is: "+ LFMArtist);
									//console.log("the working result title is: "+ LFMTitle);

									
									try{
										if(LFMlargeAlbumArt != "" && LFMmediumAlbumArt == "")
										{
											Videos.update({sa: LFMResultList.results["opensearch:Query"].searchTerms, st: LFMResultList.results["opensearch:Query"].searchTerms}, 
														  { $set: { sa: LFMArtist, st: LFMTitle, dataSource : "FB", largeAlbumArt: LFMlargeAlbumArt }}
											);
										}
										else if(LFMlargeAlbumArt != "" && LFMmediumAlbumArt != "")
										{
											Videos.update({sa: LFMResultList.results["opensearch:Query"].searchTerms, st: LFMResultList.results["opensearch:Query"].searchTerms}, 
												          { $set: { sa: LFMArtist, st: LFMTitle, dataSource : "FB", largeAlbumArt: LFMlargeAlbumArt, mediumAlbumArt: LFMmediumAlbumArt }}
											);
										}
										else if(LFMlargeAlbumArt == "" && LFMmediumAlbumArt == "") // no album art, just update artist / track details
										{
											Videos.update({sa: LFMResultList.results["opensearch:Query"].searchTerms, st: LFMResultList.results["opensearch:Query"].searchTerms}, 
													      { $set: { sa: LFMArtist, st: LFMTitle, dataSource : "FB" }}
											);
										}
										console.log("calls remaining: "+callsRemaining);
										callsRemaining--;
										//return "success";
									}
									catch(err)
									{
										console.log("OTHER VID error while updating vid with LFM results: "+ err.message + ": this one already exists: "+ LFMResultList.results["opensearch:Query"].searchTerms);	
									}
									
									//console.log("Last FM result size is: "+ LFMResultList.length);
									//console.log("groovit message is: "+groovitFBResultSet[gCount].message);
									//console.log("groovit attachment title is: "+groovitFBResultSet[gCount].attachment.media[0].alt);
									//console.log("groovit attachment link is: "+groovitFBResultSet[gCount].attachment.media[0].href);	
									//console.log("groovit post ID is: "+groovitFBResultSet[gCount].post_id.split("_")[1]);	
								}
							  }
							  else
							  {
								 console.log("calls remaining: "+callsRemaining+"!!! result code is: "+LFMResult);
								 callsRemaining--;
								 return "success";
							  }						  
							});					
						}
						gCount++;
					}
					//return "success";
				} else {
					console.log("groovit facebook Response issue: "+ groovitPostResult.content);
					//var errorJson = JSON.parse(result.content);
					//throw new Meteor.Error(groovitPostResult.statusCode, groovitPostResult.content);
					
				}
			}
					
    } catch(e) {
		console.log(e+"!!! is the actual error and this is the groovit update error MESSAGE: "+ e.message);
		return null;
    }
  },//To update internal share list with PURE youtube list and NOT via Groovit
  updatePeronalFBListWithPureLinkList : function(linklist) {
	  try {
			this.unblock();
			
			//console.log("this is the linklist: "+ linklist);
			if(linklist != null)
			{
				var fbLinkList = linklist;
				var linkCount = 0;
				//console.log("length of link list: "+fbLinkList.length);
				var vidIDSet = new Array();
				var postFilter = "";
				while(linkCount < fbLinkList.length)//5//generate the post_id filter to get the attribution / application name for all post_ids
				{
					if(linkCount < fbLinkList.length - 1)//testing: 4
						postFilter += "'"+Meteor.user().services.facebook.id+"_"+fbLinkList[linkCount].link_id + "',";
					else
						postFilter += "'"+Meteor.user().services.facebook.id+"_"+fbLinkList[linkCount].link_id +"'";
						
					linkCount++;
				}
				
				var pureFBYTLinkQuery = "SELECT message,created_time,attachment,post_id,attribution FROM stream WHERE post_id IN ("+postFilter+")";		
				var pureFBYTLinkUrl = "https://graph.facebook.com/fql?q="+pureFBYTLinkQuery+"&access_token="+Meteor.user().services.facebook.accessToken;
				console.log("the full pure youtube FQL query is: "+ pureFBYTLinkQuery);
				//console.log("url for link list is: "+ url);
				//synchronous GET
				var pureFBYTPostResult = Meteor.http.get(pureFBYTLinkUrl, {timeout:30000});
				console.log("fb pure youtube query sent to space! waiting now!!!");
				if(pureFBYTPostResult.statusCode==200) {
					var pureFBYTResultSet = JSON.parse(pureFBYTPostResult.content).data;
					console.log("fb pure youtube response received; first object is:"+pureFBYTResultSet[0].message);
					var gCount = 0
					var trackQuery = "";
					var lastFmURL = "http://ws.audioscrobbler.com/2.0/?method=track.search&track=###TRACKQUERY###&api_key=3135d1eacd6085271c24a02d4195cccf&format=json";
					var callsRemaining = pureFBYTResultSet.length;
					while(gCount < pureFBYTResultSet.length)//JUST FOR TESTING//3
					{
						//console.log("groovit attribution is: "+pureFBYTResultSet[gCount].attribution);
						if(pureFBYTResultSet[gCount].attribution != "Groovit") 
						{
							//clean up track information for searching Last.FM
							trackQuery = pureFBYTResultSet[gCount].attachment.media[0].alt;
							if(trackQuery.indexOf("(") >= 0 && trackQuery.indexOf(")") >= 0)
							{
								var insideBraces = trackQuery.substring(trackQuery.indexOf("(")+1,trackQuery.indexOf(")"));
								trackQuery = trackQuery.replace(insideBraces," ");
								//console.log("what's inside the braces" + insideBraces);
							}
							else if(trackQuery.indexOf("[") >= 0 && trackQuery.indexOf("]") >= 0)
							{
								var insideBraces = trackQuery.substring(trackQuery.indexOf("[")+1,trackQuery.indexOf("]"));
								trackQuery = trackQuery.replace(insideBraces," ");
								//console.log("what's inside the braces" + insideBraces);
							}
							else if(trackQuery.indexOf("{") >= 0 && trackQuery.indexOf("}") >= 0)
							{
								var insideBraces = trackQuery.substring(trackQuery.indexOf("{")+1,trackQuery.indexOf("}"));
								trackQuery = trackQuery.replace(insideBraces," ");
								//console.log("what's inside the braces" + insideBraces);
							}
							
							trackQuery = trackQuery.toUpperCase();
							trackQuery = trackQuery.replace("LYRICS"," ");
							trackQuery = trackQuery.replace("OFFICIAL VIDEO"," ");
							trackQuery = trackQuery.replace("MUSIC VIDEO"," ");
							trackQuery = trackQuery.replace(" FT."," ");
							trackQuery = trackQuery.replace(" BY "," ");
								
							//console.log("the track query ISSS1: "+ trackQuery);					
							
							trackQuery = trackQuery.replace(/[^A-Za-z0-9]/g, " "); //remove special characters - simpler regex
							trackQuery = trackQuery.replace(/\s{2,}/g, " "); //remove extra whitespace
							//console.log("the track query ISSS5: "+ trackQuery);
							
							var millisecondDate = pureFBYTResultSet[gCount].created_time*1000;
							//insert track that has been confirmed to be from Groovit:
							try//insert identifiable shares found from FB to shares collection
							 {							 
								Shares.insert({
								_id : pureFBYTResultSet[gCount].post_id.split("_")[1], 
								dataSource : "FB", 
								postedUsing : "FB",
								dt : millisecondDate,
								msg : pureFBYTResultSet[gCount].message, 
								ntw : "FB",
								sl : pureFBYTResultSet[gCount].attachment.media[0].href,
								st : trackQuery, 
								ud : pureFBYTResultSet[gCount].post_id.split("_")[0],
								problem: "unchecked"});
							}
							catch(err)
							{
								if(err.message.indexOf("E11000 duplicate key error") < 0) //valid error
								{
									//console.log("Error while inserting proper LINK in SHARES collection: " + err.message.indexOf("MongoError: E11000 duplicate key error index"));
									console.log("Error while inserting proper LINK in SHARES collection: "+ err.message + ": this one already exists: "+ trackQuery +"!!!WILL UPDATE IT with any new info");						
									Shares.update({_id: pureFBYTResultSet[gCount].post_id.split("_")[1]}, 
									{
										dataSource : "FB", 
										postedUsing : "FB",
										dt : millisecondDate,
										msg : pureFBYTResultSet[gCount].message, 
										ntw : "FB",
										sl : pureFBYTResultSet[gCount].attachment.media[0].href,
										st : trackQuery, 
										ud : pureFBYTResultSet[gCount].post_id.split("_")[0],
										problem: "unchecked"
									});
									//return "error";//console.log("error while updating internal data: "+ err + ": this one already exists: "+ fbLinkList[linkCount].title);						
								}
							}
														
							//console.log("the title was: "+pureFBYTResultSet[gCount].attachment.media[0].alt+"and the track query ISSS: "+ trackQuery);
							
							//insert confirmed PURE YouTube video into Videos collection
							try{
								Videos.insert({
									_id : pureFBYTResultSet[gCount].attachment.media[0].href, 
									dataSource : "FB", 
									sa : trackQuery,
									st : trackQuery,
									count: 1
								});

								Videos.update({_id : pureFBYTResultSet[gCount].attachment.media[0].href},
							                  {$addToSet: {sharedBy: pureFBYTResultSet[gCount].post_id.split("_")[0].toString()+"||"+millisecondDate}});	
							}
							catch(err)
							{
								if(err.message.indexOf("E11000 duplicate key error") < 0) //valid error
								{
									//console.log("Error while inserting proper Video in Videos collection: " + err.message.indexOf("MongoError: E11000 duplicate key error index"));
									console.log("OTHER VID error while updating internal data: "+ err.message + ": this one already exists: "+ trackQuery);						
									//console.log("error while updating internal data: "+ err + ": this one already exists: "+ fbLinkList[linkCount].title);						
								}
								else if(err.message.indexOf("E11000 duplicate key error") >= 0)
								{
									console.log("duplicate VID error:"+err+"; WILL update: "+ trackQuery);
									Videos.update({_id:pureFBYTResultSet[gCount].attachment.media[0].href}, 
												  {$set: {dataSource: "FB"}}, 
												  {$addToSet: {sharedBy: pureFBYTResultSet[gCount].post_id.split("_")[0].toString()+"||"+millisecondDate}});
									Videos.update({_id:pureFBYTResultSet[gCount].attachment.media[0].href}, 
												  {$inc: {count: 1}});
								}
								//return "error";
							}
							
							
							//check Last.FM for song confirmation
							Meteor.http.get(lastFmURL.replace("###TRACKQUERY###",trackQuery),{timeout:30000}, function (error, LFMResult) {
							if (LFMResult.statusCode === 200) {
								//console.log("Last fm query result is: "+ LFMResult.content);
								var LFMResultList = JSON.parse(LFMResult.content);//y.results.trackmatches.track[0]
								//if last.fm has a track match get the artist / song / album art details to update DB with
								if(LFMResultList.results != undefined && LFMResultList.results.trackmatches.track != undefined && LFMResultList.results.trackmatches.track.length > 0){
									var LFMArtist = "";
									var LFMTitle = "";
									if(LFMResultList.results.trackmatches.track[0].artist != "[unknown]")
									{
										LFMArtist = LFMResultList.results.trackmatches.track[0].artist;
										LFMTitle = LFMResultList.results.trackmatches.track[0].name;
									}
									else if(LFMResultList.results.trackmatches.track[1] != undefined && LFMResultList.results.trackmatches.track[1].artist != "[unknown]")
									{
										LFMArtist = LFMResultList.results.trackmatches.track[1].artist;
										LFMTitle = LFMResultList.results.trackmatches.track[1].name;
									}								
									
									var LFMlargeAlbumArt = "";
									var LFMmediumAlbumArt = "";
									if(LFMResultList.results.trackmatches.track[0].image != undefined)
									{
										if(LFMResultList.results.trackmatches.track[0].image.length == 4)
										{
											LFMlargeAlbumArt = LFMResultList.results.trackmatches.track[0].image[3]["#text"];
											LFMmediumAlbumArt = LFMResultList.results.trackmatches.track[0].image[2]["#text"];
										}
										else if(LFMResultList.results.trackmatches.track[0].image.length > 0)
										{
											var artIndex = LFMResultList.results.trackmatches.track[0].image.length -1;
											LFMlargeAlbumArt = LFMResultList.results.trackmatches.track[0].image[artIndex]["#text"];
										}
										//console.log("the working result album art is: "+ LFMlargeAlbumArt);
									}
									//console.log("the working result ARTIST is: "+ LFMArtist);
									//console.log("the working result title is: "+ LFMTitle);

									
									try{
										if(LFMlargeAlbumArt != "" && LFMmediumAlbumArt == "")
										{
											Videos.update({sa: LFMResultList.results["opensearch:Query"].searchTerms, st: LFMResultList.results["opensearch:Query"].searchTerms}, 
														  { $set: { sa: LFMArtist, st: LFMTitle, dataSource : "FB", largeAlbumArt: LFMlargeAlbumArt }}
											);
										}
										else if(LFMlargeAlbumArt != "" && LFMmediumAlbumArt != "")
										{
											Videos.update({sa: LFMResultList.results["opensearch:Query"].searchTerms, st: LFMResultList.results["opensearch:Query"].searchTerms}, 
												          { $set: { sa: LFMArtist, st: LFMTitle, dataSource : "FB", largeAlbumArt: LFMlargeAlbumArt, mediumAlbumArt: LFMmediumAlbumArt }}
											);
										}
										else if(LFMlargeAlbumArt == "" && LFMmediumAlbumArt == "") // no album art, just update artist / track details
										{
											Videos.update({sa: LFMResultList.results["opensearch:Query"].searchTerms, st: LFMResultList.results["opensearch:Query"].searchTerms}, 
													      { $set: { sa: LFMArtist, st: LFMTitle, dataSource : "FB" }}
											);
										}
										console.log("calls remaining: "+callsRemaining);
										callsRemaining--;
										//return "success";
									}
									catch(err)
									{
										console.log("OTHER VID error while updating vid with LFM results: "+ err.message + ": this one already exists: "+ LFMResultList.results["opensearch:Query"].searchTerms);	
									}
									
									//console.log("Last FM result size is: "+ LFMResultList.length);
									//console.log("groovit message is: "+pureFBYTResultSet[gCount].message);
									//console.log("groovit attachment title is: "+pureFBYTResultSet[gCount].attachment.media[0].alt);
									//console.log("groovit attachment link is: "+pureFBYTResultSet[gCount].attachment.media[0].href);	
									//console.log("groovit post ID is: "+pureFBYTResultSet[gCount].post_id.split("_")[1]);	
								}
							  }
							  else
							  {
								 console.log("calls remaining: "+callsRemaining+"!!! result code is: "+LFMResult);
								 callsRemaining--;
								 return "success";
							  }						  
							});					
						}
						gCount++;
					}
					//return "success";
				} else {
					console.log("groovit facebook Response issue: "+ pureFBYTPostResult.content);
					//var errorJson = JSON.parse(result.content);
					//throw new Meteor.Error(pureFBYTPostResult.statusCode, pureFBYTPostResult.content);
					
				}
			}
					
    } catch(e) {
		console.log(e+"!!! is the actual error and this is the groovit update error MESSAGE: "+ e.message);
		return null;
    }
  },
  getFBLogoutURL : function () {
  	console.log("THIS IS THE Access Token now:" + Meteor.user().services.facebook.accessToken);
  	if(Meteor.user().services.facebook.accessToken)
  	{	
  		var fblogout = "https://www.facebook.com/logout.php?next=http://mydomain.com/logout.php&access_token=" + Meteor.user().services.facebook.accessToken;
  		return fblogout;
  	}
  },
  fixInternalDates : function() {//method to convert internal dates to millisecond format to get accurate date sorting
	  try {
			this.unblock();
			//console.log("this is the linklist: "+ linklist);
			var dateFixingSet = Shares.find({}).fetch();
			var x = 0;
			console.log("length of date fixing set: "+ dateFixingSet.length);
			while(x < dateFixingSet.length)
			{				
				if(dateFixingSet[x].dt.toString().indexOf("/") >= 0)
				{
					var oldDate = dateFixingSet[x].dt.toString().split("/");
					var fixedDate = oldDate[1] + "/" + oldDate[0] + "/" + oldDate[2]
					var fixedDateObj = new Date(fixedDate);
					var milliseconds = fixedDateObj.getTime();
					console.log("current ITEM: "+x+"!!!!!converting: "+dateFixingSet[x].dt+ " !! to Date object: "+ fixedDateObj+"!!! and then to milliseconds: "+ milliseconds);
					
					Shares.update(dateFixingSet[x]._id, {$set: {dt: milliseconds}});
				}
				else
				{
					console.log("skipping "+dateFixingSet[x].dt+" !!! because it is already in milliseconds");
				}
				x++;
			}
			return null;
		
    } catch(e) {
		console.log("update error: ", e.message);
		return null;
    }
  }
  
});
