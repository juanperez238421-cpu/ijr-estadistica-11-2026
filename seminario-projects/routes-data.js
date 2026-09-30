window.PROJECT_ROUTES = {
  "animation": {
    "title": "Animación: flores, corazón, fondo y texto",
    "summary": "Cuatro clases para construir un mensaje animado en Python. La forma visual es configurable; el motor, las pruebas y la entrega son parte del mismo producto.",
    "resources": [
      [
        "Ejemplo ejecutable y notebook",
        "https://github.com/juanperez238421-cpu/IJR---Seminario/tree/main/t3/projects/python-message-animation"
      ],
      [
        "Theory + Workshop de Rico",
        "https://rlfxnjbqxbozjdzkbwlz.supabase.co/functions/v1/seminar-t3-host/projects/student-workshops/rico-paramo/index.html"
      ]
    ],
    "stages": [
      {
        "title": "1 · Inicio funcional y contrato",
        "theory": [
          "Un storyboard define qué aparece, en qué orden y con qué duración. Los criterios deben ser observables: ventana abierta, fondo visible, mensaje legible y cierre controlado.",
          "Separa configuración, escena y renderizado. La primera entrega es una animación mínima ejecutable."
        ],
        "build": [
          "Dibuja un storyboard de fondo → corazón → flores → texto. Fija duración, resolución, colores y texto.",
          "Descarga el ejemplo de mensaje animado, lee su README y ejecuta run.py con las dependencias de requirements.txt.",
          "Crea un commit con la primera escena y un diagrama de responsabilidades."
        ],
        "test": [
          "Ejecuta desde cero; verifica inicio, primer cuadro y cierre.",
          "Comprueba que el texto cabe en pantalla y registra el resultado esperado y obtenido."
        ],
        "evidence": "Storyboard, criterios de aceptación, UML y captura de la primera ejecución.",
        "gate": "La escena mínima inicia y termina; cada criterio tiene una prueba.",
        "code": "python -m pip install -r requirements.txt\npython run.py"
      },
      {
        "title": "2 · Motor y efectos reutilizables",
        "theory": [
          "El tiempo de animación depende de segundos transcurridos, no del número de cuadros. update(dt) cambia el estado; draw() lo representa.",
          "Flor, corazón y texto tienen responsabilidades distintas. Los parámetros controlan tamaño, color, posición y duración; una seed permite repetir la escena."
        ],
        "build": [
          "Implementa al menos tres efectos reutilizables: corazón pulsante, flores y aparición de texto.",
          "Integra el fondo sin bloquear el bucle de eventos. Expón parámetros en configuración.",
          "Cambia un parámetro sin reescribir el motor."
        ],
        "test": [
          "Compara la duración de la misma escena a 30 y 120 FPS con una tolerancia declarada antes de medir.",
          "Prueba texto largo, número mínimo de flores y la misma seed dos veces."
        ],
        "evidence": "Código, configuración, comparación temporal y video de la escena completa.",
        "gate": "Los tres efectos funcionan juntos y un cambio de parámetro produce un resultado predecible.",
        "code": ""
      },
      {
        "title": "3 · Portabilidad y entrega USB",
        "theory": [
          "Las rutas se resuelven desde el proyecto o paquete, no desde una carpeta absoluta del equipo del autor.",
          "La entrega incluye recursos, configuración, instrucciones y un launcher manual visible. El usuario inicia la animación."
        ],
        "build": [
          "Aplica la guía usb/ del ejemplo para crear el paquete de Windows.",
          "Incluye README, recursos y configuración en una carpeta portable.",
          "Copia la entrega a USB o a otra carpeta y ejecútala desde allí."
        ],
        "test": [
          "Desconecta la red y ejecuta en el equipo de destino. Registra sistema y dependencias necesarias.",
          "Mueve la carpeta; verifica espacios en la ruta y el comportamiento ante un recurso ausente."
        ],
        "evidence": "Carpeta de entrega, instrucciones y registro de prueba offline en el destino.",
        "gate": "La animación se inicia desde el launcher y no depende de la ubicación original.",
        "code": ""
      },
      {
        "title": "4 · QA y defensa en vivo",
        "theory": [
          "Una prueba de regresión repite el escenario que falló después de corregirlo. El video por sí solo no demuestra portabilidad ni calidad.",
          "La defensa conecta contrato, diseño, implementación y resultados."
        ],
        "build": [
          "Construye una matriz: inicio, cierre, texto largo, recurso ausente, configuración inválida, carpeta movida y ejecución offline.",
          "Reproduce un fallo, corrígelo y repite la misma prueba.",
          "Entrega README, UML final, repositorio y build; cambia color o mensaje durante la defensa."
        ],
        "test": [
          "Ejecuta la matriz en la versión final e identifica los casos que no pudiste comprobar.",
          "Repite los tests del ejemplo desde su carpeta raíz."
        ],
        "evidence": "Matriz con esperado/obtenido, evidencia del fallo y corrección, commit final y demostración.",
        "gate": "Todos los criterios del contrato están verificados o sus limitaciones están documentadas.",
        "code": "python -m unittest discover -s tests"
      }
    ]
  },
  "cad": {
    "title": "CAD paramétrico e impresión 3D",
    "summary": "Cuatro clases para convertir una necesidad en una pieza funcional, editable, fabricable y validada. El objeto y sus medidas deben confirmarse con el docente.",
    "resources": [
      [
        "Guía de inicio de Autodesk Fusion",
        "https://rlfxnjbqxbozjdzkbwlz.supabase.co/functions/v1/seminar-t3-host/tracks/3d-programming/index.html"
      ]
    ],
    "stages": [
      {
        "title": "1 · Necesidad, medidas y primer modelo",
        "theory": [
          "CAD paramétrico representa intención mediante cotas, restricciones y operaciones. El boceto debe definir una función y sus dimensiones críticas.",
          "Un soporte de escritorio es un ejemplo inicial; el producto individual se confirma antes de construir."
        ],
        "build": [
          "Define usuario, función, carga de uso y restricciones de espacio. Mide el objeto que debe encajar.",
          "Crea una tabla de parámetros en milímetros: ancho, alto, espesor y holgura.",
          "En Fusion, crea un boceto restringido y extruye el volumen inicial."
        ],
        "test": [
          "Verifica unidades y cotas contra las mediciones.",
          "Cambia el ancho y comprueba que el modelo se regenera sin errores."
        ],
        "evidence": "Croquis acotado, tabla de parámetros, captura del boceto y archivo nativo.",
        "gate": "El objeto tiene función definida y el modelo inicial cambia mediante parámetros.",
        "code": ""
      },
      {
        "title": "2 · Geometría funcional y diseño reutilizable",
        "theory": [
          "El historial de operaciones explica cómo se construye la pieza. Las restricciones deben conservar relaciones al cambiar medidas.",
          "Holgura y espesor se eligen para el material y proceso reales; no hay un valor universal válido para todas las impresoras."
        ],
        "build": [
          "Añade los elementos funcionales: alojamiento, apoyo, orificios o nervaduras según el contrato.",
          "Nombra parámetros y operaciones. Evita cotas duplicadas o geometría sin restricción.",
          "Documenta tres variantes cambiando parámetros."
        ],
        "test": [
          "Revisa interferencias, espesores y acceso a los elementos de montaje.",
          "Regenera las tres variantes y verifica las dimensiones críticas."
        ],
        "evidence": "Archivo editable, historial de operaciones y comparación de variantes.",
        "gate": "Las variantes se regeneran y cumplen función y dimensiones del contrato.",
        "code": ""
      },
      {
        "title": "3 · Preparación y fabricación",
        "theory": [
          "El archivo nativo conserva la intención; STL o 3MF representa la geometría para fabricación. El laminador transforma esa geometría en trayectorias.",
          "Orientación, soportes, altura de capa y material afectan ajuste, resistencia y tiempo. Los valores se documentan para la máquina elegida."
        ],
        "build": [
          "Exporta la pieza e impórtala en el laminador de la impresora disponible.",
          "Confirma escala en mm, orientación y perfil de máquina/material. Inspecciona la vista por capas.",
          "Imprime primero una probeta de ajuste si hay encajes; registra parámetros y después fabrica la pieza."
        ],
        "test": [
          "Comprueba dimensiones en el laminador y ausencia de capas o paredes inesperadas.",
          "Compara el encaje de la probeta con la holgura prevista antes de imprimir la pieza completa."
        ],
        "evidence": "Modelo nativo, STL/3MF, capturas de capas y ficha de fabricación.",
        "gate": "El archivo es fabricable y la prueba de ajuste justifica la configuración. Sin impresora, registra fabricación pendiente.",
        "code": ""
      },
      {
        "title": "4 · Medición, iteración y defensa",
        "theory": [
          "La validación compara medidas y función del producto físico con el contrato. Una imagen de render no demuestra fabricación.",
          "La iteración modifica un parámetro por una razón medible y conserva las versiones."
        ],
        "build": [
          "Mide dimensiones críticas con el instrumento disponible y registra resolución.",
          "Prueba la función con el objeto real. Identifica un defecto y ajusta el modelo.",
          "Entrega versiones antes/después, plano, archivos nativo y de fabricación e instrucciones de uso."
        ],
        "test": [
          "Compara medida nominal y real; calcula desviación y verifica la tolerancia acordada.",
          "Repite el ensayo funcional después del cambio. Si solo hay simulación, identifica qué falta validar físicamente."
        ],
        "evidence": "Tabla de medidas, fotos, prueba funcional, iteración y defensa del historial.",
        "gate": "El producto cumple los criterios medidos; la fabricación pendiente se declara como pendiente, no aprobada.",
        "code": ""
      }
    ]
  },
  "cyber": {
    "title": "Ciberseguridad: laboratorio defensivo",
    "summary": "Cuatro clases para reproducir un caso en un entorno local autorizado, implementar una defensa y demostrar su efecto con pruebas comparables. Conserva el alcance individual: resiliencia web para Arango; el activo de los proyectos por definir requiere confirmación.",
    "resources": [
      [
        "Biblioteca de casos defensivos",
        "https://rlfxnjbqxbozjdzkbwlz.supabase.co/functions/v1/seminar-t3-host/projects/cyber-cases/index.html"
      ],
      [
        "Laboratorio local y código",
        "https://github.com/juanperez238421-cpu/IJR---Seminario/tree/main/t3/tracks/cybersecurity/lab"
      ]
    ],
    "stages": [
      {
        "title": "1 · Alcance y línea base",
        "theory": [
          "Activo, amenaza, control y evidencia forman un modelo de defensa. Define éxito para peticiones legítimas y para el escenario de abuso.",
          "Trabaja con el laboratorio local provisto. Los casos disponibles son resiliencia HTTP, abuso de autenticación, control de acceso y XSS almacenado."
        ],
        "build": [
          "Elige el caso que corresponde al proyecto y documenta activo, amenaza y criterio de éxito.",
          "Descarga el laboratorio, lee README.md y revisa docker-compose.yml para identificar puertos y servicios.",
          "Inicia el entorno y conserva configuración y línea base."
        ],
        "test": [
          "Verifica que los servicios arrancan y una petición legítima funciona.",
          "Registra código HTTP, latencia, fecha y condición de prueba; elimina secretos de las evidencias."
        ],
        "evidence": "Diagrama del entorno, alcance autorizado, configuración y registro de línea base.",
        "gate": "El entorno local funciona y la condición de prueba es reproducible.",
        "code": "docker compose config\ndocker compose up -d\ndocker compose ps"
      },
      {
        "title": "2 · Reproducir y explicar el caso",
        "theory": [
          "Un hallazgo debe enlazar entrada, comportamiento observado y causa. Un error aislado no demuestra una vulnerabilidad.",
          "Para resiliencia, mide también disponibilidad del tráfico legítimo; para autorización, prueba acceso permitido y denegado."
        ],
        "build": [
          "Sigue el caso correspondiente de la biblioteca, usando exclusivamente el entorno local.",
          "Inspecciona la petición, HTML, código del servicio y logs para localizar el control ausente.",
          "Fija entrada, duración y condiciones; registra una ejecución previa a la defensa."
        ],
        "test": [
          "Comprueba que el caso produce el comportamiento descrito y que puedes repetirlo.",
          "Añade una prueba legítima de control con la misma configuración."
        ],
        "evidence": "Petición o fixture, logs saneados, resultado previo y explicación de la causa.",
        "gate": "La evidencia distingue el caso de abuso de una petición legítima y permite reproducirlo.",
        "code": "docker compose logs --tail=100"
      },
      {
        "title": "3 · Implementar la defensa",
        "theory": [
          "El control se aplica en la capa que decide: límites en proxy/servicio, autorización por recurso, validación de entrada y salida segura según el caso.",
          "La defensa debe reducir el abuso conservando el comportamiento legítimo. Cambia una condición a la vez para atribuir el resultado."
        ],
        "build": [
          "Implementa el control del caso elegido y documenta el archivo y la decisión técnica.",
          "Reinicia o reconstruye los servicios afectados siguiendo el README.",
          "Repite exactamente el escenario anterior y una petición legítima."
        ],
        "test": [
          "Compara los mismos indicadores antes y después.",
          "Prueba un caso límite y comprueba que no se bloquea el usuario legítimo."
        ],
        "evidence": "Diff/commit, configuración y tabla antes/después con las mismas condiciones.",
        "gate": "La defensa controla el caso y las pruebas legítimas siguen pasando.",
        "code": ""
      },
      {
        "title": "4 · Regresión y defensa técnica",
        "theory": [
          "Una defensa se evalúa por resultados y límites, no por instalar una herramienta. Los logs sustentan cada conclusión.",
          "La regresión incluye permitido, bloqueado, límite, reinicio y errores de configuración."
        ],
        "build": [
          "Crea una matriz de pruebas con esperado/obtenido y referencia a evidencia.",
          "Reproduce un fallo de la defensa, corrige y vuelve a probar.",
          "Entrega README para reconstruir el laboratorio, commits, reporte de causa/control y limitaciones."
        ],
        "test": [
          "Arranca desde una configuración limpia y repite la matriz.",
          "Demuestra en vivo el caso antes/después y explica qué protege y qué queda fuera del alcance."
        ],
        "evidence": "Matriz, logs, corrección verificable y demostración técnica.",
        "gate": "El docente puede reproducir los resultados; los límites y las pruebas pendientes están explícitos.",
        "code": ""
      }
    ]
  }
};
