<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$json_data = isset($_GET['json']) ? $_GET['json'] : '';
$p = json_decode($json_data, true);

if (!$p) {
    echo json_encode((object)["0" => ["type" => 0, "content" => "Error de datos"]]);
    exit;
}

$width = "384px";
$font = "font-family: Arial, sans-serif;";

// 1. CABECERA (Nombre del producto)
$html_header = "<div style=\"width:$width; background-color:#222; color:#fff; padding:6px 10px; box-sizing:border-box; $font\">" .
               "<div style=\"font-size:18px; font-weight:900; line-height:1.1; text-align:left; text-transform:uppercase;\">" . 
               htmlspecialchars($p['name']) . 
               "</div></div>";

// 2. PRECIO PRINCIPAL
$price_font_size = (strlen($p['price']) > 7) ? "70px" : "85px";
$html_price = "<div style=\"width:$width; text-align:center; padding:15px 0; box-sizing:border-box; $font\">" .
              "<span style=\"font-size:$price_font_size; font-weight:800; letter-spacing:-2px;\">" .
              "$" . $p['price'] . 
              "</span></div>";

// 3. FOOTER (Código de barras y Referencia DINÁMICA)
$html_footer = "<div style=\"width:$width; display:flex; justify-content:space-between; align-items:flex-end; padding:5px 10px; border-top:1.5px solid #000; box-sizing:border-box; $font\">" .
               "<span style=\"font-size:19px; font-weight:bold;\">" . $p['barcode'] . "</span>" .
               "<span style=\"font-size:17px;\">" . htmlspecialchars($p['reference']) . ": $" . $p['reference_price'] . "</span>" .
               "</div>";

// Definición de la respuesta como array asociativo
$response = [
    "0" => ["type" => 4, "content" => $html_header],
    "1" => ["type" => 4, "content" => $html_price],
    "2" => ["type" => 4, "content" => $html_footer],
    "3" => ["type" => 0, "content" => "\n\n\n", "align" => 1]
];

// JSON_FORCE_OBJECT: garantiza las llaves {}
// JSON_UNESCAPED_SLASHES: evita el escape de </div> (<\/div>) que rompe algunos motores
echo json_encode($response, JSON_FORCE_OBJECT | JSON_UNESCAPED_SLASHES);