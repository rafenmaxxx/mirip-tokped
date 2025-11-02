<?php
function compressImage($source, $destination, $ext, $quality = 75)
{
    $ext = strtolower($ext);

    switch ($ext) {
        case 'jpeg':
        case 'jpg':
            $image = imagecreatefromjpeg($source);
            if (!$image) return false;
            imagejpeg($image, $destination, $quality);
            imagedestroy($image);
            return true;

        case 'png':
            $image = imagecreatefrompng($source);
            if (!$image) return false;
            // Untuk PNG, skala kompresi 0–9 (dibalik: 9 paling kecil, 0 tanpa kompresi)
            $pngQuality = 9 - floor(($quality / 100) * 9);
            imagepng($image, $destination, $pngQuality);
            imagedestroy($image);
            return true;

        default:
            // format tidak didukung
            return move_uploaded_file($source, $destination);
    }
}
