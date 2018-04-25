<?php
require('common.php');

function mean($x) {
    return array_sum($x) / count($x);
}

function get_data($fn) {
    $pdata = json_decode(file_get_contents($fn), true);

    $yarbus_cond = $pdata['yarbus_condition'];

    $eye_data = array();
    foreach ($pdata['stimuli'] as $stim) {
        $name = $stim['name'];

        if ($name === 'yarbus') {
            $name .= $yarbus_cond;
        } else {
            $name = substr($name, 0, strlen($name) - 1);
        }

        // size of image stimuli, before and after resizing to fill P's screen
        $eye_data[$name]['src'] = $stim['src'];
        $eye_data[$name]['dest'] = $stim['dest'];
    }

    $ctrial = '';
    foreach ($pdata['eye_data'] as $msg) {
        switch ($msg['type']) {
            case 'trial':
                $ctrial = $msg['trial'];
                if ($ctrial === 'yarbus') {
                    $ctrial .= $yarbus_cond;
                }

                $eye_data[$ctrial]['x'] = array();
                $eye_data[$ctrial]['y'] = array();

                break;
            case 'rec':
                if ($ctrial === '') {
                    continue;
                }

                $conf = (int) $msg['conf'];
                if ($conf === -1 || $conf >= 8) {
                    continue;
                }

                array_push($eye_data[$ctrial]['x'], $msg['x']);
                array_push($eye_data[$ctrial]['y'], $msg['y']);

                break;
            case 'end':
                return $eye_data;
        }
    }

    return $eye_data;
}

function get_eye_data($sid, $pid) {
    if ($pid === -1) {
        $eye_data = array();
    
        foreach (glob(p_data_filename($sid, '*')) as $fn) {
            foreach (get_data($fn) as $key => $value) {
                if (!isset($eye_data[$key])) {
                    $eye_data[$key] = array('x' => array(), 'y' => array());
                }
    
                if (count($value['x']) > 0) {
                    array_push($eye_data[$key]['x'], mean($value['x']));
                    array_push($eye_data[$key]['y'], mean($value['y']));
                }
            }
        }
        return $eye_data;
    }

    $fn = p_data_filename($sid, $pid);
    if (!file_exists($fn)) {
        die("Error: no data found for participant $pid (session: $sid)");
    }

    return get_data($fn);
}
