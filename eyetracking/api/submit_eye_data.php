<?php

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

function p_filename($pid) {
    return sprintf('../data/participant%04d.json', $pid);
}

function p_data_filename($pid) {
    return sprintf('../data/participant%04d_data.json', $pid);
}

function p_error($error) {
    die("{\"status\":\"err: $error\"}");
}

if (!isset($_POST['data'])) {
    p_error('no data');
}

$pstr = $_POST['data'];

$pdata = json_decode($pstr) || p_error('bad json');

$fn = p_filename((int) $pdata->id);
if (!file_exists($fn)) {
    p_error('no file');
}

$pinfo = json_decode(file_get_contents($fn));
if ($pdata->code != $pinfo->code) {
    p_error('bad code');
}

$fid = fopen(p_data_filename($pdata->id), 'w');
fwrite($fid, $pstr);
fclose($fid);

echo '{"status":"ok"}';
