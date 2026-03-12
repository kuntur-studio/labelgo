<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$json_data = isset($_GET['json']) ? $_GET['json'] : '';
$p = json_decode($json_data, true);

if (!$p) {
    echo json_encode((object)["0" => ["type" => 0, "content" => "Error"]]);
    exit;
}

function clean_data($val) {
    return str_replace(['"', '\\'], '', $val);
}

$price = clean_data($p['price']);
$ref_price = clean_data($p['reference_price']);
$ref_text = clean_data($p['reference']);
$name = strtoupper(clean_data($p['name']));

$width = "384px";
$font = "font-family: Arial, sans-serif;";

// 1. CABECERA - Atributos HTML con comillas simples (')
$html_header = "<div style='width:$width; background-color:#222; color:#fff; padding:8px 10px; box-sizing:border-box; $font'>" .
               "<div style='font-size:19px; font-weight:900; line-height:1.1; text-align:left; text-transform:uppercase;'>" . 
               htmlspecialchars($name) . 
               "</div></div>";

// 2. PRECIO PRINCIPAL
$price_font_size = (strlen($price) > 7) ? "75px" : "90px";
$html_price = "<div style='width:$width; text-align:center; padding:15px 0; box-sizing:border-box; $font'>" .
              "<span style='font-size:$price_font_size; font-weight:800; letter-spacing:-2px;'>" .
              "$" . $price . 
              "</span></div>";

// 3. FOOTER
$html_footer = "<div style='width:$width; border-top:2px solid #000; padding-top:5px; box-sizing:border-box; $font'>" .
               "<table style='width:100%; border-collapse:collapse;'>" .
               "<tr>" .
               "<td style='text-align:left; font-size:20px; font-weight:bold;'>" . clean_data($p['barcode']) . "</td>" .
               "<td style='text-align:right; font-size:18px;'>" . htmlspecialchars($ref_text) . ": $" . $ref_price . "</td>" .
               "</tr>" .
               "</table>" .
               "</div>";

$response = [
    "0" => ["type" => 4, "content" => $html_header],
    "1" => ["type" => 4, "content" => $html_price],
    "2" => ["type" => 4, "content" => $html_footer],
    "3" => ["type" => 0, "content" => "\n\n\n", "align" => 1]
];

//DEBUG

$html_header = "<div style='width:$width; background-color:#222; color:#fff; padding:8px 10px; box-sizing:border-box; $font'>" .
               "<div style='font-size:19px; font-weight:900; line-height:1.1; text-align:left; text-transform:uppercase;'>" . 
               htmlspecialchars($name) . 
               "</div></div>";
$response = [
    "0" => ["type" => 4, "content" => $html_header],
    "1" => ["type" => 0, "content" => "\n\n\n", "align" => 1]
];

// JSON_UNESCAPED_SLASHES para evitar las barras en </div>
echo json_encode($response, JSON_FORCE_OBJECT | JSON_UNESCAPED_SLASHES);