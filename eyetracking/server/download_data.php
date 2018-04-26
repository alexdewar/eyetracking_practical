<?php
require 'data_common.php';

$iscli = php_sapi_name() === 'cli';
if ($iscli) {
    $nargs = count($argv);
    $pid = $nargs < 3 ? -1 : $argv[2];
    $sid = $nargs == 1 ? date('Ymd') : $argv[1];
} else {
    if (isset($_GET['sid'])) {
        $sid = filter_input(INPUT_GET, 'sid', FILTER_SANITIZE_NUMBER_INT);
    } else {
        $sid = date('Ymd');
    }

    $pid = filter_input(INPUT_GET, 'pid', FILTER_SANITIZE_NUMBER_INT);
    if ($pid === null) {
        $pid = -1;
    }
}

try {
    $eye_data = get_eye_data($sid, $pid);
} catch (Exception $e) {
    if ($iscli) {
        echo 'Error: ' . $e->getMessage() . "\n";
    } else {
        http_response_code(404);
    }
    exit;
}

header('Content-Type: text/csv');
header("Content-Disposition: inline; filename=$sid.csv");

define('CB_TRIALS', 4);

// write column headings
echo 'cb1_x,cb1_y,cb1_duration';
for ($i = 2; $i <= CB_TRIALS; $i++) {
    echo ",cb${i}_x,cb${i}_y,cb${i}_duration";
}
echo "\n";

$pcount = count($eye_data['change_blindness/1']['x']);
for ($i = 0; $i < $pcount; $i++) {
    echo $eye_data['change_blindness/1']['x'][$i] . ',' .
        $eye_data['change_blindness/1']['y'][$i] . ',' .
        $eye_data['change_blindness/1']['duration'][$i];
    for ($j = 2; $j <= CB_TRIALS; $j++) {
        $datum = $eye_data["change_blindness/$j"];
        echo ',' . $datum['x'][$i] . ',' .
            $datum['y'][$i] . ',' .
            $datum['duration'][$i];
    }
    echo "\n";
}
