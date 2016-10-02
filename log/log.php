<?php
$file    = "lt-messages.log";
$message = date("Y-m-d H:i:s e") . ' ' . $_GET["msg"] . "\n";
file_put_contents($file, $message, FILE_APPEND | LOCK_EX);
?>
