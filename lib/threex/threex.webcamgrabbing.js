var THREEx = THREEx || {}

// shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
window.URL = window.URL || window.webkitURL;

/**
 * Grab camera
 * @constructor
 */
THREEx.WebcamGrabbing = function(){

	//////////////////////////////////////////////////////////////////////////////////
	//		Comments
	//////////////////////////////////////////////////////////////////////////////////
        // create video element
        var domElement        = document.createElement('video')
        domElement.setAttribute('autoplay', true)

	// window.domElement = video
	domElement.style.zIndex = -1;
        domElement.style.position = 'absolute'

	// domElement.style.top = '50%'
	// domElement.style.left = '50%'
	// domElement.style.marginRight = '50%'
	// domElement.style.transform = 'translate(-50%, -50%)'
	// domElement.style.minWidth = '100%'

	domElement.style.top = '0px'
	domElement.style.left = '0px'
	domElement.style.width = '100%'
	domElement.style.height = '100%'
	
	if (invert_camera) domElement.style.transform   = 'scaleY(-1)';  // Invierte la cámara delantera

        /**
         * Resize video element.
         * - Made complex to handle the aspect change
         * - it is frequently when the mobile is changing orientation
         * - after a search on the internet, it seems hard/impossible to prevent browser from changing orientation
         */
        function onResize(){
                // is the size of the video available ?
                if( domElement.videoHeight === 0 )   return

                var videoAspect = domElement.videoWidth / domElement.videoHeight
                var windowAspect = window.innerWidth / window.innerHeight

                // var video = document.querySelector('video')
//                 if( videoAspect < windowAspect ){
//                         domElement.style.left        = '0%'
//                         domElement.style.width       = window.innerWidth + 'px'
//                         domElement.style.marginLeft  = '0px'
//
//                         domElement.style.top         = '50%'
//                         domElement.style.height      =  (window.innerWidth/videoAspect) + 'px'
//                         domElement.style.marginTop   = -(window.innerWidth/videoAspect) /2 + 'px'
// console.log('videoAspect <<<<< windowAspect')
//                 }else{
//                         domElement.style.top         = '0%'
//                         domElement.style.height      = window.innerHeight+'px'
//                         domElement.style.marginTop   =  '0px'
//
//                         domElement.style.left        = '50%'
//                         domElement.style.width       =  (window.innerHeight*videoAspect) + 'px'
//                         domElement.style.marginLeft  = -(window.innerHeight*videoAspect)/2 + 'px'
// console.log('videoAspect >>>> windowAspect')
//                 }
        }

        window.addEventListener('resize', function(event){
                onResize()
        })

        // just to be sure - resize on mobile is funky to say the least
        setInterval(function(){
                onResize()
        }, 500)

 

				var videoAvailable = false;
				var constraints = null;
				navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(function(err) {console.log(err.name + ": " + err.message); });
				
    	  function gotDevices(deviceInfos) {
				  var cualId = null;
          for (var i = 0; i !== deviceInfos.length; ++i) {
            var deviceInfo = deviceInfos[i];
					  if (deviceInfo.kind == 'videoinput'){							
				      videoAvailable = true;
            } 
		      }
          if (videoAvailable) {
						if (camara_trasera){
							  // Por defecto, arranca la cámara trasera del dispositivo móvil
			        navigator.mediaDevices.getUserMedia({ audio: false, video: true }).then(getRearCamera).catch(function(err){ console.log( "Error : " + err.message); });
						} else {
							// Si camara_trasera es false, arrancará la cámara delantera (para portátiles y sobremesas)
							navigator.mediaDevices.getUserMedia({ audio: false, video: true }).then(getFrontCamera).catch(function(err){ console.log( "Error : " + err.message); });
						}
			    } else {
			    alert("Problema arrancando la cámara");
			    }		

          function getRearCamera(stream){
					  var track = stream.getTracks()[0];
						track.stop();
				    navigator.mediaDevices.enumerateDevices().then(searchRearCamera).catch(function(err) {console.log(err.name + ": " + err.message); });
					 
					  function searchRearCamera(deviceInfos) {
				      var cualId = null;
              for (var i = 0; i !== deviceInfos.length; ++i) {
                var deviceInfo = deviceInfos[i];					  
					      if (deviceInfo.kind == 'videoinput'){					 
							    if (deviceInfo.label.toLowerCase().search('back') > -1) {
					        cualId = deviceInfo.deviceId;
					        }
                } 
		          }
              if (cualId) {
			          // Cámara trasera encontrada via id
								constraints = { audio: false, video: { deviceId: { exact: cualId} } };
			        }	
			        else {
							  // Para Firefox, lo intentamos con el parámetro facingMode
								constraints = { audio: false, video: { facingMode: { exact: "environment"} } };
							}	
							navigator.mediaDevices.getUserMedia(constraints).then(function(stream2) {domElement.srcObject = stream2;}).catch(function(err){ console.log( "Error : " + err.message); });			 
						}
					 
          }
					
          function getFrontCamera(stream){
					  var track = stream.getTracks()[0];
						track.stop();
				    navigator.mediaDevices.enumerateDevices().then(searchFrontCamera).catch(function(err) {console.log(err.name + ": " + err.message); });
					 
					  function searchFrontCamera(deviceInfos) {
				      var cualId = null;
							var lastId = null;
							var cual_constraints = navigator.mediaDevices.getSupportedConstraints() ;
              for (var i = 0; i !== deviceInfos.length; ++i) {
                var deviceInfo = deviceInfos[i];
					      if (deviceInfo.kind == 'videoinput'){	
                  lastId = deviceInfo.deviceId; // Guarda el ID de la última cámara visitada								
							    if (deviceInfo.label.toLowerCase().search('front') > -1) {
					        cualId = deviceInfo.deviceId;
									continue;
					        }									
                } 
		          }
              if (cualId) {
			          // Cámara delantera encontrada via id
								constraints = { audio: false, video: { deviceId: { exact: cualId} } };
								navigator.mediaDevices.getUserMedia(constraints).then(function(stream2) {domElement.srcObject = stream2;}).catch(function(err){ console.log( "Error : " + err.message); });
			        }	
			        else {
							  // Primero, lo intentamos con el parámetro facingMode
								constraints = { audio: false, video: { facingMode: { exact: "user"} } };
								navigator.mediaDevices.getUserMedia(constraints).then(function(stream2) {domElement.srcObject = stream2;}).catch(function(err){
								  console.log( "Error : " + err.message);
									if (err.name == 'OverconstrainedError'){
									  // Le damos a pelo el ID de la última cámara
										constraints = { audio: false, video: { deviceId: { exact: lastId} } };
										navigator.mediaDevices.getUserMedia(constraints).then(function(stream2) {domElement.srcObject = stream2;}).catch(function(err2){ console.log( "Error : " + err2.message); });
									}
									});
									
							}	
										 
						}
					 
          }					
					
			  } 

	this.domElement = domElement
}
