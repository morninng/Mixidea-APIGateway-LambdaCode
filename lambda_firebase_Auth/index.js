'use strict';
console.log('Loading function');
var Firebase = require("firebase");
//var crypto = require("crypto");
var config_firebase = require("./config/config_firebase.conf");
var FirebaseRef = new Firebase(config_firebase.root_url);
var CryptoJS = require("crypto-js");

exports.handler = (event, context, callback) => {
    console.log("------lambda function of authorization start 2------")
    console.log(event);
    var token_str = event.authorizationToken;
    console.log(token_str);
    var token_obj = JSON.parse(token_str);
    console.log(token_obj);
    var in_userid = token_obj.user_id;
    console.log("user id is", in_userid);
    var in_mac = token_obj.mac;
    console.log("mac value is" + in_mac);

    if(!in_userid || !in_mac){
        context.fail("input does not contain user_id or mac");
    }


// retrieve apisecurekey from firebase
// reading securekey should be only from the authorized server. it must be configured later

    console.log("master key is " + config_firebase.masterkey);
    FirebaseRef.authWithCustomToken(config_firebase.masterkey, function(error, authData) {
      if (error) {
        consosle.log("authorization failure")
        context.fail("auth failure");
      } else {

        var user_securekey_ref = FirebaseRef.child("users/apisecurekey/" + in_userid);
        user_securekey_ref.once("value",function(snapshot){
            var securekey = snapshot.val();
            console.log("secure key is : " + securekey);
            console.log("userid is :" + in_userid);
/*
            var hmac_sha256 = crypto.createHash('sha256', securekey);
            var server_mac = hmac_sha256.update(in_userid).digest('hex');
*/
            var hmac_sha256 = CryptoJS.HmacSHA256(in_userid, securekey);
            var server_mac = CryptoJS.enc.Hex.stringify(hmac_sha256);

            if(in_mac == server_mac){
                console.log("----mac verification succeed!!----");
                context.succeed(generatePolicy(in_userid, 'Allow', event.methodArn));
            }else{
                console.log("mac from client : " + in_mac);
                console.log("mac in server: " + server_mac);
                context.fail("mac does not match");
            }
        }, function(error){
            console.log(error);
            context.fail("user secret cannot be found");
        })
      }
    });
};



    var generatePolicy = function(principalId, effect, resource) {
        var authResponse = {};
        authResponse.principalId = principalId;
        if (effect && resource) {
            var policyDocument = {};
            policyDocument.Version = '2012-10-17'; // default version
            policyDocument.Statement = [];
            var statementOne = {};
            statementOne.Action = 'execute-api:Invoke'; // default action
            statementOne.Effect = effect;
            statementOne.Resource = resource;
            policyDocument.Statement[0] = statementOne;
            authResponse.policyDocument = policyDocument;
        }
        return authResponse;
    };