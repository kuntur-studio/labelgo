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

// Área imprimible total 50mm
$width = "50mm"; 

$full_html = "<div style='width:$width; font-family:Arial,sans-serif; color:#000; box-sizing:border-box; padding:1mm;'>";
    
    // 1. Cabecera (Nombre): Fondo negro, texto blanco, ocupa ancho completo
    $full_html .= "<div style='background-color:#000; color:#fff; padding:1.5mm; font-size:3.5mm; font-weight:bold; line-height:1.1; word-wrap:break-word; text-align:center;'>" . htmlspecialchars($name) . "</div>";
    
    // 2. Precio: Grande, centrado, tipografía pesada
    $full_html .= "<div style='text-align:center; padding:3mm 0; font-size:10mm; font-weight:900; line-height:1;'>$" . $price . "</div>";
    
    // 3. Footer: Código y Referencia en una línea
    $full_html .= "<div style='border-top:0.4mm solid #000; padding-top:1mm; display:flex; justify-content:space-between; align-items:center;'>";
        $full_html .= "<div style='font-size:3.5mm; font-weight:bold;'>" . $barcode . "</div>";
        $full_html .= "<div style='font-size:3mm;'>" . $ref_text . ": $" . $ref_price . "</div>";
    $full_html .= "</div>";

$full_html .= "</div>";

$response = [
    "0" => ["type" => 4, "content" => $full_html],
    "1" => ["type" => 0, "content" => "\n\n", "align" => 1]
];

echo json_encode($response, JSON_FORCE_OBJECT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);