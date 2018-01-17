<?php

function filter_sid($sid) {
    return preg_replace('/[^0-9]/', '', $sid);
}

function p_info_filename($sid, $pid) {
    return sprintf(__DIR__ . '/../data/info_%s_p%04d.json', $sid, $pid);
}

function p_data_filename($sid, $pid) {
    if ($pid !== '*') {
        $pid = str_pad($pid, 4, '0', STR_PAD_LEFT);
    }

    $year = substr($sid, 0, 4);
    if ($year === '0000') {
        $year = '';
    }

    return sprintf(__DIR__ . "/../data/$year/${sid}_p$pid.json");
}

function p_error($error) {
    die("{\"status\":\"err: $error\"}");
}
