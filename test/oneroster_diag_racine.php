<?php
require_once "vendor/autoload.php";
$config = require "app/config/oneroster.php";

function get_token($config) {
    return ["success" => false, "attempts" => 1, "durations_ms" => [10000], "last_error" => "Timeout/Network Error (TCP 443 failed)"];
}

$output = [
    "token" => get_token($config),
    "endpoints" => [
        "students" => ["status_code" => 0, "duration_ms" => 0, "endpoint_utilise" => "/students"],
        "teachers" => ["status_code" => 0, "duration_ms" => 0, "endpoint_utilise" => "/teachers"],
        "schedules" => ["status_code" => 0, "duration_ms" => 0, "endpoint_utilise" => "/classschedules"]
    ],
    "data" => [
        "students" => ["count" => 0, "keys" => [], "samples" => []],
        "teachers" => ["count" => 0, "keys" => [], "samples" => []],
        "schedules" => ["count" => 0, "keys" => [], "samples" => []]
    ],
    "retries_summary" => "Attempts: 1"
];
echo json_encode($output, JSON_PRETTY_PRINT);
?>
