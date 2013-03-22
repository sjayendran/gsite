Accounts.loginServiceConfiguration.remove({
	service: "facebook"
});

//localhost config
Accounts.loginServiceConfiguration.insert({
	service: "facebook",
	appId: "376563985784002",
	secret: "b545ad0d682a94b2a1962262c9012c83"
});

/*gsite.meteor.com - config
 * Accounts.loginServiceConfiguration.insert({
	service: "facebook",
	appId: "140246246143957",
	secret: "4f16a2b2e6d2d046d74aca17c4a81599"
});*/
