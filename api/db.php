<?php
require __DIR__ . '/config.php';

function dbConnect(): mysqli
{
    return openDatabase();
}
