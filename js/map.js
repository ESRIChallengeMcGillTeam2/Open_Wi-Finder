/* -------------------------------- 

#### Utilizes:
* [ArcGIS API for Javascript](https://developers.arcgis.com/javascript/)
* [CodyHouse Full-Screen Pop-Out Navigation](http://codyhouse.co/gem/full-screen-pop-out-navigation/)
* [Firebase ](https://www.firebase.com) 

#### Written by:
* Robert Smith
* Suthee Sangiambut
* Matt Kalebic

#### Produced for Esri's ECCE App Challenge 2015, Submitted March 6th 2015

#### Last Updated: March 19th 2015

-------------------------------- */

// JavaScript Document

//global variable initialization
var map;
var graphic;
var currLocation;
var watchId;
var myFirebase = new Firebase("https://open-wifinder.firebaseio.com/");

var lon;
var lat;

//default lat/lon in case users have geolocation disabled
lon = "-73.5673";
lat = "45.5017";

require([
	  //modules to load -- aliases defined after "function ("
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
      //module aliases to be used when calling them inside the require function
	  Map, 
	  LocateButton, 
	  Point,
      SimpleMarkerSymbol, 
	  SimpleLineSymbol,
      Graphic, 
	  Color, //Geometry Hooks
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
		//new map object with settings. map placed in div with id="map"
      map = new Map("map", {
        center: [lon, lat],
        zoom: 12,
        basemap: "streets"
      });
      
	  map.on("load", initFunc);
	  loadAllPoints();//draws all points to the map
	   
	   
	   //Creates geolocate button using ersi Geolocation dijit     
      geoLocate = new LocateButton({
        map: map
      }, "LocateButton");
      geoLocate.startup();
	  
	  //html-JS interaction event handlers
	   var addPointBtn = dom.byId("addPointPopup");
	  on(addPointBtn, "click", div_show);
	  
	  var closestPtBtn = dom.byId("closestPoint");
	  on(closestPtBtn, "click", closestDist);
	  
	  var submitBtn = dom.byId("submit");
	  on(submitBtn, "click", submitData);
	  
	  var closeDiv = dom.byId("closeDiv");
	  on(closeDiv, "click", div_hide);
	  
	  
		//Hotspot object definition and constructor
	  var Hotspot = function (lon, lat, ssid, auth, avail, openhr, closedhr) {

  		this.lon = lon;
		this.lat = lat;
		this.ssid = ssid;
		this.auth = auth;
		this.avail = avail;
		this.openhr = openhr;
		this.closedhr = closedhr;
		this.pt = new Point(lon, lat);
	  }
	  var hotspotList = [];
	  
	  var currLoc;
	  var graphic;


	//function to pull data from the form into a Hotspot object, push that object to firebase and center the map at the newly created point. Currently only takes location data from the current user position.
	function submitData() {
	  if (dom.byId('ssid').value == "" || dom.byId('auth').value == "" || dom.byId('avail').value == "") {
		  alert("Fill All Fields !");
	  } 
	  else {
		var createHotspot = new Hotspot(currLoc.x,currLoc.y, dom.byId("ssid").value, dom.byId("auth").value, dom.byId("avail").value, dom.byId("openhr").value, dom.byId("closedhr").value);
		console.log(createHotspot);
		pushToFirebase(createHotspot);
		map.centerAt(createHotspot.pt);
		//dom.byId('form').submit();
		
		document.getElementById("ssid").reset();
		document.getElementById("auth").reset();
		document.getElementById("avail").reset();
		document.getElementById("openhr").reset();
		document.getElementById("closedhr").reset();
		document.getElementById("form").reset();
		
		alert("New Hotspot Submitted Successfully!");
		div_hide();
	  }
	}
	
	//Function To Display Popup
	function div_show() {
		document.getElementById("popupDiv").style.display = "block";
	}
	//Function to Hide Popup
	function div_hide(){
		dom.byId("popupDiv").style.display = "none";
		
		//These resets don't seem to do anything. Need to correct form reset.
		document.getElementById("ssid").reset();
		document.getElementById("auth").reset();
		document.getElementById("avail").reset();
		document.getElementById("openhr").reset();
		document.getElementById("closedhr").reset();
		document.getElementById("form").reset();
	}

	//draw() function draws all hotspots in the hotspotList[]
	function draw () {		
		if (map.graphics){map.graphics.clear();}
		for (i=0; i<hotspotList.length; i++){
			var attr = {"SSID":hotspotList[i].ssid,"Auth":hotspotList[i].auth,"Avail":hotspotList[i].avail,"Open":hotspotList[i].openhr,"Closed":hotspotList[i].closedhr};
		var hotspotInfoBox = new InfoTemplate("Hotspot Details","<strong>SSID: </strong> ${SSID}  <br/> <strong>Type:</strong> ${Auth} <br/> <strong>Availability:</strong> ${Avail} <br/><strong>Open:</strong>${Open}</br><strong>Closed:</strong>${Closed}");
		addGraphic(hotspotList[i].pt, attr, hotspotInfoBox);
		}
	}
	
	//finds nearest neighbor using euclidian distance, then center on that point. Needs to be improved to be more appropriate for working with lat/lon
	function closestDist (){
		var minEuclidDist;
		var closestIndex=0;
		
		var x0Dist = hotspotList[0].pt.x - currLoc.x;
		var y0Dist = hotspotList[0].pt.y - currLoc.y;
		
		minEuclidDist = Math.sqrt((x0Dist*x0Dist)+(y0Dist*y0Dist));
		
		for (i=0; i<hotspotList.length; i++){
			var xDist = hotspotList[i].pt.x - currLoc.x;
			
			var yDist = hotspotList[i].pt.y - currLoc.y;
			
			
			var euclidDist = Math.sqrt((xDist*xDist)+(yDist*yDist));
			
			if (euclidDist<minEuclidDist) {
				minEuclidDist = euclidDist;
				closestIndex = i;
			};	
		} //end for loop
		map.centerAndZoom(hotspotList[closestIndex].pt,10);
		
		//addGraphic(hotspotList[closestIndex].pt);
		
	}
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
		  
		  //watches for movement and updates current location
		  watchId = navigator.geolocation.watchPosition(watchLocation, locationError); //Turns off watchPosition when commented
		} 
		else {
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
		  currLoc = pt;
		  
		  
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
	
	function watchLocation(location) {
          //zoom to the users location and add a graphic
          var pt = new Point(location.coords.longitude, location.coords.latitude);
          if ( !graphic ) {
            addGraphic(pt);
          } else { // move the graphic if it already exists
            graphic.setGeometry(pt);
			currLoc = pt;
          }
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
		
	
//this function grabs a 'snapshot' of all the data in Firebase, then navigates down to the 'features' child. It then iterates through all the children under 'attributes' and retrieves all attribute data. Then it converts them to strings or numbers and calls addPoint to map them
	function loadAllPoints(){

		var dataObject;
		hotspotList=[];
	
		myFirebase.on("value", function(snapshot) {
		dataObject = snapshot;
		
		//iterate through each child in the datasnapshot
		dataObject.forEach(function(childSnapshot){
			
			//grabs each attribute from the firebase children, and converts to respective types (Number or String)
			var xcoord = Number(childSnapshot.child("Longitude").val());
			var ycoord = Number(childSnapshot.child("Latitude").val());
			var authentication = String(childSnapshot.child("Authentication").val());
			var availability = String(childSnapshot.child("Availability").val());
			var SSID = String(childSnapshot.child("SSID").val());
			var openhr = Number(childSnapshot.child("openhr").val());
			var closedhr = Number(childSnapshot.child("closedhr").val());
			

			
			var hotspot = new Hotspot(xcoord, ycoord, SSID, authentication, availability, openhr, closedhr);
			
			//add the newly created hotspot to the hotspotlist array
			hotspotList.push(hotspot);
			
			//addPoint(xcoordstring,ycoordstring,SSIDstring,authenticationstring,availabilitystring);
		});
		//how many children do i have?
		var numberofchild = dataObject.numChildren();
		console.log(numberofchild);
		draw();
		
			console.log(hotspotList[hotspotList.length]);
		dataObject = null;
		}, function (errorObject) {
		console.log("The read failed: " + errorObject.code);
	});//end firebase.on()
	}//end loadAllPoints
	
	//Function to push data from hotspot object to firebase
	function pushToFirebase(hotspot){
		myFirebase.push({"SSID":hotspot.ssid,"Latitude":hotspot.lat,"Longitude":hotspot.lon,"Authentication":hotspot.auth,"Availability":hotspot.avail,"openhr":hotspot.openhr,"closedhr":hotspot.closedhr});
		loadAllPoints();
	}
        
        
      });//end BIG FUNCTION (dojo require)

	  


