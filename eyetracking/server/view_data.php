<?php
require 'data_common.php';

function nanstd($x, $mean)
{
    $diffs = array();

    for ($i = 0; $i < count($x); $i++) {
        $diffs[$i] = ($mean - $x[$i]) ** 2;
    }

    list($sum, $count) = nansum($diffs);
    return array(sqrt($sum / ($count - 1)), $count);
}

function nanci95($x, $mean)
{
    list($std, $count) = nanstd($x, $mean);
    return 1.96 * $std / sqrt($count);
}

if (isset($_GET['sid'])) {
    $sid = filter_input(INPUT_GET, 'sid', FILTER_SANITIZE_NUMBER_INT);
} else {
    $sid = date('Ymd');
}

$pid = filter_input(INPUT_GET, 'pid', FILTER_SANITIZE_NUMBER_INT);
if ($pid === null) {
    $pid = -1;
}

try {
    $eye_data = get_eye_data($sid, $pid);
} catch (Exception $e) {
    die('Error: ' . $e->getMessage());
}

// sort array by key names
ksort($eye_data);
?><html>
    <head>
        <title>View eye tracking data</title>
        <meta charset='UTF-8'>

        <link rel="stylesheet" type="text/css" href="//fonts.googleapis.com/css?family=Open+Sans" />
        <style>
            html {
                font-family: Open Sans
            }

            h2 {
                text-align: center
            }

            img{
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
        </style>
    </head>
    <body>
        <h2>Eye tracking data for <?=$pid === -1 ? 'all participants' : "participant $pid"?></h2>
        <?php
define('DP',2);
foreach ($eye_data as $key => $value) {
    echo "<h3>$key</h3>\n";
    if (substr($key, 0, strlen('change_blindness')) === 'change_blindness') {
        echo "<a href='../${key}a.jpg'>Image A</a> | <a href='../${key}b.jpg'>Image B</a>\n";
    }

    list($meanx, $count) = nanmean($value['x']);
    echo "<ul><li><i>n</i>: $count</li>\n";

    $meanx = round($meanx, DP);
    echo "<li><i>x</i>: $meanx &plusmn; " .
        round(nanci95($value['x'], $meanx), DP) . "</li>\n";

    $meany = round(nanmean($value['y'])[0], DP);
    echo "<li><i>y</i>: $meany &plusmn; " .
        round(nanci95($value['y'], $meany), DP) . "</li>";

    list($meandur, $durcount) = nanmean($value['duration']);
    if ($durcount === 0) {
        echo "</ul>\n";
        continue;
    }
    $meandur = round($meandur, DP);
    echo "<li><i>duration</i>: $meandur &plusmn; " .
        round(nanci95($value['duration'], $meandur), DP) .
        " (<i>n</i> = $durcount)</li></ul>\n";
}

/* foreach ($pdata['stimuli'] as $stim) {
echo "<img src='img/${stim['name']}.jpg' /> <br>\n";
} */
?>
    </body>
</html>