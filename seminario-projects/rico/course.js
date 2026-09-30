window.RICO_COURSE = [
  {
    "title": "Mensaje y primera animación",
    "lead": "Escribe tu mensaje, genera cuadros en Python, comprueba el movimiento y descarga tu primera animación. En la clase 2 construirás el corazón y las flores.",
    "theory": [
      "Config conserva datos; la escena los utiliza. La validación convierte el contrato en reglas comprobables.",
      "Un cuadro es una lista de instrucciones visuales. Python calcula esa lista y el canvas la representa."
    ],
    "uml": [
      "Config",
      "message : str; seconds : float; fps : int",
      "validate() : Config"
    ],
    "gate": "La configuración se valida, la primera escena aparece y el mensaje modificado se ve en la vista previa.",
    "cells": [
      {
        "id": "config",
        "title": "1 · Contrato y configuración",
        "purpose": "Cambia el texto y los colores antes de ejecutar.",
        "steps": [
          "Busca message: str y escribe tu mensaje entre comillas. Cambia background si quieres otro fondo.",
          "Pulsa ▶ Ejecutar celda. Espera Python listo y busca CONTRACT en la consola.",
          "Esta celda configura los datos. Pulsa Siguiente celda para construir la animación."
        ],
        "code": "from dataclasses import dataclass, replace\nimport math, json\n\n@dataclass\nclass Config:\n    message: str = \"Para ti, con cariño\"\n    background: str = \"#14142b\"\n    heart_color: str = \"#f76491\"\n    flower_color: str = \"#ffcc65\"\n    width: int = 720\n    height: int = 480\n    seconds: float = 4.0\n    fps: int = 24\n    flower_count: int = 6\n\n    def validate(self):\n        if not self.message.strip() or len(self.message) > 60:\n            raise ValueError(\"El mensaje debe tener entre 1 y 60 caracteres\")\n        if not 1 <= self.seconds <= 8 or not 1 <= self.fps <= 60:\n            raise ValueError(\"Duración: 1–8 s; FPS: 1–60\")\n        if not 0 <= self.flower_count <= 12:\n            raise ValueError(\"Flores: 0–12\")\n        if not 320 <= self.width <= 1280 or not 240 <= self.height <= 960:\n            raise ValueError(\"Resolución fuera del rango del laboratorio\")\n        for color in (self.background, self.heart_color, self.flower_color):\n            if len(color) != 7 or not color.startswith(\"#\"):\n                raise ValueError(\"Usa colores #RRGGBB\")\n            int(color[1:], 16)\n        return self\n\nconfig = Config().validate()\nprint(\"CONTRACT:\", config.message, config.seconds, \"segundos\")\n"
      },
      {
        "id": "first",
        "title": "2 · Genera tu primera animación",
        "purpose": "Python crea una secuencia: tu mensaje sube suavemente. Después podrás descargar HTML o video.",
        "steps": [
          "Lee first_animation: recorre segundos × FPS; t es el tiempo de cada cuadro.",
          "Pulsa ▶ Ejecutar celda. Deben aparecer 96 cuadros con la configuración inicial.",
          "Observa el mensaje en movimiento. Pulsa Reproducir para repetirlo y Descargar video para guardar el resultado."
        ],
        "code": "def first_animation(cfg):\n    cfg.validate()\n    frames = []\n    for i in range(round(cfg.seconds * cfg.fps)):\n        t = i / cfg.fps\n        # La posición cambia con el tiempo: esto crea movimiento.\n        y = cfg.height / 2 + 22 * math.sin(2 * math.pi * t / cfg.seconds)\n        frames.append({\"time\": t, \"width\": cfg.width, \"height\": cfg.height,\n                       \"background\": cfg.background,\n                       \"shapes\": [{\"kind\": \"text\", \"text\": cfg.message,\n                                   \"x\": cfg.width / 2, \"y\": y,\n                                   \"size\": 28, \"color\": \"#ffffff\", \"alpha\": 1}]})\n    return {\"fps\": cfg.fps, \"seconds\": cfg.seconds, \"frames\": frames}\n\npreview_frames = first_animation(config)\nprint(\"BUILD:\", len(preview_frames[\"frames\"]), \"cuadros; mensaje en movimiento\")\n"
      },
      {
        "id": "test",
        "title": "3 · Verifica el contrato",
        "purpose": "Una prueba fallida debe producir un error real.",
        "steps": [
          "Comprueba fondo, texto y dimensiones.",
          "Prueba un mensaje vacío y observa el rechazo.",
          "El assert debe pasar antes de avanzar."
        ],
        "code": "assert preview_frames[\"frames\"][0][\"background\"] == config.background\nassert preview_frames[\"frames\"][0][\"shapes\"][0][\"text\"] == config.message\ntry:\n    replace(config, message=\"\").validate()\nexcept ValueError:\n    print(\"PASS: el contrato rechaza texto vacío\")\nelse:\n    raise AssertionError(\"Se aceptó un mensaje vacío\")\nprint(\"PASS C1: contrato y cuadro inicial\")\nassert len(preview_frames[\"frames\"]) == round(config.seconds * config.fps)\nassert len({round(f[\"shapes\"][0][\"y\"], 2) for f in preview_frames[\"frames\"]}) > 1\nprint(\"PASS: el mensaje cambia de posición entre cuadros\")\n"
      },
      {
        "id": "modify",
        "title": "4 · Modifica y explica",
        "purpose": "Demuestra que el producto responde a un cambio.",
        "steps": [
          "Escribe tu mensaje en message=\"Gracias por estar aquí\".",
          "Pulsa ▶ Ejecutar celda: se recalculan todos los cuadros con el mensaje nuevo.",
          "Descarga la animación HTML o el video. Abre el archivo y comprueba tu mensaje antes de pasar a Clase 2."
        ],
        "code": "config = replace(config, message=\"Gracias por estar aquí\").validate()\npreview_frames = first_animation(config)\nprint(\"MODIFY:\", config.message, \"en todos los cuadros\")\n"
      }
    ]
  },
  {
    "title": "Motor, corazón y flores",
    "lead": "Construye tres clases reutilizables y una secuencia temporal: corazón pulsante, flores en movimiento y texto que aparece.",
    "theory": [
      "Scene compone Heart, Flower y Message. Cada efecto calcula su geometría y responde a su propia responsabilidad.",
      "El movimiento usa t en segundos. A 30 o 60 FPS cambia el número de cuadros, no la duración del efecto."
    ],
    "uml": [
      "Scene ◆── Heart / Flower / Message",
      "cfg : Config; heart : Heart; flowers : list",
      "frame(t) : dict; render() : dict"
    ],
    "gate": "Tres efectos aparecen, las pruebas de geometría y tiempo pasan y un parámetro cambia el resultado.",
    "cells": [
      {
        "id": "implement",
        "title": "1 · Construye las clases",
        "purpose": "Lee, edita y ejecuta el motor; la vista previa depende de este código.",
        "steps": [
          "Identifica estado y draw() de cada efecto.",
          "Cambia amplitud o velocidad del corazón.",
          "Ejecuta: el canvas debe mostrar el resultado generado."
        ],
        "code": "class Heart:\n    def __init__(self, color):\n        self.color = color\n\n    def draw(self, t, cfg):\n        scale = 5.0 * (1 + 0.10 * math.sin(2 * math.pi * t))\n        points = []\n        for i in range(81):\n            a = 2 * math.pi * i / 80\n            x = 16 * math.sin(a) ** 3\n            y = 13 * math.cos(a) - 5 * math.cos(2*a) - 2 * math.cos(3*a) - math.cos(4*a)\n            points.append([cfg.width / 2 + x * scale,\n                           cfg.height * .40 - y * scale])\n        return {\"kind\": \"polygon\", \"points\": points, \"color\": self.color}\n\nclass Flower:\n    def __init__(self, index, color):\n        self.index, self.color = index, color\n\n    def draw(self, t, cfg):\n        x = cfg.width * (self.index + 1) / (cfg.flower_count + 1)\n        y = cfg.height * .80 + 7 * math.sin(t * 2 + self.index)\n        petals = []\n        for k in range(6):\n            a = k * math.pi / 3 + .15 * t\n            petals.append({\"kind\": \"circle\", \"x\": x + 13 * math.cos(a),\n                           \"y\": y + 13 * math.sin(a), \"r\": 10, \"color\": self.color})\n        return petals + [{\"kind\": \"circle\", \"x\": x, \"y\": y, \"r\": 7, \"color\": \"#fff4cc\"}]\n\nclass Message:\n    def draw(self, t, cfg):\n        return {\"kind\": \"text\", \"text\": cfg.message, \"x\": cfg.width / 2,\n                \"y\": cfg.height * .65, \"size\": 26, \"color\": \"#ffffff\",\n                \"alpha\": min(1.0, max(0.0, t / 1.2))}\n\nclass Scene:\n    def __init__(self, cfg):\n        self.cfg = cfg.validate()\n        self.heart = Heart(cfg.heart_color)\n        self.flowers = [Flower(i, cfg.flower_color) for i in range(cfg.flower_count)]\n        self.message = Message()\n\n    def frame(self, t):\n        if not 0 <= t <= self.cfg.seconds:\n            raise ValueError(\"Tiempo fuera de la escena\")\n        shapes = [self.heart.draw(t, self.cfg)]\n        for flower in self.flowers:\n            shapes.extend(flower.draw(t, self.cfg))\n        shapes.append(self.message.draw(t, self.cfg))\n        return {\"time\": t, \"width\": self.cfg.width, \"height\": self.cfg.height,\n                \"background\": self.cfg.background, \"shapes\": shapes}\n\n    def render(self):\n        count = round(self.cfg.seconds * self.cfg.fps)\n        return {\"fps\": self.cfg.fps, \"seconds\": self.cfg.seconds,\n                \"frames\": [self.frame(i / self.cfg.fps) for i in range(count)]}\n\nscene = Scene(config)\npreview_frames = scene.render()\nprint(\"BUILD:\", len(preview_frames[\"frames\"]), \"cuadros · corazón, flores y mensaje\")\n"
      },
      {
        "id": "test",
        "title": "2 · Prueba tiempo y geometría",
        "purpose": "Comprueba el motor sin depender de una captura.",
        "steps": [
          "Compara frame(1) con dos FPS distintos.",
          "Verifica que el corazón contiene una trayectoria cerrada.",
          "Comprueba flores y aparición del mensaje."
        ],
        "code": "a = Scene(replace(config, fps=30)).frame(1)\nb = Scene(replace(config, fps=60)).frame(1)\nassert a == b, \"El mismo tiempo debe producir la misma geometría\"\npoints = a[\"shapes\"][0][\"points\"]\nassert math.dist(points[0], points[-1]) < 0.00001\nassert len(a[\"shapes\"]) == 2 + 7 * config.flower_count\nassert Scene(config).frame(0)[\"shapes\"][-1][\"alpha\"] == 0\nassert Scene(config).frame(config.seconds)[\"shapes\"][-1][\"alpha\"] == 1\nprint(\"PASS C2: geometría, composición y tiempo independientes de FPS\")\n"
      },
      {
        "id": "modify",
        "title": "3 · Cambia una condición",
        "purpose": "El mismo motor debe producir otra composición.",
        "steps": [
          "Modifica flower_count y heart_color.",
          "Construye una nueva escena con la configuración.",
          "Comprueba que no quedan efectos del estado anterior."
        ],
        "code": "config = replace(config, flower_count=8, heart_color=\"#ef4477\").validate()\nscene = Scene(config)\npreview_frames = scene.render()\nassert len(scene.flowers) == 8\nprint(\"MODIFY: nueva escena con\", len(scene.flowers), \"flores\")\n"
      }
    ]
  },
  {
    "title": "Entrega portable sin conexión",
    "lead": "Empaqueta tu resultado como una animación web autónoma y conserva el Python que la genera. Prueba el archivo desde otra carpeta y desde USB.",
    "theory": [
      "El notebook necesita Internet para cargar Python. El HTML exportado contiene sus cuadros y reproductor: no necesita CDN ni servidor.",
      "El archivo exportado reproduce el resultado del código actual. El notebook y el generador Python conservan la capacidad de modificarlo."
    ],
    "uml": [
      "Entrega",
      "frames : list; fps : int; code : str",
      "render() → HTML autónomo"
    ],
    "gate": "Descarga el HTML, muévelo y comprueba reproducción offline. Registra la prueba USB como evidencia manual.",
    "cells": [
      {
        "id": "implement",
        "title": "1 · Genera la entrega",
        "purpose": "Crea un paquete de datos a partir de tu Scene actual.",
        "steps": [
          "Valida la configuración.",
          "Renderiza otra vez después de cualquier edición.",
          "El botón Descargar animación se habilita al recibir los cuadros."
        ],
        "code": "scene = Scene(config)\npreview_frames = scene.render()\nportable_json = json.dumps(preview_frames, ensure_ascii=False)\nprint(\"EXPORT:\", len(portable_json.encode(\"utf-8\")), \"bytes de cuadros\")\n"
      },
      {
        "id": "test",
        "title": "2 · Verifica que los datos son autónomos",
        "purpose": "Una ida y vuelta por JSON debe conservar el contenido.",
        "steps": [
          "Serializa y vuelve a leer el paquete.",
          "Comprueba FPS y cantidad de cuadros.",
          "Comprueba que no hay rutas de archivos ni URLs dentro de los cuadros."
        ],
        "code": "restored = json.loads(portable_json)\nassert restored == preview_frames\nassert len(restored[\"frames\"]) == round(config.seconds * config.fps)\nassert \"https://\" not in portable_json and \"file://\" not in portable_json\nprint(\"PASS C3: paquete completo y serialización sin pérdida\")\n"
      },
      {
        "id": "modify",
        "title": "3 · Personaliza la entrega final",
        "purpose": "Actualiza el mensaje y regenera antes de descargar.",
        "steps": [
          "Modifica el mensaje definitivo.",
          "Ejecuta y descarga el HTML de la vista previa.",
          "Abre el archivo sin conexión; repite desde una carpeta diferente y USB."
        ],
        "code": "config = replace(config, message=\"Un mensaje hecho por mí\").validate()\nscene = Scene(config)\npreview_frames = scene.render()\nportable_json = json.dumps(preview_frames, ensure_ascii=False)\nprint(\"MODIFY: entrega regenerada · prueba offline pendiente de comprobar\")\n"
      }
    ]
  },
  {
    "title": "QA y defensa del mensaje",
    "lead": "Ejecuta una suite de regresión real, reproduce un fallo y explica la relación entre clases, parámetros y animación.",
    "theory": [
      "Las pruebas comparan propiedades observables. Una ejecución sin excepciones no prueba todos los criterios del producto.",
      "La defensa requiere código editado, resultados, archivo portable y evidencia de las pruebas físicas/offline."
    ],
    "uml": [
      "AnimationTests",
      "config : Config; scene : Scene",
      "test_contract(); test_geometry(); test_timing()"
    ],
    "gate": "La suite pasa, un fallo se reproduce y corrige, y la entrega offline se demuestra con evidencia.",
    "cells": [
      {
        "id": "test",
        "title": "1 · Ejecuta la suite",
        "purpose": "Unittest ejecuta cuatro pruebas, no una etiqueta simulada.",
        "steps": [
          "Lee cada assert y predice qué fallo detecta.",
          "Ejecuta y observa Tests run y OK.",
          "No avances si la suite produce FAIL o ERROR."
        ],
        "code": "import unittest\n\nclass AnimationTests(unittest.TestCase):\n    def test_invalid_contract(self):\n        with self.assertRaises(ValueError):\n            replace(config, seconds=0).validate()\n        with self.assertRaises(ValueError):\n            replace(config, flower_count=13).validate()\n\n    def test_timing(self):\n        first = Scene(replace(config, fps=30)).frame(1)\n        second = Scene(replace(config, fps=60)).frame(1)\n        self.assertEqual(first, second)\n\n    def test_message(self):\n        s = Scene(config)\n        self.assertEqual(s.frame(0)[\"shapes\"][-1][\"alpha\"], 0)\n        self.assertEqual(s.frame(config.seconds)[\"shapes\"][-1][\"text\"], config.message)\n\n    def test_export(self):\n        data = Scene(config).render()\n        self.assertEqual(json.loads(json.dumps(data)), data)\n        self.assertEqual(len(data[\"frames\"]), round(config.seconds * config.fps))\n\nresult = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(AnimationTests))\nassert result.wasSuccessful(), \"Corrige la suite antes de cerrar el proyecto\"\nprint(\"PASS C4:\", result.testsRun, \"pruebas de regresión\")\n"
      },
      {
        "id": "fault",
        "title": "2 · Reproduce un fallo",
        "purpose": "Esta celda debe fallar; comprueba que el error no aprueba la prueba.",
        "steps": [
          "Ejecuta con flower_count=-1.",
          "Lee el traceback de ValueError.",
          "Cambia -1 por 4, vuelve a ejecutar y explica la corrección."
        ],
        "code": "broken = replace(config, flower_count=-1)\nbroken.validate()  # Debe fallar. Corrige -1 por 4 y vuelve a ejecutar.\nprint(\"La configuración corregida es válida\")\n"
      },
      {
        "id": "modify",
        "title": "3 · Demuestra el cambio en vivo",
        "purpose": "Realiza el cambio de requisito sin modificar el reproductor.",
        "steps": [
          "Cambia el texto y el fondo durante la defensa.",
          "Vuelve a generar y reproduce la nueva escena.",
          "Descarga código, notebook y evidencia; adjunta prueba offline en tus notas."
        ],
        "code": "config = replace(config, message=\"Rico · diseño, código y evidencia\", background=\"#10283b\").validate()\nscene = Scene(config)\npreview_frames = scene.render()\nprint(\"DEFENSE:\", config.message, config.background)\n"
      }
    ]
  }
];
