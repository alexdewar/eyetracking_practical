<?php

function p_filename($sid, $pid) {
    return sprintf('../data/s%04d_p%04d.json', $sid, $pid);
}

function p_data_filename($pid) {
    return sprintf('../data/participant%04d_data.json', $pid);
}

function p_error($error) {
    die("{\"status\":\"err: $error\"}");
}