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
      Session.setDefault("randomBreadcrumbs","");
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
		Meteor.logout(function (err) {
			if (err) {
				//show err message
			} else {
				//show alert that says logged out
				Session.set("FBName","");
			}
		});
	}
})

Template.user_loggedin.fbid = function() {
	Meteor.call("getFBid", function(error, FBid){
		//console.log(FBid);
		Session.set('FBid',FBid);
		//return FBid;
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
			Session.set("fbImportDone",true);
			Meteor.flush();
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
		return false
	}
};

Template.chosenShare.share = function () {
  //return Meteor.call("shareFind",Session.get("selectedShare"),-1,"one");
  return Session.get("chosenShareResult");
  //Shares.findOne({_id:Session.get("selectedShare")});
};

Template.shareList.share = function() {
  //return Session.get("personalStream"); JUST CHECKING IF THIS WORKS INSTEAD
  return Shares.find({ud:Session.get("FBid"),problem:"none"}, {sort: {dt: -1}});  
};

Template.shareBrowserItem.events({
  'click': function() {
    Session.set("selectedShare", this._id);
    $('.highlight').removeClass('highlight');
	$(this).addClass('highlight');
    Meteor.call("shareFind",Session.get("selectedShare"),-1,"one", function(error, shareFindResult){
		console.log("this is the got CHOSEN SHARE RESULT: "+ shareFindResult);
		Session.set("chosenShareResult", shareFindResult);
	});
  }
});

Handlebars.registerHelper('embed', function(sl) {
  console.log("returning embed link: "+ sl.replace("watch?v=","v/"));
  return sl.replace("watch?v=","v/");
});

Handlebars.registerHelper('ytimg', function(sl) {
  return sl.substring(sl.indexOf("=")+1);
});


Template.bodyContent.fbImportDone = function () {
  console.log("checking fb import done: "+ Session.get("fbImportDone"));
  if(Session.get("fbImportDone"))
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
  return Session.get("fbImportDone");
};

Template.shareList.events({
  'click .reviewHiddenVids': function () {
	Session.set("showReviewHiddenLinksDialog", true);
  }
});

Template.playerControls.events({
  'click nextButton': function () {
	var randomSoFar = Session.get("randomBreadcrumbs");
	if(randomSoFar == "")// not played anything yet in random mode
	{
		
	}
	Session.set("showReviewHiddenLinksDialog", true);
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
