<?php

require('../common.php');

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

if (!isset($_POST['data'])) {
    p_error('no data');
}

$pstr = $_POST['data'];

($pdata = json_decode($pstr)) || p_error('bad json');

$fn = p_filename(filter_sid($pdata->sid), (int) $pdata->pid);
if (!file_exists($fn)) {
    p_error('no file');
}

$pinfo = json_decode(file_get_contents($fn));
if ($pdata->code != $pinfo->code) {
    p_error('bad code');
}

$fid = fopen(p_data_filename($pdata->sid, $pdata->pid), 'w');
fwrite($fid, $pstr);
fclose($fid);

echo '{"status":"ok"}';
