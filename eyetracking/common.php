<?php

function p_filename($sid, $pid) {
    return sprintf(__DIR__ . '/data/s%04d_p%04d.json', $sid, $pid);
}

function p_data_filename($sid, $pid) {
    return sprintf(__DIR__ . '/data/s%04d_p%04d_data.json', $sid, $pid);
}

function p_error($error) {
    die("{\"status\":\"err: $error\"}");
}
