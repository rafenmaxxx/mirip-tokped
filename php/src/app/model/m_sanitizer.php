<?php

function sanitizeRTEInput($input)
{

    $allowed_tags = '<p><b><i><u><strong><em><ul><ol><li><br><a><h1><h2><h3><h4><h5><h6>';
    $input = preg_replace('#<(script|iframe|object|embed|style)[^>]*?>.*?</\1>#is', '', $input);
    $input = preg_replace('/on\w+="[^"]*"/i', '', $input);
    $input = preg_replace('/href="javascript:[^"]*"/i', '', $input);
    $clean = strip_tags($input, $allowed_tags);

    return $clean;
}

function sanitizePlainText($input)
{
    if ($input === null) {
        return null;
    }


    $input = (string)$input;


    $input = strip_tags($input);


    $input = preg_replace('/on\w+="[^"]*"/i', '', $input);
    $input = preg_replace('/javascript:/i', '', $input);


    $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');


    $input = trim($input);

    return $input;
}
