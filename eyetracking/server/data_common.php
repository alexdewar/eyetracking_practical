<?php
require 'common.php';

function nansum($x)
{
    $sum = 0;
    $count = 0;
    foreach ($x as $i) {
        if (!is_nan($i)) {
            $sum += $i;
            $count++;
        }
    }
    return $count === 0 ? array(NAN, 0) : array($sum, $count);
}

function nanmean($x)
{
    $arr = nansum($x);
    return $arr[1] === 0 ? $arr : array($arr[0] / $arr[1], $arr[1]);
}

function get_data($fn)
{
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
    $startt = NAN;
    foreach ($pdata['eye_data'] as $msg) {
        switch ($msg['type']) {
            case 'trial':
                $ctrial = $msg['trial'];
                if ($ctrial === 'yarbus') {
                    $ctrial .= $yarbus_cond;
                }

                $eye_data[$ctrial]['x'] = array();
                $eye_data[$ctrial]['y'] = array();
                $startt = (float) $msg['t'];
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
            case 'cb_keypress':
                $endt = (float) $msg['t'];
                $eye_data[$ctrial]['duration'] = $endt - $startt;
                break;
            case 'end':
                return $eye_data;
        }
    }

    return $eye_data;
}

function get_eye_data($sid, $pid)
{
    if ($pid === -1) {
        $eye_data = array();

        foreach (glob(p_data_filename($sid, '*')) as $fn) {
            foreach (get_data($fn) as $key => $value) {
                if (!isset($eye_data[$key])) {
                    $eye_data[$key] = array('x' => array(), 'y' => array(),
                        'duration' => array());
                }

                if (!isset($value['x'])) {
                    array_push($eye_data[$key]['x'], NAN);
                    array_push($eye_data[$key]['y'], NAN);
                    continue;
                }
                array_push($eye_data[$key]['x'], nanmean($value['x'])[0]);
                array_push($eye_data[$key]['y'], nanmean($value['y'])[0]);
                array_push($eye_data[$key]['duration'],
                    isset($value['duration']) ? $value['duration'] : NAN);
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
