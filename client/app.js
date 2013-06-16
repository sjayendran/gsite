/*Meteor.autorun(function () {
  Meteor.subscribe("shares", Session.get("FBid"));
});*/

Meteor.startup(function () {
  Meteor.autorun(function () {
    if (Meteor.user() && !Session.get("chosenShare")) {
	  //console.log("IM IN the startup code: personal stream size is:" +Session.get("personalStream").length);
      //var randomShare = Shares.findOne();
      //if (randomShare)
      //{
        //Session.set("chosenShare", "277483525688336");
      //}
      //Session.setDefault("personalShareFilter","personalShareFilter","{'problem': {$ne: 'unidentifiable'}}");
      //Session.setDefault("personalShareMode","problemHidden");
      Session.setDefault("showReviewHiddenLinksDialog", false);
      Session.setDefault("randomLinkList",[]);
      Session.setDefault("randomObjectList",[]);
      Session.setDefault("videoError",[]);
      Session.setDefault("randomPosition",0);
      Session.setDefault("lastAction","next"); //to know if the user pressed previous or next last, so that if we encounter a bad video we know which direction to proceed
      console.log("set personal share filter and mode!!");
      Meteor.subscribe("shares", Session.get("FBid"));
    }
    else
		console.log("not in the autostart code");
		
	Session.setDefault("fbImportDone",false);
  });
  
});

Template.user_loggedout.events({
	"click #login": function(e,tmpl) {
		Meteor.loginWithFacebook({
		  requestPermissions: ['publish_actions', 'read_stream']
		}, function (err) {
		  if (err)
			Session.set('errorMessage', err.reason || 'Unknown error');
		});
	}
})

Template.user_loggedin.events({
	"click #logout": function(e, tmpl) {
		Meteor.call("getFBLogoutURL", function(error, fbloutURL){
			alert("This is the LOGOUTURL: "+fbloutURL);
			console.log("This is the LOGOUTURL: "+fbloutURL);
		});
		/*Meteor.logout(function (err) {
			if (err) {
				//show err message
			} else {
				//show alert that says logged out
				Session.set("FBName","");

			}
		});*/
	}
})

Template.user_loggedin.fbid = function() {
	Meteor.call("getFBid", function(error, FBid){
		//console.log(FBid);
		Session.set('FBid',FBid);
		//return FBid;
		return Session.get('FBid');
	});
	return Session.get('FBid');
}

Template.user_loggedin.getSharesFromDB = function () {
	Meteor.call("shareFind",Session.get("FBid"),-1,"all", function(error, shareFindResult) {
		  console.log("I got a share result back: "+shareFindResult);
		  Session.set("personalStream",shareFindResult);
		});
	Meteor.call("shareFind",Session.get("FBid"),-1,"unidentifiable", function(error, shareFindResult) {
		  console.log("I got a share result back: "+shareFindResult);
		  Session.set("problematicYTLinks",shareFindResult);
		  var probResultList = shareFindResult;
		  var problemList = [];
		  var pCount = 0;
		  while(pCount < probResultList.length)
		  {
			problemList[pCount] = probResultList[pCount]._id;
			//console.log("adding prob link: "+shareFindResult[pCount]._id);
			pCount++;
		  }
		  Session.set("problematicYTLinkIDs",problemList);
		  });
	return "";
};


Template.user_loggedin.getLatestPostsFromFB = function () {
	//upon logging in we need to get the latest youtube links from FB and insert into the db:
	console.log("about to start getting the latest posts from FB");
	Meteor.call("getPersonalFBYTLinkList", function(error, respJson){
		Session.set("entireFBLinkListObject",respJson);
		if(respJson != undefined)
			Session.set("FBLinkList", respJson.data);
		else
			Session.set("FBLinkList", null);		
	});

	//added this in to get ONLY PURE FB Youtube links - i.e. not posted via Groovit
	Meteor.call("getPureFBYTLinkList", function(error, respJson){
		Session.set("pureFBLinkListObject",respJson);
		if(respJson != undefined)
			Session.set("pureFBLinkList", respJson.data);
		else
			Session.set("pureFBLinkList", null);		
	});

	
	console.log("going to update internal db with latest FB posts");
	//var shareUpdateResult = Meteor.call("updatePeronalShareListWithFBYTLinkList",Session.get("FBLinkList"));
	
	/*Commented out to try out PURE Groovit FB stream -without checking youtube
	Meteor.call("updatePeronalShareListWithFBYTLinkList",Session.get("FBLinkList"), function(error, shareUpdateResult) {
		if(shareUpdateResult != undefined || shareUpdateResult != null)
		{
			if (shareUpdateResult.indexOf("success") >= 0)
			{
				Session.set("fbListLength",shareUpdateResult.split("||")[1]);
				console.log("fb import was DONE successfully!");
				Session.set("fbImportDone",true);
				Meteor.flush();
			}
			else
			{
				console.log("fb import FAILED!");
				Session.set("fbImportDone",false);
			}
		}
	});*/
	
	
	Meteor.call("updatePeronalFBListWithGroovitLinkList",Session.get("FBLinkList"), function(error, result) {
		if(result != "success" || result != undefined || result != null)
		{
			console.log("fb groovit import was DONE successfully!");
			Session.set("fbImportDone",false);
			Meteor.flush();

			Meteor.call("updatePeronalFBListWithPureLinkList",Session.get("pureFBLinkList"), function(error, result) {
				if(result != "success" || result != undefined || result != null)
				{
					console.log("pure fb yt import was DONE successfully!");
					Session.set("fbImportDone",true);
					Meteor.flush();
					
					if(Session.get("chosenShareResult") === undefined)
					{
						var nextBtn = document.getElementById("nextButton");
				        nextBtn.click();
			    	}
				}
				else
				{
					console.log("pure fb yt import FAILED! this is the result: "+ result);
					Session.set("fbImportDone",false);
					if(Session.get("chosenShareResult") === undefined)
					{
						var nextBtn = document.getElementById("nextButton");
				        nextBtn.click();
			    	}
				}
			});	
			/*
			if(Session.get("chosenShareResult") === undefined)
			{
				var nextBtn = document.getElementById("nextButton");
		        nextBtn.click();
	    	}*/
		}
		else
		{
			console.log("fb groovit import FAILED! this is the result: "+ result);
			Session.set("fbImportDone",false);
		}
	});

	return "";

	//Meteor.call("fixInternalDates");  //was used to fix internal dates
};

Template.user_loggedin.loggedinUserFullName = function () {
	Meteor.call("getFBname", function(error, FBname){
		//console.log(FBname);//.split(" ")[0]);
		Session.set("FBname", FBname);
		//return FBname;//FBname.split(" ")[0].toString();
	});
	return Session.get("FBname");
};

Template.bodyContent.loggedinUserFullName = function () {
	Meteor.call("getFBname", function(error, FBname){
		//console.log(FBname);//.split(" ")[0]);
		Session.set("FBname", FBname);
		//return FBname;//FBname.split(" ")[0].toString();
	});
	return Session.get("FBname");
};

Template.bodyContent.friendList = function () {
	Meteor.call("getfriendList", function(error, respJson){
		console.log("this is the got friendlist: "+ respJson);
		Session.set("entireFBfriendResultObject",respJson);
		Session.set("FBfriendList", respJson.data);
	});
	return Session.get("FBfriendList");	
};

Template.shareBrowserItem.linkIsUnidentifiable = function (_id) {
	var problem = Session.get("problematicYTLinkIDs");
	if (problem.indexOf(_id) >= 0)
	{
		console.log(_id+" is a problematic link");
		return true;
	}
	else
	{
		//console.log(_id+" is NOT a problematic link");
		return false;
	}
};

/* NOT USING VID SPECIFIC INFO FOR PERSONAL SHARE LIST -- IGNORE THIS 
Template.vidTitleDetails.vidDetailsAvailable = function(sl) {
	Meteor.call("vidFindMatch",sl, function(error, vidFindMatchResult){
	  console.log('this is the found vidmatch: '+vidFindMatchResult+" FOR this vid link: "+sl);
	  if(vidFindMatchResult !== "")
	  {
	  	if(vidFindMatchResult.sa !== vidFindMatchResult.st)
	  	{
			Session.set("chosenVideoMatch",vidFindMatchResult);
			console.log("sa and st are NOT the same; returning TRUE");
			//return Session.get("chosenVideoMatch");
			return true;
		}
		else
		{
			//vidFindMatchResult.sa = "";
			console.log("sa and st are the same; returning FALSE");
			//Session.set("chosenVideoMatch",vidFindMatchResult);
		    //return Session.get("chosenVideoMatch");
		    return false;
		}
	  }
	  else
	  {
	  	console.log("matching VID NOT FOUND!!!!*");
	  	return false;
	  }
  });
};

Template.vidMatchDeets.vid = function () {
	console.log("vid matching deets; returning this:"+Session.get("chosenVideoMatch"));
	return Session.get("chosenVideoMatch");
};

Template.shareDeets.share = function () {
	console.log("chosen SHARE deets; returning this:"+Session.get("chosenShareResult"));
	return Session.get("chosenShareResult");
};

*/

Template.chosenShare.share = function () { 
  return Session.get("chosenShareResult"); //LAST WORKING STATEMENT
  //var foundVidMatch = Videos.find({_id:Session.get("chosenShareResult").sl}).fetch();

  /*Meteor.call("vidFindMatch",Session.get("chosenShareResult").sl, function(error, vidFindMatchResult){
	  console.log('this is the found vidmatch: '+vidFindMatchResult+" FOR this vid link: "+Session.get("chosenShareResult").sl);
	  if(vidFindMatchResult !== "")
	  {
	  	if(vidFindMatchResult.sa !== vidFindMatchResult.st)
	  	{
			Session.set("chosenVideoMatch",vidFindMatchResult);
			console.log("sa and st are NOT the same");
			//return Session.get("chosenVideoMatch");
			return Session.get("chosenShareResult");
		}
		else
		{
			vidFindMatchResult.sa = "";
			console.log("sa and st are the same");
			Session.set("chosenVideoMatch",vidFindMatchResult);
		    //return Session.get("chosenVideoMatch");
		    return Session.get("chosenShareResult");
		}
	  }
	  else
	  {
	  	console.log("matching VID NOT FOUND!!!!*");
	  	return Session.get("chosenShareResult");
	  }
  });*/
  //Shares.findOne({_id:Session.get("selectedShare")});
};

Template.trackInfo.share = function () { 
  return Session.get("chosenShareResult"); 
};

Template.shareList.share = function() {
  //return Session.get("personalStream"); JUST CHECKING IF THIS WORKS INSTEAD 
  Session.set("personalStream",Shares.find({ud:Session.get("FBid"),problem:"none"}, {sort: {dt: -1}}).fetch());
  return Session.get("personalStream");
};

Template.shareBrowserItem.events({
  'click': function() {
  	Session.setDefault("videoError",[]);
    Session.set("selectedShare", this._id);
    Meteor.call("shareFind",Session.get("selectedShare"),-1,"one", function(error, shareFindResult){
		console.log("this is the got CHOSEN SHARE RESULT: "+ shareFindResult);
		Session.set("chosenShareResult", shareFindResult);
	});
  }
});

Template.shareBrowserItem.preserve(['.shareBrowserItem']);

Template.shareBrowserItem.selected = function() {
  //return Session.get("personalStream"); JUST CHECKING IF THIS WORKS INSTEAD 
  	var _ref;

	var selected = (_ref = Session.equals("selectedShare", this._id)) != null ? _ref : {
	  "selected": ''
	};

	Session.set("interfaceLoaded",true);

	if(selected)
		return "selected";
	else
		return "";
};

Template.bodyContent.displayBody = function() {
  	var loaded = Session.get("interfaceLoaded");

  	if(loaded)
  		return "visible";
  	else
  		return "hidden";
};

Template.bodyContent.displayLoader = function() {
  	var loaded = Session.get("interfaceLoaded");

  	if(loaded)
  		return "none";
  	else
  		return "inherit";
};


Handlebars.registerHelper('embed', function(sl) {
  //console.log("returning embed link: "+ sl.replace("watch?v=","v/"));
  return sl.replace("watch?v=","v/");
});

Handlebars.registerHelper('ytimg', function(sl) {
  return sl.substring(sl.indexOf("=")+1);
});

Handlebars.registerHelper('formatTimestamp', function(dt) {
  var formattedDate = new Date(dt);
  return formattedDate.toLocaleString();
  //return sl.substring(sl.indexOf("=")+1);
});

Template.bodyContent.fbImportDone = function () {
  //console.log("checking fb import done: "+ Session.get("fbImportDone"));
  /*if(Session.get("fbImportDone"))
  {
	  console.log("after flush inside if block!");
	  //if(Session.get("personalStream"))
		//console.log("current length of personal stream is : " +Session.get("personalStream"));
	  //while(Session.get("personalStream").length < Session.get("fbListLength"))
	  //{
		  Meteor.call("shareFind",Session.get("FBid"),-1,"all", function(error, shareFindResult) {
			  console.log("I got a share result back: "+shareFindResult);
			  Session.set("personalStream",shareFindResult);
			});
	  //}
  }
  console.log("after flush outside if block!");
  return Session.get("fbImportDone");*/
  return Session.get("interfaceLoaded");
};

Template.shareList.events({
  'click .reviewHiddenVids': function () {
	Session.set("showReviewHiddenLinksDialog", true);
  }
});

Template.playerControls.events({
  'click #nextButton': function () {
  	Session.set("lastAction","next");
	var randomSoFar = Session.get("randomLinkList");
	var randomObjects = Session.get("randomObjectList")
	var streamLength = Session.get("personalStream").length-1;
	var randomChoice = Math.floor(Math.random()*streamLength);
	var reachedEndOfStream = false;
	var directYTPlayer = document.getElementById("sharePlayer");
	var chosenID;

	console.log("this is the randomSoFar size:"+randomSoFar.length);
	console.log("this is the randomObject size:"+randomObjects.length);

	if(randomSoFar.length < Session.get("personalStream").length)
			reachedEndOfStream = false;
		else
			reachedEndOfStream = true;

	console.log("randomSoFar is: "+ randomSoFar);
	if(randomSoFar == [] || randomSoFar == null || randomSoFar == undefined || randomSoFar == "")// not played anything yet in random mode
	{
		console.log("nothing in here so pushing the first random choice i got");
		randomSoFar = [];
		if(Session.get("chosenShareResult") !== undefined)
		{
			randomSoFar.push(Session.get("chosenShareResult").sl); // as random is still empty push the current chosen share as the first one	
			randomObjects.push(Session.get("chosenShareResult"));
		}
		
		randomSoFar.push(Session.get("personalStream")[randomChoice].sl); //push the next choice as the next entry in random linklist
		
		randomObjects.push(Session.get("personalStream")[randomChoice]);
		
		console.log("selected random share is: "+Session.get("personalStream")[randomChoice].sl)
		Session.set("chosenShareResult",Session.get('personalStream')[randomChoice])
		Session.set("selectedShare",Session.get('personalStream')[randomChoice]._id)
		Session.set("randomLinkList", randomSoFar);
		Session.set("randomObjectList",randomObjects);
		Session.set("randomPosition",Session.get("randomLinkList").length - 1);
		chosenID = Session.get('personalStream')[randomChoice].sl.substring(Session.get('personalStream')[randomChoice].sl.indexOf("v=")+2);
		Session.set("chosenLinkID", chosenID);
		console.log("the chosen ID is:!"+chosenID+"!");
		directYTPlayer.loadVideoById(chosenID, 0, "large");
	}
	else // if tracks have already been played in random mode then check if link exists in linklist
	{
		if(Session.get("randomPosition") == randomSoFar.length-1) //it is at the end of the random linklist, then add the next choice
		{
			console.log("at the end of linklist getting new random choice");
			if(_.contains(randomSoFar, Session.get("personalStream")[randomChoice].sl))
			{
				console.log("something was there but going to add to it");
				while(_.contains(randomSoFar, Session.get("personalStream")[randomChoice].sl) && randomSoFar.length <= Session.get("personalStream").length)
				{
					randomChoice = Math.floor(Math.random()*streamLength);
				}

				if(!_.contains(randomSoFar, Session.get("personalStream")[randomChoice].sl))
				{
					randomSoFar.push(Session.get("personalStream")[randomChoice].sl);
					randomObjects.push(Session.get("personalStream")[randomChoice]);
				}
			}
			else
				randomSoFar.push(Session.get("personalStream")[randomChoice].sl);
				randomObjects.push(Session.get("personalStream")[randomChoice]);

			//Session.set("randomPosition",randomSoFar.length-1);
			console.log("selected random share is: "+Session.get("personalStream")[randomChoice].sl)

			Session.set("chosenShareResult",Session.get('personalStream')[randomChoice])
			Session.set("selectedShare",Session.get('personalStream')[randomChoice]._id)
			Session.set("randomLinkList", randomSoFar);
			Session.set("randomObjectList",randomObjects);
			console.log('this is the new length now AFTER PUSHING:'+randomSoFar.length);
			console.log('this is the new length of RANDOM OBJECTS now AFTER PUSHING:'+randomObjects.length);
			Session.set("randomPosition",Session.get("randomLinkList").length - 1);
			chosenID = Session.get('personalStream')[randomChoice].sl.substring(Session.get('personalStream')[randomChoice].sl.indexOf("v=")+2);
			Session.set("chosenLinkID", chosenID);
			console.log("the chosen ID is:!"+chosenID+"!");
			directYTPlayer.loadVideoById(chosenID, 0, "large");
		}			
		else //if not at the end of the linklist then just move to the next one
		{
			var nextInRandomList = Session.get("randomPosition") + 1;
			console.log("not at the end of the linklist so moving to next ONE:"+Session.get("randomObjectList")[nextInRandomList].sl);
			Session.set("chosenShareResult",Session.get("randomObjectList")[nextInRandomList])
			Session.set("selectedShare",Session.get("randomObjectList")[nextInRandomList]._id)
			//Session.set("randomLinkList", randomSoFar);
			Session.set("randomPosition",nextInRandomList);
			chosenID = Session.get("randomObjectList")[nextInRandomList].sl.substring(Session.get("randomObjectList")[nextInRandomList].sl.indexOf("v=")+2);
			Session.set("chosenLinkID", chosenID);
			console.log("the chosen ID is:!"+chosenID+"!");
			directYTPlayer.loadVideoById(chosenID, 0, "large");
		}		
	}
	
  },
  'click #previousButton': function () {
	//var randomSoFar = Session.get("randomLinkList");
	//var randomObjects = Session.get("randomObjectList");
	Session.set("lastAction","prev");
	var previousInRandomList = Session.get("randomPosition") - 1;
	var directYTPlayer = document.getElementById("sharePlayer");

	if(previousInRandomList >= 0 && Session.get("randomLinkList") !== [])
	{
		console.log("current position is:"+previousInRandomList);
		console.log("vid in prevoius position is:"+Session.get("randomObjectList")[previousInRandomList].sl);
		Session.set("chosenShareResult",Session.get("randomObjectList")[previousInRandomList])
		Session.set("selectedShare",Session.get("randomObjectList")[previousInRandomList]._id)
		//Session.set("randomLinkList", randomSoFar);
		Session.set("randomPosition",previousInRandomList);
		chosenID = Session.get("randomObjectList")[previousInRandomList].sl.substring(Session.get("randomObjectList")[previousInRandomList].sl.indexOf("v=")+2);
		Session.set("chosenLinkID", chosenID);
		console.log("the chosen ID is:!"+chosenID+"!");
		directYTPlayer.loadVideoById(chosenID, 0, "large");
	}
  }
});

Template.shareList.showReviewHiddenLinksDialog = function () {
	return Session.get("showReviewHiddenLinksDialog");
};

Template.validateProblematicYTLinks.vid = function () {
	console.log("trying to return prob YT links!!!");
	return Session.get("problematicYTLinks");
};

Template.validateProblematicYTLinks.events({
  'click .save': function (event, template) {
      Session.set("showReviewHiddenLinksDialog", false);
  },

  'click .cancel': function () {
    Session.set("showReviewHiddenLinksDialog", false);
  }
});
