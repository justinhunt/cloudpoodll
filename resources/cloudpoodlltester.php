<?php

/**
 * Cloud Poodll Tester Page (php)
 *
 *
 *
 * @author Justin Hunt (https://poodll.com)
 */
?>
<?php

$token = fetchToken();

function fetchToken()
{
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_URL => 'https://cloud.poodll.com/login/token.php?username=localhostuser&password=123456789ABCDEF&service=cloud_poodll'
    ));
// Send the request & save response to $resp
    $resp = curl_exec($curl);
    $token="";
    if ($resp) {
        $resp_object = json_decode($resp);
        $token = $resp_object->token;
    }

// Close request to clear up some resources
    curl_close($curl);
    return $token;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CloudPoodllTester</title>
    <script src="https://cdn.jsdelivr.net/gh/justinhunt/cloudpoodll@latest/amd/build/cloudpoodll.min.js" type="text/javascript"></script>

</head>
<body>
--Recorder below here--
<div class="cloudpoodll"
     data-id="recorder1"
     data-localloader="/poodllloader.html"
     data-width="450"
     data-transcode="1"
     data-media="video"
     data-owner="jerry@poodll.com"
     data-height="500"
     data-region="tokyo"
     data-expiredays="180"
     data-parent="http://localhost"
     data-token="<?= $token ?>"></div>

--Recorder above here--
<script type="text/javascript">
CloudPoodll.autoCreateRecorders("cloudpoodll");
CloudPoodll.theCallback=function(thedata){
    console.log(thedata);
    switch (thedata.type){
        case 'error':
            alert('Error: ' + thedata.message);
            break;
        case 'awaitingprocessing':
            console.log('awaitingprocessing:' + thedata);
            break;
        case 'filesubmitted':
            alert('filesubmitted:' + thedata.finalurl);
            console.log('filesubmitted:' + thedata);
            break;
        case 'transcriptioncomplete':
            alert('transcriptioncomplete:' + thedata.transcription);
            break;
    }
};
CloudPoodll.initEvents();
</script>
</body>
</html>