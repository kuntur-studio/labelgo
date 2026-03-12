<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$json_data = isset($_GET['json']) ? $_GET['json'] : '';
$p = json_decode($json_data, true);

if (!$p) {
    echo json_encode(["0" => ["type" => 0, "content" => "Error: Datos vacíos"]]);
    exit;
}

// Configuración para 58mm -> Usamos 56mm para margen de seguridad físico
$width = "56mm";
$font = "font-family: Arial, sans-serif;";

// 1. CABECERA
$html_header = "
<div style='width: $width; background-color: #000; color: #fff; padding: 2mm 3mm; box-sizing: border-box; $font'>
    <div style='font-size: 5mm; font-weight: 900; line-height: 1.1; text-align: left; text-transform: uppercase;'>
        " . htmlspecialchars($p['name']) . "
    </div>
</div>";

// 2. PRECIO
// Usamos mm en lugar de px para que el tamaño sea real en el papel
$price_font_size = (strlen($p['price']) > 7) ? "20mm" : "25mm";
$html_price = "
<div style='width: $width; text-align: center; padding: 4mm 0; box-sizing: border-box; $font'>
    <span style='font-size: $price_font_size; font-weight: 800; letter-spacing: -0.5mm;'>
        $" . $p['price'] . "
    </span>
</div>";

// 3. FOOTER
$html_footer = "
<div style='width: $width; display: flex; justify-content: space-between; align-items: flex-end; padding: 1mm 3mm; border-top: 0.5mm solid #000; box-sizing: border-box; $font'>
    <span style='font-size: 5mm; font-weight: bold;'>" . $p['barcode'] . "</span>
    <span style='font-size: 4mm;'>" . htmlspecialchars($p['reference']) . ": $" . $p['reference_price'] . "</span>
</div>";

// JSON_UNESCAPED_SLASHES para que el HTML no se ensucie con barras invertidas
$response = [
    "0" => ["type" => 4, "content" => $html_header],
    "1" => ["type" => 4, "content" => $html_price],
    "2" => ["type" => 4, "content" => $html_footer],
    "3" => ["type" => 0, "content" => "\n\n", "align" => 1]
];

echo json_encode($response, JSON_FORCE_OBJECT | JSON_UNESCAPED_SLASHES);