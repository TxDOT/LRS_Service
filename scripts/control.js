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
        $(this).blur();
        // Call the API here
        let thePt = lrsAPI.getParams(theX,theY,theBuffer);
        let theNode = "outputResponse";
        //need to handle delay (use dojo/all)
        let routeInfo = lrsAPI.identRouteForM(thePt,theBuffer,theNode);

    });
    $('#resetBtn').click(function() {
        $('#xCoord, #yCoord, #bufferDist').val('');
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
