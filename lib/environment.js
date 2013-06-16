Accounts.loginServiceConfiguration.remove({
	service: "facebook"
});

//localhost config
Accounts.loginServiceConfiguration.insert({
	service: "facebook",
	appId: "376563985784002",
	secret: "b545ad0d682a94b2a1962262c9012c83"
});

//gsite.meteor.com - config
/*	service: "facebook",
	appId: "140246246143957",
	secret: "4f16a2b2e6d2d046d74aca17c4a81599"
});
*/

function findMatchingVidDetails()
{
	Meteor.call("vidFindMatch",Session.get("chosenShareResult").sl, function(error, vidFindMatchResult){
	  console.log('this is the found vidmatch: '+vidFindMatchResult+" FOR this vid link: "+Session.get("chosenShareResult").sl);
	  if(vidFindMatchResult !== "")
	  {
	  	if(vidFindMatchResult.sa !== vidFindMatchResult.st)
	  	{
			Session.set("chosenShareResult",vidFindMatchResult);
			console.log("sa and st are NOT the same");
			//return Session.get("chosenVideoMatch");
			//return Session.get("chosenShareResult");
		}
		else
		{
			vidFindMatchResult.sa = "";
			console.log("sa and st are the same");
			Session.set("chosenShareResult",vidFindMatchResult);
		    //return Session.get("chosenVideoMatch");
		    //return Session.get("chosenShareResult");
		}
	  }
	  else
	  {
	  	console.log("matching VID NOT FOUND!!!!*");
	  	//return Session.get("chosenShareResult");
	  }
	  return Session.get("chosenShareResult");
  });
}