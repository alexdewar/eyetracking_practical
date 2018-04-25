<?php
require 'data_common.php';

if (isset($_GET['sid'])) {
    $sid = filter_input(INPUT_GET, 'sid', FILTER_SANITIZE_NUMBER_INT);
} else {
    $sid = date('Ymd');
}

$pid = filter_input(INPUT_GET, 'pid', FILTER_SANITIZE_NUMBER_INT);
if ($pid === null) {
    $pid = -1;
}

$eye_data = get_eye_data($sid, $pid);

header('Content-Type: text/csv');
header("Content-Disposition: inline; filename=$sid.csv");

define('CB_TRIALS', 4);

// write column headings
echo 'cb1_x,cb1_y';
for ($i = 2; $i <= CB_TRIALS; $i++) {
    echo ",cb${i}_x,cb${i}_y";
}
echo "\n";

$pcount = count($eye_data['change_blindness/1']['x']);
for ($i = 0; $i < $pcount; $i++) {
    echo $eye_data['change_blindness/1']['x'][$i] . ',' . $eye_data['change_blindness/1']['y'][$i];
    for ($j = 2; $j <= CB_TRIALS; $j++) {
        echo ',' . $eye_data["change_blindness/$j"]['x'][$i] . ',' . $eye_data["change_blindness/$j"]['y'][$i];
    }
    echo "\n";
}
