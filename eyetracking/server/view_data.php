<?php
require('data_common.php');

function std($x, $mean) {
    $diffs = array();

    for ($i = 0; $i < count($x); $i++) {
        $diffs[$i] = ($mean - $x[$i]) ** 2;
    }

    return sqrt(array_sum($diffs) / (count($diffs) - 1));
}

function ci95($x, $mean) {
    return 1.96 * std($x, $mean) / sqrt(count($x));
}

if (isset($_GET['sid'])) {
    $sid = filter_input(INPUT_GET, 'sid', FILTER_SANITIZE_NUMBER_INT);
} else {
    $sid = date('Ymd');
}

$pid = filter_input(INPUT_GET, 'pid', FILTER_SANITIZE_NUMBER_INT);
if ($pid === NULL) {
    $pid = -1;
}

$eye_data = get_eye_data($sid, $pid);
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
        <h2>Eye tracking data for <?= $pid === -1 ? 'all participants' : "participant $pid" ?></h2>
        <?php
        if (count($eye_data) === 0) {
            echo "No data found for $sid\n";
        }

        foreach ($eye_data as $key => $value) {
            echo "<h3>$key</h3>\n";

            echo "<ul><li><i>n</i>: " . count($value['x']) . "</li>\n";

            $meanx = mean($value['x']);
            echo "<li><i>x</i>: $meanx &plusmn;" . ci95($value['x'], $meanx) . "</li>\n";

            $meany = mean($value['y']);
            echo "<li><i>y</i>: $meany &plusmn;" . ci95($value['y'], $meany) . "</li></ul>\n";
        }

        /* foreach ($pdata['stimuli'] as $stim) {
          echo "<img src='img/${stim['name']}.jpg' /> <br>\n";
          } */
        ?>
    </body>
</html>