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
	this.layer2 = true;
	this.layer3 = true;
	this.changes_in_material = false;
	

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
f6.addColor(controls, 'colormesh2').onChange(controls.updateMatFlag);
f6.addColor(controls, 'colormesh3').onChange(controls.updateMatFlag);

var f7 = gui.addFolder('Interaction');
f7.add(controls, 'objectrotationH', -Math.PI, Math.PI);
f7.add(controls, 'objectrotationV', -Math.PI, Math.PI);
f7.add(controls, 'layer1');
f7.add(controls, 'layer2');
f7.add(controls, 'layer3');

f7.open();




var axesPlacement = new THREE.Vector3();  // Instanced for reuse in render method
	
// Trigger to start live image grabbing
var videoGrabbing = new THREEx.WebcamGrabbing(); 
document.body.appendChild(videoGrabbing.domElement);


//		create 3D objects to be rendered on the detected markers
var markerObject3D = new THREE.Object3D();	//tutaj tworzymy obiety-grupy które następnie przypisywane są do konkretnego id
scene.add(markerObject3D);
var markerObject3D2 = new THREE.Object3D();
scene.add(markerObject3D2);
var markerObject3D3 = new THREE.Object3D();
scene.add(markerObject3D3);

// Usa una función de ejecución inmediata para asignar objeto renderizado al primer 
// Object3D
// Al usar la función, puede reutilizar las variables geometry y material, que son locales
// al contexto de la función
// El punto y coma es programación defensiva, para proteger la función de errores de sintaxis

// First 3D object is associated to marker with id = 265


var material1 = new THREE.MeshLambertMaterial( {color: controls.colormesh1} );	//bedziemy dodawać do mesh, umożliwi kontrolowanie koloru danego obiektu
var material2 = new THREE.MeshLambertMaterial( {color: controls.colormesh2} );
var material3 = new THREE.MeshLambertMaterial( {color: controls.colormesh3} );
var material4 = new THREE.MeshLambertMaterial( {color: 0xffff00} );

var objLayer1 = new THREE.Object3D();  //definiujemy obiekty dla obiekty-grupy
var objLayer2 = new THREE.Object3D();  
var objLayer3 = new THREE.Object3D();  


markerObject3D.add(objLayer1);	//dodajemy do obiekty-grupy wszystkie 3 obiekty modele 3d zamek dynia buldorzer
markerObject3D.add(objLayer2);
markerObject3D.add(objLayer3);  // Crea la jerarquía de capas


var loader = new THREE.STLLoader();

// Layer 1
	//dopiero tutaj ładujemy utworzoną strukturę do materiału (geometry to podana ścieżka do pliku) i przypisujemy do mesh
	//i następnie ten mesh wrzucamy do zdefiniowanego wcześniej obiektu
	loader.load( 'Modelos_STL/bulldozer.stl', function ( geometry ) {
	  
		var mesh = new THREE.Mesh(geometry, material1);
		mesh.scale.set(0.02, 0.02, 0.02);
		mesh.rotation.set(  - Math.PI / 2, 0, 0);
		objLayer1.add(mesh);
	} );
	
// Layer 2
	//analogicznie z kolejnymi strukturami. Mając na uwadze ze połączenie materiału i struktury dodajemy do różnych obiektów
	//tak aby te rózne obiekty móc potem dodać do obiekty-grupy
	loader.load( 'Modelos_STL/jackolantern.stl', function ( geometry ) {
	  
		var mesh = new THREE.Mesh(geometry, material2);
		mesh.scale.set(0.02, 0.02, 0.02);
		mesh.rotation.set(  - Math.PI / 2, 0, 0);
		objLayer2.add(mesh);
	} );
	

// Layer 3
	
	loader.load( 'Modelos_STL/castle.stl', function ( geometry ) {
	  
		var mesh = new THREE.Mesh(geometry, material3);
		mesh.scale.set(0.02, 0.02, 0.02);
		mesh.rotation.set(  - Math.PI / 2, 0, 0);
		objLayer3.add(mesh);
	} );
	



	
	
// Lo mismo con el segundo objeto
// Second 3D object is associated to marker with id = 255
;(function(){
		var texture = new THREE.TextureLoader().load( 'images/faces1.jpg' );
		var material = new THREE.MeshBasicMaterial({ map: texture });
		var geometry = new THREE.PlaneGeometry(1,1);
		var object3d = new THREE.Mesh(geometry, material);
		markerObject3D2.add(object3d)
	})()

// Pablo: Third 3D object is associated to marker with id = 200
;(function(){
		var geometry = new THREE.TorusGeometry(0.5,0.1,8,20);
		var material = new THREE.MeshBasicMaterial({ color: 0xc77000, wireframe : false } );
		
		var mesh = new THREE.Mesh(geometry, material);
		markerObject3D3.add( mesh );
	})()
	
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

// Render loop
function render() { 

if (controls.playvideo != controls.playvideoprev){
	  // Starts or pauses video rendering on screen
		if (controls.playvideo){
		  videoGrabbing.domElement.play(); // Starts rendering
		} else {
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
	markerObject3D2.visible = false;
	markerObject3D3.visible = false;
	if (controls.detectmarkers){
		// Sólo detecta marcadores si el flag del GUI está activado
		var markers	= jsArucoMarker.detectMarkers(domElement);  // Detecta marcadores también con el video congelado

	
		// see if this.markerId has been found
		markers.forEach(function(marker){
			 if ( marker.id == 265 ){
				 jsArucoMarker.markerToObject3D(marker, markerObject3D, cualfocallength);
				 markerObject3D.visible = true;
				 markerObject3D.rotation.set(controls.objectrotationV, controls.objectrotationH, 0);  // Rota el objeto al completo
				 objLayer1.visible = controls.layer1;
				 objLayer2.visible = controls.layer2;
				 objLayer3.visible = controls.layer3;  // Control de visibilidad de capas
				 if (controls.changes_in_material){
				   material1.color = new THREE.Color(controls.colormesh1);
					 material1.needsUpdate = true;
					 material2.color = new THREE.Color(controls.colormesh2);
					 material2.needsUpdate = true;
					 material3.color = new THREE.Color(controls.colormesh3);
					 material3.needsUpdate = true;
				 }
				 
			 } else if ( marker.id == 255 ){
				 jsArucoMarker.markerToObject3D(marker, markerObject3D2, cualfocallength);
				 markerObject3D2.visible = true;
				 markerObject3D2.rotation.set(0, 0, 0);
			} else if ( marker.id == 250 ){
				 jsArucoMarker.markerToObject3D(marker, markerObject3D3, cualfocallength);
				 markerObject3D3.visible = true;				 	 
			 } else {
				 return
			 }			
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

	