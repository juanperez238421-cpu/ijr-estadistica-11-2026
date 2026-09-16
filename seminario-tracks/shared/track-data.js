globalThis.IJR_SPECIALIZED_TRACKS={
  web:{
    slug:'web',title:'Web Development',project:'Web Management System',
    stack:['HTML','CSS','JavaScript','DOM','Fetch / localStorage'],
    diagnostic:{totalQuestions:15,scoredQuestions:12,selfProfileQuestions:3,domains:['foundations','applied_reasoning','workflow_tools'],version:'2026-09-05-v3'},
    stages:[
      {n:1,title:'Web foundations',focus:'Structure, style and interaction',theory:'Understand the responsibility of HTML, CSS and JavaScript before combining them.',concepts:['Semantic HTML gives meaning and structure to content.','CSS controls presentation and responsive layout.','DOM events connect user actions with JavaScript behavior.'],lab:'Build a small interactive status card without frameworks.',language:'HTML + JavaScript',code:`<section class="status-card">
  <h2 id="status">Ready</h2>
  <button id="toggle">Change status</button>
</section>

<script>
const status = document.querySelector('#status');
document.querySelector('#toggle').addEventListener('click', () => {
  status.textContent = status.textContent === 'Ready' ? 'Working' : 'Ready';
});
</script>`},
      {n:2,title:'DOM + validation + persistence',focus:'Inputs become safe application state',theory:'Treat user input as data that must be read, validated and deliberately persisted.',concepts:['Read form values explicitly from the DOM.','Validate type, range and required fields before using data.','localStorage is useful for small browser-only prototypes, not sensitive data.'],lab:'Validate an age field and persist a valid value.',language:'JavaScript',code:`const ageInput = document.querySelector('#age');
const saveButton = document.querySelector('#save');

saveButton.addEventListener('click', () => {
  const age = Number(ageInput.value);
  if (!Number.isInteger(age) || age < 5 || age > 120) {
    return console.log('Invalid age');
  }
  localStorage.setItem('age', String(age));
  console.log('Saved:', age);
});`},
      {n:3,title:'Async data + debugging + accessibility',focus:'Observe behavior and recover from failure',theory:'A web app must handle delayed operations, inspect failures and remain usable with semantic controls.',concepts:['fetch() is asynchronous and should handle success and failure states.','Debug from evidence: console, network response and variable values.','Use semantic elements, labels and keyboard-accessible controls.'],lab:'Fetch JSON with a loading/error state and render text safely.',language:'JavaScript',code:`async function loadUser() {
  const output = document.querySelector('#output');
  output.textContent = 'Loading…';
  try {
    const response = await fetch('./user.json');
    if (!response.ok) throw new Error('Request failed');
    const user = await response.json();
    output.textContent = user.name;
  } catch (error) {
    output.textContent = 'Could not load data';
    console.error(error);
  }
}`},
      {n:4,title:'Git + safe rendering + OOP architecture',focus:'Turn features into a maintainable system',theory:'Organize the project so domain rules, interface code and persistence have clear responsibilities.',concepts:['A Git commit should represent a meaningful, reviewable change.','Prefer textContent when displaying untrusted user text.','Classes should model domain responsibility, not merely wrap DOM code.'],lab:'Model one domain object with validation and a small repository.',language:'JavaScript',code:`class Task {
  constructor(title) {
    if (!title?.trim()) throw new Error('Title required');
    this.title = title.trim();
    this.done = false;
  }
  complete() { this.done = true; }
}

const tasks = [];
tasks.push(new Task('Prepare demo'));
tasks[0].complete();
console.log(tasks);`}
    ],
    sprints:[
      {n:1,title:'Problem + MVP',goal:'Define user, problem, input/process/output and minimum useful feature.',deliverable:'README problem statement + backlog'},
      {n:2,title:'Data model + UML V1',goal:'Model domain objects before interface logic.',deliverable:'UML V1 + object examples'},
      {n:3,title:'Interface prototype',goal:'Build semantic HTML and responsive layout.',deliverable:'Navigable UI shell'},
      {n:4,title:'OOP integration',goal:'Implement domain classes and connect them to DOM events.',deliverable:'Working class-based feature'},
      {n:5,title:'Persistence + validation',goal:'Validate inputs and persist meaningful state.',deliverable:'localStorage/JSON flow + invalid case'},
      {n:6,title:'Testing',goal:'Test valid, invalid and boundary scenarios.',deliverable:'Test checklist + fixes'},
      {n:7,title:'Refactor + accessibility',goal:'Improve structure, naming, reuse and UI states.',deliverable:'Refactor commit + UML V2'},
      {n:8,title:'Release + defense',goal:'Publish MVP and defend architecture live.',deliverable:'Release URL + final UML + defense'}
    ]
  },
  'data-science':{
    slug:'data-science',title:'Python & Data Science',project:'Data Analysis Studio',
    stack:['Python','CSV','Pandas','Matplotlib','Descriptive statistics'],
    diagnostic:{totalQuestions:15,scoredQuestions:12,selfProfileQuestions:3,domains:['foundations','applied_reasoning','workflow_tools'],version:'2026-09-05-v3'},
    stages:[
      {n:1,title:'Data foundations',focus:'Rows, columns, types and Python collections',theory:'Before statistics, understand what the dataset represents and how Python stores observations.',concepts:['Rows usually represent observations and columns represent variables.','Lists preserve an ordered collection of values.','CSV files are tabular text files and require a clear data dictionary.'],lab:'Create a tiny dataset and inspect each variable.',language:'Python',code:`students = [
    {"name": "Ana", "score": 4.2},
    {"name": "Luis", "score": 3.7},
    {"name": "Sara", "score": 4.6},
]

for row in students:
    print(row["name"], row["score"])`},
      {n:2,title:'Statistics + data quality',focus:'Choose measures only after inspecting the data',theory:'Missing values, outliers and distribution shape affect which summaries are meaningful.',concepts:['The median is resistant to extreme values.','Missing values require a justified decision, not automatic deletion.','Correlation alone does not establish causation.'],lab:'Compare mean and median before and after an extreme value.',language:'Python',code:`import statistics as stats

values = [10, 11, 11, 12, 12, 13, 90]
print("mean:", round(stats.mean(values), 2))
print("median:", stats.median(values))

clean_view = [v for v in values if v < 50]
print("reviewed mean:", round(stats.mean(clean_view), 2))`},
      {n:3,title:'Pandas + visualization + outliers',focus:'Inspect before filtering or plotting',theory:'Use DataFrames to inspect data quality, then select a visualization that matches the variable and question.',concepts:['A pandas DataFrame is a labeled tabular data structure.','Investigate an outlier before deciding whether it is an error or valid observation.','Histograms and boxplots reveal different aspects of numerical distributions.'],lab:'Load a CSV, inspect nulls and plot one numerical variable.',language:'Python',code:`import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("data.csv")
print(df.head())
print(df.isna().sum())

df["value"].dropna().plot(kind="hist", bins=8)
plt.xlabel("value")
plt.show()`},
      {n:4,title:'Reproducible analysis + OOP',focus:'Separate data loading, analysis and reporting',theory:'A strong analysis can be rerun from raw data to result and explains why each statistic or chart is appropriate.',concepts:['Keep loading, cleaning, analysis and presentation as explicit steps.','Label charts with units and context.','OOP is useful when reusable responsibilities such as Dataset and Analyzer are clear.'],lab:'Encapsulate a simple descriptive analysis in a class.',language:'Python',code:`import pandas as pd

class Analyzer:
    def __init__(self, frame):
        self.frame = frame

    def summary(self, column):
        series = self.frame[column].dropna()
        return {
            "count": int(series.count()),
            "mean": float(series.mean()),
            "median": float(series.median()),
        }

df = pd.read_csv("data.csv")
print(Analyzer(df).summary("value"))`}
    ],
    sprints:[
      {n:1,title:'Question + dataset',goal:'Define one answerable question and obtain a suitable dataset.',deliverable:'Question + data dictionary'},
      {n:2,title:'Pipeline + UML V1',goal:'Model Dataset, Cleaner, Analyzer and Report responsibilities.',deliverable:'UML V1 + pipeline sketch'},
      {n:3,title:'Load + inspect',goal:'Read data, identify types, nulls and quality issues.',deliverable:'Reproducible notebook/script'},
      {n:4,title:'OOP analysis layer',goal:'Move reusable analysis behavior into classes.',deliverable:'Dataset/Analyzer classes'},
      {n:5,title:'Statistics + visualization',goal:'Calculate descriptive measures and create justified plots.',deliverable:'Evidence table + charts'},
      {n:6,title:'Validation',goal:'Check assumptions, edge cases and reproducibility.',deliverable:'Validation cells/tests'},
      {n:7,title:'Refactor + report',goal:'Separate data, analysis and presentation responsibilities.',deliverable:'UML V2 + concise findings'},
      {n:8,title:'Release + defense',goal:'Present evidence-based conclusions and defend code architecture.',deliverable:'Final notebook/app + UML + defense'}
    ]
  },
  cybersecurity:{
    slug:'cybersecurity',title:'Defensive Cybersecurity',project:'Secure Application / Security Audit Simulator',
    stack:['Python / Web','Input validation','Authentication concepts','Logging','Threat modeling'],
    diagnostic:{totalQuestions:15,scoredQuestions:12,selfProfileQuestions:3,domains:['foundations','applied_reasoning','workflow_tools'],version:'2026-09-05-v3'},
    stages:[
      {n:1,title:'Security foundations',focus:'CIA, authorization and least privilege',theory:'Security work in this track is defensive, authorized and focused on reducing risk in systems you control.',concepts:['CIA means confidentiality, integrity and availability.','Authentication asks who you are; authorization asks what you may do.','Least privilege grants only the access required for a role.'],lab:'Represent roles and permissions for a local simulation.',language:'Python',code:`permissions = {
    "student": {"read"},
    "teacher": {"read", "grade"},
    "admin": {"read", "grade", "manage"},
}

def allowed(role, action):
    return action in permissions.get(role, set())

print(allowed("student", "manage"))`},
      {n:2,title:'Validation + access decisions',focus:'Reject malformed input before processing it',theory:'Defensive applications define acceptable input and verify authorization at the protected operation.',concepts:['Prefer allow-list validation when a field has a known format.','Validate at trust boundaries, not only in the interface.','Check role/permission before performing a protected action.'],lab:'Validate a six-digit code and authorize an action.',language:'Python',code:`def valid_code(value):
    return isinstance(value, str) and value.isdigit() and len(value) == 6

def can_open_admin(role):
    return role == "admin"

print(valid_code("104829"))
print(can_open_admin("student"))`},
      {n:3,title:'Audit logs + secrets + password concepts',focus:'Create evidence without exposing sensitive information',theory:'Security logs should record relevant events while repositories and outputs avoid exposing credentials or secrets.',concepts:['Audit logs record who did what, when and whether it succeeded.','Real passwords should be stored with an appropriate password-hashing scheme, not plaintext.','Secrets do not belong in public source files or repositories.'],lab:'Record a minimal local audit event without a password.',language:'Python',code:`from datetime import datetime, timezone

audit_log = []

def record_event(user, action, ok):
    audit_log.append({
        "time": datetime.now(timezone.utc).isoformat(),
        "user": user,
        "action": action,
        "ok": bool(ok),
    })

record_event("student-01", "open_report", False)
print(audit_log[-1])`},
      {n:4,title:'Threat modeling + defensive architecture',focus:'Separate policy, validation and audit responsibilities',theory:'A threat model identifies assets, trust boundaries, plausible risks and mitigations before implementation changes.',concepts:['Threat modeling is structured risk analysis, not attacking external targets.','Generic login errors can reduce unnecessary account information disclosure.','Separate Validator, AccessPolicy and AuditLog responsibilities in OOP.'],lab:'Model a small defensive service with explicit policy checks.',language:'Python',code:`class AccessPolicy:
    def may_view(self, role):
        return role in {"teacher", "admin"}

class ReportService:
    def __init__(self, policy):
        self.policy = policy

    def open_report(self, role):
        if not self.policy.may_view(role):
            return {"ok": False, "message": "Access denied"}
        return {"ok": True, "message": "Report opened"}

print(ReportService(AccessPolicy()).open_report("student"))`}
    ],
    sprints:[
      {n:1,title:'Asset + threat scope',goal:'Define what is protected and only defensive, authorized scenarios.',deliverable:'Asset list + threat model'},
      {n:2,title:'Security objects + UML V1',goal:'Model User, Role, Session, Validator and AuditLog.',deliverable:'UML V1 + trust boundaries'},
      {n:3,title:'Validation layer',goal:'Implement allow-list validation and safe error handling.',deliverable:'Valid/invalid input tests'},
      {n:4,title:'OOP security services',goal:'Separate authentication/authorization simulation from UI.',deliverable:'Service classes + policy rules'},
      {n:5,title:'Logging + least privilege',goal:'Record security-relevant events and enforce role boundaries.',deliverable:'Audit trail + access matrix'},
      {n:6,title:'Defensive testing',goal:'Test expected misuse without attacking external systems.',deliverable:'Authorized test cases + fixes'},
      {n:7,title:'Hardening + refactor',goal:'Reduce exposed state, duplicate checks and ambiguous privileges.',deliverable:'Hardening commit + UML V2'},
      {n:8,title:'Security review + defense',goal:'Explain risks, mitigations and residual limitations.',deliverable:'Security report + final UML + defense'}
    ]
  },
  '3d-programming':{
    slug:'3d-programming',title:'3D Design + Programming',project:'Parametric 3D Generator',
    stack:['Python / Three.js / CAD scripting','Coordinates','Parametric geometry','Transformations','Assemblies'],
    diagnostic:{totalQuestions:15,scoredQuestions:12,selfProfileQuestions:3,domains:['foundations','applied_reasoning','workflow_tools'],version:'2026-09-05-v3'},
    stages:[
      {n:1,title:'Coordinates + parameters + primitives',focus:'Represent geometry numerically',theory:'Parametric geometry is controlled by named dimensions so one model can generate many valid variants.',concepts:['A 3D point uses x, y and z coordinates.','Parameters describe dimensions or rules that can change.','Primitives such as boxes, cylinders and spheres are reusable building blocks.'],lab:'Represent a parametric box and compute its volume.',language:'Python',code:`class Box:
    def __init__(self, width, depth, height):
        self.width = width
        self.depth = depth
        self.height = height

    def volume(self):
        return self.width * self.depth * self.height

part = Box(40, 20, 10)
print(part.volume(), "mm^3")`},
      {n:2,title:'Transformations',focus:'Translation, scaling and rotation',theory:'Transformations modify position, size or orientation while preserving a clear coordinate convention.',concepts:['Translation changes position.','Scaling changes size by a factor.','Rotation requires an angle and an axis or reference frame.'],lab:'Apply a translation to a 3D point.',language:'Python',code:`def translate(point, dx=0, dy=0, dz=0):
    x, y, z = point
    return (x + dx, y + dy, z + dz)

p0 = (10, 5, 0)
p1 = translate(p0, dx=15, dz=8)
print(p1)`},
      {n:3,title:'Extrusion + validation + units',focus:'Generate only valid geometry',theory:'A generator should reject impossible dimensions and keep units explicit and consistent through every operation.',concepts:['Extrusion extends a 2D profile through a distance.','Negative or zero physical dimensions usually require validation.','Mixing millimeters, centimeters and meters silently creates incorrect geometry.'],lab:'Validate dimensions before generating a solid.',language:'Python',code:`def positive_mm(name, value):
    value = float(value)
    if value <= 0:
        raise ValueError(f"{name} must be > 0 mm")
    return value

width = positive_mm("width", 25)
height = positive_mm("height", 12)
depth = positive_mm("depth", 6)
print(width, height, depth)`},
      {n:4,title:'Assemblies + export + OOP architecture',focus:'Compose reusable parts and prepare output',theory:'Assemblies combine parts through relationships; export is the final representation step, not the geometry model itself.',concepts:['Composition lets a larger object own reusable parts.','STL is common for triangle-mesh export in 3D printing workflows.','Separate geometry data, transforms and export responsibilities in OOP.'],lab:'Compose named parts into a simple assembly model.',language:'Python',code:`class Part:
    def __init__(self, name):
        self.name = name

class Assembly:
    def __init__(self, name):
        self.name = name
        self.parts = []

    def add(self, part):
        self.parts.append(part)

robot = Assembly("robot")
robot.add(Part("base"))
robot.add(Part("arm"))
print([p.name for p in robot.parts])`}
    ],
    sprints:[
      {n:1,title:'Geometry requirement',goal:'Define dimensions, parameters and expected generated object.',deliverable:'Dimension sheet + MVP'},
      {n:2,title:'Geometry objects + UML V1',goal:'Model Shape, Solid, Transform and Assembly.',deliverable:'UML V1 + coordinate convention'},
      {n:3,title:'Primitive generator',goal:'Create parameter-driven base geometry.',deliverable:'First generated model'},
      {n:4,title:'OOP transformations',goal:'Encapsulate translation, rotation, scale or extrusion behavior.',deliverable:'Reusable geometry classes'},
      {n:5,title:'Composition',goal:'Build a larger object from reusable parts.',deliverable:'Assembly model + UML relation'},
      {n:6,title:'Validation',goal:'Reject invalid dimensions and verify geometric constraints.',deliverable:'Boundary tests'},
      {n:7,title:'Refactor + export',goal:'Improve reuse and create a consistent export/render flow.',deliverable:'UML V2 + exported artifact'},
      {n:8,title:'Demo + defense',goal:'Change a parameter live and explain architecture.',deliverable:'Final model + UML + live modification'}
    ]
  },
  robotics:{
    slug:'robotics',title:'Robotics & Automation',project:'Automation System',
    stack:['Python / MicroPython / Arduino','Sensors','Actuators','State machines','Control logic'],
    diagnostic:{totalQuestions:15,scoredQuestions:12,selfProfileQuestions:3,domains:['foundations','applied_reasoning','workflow_tools'],version:'2026-09-05-v3'},
    stages:[
      {n:1,title:'Sensors + actuators + I/O loop',focus:'Measure, decide and act',theory:'Automation begins by distinguishing what the system senses, how it decides and what physical or simulated output it commands.',concepts:['Sensors measure or detect a condition.','Actuators produce an action such as motion, light or sound.','A useful control loop is input → decision → output.'],lab:'Simulate a temperature controller without hardware.',language:'Python',code:`temperature = 31
limit = 28

fan_on = temperature > limit
print({
    "sensor": temperature,
    "decision": "cool" if fan_on else "idle",
    "actuator": "fan on" if fan_on else "fan off",
})`},
      {n:2,title:'State machines + robust control',focus:'Make system behavior explicit',theory:'A state machine defines allowed states and transitions; robust control also defines what happens when input is invalid.',concepts:['State describes the current operating mode.','Transitions occur only when defined conditions are met.','A fail-safe moves the system toward a safer state when information is invalid or control fails.'],lab:'Implement a small state transition with a safe fallback.',language:'Python',code:`def next_state(sensor_ok, distance):
    if not sensor_ok:
        return "SAFE_STOP"
    if distance < 20:
        return "STOP"
    return "MOVE"

print(next_state(True, 45))
print(next_state(False, 0))`},
      {n:3,title:'Digital signals + PWM + simulation',focus:'Test logic before wiring hardware',theory:'Digital signals represent discrete states, while PWM varies duty cycle to approximate output control for compatible devices.',concepts:['A simple digital input is commonly HIGH/LOW or 1/0.','PWM controls average delivered power by changing duty cycle.','Simulation isolates logic errors before hardware introduces wiring and power variables.'],lab:'Map a percentage command to a PWM duty value.',language:'Python',code:`def pwm_duty(percent, max_value=255):
    percent = max(0, min(100, percent))
    return round(max_value * percent / 100)

for command in [0, 25, 50, 100]:
    print(command, pwm_duty(command))`},
      {n:4,title:'Diagnostics + integration + OOP',focus:'Separate devices from controller logic',theory:'Integration becomes easier to debug when sensor reading, control policy and actuator command are separate responsibilities.',concepts:['Log inputs, states and outputs to reproduce failures.','Verify voltage, pin mapping and safe power conditions before hardware integration.','OOP can separate Sensor, Controller and Actuator responsibilities.'],lab:'Build a controller that depends on sensor and actuator interfaces.',language:'Python',code:`class Sensor:
    def read(self):
        return 32

class Fan:
    def set(self, on):
        print("fan:", "ON" if on else "OFF")

class Controller:
    def __init__(self, sensor, actuator, limit=28):
        self.sensor = sensor
        self.actuator = actuator
        self.limit = limit

    def step(self):
        self.actuator.set(self.sensor.read() > self.limit)

Controller(Sensor(), Fan()).step()`}
    ],
    sprints:[
      {n:1,title:'System requirement',goal:'Define sensor input, decision logic, actuator output and safety state.',deliverable:'I/O table + state sketch'},
      {n:2,title:'Automation objects + UML V1',goal:'Model Sensor, Controller, Actuator and System.',deliverable:'UML V1 + state diagram'},
      {n:3,title:'Simulation',goal:'Simulate sensor readings and deterministic outputs before hardware.',deliverable:'Runnable simulation'},
      {n:4,title:'OOP control layer',goal:'Implement object responsibilities and controller behavior.',deliverable:'Class-based controller'},
      {n:5,title:'State machine + fail-safe',goal:'Handle transitions, invalid readings and safe fallback.',deliverable:'State tests + fail-safe evidence'},
      {n:6,title:'Integration testing',goal:'Test multiple input sequences and expected actuator responses.',deliverable:'Test matrix + fixes'},
      {n:7,title:'Hardware/advanced simulation',goal:'Connect target hardware when available or strengthen simulation.',deliverable:'Integrated prototype + UML V2'},
      {n:8,title:'Demo + defense',goal:'Run scenario live and defend object/state architecture.',deliverable:'Final prototype + UML + defense'}
    ]
  }
};
