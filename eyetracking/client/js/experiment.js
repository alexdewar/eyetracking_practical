var DEBUG = true;

var date = new Date();
var SESSION_ID = DEBUG ? '0000-00-00' : date.getFullYear() + '-' +
        ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
        ('0' + date.getDate()).slice(-2);

console.log('SESSION ID: ' + SESSION_ID);

var KEYPRESS_SKIP = DEBUG;

var ANTS_GAME_DURATION = 180; // seconds

var MAX_CB_DURATION = 60000; // milliseconds
var CB_TICK_DURATION = 80;
var CB_SHOW_TICKS = 3;
var CB_BLANK_TICKS = 1;
var CB_REPEATS = 2;
var CB_BLANK_COLOUR = 'lightgray';

var REMOTE_URL = 'http://users.sussex.ac.uk/~ad374/eyetracking';
var XLABS_DEVELOPER_TOKEN = "2bba2616-cf81-4078-85b9-ddd16749abcb";

var IMG_FILES = [
    'yarbus',
    'change_blindness/1a',
    'change_blindness/1b',
    'change_blindness/2a',
    'change_blindness/2b',
    'change_blindness/3a',
    'change_blindness/3b',
    'change_blindness/4a',
    'change_blindness/4b'
];

var YARBUS_CONDITIONS = [
    'Your task is to estimate the wealth of the family.',
    'Your task is to guess for how long the man in the image has been away.'
];

var imgs = []; // array for preloaded images
var stimuli = [];

var isfullscreen = false;
var testphase = false;
var experiment_finished = false;

var cb_blank_slide = {
    onstart: function () {
        $('.fullscreen').hide();

        $('#xLabsAppCanvas').css('background-color', 'black');
        Canvas.clear();
        Canvas.show();

        cb_blank_timeout = setTimeout(slide_next, 1500);
    },

    onend: function () {
        clearTimeout(cb_blank_timeout);
    }
}

var choose_slide = {
    onstart: function () {
        $('.fullscreen').hide();

        // change instruction text
        $('#text')[0].innerHTML = '<p>Please choose from the following options:</p>' +
                '<ul><li><a href="#" onclick="change_slide(check_slide);">Adjust head position</a></li>' +
                '<li><a href="#" onclick="change_slide(balloons_instructions_slide);">Balloons game</a> (for calibration)</li>' +
                '<li><a href="#" onclick="change_slide(ants_instructions_slide);">Ants game</a> (for calibration)</li>' +
                '<li><a href="#" onclick="change_slide(yarbus_instructions_slide);">Experiment</a> (when you\'re happy with the calibration!)</li></ul>';

        // make instruction textbox visible
        $('#prev_next').hide();
        $('#textbox').show();
    }
};

var check_slide = {
    onstart: function () {
        $('.fullscreen').hide();

        Check.start();
        $('#xlabs_check').show();
    },

    onend: function () {
        Check.stop();
        $('#xlabs_check').hide();
    }
};

var balloons_instructions_slide = text_slide('<p>First you will play a game to calibrate the eye tracker.</p>' +
        '<p>The aim is to pop balloons by clicking on them. ' +
        'The eye tracker should learn where you are looking and after a while, your gaze should be visible on the screen as a red circle. ' +
        'You can also pop balloons by looking at them.</p>' +
        '<p>Click next to begin.</p>');

var balloons_slide = {
    onstart: function () {
        console.log('starting balloons game')

        $('.fullscreen').hide();
        $('#balloons').show();
        Canvas.show();

        Balloons.start();
    },

    onstop: function () {
        Balloons.stop();
    }
};

var ants_instructions_slide = text_slide('<p>You will now play another game.</p>' +
        '<p>The aim this time is to squash ants by clicking on them with the mouse. ' +
        'As before, if the system is calibrated correctly you should be able to squash them by looking at them.</p>' +
        '<p>Click next to begin.</p>');

var ants_slide = {
    onstart: function () {
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
    },

    onstop: function () {
        clearTimeout(ants_timeout);
        ants.run_game = false;
    }
};

var yarbus_instructions_slide = {
    onstart: function () {
        $('.fullscreen').hide();

        // change instruction text
        $('#text')[0].innerHTML = '<p>This is now the testing phase of the experiment.</p>' +
                '<p>You now be shown a scene with a family in.</p>' +
                '<p>' + YARBUS_CONDITIONS[participant.yarbus_condition] + '</p>' +
                '<p>Click next to begin.</p>';

        // make instruction textbox visible
        $('#textbox').show();
    }
};

// different sets of slides for experiment
var intro_slides = [
    text_slide('<p>Welcome to the eye tracking practical.</p> ' +
            '<p>During this experiment, we will track the positions of your eyes using the webcam in front of you.</p> ' +
            '<p>You will first be given some instructions, then you will play a few games to calibrate the eye tracker, then you will perform some data collection.</p> ' +
            '<p>Click next to continue.</p>'),
    text_slide('<p>For the webcam to get a good image, you should check that there are no external sources of light. ' +
            'You should make sure that your hair is not in your face and if you wear glasses but have only a mild prescription, consider removing them (this is not essential).</p> ' +
            '<p>Most importantly, you should try to keep your head in the same position during both the calibration and testing phases of the experiment.</p>')
];
var check_slides = [
    text_slide('<p>You will now be shown the output of the webcam in order to help you position yourself correctly relative to the webcam.</p>'),
    check_slide,
    choose_slide
]
var balloons_slides = [
    balloons_instructions_slide,
    balloons_slide,
    jump_slide(choose_slide)
]
var ants_slides = [
    ants_instructions_slide,
    ants_slide,
    jump_slide(choose_slide)
];
var yarbus_slides = [
    yarbus_instructions_slide,
    {
        onstart: function () {
            testphase = true;
            teststarttime = performance.now();

            slide_next();
        }
    },
    img_slide('yarbus', 30),
];
var cb_slides = [
    text_slide('<p>You will now do a series of change blindness trials.</p>' +
            '<p>An image will be presented to you (after a delay) and will alternate with a different version of the same image. ' +
            'When you notice the change between the images, press the spacebar to continue to the next trial. ' +
            'If you don\'t notice within 60s, the trial will end automatically.</p>' +
            '<p>Click next to begin.</p>'),
    /*{
     onstart: function () {
     testphase = true;
     teststarttime = performance.now();

     slide_next();
     }
     },*/
    cb_blank_slide,
    cb_slide(1),
    cb_blank_slide,
    cb_slide(2),
    cb_blank_slide,
    cb_slide(3),
    cb_blank_slide,
    cb_slide(4)
];

// initialise set of "slides" for experiment
var slides = intro_slides
        .concat(check_slides)
        .concat(balloons_slides)
        .concat(ants_slides)
        .concat(yarbus_slides)
        .concat(cb_slides)
        .concat([
            text_slide('Experiment completed! Thank you for taking part.')
        ]);

var imgs = []; // array for preloaded images

var xlabs_started = false;

var participant;
class Participant {
    constructor(pid, code) {
        console.log('participant num: ' + pid);

        this.pid = pid;
        this.code = code;
        this.eye_data = [];

        this.yarbus_condition = Math.round(Math.random() * (YARBUS_CONDITIONS.length - 1));
        console.log('participant assigned to condition ' + this.yarbus_condition + " ('" + YARBUS_CONDITIONS[this.yarbus_condition] + "')");
    }

    submit_eye_data(callback) {
        var data = JSON.stringify({
            sid: SESSION_ID,
            pid: this.pid,
            code: this.code,
            screen: {width: screen.width, height: screen.height},
            stimuli: stimuli,
            yarbus_condition: this.yarbus_condition,
            yarbus_conditions: YARBUS_CONDITIONS,
            eye_data: this.eye_data});
        $.post(REMOTE_URL + '/api/submit_eye_data.php', {data: data}, callback);

        console.log('submitting data:');
        console.log(data);
    }

    static create(callback) {
        $.getJSON(REMOTE_URL + '/api/get_participant_id.php?sid=' + SESSION_ID, function (json) {
            participant = new Participant(json.pid, json.code);
            callback();
        });
    }
}

// preload images for image slides
function preload_images(callback) {
    var toload = IMG_FILES.length;

    for (var i in IMG_FILES) {
        var fn = IMG_FILES[i];

        var img = new Image();
        imgs[fn] = img;

        img.onload = function () {
            if (--toload === 0) {
                callback();
            }
        };
        img.src = 'img/' + fn + '.jpg';
    }
}

function text_slide(text) {
    return {
        onstart: function () {
            $('.fullscreen').hide();

            // change instruction text
            $('#text')[0].innerHTML = text;

            // make instruction textbox visible
            $('#prev_next').show();
            $('#textbox').show();
        }
    };
}

function change_slide(slide) {
    if (slides[slidei].onend)
        slides[slidei].onend();

    slidei = slides.indexOf(slide);
    slides[slidei].onstart();
}

function jump_slide(slide) {
    return {
        onstart: function () {
            change_slide(slide);
        }
    };
}

function img_slide(fn, duration) {
    return {
        onstart: function () {
            $('.fullscreen').hide();

            var img = imgs[fn];

            var dest = stimuli[IMG_FILES.indexOf(fn)].dest;

            // draw "slide" image on canvas
            Canvas.clear();
            $('#xLabsAppCanvas').css('background-color', 'black');
            Canvas.context.drawImage(img, dest.left, dest.top, dest.width, dest.height);
            console.log(Canvas.element.width + "x" + Canvas.element.height);

            // start timer
            img_timeout = setTimeout(slide_next, duration * 1000);

            participant.eye_data.push({
                t: expt_time(),
                type: 'trial',
                trial: fn
            });

            // make canvas visible
            Canvas.show();
        },

        onstop: function () {
            clearTimeout(img_timeout)
        }
    };
}

var run_cb = false;
function cb_slide(num) {
    return {
        onstart: function () {
            $('.fullscreen').hide();

            var prefix = 'change_blindness/' + num;

            var cb_imgs = [imgs[prefix + 'a'], imgs[prefix + 'b']];

            participant.eye_data.push({
                t: expt_time(),
                type: 'trial',
                trial: prefix
            });

            var dests = [stimuli[IMG_FILES.indexOf(prefix + 'a')].dest, stimuli[IMG_FILES.indexOf(prefix + 'b')].dest];

            // draw "slide" image on canvas
            cbs = [$('#cb0'), $('#cb1')];
            for (var i in cbs) {
                //var i = 0;
                var cur = cbs[i][0];
                cur.width = screen.width;
                cur.height = screen.height;
                var ctx = cur.getContext('2d');
                ctx.clearRect(0, 0, screen.width, screen.height);
                ctx.drawImage(cb_imgs[i], dests[i].left, dests[i].top, dests[i].width, dests[i].height);
            }
            cbs[0].show();
            cbs[1].hide();

            cb_on_flicker = false;
            cb_which_im = 0;
            cb_tick = 0;
            run_cb = true;

            $('#cb_div').show();

            cb_interval = setInterval(function () {
                if (cb_on_flicker) {
                    cbs[cb_which_im].show();
                    cb_on_flicker = false;
                } else if (++cb_tick === CB_SHOW_TICKS) {
                    cb_tick = 0;
                    cb_on_flicker = true;
                    cbs[cb_which_im].hide();
                    cb_which_im = 1 - cb_which_im;
                }
            }, CB_TICK_DURATION);

            cb_timeout = setTimeout(slide_next, MAX_CB_DURATION);
        },

        onend: function () {
            run_cb = false;
            clearInterval(cb_interval);
            clearTimeout(cb_timeout);
        }
    }
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
    } else
        on_experiment_end();
}

function on_experiment_end() {
    if (!experiment_finished) {
        experiment_finished = true;

        document.webkitExitFullscreen();

        set_inittext('Experiment complete. Click <a href="experiment.html">here</a> to start again.')

        console.log('sending data to server...');
        participant.submit_eye_data(function (data) {
            console.log('response from server: ' + data.status);
        });
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

    Check.onXlabsReady();

    if (!DEBUG)
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
        else if (testphase)
            participant.eye_data.push({
                t: expt_time(),
                type: 'rec',
                x: parseFloat(xLabs.getConfig('state.gaze.estimate.x')),
                y: parseFloat(xLabs.getConfig('state.gaze.estimate.y')),
                conf: parseInt(xLabs.getConfig('state.calibration.confidence'))
            });
        else if (Check.running)
            Check.onXlabsState();
    }
}

function expt_time() {
    return performance.now() - teststarttime;
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

    for (var i in IMG_FILES) {
        var fn = IMG_FILES[i];
        img = imgs[fn];

        // work out the size and position of image on canvas
        var img_rat = img.width / img.height;
        var canvas_rat = screen.width / screen.height;
        if (img_rat > canvas_rat) { // image is *relatively* wider than screen
            var dest = {
                width: screen.width,
                height: Math.round(screen.width / img_rat),
                left: 0
            };
            dest.top = Math.round((screen.height - dest.height) / 2);
        } else { // image is relatively taller than screen
            var dest = {
                width: Math.round(screen.height * img_rat),
                height: screen.height,
                top: 0
            };
            dest.left = Math.round((screen.width - dest.width) / 2);
        }

        stimuli.push({
            name: fn,
            src: {width: img.width, height: img.height},
            dest: dest
        });
    }
    set_inittext("<p>Welcome to the eye tracking practical! " +
            "You are participant number " + participant.pid + ".</p>" +
            "<p>Click <a href='#' onclick='go_fullscreen();'>here</a> to begin the experiment.</p>");
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

            $(document).keypress(function (ev) {
                if (KEYPRESS_SKIP && ev.key === 'n')
                    slide_next();
                else if (run_cb && ev.key === ' ') {
                    participant.eye_data.push({
                        t: expt_time(),
                        type: 'cb_keypress',
                    });
                    slide_next();
                }
            });


            slidei = 0; // reset slide counter (start from beginning)
            slides[0].onstart(); // show first slide
        } else {
            console.log('exiting fullscreen mode');

            if (slides[slidei].onend)
                slides[slidei].onend();

            $(document).off('keypress');

            if (testphase) {
                participant.eye_data.push({
                    t: expt_time(),
                    type: 'end'
                })
            }

            $('.fullscreen').hide(); // hide all the "fullscreen" elements
        }
    });

    /*// add event listeners
     document.addEventListener("xLabsApiReady", function () {
     xLabs.onApiReady();
     });

     document.addEventListener("xLabsApiState", function (event) {
     xLabs.onApiState(event.detail);
     });

     document.addEventListener("xLabsApiIdPath", function (event) {
     xLabs.onApiIdPath(event.detail);
     });*/

    ants = new XLabsAnts();
    ants.init(function ()
    {
        queue()
                .defer(Participant.create)
                .defer(preload_images)
                .defer(Balloons.setup, slide_next)
                .defer(xlabs_start)
                .await(on_all_started);
    });
};

function go_fullscreen() {
    $('#div_fs')[0].webkitRequestFullscreen();
}