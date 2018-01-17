<?php

require('../common.php');

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$sid = filter_sid($_GET['sid']);

$pid = 1;
while (true) {
    $fn = p_info_filename($sid, $pid);
    if (!file_exists($fn)) {
        break;
    }

    $pid++;
}

$json = json_encode(array('pid' => $pid, 'sid' => $sid, 'code' => rand()));

$fid = fopen($fn, 'w');
fwrite($fid, "$json\n");
fclose($fid);

echo $json;
