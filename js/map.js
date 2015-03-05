// JavaScript Document
var map;
var graphic;
var currLocation;
var watchId;
var graphicsArray = [];
var newPoint;
var loc;
var myFirebase = new Firebase("https://esrimcgilltest.firebaseio.com/");
var myGeofire = new GeoFire(myFirebase);
var mydatasnapshot;

var long;
var lat;

var addPtBtn;

long = "-73.5673";
lat = "45.5017";

require([
      "esri/map", 
      "esri/dijit/LocateButton",
      "esri/geometry/Point", 
	  "esri/symbols/SimpleMarkerSymbol", 
	  "esri/symbols/SimpleLineSymbol",
	  "esri/graphic", 
	  "esri/Color", 
	  //Geometry Modules
	  "esri/geometry/Geometry",
	  "esri/geometry/Polyline",
	  "esri/geometry/Polygon",
	 
	  //Graphic & Style Modules
	  
	  "esri/symbols/SimpleFillSymbol",
	  "esri/InfoTemplate",
	 
	   
	  "dojo/dom", 
	  "dojo/on", 
	  "dojo/_base/lang", "dojo/domReady!" 
    ], function(
      Map, LocateButton, Point,
        SimpleMarkerSymbol, SimpleLineSymbol,
        Graphic, Color, //Geometry Hooks
    Geometry,
    Polyline, 
    Polygon,
 
    //Graphic & Style Hooks
    SimpleFillSymbol,
    InfoTemplate, 
	dom, 
	on, 
	lang,
	domReady
    )  {

      map = new Map("map", {
        center: [long, lat],
        zoom: 12,
        basemap: "streets"
      });
      
	  map.on("load", initFunc);
	        
      geoLocate = new LocateButton({
        map: map
      }, "LocateButton");
      geoLocate.startup();
	  
	  var addPointBtn = dom.byId("addPtBtn");
	  on(addPointBtn, "click", addPoint);
	  
	  var loadPtsBtn = dom.byId("loadPts");
	  on(loadPtsBtn, "click", iterateFirebase);


//detect change in device orientation and rotate page
	function orientationChanged() {
          if(map){
            map.reposition();
            map.resize();
          }
        }
		
		//geolocation to run at map load

        function initFunc(map) {
          if( navigator.geolocation ) {  
            navigator.geolocation.getCurrentPosition(zoomToLocation, locationError);
			//loc = navigator.geolocation.getCurrentPosition(zoomToLocation, locationError);
            //watchId = navigator.geolocation.watchPosition(showLocation, locationError); //Turns off watchPosition when commented
          } else {
            alert("Browser doesn't support Geolocation. Visit http://caniuse.com to see browser support for the Geolocation API.");
          }
		  
		  

        }
//error handling for geolocation
        function locationError(error) {
          //error occurred so stop watchPosition
          if( navigator.geolocation ) {
            navigator.geolocation.clearWatch(watchId);
          }
          switch (error.code) {
            case error.PERMISSION_DENIED:
              alert("Location not provided");
              break;

            case error.POSITION_UNAVAILABLE:
              alert("Current location not available");
              break;

            case error.TIMEOUT:
              alert("Timeout");
              break;

            default:
              alert("unknown error");
              break;
          }
        }
//helper function
        function zoomToLocation(location) {
          var pt = new Point(location.coords.longitude, location.coords.latitude);
          addGraphic(pt);
          map.centerAndZoom(pt, 15);
		  long = location.coords.longitude;
		  lat = location.coords.latitude;
        }

//add graphic to map; helper for adding points	    
		function addGraphic(pt, attributes, info){
          var symbol = new SimpleMarkerSymbol(
            SimpleMarkerSymbol.STYLE_CIRCLE, 
            12, 
            new SimpleLineSymbol(
              SimpleLineSymbol.STYLE_SOLID,
              new Color([210, 105, 30, 0.5]), 
              8
            ), 
            new Color([210, 105, 30, 0.9])
          );
          graphic = new Graphic(pt, symbol, attributes, info);
          map.graphics.add(graphic);
        }
		
	//helper 	
        function showLocation(location) {
          //zoom to the users location and add a graphic
          var pt = new Point(location.coords.longitude, location.coords.latitude);
          if ( !graphic ) {
            addGraphic(pt);
          } else { // move the graphic if it already exists
            graphic.setGeometry(pt);
          }
          map.centerAt(pt);
        }
		
	function addPoint(long, lat, ssid, auth, avail) {
//alert("Something happened");
if(map){alert("Map OK" + "\nAdding Point" + "\nAdding Info Box" + "\n\nClick point to show info window");}
hotspotPoint = new Point(this.long, this.lat);
var attr = {"SSID":this.ssid,"Authorization":this.auth,"Availability":this.avail};
var hotspotInfoBox = new InfoTemplate("Hotspot Details","<strong>Network Name:</strong> ${SSID} <br/> <strong>Freedom Level:</strong> ${Freedom} <br/> <strong>Availability:</strong> ${Availability}");
map.centerAt(hotspotPoint);
addGraphic(hotspotPoint, attr, hotspotInfoBox);
}

		function iterateFirebase(){
	//this function grabs a 'snapshot' of all the data in Firebase, then navigates down to the 'features' child. It then iterates through all the
	//'Auth_type' children under 'attributes' and displays an alert for each record
		myFirebase.on("value", function(snapshot) {
		console.log(snapshot.val());
		mydatasnapshot = snapshot.child("features");		
		
		}, function (errorObject) {
		console.log("The read failed: " + errorObject.code);
	});
	alert("reached end of .on function");
	
	mydatasnapshot.forEach(function(childSnapshot){
			var key = childSnapshot.key();
			var xcoord = childSnapshot.child("geometry/x").val();
			var ycoord = childSnapshot.child("geometry/y").val();
			var authentication = childSnapshot.child("attributes/Auth_type").val();
			var availability = childSnapshot.child("attributes/Avail_type").val();
			var SSID = childSnapshot.child("attributes/SSID").val();
			
			
			
			return true;
		});
		alert("reached end of iterations");
}
        
        
      });

	  
//shell function for finding closest hotspot	  
function findClosest() {
	alert("No Locations loaded!");
	
}

//function to add a new hotspot point from the user to the map


var Hotspot = function (ssid, freedom, availability, long, lat) {
	this.ssid = ssid;
	
};
<<<<<<< HEAD

var hotspot1 = new Hotspot("1234");

function pushToFirebase(){
	
/* 	myFirebase.child(/features).set({
	hotspotname: hotspot1.ssid,
	location: [long, lat],
	description: "Ground floor, good connection"
	}); */
	
	/* myFirebase.set({
	"hotspotname": ["Hello", long,lat,"description"],
	"location": [long,lat],
	"description": ["Ground floor, good connection"]
	}).then(function() {
	console.log("Provided keys have been added to GeoFire");
	}, function(error) {
	console.log("Error: " + error);
	}); */
}	
=======
>>>>>>> origin/master
