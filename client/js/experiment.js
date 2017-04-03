var ANTS_GAME_DURATION = 180; // seconds
var IMG_DURATION = 30; // seconds

var XLABS_DEVELOPER_TOKEN = "2bba2616-cf81-4078-85b9-ddd16749abcb";
var KEYPRESS_SKIP = true;

var IMG_FILES = [
    'yarbus',
    'changeblindness1',
    'changeblindness2'
];

var isfullscreen = false;

// different sets of slides for experiment
var intro_slides = [
    text_slide('<p>Welcome to the eye tracking practical.</p> ' +
            '<p>During this experiment, we will track the positions of your eyes using the webcam in front of you.</p> ' +
            '<p>You will first be given some instructions, then you will play a few games to calibrate the eye tracker, then you will perform some data collection.</p> ' +
            '<p>Click next to continue.</p>'),
    text_slide('<p>For the webcam to get a good image, you should checck that there are no external sources of light. ' +
            'You should make sure that your hair is not in your face and if you wear glasses but have only a mild prescription, consider removing them (this is not essential).</p> ' +
            '<p>Most importantly, you should try to keep your head in the same position during both the calibration and testing phases of the experiment.</p>')
];
var balloons_slides = [
    text_slide('<p>First you will play a game to calibrate the eye tracker.</p>' +
            '<p>The aim is to pop balloons by clicking on them. ' +
            'The eye tracker should learn where you are looking and after a while, your gaze should be visible on the screen as a red circle. ' +
            'You can also pop balloons by looking at them.</p>' +
            '<p>Click next to begin.</p>'),
    {
        onstart: balloons_start,
        onend: balloons_end
    }
]
var ants_slides = [
    text_slide('<p>You will now play another game.</p>' +
            '<p>The aim this time is to squash ants by clicking on them with the mouse. ' +
            'As before, if the system is calibrated correctly you should be able to squash them by looking at them.</p>' +
            '<p>Click next to begin.</p>'),
    {
        onstart: ants_start,
        onend: ants_end
    }
];
var img_slides = [
    text_slide('<p>This is now the testing phase of the experiment.</p>' +
            '<p>You will be presented with a series of images...</p>'),
    img_slide('yarbus'),
    img_slide('changeblindness1'),
    img_slide('changeblindness2'),
];

// initialise set of "slides" for experiment
var slides = intro_slides
        .concat(balloons_slides)
        .concat(ants_slides)
        .concat(img_slides)
        .concat([
            text_slide('Experiment completed! Thank you for taking part.')
        ]);

var imgs = []; // array for preloaded images

var xlabs_started = false;

// preload images for image slides
function preload_images(callback) {
    var toload = IMG_FILES.length;

    for (var i in IMG_FILES) {
        var img = new Image();
        imgs.push(img);

        img.onload = function () {
            if (--toload === 0) {
                callback();
            }
        };
        img.src = 'img/' + IMG_FILES[i] + '.jpg';
    }
}

function text_slide(text) {
    return {
        onstart: function () {
            $('.fullscreen').hide();

            // change instruction text
            $('#text')[0].innerHTML = text;

            // make instruction textbox visible
            $('#textbox').show();
        }
    };
}

function img_slide(imfile) {
    return {
        onstart: function () {
            var img = imgs[IMG_FILES.indexOf(imfile)];

            // work out the size and position of image on canvas
            var img_rat = img.width / img.height;
            var canvas_rat = Canvas.element.width / Canvas.element.height;
            if (img_rat > canvas_rat) { // image is *relatively* wider than screen
                var dest_width = Canvas.element.width;
                var dest_height = dest_width / img_rat;
                var dest_left = 0;
                var dest_top = (Canvas.element.height - dest_height) / 2;
            } else { // image is relatively taller than screen
                var dest_height = Canvas.element.height;
                var dest_width = dest_height * img_rat;
                var dest_left = (Canvas.element.width - dest_width) / 2;
                var dest_top = 0;
            }

            $('.fullscreen').hide();

            // draw "slide" image on canvas
            Canvas.clear();
            $('#xLabsAppCanvas').css('background-color', 'black');
            Canvas.context.drawImage(img, dest_left, dest_top, dest_width, dest_height);

            // start timer
            img_timeout = setTimeout(slide_next, IMG_DURATION * 1000);

            // make canvas visible
            Canvas.show();
        },

        onstop: function () {
            clearTimeout(img_timeout)
        }
    };
}

function ants_start() {
    console.log('starting ants game');

    $('.fullscreen').hide();

    Canvas.clear();
    $('#xLabsAppCanvas').css('background-color', 'white');
    Canvas.show();

    ants_timeout = setTimeout(function () {
        ants.run_game = false;
        if (isfullscreen) {
            slide_next();
        }
    }, ANTS_GAME_DURATION * 1000);

    set_canvas_click(function (e) {
        ants.onClick(e);
    });

    ants.run_game = true;
    ants.mainLoop();
}

function ants_end() {
    clearTimeout(ants_timeout);
    ants.run_game = false;
}

function balloons_start() {
    console.log('starting balloons game')

    $('.fullscreen').hide();
    $('#balloons').show();
    Canvas.show();

    Balloons.start();
}

function balloons_end() {
    Balloons.stop();
}

function slide_prev() {
    if (slidei > 0) {
        if (slides[slidei].onend)
            slides[slidei].onend();

        slides[--slidei].onstart();
    }
}

function slide_next() {
    if (slidei < slides.length - 1) {
        if (slidei > 0 && slides[slidei].onend)
            slides[slidei].onend();

        slides[++slidei].onstart();
    } else {
        document.webkitExitFullscreen();
    }
}

function xlabs_start(callback) {
    xlabs_start_callback = callback;
    xLabs.setup(on_xlabs_ready, on_xlabs_update, null, XLABS_DEVELOPER_TOKEN);
}

function on_xlabs_ready() {
    console.log('xlabs ready');
    $(window).on('beforeunload', function () {
        xLabs.setConfig('system.mode', 'off');
    });

    xLabs.setConfig('calibration.clear', '1');
    xLabs.setConfig('system.mode', 'learning');
    xLabs.setConfig('browser.canvas.paintLearning', '0');
}

function on_xlabs_update() {
    var mode = xLabs.getConfig('system.mode');
    if (!xlabs_started && mode !== 'off') {
        xlabs_started = true;
        console.log('xlabs started');
        xlabs_start_callback();
    } else if (mode === 'learning') {
        if (ants.run_game)
            ants.updateGaze();
    }
}

function set_inittext(text) {
    $('#inittext')[0].innerHTML = text;
}

function set_canvas_click(f) {
    $('#xLabsAppCanvas').off('click').click(f);
}

function on_all_started(error) {
    if (error)
        throw error;

    set_inittext("Welcome to the University of Sussex eye tracking practical! " +
            "Click <a href='#' onclick='go_fullscreen();'>here</a> to begin the experiment.");
}

window.onload = function () {
    if (xLabs.extensionVersion() === null) { // no xlabs or not running in chrome
        set_inittext(
                "<h2>Error</h2>" +
                "This webpage must be viewed in Google Chrome " +
                "and <a href='https://chrome.google.com/webstore/detail/xlabs-headeyegaze-tracker/emeeadaoegehllidjmmokeaahobondco?hl=en'>the xLabs Chrome extension</a> must be installed."
                );
        return;
    }

    // actions on entering/exiting fullscreen mode
    $(document).on('webkitfullscreenchange', function () {
        isfullscreen = !isfullscreen;
        if (isfullscreen) {
            console.log('entering fullscreen mode');

            slidei = 0; // reset slide counter (start from beginning)
            slides[0].onstart(); // show first slide
        } else {
            console.log('exiting fullscreen mode');

            if (slides[slidei].onend)
                slides[slidei].onend();

            $('.fullscreen').hide(); // hide all the "fullscreen" elements
        }
    });

    if (KEYPRESS_SKIP) {
        $(document).keypress(function (ev) {
            if (ev.key === ' ')
                slide_next();
        });
    }

    ants = new XLabsAnts();
    ants.init(function ()
    {
        queue()
                .defer(preload_images)
                .defer(Balloons.setup, slide_next)
                .defer(xlabs_start)
                .await(on_all_started);
    });
};

function go_fullscreen() {
    $('#div_fs')[0].webkitRequestFullscreen();
}