$(document).ready(function() {
    // Only enable tooltips if user not on mobile
    function isTouchDevice() {
        return true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
    }
    if (isTouchDevice()===false) {
        $('[data-toggle="tooltip"]').tooltip();
    }
    // Button controls
    $('#getLocBtn').click(function() {
        if (navigator.geolocation) {
            let options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            };
            function success(position) {
                $('#xCoord').val(position.coords.longitude);
                $('#yCoord').val(position.coords.latitude);
                $('#bufferDist').val(Math.trunc(position.coords.accuracy));
                $('#lrsType').val(1);

            }
            function error(err) {
                console.warn(`ERROR(${err.code}): ${err.message}`);
            }
            navigator.geolocation.getCurrentPosition(success, error, options);
        }
        else {
            alert("Geolocation not supported by this browser");
        }
        $(this).blur();
    });
    $('#runQueryBtn').click(function() {
        $('#outputResponse').html(''); //re-setting innerHTML for api to write to
        let theX = $('#xCoord').val();
        let theY = $('#yCoord').val();
        let theBuffer = $('#bufferDist').val();
        let theLRM = $('#lrsType').val();
        let theNode = "outputResponse";
        $(this).blur();
        // CALLING THE API HERE //
        // get params and construct point with appropriate SR
        let thePt = lrsAPI.getParams(theX,theY);
        // take point, buffer, lrs type, and output location (dom node) and calculate Ms
        let routeInfo = lrsAPI.identRouteForM(thePt,theBuffer,theLRM,theNode);

    });
    $('#resetBtn').click(function() {
        $('#xCoord, #yCoord, #bufferDist, #lrsType').val('');
        $('#outputResponse').html(''); //resetting innerHTML for api to write to
        $(this).blur();
    });
    $('#exportBtn').click(function() {
        if (typeof(Storage) !== "undefined") {
            let theOutput = $('#outputResponse').val();
            sessionStorage.setItem(Date.now(), theOutput);
        }
        else {
            alert("Browser does not support web storage");
        }
        $(this).blur();
    });
    $('#outputToggleBtn').click(function() {
        let text = $(this).html();
        if (text == "Show Results") {
            $(this).html("Hide Results");
        }
        else {
            $(this).html("Show Results");
        }

    });
});
