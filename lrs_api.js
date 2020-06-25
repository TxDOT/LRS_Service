// GLOBAL FUNCTIONS
let lrsAPI = {
    featurePartIndex:"",
    firstIntersectingPoint:"",
    lrs: {}
};
// GLOBAL VARIABLES
// let featurePartIndex;
// let firstIntersectingPoint;
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
        lrsAPI.createTwoPointPolyline = findNearestCoordinate;

        function getParams(x,y,buff,acc){
            let msg = {
                latitude: y,
                longitude: x,
                buffer: buff,
                accuracy: acc
            };
            let point = new Point({
                type: "point",
                latitude: y,
                longitude: x
            });

            // Project from WGS84 to WebMercator
            projection.load().then(function() {
                let outSR = new SpatialReference({
                    wkid: 102100
                });

                let webmercPoint = projection.project(point, outSR);
                identRouteForM(webmercPoint,buff);
            });
            // Return for debugging, will convert to geometry and call identRouteForM
            return msg;
        }

        // Query nearby routes using reprojected point with buffer
        function identRouteForM(point,buff) {
            lrs = {};
            let queryTask, query, padding, gidWithMeasuresGeom, ctrlSectQuery, roadwaysQuery;
            queryTask = new QueryTask();
            query = query = new Query({
                returnGeometry: true,
                returnM: true,
                outFields: ["*"],
            });
            padding = buff/2;
            query.geometry= new Extent({
                "xmin": point.x-padding,
                "ymin": point.y-padding,
                "xmax": point.x+padding,
                "ymax": point.y+padding,
                "spatialReference": point.spatialReference
            });
            queryTask.url = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Control_Sections/FeatureServer/0";
            console.log(query.geometry);
            queryTask.execute(query).then(function(results){
                lrs.mpt = getPointM(point,results);
            });

            queryTask.url = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Roadways/FeatureServer/0";
            queryTask.execute(query).then(function(results){
                console.log(query.geometry);
                lrs.dfo = getPointM(point,results);
            });
            console.log(lrs);
        }

        // Callback function from queryTask in identRouteForM
        // Takes results from REST endpoint call and gets measure for point
        function getPointM(point,gidWithM) {
            alert(JSON.stringify(gidWithM.features[0].attributes,null,2));
        }

        // Gets nearest point on route based on xy ("snaps" to route)
        function findNearestCoordinate(xyPoint) {

        }

        // Create line to test for ascending or descending measures
        function createTwoPointPolyline(point1, point2) {

        }
    }
);
