window.STUDIO_COURSES = {
  "cyber": {
    "title": "Ciberseguridad · Defensa de una aplicación web",
    "mode": "python",
    "note": "En el navegador: fixtures sintéticos ejecutados en Python. En C3: servidor HTTP real descargable para localhost.",
    "classes": [
      {
        "title": "1 · Activo, contrato y línea base",
        "lead": "Define activo, amenaza y qué significa una petición legítima.",
        "theory": [
          "Define activo, amenaza y qué significa una petición legítima.",
          "Request representa una entrada. Primero mide el comportamiento sin defensa."
        ],
        "gate": "Línea base reproducible y alcance documentado.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "baseline",
            "title": "1 · Ejecuta la línea base",
            "purpose": "Predice cuántas respuestas 200 habrá.",
            "language": "python",
            "code": "from dataclasses import dataclass\nfrom collections import Counter, defaultdict, deque\nimport json\n\n@dataclass\nclass Request:\n    client: str\n    time: float\n    route: str = \"/api/report\"\n    user: str = \"ana\"\n    payload: str = \"demo\"\n\ndef baseline(request):\n    return 200\n\nrequests = [Request(\"demo\", i * .1) for i in range(8)]\nbefore = Counter(baseline(r) for r in requests)\nlab_output = {\"kind\":\"table\", \"headers\":[\"Escenario\", \"200\", \"429\"],\n              \"rows\":[[\"Sin defensa\", before[200], before[429]]],\n              \"note\":\"Solicitudes sintéticas ejecutadas en Python. C3 exporta un servidor HTTP real para localhost.\"}\nprint(\"BASELINE:\", dict(before))\n",
            "steps": [
              "Predice cuántas respuestas 200 habrá.",
              "Ejecuta los ocho requests sintéticos.",
              "La tabla debe reflejar el resultado del código."
            ],
            "part": null
          },
          {
            "id": "test",
            "title": "2 · Verifica el fixture",
            "purpose": "Comprueba el número exacto de entradas.",
            "language": "python",
            "code": "assert before[200] == 8\nassert before[429] == 0\nprint(\"PASS C1: ocho peticiones sin defensa\")",
            "steps": [
              "Comprueba el número exacto de entradas.",
              "Cambia la cantidad y ajusta el criterio del contrato."
            ],
            "part": null
          }
        ]
      },
      {
        "title": "2 · Construye y prueba la defensa",
        "lead": "Un límite de tasa conserva un historial por cliente y una ventana temporal.",
        "theory": [
          "Un límite de tasa conserva un historial por cliente y una ventana temporal.",
          "No basta bloquear: hay que permitir al usuario legítimo después del enfriamiento."
        ],
        "gate": "Defensa medible antes/después y recuperación verificada.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "policy",
            "title": "1 · Implementa la política",
            "purpose": "Lee handle(): tamaño, autorización y tasa.",
            "language": "python",
            "code": "class Policy:\n    def __init__(self, limit=3, window=2.0, max_payload=100):\n        if limit < 1 or window <= 0:\n            raise ValueError(\"Límite y ventana deben ser positivos\")\n        self.limit, self.window, self.max_payload = limit, window, max_payload\n        self.history = defaultdict(deque)\n\n    def handle(self, r):\n        if len(r.payload) > self.max_payload:\n            return 400\n        if r.route.startswith(\"/api/records/\") and r.user != \"ana\":\n            return 403  # El registro ficticio 1 pertenece a ana.\n        times = self.history[r.client]\n        while times and times[0] <= r.time - self.window:\n            times.popleft()\n        if len(times) >= self.limit:\n            return 429\n        times.append(r.time)\n        return 200\n\npolicy = Policy()\nafter = Counter(policy.handle(r) for r in requests)\nlab_output = {\"kind\":\"table\", \"headers\":[\"Escenario\", \"200\", \"429\"],\n              \"rows\":[[\"Sin defensa\", before[200], before[429]],\n                      [\"Con defensa\", after[200], after[429]]],\n              \"note\":\"Mismo fixture antes/después. Comprueba el tráfico legítimo tras vencer la ventana.\"}\nprint(\"DEFENSE:\", dict(after))\n",
            "steps": [
              "Lee handle(): tamaño, autorización y tasa.",
              "Modifica limit o window.",
              "Compara la tabla con la línea base."
            ],
            "part": null
          },
          {
            "id": "test",
            "title": "2 · Verifica bloqueo y recuperación",
            "purpose": "Repite el mismo fixture.",
            "language": "python",
            "code": "p=Policy()\nassert [p.handle(r) for r in requests] == [200]*3+[429]*5\nassert p.handle(Request(\"demo\",2.2)) == 200\nassert p.handle(Request(\"legitimo\",.2)) == 200\nprint(\"PASS C2: bloqueo, recuperación y cliente independiente\")",
            "steps": [
              "Repite el mismo fixture.",
              "Comprueba que otra identidad legítima funciona."
            ],
            "part": null
          }
        ]
      },
      {
        "title": "3 · Servicio HTTP real en localhost",
        "lead": "El fixture del notebook y el HTTP local son dos pruebas distintas.",
        "theory": [
          "El fixture del notebook y el HTTP local son dos pruebas distintas.",
          "El servidor descargado aplica la misma Policy; la prueba usa urllib contra 127.0.0.1."
        ],
        "gate": "Descarga, inicia el servidor y comprueba respuestas HTTP reales.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "export",
            "title": "1 · Genera servidor y prueba",
            "purpose": "Descarga laboratorio_web.py y prueba_local.py.",
            "language": "python",
            "code": "# LAB_EXPORT_START\n# LAB_SOURCE contiene las dependencias ejecutadas y esta celda.\nserver = LAB_SOURCE.split(\"# LAB_EXPORT_START\")[0] + SERVER_TAIL\nlab_output = {\"kind\":\"table\", \"headers\":[\"Archivo\", \"Cómo comprobar\"],\n \"rows\":[[\"laboratorio_web.py\", \"python laboratorio_web.py\"],\n         [\"prueba_local.py\", \"python prueba_local.py, en otra terminal\"]],\n \"note\":\"Solo localhost; en el navegador se ejecutan fixtures sintéticos, no tráfico contra servidores.\",\n \"artifacts\":[{\"name\":\"laboratorio_web.py\",\"text\":server},\n              {\"name\":\"prueba_local.py\",\"text\":PROBE_SOURCE}]}\nprint(\"EXPORT: servidor HTTP y prueba reproducible preparados\")\n",
            "steps": [
              "Descarga laboratorio_web.py y prueba_local.py.",
              "Inicia el servidor en una terminal.",
              "Ejecuta la prueba en otra terminal y registra su salida."
            ],
            "part": null
          },
          {
            "id": "test",
            "title": "2 · Prueba autorización y tamaño",
            "purpose": "Comprueba permitido y denegado.",
            "language": "python",
            "code": "p=Policy()\nassert p.handle(Request(\"a\",0,\"/api/records/1\",\"bruno\")) == 403\nassert p.handle(Request(\"a\",0,payload=\"x\"*101)) == 400\nassert p.handle(Request(\"a\",0,\"/api/records/1\",\"ana\")) == 200\nprint(\"PASS C3: autorización por recurso y validación\")",
            "steps": [
              "Comprueba permitido y denegado.",
              "Relaciona los códigos con el control que los produce."
            ],
            "part": null
          }
        ]
      },
      {
        "title": "4 · Regresión y defensa técnica",
        "lead": "Las conclusiones se sostienen con esperado/obtenido, configuración y logs.",
        "theory": [
          "Las conclusiones se sostienen con esperado/obtenido, configuración y logs.",
          "Un resultado del navegador no se presenta como una medición de la red real."
        ],
        "gate": "Suite del notebook y prueba HTTP real documentadas.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "test",
            "title": "1 · Suite de regresión",
            "purpose": "Ejecuta la suite real.",
            "language": "python",
            "code": "import unittest\nclass DefenseTests(unittest.TestCase):\n    def test_invalid_policy(self):\n        with self.assertRaises(ValueError): Policy(limit=0)\n    def test_rate(self):\n        p=Policy(); self.assertEqual([p.handle(r) for r in requests],[200]*3+[429]*5)\n    def test_owner(self):\n        self.assertEqual(Policy().handle(Request(\"a\",0,\"/api/records/1\",\"bruno\")),403)\nresult=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(DefenseTests))\nassert result.wasSuccessful()\nprint(\"PASS C4: regresión defensiva\")",
            "steps": [
              "Ejecuta la suite real.",
              "Cambia una condición para producir un fallo y corrígelo."
            ],
            "part": null
          },
          {
            "id": "export",
            "title": "2 · Exporta la entrega final",
            "purpose": "Conserva los archivos y logs.",
            "language": "python",
            "code": "# LAB_EXPORT_START\n# LAB_SOURCE contiene las dependencias ejecutadas y esta celda.\nserver = LAB_SOURCE.split(\"# LAB_EXPORT_START\")[0] + SERVER_TAIL\nlab_output = {\"kind\":\"table\", \"headers\":[\"Archivo\", \"Cómo comprobar\"],\n \"rows\":[[\"laboratorio_web.py\", \"python laboratorio_web.py\"],\n         [\"prueba_local.py\", \"python prueba_local.py, en otra terminal\"]],\n \"note\":\"Solo localhost; en el navegador se ejecutan fixtures sintéticos, no tráfico contra servidores.\",\n \"artifacts\":[{\"name\":\"laboratorio_web.py\",\"text\":server},\n              {\"name\":\"prueba_local.py\",\"text\":PROBE_SOURCE}]}\nprint(\"EXPORT: servidor HTTP y prueba reproducible preparados\")\n",
            "steps": [
              "Conserva los archivos y logs.",
              "Defiende el alcance y cada control."
            ],
            "part": null
          }
        ]
      }
    ]
  },
  "cad": {
    "title": "CAD · Diseño paramétrico e impresión 3D",
    "mode": "python",
    "note": "Modelo de soporte de ejemplo en mm, editable y exportable. Confirma el objeto final. La impresión y la medición física son pruebas pendientes.",
    "classes": [
      {
        "title": "1 · Función y cotas",
        "lead": "Un parámetro representa una dimensión con función, unidad y límite.",
        "theory": [
          "Un parámetro representa una dimensión con función, unidad y límite.",
          "Define la necesidad y confirma el objeto antes de adoptar el soporte de ejemplo."
        ],
        "gate": "Tabla de cotas y restricciones verificadas.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "params",
            "title": "1 · Contrato dimensional",
            "purpose": "Modifica las cotas en mm.",
            "language": "python",
            "code": "from dataclasses import dataclass, replace\nfrom collections import Counter\nimport math, json\n\n@dataclass\nclass Dimensions:\n    depth: float = 55\n    width: float = 80\n    height: float = 45\n    thickness: float = 5\n    def validate(self):\n        if not all(math.isfinite(v) for v in (self.depth,self.width,self.height,self.thickness)):\n            raise ValueError(\"Las medidas deben ser finitas\")\n        if not 2 <= self.thickness < min(self.depth,self.height) / 2:\n            raise ValueError(\"Revisa el espesor y las dimensiones\")\n        if not all(10 <= v <= 200 for v in (self.depth,self.width,self.height)):\n            raise ValueError(\"Medidas entre 10 y 200 mm\")\n        return self\n\nparams = Dimensions().validate()\nprint(\"CONTRACT mm:\", params)\n",
            "steps": [
              "Modifica las cotas en mm.",
              "Ejecuta la validación.",
              "Compara con medidas del objeto real."
            ],
            "part": null
          },
          {
            "id": "test",
            "title": "2 · Detecta una cota inválida",
            "purpose": "Predice el error.",
            "language": "python",
            "code": "try:\n    replace(params,thickness=0).validate()\nexcept ValueError:\n    print(\"PASS: espesor inválido rechazado\")\nelse:\n    raise AssertionError(\"Espesor inválido aceptado\")",
            "steps": [
              "Predice el error.",
              "La prueba debe comprobar que la validación lo rechaza."
            ],
            "part": null
          }
        ]
      },
      {
        "title": "2 · Perfil, sólido y variantes",
        "lead": "El perfil en L se extruye en el ancho; la malla conserva la superficie del sólido.",
        "theory": [
          "El perfil en L se extruye en el ancho; la malla conserva la superficie del sólido.",
          "Una malla cerrada requiere dos caras por arista y orientación coherente."
        ],
        "gate": "Modelo visible, volumen y dimensiones comprobados.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "mesh",
            "title": "1 · Construye el sólido",
            "purpose": "Lee cómo se construyen vértices y caras.",
            "language": "python",
            "code": "class Stand:\n    def __init__(self, params):\n        self.p = params.validate()\n\n    def mesh(self):\n        p = self.p\n        profile = [(0,0),(p.depth,0),(p.depth,p.height),\n                   (p.depth-p.thickness,p.height),\n                   (p.depth-p.thickness,p.thickness),(0,p.thickness)]\n        vertices = [[x,y,z] for y in (0,p.width) for x,z in profile]\n        caps = [(0,1,4),(0,4,5),(1,2,3),(1,3,4)]\n        triangles = list(caps) + [(c+6,b+6,a+6) for a,b,c in caps]\n        for a in range(6):\n            b = (a+1) % 6\n            triangles.extend([(a,a+6,b+6),(a,b+6,b)])\n        return {\"kind\":\"mesh\", \"vertices\":vertices,\"triangles\":triangles,\n                \"note\":\"Soporte de ejemplo · mm. Confirma el objeto final y la fabricación con el docente.\"}\n\ndef volume(mesh):\n    total = 0\n    for a,b,c in mesh[\"triangles\"]:\n        x,y,z = [mesh[\"vertices\"][i] for i in (a,b,c)]\n        total += (x[0]*(y[1]*z[2]-y[2]*z[1]) - x[1]*(y[0]*z[2]-y[2]*z[0]) + x[2]*(y[0]*z[1]-y[1]*z[0])) / 6\n    return total\n\nstand = Stand(params)\nlab_output = stand.mesh()\nprint(\"BUILD:\", len(lab_output[\"triangles\"]), \"triángulos; volumen mm³:\", volume(lab_output))\n",
            "steps": [
              "Lee cómo se construyen vértices y caras.",
              "Ejecuta y gira la vista.",
              "Explica la relación entre cotas y geometría."
            ],
            "part": null
          },
          {
            "id": "test",
            "title": "2 · Comprueba el sólido",
            "purpose": "Comprueba cierre y volumen.",
            "language": "python",
            "code": "mesh = stand.mesh()\nedges = Counter(tuple(sorted(edge)) for a,b,c in mesh[\"triangles\"] for edge in ((a,b),(b,c),(c,a)))\nassert all(count == 2 for count in edges.values()), \"La malla debe estar cerrada\"\nexpected = params.width * params.thickness * (params.depth + params.height - params.thickness)\nassert math.isclose(volume(mesh), expected, rel_tol=1e-9), (volume(mesh), expected)\nassert max(v[0] for v in mesh[\"vertices\"]) == params.depth\nassert max(v[1] for v in mesh[\"vertices\"]) == params.width\nassert max(v[2] for v in mesh[\"vertices\"]) == params.height\nprint(\"PASS CAD: malla cerrada, volumen y dimensiones nominales\")\n",
            "steps": [
              "Comprueba cierre y volumen.",
              "Cambia una cota y repite la validación."
            ],
            "part": null
          },
          {
            "id": "modify",
            "title": "3 · Regenera una variante",
            "purpose": "Modifica el ancho.",
            "language": "python",
            "code": "params=replace(params,width=95).validate()\nstand=Stand(params)\nlab_output=stand.mesh()\nprint(\"MODIFY: ancho\",params.width,\"mm\")",
            "steps": [
              "Modifica el ancho.",
              "Verifica visualmente que se regenera el mismo diseño."
            ],
            "part": null
          }
        ]
      },
      {
        "title": "3 · STL y preparación de impresión",
        "lead": "STL contiene triángulos; no conserva el historial paramétrico ni declara una unidad.",
        "theory": [
          "STL contiene triángulos; no conserva el historial paramétrico ni declara una unidad.",
          "Importa en mm, confirma escala y revisa capas/orientación/perfil en el laminador."
        ],
        "gate": "STL verificado y ficha de fabricación preparada.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "export",
            "title": "1 · Exporta la malla",
            "purpose": "Descarga STL, cotas y ficha.",
            "language": "python",
            "code": "def stl(mesh):\n    lines = [\"solid stand\"]\n    for indices in mesh[\"triangles\"]:\n        a,b,c = [mesh[\"vertices\"][i] for i in indices]\n        u,v = [b[i]-a[i] for i in range(3)], [c[i]-a[i] for i in range(3)]\n        normal = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]]\n        length = math.sqrt(sum(x*x for x in normal))\n        assert length > 0, \"Triángulo degenerado\"\n        normal = [x/length for x in normal]\n        lines.append(\"facet normal \" + \" \".join(map(str, normal)))\n        lines.append(\"outer loop\")\n        lines.extend(\"vertex \" + \" \".join(map(str,p)) for p in (a,b,c))\n        lines.extend([\"endloop\", \"endfacet\"])\n    return \"\\n\".join(lines + [\"endsolid stand\"])\n\nlab_output = stand.mesh()\nlab_output[\"artifacts\"] = [{\"name\":\"soporte.stl\", \"text\":stl(lab_output)},\n {\"name\":\"parametros.json\", \"text\":json.dumps(params.__dict__, indent=2)},\n {\"name\":\"fabricacion.md\", \"text\":\"STL sin unidad: importar en mm.\\nInspeccionar capas, orientación, soporte y perfil de máquina.\\nMedición y prueba física pendientes: registrar nominal/real y tolerancia acordada.\\n\"}]\nprint(\"EXPORT: STL y parámetros listos; fabricación física pendiente\")\n",
            "steps": [
              "Descarga STL, cotas y ficha.",
              "Importa el STL en el laminador o Fusion.",
              "No marques fabricación como hecha antes de imprimir."
            ],
            "part": null
          },
          {
            "id": "test",
            "title": "2 · Verifica el archivo",
            "purpose": "Comprueba la estructura exportada.",
            "language": "python",
            "code": "text=stl(stand.mesh())\nassert text.count(\"facet normal\") == 20\nassert text.count(\"vertex \") == 60\nassert text.startswith(\"solid stand\")\nprint(\"PASS C3: 20 triángulos STL y normales no degeneradas\")",
            "steps": [
              "Comprueba la estructura exportada.",
              "Verifica la escala en el programa de fabricación."
            ],
            "part": null
          }
        ]
      },
      {
        "title": "4 · Medición e iteración",
        "lead": "El modelo nominal y la pieza física se comparan mediante cotas y tolerancias acordadas.",
        "theory": [
          "El modelo nominal y la pieza física se comparan mediante cotas y tolerancias acordadas.",
          "Las medidas de ejemplo son un fixture; reemplázalas por mediciones reales."
        ],
        "gate": "Geometría válida y medición física documentada por separado.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "test",
            "title": "1 · Regresión geométrica",
            "purpose": "Repite pruebas sobre la variante final.",
            "language": "python",
            "code": "mesh = stand.mesh()\nedges = Counter(tuple(sorted(edge)) for a,b,c in mesh[\"triangles\"] for edge in ((a,b),(b,c),(c,a)))\nassert all(count == 2 for count in edges.values()), \"La malla debe estar cerrada\"\nexpected = params.width * params.thickness * (params.depth + params.height - params.thickness)\nassert math.isclose(volume(mesh), expected, rel_tol=1e-9), (volume(mesh), expected)\nassert max(v[0] for v in mesh[\"vertices\"]) == params.depth\nassert max(v[1] for v in mesh[\"vertices\"]) == params.width\nassert max(v[2] for v in mesh[\"vertices\"]) == params.height\nprint(\"PASS CAD: malla cerrada, volumen y dimensiones nominales\")\n\nprint(\"PASS C4: cierre y volumen de la variante\")",
            "steps": [
              "Repite pruebas sobre la variante final.",
              "No uses una captura como prueba de impresión."
            ],
            "part": null
          },
          {
            "id": "measurement",
            "title": "2 · Analiza una medición",
            "purpose": "Distingue fixture y medida física.",
            "language": "python",
            "code": "nominal=params.width\nmeasured=nominal-0.3  # Fixture: reemplaza por la medición física real.\ntolerance=0.5       # Tolerancia de ejemplo: acordar con el docente.\ndeviation=measured-nominal\nassert abs(deviation)<=tolerance\nlab_output={\"kind\":\"table\",\"headers\":[\"Tipo\",\"Nominal mm\",\"Medido mm\",\"Desviación mm\"],\"rows\":[[\"Fixture, no medición física\",nominal,measured,round(deviation,3)]],\"note\":\"Sustituye por datos del instrumento y documenta su resolución.\"}\nprint(\"PASS fixture: desviación\",round(deviation,3))",
            "steps": [
              "Distingue fixture y medida física.",
              "Registra instrumento, resolución y tolerancia."
            ],
            "part": null
          },
          {
            "id": "export",
            "title": "3 · Exporta el diseño final",
            "purpose": "Conserva parámetros, STL y tabla.",
            "language": "python",
            "code": "def stl(mesh):\n    lines = [\"solid stand\"]\n    for indices in mesh[\"triangles\"]:\n        a,b,c = [mesh[\"vertices\"][i] for i in indices]\n        u,v = [b[i]-a[i] for i in range(3)], [c[i]-a[i] for i in range(3)]\n        normal = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]]\n        length = math.sqrt(sum(x*x for x in normal))\n        assert length > 0, \"Triángulo degenerado\"\n        normal = [x/length for x in normal]\n        lines.append(\"facet normal \" + \" \".join(map(str, normal)))\n        lines.append(\"outer loop\")\n        lines.extend(\"vertex \" + \" \".join(map(str,p)) for p in (a,b,c))\n        lines.extend([\"endloop\", \"endfacet\"])\n    return \"\\n\".join(lines + [\"endsolid stand\"])\n\nlab_output = stand.mesh()\nlab_output[\"artifacts\"] = [{\"name\":\"soporte.stl\", \"text\":stl(lab_output)},\n {\"name\":\"parametros.json\", \"text\":json.dumps(params.__dict__, indent=2)},\n {\"name\":\"fabricacion.md\", \"text\":\"STL sin unidad: importar en mm.\\nInspeccionar capas, orientación, soporte y perfil de máquina.\\nMedición y prueba física pendientes: registrar nominal/real y tolerancia acordada.\\n\"}]\nprint(\"EXPORT: STL y parámetros listos; fabricación física pendiente\")\n",
            "steps": [
              "Conserva parámetros, STL y tabla.",
              "Defiende la iteración y función del objeto."
            ],
            "part": null
          }
        ]
      }
    ]
  },
  "clients": {
    "title": "HTML · Registro y base de datos de clientes",
    "mode": "web",
    "note": "HTML, CSS y JavaScript reales en vista previa aislada. IndexedDB conserva datos ficticios en este navegador; no es una base compartida en la nube.",
    "classes": [
      {
        "title": "1 · HTML semántico e interfaz",
        "lead": "HTML define estructura y etiquetas; CSS presenta esa estructura.",
        "theory": [
          "HTML define estructura y etiquetas; CSS presenta esa estructura.",
          "Cada input tiene un nombre que corresponde al modelo de datos."
        ],
        "gate": "Formulario accesible y diseño adaptable.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "html",
            "title": "1 · Construye el HTML",
            "purpose": "Edita el título y los labels.",
            "language": "html",
            "code": "<main><header><p>Seminario 11 · Datos ficticios</p><h1>Registro de clientes</h1><p>Base de datos local del navegador.</p></header>\n<form id=\"recordForm\"><label>Nombre<input name=\"name\" required maxlength=\"80\"></label><label>Correo<input name=\"email\" type=\"email\" required></label><label>Teléfono<input name=\"phone\" maxlength=\"30\"></label><button>Guardar cliente</button></form>\n<p id=\"status\" role=\"status\"></p><label>Buscar<input id=\"search\" placeholder=\"Nombre o correo\"></label><table><thead><tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Acción</th></tr></thead><tbody id=\"rows\"></tbody></table></main>",
            "steps": [
              "Edita el título y los labels.",
              "Ejecuta y observa la página real.",
              "Relaciona name con el modelo de datos."
            ],
            "part": "html"
          },
          {
            "id": "css",
            "title": "2 · Diseña la interfaz",
            "purpose": "Cambia color o distribución.",
            "language": "css",
            "code": "*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font-family:Arial,sans-serif}main{max-width:1000px;margin:auto;padding:24px}header{border-bottom:3px solid #1a73e8;margin-bottom:20px}h1{font-size:32px}form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:20px;background:white;border:1px solid #d6dce6;border-radius:12px}label{display:grid;gap:6px;font-size:13px;margin:8px 0}input,select,button{padding:11px;border:1px solid #c4cddd;border-radius:6px;font:inherit;min-width:0}button{background:#1a73e8;color:white;cursor:pointer}table{width:100%;margin-top:20px;background:white;border-collapse:collapse;font-size:13px}th,td{border-bottom:1px solid #d6dce6;padding:10px;text-align:left;overflow-wrap:anywhere}#status{min-height:24px;color:#174ea6}@media(max-width:600px){form{grid-template-columns:1fr}main{padding:12px}table{font-size:11px}th,td{padding:6px}}",
            "steps": [
              "Cambia color o distribución.",
              "Ejecuta y verifica en un ancho pequeño."
            ],
            "part": "css"
          },
          {
            "id": "test",
            "title": "3 · Prueba la estructura",
            "purpose": "Comprueba elementos reales del DOM.",
            "language": "javascript",
            "code": "assert(document.querySelector(\"#recordForm\"),\"Formulario\")\nassert(document.querySelector(\"input[name=name]\"),\"Nombre etiquetado\")\nassert(document.querySelector(\"#rows\"),\"Tabla de resultados\")\nconsole.log(\"PASS C1: formulario, nombre y tabla\")",
            "steps": [
              "Comprueba elementos reales del DOM.",
              "Una falta de id debe producir un error."
            ],
            "part": null
          }
        ]
      },
      {
        "title": "2 · Registro y persistencia",
        "lead": "JavaScript conecta eventos, validación y transacciones.",
        "theory": [
          "JavaScript conecta eventos, validación y transacciones.",
          "IndexedDB usa una clave y un índice único; el alta se confirma al completar la transacción."
        ],
        "gate": "Alta y listado reales; rechazo de duplicados.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "app",
            "title": "1 · Conecta la base de datos",
            "purpose": "Lee db(add), db(list) y db(delete).",
            "language": "javascript",
            "code": "const fields = [\"name\", \"email\", \"phone\"];\nconst form = document.querySelector('#recordForm');\nconst status = document.querySelector('#status');\nasync function render(){\n  const all = await db('list');\n  const query = document.querySelector('#search').value.trim().toLowerCase();\n  const category = document.querySelector('#categoryFilter')?.value || '';\n  const rows = all.filter(r => fields.some(f => String(r[f]).toLowerCase().includes(query)) && (!category || r.category === category));\n  const body = document.querySelector('#rows');body.replaceChildren();\n  for(const record of rows){\n    const tr = document.createElement('tr');\n    for(const field of fields){const td=document.createElement('td');td.textContent=record[field];tr.appendChild(td);}\n    const td=document.createElement('td');const button=document.createElement('button');button.textContent='Eliminar';\n    button.onclick=async()=>{await db('delete',{id:record.id});await render();};td.appendChild(button);tr.appendChild(td);body.appendChild(tr);\n  }\n}\nform.onsubmit=async event=>{\n  event.preventDefault();\n  try{const row=Object.fromEntries(new FormData(form));await db('add',row);form.reset();status.textContent='Guardado en la base local';await render();}\n  catch(error){status.textContent=error.message;}\n};\ndocument.querySelector('#search').oninput=render;\nif(document.querySelector('#categoryFilter'))document.querySelector('#categoryFilter').onchange=render;\nawait render();\nwindow.renderRecords=render;\nconsole.log('BUILD: formulario conectado a IndexedDB; '+(await db('list')).length+' registros');",
            "steps": [
              "Lee db(add), db(list) y db(delete).",
              "Ejecuta y registra un dato ficticio.",
              "Recarga el taller: la base se conserva en este navegador."
            ],
            "part": "js"
          },
          {
            "id": "test",
            "title": "2 · Prueba CRUD y validación",
            "purpose": "Ejecuta alta/lectura/borrado con un fixture.",
            "language": "javascript",
            "code": "const fixture = {\"name\": \"Cliente QA\", \"email\": \"qa@example.test\", \"phone\": \"000\"};\nlet created;\ntry{\n  created=await db('add',fixture);\n  assert((await db('list')).some(r=>r.id===created.id),'Registro persistido');\n  let duplicateRejected=false;\n  try{await db('add',fixture);}catch(e){duplicateRejected=true;}\n  assert(duplicateRejected,'Duplicado rechazado');\n  let invalidRejected=false;\n  try{await db('add',{\"name\": \"\", \"email\": \"bad\", \"phone\": \"\"});}catch(e){invalidRejected=true;}\n  assert(invalidRejected,'Entrada inválida rechazada');\n  console.log('PASS: alta, lectura, índice único y validación reales');\n}finally{if(created)await db('delete',{id:created.id});await renderRecords();}\n",
            "steps": [
              "Ejecuta alta/lectura/borrado con un fixture.",
              "Verifica el error de duplicado.",
              "La prueba limpia únicamente el registro que creó."
            ],
            "part": null
          }
        ]
      },
      {
        "title": "3 · Búsqueda, contenido seguro y entrega",
        "lead": "Los valores se dibujan con textContent: un dato no se interpreta como HTML.",
        "theory": [
          "Los valores se dibujan con textContent: un dato no se interpreta como HTML.",
          "Búsqueda y filtros operan sobre los registros de la base. El HTML exportado conserva la app y crea su propia base local."
        ],
        "gate": "Búsqueda real y datos representados como texto.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "test",
            "title": "1 · Comprueba búsqueda y filtro",
            "purpose": "Prueba un término sin coincidencias.",
            "language": "javascript",
            "code": "const fixture = {\"name\": \"Cliente QA\", \"email\": \"qa@example.test\", \"phone\": \"000\"};\nlet created;\ntry{\n  created=await db('add',fixture);\n  assert((await db('list')).some(r=>r.id===created.id),'Registro persistido');\n  let duplicateRejected=false;\n  try{await db('add',fixture);}catch(e){duplicateRejected=true;}\n  assert(duplicateRejected,'Duplicado rechazado');\n  let invalidRejected=false;\n  try{await db('add',{\"name\": \"\", \"email\": \"bad\", \"phone\": \"\"});}catch(e){invalidRejected=true;}\n  assert(invalidRejected,'Entrada inválida rechazada');\n  console.log('PASS: alta, lectura, índice único y validación reales');\n}finally{if(created)await db('delete',{id:created.id});await renderRecords();}\n\ndocument.querySelector(\"#search\").value=\"NO_MATCH_123456\";await renderRecords();assert(document.querySelectorAll(\"#rows tr\").length===0,\"Estado vacío\");document.querySelector(\"#search\").value=\"\";await renderRecords();console.log(\"PASS C3: búsqueda sin coincidencias\")",
            "steps": [
              "Prueba un término sin coincidencias.",
              "Comprueba que el estado vacío no es un fallo."
            ],
            "part": null
          },
          {
            "id": "export",
            "title": "2 · Prepara la aplicación portable",
            "purpose": "Descarga la aplicación y los datos JSON.",
            "language": "javascript",
            "code": "console.log(\"EXPORT: descarga la app HTML y los datos JSON desde el taller\");\nassert(typeof db === \"function\",\"Adaptador de base disponible\");",
            "steps": [
              "Descarga la aplicación y los datos JSON.",
              "Abre el HTML en otra carpeta sin conexión.",
              "La base exportada es local al archivo/origen; conserva JSON como respaldo."
            ],
            "part": null
          }
        ]
      },
      {
        "title": "4 · QA y defensa del producto",
        "lead": "Una aplicación se verifica con entrada válida, inválida, duplicada, vacía y persistencia.",
        "theory": [
          "Una aplicación se verifica con entrada válida, inválida, duplicada, vacía y persistencia.",
          "El registro local no implementa usuarios, permisos ni una base multiusuario. Esa ampliación requiere definir un backend."
        ],
        "gate": "CRUD, filtros, recarga y entrega comprobados.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "test",
            "title": "1 · Regresión de datos",
            "purpose": "Ejecuta las pruebas otra vez.",
            "language": "javascript",
            "code": "const fixture = {\"name\": \"Cliente QA\", \"email\": \"qa@example.test\", \"phone\": \"000\"};\nlet created;\ntry{\n  created=await db('add',fixture);\n  assert((await db('list')).some(r=>r.id===created.id),'Registro persistido');\n  let duplicateRejected=false;\n  try{await db('add',fixture);}catch(e){duplicateRejected=true;}\n  assert(duplicateRejected,'Duplicado rechazado');\n  let invalidRejected=false;\n  try{await db('add',{\"name\": \"\", \"email\": \"bad\", \"phone\": \"\"});}catch(e){invalidRejected=true;}\n  assert(invalidRejected,'Entrada inválida rechazada');\n  console.log('PASS: alta, lectura, índice único y validación reales');\n}finally{if(created)await db('delete',{id:created.id});await renderRecords();}\n",
            "steps": [
              "Ejecuta las pruebas otra vez.",
              "Comprueba que no aparecen duplicados ni fixtures de QA."
            ],
            "part": null
          },
          {
            "id": "modify",
            "title": "2 · Defiende tu implementación",
            "purpose": "Modifica HTML/CSS y vuelve a ejecutar.",
            "language": "javascript",
            "code": "await renderRecords();console.log(\"DEFENSE:\",(await db(\"list\")).length,\"registros locales\");assert(document.querySelector(\"#recordForm\"),\"Producto funcional\");",
            "steps": [
              "Modifica HTML/CSS y vuelve a ejecutar.",
              "Demuestra registro, búsqueda, borrado y persistencia.",
              "Entrega app, fuentes, datos y evidencia."
            ],
            "part": null
          }
        ]
      }
    ]
  },
  "gta": {
    "title": "GTA V · Catálogo y compatibilidad",
    "mode": "web",
    "note": "HTML, CSS y JavaScript reales en vista previa aislada. IndexedDB conserva datos ficticios en este navegador; no es una base compartida en la nube.",
    "classes": [
      {
        "title": "1 · HTML semántico e interfaz",
        "lead": "HTML define estructura y etiquetas; CSS presenta esa estructura.",
        "theory": [
          "HTML define estructura y etiquetas; CSS presenta esa estructura.",
          "Cada input tiene un nombre que corresponde al modelo de datos."
        ],
        "gate": "Formulario accesible y diseño adaptable.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "html",
            "title": "1 · Construye el HTML",
            "purpose": "Edita el título y los labels.",
            "language": "html",
            "code": "<main><header><p>Seminario 11 · Catálogo de ejemplos ficticios</p><h1>GTA V · Mod Showcase</h1><p>Organiza requisitos y compatibilidad; no descarga ni instala mods.</p></header>\n<form id=\"recordForm\"><label>Nombre<input name=\"name\" required maxlength=\"80\"></label><label>Categoría<select name=\"category\"><option value=\"graphics\">Gráficos</option><option value=\"vehicles\">Vehículos</option><option value=\"tools\">Herramientas</option></select></label><label>Build compatible<input name=\"build\" required value=\"build-demo-a\"></label><label>Requisitos<input name=\"requirements\" required value=\"Ejemplo del laboratorio\"></label><button>Guardar mod</button></form>\n<p id=\"status\" role=\"status\"></p><label>Buscar<input id=\"search\" placeholder=\"Nombre, categoría o build\"></label><label>Filtrar categoría<select id=\"categoryFilter\"><option value=\"\">Todas</option><option value=\"graphics\">Gráficos</option><option value=\"vehicles\">Vehículos</option><option value=\"tools\">Herramientas</option></select></label><table><thead><tr><th>Nombre</th><th>Categoría</th><th>Build</th><th>Requisitos</th><th>Acción</th></tr></thead><tbody id=\"rows\"></tbody></table></main>",
            "steps": [
              "Edita el título y los labels.",
              "Ejecuta y observa la página real.",
              "Relaciona name con el modelo de datos."
            ],
            "part": "html"
          },
          {
            "id": "css",
            "title": "2 · Diseña la interfaz",
            "purpose": "Cambia color o distribución.",
            "language": "css",
            "code": "*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font-family:Arial,sans-serif}main{max-width:1000px;margin:auto;padding:24px}header{border-bottom:3px solid #1a73e8;margin-bottom:20px}h1{font-size:32px}form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:20px;background:white;border:1px solid #d6dce6;border-radius:12px}label{display:grid;gap:6px;font-size:13px;margin:8px 0}input,select,button{padding:11px;border:1px solid #c4cddd;border-radius:6px;font:inherit;min-width:0}button{background:#1a73e8;color:white;cursor:pointer}table{width:100%;margin-top:20px;background:white;border-collapse:collapse;font-size:13px}th,td{border-bottom:1px solid #d6dce6;padding:10px;text-align:left;overflow-wrap:anywhere}#status{min-height:24px;color:#174ea6}@media(max-width:600px){form{grid-template-columns:1fr}main{padding:12px}table{font-size:11px}th,td{padding:6px}}",
            "steps": [
              "Cambia color o distribución.",
              "Ejecuta y verifica en un ancho pequeño."
            ],
            "part": "css"
          },
          {
            "id": "test",
            "title": "3 · Prueba la estructura",
            "purpose": "Comprueba elementos reales del DOM.",
            "language": "javascript",
            "code": "assert(document.querySelector(\"#recordForm\"),\"Formulario\")\nassert(document.querySelector(\"input[name=name]\"),\"Nombre etiquetado\")\nassert(document.querySelector(\"#rows\"),\"Tabla de resultados\")\nconsole.log(\"PASS C1: formulario, nombre y tabla\")",
            "steps": [
              "Comprueba elementos reales del DOM.",
              "Una falta de id debe producir un error."
            ],
            "part": null
          }
        ]
      },
      {
        "title": "2 · Registro y persistencia",
        "lead": "JavaScript conecta eventos, validación y transacciones.",
        "theory": [
          "JavaScript conecta eventos, validación y transacciones.",
          "IndexedDB usa una clave y un índice único; el alta se confirma al completar la transacción."
        ],
        "gate": "Alta y listado reales; rechazo de duplicados.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "app",
            "title": "1 · Conecta la base de datos",
            "purpose": "Lee db(add), db(list) y db(delete).",
            "language": "javascript",
            "code": "const fields = [\"name\", \"category\", \"build\", \"requirements\"];\nconst form = document.querySelector('#recordForm');\nconst status = document.querySelector('#status');\nasync function render(){\n  const all = await db('list');\n  const query = document.querySelector('#search').value.trim().toLowerCase();\n  const category = document.querySelector('#categoryFilter')?.value || '';\n  const rows = all.filter(r => fields.some(f => String(r[f]).toLowerCase().includes(query)) && (!category || r.category === category));\n  const body = document.querySelector('#rows');body.replaceChildren();\n  for(const record of rows){\n    const tr = document.createElement('tr');\n    for(const field of fields){const td=document.createElement('td');td.textContent=record[field];tr.appendChild(td);}\n    const td=document.createElement('td');const button=document.createElement('button');button.textContent='Eliminar';\n    button.onclick=async()=>{await db('delete',{id:record.id});await render();};td.appendChild(button);tr.appendChild(td);body.appendChild(tr);\n  }\n}\nform.onsubmit=async event=>{\n  event.preventDefault();\n  try{const row=Object.fromEntries(new FormData(form));await db('add',row);form.reset();status.textContent='Guardado en la base local';await render();}\n  catch(error){status.textContent=error.message;}\n};\ndocument.querySelector('#search').oninput=render;\nif(document.querySelector('#categoryFilter'))document.querySelector('#categoryFilter').onchange=render;\nawait render();\nwindow.renderRecords=render;\nconsole.log('BUILD: formulario conectado a IndexedDB; '+(await db('list')).length+' registros');",
            "steps": [
              "Lee db(add), db(list) y db(delete).",
              "Ejecuta y registra un dato ficticio.",
              "Recarga el taller: la base se conserva en este navegador."
            ],
            "part": "js"
          },
          {
            "id": "test",
            "title": "2 · Prueba CRUD y validación",
            "purpose": "Ejecuta alta/lectura/borrado con un fixture.",
            "language": "javascript",
            "code": "const fixture = {\"name\": \"Mod QA\", \"category\": \"graphics\", \"build\": \"build-demo-a\", \"requirements\": \"Dataset ficticio\"};\nlet created;\ntry{\n  created=await db('add',fixture);\n  assert((await db('list')).some(r=>r.id===created.id),'Registro persistido');\n  let duplicateRejected=false;\n  try{await db('add',fixture);}catch(e){duplicateRejected=true;}\n  assert(duplicateRejected,'Duplicado rechazado');\n  let invalidRejected=false;\n  try{await db('add',{\"name\": \"\", \"category\": \"invalid\", \"build\": \"\", \"requirements\": \"\"});}catch(e){invalidRejected=true;}\n  assert(invalidRejected,'Entrada inválida rechazada');\n  console.log('PASS: alta, lectura, índice único y validación reales');\n}finally{if(created)await db('delete',{id:created.id});await renderRecords();}\n",
            "steps": [
              "Ejecuta alta/lectura/borrado con un fixture.",
              "Verifica el error de duplicado.",
              "La prueba limpia únicamente el registro que creó."
            ],
            "part": null
          }
        ]
      },
      {
        "title": "3 · Búsqueda, contenido seguro y entrega",
        "lead": "Los valores se dibujan con textContent: un dato no se interpreta como HTML.",
        "theory": [
          "Los valores se dibujan con textContent: un dato no se interpreta como HTML.",
          "Búsqueda y filtros operan sobre los registros de la base. El HTML exportado conserva la app y crea su propia base local."
        ],
        "gate": "Búsqueda real y datos representados como texto.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "test",
            "title": "1 · Comprueba búsqueda y filtro",
            "purpose": "Prueba un término sin coincidencias.",
            "language": "javascript",
            "code": "const fixture = {\"name\": \"Mod QA\", \"category\": \"graphics\", \"build\": \"build-demo-a\", \"requirements\": \"Dataset ficticio\"};\nlet created;\ntry{\n  created=await db('add',fixture);\n  assert((await db('list')).some(r=>r.id===created.id),'Registro persistido');\n  let duplicateRejected=false;\n  try{await db('add',fixture);}catch(e){duplicateRejected=true;}\n  assert(duplicateRejected,'Duplicado rechazado');\n  let invalidRejected=false;\n  try{await db('add',{\"name\": \"\", \"category\": \"invalid\", \"build\": \"\", \"requirements\": \"\"});}catch(e){invalidRejected=true;}\n  assert(invalidRejected,'Entrada inválida rechazada');\n  console.log('PASS: alta, lectura, índice único y validación reales');\n}finally{if(created)await db('delete',{id:created.id});await renderRecords();}\n\ndocument.querySelector(\"#search\").value=\"NO_MATCH_123456\";await renderRecords();assert(document.querySelectorAll(\"#rows tr\").length===0,\"Estado vacío\");document.querySelector(\"#search\").value=\"\";await renderRecords();console.log(\"PASS C3: búsqueda sin coincidencias\")",
            "steps": [
              "Prueba un término sin coincidencias.",
              "Comprueba que el estado vacío no es un fallo."
            ],
            "part": null
          },
          {
            "id": "export",
            "title": "2 · Prepara la aplicación portable",
            "purpose": "Descarga la aplicación y los datos JSON.",
            "language": "javascript",
            "code": "console.log(\"EXPORT: descarga la app HTML y los datos JSON desde el taller\");\nassert(typeof db === \"function\",\"Adaptador de base disponible\");",
            "steps": [
              "Descarga la aplicación y los datos JSON.",
              "Abre el HTML en otra carpeta sin conexión.",
              "La base exportada es local al archivo/origen; conserva JSON como respaldo."
            ],
            "part": null
          }
        ]
      },
      {
        "title": "4 · QA y defensa del producto",
        "lead": "Una aplicación se verifica con entrada válida, inválida, duplicada, vacía y persistencia.",
        "theory": [
          "Una aplicación se verifica con entrada válida, inválida, duplicada, vacía y persistencia.",
          "El registro local no implementa usuarios, permisos ni una base multiusuario. Esa ampliación requiere definir un backend."
        ],
        "gate": "CRUD, filtros, recarga y entrega comprobados.",
        "uml": [
          "Modelo → implementación → prueba → evidencia",
          "Datos y responsabilidades explícitos",
          "Construir · validar · exportar"
        ],
        "cells": [
          {
            "id": "test",
            "title": "1 · Regresión de datos",
            "purpose": "Ejecuta las pruebas otra vez.",
            "language": "javascript",
            "code": "const fixture = {\"name\": \"Mod QA\", \"category\": \"graphics\", \"build\": \"build-demo-a\", \"requirements\": \"Dataset ficticio\"};\nlet created;\ntry{\n  created=await db('add',fixture);\n  assert((await db('list')).some(r=>r.id===created.id),'Registro persistido');\n  let duplicateRejected=false;\n  try{await db('add',fixture);}catch(e){duplicateRejected=true;}\n  assert(duplicateRejected,'Duplicado rechazado');\n  let invalidRejected=false;\n  try{await db('add',{\"name\": \"\", \"category\": \"invalid\", \"build\": \"\", \"requirements\": \"\"});}catch(e){invalidRejected=true;}\n  assert(invalidRejected,'Entrada inválida rechazada');\n  console.log('PASS: alta, lectura, índice único y validación reales');\n}finally{if(created)await db('delete',{id:created.id});await renderRecords();}\n",
            "steps": [
              "Ejecuta las pruebas otra vez.",
              "Comprueba que no aparecen duplicados ni fixtures de QA."
            ],
            "part": null
          },
          {
            "id": "modify",
            "title": "2 · Defiende tu implementación",
            "purpose": "Modifica HTML/CSS y vuelve a ejecutar.",
            "language": "javascript",
            "code": "await renderRecords();console.log(\"DEFENSE:\",(await db(\"list\")).length,\"registros locales\");assert(document.querySelector(\"#recordForm\"),\"Producto funcional\");",
            "steps": [
              "Modifica HTML/CSS y vuelve a ejecutar.",
              "Demuestra registro, búsqueda, borrado y persistencia.",
              "Entrega app, fuentes, datos y evidencia."
            ],
            "part": null
          }
        ]
      }
    ]
  }
};
window.STUDIO_SUPPORT = {"serverTail": "\nfrom http.server import BaseHTTPRequestHandler, ThreadingHTTPServer\nfrom urllib.parse import urlsplit, parse_qs\nfrom threading import Lock\nimport time\n\nlive_policy = Policy()\nlock = Lock()\nclass Handler(BaseHTTPRequestHandler):\n    def do_GET(self):\n        parts = urlsplit(self.path)\n        q = parse_qs(parts.query)\n        request = Request(self.client_address[0], time.monotonic(),\n                          parts.path, q.get(\"user\", [\"ana\"])[0],\n                          q.get(\"payload\", [\"demo\"])[0])\n        with lock:\n            status = live_policy.handle(request)\n        self.send_response(status)\n        self.send_header(\"Content-Type\", \"application/json; charset=utf-8\")\n        self.end_headers()\n        self.wfile.write(json.dumps({\"status\": status, \"path\": parts.path}).encode())\n\nif __name__ == \"__main__\":\n    print(\"Laboratorio HTTP local: http://127.0.0.1:8765 · Ctrl+C para cerrar\")\n    ThreadingHTTPServer((\"127.0.0.1\", 8765), Handler).serve_forever()\n", "probe": "import urllib.request, urllib.error, time\ndef status(path):\n    try:\n        return urllib.request.urlopen(\"http://127.0.0.1:8765\" + path, timeout=3).status\n    except urllib.error.HTTPError as e:\n        return e.code\ncodes = [status(\"/api/report\") for _ in range(6)]\nassert codes == [200, 200, 200, 429, 429, 429], codes\ntime.sleep(2.1)\nassert status(\"/api/report\") == 200\nassert status(\"/api/records/1?user=bruno\") == 403\nassert status(\"/api/report?payload=\" + \"x\" * 101) == 400\nprint(\"PASS: HTTP real · límite, recuperación, autorización y tamaño\")\n"};
