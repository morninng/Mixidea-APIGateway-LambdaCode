'use strict';
console.log('Loading function');

var Firebase = require("firebase");
var FirebaseRef = new Firebase("https://mixidea-test.firebaseio.com/");
var config_firebase = require("./config/config_firebase.conf");
var maximum_number_of_webchat_notif = 6;
var notified_num = 0;
/*
exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));
*/
    var context = new Object();
    var event = {
     "userid": "facebook:1520978701540732",
     "body": {
         "full_participant": [ "facebook:1520978701540732", "facebook:514784482056936", "facebook:997119893702319" ],
         "event_id": "-KFDNjQPWg9zAZE9f2B_SSS",
         "type": "comment",
         "event_date": 2222
     }
    }


    
    console.log(event);
    var userid = event.userid;
    var event_id = event.body.event_id;
    var full_participant = event.body.full_participant;
    var current_date = new Date();
    var current_date_value = current_date.getTime();

    var event_webchat_notify_obj = {
        user:userid,
        event_id:event.body.event_id,
        event_date: event.body.event_date,
        type: event.body.type,
        notified_date: current_date_value
    }
    for(var i=0; i<full_participant.length; i++){
        if(full_participant[i] == userid){
            full_participant.splice(i,1);
        }
    }
    if(full_participant.length<1){
        context.succeed("no user to be notified");
    }

    console.log("master key is " + config_firebase.masterkey);
    FirebaseRef.authWithCustomToken(config_firebase.masterkey, function(error, authData) {
      if (error) {
        consosle.log("authorization failure")
        context.fail("auth failure");
      } else {
        for(var i=0; i<full_participant.length; i++){
            delete_existing_webchat_andAddNew(full_participant[i], event_webchat_notify_obj);
        }
      }
    });




    function delete_existing_webchat_andAddNew( user_id, obj_tobe_added ){

        var delete_target = new Array();

        var webchat_user_ref = FirebaseRef.child("users/event_webchat_notify/" + user_id);
        webchat_user_ref.once("value", function(snapshot){
            var notification_obj_array = snapshot.val();
            console.log("----notification obj of " + user_id + "-----")

            for(var key in notification_obj_array){
                var notification_obj = notification_obj_array[key];
                if(notification_obj.event_id == event_id){
                    console.log("remove data" + key);
                    delete_target.push(key);
                }
                if(i>maximum_number_of_webchat_notif){
                    delete_target.push(key);
                }
            }
            console.log("delete target identifiers : " + delete_target);
            for(var i=0; i<delete_target.length; i++){
                var delete_target_notified_obj_ref = webchat_user_ref.child(delete_target[i]);
                delete_target_notified_obj_ref.set(null);
            }
            add_webchat_notify(user_id, obj_tobe_added);

        }, function(error_obj){
            notified_num++
            console.log("no notification obj for this user " + user_id);
            if(notified_num == full_participant.length){
                context.succeed("fail to retrieve user data " + user_id);
            }
        })
    }

    function add_webchat_notify(user_id, event_webchat_obj){

        console.log(user_id)
        var webchat_user_ref = FirebaseRef.child("users/event_webchat_notify/" + user_id);
        webchat_user_ref.push(event_webchat_obj, function(error){
            if(error){
                console.log("push data fail");
            }else{
                console.log("push data succeed");
            }
            notified_num++
            if(notified_num == full_participant.length){
                context.succeed("pushing the notification data finish");
            }
        });
    }

/*
};
*/