<?php
require('common.php');

function mean($x) {
    return array_sum($x) / count($x);
}

function std($x, $mean) {
    $diffs = array();

    for ($i = 0; $i < count($x); $i++) {
        $diffs[$i] = ($mean - $x[$i]) ** 2;
    }

    return sqrt(mean($diffs));
}

function ci95($x, $mean) {
    return 1.96 * std($x, $mean) / sqrt(count($x));
}

function get_data($fn) {
    $pdata = json_decode(file_get_contents($fn), true);

    $eye_data = array();
    foreach ($pdata['stimuli'] as $stim) {
        $eye_data[$stim['name']]['src'] = $stim['src'];
        $eye_data[$stim['name']]['dest'] = $stim['dest'];
    }

    $ctrial = '';
    $stop = false;
    foreach ($pdata['eye_data'] as $msg) {
        switch ($msg['type']) {
            case 'trial':
                $ctrial = $msg['trial'];

                $eye_data[$ctrial]['x'] = array();
                $eye_data[$ctrial]['y'] = array();

                break;
            case 'rec':
                if ($ctrial === '') {
                    continue;
                }

                array_push($eye_data[$ctrial]['x'], $msg['x']);
                array_push($eye_data[$ctrial]['y'], $msg['y']);

                break;
            case 'end':
                $stop = true;
                break;
        }

        if ($stop) {
            break;
        }
    }

    return $eye_data;
}

if (isset($_GET['sid'])) {
    $sid = filter_sid($_GET['sid']);
} else {
    $sid = date('Y-m-d');
}

$pid = filter_input(INPUT_GET, 'pid', FILTER_SANITIZE_NUMBER_INT);
if ($pid === NULL) {
    $pid = -1;
}

if ($pid === -1) {
    $eye_data = array();

    foreach (glob(__DIR__ . "/data/s${sid}_p*_data.json") as $fn) {
        foreach (get_data($fn) as $key => $value) {
            if (!isset($eye_data[$key])) {
                $eye_data[$key] = array('x' => array(), 'y' => array());
            }

            array_push($eye_data[$key]['x'], mean($value['x']));
            array_push($eye_data[$key]['y'], mean($value['y']));
        }
    }
} else {
    $fn = p_data_filename($sid, $pid);
    if (!file_exists($fn)) {
        die("Error: no data found for participant $pid (session: $sid)");
    }

    $eye_data = get_data($fn);
}
?><html>
    <head>
        <title>View eye tracking data</title>
        <link rel='shortcut icon' href='img/favicon.ico' type='image/x-icon'>
        <meta charset='UTF-8'>

        <link rel="stylesheet" type="text/css" href="//fonts.googleapis.com/css?family=Open+Sans" />
        <style>
            html {
                font-family: Open Sans
            }

            h2 {
                text-align: center
            }

            img{
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
        </style>
    </head>
    <body>
        <h2>Eye tracking data for <?= $pid === -1 ? 'all participants' : "participant $pid" ?></h2>
        <?php
        foreach ($eye_data as $key => $value) {
            echo "<h3>$key</h3>\n";

            echo "<ul><li><i>n</i>: " . count($value['x']) . "</li>\n";

            $meanx = mean($value['x']);
            echo "<li><i>x</i>: $meanx &plusmn;" . ci95($value['x'], $meanx) . "</li>\n";

            $meany = mean($value['y']);
            echo "<li><i>y</i>: $meany &plusmn;" . ci95($value['y'], $meany) . "</li></ul>\n";
        }

        /* foreach ($pdata['stimuli'] as $stim) {
          echo "<img src='img/${stim['name']}.jpg' /> <br>\n";
          } */
        ?>
    </body>
</html>