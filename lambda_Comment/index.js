'use strict';
console.log('Loading function');
var Firebase = require("firebase");
var FirebaseRef = new Firebase("https://mixidea-test.firebaseio.com/");
//var crypto = require("crypto");
var config_firebase = require("./config/config_firebase.conf");

exports.handler = (event, context, callback) => {
    console.log("-------------------------------");

    console.log(event);

    var userid = event.userid;
    console.log("user id is" + userid);
    var author_array = [];
    var commentor_array = [];
    var body_obj = event.body;
    var event_id = event.body.event_id;

    var notification_obj_author = new Object();
    var notification_obj_commentor = new Object();

    for(var key in body_obj){
        if(key !="comment" && key !="author_list" && key!="commentor_list"){
            notification_obj_author[key] = body_obj[key];
            notification_obj_commentor[key] = body_obj[key];
        }
    }
    notification_obj_author["userid"] = userid;
    notification_obj_commentor["userid"] = userid;
    switch(body_obj.type){
	    case "argument_all":
	    	notification_obj_author["type"] = "argument_all";
            notification_obj_commentor["type"] = "argument_all";
    	break;
    	case "argument_each":
	    	notification_obj_author["type"] = "argument_each";
            notification_obj_commentor["type"] = "argument_each";
    	break;
    	case "audio_all":
	    	notification_obj_author["type"] = "audio_all";
            notification_obj_commentor["type"] = "audio_all";
    	break;
    	case "audio_each":
	    	notification_obj_author["type"] = "audio_each";
            notification_obj_commentor["type"] = "audio_each";
    	break;
    	default :
    		return
     	break;
    }
    notification_obj_author["notify_type"] = "author";
    notification_obj_commentor["notify_type"] = "commentor";

    var notified_authors = body_obj.author_list;
    var notified_commentor = body_obj.commentor_list;
    for(var i=0; i<notified_commentor.length; i++){
        for(var j=0; j<notified_authors.length; j++){
            if(notified_commentor[i]==notified_authors[j]){
                console.log("user " + notified_commentor[i] + "is excluded from notified_commentor because it is in authorlist");
                notified_commentor.splice(i,1);
            }
        }
    }
    for(var i=0; i<notified_commentor.length; i++){
        if(notified_commentor[i] ==userid){
            console.log("user " + notified_commentor[i] + "is excluded from notified_commentor because it is the same as userid");
            notified_commentor.splice(i,1);
        }
    }
    for(var i=0; i< notified_authors.length; i++){
        if(notified_authors[i] == userid){
            console.log("user " + notified_authors[i] + "is excluded from notified_authors because it is the same as userid");
            notified_authors.splice(i,1);
        }
    }
    console.log("notified_authors");
    console.log(notified_authors);
    console.log("notified_commentor");
    console.log(notified_commentor);

    var notified_num = 0;
    var all_notified_member_num = notified_authors.length + notified_commentor.length;

    for(var i=0; i<notified_authors.length; i++){
        //add_notification(notified_authors[i], notification_obj_author);
        delete_existing_notification_andAddNew(notified_authors[i], notification_obj_author );
    }
    for(var i=0; i< notified_commentor.length; i++){
        //add_notification(notified_commentor[i], notification_obj_commentor);
        delete_existing_notification_andAddNew(notified_commentor[i], notification_obj_commentor );
    }

    var maximum_number_of_notification = 20;



    function delete_existing_notification_andAddNew( user_id, notifyobj_tobe_added ){

        var delete_target = new Array();

        var notified_user_ref = FirebaseRef.child("users/notify/" + user_id);
        notified_user_ref.once("value", function(snapshot){
            var notification_obj_array = snapshot.val();
            console.log("----notification obj of " + user_id + "-----")
            console.log(notification_obj_array);
            var i=0;
            for(var key in notification_obj_array){
                var notification_obj = notification_obj_array[key];
                switch(notification_obj.type){
                    case "argument_all":
                    case "audio_all":
                        if(notification_obj.event_id == body_obj.event_id
                            && notification_obj.type == body_obj.type){
                            console.log("remove data" + key);
                            delete_target.push(key);
                        }
                    break;
                    case "argument_each":
                        if(notification_obj.event_id == body_obj.event_id
                            && notification_obj.type == body_obj.type
                            && notification_obj.argument_id == body_obj.argument_id){
                            console.log("remove data" + key);
                            delete_target.push(key);
                        }
                    break;
                    case "audio_each":
                        if(notification_obj.event_id == body_obj.event_id
                            && notification_obj.type == body_obj.type
                            && notification_obj.role == body_obj.role){
                            console.log("remove data" + key);
                            delete_target.push(key);
                        }
                    break;
                }
                if(i>maximum_number_of_notification){
                    delete_target.push(key);
                }
            }
            console.log("delete target identifiers : " + delete_target);
            for(var i=0; i<delete_target.length; i++){
                var delete_target_notified_obj_ref = notified_user_ref.child(delete_target[i]);
                delete_target_notified_obj_ref.set(null);
            }
            add_notification(user_id, notifyobj_tobe_added);

        }, function(error_obj){
            notified_num++
            console.log("no notification obj for this user " + user_id);
            if(notified_num == all_notified_member_num){
                context.succeed("fail to retrieve user data " + user_id);
            }
        })
    }

    function add_notification(user_id, notification_obj){

    	console.log(user_id)
    	var notified_user_ref = FirebaseRef.child("users/notify/" + user_id);
    	notified_user_ref.push(notification_obj, function(error){
    		if(error){
    			console.log("push data fail");
    		}else{
    			console.log("push data succeed");
    		}
	    	notified_num++
	    	if(notified_num == all_notified_member_num){
	    		context.succeed("pushing the notification data finish");
	    	}
    	});
    }

};
