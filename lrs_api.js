// GLOBAL FUNCTIONS
//Check if using IE and get version
function isIE() {
    var ua = window.navigator.userAgent;
    return /MSIE|Trident/.test(ua);
}

// GLOBAL VARIABLES
let featurePartIndex;
let firstIntersectingPoint;
let lrs={};

// ESRI JS API MODULES
require([
    // esri config, core, and tasks
    "esri/config",
    "esri/tasks/support/Query",
    "esri/tasks/QueryTask",

    // geometry
    "esri/geometry/Extent",
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
        geometryEngine,
        SpatialReference,
        Point,
        Polyline,
        dom,
        on,
        parser)
    {
        // DEFINE ALL FUNCTIONS FIRST
        // Adding all functions as methods on global window object so they are accessible
        window.getParams = getParams;
        window.identRouteForM = identRouteForM;
        window.getPointM = getPointM;
        window.findNearestCoordinate = findNearestCoordinate;
        window.createTwoPointPolyline = findNearestCoordinate;

        function getParams(x,y,buff,acc){
            let msg = {
                "latitude": y,
                "longitude": x,
                "buffer distance": buff,
                "accuracy": acc
            };
            // Return for debugging, will convert to geometry and call identRouteForM
            return msg;
        }

        // Query nearby routes using xy input with buffer
        function identRouteForM(xyPoint) {

        }

        // Callback function from queryTask in identRouteForM
        // Takes results from REST endpoint call and gets measure for point
        function getPointM(results) {

        }

        // Gets nearest point on route based on xy ("snaps" to route)
        function findNearestCoordinate(xyPoint) {

        }

        // Create line to test for ascending or descending measures
        function createTwoPointPolyline(point1, point2) {

        }
    }
);
