var x_1
var y_1
var z_1
var x_250
var y_250
var z_250
var x_255
var y_255
var z_255
var x_265
var y_265
var z_265
var x_1023
var y_1023
var z_1023
var stage = 1;
draw_once = true


// Init the stats

stats = new Stats();
stats.setMode(0);
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
stats.domElement.style.zIndex = 100;
document.body.appendChild( stats.domElement );

// var renderer = new THREE.WebGLRenderer({antialias	: true,	alpha		: true});
var renderer = new THREE.WebGLRenderer({alpha		: true});
renderer.setSize( window.innerWidth, window.innerHeight ); 
document.body.appendChild( renderer.domElement );

var scene = new THREE.Scene();

// Create a camera and set it into world space
// This camera will provide a perspective projection
// Arguments are (fov, aspect, near_plane, far_plane)

var initialfoclength = 320; // Initial value for focal length

var camera = new THREE.PerspectiveCamera(40, window.innerWidth/window.innerHeight, 0.1, 1000);
scene.add(camera);
camera.position.z = 2;

var localToCameraAxesPlacement;
var axes = new THREE.AxesHelper( 0.1 );
localToCameraAxesPlacement = new THREE.Vector3(-0.7 * camera.aspect,-0.5, -2);
scene.add(axes);

var controls = new function(){
	this.foclength = initialfoclength;
	this.manualfoclength = false;
	this.playvideo = true;
	this.playvideoprev = true;
	this.debugmarkers = false;
	this.detectmarkers = true;
	this.num_markers = 1024;  // Número de posibles IDs. Usado para dimensionar array de filtrado POSIT
	this.cualdebug = 255;  // ID del marcador a depurar
	
	this.colormesh1 = 0xc8c8c8;
	this.colormesh2 = 0xff0000;
	this.colormesh3 = 0x00ff00;
	this.objectrotationH = 0.0;
	this.objectrotationV = 0.0;
	this.layer1 = true;
	this.changes_in_material = false;
	this.Pause = false;
	

	this.updateFov = function (e) {               
		camera.fov = e;
		camera.updateProjectionMatrix();	 
	}
	
	this.updateDebugMarkers = function (e) {
		jsArucoMarker.debugEnabled = e;
	}
	this.updateMatFlag = function (){
		controls.changes_in_material = true;
	}

}

var light_point = new THREE.PointLight(controls.colorpointlight, 0.8);
camera.add(light_point);
light_point.position.set(0,0,3);
light_point.visible = true;

// Array usado en jsarucomarker.js para pasar en la invocación a POSIT.pose los valores históricos usados para filtrar la salida de POSIT
// El orden es: candidatoprev, cambiospropuestos
// Usado como variable global para poder tener un array de objetos PersistID, con cada marcador (ID) distinto recibiendo su propio objeto
// Los objetos proporcionan la persistencia necesaria para el seguimiento de la salida de POSIT
// El ID del objeto se utiliza como índice para acceder al objeto correspondiente

var PersistID = {
	candidatoprev: 0,  // valor histórico para filtrado POSIT
	cambiospropuestos: 0 // valor histórico para filtrado POSIT
};

var array_PersistIDs = [];
for (var i=0; i < controls.num_markers; i++){
	// Poblamos el array de objetos PersistID
	var cualPersist = Object.create(PersistID);
	array_PersistIDs.push(cualPersist);
}


var gui = new dat.GUI({autoplace:false, width:400});
	
var f2 = gui.addFolder('Focal length');
var controlfoclength = f2.add(controls, 'foclength', 300,470);
f2.add(controls, 'manualfoclength');

var f3 = gui.addFolder('Debug');
f3.add(controls, 'debugmarkers').onChange(controls.updateDebugMarkers);
f3.add(controls, 'detectmarkers');
f3.add(controls, 'cualdebug',0,1023);

var f6 = gui.addFolder('Scene control');
f6.add(controls, 'playvideo');
f6.addColor(controls, 'colormesh1').onChange(controls.updateMatFlag);

var f7 = gui.addFolder('Interaction');
f7.add(controls, 'objectrotationH', -Math.PI, Math.PI);
f7.add(controls, 'objectrotationV', -Math.PI, Math.PI);
f7.add(controls, 'layer1');
f7.add(controls, 'Pause');

controls.Start_animation = 
              function() {
				controls.Start = true;
       };
	   

f7.add(controls,'Start_animation')
       .name('Start');

f7.open();



var axesPlacement = new THREE.Vector3();  // Instanced for reuse in render method
	
// Trigger to start live image grabbing
var videoGrabbing = new THREEx.WebcamGrabbing(); 
document.body.appendChild(videoGrabbing.domElement);


//		create 3D objects to be rendered on the detected markers
var markerObject3D = new THREE.Object3D();	//tutaj tworzymy obiety-grupy które następnie przypisywane są do konkretnego id
scene.add(markerObject3D);

// Usa una función de ejecución inmediata para asignar objeto renderizado al primer 
// Object3D
// Al usar la función, puede reutilizar las variables geometry y material, que son locales
// al contexto de la función
// El punto y coma es programación defensiva, para proteger la función de errores de sintaxis

// First 3D object is associated to marker with id = 265
//test

var material1 = new THREE.MeshLambertMaterial( {color: controls.colormesh1} );	//bedziemy dodawać do mesh, umożliwi kontrolowanie koloru danego obiektu
const material_line = new THREE.LineBasicMaterial( { color: 0x0000ff, linewidth: 100 } );

var objLayer1 = new THREE.Object3D();  //definiujemy obiekty dla obiekty-grupy



markerObject3D.add(objLayer1);	//dodajemy do obiekty-grupy wszystkie 3 obiekty modele 3d zamek dynia buldorzer


var loader = new THREE.STLLoader();

// Layer 1
	//dopiero tutaj ładujemy utworzoną strukturę do materiału (geometry to podana ścieżka do pliku) i przypisujemy do mesh
	//i następnie ten mesh wrzucamy do zdefiniowanego wcześniej obiektu
	loader.load( 'Modelos_STL/bulldozer.stl', function ( geometry ) {
	  
		var mesh = new THREE.Mesh(geometry, material1);
		mesh.scale.set(0.02, 0.02, 0.02);
		//mesh.rotation.set(  - Math.PI / 2, 0, 0);
		objLayer1.add(mesh);
	} );
	
// handle window resize
$( window ).resize(function() {
  renderer.setSize( window.innerWidth, window.innerHeight );
	camera.aspect	= window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
});

var touchobj = null, startx, starty, dist = 0;
var clickEventType = ((document.ontouchstart!==null)?'click':'touchstart');

$('body').on(clickEventType, function(e){
	touchobj = e.changedTouches[0];
	startx = parseInt(touchobj.clientX);
	starty = parseInt(touchobj.clientY);
	e.preventDefault();
});

clickEventType = ((document.ontouchmove!==null)?'click':'touchmove');

$('body').on(clickEventType, function(e){
	touchobj = e.changedTouches[0];
	var dist = parseInt(touchobj.clientX) - startx;
	controls.objectrotationH = Math.PI * (dist/200);
	dist = parseInt(touchobj.clientY) - starty;
	controls.objectrotationV = Math.PI * (dist/200);
	
	e.preventDefault();
});

// init the marker recognition
var jsArucoMarker	= new THREEx.JsArucoMarker();
jsArucoMarker.videoScaleDown = 2;
// jsArucoMarker.debugEnabled = true; // QUITAR. SOLO PARA DEPURACION


var domElement	= videoGrabbing.domElement;  // Evita invocaciones en bucle de render
// Declaraciones para evitar reinvocaciones en bucle de render
var cualfocallength = 320;

renderer.compile( scene, camera );  // Precompila los shaders antes de comenzar la renderización
debug = true;

// Render loop
function render() { 

if (controls.playvideo != controls.playvideoprev){
	  // Starts or pauses video rendering on screen
		if (controls.playvideo){
		  videoGrabbing.domElement.play(); // Starts rendering
		} else{
		  videoGrabbing.domElement.pause(); // Stops rendering
		}
		controls.playvideoprev = controls.playvideo;
	}
	
	// Set the focal length value before calling markerToObject3D
	if (controls.manualfoclength){
		cualfocallength = controls.foclength;
	} else {
		if (domElement.videoWidth > domElement.videoHeight){
			// Portrait
			cualfocallength = 320;
		} else {
			// Landscape
			cualfocallength = 450;
		}
		controls.foclength = cualfocallength;
		controlfoclength.updateDisplay();
	}
	
	markerObject3D.visible = false;
	if (controls.detectmarkers){
		// Sólo detecta marcadores si el flag del GUI está activado
		var markers	= jsArucoMarker.detectMarkers(domElement);  // Detecta marcadores también con el video congelado

		marker1 = false; 
		marker250 = false;
		marker255 = false;
		marker265 = false;
		marker1023 = false;
		// see if this.markerId has been found
		markers.forEach(function(marker){
			if(marker.id == 1 && marker1 == false){
				marker1 = true;
				//starting_marker = marker;
				jsArucoMarker.markerToObject3D(marker, markerObject3D, cualfocallength);
				x_1 = markerObject3D.position.x;
				y_1 = markerObject3D.position.y;
				z_1 = markerObject3D.position.z;
				//console.log("1 x ->"+x_250)
			}else if(marker.id == 250 && marker250 == false){
				marker250 = true;
				jsArucoMarker.markerToObject3D(marker, markerObject3D, cualfocallength);
				x_250 = markerObject3D.position.x;
				y_250 = markerObject3D.position.y;
				z_250 = markerObject3D.position.z;
			}else if(marker.id == 255 && marker255 == false){
				marker255 = true;
				jsArucoMarker.markerToObject3D(marker, markerObject3D, cualfocallength);
				x_255 = markerObject3D.position.x;
				y_255 = markerObject3D.position.y;
				z_255 = markerObject3D.position.z;
			}else if(marker.id == 265 && marker265 == false){
				marker265 = true;
				jsArucoMarker.markerToObject3D(marker, markerObject3D, cualfocallength);
				x_265 = markerObject3D.position.x;
				y_265 = markerObject3D.position.y;
				z_265 = markerObject3D.position.z;
			}else if(marker.id == 1023 && marker1023 == false){
				marker1023 = true;
				jsArucoMarker.markerToObject3D(marker, markerObject3D, cualfocallength);
				x_1023 = markerObject3D.position.x;
				y_1023 = markerObject3D.position.y;
				z_1023 = markerObject3D.position.z;
			}
			 if ( marker1 && marker250 && marker255 && marker265 && marker1023){
				videoGrabbing.domElement.pause();
				if(draw_once){
					draw_once=false;
					const points = [];
					points.push( new THREE.Vector3(x_1, y_1, z_1 ) );
					points.push( new THREE.Vector3( x_250, y_250, z_250 ) );
					points.push( new THREE.Vector3( x_255, y_255, z_255 ) );
					points.push( new THREE.Vector3( x_265, y_265, z_265 ) );
					points.push( new THREE.Vector3( x_1023, y_1023, z_1023 ) );
					const geometry = new THREE.BufferGeometry().setFromPoints( points );
					const line = new THREE.Line( geometry, material_line );
					scene.add( line );
					movement_1_250_x = (x_1-x_250)/1000;
					movement_1_250_y = (y_1-y_250)/1000;
					movement_1_250_z = (z_1-z_250)/1000;

					movement_250_255_x = (x_250-x_255)/1000;
					movement_250_255_y = (y_250-y_255)/1000;
					movement_250_255_z = (z_250-z_255)/1000;

					movement_255_265_x = (x_255-x_265)/1000;
					movement_255_265_y = (y_255-y_265)/1000;
					movement_255_265_z = (z_255-z_265)/1000;

					movement_265_1023_x = (x_265-x_1023)/1000;
					movement_265_1023_y = (y_265-y_1023)/1000;
					movement_265_1023_z = (z_265-z_1023)/1000;

					newx=x_1;
					newy=y_1;
					newz=z_1;

					var plane = new THREE.Plane();
					plane.setFromCoplanarPoints(new THREE.Vector3(x_250,y_250,z_250), new THREE.Vector3(x_1023,y_1023,z_1023), new THREE.Vector3(x_265,y_265,z_265));
					normal = plane.normal;
					//markerObject3D.rotation.set(normal.x, normal.y, normal.z);  // Rota el objeto al completo

					delta_250_255_x = x_250-x_255;
					delta_250_255_y = y_250-y_255;

					delta_255_265_x = x_255-x_265;
					delta_255_265_y = y_255-y_265;

					delta_265_1023_x = x_265-x_1023;
					delta_265_1023_y = y_265-y_1023;

					tan = (x_1-x_250)/(y_1-y_250);
					angle = Math.atan(tan);
					if(y_1>y_250){
						angle = (Math.PI/2)-angle;
					}
					if(y_1<y_250){
						angle = -(Math.PI/2)-angle;
					}
					
				}
				//console.log(57.32*angle);
				//console.log("X_1->"+x_1);
				//console.log(Math.PI);
				if(Math.abs(x_250-newx)<1 && stage == 1){
					stage = 2;
					tan = delta_250_255_x/delta_250_255_y;
					angle = Math.atan(tan);
					if(y_250>y_255){
						angle = (Math.PI/2)-angle;
					}
					if(y_250<y_255){
						angle = -(Math.PI/2)-angle;
					}
				}
				if(Math.abs(x_255-newx)<1 && stage == 2){
					stage = 3;
					tan = delta_255_265_x/delta_255_265_y;
					angle = Math.atan(tan);
					if(y_255>y_265){
						angle = (Math.PI/2)-angle;
					}
					if(y_255<y_265){
						angle = -(Math.PI/2)-angle;
					}
				}
				if(Math.abs(x_265-newx)<1 && stage == 3){
					stage = 4;
					tan = delta_265_1023_x/delta_265_1023_y;
					angle = Math.atan(tan);
					if(y_265>y_1023){
						angle = (Math.PI/2)-angle;
					}
					if(y_265<y_1023){
						angle = -(Math.PI/2)-angle;
					}
				}
				if(Math.abs(x_1023-newx)<1 && stage == 4){
					stage = 5;
				}
				var Pause = controls.Pause;
				var Start = false
				var Start = controls.Start;
				 //jsArucoMarker.markerToObject3D(marker, markerObject3D, cualfocallength);
				 if(stage == 1){
					 console.log("W ifie"+Start);
					if(Pause ==false && Start){
						newx = newx-movement_1_250_x;
						newy = newy-movement_1_250_y;
						newz = newz-movement_1_250_z;
						console.log("MATH ABS->"+Math.abs(x_250-newx));
					}

					
				 }if(stage == 2){
					first = false
					if(Pause ==false){
						newx = newx-movement_250_255_x;
						newy = newy-movement_250_255_y;
						newz = newz-movement_250_255_z;
					}

				 }
				if(stage == 3){
					first = false
					if(Pause ==false){
						newx = newx-movement_255_265_x;
						newy = newy-movement_255_265_y;
						newz = newz-movement_255_265_z;
					}

				 }
				if(stage == 4){
					first = false
					if(Pause ==false){
						newx = newx-movement_265_1023_x;
						newy = newy-movement_265_1023_y;
						newz = newz-movement_265_1023_z;
					}
	
				 }
				if(stage == 5){
					first = false
					newx = x_1023;
					newy = y_1023;
					newz = z_1023;
					
				 }
				 markerObject3D.rotation.z = angle;
				 markerObject3D.position.set(newx,newy,newz);
				 //console.log("1 x inside->"+x_250)
				 markerObject3D.visible = true;
				 //markerObject3D.rotation.set(controls.objectrotationV, controls.objectrotationH, 90);  // Rota el objeto al completo
				 console.log(controls.Start);
				 objLayer1.visible = controls.layer1;
				 debug = false;
				 if (controls.changes_in_material){
				    material1.color = new THREE.Color(controls.colormesh1);
					material1.needsUpdate = true;
				 }
			 } else
			 return		
		})
	}

	
	
	camera.updateMatrixWorld();
	axesPlacement = camera.localToWorld(localToCameraAxesPlacement.clone());
	axes.position.copy(axesPlacement);
	
	
  requestAnimationFrame( render );
  stats.update();
  renderer.render( scene, camera ); 
}

// Starts rendering
render();

	