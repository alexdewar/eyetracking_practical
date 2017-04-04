<?php

require('common.php');

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$sid = (int) filter_input(INPUT_GET, 'sid', FILTER_SANITIZE_NUMBER_INT);

$pid = 1;
while (true) {
    $fn = p_filename($sid, $pid);
    if (!file_exists($fn)) {
        break;
    }

    $pid++;
}

$json = json_encode(array('pid' => $pid, 'sid' => $sid, 'code' => rand()));

$fid = fopen($fn, 'w');
fwrite($fid, $json);
fclose($fid);

echo $json;
