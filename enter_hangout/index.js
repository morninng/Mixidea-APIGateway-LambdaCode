'use strict';
console.log('XXXXXXXXXXXXXXXXXXXXXXXXXX Loading function XXXXXXXXXXXXXXXXXXXXXXXXXX');

var Firebase = require("firebase");
var config_firebase = require("./config/config_firebase.conf");
var FirebaseRef = new Firebase(config_firebase.root_url);




exports.handler = (event, context, callback) => {

    
    console.log(event);
    var full_participants_array = new Array();
    var userid = event.userid;
    var event_id = event.event_id;
    var room_type = event.room_type;
    var room_team = event.room_team;
    var current_date = new Date();
    var current_date_value = current_date.getTime();
    if(!event_id || !room_type){
        context.fail("no proper variables ");
    }

    var notified_num = 0;
    var maximum_number_of_webchat_notif = 6;

    var hangout_join_notification_obj = {
        userid:event.userid,
        event_id:event.event_id,
        type: "enter_hangout",
        notified_date: current_date_value
    }
    var hangout_join_message_obj = {
        type:"enter_hangout",
        user:event.userid,
    }

    if(room_type=="main"){
        hangout_join_notification_obj.room_type = "main";
        hangout_join_message_obj.room_type = "main";
        hangout_join_message_obj.context = "entered main room";
    }else if (room_type=="team_discussion"){
        hangout_join_notification_obj.room_type = "team_discussion";
        hangout_join_notification_obj.room_team = event.room_team;
        hangout_join_message_obj.context = "entered team_discussion room of " + event.room_team;
    }else{
        context.fail("unknown roomt type");
    }


    
    var full_participant_ref = FirebaseRef.child("event_related/participants/" + event_id + "/full");
    full_participant_ref.once("value", function(snapshot){
        var full_participant_obj = snapshot.val();
        for(var key in full_participant_obj){
            full_participants_array.push(key);
        }
        console.log("original full participants");
        console.log(full_participants_array)

        var result = full_participants_array.indexOf(userid);
        if(result == -1){
            context.fail("user is not proper");
            return;
        }
        for(var i=0; i<full_participants_array.length; i++){
            if(full_participants_array[i] == userid){
                full_participants_array.splice(i,1);
            }
        }
        console.log("filtered full participants");
        console.log(full_participants_array)

        master_auth();
    })
    
    function master_auth(){

        FirebaseRef.authWithCustomToken(config_firebase.masterkey, function(error, authData) {
          if (error) {
            consosle.log("authorization failure");
            context.fail("auth failure");
          } else {
            console.log("master auth succeed");
            put_comment();
          }
        });
    }

    function put_comment(){

      var webchat_message_ref = FirebaseRef.child("event_related/event_webchat/" + event_id);
      webchat_message_ref.push(hangout_join_message_obj, function(error){
        if(error){
            console.log("pushing message failed");
            context.fail("pushing message failed");
        }else{
            for(var i=0; i<full_participants_array.length; i++){
                delete_existing_webchat_andAddNew(full_participants_array[i]);
            }
        }
      })
    }



    function delete_existing_webchat_andAddNew( notified_user_id ){

        var delete_target = new Array();

        var webchat_user_ref = FirebaseRef.child("users/event_webchat_notify/" + notified_user_id);
        webchat_user_ref.once("value", function(snapshot){
            var current_webchat_array = snapshot.val();
            console.log("---- current_webchat_array of " + notified_user_id + "-----");
            console.log(current_webchat_array);

            for(var key in current_webchat_array){
                var notification_obj = current_webchat_array[key];
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
            add_webchat_notify(notified_user_id);

        }, function(error_obj){
            notified_num++;
            console.log("no notification obj for this user " + user_id);
            console.log("notified_num" + notified_num);
            if(notified_num == full_participant.length){
                context.succeed("fail to retrieve user data " + user_id);
            }
        })
    }




    function add_webchat_notify(notified_user_id){

        console.log(notified_user_id)
        var webchat_user_ref = FirebaseRef.child("users/event_webchat_notify/" + notified_user_id);
        webchat_user_ref.push(hangout_join_notification_obj, function(error){
            if(error){
                console.log("push data fail");
            }else{
                console.log("push data succeed");
            }
            notified_num++;
            console.log("notified_num" + notified_num);
            if(notified_num == full_participants_array.length){
                context.succeed("pushing the notification data finish");
            }
        });
    }



};