const DIAGNOSTIC_CONFIG={course:"Estadística / Programación 11°",period:"2026-2",totalQuestions:15,secondsPerQuestion:60,teacherPassword:"est11-docente-2026",groups:["11A","11B","11C"]};
const QUESTIONS=[
{id:1,topic:"Lectura de tablas",answer:"B",skill:"Extraer información de una tabla"},
{id:2,topic:"Gráficas estadísticas",answer:"C",skill:"Interpretar tendencias y frecuencias"},
{id:3,topic:"Porcentajes",answer:"A",skill:"Calcular proporciones y variaciones"},
{id:4,topic:"Media aritmética",answer:"D",skill:"Calcular e interpretar promedio"},
{id:5,topic:"Mediana y moda",answer:"B",skill:"Reconocer medidas de tendencia central"},
{id:6,topic:"Rango y dispersión",answer:"A",skill:"Interpretar variabilidad básica"},
{id:7,topic:"Probabilidad básica",answer:"C",skill:"Relacionar casos favorables y posibles"},
{id:8,topic:"Muestreo",answer:"D",skill:"Diferenciar población, muestra y variable"},
{id:9,topic:"Variables",answer:"B",skill:"Clasificar variables cualitativas y cuantitativas"},
{id:10,topic:"Lógica computacional",answer:"A",skill:"Reconocer condiciones y secuencias"},
{id:11,topic:"Algoritmos",answer:"C",skill:"Interpretar pasos ordenados para resolver un problema"},
{id:12,topic:"Pseudocódigo",answer:"B",skill:"Leer instrucciones básicas de programación"},
{id:13,topic:"Estructuras de datos",answer:"D",skill:"Reconocer listas o tablas de datos"},
{id:14,topic:"Interpretación de resultados",answer:"A",skill:"Tomar conclusiones a partir de evidencia"},
{id:15,topic:"Resolución de problemas",answer:"C",skill:"Seleccionar procedimiento estadístico-computacional"}
];
const GROUP_RESULTS={"11A":{students:0,average:null,questions:QUESTIONS.map(q=>({id:q.id,correctPercent:null,dominantError:"Pendiente por cargar resultados"}))},"11B":{students:0,average:null,questions:QUESTIONS.map(q=>({id:q.id,correctPercent:null,dominantError:"Pendiente por cargar resultados"}))},"11C":{students:0,average:null,questions:QUESTIONS.map(q=>({id:q.id,correctPercent:null,dominantError:"Pendiente por cargar resultados"}))}};
const INDIVIDUAL_RESULTS={"11A":{},"11B":{},"11C":{}};