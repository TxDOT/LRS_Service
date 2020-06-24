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
        function doSomething(msg){
            return msg;
        }
        window.doSomething = doSomething;
        // Query nearby routes using xy input with buffer
        function identRouteForM(xyPoint) {

        }

        // Callback function from queryTask in identRouteForM
        function getSegmentWithDFOs(results) {

        }

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
