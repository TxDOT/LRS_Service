// GLOBAL FUNCTIONS
let lrsAPI = {
    // featurePartIndex:"",
    // firstIntersectingPoint:"",
    lrs: {}
};
// GLOBAL VARIABLES
let featurePartIndex;
let firstIntersectingPoint;
// let lrs={};

//Check if using IE and get version
function isIE() {
    var ua = window.navigator.userAgent;
    return /MSIE|Trident/.test(ua);
}

// ESRI JS API MODULES
require([
    // esri config, core, and tasks
    "esri/config",
    "esri/tasks/support/Query",
    "esri/tasks/QueryTask",

    // geometry
    "esri/geometry/Extent",
    "esri/geometry/projection",
    "esri/geometry/geometryEngine",
    "esri/geometry/SpatialReference",
    "esri/geometry/Point",
    "esri/geometry/Polyline",

    // dojo
    "dojo/dom",
    "dojo/on",
    "dojo/parser",
    "dojo/domReady!"
],
    function(
        esriConfig,
        Query,
        QueryTask,
        Extent,
        projection,
        geometryEngine,
        SpatialReference,
        Point,
        Polyline,
        dom,
        on,
        parser)
    {
        // DEFINE ALL FUNCTIONS FIRST
        // Attaching functions to global API object so they are accessible outside their scope
        lrsAPI.getParams = getParams;
        lrsAPI.identRouteForM = identRouteForM;
        lrsAPI.getPointM = getPointM;
        lrsAPI.findNearestCoordinate = findNearestCoordinate;
        lrsAPI.createTwoPointPolyline = createTwoPointPolyline;

        function getParams(x,y,buff,acc) {
            // get xy, construct webMerc point
            let point = new Point({ //mobile calibration
                type: "point",
                latitude: y,
                longitude: x,
                spatialReference: new SpatialReference({wkid: 102100})
            });
            // let point = new Point({ //desktop calibration
            //     type: "point",
            //     latitude: 29.68013,
            //     longitude: -98.4536,
            //     spatialReference: new SpatialReference({wkid: 102100})
            // });
            return point;
        }

        // Query nearby routes using reprojected point with buffer
        function identRouteForM(point,buff,domNode) {
            lrsAPI.lrs = {};
            let queryTask, query, padding, ctrlSectQuery, roadwaysQuery;
            queryTask = new QueryTask();
            query = new Query({
                returnGeometry: true,
                returnM: true,
                outFields: ["*"],
            });
            // need to convert to number and make sure not zero
            padding = Number(buff); //use this for mobile calibration
            // padding = 10; //use this for desktop calibration
            query.geometry= new Extent({
                "xmin": point.x-padding,
                "ymin": point.y-padding,
                "xmax": point.x+padding,
                "ymax": point.y+padding,
                "spatialReference": point.spatialReference
            });
            queryTask.url = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Control_Sections/FeatureServer/0";
            queryTask.execute(query).then(function(results){
                 lrsAPI.lrs.mpt = getPointM(point,results);
                 dom.byId(domNode).innerHTML += JSON.stringify(lrsAPI.lrs.mpt,null,2);
            });
            // queryTask.execute(query).then(function(results){
            //      lrsAPI.lrs.mpt = results.features[0].attributes;
            //      // alert(JSON.stringify(lrsAPI.lrs.mpt,null,2)); //use for mobile calibration
            // });

            queryTask.url = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Roadways/FeatureServer/0";
            queryTask.execute(query).then(function(results){
                lrsAPI.lrs.dfo = getPointM(point,results);
                dom.byId(domNode).innerHTML += JSON.stringify(lrsAPI.lrs.dfo,null,2);
            });
            // queryTask.execute(query).then(function(results){
            //      lrsAPI.lrs.dfo = results.features[0].attributes;
            //      // alert(JSON.stringify(lrsAPI.lrs.dfo,null,2)); //use for mobile calibration
            // });
            console.log(lrsAPI.lrs);
            // return lrsAPI.lrs;
            // document.getElementById("outputResponse").innerHTML = "Hello There!";
        }

        // Callback function from queryTask in identRouteForM
        // Takes results from REST endpoint call and gets measure for point
        function getPointM(point,gidWithM) {
            // let mapPoint = mapPt;
            var calculatedM = 0;
            let gidWithMeasuresGeom = gidWithM;
            firstIntersectingPoint = findNearestCoordinate(point,gidWithMeasuresGeom);
            var firstIntersectingCoord = geometryEngine.nearestVertex(gidWithMeasuresGeom.features[featurePartIndex].geometry, firstIntersectingPoint);
            var vertexIndex = firstIntersectingCoord.vertexIndex;
            var maxVertex = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0].length-1;

            if (vertexIndex == 0) {
                var coord2 = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex];
                var thePoint2 = new Point([coord2[0],coord2[1]], new SpatialReference({wkid: 3857 }));
                var point2M = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex][2];
                var geoMeterLength = geometryEngine.geodesicLength(createTwoPointPolyline(thePoint2,firstIntersectingPoint), 9001);
                var geoMileValue = ((geoMeterLength/1609.344)*1000)/1000;
                calculatedM = point2M + geoMileValue;
            }

            if (vertexIndex == maxVertex) {
                var coord2 = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex];
                var thePoint2 = new Point([coord2[0],coord2[1]], new SpatialReference({wkid: 3857 }));
                var point2M = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex][2];
                var geoMeterLength = geometryEngine.geodesicLength(createTwoPointPolyline(thePoint2,firstIntersectingPoint), 9001);
                var geoMileValue = ((geoMeterLength/1609.344)*1000)/1000;
                calculatedM = point2M - geoMileValue;
            }

            if (vertexIndex > 0 && vertexIndex < maxVertex) {
                var coord1 = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex-1];
                var coord2 = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex];
                var coord3 = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex+1];

                var thePoint1 = new Point([coord1[0],coord1[1]], new SpatialReference({wkid: 3857 }));
                var thePoint2 = new Point([coord2[0],coord2[1]], new SpatialReference({wkid: 3857 }));
                var thePoint3 = new Point([coord3[0],coord3[1]], new SpatialReference({wkid: 3857 }));

                var firstTestSegment = createTwoPointPolyline(thePoint1,thePoint2);
                var secondTestSegment = createTwoPointPolyline(thePoint2,thePoint3);

                var intersectsFirstSegment = geometryEngine.intersects(firstIntersectingPoint,firstTestSegment)
                var intersectsSecondSegment = geometryEngine.intersects(firstIntersectingPoint,secondTestSegment)
                var calculatedM = 0;

                var point1M = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex-1][2];
                var point2M = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex][2];
                var point3M = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex+1][2];

                var geoMeterLength = geometryEngine.geodesicLength(createTwoPointPolyline(thePoint2,firstIntersectingPoint), 9001);
                var geoMileValue = ((geoMeterLength/1609.344)*1000)/1000;

                if (intersectsFirstSegment) {
                    if (point1M>point2M) {
                        calculatedM = point2M + geoMileValue;
                    }
                    else {
                        calculatedM = point2M - geoMileValue;
                    }
                }
                else {
                    if (point3M>point2M) {
                        calculatedM = point2M + geoMileValue;
                    }
                    else {
                        calculatedM = point2M - geoMileValue;
                    }
                }
            }
            let displayM = Math.round(calculatedM*10000)/10000;
            let displayX = Math.round(firstIntersectingPoint.latitude*100000)/100000;
            let displayY = Math.round(firstIntersectingPoint.longitude*100000)/100000;
            let attr = gidWithMeasuresGeom.features[0].attributes;

            if(attr.ASSET_NM){
                attr.CALC_MPT = displayM;
                attr.LAT = displayX;
                attr.LONG = displayY;
                console.log(attr);
                // alert(JSON.stringify(attr,null,2));
                return attr;
            }
            else {
                attr.CALC_DFO = displayM;
                attr.LAT = displayX;
                attr.LONG = displayY;
                console.log(attr);
                // alert(JSON.stringify(attr,null,2));
                return attr;
            }
        }

        // Gets nearest point on route based on xy ("snaps" to route)
        function findNearestCoordinate(point,gidWithM) {
            let gidWithMeasuresGeom = gidWithM;
            var shortestDistance = 20000;
            var firstIntersectingPoint;
            var firstIntersectingPointTemp;
            featurePartIndex = 0;

            for (var h=0; h < gidWithMeasuresGeom.features.length; h++) {
                firstIntersectingPointTemp = geometryEngine.nearestCoordinate(gidWithMeasuresGeom.features[h].geometry, point);
                if (firstIntersectingPointTemp.distance < shortestDistance) {
                    shortestDistance = firstIntersectingPointTemp.distance;
                    firstIntersectingPoint = firstIntersectingPointTemp;
                    featurePartIndex = h;
                }
            }
            var returnPoint = new Point([firstIntersectingPoint.coordinate.x,firstIntersectingPoint.coordinate.y], new SpatialReference({wkid: 3857 }));
            return returnPoint;
        }

        // Create line to test for ascending or descending measures
        function createTwoPointPolyline(point1, point2) {
            var newPolyline = new Polyline(new SpatialReference({wkid:3857}));
            newPolyline.type = "polyline";
            var tmpAttLine = [];
            tmpAttLine.push(point1);
            tmpAttLine.push(point2);
            newPolyline.addPath(tmpAttLine);
            return newPolyline;
        }
    }
);
