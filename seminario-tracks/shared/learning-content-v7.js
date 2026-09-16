globalThis.IJR_SPECIALIZED_V7_CONTENT={
  web:{
    1:{
      why:'A web interface is easier to debug and maintain when structure, presentation and behavior remain separate responsibilities. Semantic HTML also gives browsers, assistive technologies and developers a clearer model of the page.',
      objectives:['Distinguish the responsibility of HTML, CSS and JavaScript in one feature.','Use semantic elements and DOM events instead of treating the page as an undifferentiated block.','Trace a user event from the interface to a visible state change.'],
      deep:[['Semantic structure','HTML should describe what an element is: heading, navigation, form, button, section or article. Meaningful structure improves accessibility and makes JavaScript selectors less fragile.'],['Presentation boundary','CSS controls appearance and layout. A visual requirement such as spacing, alignment or responsiveness normally belongs in CSS rather than JavaScript.'],['Interaction loop','JavaScript observes events, reads state, applies a rule and updates the DOM. The important question is not “which syntax do I use?” but “what event changes which state?”']],
      trace:['Locate the semantic elements the user can see and operate.','Identify the event listener and the state/value it reads.','Predict the exact DOM change before running the code.'],
      checkpoints:['Why is a real <button> preferable to a clickable <div> for an action?','Which responsibility should remain in CSS instead of JavaScript?','What observable state changes after the click handler executes?'],
      case:'A classroom status panel must switch between Ready and Working. Model the smallest semantic interface, the event that triggers the change, and the DOM node that owns the visible state.',
      workshop:{predict:'Before coding, describe the user action and the exact visible state change you expect.',model:'List the semantic elements, the event source and the DOM element that will be updated. Explain each responsibility.',modify:'Add a third state or a reset action without duplicating the original event logic.',explain:'Explain why your HTML structure is semantic and why the JavaScript responsibility is limited to behavior.'}
    },
    2:{
      why:'User input crosses a trust boundary. Even in a small browser prototype, values must be converted, validated and deliberately persisted before they become application state.',
      objectives:['Convert raw form text into the intended data type.','Apply required, type and range validation before persistence.','Explain what localStorage can and cannot safely store.'],
      deep:[['Raw input is text','DOM form values arrive as strings. A numeric-looking value is still text until the program converts it and checks the conversion result.'],['Validation is a rule','Validation should express the domain requirement: required value, integer, allowed range, known format or permitted option. A message is not validation unless invalid data is actually rejected.'],['Persistence has limits','localStorage is convenient for small browser-only state, but it is visible to scripts running on the same origin and should not contain passwords, tokens or other sensitive information.']],
      trace:['Read the value exactly where it enters the program.','Follow conversion and every condition that can reject it.','Verify that persistence occurs only after the value is valid.'],
      checkpoints:['Why can Number(input.value) still produce an invalid numeric result?','Where should the program return or stop when validation fails?','Why is localStorage inappropriate for secrets?'],
      case:'A profile form stores an age only when it is an integer between 5 and 120. Design the validation path and one message for each rejected category.',
      workshop:{predict:'Write three example inputs: one valid, one boundary value and one invalid value. Predict the result for each.',model:'Describe the input → conversion → validation → persistence pipeline.',modify:'Add a second validated field and persist both values as one JSON object.',explain:'Defend why invalid input cannot reach persistence and what data should never be stored in localStorage.'}
    },
    3:{
      why:'Real web applications wait for data and sometimes fail. A robust interface makes loading, success and failure states explicit instead of assuming that every request is immediate and successful.',
      objectives:['Explain the asynchronous nature of fetch and Promises.','Handle loading, HTTP failure and parsing success as separate states.','Render external text deliberately and preserve keyboard/semantic accessibility.'],
      deep:[['Asynchronous control flow','fetch returns a Promise. The program continues while the request is pending, so the interface needs an explicit loading state and code must await or chain the result.'],['HTTP is not automatically success','A resolved fetch Promise may still represent 404 or 500. Check response.ok before trusting the body.'],['Debug from evidence','Use console output, response status, network information and current variable values. Replace guessing with observable evidence.']],
      trace:['Mark where the loading state is written.','Find the first operation that can throw or reject.','Compare the success output with the catch/failure output.'],
      checkpoints:['Why does fetch not throw automatically for every 404 response?','What should the user see while the request is pending?','Why is textContent safer than inserting untrusted text as HTML?'],
      case:'A student dashboard loads a local JSON profile. The file may be missing. Define the loading, success and error states and the evidence you would inspect during debugging.',
      workshop:{predict:'Predict the UI in loading, success and failure states before running the code.',model:'Draw the asynchronous flow: request → status check → parse → render, with the error path.',modify:'Add a retry action or a second field from the returned object while keeping safe text rendering.',explain:'Explain how your implementation exposes failure clearly and remains usable without a mouse.'}
    },
    4:{
      why:'A feature becomes maintainable when domain rules are separated from DOM code and persistence. Git then records meaningful engineering changes instead of an opaque sequence of edits.',
      objectives:['Model a domain responsibility with a class instead of wrapping interface code.','Render untrusted text safely by default.','Use small, meaningful Git commits to document design evolution.'],
      deep:[['Domain before interface','A class should represent a concept such as Task, Student or Order and protect its rules. DOM selectors do not belong in the domain object unless the object is explicitly an interface component.'],['Safe output','textContent treats data as text. innerHTML interprets markup and therefore requires deliberate sanitization and a strong reason to use it.'],['Git as evidence','A good commit has one understandable purpose, a useful message and a diff that can be reviewed. Commit history should help reconstruct design decisions.']],
      trace:['Identify the invariant protected by the constructor or method.','Separate object state changes from interface rendering.','Describe one commit that would introduce this class without mixing unrelated changes.'],
      checkpoints:['What rule should the Task constructor protect?','When is innerHTML riskier than textContent?','What makes a commit reviewable?'],
      case:'A task manager needs title validation, completion state and browser persistence. Decide what belongs to Task, Repository and UI responsibilities.',
      workshop:{predict:'Describe the state and invariant your domain object must protect.',model:'Define responsibilities for domain object, UI adapter and persistence/repository.',modify:'Add one new domain rule, such as preventing duplicate or empty titles, without moving the rule into the DOM handler.',explain:'Defend your class boundaries and describe the Git commits you would make to introduce the change.'}
    }
  },
  'data-science':{
    1:{
      why:'A statistical result is only meaningful when the analyst understands what one row means, what each variable represents and how values are encoded. Data understanding precedes computation.',
      objectives:['Identify observational units, variables and data types.','Use Python collections to represent a small dataset explicitly.','Create a minimal data dictionary before calculating statistics.'],
      deep:[['Observation vs variable','A row normally describes one observational unit; a column describes one variable measured or recorded for every unit. Confusing the two changes the meaning of every analysis.'],['Type carries meaning','A number can be quantitative, an identifier or a code. Data type in software and measurement role in statistics are related but not identical.'],['Data dictionary','Record variable name, meaning, unit, allowed values and missing-value convention. This prevents later code from operating on misunderstood fields.']],
      trace:['Identify the Python object representing the dataset.','For one row, name the observational unit and each variable.','Predict the sequence printed by the loop before executing it.'],
      checkpoints:['Can a numeric student ID be categorical rather than quantitative?','What information belongs in a data dictionary?','Why should one row have a consistent meaning across the dataset?'],
      case:'A class survey contains name, study_hours and score. Define the observational unit, variable types, units and one data-quality rule for each variable.',
      workshop:{predict:'Describe the rows and columns you expect in your tiny dataset before creating it.',model:'Write a compact data dictionary with variable name, meaning, type, unit and valid range/category.',modify:'Add one new variable and update both the dataset and data dictionary consistently.',explain:'Explain why each variable type is appropriate and what error would occur if its meaning were misinterpreted.'}
    },
    2:{
      why:'Mean, median and other summaries respond differently to skew, extreme values and missing data. The analyst must inspect data quality before choosing or interpreting a summary.',
      objectives:['Compare mean and median under an extreme value.','Distinguish a suspicious outlier from an automatically invalid record.','Explain why correlation is not, by itself, causal evidence.'],
      deep:[['Center depends on distribution','The mean uses every numerical value and can move strongly when an extreme value is present. The median depends on order and is more resistant.'],['Outlier is a signal','An unusual value can be an error, a rare valid observation or the phenomenon of interest. Investigate source and context before deleting it.'],['Missingness is a decision','Dropping missing values changes the analyzed population. Document how many values are missing and justify the treatment.']],
      trace:['Compute or estimate the mean and median before running the example.','Locate the extreme observation and predict which statistic changes more.','Explain what assumption is introduced by filtering a value.'],
      checkpoints:['Why is the median called resistant?','When would deleting an outlier be scientifically unjustified?','What additional evidence is needed before claiming causation?'],
      case:'A response-time dataset has one value ten times larger than the rest. Decide what you would inspect before excluding it and which summaries you would report meanwhile.',
      workshop:{predict:'Predict the direction and approximate size of change in mean and median when an extreme value is added.',model:'Describe a decision tree for missing values and unusual observations before analysis.',modify:'Change the example so the extreme value is retained but clearly reported using robust and non-robust summaries.',explain:'Defend which summary best answers the question and why no causal claim follows from correlation alone.'}
    },
    3:{
      why:'Pandas makes large datasets manageable, but it does not remove the need to inspect nulls, types and distributions. Visualization is a diagnostic and communication tool, not decoration.',
      objectives:['Inspect a DataFrame before filtering or plotting.','Choose a graph appropriate to the variable and question.','Use an explicit outlier rule while preserving the original data.'],
      deep:[['Inspect first','head, info, shape, dtypes and missing-value counts reveal whether the file was loaded as expected. A calculation on the wrong type can be syntactically valid but analytically wrong.'],['Plots answer different questions','Histograms show distribution shape; boxplots summarize quartiles and potential outliers; scatter plots study association between two quantitative variables.'],['Preserve provenance','Create reviewed or filtered views rather than silently overwriting raw data. Reproducibility requires a trace from raw file to result.']],
      trace:['Identify the file-loading boundary and the expected column name.','Predict what isna().sum() reports.','Explain what the selected plot can reveal and what it cannot.'],
      checkpoints:['Why should df.info() often come before df.mean()?','What does a histogram reveal that a single mean cannot?','Why keep the raw DataFrame unchanged?'],
      case:'A CSV has 500 rows, mixed missing values and a numerical response variable. Define the first five inspection commands and justify one visualization.',
      workshop:{predict:'Write what you expect to learn from head, info, null counts and a first plot.',model:'Describe the pipeline from raw CSV → inspection → reviewed view → plot, without overwriting raw data.',modify:'Add an explicit IQR-based flag column or another transparent outlier indicator instead of deleting rows silently.',explain:'Defend the visualization and explain how another student could reproduce the same result.'}
    },
    4:{
      why:'A reproducible analysis separates loading, cleaning, analysis and reporting so that results can be regenerated when data changes. OOP is useful only when responsibilities are genuinely reusable.',
      objectives:['Separate pipeline stages and make transformations explicit.','Encapsulate a reusable analysis responsibility in a class.','Produce a result that can be regenerated from raw data without hand-edited numbers.'],
      deep:[['Pipeline as provenance','Each transformation should have a visible input and output. This makes it possible to audit where a value changed and rerun the analysis.'],['Useful OOP boundary','A Dataset or Analyzer class can centralize validated operations; a class is not automatically better than a simple function when there is no persistent responsibility.'],['Reporting is downstream','Charts and conclusions depend on cleaned, validated analysis outputs. Keep presentation logic from silently modifying the analytical data.']],
      trace:['Identify the DataFrame entering the Analyzer.','Trace how the selected column is cleaned before statistics are returned.','List which outputs could be unit-tested without rendering a chart.'],
      checkpoints:['When is a function sufficient instead of a class?','Why should cleaning not be hidden inside a charting function?','What makes an analysis reproducible?'],
      case:'A monthly report must be rerun on a new CSV every month. Design Dataset, Analyzer and Report responsibilities and identify one automated test.',
      workshop:{predict:'Describe which result should remain identical when the same raw file is analyzed twice.',model:'Define the responsibilities and data flow among loader/dataset, analyzer and report components.',modify:'Add one reusable statistic or validation rule without coupling it to printing or plotting.',explain:'Explain why your architecture is reproducible and where you would test it.'}
    }
  },
  cybersecurity:{
    1:{
      why:'Defensive security begins with clear assets, security properties and access boundaries. Authentication and authorization solve different problems, while least privilege limits the damage of mistakes or misuse.',
      objectives:['Apply confidentiality, integrity and availability to a concrete asset.','Distinguish authentication from authorization in an access decision.','Represent least-privilege permissions for multiple roles.'],
      deep:[['CIA is asset-specific','Confidentiality asks who may see data; integrity asks who may change it and whether changes are trustworthy; availability asks whether authorized users can access the service when needed.'],['Identity is not permission','Authentication establishes an identity or principal. Authorization evaluates whether that principal may perform a specific action on a specific resource.'],['Least privilege','Start from the minimum permissions required for the task. Extra permissions increase impact if an account is misused or a program contains a defect.']],
      trace:['Read the permission matrix as policy rather than syntax.','Predict allowed(role, action) for at least three role/action pairs.','Identify one permission that would violate least privilege if granted to every role.'],
      checkpoints:['Can a user be authenticated but still unauthorized?','Which CIA property is harmed by unauthorized grade modification?','Why is “admin for convenience” a poor default?'],
      case:'A school report system has student, teacher and admin roles. Define assets, allowed actions and one denied action for every role without discussing attacks against external systems.',
      workshop:{predict:'Predict the result of at least four role/action combinations before running code.',model:'Build an access matrix showing roles, resources/actions and the minimum permissions each role requires.',modify:'Add a new role with deliberately limited permissions and prove that a forbidden action stays denied.',explain:'Defend the distinction between authentication, authorization and least privilege in your model.'}
    },
    2:{
      why:'Validation controls what data may cross a trust boundary, while authorization controls what an identified role may do. Both checks must be enforced at the protected operation, not only in the interface.',
      objectives:['Design allow-list validation for a known input format.','Place validation and authorization at the server/service boundary conceptually.','Test valid, malformed and unauthorized cases separately.'],
      deep:[['Allow-list thinking','When a field has a known format, define what is accepted: length, type, characters, range or enumerated values. Reject everything else.'],['Trust boundary','Client-side checks improve usability but can be bypassed. The protected operation must repeat the decisive validation and authorization.'],['Different failure classes','Malformed input and insufficient permission are separate conditions. Keeping them separate internally improves testing and auditing even when public error messages are intentionally generic.']],
      trace:['Identify exactly what valid_code accepts.','Evaluate the role check independently from input validation.','Construct one input that is numeric-looking but invalid because of length.'],
      checkpoints:['Why is client-side validation insufficient as the only control?','What makes an allow-list precise?','Why should authorization be checked at the protected action?'],
      case:'A local administrative simulator accepts a six-digit record code and only permits teachers/admins to open a protected report. Define the complete decision order.',
      workshop:{predict:'List outcomes for valid+authorized, valid+unauthorized and invalid+authorized cases.',model:'Draw the trust boundary and the order validation → authorization → action → audit.',modify:'Add one second field with a strict allow-list rule without weakening the role check.',explain:'Explain why interface hiding is not authorization and where the decisive check belongs.'}
    },
    3:{
      why:'Logs are evidence, but poorly designed logs can become a confidentiality problem. Defensive systems record relevant events while keeping passwords, tokens and other secrets out of source code and output.',
      objectives:['Design a minimal audit event with useful context.','Explain why password hashing is different from reversible storage.','Identify secrets that must not be committed or logged.'],
      deep:[['Audit purpose','A useful audit event answers who, what, when, target/context and result when appropriate. It should support review without copying sensitive payloads.'],['Passwords are verified, not recovered','Production password storage uses a purpose-built salted password-hashing scheme. The application compares a candidate by hashing/verifying rather than decrypting stored plaintext.'],['Secret management','API keys, database credentials and tokens should be supplied through controlled configuration such as environment/secrets systems, not committed to public repositories.']],
      trace:['Read each field recorded by record_event and justify why it is useful.','Confirm that no password or token value is recorded.','Predict the structure of the final log entry before execution.'],
      checkpoints:['What information makes an audit event useful?','Why should a password never be printed for debugging?','What is the difference between a secret and a public configuration value?'],
      case:'A local report simulator must record denied access attempts. Design the audit event so it supports review without storing credentials or sensitive report contents.',
      workshop:{predict:'Write the exact fields you expect one denied-access audit event to contain.',model:'Separate public event metadata from secrets or sensitive payloads that must never enter the log.',modify:'Add an event identifier or resource name while preserving the rule that credentials are never logged.',explain:'Explain how your log supports integrity/accountability without creating a new confidentiality risk.'}
    },
    4:{
      why:'Threat modeling is a structured defensive design activity: identify assets, trust boundaries, plausible failure/misuse scenarios and mitigations before implementing controls. Architecture keeps validation, policy and audit responsibilities explicit.',
      objectives:['Create a small threat model for a system you control.','Separate validation, access policy and audit responsibilities.','Design defensive tests that stay within an authorized local/simulated scope.'],
      deep:[['Threat model before code','Start from assets and data flows. Ask where trust changes, what can go wrong and which mitigation reduces likelihood or impact.'],['Architecture makes controls reviewable','A Validator, AccessPolicy and AuditLog make different decisions. Keeping them separate reduces duplicated policy and makes tests more precise.'],['Residual risk remains','No mitigation removes all risk. A defensible security review states what is protected, what is not covered and what assumptions remain.']],
      trace:['Locate the policy decision in AccessPolicy.','Follow the denied path and the allowed path through ReportService.','Identify where an audit responsibility could be added without mixing it into the policy rule.'],
      checkpoints:['What is an asset in the project?','Where does a trust boundary exist?','What is one residual limitation after the access policy is added?'],
      case:'Model a local secure-report simulator with a user input boundary, access policy and audit log. Identify three plausible defensive failure cases and one mitigation for each.',
      workshop:{predict:'List assets, trust boundaries and three plausible failure/misuse cases in the local simulator.',model:'Create a defensive architecture with separate Validator, AccessPolicy, Service and AuditLog responsibilities.',modify:'Add a new policy rule or resource while keeping existing responsibilities separate.',explain:'Defend one mitigation, its test evidence and the residual risk that still remains.'}
    }
  },
  '3d-programming':{
    1:{
      why:'Parametric modeling turns geometry into a reproducible system of numbers, constraints and relationships. A model becomes reusable when dimensions are named parameters instead of one-off manual edits.',
      objectives:['Represent points and dimensions numerically in a consistent coordinate system.','Distinguish a primitive from the parameters that generate it.','Calculate and validate a simple geometric property from parameters.'],
      deep:[['Coordinate convention','State origin, axis directions and units. Every transformation and measurement depends on this convention.'],['Parameters encode design intent','Width, depth, height, radius or wall thickness should be named and validated so variants can be regenerated consistently.'],['Primitive as building block','Boxes, cylinders and spheres are simple solids that can be composed or transformed into more complex parts.']],
      trace:['Identify the three parameters stored by Box.','Predict the numerical volume before running the method.','Explain which invalid dimensions the constructor currently fails to reject.'],
      checkpoints:['Why are units part of the model rather than a display detail?','What design benefit comes from named parameters?','Which validation would prevent an impossible box?'],
      case:'A rectangular enclosure must be generated in millimeters for several sizes. Define parameters, units, valid ranges and the computed volume.',
      workshop:{predict:'Calculate the expected volume for two parameter sets before running code.',model:'Document origin/units and list parameters with their constraints.',modify:'Add validation and one derived property such as surface area while keeping dimensions parametric.',explain:'Explain how a parameter change regenerates the same design logic rather than creating an unrelated model.'}
    },
    2:{
      why:'Transformations are mathematical operations on geometry. Keeping translation, scale and rotation explicit avoids hidden coordinate errors and makes a model reproducible.',
      objectives:['Apply translation numerically to a 3D point.','Distinguish position change, size change and orientation change.','State the coordinate frame and units used by a transformation.'],
      deep:[['Translation','Add displacement components to coordinates. Translation changes position but not shape or size.'],['Scaling','Multiply coordinates or dimensions by a factor relative to a defined reference. Scaling changes size and can also affect position depending on the reference point.'],['Rotation','Rotation requires an angle, axis and convention. Degrees/radians and rotation order must be explicit in real systems.']],
      trace:['Write the original point and displacement vectors.','Add each component independently.','Verify which coordinates remain unchanged when a displacement component is zero.'],
      checkpoints:['Does translation change volume?','What information is missing if someone says “rotate 90°” without an axis?','Why does the reference frame matter?'],
      case:'A part point at (10,5,0) mm must move +15 mm in x and +8 mm in z. Compute the result and describe a second transformation.',
      workshop:{predict:'Calculate the transformed coordinates manually for at least two points.',model:'State coordinate frame, unit and transformation sequence before coding.',modify:'Add scaling or a simple axis rotation function and test a known geometric case.',explain:'Explain how you verified the transformation numerically and which assumptions define the result.'}
    },
    3:{
      why:'Geometry generation must reject impossible dimensions and preserve units. Validation prevents downstream CAD/export errors that are harder to diagnose after a solid has already been generated.',
      objectives:['Validate physical dimensions before geometry creation.','Explain extrusion as a profile plus distance operation.','Prevent silent unit mismatches.'],
      deep:[['Validate before construction','Check dimensions at the boundary where parameters enter the geometry model. Fail early with a clear message.'],['Extrusion concept','A 2D profile is extended through a distance to create a 3D solid. Both the profile and extrusion distance must be valid.'],['Unit discipline','Store or convert values using one internal convention. A number without a known unit is ambiguous engineering data.']],
      trace:['Follow a dimension through float conversion and positivity check.','Predict the error path for zero and negative values.','Identify where an explicit unit conversion would belong.'],
      checkpoints:['Why is zero depth invalid for a solid?','Where should centimeters be converted to millimeters?','What evidence proves invalid dimensions are rejected?'],
      case:'A plate generator accepts width, height and extrusion depth. Define positive ranges and a rule for converting centimeter input to millimeters.',
      workshop:{predict:'List accepted and rejected values for each dimension before implementation.',model:'Define one internal unit convention and the validation boundary.',modify:'Add a conversion helper or an upper-bound constraint and demonstrate both accepted and rejected cases.',explain:'Explain why validation occurs before geometry generation and how unit consistency is preserved.'}
    },
    4:{
      why:'Assemblies combine reusable parts without turning export format into the design model. OOP can separate part geometry, transformations, composition and output responsibilities.',
      objectives:['Represent whole-part composition explicitly.','Separate model data from export/serialization.','Design reusable Part and Assembly responsibilities.'],
      deep:[['Composition','An assembly owns or organizes references to parts and defines how they relate. The part remains a reusable concept with its own properties.'],['Export is downstream','STL or another output format represents a result. File-format concerns should not determine every geometry class.'],['Architecture for change','If transformations and export are separated, a part can be reused in different assemblies or exported differently without rewriting its core model.']],
      trace:['Identify where parts are stored and added.','Predict the list printed after two parts are added.','Name one responsibility that does not belong in Part itself.'],
      checkpoints:['What is the difference between a Part and an Assembly?','Why should an STL writer not own geometry validation?','What relationship would appear in a UML class model?'],
      case:'A small robot assembly contains base, arm and sensor mount. Model the components and identify which class owns composition versus export.',
      workshop:{predict:'List the assembly contents and expected order/count before running code.',model:'Define responsibilities for Part, Transform, Assembly and Exporter.',modify:'Add transforms or metadata to parts without coupling the assembly to a specific export format.',explain:'Defend the composition model and explain how the same parts could be reused in another assembly.'}
    }
  },
  robotics:{
    1:{
      why:'Automation systems become understandable when sensing, decision and actuation are separated. This makes behavior testable in simulation before hardware adds wiring, power and timing variables.',
      objectives:['Classify components as sensor, decision logic or actuator.','Trace an input → decision → output control loop.','Simulate at least one threshold-based controller before hardware integration.'],
      deep:[['Sensor','A sensor converts a physical or simulated condition into data the controller can read. The reading can be valid, noisy, missing or out of range.'],['Controller','The decision rule maps input/state to an output command. Keeping this rule explicit makes tests deterministic.'],['Actuator','The actuator performs the commanded action. In simulation it may be represented by a printed/logged state rather than hardware.']],
      trace:['Identify sensor value and threshold.','Evaluate the Boolean decision manually.','Predict the actuator state before executing the code.'],
      checkpoints:['What changes when the temperature equals the threshold exactly?','Which responsibility belongs to the controller rather than the sensor?','Why simulate before wiring hardware?'],
      case:'A fan turns on above a temperature threshold. Define sensor input, threshold rule, output command and one invalid-reading behavior.',
      workshop:{predict:'Create a table of temperature inputs and expected fan states before coding.',model:'Represent sensor → controller → actuator responsibilities and the threshold rule.',modify:'Add hysteresis or a second state so the fan does not rapidly toggle near the threshold.',explain:'Explain how simulation separates control-logic errors from hardware problems.'}
    },
    2:{
      why:'A state machine makes allowed operating modes and transitions explicit. A fail-safe state defines predictable behavior when a sensor or control assumption is invalid.',
      objectives:['Represent states and transition conditions clearly.','Implement a deterministic next-state rule.','Define a safe fallback for invalid sensor information.'],
      deep:[['State','State summarizes the operating mode that matters for future decisions, such as MOVE, STOP or SAFE_STOP.'],['Transition','A transition occurs when a defined condition is met. Order and precedence matter when several conditions could be true.'],['Fail-safe','When information is unreliable, the system should move toward a known safer behavior rather than continuing with stale or guessed input.']],
      trace:['Evaluate the invalid-sensor branch first.','Then evaluate the distance threshold for valid input.','Predict outputs for a sequence, not only one isolated reading.'],
      checkpoints:['Why should sensor validity often be checked before normal motion logic?','What is the difference between STOP and SAFE_STOP in your model?','How would you test transition precedence?'],
      case:'A mobile simulation moves when distance is safe, stops near an obstacle and enters SAFE_STOP if the sensor becomes invalid. Build a transition table.',
      workshop:{predict:'Write a transition table for at least six input combinations/sequences.',model:'List states, transition conditions and the explicit fail-safe state.',modify:'Add one recovery rule from SAFE_STOP or an intermediate WARNING state and test transition order.',explain:'Defend why the state machine is deterministic and how the fail-safe reduces risk.'}
    },
    3:{
      why:'Digital signals and PWM are abstractions that connect software decisions to hardware behavior. Simulation lets students verify mapping logic before electrical details are introduced.',
      objectives:['Distinguish discrete digital states from PWM duty control.','Map a percentage command into a bounded duty value.','Clamp or reject commands outside the permitted range.'],
      deep:[['Digital signal','A digital signal represents discrete logical levels. Software often models these as 0/1 or false/true even though real hardware has electrical thresholds.'],['PWM','Pulse-width modulation changes duty cycle, not the logical definition of voltage itself. Compatible devices respond to average delivered power or control pulse characteristics.'],['Bounded command','A controller should define behavior for commands below 0% or above 100% rather than passing invalid values downstream.']],
      trace:['Clamp the percentage to the accepted range.','Compute max_value × percent / 100.','Predict rounded duty values for 0, 25, 50 and 100 before running.'],
      checkpoints:['Is PWM the same as an analog voltage source?','Why clamp an out-of-range command?','What test values best expose boundary errors?'],
      case:'Map 0–100% motor commands to an 8-bit 0–255 duty value. Include tests for -10%, 0%, 50%, 100% and 130%.',
      workshop:{predict:'Calculate expected duty values manually for normal and out-of-range commands.',model:'Describe command input → clamp/validation → conversion → simulated actuator output.',modify:'Support a configurable maximum duty or a minimum safe operating command.',explain:'Explain the difference between digital state, PWM duty and the physical behavior of a real actuator.'}
    },
    4:{
      why:'Integration is easier to diagnose when Sensor, Controller and Actuator responsibilities are separated. Logs and interface contracts allow simulated components to be replaced by hardware without rewriting the control policy.',
      objectives:['Separate device interfaces from control policy.','Inject simulated sensor/actuator dependencies into a controller.','Use logs/tests to diagnose integration behavior.'],
      deep:[['Dependency boundary','The controller should depend on what a sensor can provide and what an actuator can do, not on wiring details. This makes simulation and hardware substitution possible.'],['Deterministic control policy','Given the same sensor reading and state, the controller should produce a predictable command unless randomness is an explicit requirement.'],['Integration evidence','Record input, state and output. When behavior is wrong, this trace shows whether the problem came from sensing, policy or actuation.']],
      trace:['Follow the injected Sensor and Fan objects into Controller.','Predict Sensor.read() and the comparison with limit.','Identify the exact actuator command produced by step().'],
      checkpoints:['Why is dependency injection useful for simulation?','Which class should know the temperature threshold?','What trace would help diagnose a wrong actuator command?'],
      case:'A controller will first run with simulated devices and later with physical hardware. Define interfaces and evidence that must remain unchanged across both versions.',
      workshop:{predict:'Write expected input/state/output traces for at least three sensor readings.',model:'Define Sensor, Controller and Actuator interfaces and where logging belongs.',modify:'Swap in a second simulated sensor or actuator without changing the controller policy code.',explain:'Explain how separation of responsibilities makes hardware integration safer and easier to debug.'}
    }
  }
};
