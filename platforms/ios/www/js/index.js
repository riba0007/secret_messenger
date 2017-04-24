/*****************************************************************
File: index.js
Authors: 
    Priscila Ribas da Costa
    Robson Miranda
Description: 
    MAD9022 Assignment - Secret Messenger App.
    Cordova App for IOS using Camara and local storage
Version: 0.0.1
Updated: April 11, 2017

*****************************************************************/
'use strict';
var app = {
    //global variables
    img : "",
    msgId: 0,
    sender : 0,
    loadingMsgList : false,
    
    
    server : function(){
      
        const F_LOGIN = 'login.php';
        const F_REGISTER = 'register.php';
        const F_USER_LIST = 'user-list.php';
        const F_MSG_LIST = 'msg-list.php';
        const F_MSG_SEND = 'msg-send.php';
        const F_MSG_DELETE = 'msg-delete.php';
        const F_MSG_GET = 'msg-get.php';
        
        let user_id = 0;
        let user_guid = '';
        
        function call ( page , options ){
           
            let url = 'https://griffis.edumedia.ca/mad9022/steg/' + page;
            
            let data = new FormData();
            
            for ( let key in options){ data.append( key , options[key] ); }
            //console.log('fetch');
            return fetch ( url, { method: 'post', mode: 'cors', body: data } )
            
            .then ( function ( response ) {
                //console.log('fetching');
                return response.json(); 
    
            })
            .catch(function(){
                
                return { code: '999', message : 'Error connecting to server' };
                
            });
        }
        
        return {
            
            login : function( user_name , email ) {
                
                return call( F_LOGIN , { user_name , email } )
                
                    .then ( function ( data ) {
                        
                        if ( data.code == 0 ) {

                            user_id = data.user_id;
                            user_guid = data.user_guid;
                            
                            return { 'code' : data.code , 'message' : data.message };

                        } else {

                            return data;

                        }      
                });
            },
            
            register : function( user_name , email ) {
                
                return call( F_REGISTER , { user_name , email } )
                
                    .then ( function ( data ) {
                            
                        if ( data.code == 0 ) {

                            user_id = data.user_id;
                            user_guid = data.user_guid;
                            
                            return { 'code' : data.code , 'message' : data.message };

                        } else {

                            return data;

                        }      
                });
                
            },
            
            userList : function() {
                
                return call( F_USER_LIST , { user_id , user_guid } );
                
            },
            
            msgList : function() {
                
                return call( F_MSG_LIST , { user_id , user_guid } );
                
            },
            
            msgSend : function( recipient_id , image ) {
                
                return call( F_MSG_SEND , { user_id , user_guid , recipient_id , image } );
                
            },
            
            msgDelete : function( message_id ) {
              
                return call( F_MSG_DELETE , { user_id , user_guid , message_id } );
                
            },
            
            msgGet : function( message_id ) {
                
                return call( F_MSG_GET , { user_id , user_guid , message_id } );

            },
            
            logOut : function() {
                
                //there's no fetch to logout
                user_id = 0;
                
                user_guid = '';
                
            }
            
        }
    }(),
    
    msgListLoop : function( ){
        
        let loop = false;
        
        let run = function(){
            
            if ( loop ) {
                
                //console.log('checking new messages');

                app.msgList();

                setTimeout( run , 100000); 
                
            }
        };
        
        return {
             start : function(){
                 
                 if (!loop) {
                     
                     loop = true;
                     
                     run();
                 }
            },
            
            stop : function(){
                
                loop = false;
            }
        }
    }(),
    
    alert : function ( type , message ) {
        
        //console.log(message);
        
        let content;
        let main;
        
        if (document.querySelector('.active')) {
            
            content = document.querySelectorAll('.active .content .card')[document.querySelectorAll('.active .content .card').length-1];
            
            main = document.querySelectorAll('.active .content')[document.querySelectorAll('.active .content').length -1];
            
        } else {
            
            content = document.querySelector('body .content ul');
            
            main = document.querySelector('body .content');
        }
        
        
        //console.log('content' , content);
        
        //console.log('main' , main);
        
        let div = document.createElement("div");
        
        div.className = "msg " + type ;
        
        
        //adds opacity
        setTimeout( (function( c, d ){
            
            return function(){
                
                div.classList.add("load");
            
            }
        })( content , div ), 50);
        
        
        div.textContent = message;
        
        main.insertBefore( div, content );
        
        
        //removes msg
        setTimeout( (function( c, d ){
            
            return function(){
                //opacity
                div.classList.remove("load");
                
                //removes from screen
                setTimeout( (function( c, d ){
            
                    return () => main.removeChild( div );
                    
                })( content , div ), 400);
            }
        })( content , div ), 3000);
    },
    
    dataURLToBlob : function( dataURL ) {
        return Promise.resolve().then(function () {
            
            var type = dataURL.match(/data:([^;]+)/)[1];
            
            var base64 = dataURL.replace(/^[^,]+,/, '');
            
            var buff = app.binaryStringToArrayBuffer(atob(base64));
            
            return new Blob([buff], {type: type});
        });
    },
    
    binaryStringToArrayBuffer: function( binary ) {
        
        var length = binary.length;
        
        var buf = new ArrayBuffer(length);
        
        var arr = new Uint8Array(buf);
        
        var i = -1;
        
        while (++i < length) {
            arr[i] = binary.charCodeAt(i);
        }
        
        return buf;
    },
    
    msgSend : function( ) {
        
        document.getElementById( 'msg-picture' ).classList.contains( 'hidden' ) ? app.alert( 'warning' , 'Using default image' ) : 0;
        
        
        let c = document.createElement( 'canvas' );
        
        c.height = c.width = 300;
        
        c.getContext('2d').drawImage( document.getElementById( 'msg-picture' ) , 0 , 0 );
        
        let msgtext = document.getElementById( 'msg-text' ).value.trim();
        
        let usernum = document.getElementById( 'msg-user' ).value;
        
        try {
            
            c = BITS.setUserId( BITS.numberToBitArray( usernum ), c );
        
            c = BITS.setMsgLength( BITS.numberToBitArray( msgtext.length * 16 ), c );

            c = BITS.setMessage( BITS.stringToBitArray( msgtext ), c );
            
        } catch( error ) {
            
            console.log(error);
            
        }
        
        //c.toBlob( function( blob ){
        console.log('test');
        app.dataURLToBlob( c.toDataURL() )
        .then(function( blob ){
            
            app.server.msgSend( document.getElementById( 'msg-user' ).value , blob )
            .then( function ( data ) {
                
                if ( data.code == 0 ) {
                    
                   app.closeModal();
                    
                } else { app.alert( 'error' , data.message ); }
                
            });       
        });
            
        //}, 'image/png' );
  
    },
    
    answerMsg : function( ) {
        
        document.querySelector( 'header a' ).dispatchEvent( new CustomEvent( "touchend" , { bubbles: true, cancelable: true }));

    },
    
    msgDelete : function() {
        
        app.server.msgDelete( app.msgId )
        .then( function( data ) {
            
            if ( data.code == 0 ) { app.cleanModal( true ); }
            
            else { app.alert( 'error' , data.message ); }
            
        });
        
    },
    
    msgGet : function( id ){
        
        app.server.msgGet( id )
        .then(function( data ){
            
            if ( data.code == 0 ){
                
                app.msgId = id;
                
                let imgObj = document.querySelector( '#detailsModal img' );     
                
                let loadImg = function( ev ){
                
                    let c = document.createElement( 'canvas' );
                    
                    c.height = c.width = 300;
                    c.getContext('2d').drawImage( imgObj , 0 , 0 );

                   
                    try {
                    
                        document.querySelector( '#detailsModal .content-padded span' ).textContent = BITS.getMessage(data.recipient, c);
                    
                    } catch (error) {
                       
                        console.log(error);
                        app.alert( 'error' , 'Unable to read message' );
                        document.querySelector( '#detailsModal .content-padded span' ).textContent = '?????';
                        
                    }
                   

                    app.server.userList()
                    .then( function ( users ) {

                        document.querySelector( '#detailsModal header h1' ).textContent = 'From: ';

                        if ( users.code == 0 ) {

                             users.users.map( function( user ){

                                 if ( user.user_id == data.sender ) {

                                    app.sender = user.user_id;
                                    document.querySelector( '#detailsModal header h1' ).textContent += user.user_name;

                                 }
                             });

                        } else { 
                            
                            app.alert( 'error' , 'Unable to check Sender' );
                            
                            document.querySelector( '#detailsModal header h1' ).textContent += '?????'; 
                        }

                    });
                    
                    imgObj.removeEventListener('load', loadImg );
                };
                
                //event listener
                imgObj.addEventListener('load', loadImg );
                
                imgObj.src = 'https://griffis.edumedia.ca/mad9022/steg/' + data.image;
                
            } else {
                
                app.alert( 'error' , data.message );
                
            }
            
        });
    },
    
    cleanModal : function( close ){
        
        if ( document.querySelector( '.active' ).id == 'newModal' ){
            
            //clean variables
            app.img = "";
            
            //cleans fields
            document.getElementById( 'msg-user' ).value = '';
            document.getElementById( 'msg-text' ).value = '';
            document.getElementById( 'msg-picture' ).src = 'img/placeholder.png';
            document.getElementById( 'msg-picture' ).classList.add( 'hidden' );
            document.getElementById( 'msg-take-picture' ).classList.remove( 'hidden' );
        
        } else {
            app.msgId = 0;
            app.sender = 0;
        }
        
        //shows list
        app.msgList();
        
        //closes modal
        close ? app.closeModal() : 0;
        
    },
    
    closeModal : function(){
        
        document.querySelector( '.active header a' ).dispatchEvent( new CustomEvent( 'touchend' , { bubbles: true, cancelable: true } ) );
    
    },
    
    login : function(){
        
        //console.log('login');
        document.getElementById( 'lgn-login' ).disabled = true;
        
        let user = document.getElementById( 'lgn-user' ).value.trim();
        
        let email = document.getElementById( 'lgn-email' ).value.trim();
        
        app.server.login( user , email )
        .then( function( data ){
            
            if ( data.code == 0 ) {
                
                document.getElementById( 'lgn-user' ).value = '';
                
                document.getElementById( 'lgn-email' ).value = '';
                
                document.getElementById( 'loginModal' ).classList.remove('active');
                
                app.msgListLoop.start();
                
            } else { app.alert( 'error' , data.message ); }
            
            document.getElementById( 'lgn-login' ).disabled = false;
            
        });
    },
    
    logout : function(){
        
        app.msgListLoop.stop();
        app.server.logOut();
        
    },
    
    register : function(){
        
        let user = document.getElementById( 'lgn-user' ).value.trim();
        
        let email = document.getElementById( 'lgn-email' ).value.trim();
        
        app.server.register( user , email )
        .then( function( data ){
            
            if ( data.code == 0 ) {
                
                //app.msgList();
                
                document.getElementById( 'lgn-user' ).value = '';
                document.getElementById( 'lgn-email' ).value = '';
                
                document.getElementById( 'loginModal' ).classList.remove('active');
                
            } else { app.alert( 'error' , data.message ); }
            
        });
    },
    
    msgList : function(){
        
        //console.log('msgList');
        
        if (!app.loadingMsgList) {
            
            //console.log('loading');
            
            app.loadingMsgList = true;
            
            
            //clears the current list
            document.getElementById( "msg-list" ).innerHTML = "";

            app.server.msgList()
            .then( function( data ){

                if ( data.code == 0 ) {

                    data.messages.forEach( function( msg ){

                        let li = document.createElement( "li" );

                        li.className = "table-view-cell";

                        li.innerHTML = ''.concat( '<a class="navigate-right" href="#detailsModal">' ,
                                                     '<div class="media-body">' ,
                                                        '<span> From: ' , msg.user_name , '</span>' ,
                                                     '</div></a>' );

                        //adds Event listeners
                        li.querySelector( "a" ).addEventListener( "touchend" , () => app.msgGet( msg.msg_id ) );

                        //adds item to the list
                        document.getElementById( "msg-list" ).appendChild(li);

                    });     

                } else { app.alert( 'error' , data.message ); }
                
                app.loadingMsgList = false;

            });
        }
    },
    
    userList : function(){
        
        app.server.userList()
        .then( function( data ){
            
            if ( data.code == 0) {
                
                let options = '<option value="-1">Select</option>';
                
                data.users.forEach( u => options += '<option value="' + u.user_id + '">' + u.user_name , '</option>' );
                
                document.getElementById( 'msg-user' ).innerHTML = options;
                
                if (app.sender != 0) { 
                
                    document.getElementById( 'msg-user' ).value = app.sender;
                    
                    app.sender = 0;
                        
                }
                
            } else { app.alert( 'error' , data.message ); }
            
        });
        
    },
    
    takePicture : function(){
        
        let success = function( uri ){ 
            
            app.img = uri; 
          
            document.getElementById( 'msg-take-picture' ).classList.add( 'hidden' );
            
            document.getElementById( 'msg-picture' ).src = app.img;
            
            document.getElementById( 'msg-picture' ).classList.remove( 'hidden' );
        
        };
        
        let fail = function ( e ){
            
            app.alert( 'error' , e );
            app.alert( 'warning' , 'Using default image' );
            
            success( 'img/placeholder.png' );
        }
        
        try {
            
            let options = {
                destinationType : Camera.DestinationType.FILE_URI,
                encodingType : Camera.EncodingType.PNG,
                mediaType : Camera.MediaType.PICTURE,
                pictureSourceType : Camera.PictureSourceType.CAMERA,
                allowEdit : true,
                targetWidth : 300,
                targetHeight : 300
            }
            
            navigator.camera.getPicture( success  , fail  , options );
            
        } catch( error ) {
            
            app.alert( 'error' , 'Camera not found' );
            app.alert( 'warning' , 'Using default image' );
            
            success( 'img/placeholder.png' );
            
        }
    },
    
    // deviceready Event Handler
    onDeviceReady : function() {
        //console.log('device ready');
        //listeners
        document.getElementById( 'msg-take-picture' ).addEventListener( 'click' , app.takePicture );
        document.getElementById( 'msg-send' ).addEventListener( 'touchend' , app.msgSend );
        document.getElementById( 'msg-delete' ).addEventListener( 'click' , app.msgDelete );
        document.getElementById( 'lgn-login' ).addEventListener( 'click' , app.login );
        document.getElementById( 'lgn-register' ).addEventListener( 'touchend' , app.register );
        document.getElementById( 'msg-cancel' ).addEventListener( 'touchend' , () => app.cleanModal( false ));
        document.getElementById( 'msg-answer' ).addEventListener( 'touchend' , app.answerMsg );
        document.getElementById( 'msg-new' ).addEventListener( 'touchend' , app.userList );
        document.getElementById( 'logout' ).addEventListener( 'touchend' , app.logout );
        document.getElementById( 'back' ).addEventListener( 'touchend' , () => app.sender = 0 );
        document.querySelector( '.fab' ).addEventListener( 'click' , app.msgList );
    },
    
    // Application Constructor
    initialize : function() {
        //console.log('initialize');
        document.addEventListener( 'deviceready' , this.onDeviceReady.bind( this ) , false );
    }
};

app.onDeviceReady();
//app.initialize();