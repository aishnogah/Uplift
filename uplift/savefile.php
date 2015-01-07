<?php
	// requires php5
	define('UPLOAD_DIR', 'images/');
	$img = $GLOBALS['HTTP_RAW_POST_DATA'];
	$filteredData=substr($img, strpos($img, ",")+1);
	$data = base64_decode($filteredData);
	$file = UPLOAD_DIR . uniqid() . '.png';
	$success = file_put_contents($file, $data);
	print $success ? $file : 'Unable to save the file.';
?>