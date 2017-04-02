
///////////////////////////////////////////////////////////////////////////////
// Passive calibration gaze tracking.
// Click the floating coloured circles to pop them; they randomly re-inflate.
// Gaze also pops balloons when calibrated.
///////////////////////////////////////////////////////////////////////////////
var Balloons = {

    complete: false,

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Mouse Listener
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    onMouseUp: function () {
        var x = Mouse.xMouseScreen;
        var y = Mouse.yMouseScreen;

        var doc = xLabs.scr2doc(x, y);
        //console.log( "click@ "+doc.x+","+doc.y );
        Graph.hideCircleAt(doc.x, doc.y, 1.0);
    },

    ///////////////////////////////////////////////////////////////////////////////////////////////////
    // Key events
    ///////////////////////////////////////////////////////////////////////////////////////////////////
    start: function () {
        var updateInterval = 50;
        this.interval_id = setInterval(Balloons.update, updateInterval);

        Graph.create(this.nodes);

        Mouse.mouseUpCallback = Balloons.onMouseUp;

        Graph.show();
    },

    update: function () {

        if (Balloons.complete == true) {
            return;
        }

        // detect win condition:
        var nbrCircles = Graph.getCountCircles();
        var nbrCirclesClicked = Graph.getCountCircleClass("tiny");
        var fractionClicked = (nbrCirclesClicked / nbrCircles);

        // console.log( "frac="+  fractionClicked  );
        if (fractionClicked > 0.75) {
            clearInterval(Balloons.interval_id);
            Balloons.complete = true;
            console.log('you win!')
            Balloons.onwin();

            return;
        }

        // update gaze tracking
        Gaze.update();
        Graph.updateWithoutSelection();//Selection( screen.width * 0.5, screen.height * 0.5 );

        Canvas.clear();
        if (Gaze.available == true) {
            Gaze.paint();
            var doc = xLabs.scr2doc(Gaze.xMeasuredSmoothed, Gaze.yMeasuredSmoothed);
            Graph.hideCircleAt(doc.x, doc.y, 1.2);
        }

        // randomly restore balloons
        var pInflateBalloon = 0.03;
        Graph.showCircleRandom(pInflateBalloon);
    },

    // Setup
    setup: function (onwin, callback) {
        Balloons.onwin = onwin;

        var colours = "js/xlabs_utils/colours_dark.json";
        Graph.setup("balloons", colours, function (error, nodes) {
            if (error)
                throw error;

            Balloons.nodes = nodes;

            callback();
        });
    }

};