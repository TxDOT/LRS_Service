// GLOBALS

let lrsAPI = {
    lrs: {}
};
let featurePartIndex;
let gidWithMeasuresGeom;

//Check if using IE and get version
function isIE() {
    let ua = window.navigator.userAgent;
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

        // Attaching functions to global API object so they are accessible outside their scope
        lrsAPI.getParams = getParams;
        lrsAPI.identRouteForM = identRouteForM;
        lrsAPI.getSegmentWithM = getSegmentWithM;
        lrsAPI.getPointM = getPointM;
        lrsAPI.findNearestCoordinate = findNearestCoordinate;
        lrsAPI.createTwoPointPolyline = createTwoPointPolyline;

        // get xy, construct webMerc point
        function getParams(x,y) {

            let point = new Point({ //mobile calibration
                type: "point",
                latitude: y,
                longitude: x,
                spatialReference: new SpatialReference({wkid: 102100})
            });
            return point;
        }

        // Query nearby routes using webMerc point with buffer
        function identRouteForM(point,buff,lrm,domNode) {
            lrsAPI.lrs = {};
            let queryTask, query, padding, ctrlSectQuery, roadwaysQuery;
            queryTask = new QueryTask();
            query = new Query({
                returnGeometry: true,
                returnM: true,
                outFields: ["*"],
            });
            padding = Number(buff);
            query.geometry= new Extent({
                "xmin": point.x-padding,
                "ymin": point.y-padding,
                "xmax": point.x+padding,
                "ymax": point.y+padding,
                "spatialReference": point.spatialReference
            });

            // Check which LRS type to return
            if (lrm == 1) {
                queryTask.url = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Roadways/FeatureServer/0";
                queryTask.execute(query).then(function(results){ //need to add errorback here
                    getSegmentWithM(point,results,lrm,domNode);
                });
            }
            else if (lrm == 2) {
                queryTask.url = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Control_Sections/FeatureServer/0";
                queryTask.execute(query).then(function(results){ //need to add errorback here
                    getSegmentWithM(point,results,lrm,domNode);
                });
            }
            else {
                alert("Choose a LRS type to output (DFO: 1, CSMPT: 2).\nMarker Offset and 'Return All' coming soon!");
            }
        }

        function getSegmentWithM(point,results,lrm,domNode) {

            let xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    // Handle hot IE garbage
                    if (isIE()) {
                        gidWithMeasuresGeom = JSON.parse(xmlhttp.response);
                    }
                    else {
                        gidWithMeasuresGeom = xmlhttp.response;
                    }
                    lrsAPI.lrs = getPointM(point,lrm,results);
                    dom.byId(domNode).innerHTML += JSON.stringify(lrsAPI.lrs,null,2);
                }
            };
            if (lrm == 1) {
                let serviceString = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Roadways/FeatureServer/0";
                let paraString = "/query?f=json&where=GID=" + results.features[0].attributes.GID + "&returnGeometry=true&returnM=true&outSR=102100";
                let queryString = serviceString + paraString;
                xmlhttp.open("GET", queryString, true);
                xmlhttp.responseType = 'json';
                xmlhttp.send();
            }
            if (lrm == 2) {
                let serviceString = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Control_Sections/FeatureServer/0";
                let paraString = "/query?f=json&where=GID=" + results.features[0].attributes.GID + " AND CTRL_SECT_NBR='" + results.features[0].attributes.CTRL_SECT_NBR + "'&returnGeometry=true&returnM=true&outSR=102100";
                let queryString = serviceString + paraString;
                xmlhttp.open("GET", queryString, true);
                xmlhttp.responseType = 'json';
                xmlhttp.send();
            }
        }

        // Callback function from queryTask in identRouteForM
        // Takes results from REST endpoint call and gets measure for point
        // Consolidate this
        function getPointM(point,lrm,results) {
            let attrs = results.features[0].attributes;
            let calculatedM = 0;
            let firstIntersectingPoint = findNearestCoordinate(point);
            let firstIntersectingCoord = geometryEngine.nearestVertex(gidWithMeasuresGeom.features[featurePartIndex].geometry, firstIntersectingPoint);
            let vertexIndex = firstIntersectingCoord.vertexIndex;
            let maxVertex = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0].length-1;

            // Handle beginning of route
            if (vertexIndex == 0) {
                let coord2 = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex];
                let thePoint2 = new Point([coord2[0],coord2[1]], new SpatialReference({wkid: 3857 }));
                let point2M = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex][2];
                let geoMeterLength = geometryEngine.geodesicLength(createTwoPointPolyline(thePoint2,firstIntersectingPoint), 9001);
                let geoMileValue = ((geoMeterLength/1609.344)*1000)/1000;
                calculatedM = point2M + geoMileValue;
            }

            // Handle end of route
            if (vertexIndex == maxVertex) {
                let coord2 = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex];
                let thePoint2 = new Point([coord2[0],coord2[1]], new SpatialReference({wkid: 3857 }));
                let point2M = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex][2];
                let geoMeterLength = geometryEngine.geodesicLength(createTwoPointPolyline(thePoint2,firstIntersectingPoint), 9001);
                let geoMileValue = ((geoMeterLength/1609.344)*1000)/1000;
                calculatedM = point2M - geoMileValue;
            }

            // Handle everything in the middle of route
            if (vertexIndex > 0 && vertexIndex < maxVertex) {
                let coord1 = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex-1];
                let coord2 = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex];
                let coord3 = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex+1];

                let thePoint1 = new Point([coord1[0],coord1[1]], new SpatialReference({wkid: 3857 }));
                let thePoint2 = new Point([coord2[0],coord2[1]], new SpatialReference({wkid: 3857 }));
                let thePoint3 = new Point([coord3[0],coord3[1]], new SpatialReference({wkid: 3857 }));

                let firstTestSegment = createTwoPointPolyline(thePoint1,thePoint2);
                let secondTestSegment = createTwoPointPolyline(thePoint2,thePoint3);

                let intersectsFirstSegment = geometryEngine.intersects(firstIntersectingPoint,firstTestSegment)
                let intersectsSecondSegment = geometryEngine.intersects(firstIntersectingPoint,secondTestSegment)

                let point1M = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex-1][2];
                let point2M = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex][2];
                let point3M = gidWithMeasuresGeom.features[featurePartIndex].geometry.paths[0][vertexIndex+1][2];

                let geoMeterLength = geometryEngine.geodesicLength(createTwoPointPolyline(thePoint2,firstIntersectingPoint), 9001);
                let geoMileValue = ((geoMeterLength/1609.344)*1000)/1000;

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

            // conditionally set attribute values based on lrs type
            if (lrm == 1) {
                attrs.CALC_DFO = displayM;
            }
            else {
                attrs.CALC_MPT = displayM;
            }

            attrs.LAT = displayX;
            attrs.LONG = displayY;
            console.log(attrs);
            return attrs;

        }

        // Gets nearest point on route based on xy ("snaps" to route)
        function findNearestCoordinate(point) {
            let shortestDistance = 20000;
            let firstIntersectingPoint;
            let firstIntersectingPointTemp;
            featurePartIndex = 0;

            for (let h=0; h < gidWithMeasuresGeom.features.length; h++) {
                firstIntersectingPointTemp = geometryEngine.nearestCoordinate(gidWithMeasuresGeom.features[h].geometry, point);
                if (firstIntersectingPointTemp.distance < shortestDistance) {
                    shortestDistance = firstIntersectingPointTemp.distance;
                    firstIntersectingPoint = firstIntersectingPointTemp;
                    featurePartIndex = h;
                }
            }
            let returnPoint = new Point([firstIntersectingPoint.coordinate.x,firstIntersectingPoint.coordinate.y], new SpatialReference({wkid: 3857 }));
            return returnPoint;
        }

        // Create line to test for ascending or descending measures
        function createTwoPointPolyline(point1, point2) {
            let newPolyline = new Polyline(new SpatialReference({wkid:3857}));
            newPolyline.type = "polyline";
            let tmpAttLine = [];
            tmpAttLine.push(point1);
            tmpAttLine.push(point2);
            newPolyline.addPath(tmpAttLine);
            return newPolyline;
        }
    }
);
