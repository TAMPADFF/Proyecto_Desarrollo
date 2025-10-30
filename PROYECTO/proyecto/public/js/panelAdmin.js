document.addEventListener('DOMContentLoaded', async () => {
    // Cargar solicitudes pendientes
    try {
        const response = await fetch('/solicitudes-pendientes');
        const solicitudes = await response.json();
        
        const solicitudesContainer = document.getElementById('solicitudes-pendientes-container');
        solicitudes.forEach(solicitud => {
            const solicitudElement = document.createElement('div');
            solicitudElement.innerHTML = `
                <h3>Solicitud ID: ${solicitud._id}</h3>
                <p>Categoría: ${solicitud.categoria}</p>
                <p>Descripción: ${solicitud.descripcion}</p>
                <p>Valor Propuesto: ${solicitud.valor_propuesto}</p>
                <button onclick="evaluarSolicitud('${solicitud._id}')">Evaluar</button>
            `;
            solicitudesContainer.appendChild(solicitudElement);
        });
    } catch (error) {
        console.error('Error al cargar las solicitudes pendientes:', error);
    }
});

// Función para redirigir a la página de evaluación
function evaluarSolicitud(id) {
    window.location.href = `/evaluacion-solicitud.html?id=${id}`;
}
