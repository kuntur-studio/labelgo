class LocalPrintService {
    constructor() {
        this.bridgeUrl = 'http://localhost:8080';
        this.maxRetries = 3;
    }

    /**
     * Genera una imagen de la etiqueta desde un elemento del DOM
     * @param {string} elementId - ID del contenedor de la etiqueta
     * @returns {Promise<string>} - Base64 de la imagen PNG
     */
    async captureLabelAsImage(elementId) {
        const element = document.getElementById(elementId);
        if (!element) throw new Error('Elemento de etiqueta no encontrado');

        // Usamos html2canvas (ya incluido vía CDN en tu index.html)
        const canvas = await html2canvas(element, {
            scale: 2, // Mejor resolución para impresión térmica
            backgroundColor: '#ffffff',
            logging: false,
            allowTaint: false,
            useCORS: true
        });

        return canvas.toDataURL('image/png');
    }

    /**
     * Envía la imagen al bridge para imprimir
     */
    async printImage(imageBase64) {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                // 1. Verificar salud del bridge
                let response = await this.healthCheck();
                let { printer_ready } = await response.json();

                if (printer_ready) {
                    // 2. Enviar impresión
                    response = await fetch(`${this.bridgeUrl}/print-image`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imagen: imageBase64 }),
                        timeout: 3000
                    });

                    let data = await response.json();
                    let {success} = data;

                    if (!success) {
                        throw new Error(data.error || 'Error en bridge');
                    }

                    console.log('✅ Impresión exitosa');
                    return { success: true };
                }

            } catch (error) {
                console.warn(`Intento ${attempt} falló:`, error.message);
                console.log(imageBase64);
                
                if (attempt === this.maxRetries) {
                    return { 
                        success: false
                    };
                }
                
                // Esperar antes de reintentar (backoff exponencial)
                await this.delay(1000 * Math.pow(2, attempt));
            }
        }
    }

    async healthCheck() {
        try {
            const response = await fetch(`${this.bridgeUrl}/health`, { 
                method: 'GET',
                timeout: 3000 
            });
            return response;
        } catch {
            throw new Error('Bridge no disponible');
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Instancia global única
window.printService = new LocalPrintService();