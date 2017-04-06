<?php

function filter_sid($sid) {
    return preg_replace('/[^0-9\-]/', '', $sid);
}

function p_filename($sid, $pid) {
    return sprintf(__DIR__ . '/data/s%s_p%04d_info.json', $sid, $pid);
}

function p_data_filename($sid, $pid) {
    return sprintf(__DIR__ . '/data/s%s_p%04d_data.json', $sid, $pid);
}

function p_error($error) {
    die("{\"status\":\"err: $error\"}");
}
