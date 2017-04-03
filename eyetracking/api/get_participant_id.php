<?php

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

function p_filename($pid) {
    return sprintf('../data/participant%04d.json', $pid);
}

$pid = 1;
while (true) {
    $fn = p_filename($pid);
    if (!file_exists($fn))
        break;

    $pid++;
}

$json = json_encode(array('id' => $pid, 'code' => rand()));

$fid = fopen($fn, 'w');
fwrite($fid, $json);
fclose($fid);

echo $json;
