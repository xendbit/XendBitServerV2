<?php
// Payload which is sent to server
$payload = [
    'apikey' => '0npX1NDnPz0hblxKsmNhgWy8Lir60owv',
    'nonce' => time(),
];

// Generation of apiseal
// Please note the PHP_QUERY_RFC3986 enc_type

$q = http_build_query($payload, null, '&', PHP_QUERY_RFC3986);
var_dump($q);

$apiseal = hash_hmac('sha256', http_build_query($payload, null, '&', PHP_QUERY_RFC3986), 'pdQ2MGFpndEXv8K7qRZCkBXoR4Pl91X1');

// Append the generated apiseal to payload
$payload['apiseal'] = $apiseal;

// Set request URL (in this case we check your balance)
$ch = curl_init('https://paxful.com/api/wallet/balance');

// NOTICE that we send the payload as a string instead of POST parameters
$q = http_build_query($payload, null, '&', PHP_QUERY_RFC3986);
var_dump($q);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload, null, '&', PHP_QUERY_RFC3986));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json; version=1',
    'Content-Type: text/plain',
]);

// fetch response
$response = curl_exec($ch);

// convert json response into array
$data = json_decode($response);

var_dump($data);

curl_close($ch);
?>
