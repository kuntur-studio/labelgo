<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Recibimos el objeto producto crudo desde la PWA
$json_data = isset($_GET['json']) ? $_GET['json'] : '';
$p = json_decode($json_data, true);

if (!$p) {
    echo json_encode(["0" => ["type" => 0, "content" => "Error: Datos vacíos"]]);
    exit;
}

// Configuración para 58mm (384px de ancho)
$width = "384px";
$font = "font-family: 'Helvetica', 'Arial', sans-serif;";

// 1. CABECERA (Gris oscuro/Negro) - Soporta hasta 3 líneas para nombres de 60 caracteres
$html_header = "
<div style='width: $width; background-color: #222; color: #fff; padding: 6px 10px; box-sizing: border-box; $font'>
    <div style='font-size: 18px; font-weight: 900; line-height: 1.1; text-align: left; text-transform: uppercase;'>
        " . htmlspecialchars($p['name']) . "
    </div>
</div>";

// 2. PRECIO (Cuerpo) - Ajuste dinámico para precios largos
$price_font_size = (strlen($p['price']) > 7) ? "70px" : "85px";
$html_price = "
<div style='width: $width; text-align: center; padding: 15px 0; box-sizing: border-box; $font'>
    <span style='font-size: $price_font_size; font-weight: 800; letter-spacing: -2px;'>
        $" . $p['price'] . "
    </span>
</div>";

// 3. FOOTER (Extremos) - Código y Referencia
$html_footer = "
<div style='width: $width; display: flex; justify-content: space-between; align-items: flex-end; padding: 5px 10px; border-top: 1.5px solid #000; box-sizing: border-box; $font'>
    <span style='font-size: 19px; font-weight: bold;'>" . $p['barcode'] . "</span>
    <span style='font-size: 17px;'>Ref.x 100g: $" . $p['reference_price'] . "</span>
</div>";

// Generamos el JSON para el bridge Thermer
$response = [
    "0" => ["type" => 4, "content" => $html_header],
    "1" => ["type" => 4, "content" => $html_price],
    "2" => ["type" => 4, "content" => $html_footer],
    "3" => ["type" => 0, "content" => "\n\n\n", "align" => 1] // Espacio de corte
];

echo json_encode($response, JSON_FORCE_OBJECT);