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
        lrsAPI.createTwoPointPolyline = createTwoPointPolyline;

        function getParams(x,y,buff,acc) {
            // get xy, construct webMerc point
            let point = new Point({
                type: "point",
                latitude: y,
                longitude: x,
                spatialReference: new SpatialReference({wkid: 102100})
            });
            return point;
        }

        // Query nearby routes using reprojected point with buffer
        function identRouteForM(point,buff) {
            lrsAPI.lrs = {};
            let queryTask, query, padding, gidWithMeasuresGeom, ctrlSectQuery, roadwaysQuery;
            queryTask = new QueryTask();
            query = new Query({
                returnGeometry: true,
                returnM: true,
                outFields: ["*"],
            });
            // need to convert to number and make sure not zero
            padding = Number(buff)/2; //use this for mobile calibration
            // padding = 0.5; //use this for desktop calibration
            query.geometry= new Extent({
                "xmin": point.x-padding,
                "ymin": point.y-padding,
                "xmax": point.x+padding,
                "ymax": point.y+padding,
                "spatialReference": point.spatialReference
            });
            queryTask.url = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Control_Sections/FeatureServer/0";
            // lrsAPI.lrs.mpt = queryTask.execute(query).then(function(results){
            //      return results.features;
            // });
            queryTask.execute(query).then(function(results){
                 lrsAPI.lrs.mpt = results.features[0].attributes;
                 alert(JSON.stringify(lrsAPI.lrs.mpt,null,2));
            });

            queryTask.url = "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Roadways/FeatureServer/0";
            // lrsAPI.lrs.dfo = queryTask.execute(query).then(function(results){
            //     return results.features;
            // });
            queryTask.execute(query).then(function(results){
                 lrsAPI.lrs.dfo = results.features[0].attributes;
                 alert(JSON.stringify(lrsAPI.lrs.dfo,null,2));
            });
            console.log(lrsAPI.lrs);
            return query;
        }

        // Callback function from queryTask in identRouteForM
        // Takes results from REST endpoint call and gets measure for point
        function getPointM(point,gidWithM) {
            // let rt = JSON.stringify(gidWithM.features[0].attributes,null,2);
            // return rt;

        }

        // Gets nearest point on route based on xy ("snaps" to route)
        function findNearestCoordinate(xyPoint) {

        }

        // Create line to test for ascending or descending measures
        function createTwoPointPolyline(point1, point2) {

        }
    }
);
