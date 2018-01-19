const debug = true;
const remote_url = 'http://users.sussex.ac.uk/~ad374/eyetracking/server';
const keypress_skip = debug;

var date = new Date();
const session_id = debug ? '00000000' : date.getFullYear() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2);

const ants_game_duration = 180; // seconds

const max_cb_duration = 60000; // milliseconds
const cb_tick_duration = 80;
const cb_show_ticks = 3;
const cb_blank_ticks = 1;
const cb_repeats = 2;
const cb_blank_colour = 'lightgray';

const xlabs_developer_token = "2bba2616-cf81-4078-85b9-ddd16749abcb";
const xlabs_camera_res = [800, 600]; // give error if camera res isn't this

const img_files = [
    'ants/frame_squish.png',
    'ants/frame0.gif',
    'ants/frame1.gif',
    'ants/frame2.gif',
    'ants/frame3.gif',
    'yarbus.jpg',
    'change_blindness/1a.jpg',
    'change_blindness/1b.jpg',
    'change_blindness/2a.jpg',
    'change_blindness/2b.jpg',
    'change_blindness/3a.jpg',
    'change_blindness/3b.jpg',
    'change_blindness/4a.jpg',
    'change_blindness/4b.jpg'
];

const yarbus_conditions = [
    'Your task is to estimate the wealth of the family.',
    'Your task is to guess for how long the man in the image has been away.'
];

var imgs = []; // array for preloaded images
var stimuli = [];

var isfullscreen = false;
var testphase = false;
var experiment_finished = false;

const cb_blank_slide = {
    onstart: function () {
        $('.fullscreen').hide();

        $('#xLabsAppCanvas').css('background-color', 'black')
                .css('cursor', 'none');
        Canvas.clear();
        Canvas.show();

        cb_blank_timeout = setTimeout(slide_next, 1500);
    },

    onstop: function () {
        clearTimeout(cb_blank_timeout);
    }
};

const submit_data_slide = {
    onstart: function () {
        // hide previous/next buttons for now
        $('#prev_next').hide();

        set_instruction_text("Submitting data to server...");

        // try to submit data to server
        participant.submit_data(
                function () { //success
                    set_instruction_text("Data submitted to server.<br><br>" +
                            "Experiment completed! Thank you for taking part.");
                    $('#prev_next').show();
                },
                function () { //fail
                    set_instruction_text("Error sending data to server :-(");
                    $('#prev_next').show();
                });
    }
};

// different sets of slides for experiment
const intro_slides = [
    text_slide('<p>Welcome to the eye tracking practical.</p> ' +
            '<p>During this experiment, we will track the positions of your eyes using the webcam in front of you.</p> ' +
            '<p>You will first be given some instructions, then you will play a few games to calibrate the eye tracker, then you will perform some data collection.</p> ' +
            '<p>Click next to continue.</p>'),
    text_slide('<p>For the webcam to get a good image, you should check that there are no external sources of light. ' +
            'You should make sure that your hair is not in your face and if you wear glasses but have only a mild prescription, consider removing them (this is not essential).</p> ' +
            '<p>Most importantly, you should try to keep your head in the same position during both the calibration and testing phases of the experiment.</p>')
];
const check_slides = [
    text_slide('<p>You will now be shown the output of the webcam in order to help you position yourself correctly relative to the webcam.</p>'),
    {
        onstart: check_start,
        onstop: check_end
    }
];
const balloons_slides = [
    text_slide('<p>First you will play a game to calibrate the eye tracker.</p>' +
            '<p>The aim is to pop balloons by clicking on them. ' +
            'The eye tracker should learn where you are looking and after a while, your gaze should be visible on the screen as a red circle. ' +
            'You can also pop balloons by looking at them.</p>' +
            '<p>Click next to begin.</p>'),
    {
        onstart: balloons_start,
        onstop: balloons_end
    }
];
const ants_slides = [
    text_slide('<p>You will now play another game.</p>' +
            '<p>The aim this time is to squash ants by clicking on them with the mouse. ' +
            'As before, if the system is calibrated correctly you should be able to squash them by looking at them.</p>' +
            '<p>Click next to begin.</p>'),
    {
        onstart: ants_start,
        onstop: ants_end
    }
];
const yarbus_slides = [
    yarbus_instructions(),
    {
        onstart: function () {
            testphase = true;
            teststarttime = performance.now();

            slide_next();
        }
    },
    img_slide('yarbus.jpg', 30)
];
const cb_slides = [
    text_slide('<p>You will now do a series of change blindness trials.</p>' +
            '<p>An image will be presented to you (after a delay) and will alternate with a different version of the same image. ' +
            'When you notice the change between the images, press the spacebar to continue to the next trial. ' +
            'If you don\'t notice within 60s, the trial will end automatically.</p>' +
            '<p>Click next to begin.</p>'),
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
const slides = intro_slides
        .concat(check_slides)
        .concat(balloons_slides)
        .concat(ants_slides)
        .concat(yarbus_slides)
        .concat(cb_slides)
        .concat(submit_data_slide);

var imgs = []; // array for preloaded images

var xlabs_started = false;

function set_instruction_text(text) {
    // hide other fullscreen elements
    $('.fullscreen').hide();

    $('#text')[0].innerHTML = text;
    $('#textbox').show();
}

function check_start() {
    $('.fullscreen').hide();

    Check.start();
    $('#xlabs_check').show();
}

function check_end() {
    Check.stop();
    $('#xlabs_check').hide();
}

var participant;
class Participant {
    constructor(pid, code) {
        console.log('participant num: ' + pid);

        this.pid = pid;
        this.code = code;
        this.eye_data = [];

        this.yarbus_condition = Math.round(Math.random() * (yarbus_conditions.length - 1));
        console.log('participant assigned to condition ' + this.yarbus_condition + " ('" + yarbus_conditions[this.yarbus_condition] + "')");
    }

    submit_data(success, fail) {
        console.log('submitting data...');

        var data = JSON.stringify({
            sid: session_id,
            pid: this.pid,
            code: this.code,
            screen: {width: screen.width, height: screen.height},
            stimuli: stimuli,
            yarbus_condition: this.yarbus_condition,
            yarbus_conditions: yarbus_conditions,
            eye_data: this.eye_data});
        $.post(remote_url + '/api/submit_data.php', {data: data},
                function (ret) {
                    if (ret.status === "ok") {
                        console.log("data submitted successfully");
                        success();
                    } else {
                        console.error("error submitting data: " + ret.status)
                        fail();
                    }
                }).fail(fail);
    }

    static create(callback) {
        $.getJSON(remote_url + '/api/get_participant_id.php?sid=' + session_id, function (json) {
            participant = new Participant(json.pid, json.code);
            callback();
        }).fail(function () {
            set_bodyerror("Could not get participant ID from server.")
        });
    }
}

// preload images for image slides
function preload_images(callback) {
    var toload = img_files.length;

    for (var i in img_files) {
        var fn = img_files[i];

        var img = new Image();
        imgs[fn] = img;

        img.onload = function () {
            if (--toload === 0) {
                callback();
            }
        };
        img.src = 'img/' + fn;
    }
}

function text_slide(text) {
    return {
        onstart: function () {
            set_instruction_text(text);
        }
    };
}

function yarbus_instructions() {
    return {
        onstart: function () {
            set_instruction_text('<p>This is now the testing phase of the experiment.</p>' +
                    '<p>You now be shown a scene with a family in.</p>' +
                    '<p>' + yarbus_conditions[participant.yarbus_condition] + '</p>' +
                    '<p>Click next to begin.</p>');
        }
    };
}

function img_slide(fn, duration) {
    return {
        onstart: function () {
            $('.fullscreen').hide();

            var img = imgs[fn];

            var dest = stimuli[img_files.indexOf(fn)].dest;

            // draw "slide" image on canvas
            Canvas.clear();
            $('#xLabsAppCanvas').css('background-color', 'black')
                    .css('cursor', 'none');
            Canvas.context.drawImage(img, dest.left, dest.top, dest.width, dest.height);

            // start timer
            img_timeout = setTimeout(slide_next, duration * 1000);

            participant.eye_data.push({
                t: expt_time(),
                type: 'trial',
                trial: fn
            });

            console.log("starting task: " + fn);

            // make canvas visible
            Canvas.show();
        },

        onstop: function () {
            clearTimeout(img_timeout);
        }
    };
}

var run_cb = false;
function cb_slide(num) {
    return {
        onstart: function () {
            $('.fullscreen').hide();

            console.log("starting task: change blindness #" + num);

            var prefix = 'change_blindness/' + num;

            var cb_imgs = [imgs[prefix + 'a.jpg'], imgs[prefix + 'b.jpg']];

            participant.eye_data.push({
                t: expt_time(),
                type: 'trial',
                trial: prefix
            });

            var dests = [stimuli[img_files.indexOf(prefix + 'a.jpg')].dest,
                stimuli[img_files.indexOf(prefix + 'b.jpg')].dest];

            // draw "slide" image on canvas
            cbs = [$('#cb0'), $('#cb1')];
            for (var i in cbs) {
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
                } else if (++cb_tick === cb_show_ticks) {
                    cb_tick = 0;
                    cb_on_flicker = true;
                    cbs[cb_which_im].hide();
                    cb_which_im = 1 - cb_which_im;
                }
            }, cb_tick_duration);

            cb_timeout = setTimeout(slide_next, max_cb_duration);
        },

        onstop: function () {
            run_cb = false;
            clearInterval(cb_interval);
            clearTimeout(cb_timeout);
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
    }, ants_game_duration * 1000);

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
    console.log('starting balloons game');

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
        if (slides[slidei].onstop)
            slides[slidei].onstop();

        slides[--slidei].onstart();
    }
}

function slide_next() {
    if (slidei < slides.length - 1) {
        if (slidei > 0 && slides[slidei].onstop)
            slides[slidei].onstop();

        slides[++slidei].onstart();
    } else
        on_experiment_end();
}

function on_experiment_end() {
    if (!experiment_finished) {
        experiment_finished = true;

        document.webkitExitFullscreen();

        set_bodytext('Experiment complete. Click <a href="experiment.html">here</a> to start again.');
    }
}

function xlabs_start(callback) {
    xlabs_start_callback = callback;
    xLabs.setup(on_xlabs_ready, on_xlabs_update, null, xlabs_developer_token);
}

function on_xlabs_ready() {
    console.log('xlabs ready');
    $(window).on('beforeunload', function () {
        xLabs.setConfig('system.mode', 'off');
    });

    Check.onXlabsReady();

    if (!debug)
        xLabs.setConfig('calibration.clear', '1');
    xLabs.setConfig('system.mode', 'learning');
    xLabs.setConfig('browser.canvas.paintLearning', '0');
}

function on_xlabs_update() {
    var mode = xLabs.getConfig('system.mode');
    if (!xlabs_started && mode !== 'off') {
        xlabs_started = true;
        console.log('xlabs started');
        var camsz = xLabs.getConfig("frame.stream");
        if (camsz.width == xlabs_camera_res[0] && camsz.height == xlabs_camera_res[1])
            xlabs_start_callback();
        else
            set_bodyerror("xLabs camera resolution is set to " + camsz.width + "x" + camsz.height +
                    " &ndash; should be " + xlabs_camera_res[0] + "x" + xlabs_camera_res[1] + ".");
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

function set_bodytext(text) {
    $('#bodytext')[0].innerHTML = text;
}

function set_bodyerror(err) {
    set_bodytext("<h2>Error</h2>\n" + err);
}

function set_canvas_click(f) {
    $('#xLabsAppCanvas').off('click').click(f);
}

function on_all_started(error) {
    if (error)
        throw error;

    for (var i in img_files) {
        var fn = img_files[i];
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
    set_bodytext("<p>Welcome to the eye tracking practical! " +
            "You are participant number " + participant.pid + ".</p>" +
            "<p>Click <a href='#' onclick='go_fullscreen();'>here</a> to begin the experiment.</p>");
}

window.onload = function () {
    if (debug) {
        console.log("!!! WARNING: RUNNING IN debug MODE !!!");
    }
    console.log('SESSION ID: ' + session_id);

    if (xLabs.extensionVersion() === null) { // no xlabs or not running in chrome
        set_bodyerror("This webpage must be viewed in Google Chrome " +
                "and <a href='https://chrome.google.com/webstore/detail/xlabs-headeyegaze-tracker/emeeadaoegehllidjmmokeaahobondco?hl=en'>the xLabs Chrome extension</a> must be installed.");
        return;
    }

    // actions on entering/exiting fullscreen mode
    $(document).on('webkitfullscreenchange', function () {
        isfullscreen = !isfullscreen;
        if (isfullscreen) {
            console.log('entering fullscreen mode');

            $(document).keypress(function (ev) {
                if (keypress_skip && ev.key === 'n')
                    slide_next();
                else if (run_cb && ev.key === ' ') {
                    participant.eye_data.push({
                        t: expt_time(),
                        type: 'cb_keypress'
                    });
                    slide_next();
                }
            });


            slidei = 0; // reset slide counter (start from beginning)
            slides[0].onstart(); // show first slide
        } else {
            console.log('exiting fullscreen mode');

            if (slides[slidei].onstop)
                slides[slidei].onstop();

            $(document).off('keypress');

            if (testphase) {
                participant.eye_data.push({
                    t: expt_time(),
                    type: 'end'
                });
            }

            $('.fullscreen').hide(); // hide all the "fullscreen" elements
        }
    });

    // run initialisation functions in parallel
    ants = new XLabsAnts();
    queue()
            .defer(Participant.create)
            .defer(preload_images)
            .defer(Balloons.setup, slide_next)
            .defer(xlabs_start)
            .await(on_all_started);
};

function go_fullscreen() {
    $('#div_fs')[0].webkitRequestFullscreen();
}
