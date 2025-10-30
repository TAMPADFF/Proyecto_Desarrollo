document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const solicitudId = params.get("id");

    if (!solicitudId) {
        alert("No se encontró la solicitud.");
        return;
    }

    try {
        const response = await fetch(`/solicitud-detalle/${solicitudId}`);
        const solicitud = await response.json();

        if (!response.ok) {
            throw new Error(solicitud.message || "Error al obtener la solicitud");
        }

        // Mostrar los detalles de la solicitud
        const detalleSolicitud = document.getElementById("detalle-solicitud");
        detalleSolicitud.innerHTML = `
            <h3>ID de Solicitud: ${solicitud._id}</h3>
            <p>Categoría: ${solicitud.categoria}</p>
            <p>Descripción: ${solicitud.descripcion}</p>
            <p>Fotos: <img src="/${solicitud.fotos}" alt="Foto del artículo" style="max-width: 100%; height: auto;"></p>
            <p>Valor Propuesto: ${solicitud.valor_propuesto}</p>
            <p>Tiempo (semanas): ${solicitud.tiempo}</p>
        `;

        // Calcular y asignar el porcentaje de avalúo
        const porcentajeAvaluo = obtenerPorcentajeAvaluo(solicitud.categoria);
        document.getElementById("porcentajeAvaluo").value = porcentajeAvaluo; // Sin el signo de '%'

    } catch (error) {
        console.error("Error al cargar los detalles de la solicitud:", error);
        alert("Error al cargar los detalles de la solicitud");
    }

    // Manejar el envío del formulario para aprobar la solicitud
    document.getElementById("evaluacionForm").addEventListener("submit", async function (event) {
        event.preventDefault();

        const valorEvaluado = document.getElementById("valorEvaluado").value;
        const porcentajeAvaluo = document.getElementById("porcentajeAvaluo").value; // Sin el signo de '%'
        const numeroCuotas = document.getElementById("numeroCuotas").value;

        console.log("Enviando datos:", { valorEvaluado, porcentajeAvaluo, numeroCuotas });

        try {
            const response = await fetch(`/aprobar-solicitud/${solicitudId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ valorEvaluado, porcentajeAvaluo, numeroCuotas }),
            });

            const result = await response.json();
            if (response.ok) {
                alert(`Solicitud aprobada. Valor por cuota: ${result.valorCuota}`);
                window.location.href = "/panelAdmin.html";
            } else {
                console.error("Error en la respuesta del servidor:", result);
                alert("Error: " + result.message);
            }
        } catch (error) {
            console.error("Error en el envío:", error);
            alert("Error al aprobar la solicitud");
        }
    });
});

// Función para obtener el porcentaje de avalúo según la categoría
function obtenerPorcentajeAvaluo(categoria) {
    const porcentajes = {
        celular: 30,
        auto: 45,
        joya: 50,
        reloj: 40,
        diamante: 85,
        moneda: 35,
        electronico: 25,
        herramienta: 25,
    };
    return porcentajes[categoria] || 0; // Retorna 0 si la categoría no está definida
}


// Función para rechazar la solicitud
async function rechazarSolicitud() {
    const params = new URLSearchParams(window.location.search);
    const solicitudId = params.get('id');

    if (!solicitudId) {
        alert('No se encontró la solicitud.');
        return;
    }

    try {
        const response = await fetch(`/rechazar-solicitud/${solicitudId}`, {
            method: 'POST'
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            window.location.href = '/panelAdmin.html';
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error al rechazar la solicitud:', error);
        alert('Error al rechazar la solicitud');
    }
}
