<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$json_data = isset($_GET['json']) ? $_GET['json'] : '';
$p = json_decode($json_data, true);

if (!$p) exit;

function clean($val) { return str_replace(['"', '\\'], '', $val); }

$price = clean($p['price']);
$ref_price = clean($p['reference_price']);
$ref_text = clean($p['reference']);
$name = strtoupper(clean($p['name']));
$barcode = clean($p['barcode']);

$width = "50mm"; 

// 1. CABECERA: Padding lateral cero
$html_header = "<div style='width:$width; background-color:#000; color:#fff; padding:1.5mm 0; font-size:3.5mm; font-weight:bold; text-align:center; box-sizing:border-box;'>" . 
               htmlspecialchars($name) . 
               "</div>";

// 2. PRECIO: Dinámico en mm
$price_len = strlen($price);
// Si es muy largo (>7 caracteres), reducimos el tamaño a 8mm, sino 10mm
$f_size = ($price_len > 7) ? "8mm" : "10mm";

$html_price = "<div style='width:$width; text-align:center; padding:2mm 0; font-size:$f_size; font-weight:900; line-height:1; box-sizing:border-box;'>" . 
              "$" . $price . 
              "</div>";

// 3. FOOTER: Ajuste de tipografía a 3mm (más pequeña)
$html_footer = "<div style='width:$width; border-top:0.4mm solid #000; padding:1mm 0; display:flex; justify-content:space-between; align-items:center; box-sizing:border-box;'>" .
               "<div style='font-size:3mm; font-weight:bold;'>" . $barcode . "</div>" .
               "<div style='font-size:2.8mm; text-align:right;'>" . htmlspecialchars($ref_text) . ": $" . $ref_price . "</div>" .
               "</div>";

$response = [
    "0" => ["type" => 4, "content" => $html_header],
    "1" => ["type" => 4, "content" => $html_price],
    "2" => ["type" => 4, "content" => $html_footer],
    "3" => ["type" => 0, "content" => "\n\n\n", "align" => 1]
];

echo json_encode($response, JSON_FORCE_OBJECT);