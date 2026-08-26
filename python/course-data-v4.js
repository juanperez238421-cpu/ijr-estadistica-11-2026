(() => {
  'use strict';

  const topics = [
    {
      slug: 'operations', sequence: 1, title: 'Colab interface and general operations', nav: 'Interface & operations',
      lead: 'Before calculating, understand the environment: Python is the language, Google Colab is the notebook interface, and a code cell describes a repeatable process rather than only displaying a final number.',
      definition: 'Python is a general-purpose programming language. Google Colab is a hosted notebook environment that lets you write and execute Python in a browser. A notebook combines executable code, outputs and explanatory text so a calculation can become a documented, reusable analysis.',
      goals: [
        'Explain the difference between Python and Google Colab.',
        'Identify the notebook title, code cell, Run control, output area and runtime feedback.',
        'Explain why a notebook is different from a calculator.',
        'Use assignment and the arithmetic operators +, -, *, /, ** and %.',
        'Read errors as information in an edit → run → inspect → correct cycle.',
        'Connect one calculation to the later use of lists and statistical datasets.'
      ],
      sections: [
        {title:'What is Python?', body:'Python is a programming language: a formal system for writing instructions that a computer can execute. It is widely used for scientific computing, statistics, data analysis, automation, artificial intelligence and software development. The language itself is independent of Colab; the same Python instructions can run in many environments.'},
        {title:'What is Google Colab?', body:'Google Colab, short for Colaboratory, is a hosted Jupyter Notebook service. It runs in the browser, requires no local setup for basic use, and gives students a document made of executable code cells and rich text. Colab sends the contents of a code cell to a Python runtime and then displays either an output or an error.'},
        {title:'Language vs environment', body:'A useful mental model is: Python tells the computer what the instructions mean; Colab gives you the workspace in which you write, run, inspect and organize those instructions. Python is the language. Colab is one notebook environment that can execute Python.'},
        {title:'Calculator vs notebook', body:'A calculator is optimized for a direct question such as 17 + 8. A notebook is optimized for a process: store 17, store 8, combine them, save the result, reuse it later, explain the reasoning and repeat the same logic with new data. That difference becomes essential in statistics, where the same procedure may be applied to dozens or thousands of observations.'},
        {title:'Code cells and execution order', body:'A code cell is a small executable program. Python reads the statements in that cell from top to bottom. A later line can use a variable created earlier in the same cell. Across a notebook, the runtime also remembers previously executed variables until the runtime is restarted or reset.'},
        {title:'Outputs and errors are feedback', body:'Running a cell does not guarantee the code is correct. A valid cell can produce an unexpected result, while invalid syntax can produce an error message. The correct workflow is to read the instruction, write code, run it, inspect the output or error, make one controlled correction, and run again.'},
        {title:'Operators describe transformations', body:'Programming operators are symbols with precise meanings. = assigns a value to a variable; +, -, *, / perform arithmetic; ** performs exponentiation; and % returns the remainder after division. Their meaning is defined by Python syntax, which is why familiar mathematical symbols do not always behave the same way as they do on paper.'},
        {title:'Why this matters for statistics', body:'Statistics is not only about obtaining one answer. It is about applying repeatable procedures to data. The path in this course therefore moves from one value → variables → many values in lists → comparisons and decisions → repetition → reusable functions → statistical summaries.'}
      ],
      syntax: [
        ['Assignment', 'x = 10'], ['Display', 'print(x)'], ['Addition', 'a + b'], ['Subtraction', 'a - b'],
        ['Multiplication', 'a * b'], ['Division', 'a / b'], ['Power', 'x ** 2'], ['Square root', 'x ** 0.5'], ['Remainder', 'x % 2']
      ],
      pitfalls: [
        'Using ^ instead of ** for exponentiation.',
        'Typing only the final numerical answer instead of describing the process.',
        'Changing many lines at once and losing track of the source of an error.',
        'Confusing an error message with a wrong mathematical result.',
        'Assuming that code has run simply because it is visible in the notebook.',
        'Using a value before the line that creates it has been executed.'
      ],
      resources: [
        {name:'Python', kind:'Official website', url:'https://www.python.org/', logo:'https://www.python.org/static/community_logos/python-logo-generic.svg'},
        {name:'Python documentation', kind:'Language documentation', url:'https://docs.python.org/3/', logo:'https://www.python.org/static/community_logos/python-logo-only.png'},
        {name:'Google Colab', kind:'Official notebook', url:'https://colab.research.google.com/', logo:'https://colab.research.google.com/img/colab_favicon_256px.png'},
        {name:'Colab FAQ', kind:'Official overview', url:'https://research.google.com/colaboratory/faq.html', logo:'https://colab.research.google.com/img/colab_favicon_256px.png'}
      ],
      diagrams: [
        {type:'python-colab', title:'Python language → Colab environment', description:'Separate the language from the tool. Python defines the instructions; Colab provides the notebook interface and sends the cell to a Python runtime.'},
        {type:'calculator-notebook', title:'Calculator vs Python notebook', description:'A calculator returns a direct answer. A notebook preserves values, instructions, intermediate results, explanations and outputs as a reusable process.'},
        {type:'colab-anatomy', title:'Anatomy of a Colab notebook', description:'A notebook has a title and toolbar, code cells, a Run control, an output region, text/markdown cells and runtime status. These parts support an iterative workflow.'},
        {type:'execution-cycle', title:'Execution feedback cycle', description:'Programming is iterative. Write or edit the cell, run it, read the output or error, correct one thing, and run again.'},
        {type:'operator-map', title:'Core Python operator map', description:'The symbols are compact instructions. Assignment stores a value; arithmetic operators transform values; exponentiation and remainder have Python-specific notation.'},
        {type:'top-down', title:'Top-to-bottom execution', description:'A later statement can use a variable created earlier. The order is part of the program, not merely a visual arrangement of lines.'},
        {type:'error-feedback', title:'Errors are diagnostic information', description:'Syntax, name and type errors identify different categories of problems. Reading the message is faster than randomly changing code.'},
        {type:'stats-bridge', title:'From one calculation to statistics', description:'The same notebook model scales from one number to variables, lists of observations, repeated procedures and statistical summaries.'}
      ],
      workshopIntro: 'Complete all ten required stages. Coding stages begin with a blank cell: read the instruction, design the Python steps, run the cell, inspect the output, and only then validate it.',
      exercises: [
        {key:'op-01', title:'Build two variables and add them', prompt:'Start from a blank Python cell. Create one variable with the value 17 and a second variable with the value 8. Create a third variable that stores the sum of the first two values. Finally, display only the final result. Do not type the final numerical answer directly.', mode:'code', code:''},
        {key:'op-02', title:'Write one arithmetic expression', prompt:'Start from a blank cell. Write one Python instruction that evaluates 2 plus 3 multiplied by 4 and displays the result. Let Python apply its normal order of operations. Do not type the final numerical answer directly.', mode:'code', code:''},
        {key:'op-03', title:'Represent a power in Python', prompt:'Start from a blank cell. Store the value 9 in a variable. Then calculate the square of that variable using Python exponentiation and display the result.', mode:'code', code:''},
        {key:'op-04', title:'Represent a square root in Python', prompt:'Start from a blank cell. Store the value 81 in a variable. Calculate its square root using a fractional exponent and display the result.', mode:'code', code:''},
        {key:'op-05', title:'Recognize Python exponentiation', prompt:'Choose the symbol Python uses for exponentiation.', mode:'choice', choices:['^','**','//','%%']},
        {key:'op-06', title:'Choose the correct notebook workflow', prompt:'Choose the workflow that best represents how a student should work in Colab.', mode:'choice', choices:['Validate first → run later','Run → inspect output → correct if needed','Copy the answer → run','Refresh the browser after every line']},
        {key:'op-07', title:'Use the remainder operator', prompt:'Start from a blank cell. Store 29 in a variable representing a total number of items and 6 in another variable representing the size of each complete group. Use the remainder operator to determine how many items are left over, and display only that remainder.', mode:'code', code:''},
        {key:'op-08', title:'Divide a total into equal parts', prompt:'Start from a blank cell. Store 84 as a total and 7 as the number of equal parts. Create a new variable that stores the result of dividing the total by the number of parts, then display that result.', mode:'code', code:''},
        {key:'op-09', title:'Control order with parentheses', prompt:'Start from a blank cell. Store 10 in one variable and 4 in another. Add the two stored values first, then multiply that sum by 2. Use parentheses so the intended order is explicit, and display the final result.', mode:'code', code:''},
        {key:'op-10', title:'Use a previous result in a later step', prompt:'Start from a blank cell. Store 6 in one variable and 3 in another. Create a third variable containing their product. Then use that third variable in a new expression that adds 2, and display only the final result.', mode:'code', code:''}
      ]
    },
    {
      slug:'types', sequence:2, title:'Variables and data types', nav:'Variable types',
      lead:'A variable has a name, a stored value and a data type. The data type determines which operations make sense.',
      definition:'Python values carry a type. The starter types in this course are int, float, str, bool and NoneType. Understanding type prevents many common errors and prepares data for later statistical calculations.',
      goals:['Differentiate a variable name from its stored value.','Recognize int, float, str, bool and NoneType.','Inspect a type.','Convert compatible values between text and numeric forms.'],
      sections:[
        {title:'Variables as named references',body:'A variable name gives a value a reusable label. The name is not the value itself; it is a way to refer to the value later in the program.'},
        {title:'Why type matters',body:'The same visible characters can behave differently depending on their type. Numeric 12 participates in arithmetic, while text "12" participates in string operations until it is converted.'},
        {title:'Conversion is explicit',body:'Python does not always guess what you intend. int(), float() and str() perform explicit conversions when the source value is compatible.'}
      ],
      syntax:[['Integer','age = 16'],['Float','mean = 4.25'],['String','group = "11A"'],['Boolean','passed = True'],['Missing value','result = None'],['Inspect type','type(mean).__name__']],
      pitfalls:['Writing text without quotation marks.','Confusing True with the string "True".','Trying to add a string directly to a number.'],
      diagrams:[
        {type:'variable-memory',title:'Variable name → stored value',description:'A name points to a value that can be reused later. Reassignment changes what the name refers to.'},
        {type:'type-cards',title:'Starter Python types',description:'Integers, decimals, text, Boolean values and None represent different categories of information.'},
        {type:'conversion-flow',title:'Text-to-number conversion',description:'Conversion changes how Python interprets the value, which changes the operations that are available.'}
      ],
      workshopIntro:'Show that you can identify, inspect and convert the five starter data types.',
      exercises:[
        {key:'type-01',title:'Integer type',prompt:'Print the short type name of value.',mode:'code',code:'value = 42\nprint(type(value).__name__)'},
        {key:'type-02',title:'Float type',prompt:'Print the short type name of value.',mode:'code',code:'value = 4.5\nprint(type(value).__name__)'},
        {key:'type-03',title:'String type',prompt:'Print the short type name of value.',mode:'code',code:'value = "11A"\nprint(type(value).__name__)'},
        {key:'type-04',title:'Boolean type',prompt:'Print the short type name of value.',mode:'code',code:'value = True\nprint(type(value).__name__)'},
        {key:'type-05',title:'Convert text to number',prompt:'Convert "12" to an integer, add 3, and print the result.',mode:'code',code:'value = "12"\nnumber = int(value)\nprint(number + 3)'},
        {key:'type-06',title:'Missing value',prompt:'Print the short type name of None.',mode:'code',code:'value = None\nprint(type(value).__name__)'}
      ]
    },
    {
      slug:'arrays', sequence:3, title:'Arrays and Python lists', nav:'Arrays / lists',
      lead:'A list solves the problem of storing many ordered values under one variable name.',
      definition:'Python lists are ordered collections written with square brackets. Each element has a zero-based index. Lists let statistical data move from isolated variables to a structured dataset.',
      goals:['Create a list.','Read values by zero-based index.','Measure length and total.','Append a new observation.','Calculate a simple mean.'],
      sections:[
        {title:'Why lists exist',body:'Creating score1, score2, score3 and so on does not scale. A list keeps related observations together and allows one operation to work with the complete collection.'},
        {title:'Indexing starts at zero',body:'The first element has index 0, the second index 1, and so on. The index identifies a position, not the value itself.'},
        {title:'Lists enable summaries',body:'Built-in functions such as len(), sum(), min() and max() summarize an entire collection and become the first bridge to descriptive statistics.'}
      ],
      syntax:[['Create','values = [8, 13, 21]'],['First item','values[0]'],['Third item','values[2]'],['Length','len(values)'],['Total','sum(values)'],['Add item','values.append(34)']],
      pitfalls:['Assuming the first index is 1.','Using parentheses instead of square brackets for indexing.','Dividing by a hard-coded count instead of len(values).'],
      diagrams:[
        {type:'array-index',title:'Ordered values and zero-based indexes',description:'The list keeps values in order while indexes identify positions starting at zero.'},
        {type:'array-growth',title:'Appending a new observation',description:'append(...) extends the same list rather than creating a separate variable for each new value.'},
        {type:'array-summary',title:'List → statistical summaries',description:'One collection can feed length, total, minimum, maximum and mean calculations.'}
      ],
      workshopIntro:'Arrays are released only after Operations and Variable Types are complete.',
      exercises:[
        {key:'arr-01',title:'Zero-based index',prompt:'Print the third value using an index, not by copying the number.',mode:'code',code:'values = [6, 10, 15, 21]\nprint(values[2])'},
        {key:'arr-02',title:'Length',prompt:'Print the number of items.',mode:'code',code:'values = [5, 10, 15, 20]\nprint(len(values))'},
        {key:'arr-03',title:'Total',prompt:'Print the total of the list.',mode:'code',code:'values = [5, 10, 15, 20]\nprint(sum(values))'},
        {key:'arr-04',title:'Minimum and maximum',prompt:'Print the minimum and maximum, one per line.',mode:'code',code:'values = [8, 4, 21, 13]\nprint(min(values))\nprint(max(values))'},
        {key:'arr-05',title:'Append',prompt:'Append 18, then print the complete list.',mode:'code',code:'values = [6, 12]\nvalues.append(18)\nprint(values)'},
        {key:'arr-06',title:'Mean from a list',prompt:'Calculate and print the mean using sum and len.',mode:'code',code:'values = [10, 15, 5, 20]\nmean = sum(values) / len(values)\nprint(mean)'}
      ]
    },
    {
      slug:'logic', sequence:4, title:'Comparisons and logical operators', nav:'Comparisons & logic',
      lead:'Comparisons ask questions and return Boolean values. Logical operators combine those questions.',
      definition:'Comparison operators produce True or False. and, or and not combine or invert Boolean expressions, allowing code to describe rules rather than only arithmetic.',
      goals:['Distinguish = from ==.','Predict comparison results.','Combine conditions with and/or.','Use not to invert a Boolean expression.'],
      sections:[
        {title:'A comparison is a question',body:'Expressions such as score >= 70 do not store or print a score. They ask a yes/no question and evaluate to True or False.'},
        {title:'Logical operators combine rules',body:'and requires both conditions to be true; or requires at least one; not reverses a Boolean result.'},
        {title:'Logic prepares decisions',body:'The next topic uses these Boolean results to choose which block of code should run.'}
      ],
      syntax:[['Greater than','x > 10'],['At least','x >= 10'],['Equal','x == 10'],['Different','x != 10'],['Both','a > 0 and b > 0'],['Either','a > 0 or b > 0']],
      pitfalls:['Using = when a comparison needs ==.','Forgetting that and requires both sides to be True.','Comparing incompatible types without conversion.'],
      diagrams:[
        {type:'comparison-bool',title:'Value comparison → Boolean result',description:'A comparison converts a numeric or text relationship into True or False.'},
        {type:'logic-gates',title:'AND / OR / NOT',description:'Logical operators combine Boolean statements into larger rules.'},
        {type:'logic-rule',title:'From rule to eligibility',description:'Multiple comparisons can be combined into one reusable decision rule.'}
      ],
      workshopIntro:'Complete the Boolean workshop before decisions with if/else are released.',
      exercises:[
        {key:'logic-01',title:'Greater or equal',prompt:'Check whether score is at least 70.',mode:'code',code:'score = 85\nprint(score >= 70)'},
        {key:'logic-02',title:'Equality',prompt:'Check whether group equals "11A".',mode:'code',code:'group = "11A"\nprint(group == "11A")'},
        {key:'logic-03',title:'Different',prompt:'Check whether status is different from "done".',mode:'code',code:'status = "pending"\nprint(status != "done")'},
        {key:'logic-04',title:'AND',prompt:'A student is eligible if score >= 70 and attendance >= 0.80.',mode:'code',code:'score = 76\nattendance = 0.85\nprint(score >= 70 and attendance >= 0.80)'},
        {key:'logic-05',title:'OR',prompt:'Print whether x is negative OR greater than 100.',mode:'code',code:'x = 120\nprint(x < 0 or x > 100)'},
        {key:'logic-06',title:'Assignment vs comparison',prompt:'Which operator checks equality?',mode:'choice',choices:['=','==','=>','!=']}
      ]
    },
    {
      slug:'conditions', sequence:5, title:'Conditions with if, elif and else', nav:'Conditions',
      lead:'A condition converts a Boolean result into a decision about which block of code should run.',
      definition:'if checks a condition, elif checks another possibility, and else handles the remaining case. Indentation defines which instructions belong to each branch.',
      goals:['Write a valid if/else block.','Use elif for a third outcome.','Maintain consistent indentation.','Combine comparisons and conditions in practical rules.'],
      sections:[
        {title:'Programs can choose a path',body:'A condition lets the program execute different instructions for different data. The Boolean expression determines which branch is selected.'},
        {title:'Only the selected branch runs',body:'In an if/elif/else chain, Python checks conditions in order and executes the first matching branch.'},
        {title:'Indentation has meaning',body:'Indentation is not decoration in Python. It defines the block of instructions controlled by each condition.'}
      ],
      syntax:[['Start','if score >= 70:'],['Second branch','elif score >= 60:'],['Fallback','else:'],['Indented action','    print("pass")']],
      pitfalls:['Missing the colon after if/elif/else.','Mixing indentation levels.','Writing independent if statements when only one outcome should occur.'],
      diagrams:[
        {type:'decision-tree',title:'Decision tree',description:'A Boolean question separates the program into alternative paths.'},
        {type:'branch-order',title:'if → elif → else',description:'Python checks branches in order and stops after the first matching branch in the chain.'},
        {type:'indentation',title:'Indentation defines the block',description:'Indented statements belong to the branch above them.'}
      ],
      workshopIntro:'Solve the decision workshop in sequence. Loops remain locked until this topic is complete.',
      exercises:[
        {key:'cond-01',title:'Two branches',prompt:'Make the code print pass for score 76.',mode:'code',code:'score = 76\nif score >= 70:\n    print("pass")\nelse:\n    print("review")'},
        {key:'cond-02',title:'Three outcomes',prompt:'Make a score of 68 print close.',mode:'code',code:'score = 68\nif score >= 70:\n    print("pass")\nelif score >= 60:\n    print("close")\nelse:\n    print("review")'},
        {key:'cond-03',title:'Text condition',prompt:'Print lab when room equals "physics".',mode:'code',code:'room = "physics"\nif room == "physics":\n    print("lab")\nelse:\n    print("classroom")'},
        {key:'cond-04',title:'Combined condition',prompt:'Print enter only if age >= 16 and has_id is True.',mode:'code',code:'age = 17\nhas_id = True\nif age >= 16 and has_id:\n    print("enter")\nelse:\n    print("wait")'},
        {key:'cond-05',title:'Indentation',prompt:'Which line must be indented inside an if block?',mode:'choice',choices:['The variable created before if','The action executed when the condition is True','The word if only','Every line in the file']},
        {key:'cond-06',title:'Fallback',prompt:'Which keyword handles the remaining case after if/elif?',mode:'choice',choices:['then','otherwise','else','case']}
      ]
    },
    {
      slug:'loops', sequence:6, title:'Loops: repeat without copying code', nav:'Loops',
      lead:'A loop repeats an instruction for each item in a sequence instead of duplicating code.',
      definition:'A for loop takes one item at a time from a sequence. The indented block runs once per item. Accumulators and counters let repeated work become a summary.',
      goals:['Iterate through every value in a list.','Use an accumulator for totals.','Use a counter based on a condition.','Recognize when a loop replaces repetitive code.'],
      sections:[
        {title:'One instruction, many values',body:'A loop expresses repetition without copying the same lines for every observation.'},
        {title:'The loop variable changes each cycle',body:'On each iteration, the loop variable refers to the next item in the sequence.'},
        {title:'Accumulators and counters summarize',body:'A total or count can be updated during each iteration, turning repeated work into a statistical summary.'}
      ],
      syntax:[['Visit values','for value in values:'],['Indented action','    print(value)'],['Accumulator','total = total + value'],['Counter','count = count + 1'],['Range','for i in range(5):']],
      pitfalls:['Forgetting to indent the loop body.','Resetting the accumulator inside the loop.','Using the wrong loop variable name.'],
      diagrams:[
        {type:'loop-cycle',title:'Iteration cycle',description:'The loop takes one value, runs the body, then advances to the next value until the sequence ends.'},
        {type:'accumulator',title:'Accumulator pattern',description:'A running total begins before the loop and is updated once per observation.'},
        {type:'counter',title:'Conditional counter',description:'A counter increases only when the current observation satisfies a rule.'}
      ],
      workshopIntro:'Finish repetition, accumulation and counting stages to unlock Functions.',
      exercises:[
        {key:'loop-01',title:'Visit values',prompt:'Print each item on a new line.',mode:'code',code:'values = [3, 6, 9]\nfor value in values:\n    print(value)'},
        {key:'loop-02',title:'Accumulator',prompt:'Add all values with a loop and print total.',mode:'code',code:'values = [2, 4, 6, 8]\ntotal = 0\nfor value in values:\n    total = total + value\nprint(total)'},
        {key:'loop-03',title:'Counter',prompt:'Count values greater than 10.',mode:'code',code:'values = [4, 12, 18, 7, 15]\ncount = 0\nfor value in values:\n    if value > 10:\n        count = count + 1\nprint(count)'},
        {key:'loop-04',title:'Range',prompt:'Print 0 through 3 using range(4).',mode:'code',code:'for i in range(4):\n    print(i)'},
        {key:'loop-05',title:'Loop purpose',prompt:'When is a for loop useful?',mode:'choice',choices:['When a variable should never change','When the same process must be applied to each item','Only when printing text','Only for exactly ten values']},
        {key:'loop-06',title:'Accumulator placement',prompt:'Where should total = 0 normally be placed?',mode:'choice',choices:['Inside the loop before adding each value','After the final print only','Before the loop','Inside an if statement only']}
      ]
    },
    {
      slug:'functions', sequence:7, title:'Functions: name a reusable process', nav:'Functions',
      lead:'A function gives a reusable process a name and separates inputs from outputs.',
      definition:'Functions package instructions into reusable units. Parameters receive input and return sends a result back to the caller.',
      goals:['Define a function with def.','Pass one or more parameters.','Return a result instead of only printing it.','Reuse one function with different inputs.'],
      sections:[
        {title:'Functions reduce repetition',body:'A process written once can be called many times with different inputs.'},
        {title:'Parameters are inputs',body:'Parameters are names that receive values when the function is called.'},
        {title:'return produces an output',body:'return sends a value back so it can be stored, printed or used in another calculation.'}
      ],
      syntax:[['Define','def mean(a, b):'],['Return','    return (a + b) / 2'],['Call','mean(4, 6)'],['Store result','result = mean(4, 6)']],
      pitfalls:['Forgetting parentheses in the definition or call.','Using print when another calculation needs the returned value.','Placing return outside the function indentation.'],
      diagrams:[
        {type:'function-machine',title:'Input → function → output',description:'A function receives input, applies a named process and returns an output.'},
        {type:'define-call',title:'Definition vs call',description:'def stores the process; calling the function executes that stored process with actual values.'},
        {type:'return-print',title:'return vs print',description:'print displays a value; return makes the value available to the rest of the program.'}
      ],
      workshopIntro:'Complete the reusable-process workshop to unlock the final Statistics module.',
      exercises:[
        {key:'fn-01',title:'Simple function',prompt:'Define add and print add(4, 6).',mode:'code',code:'def add(a, b):\n    return a + b\n\nprint(add(4, 6))'},
        {key:'fn-02',title:'Return a mean',prompt:'Define average for a list and print the mean.',mode:'code',code:'def average(values):\n    return sum(values) / len(values)\n\nprint(average([4, 6, 8]))'},
        {key:'fn-03',title:'Reuse',prompt:'Call the same square function for 3 and 5.',mode:'code',code:'def square(x):\n    return x ** 2\n\nprint(square(3))\nprint(square(5))'},
        {key:'fn-04',title:'Two parameters',prompt:'Return the larger of a and b using max().',mode:'code',code:'def larger(a, b):\n    return max(a, b)\n\nprint(larger(7, 12))'},
        {key:'fn-05',title:'Return meaning',prompt:'What does return do?',mode:'choice',choices:['Prints every variable automatically','Sends a result back to the caller','Stops Python permanently','Creates a loop']},
        {key:'fn-06',title:'Function definition',prompt:'Which keyword starts a Python function definition?',mode:'choice',choices:['func','function','def','return']}
      ]
    },
    {
      slug:'statistics', sequence:8, title:'Statistics with lists', nav:'Statistics with lists',
      lead:'Combine lists, loops, conditions and functions to produce small statistical summaries.',
      definition:'For a list of numeric observations, useful first summaries include count, total, mean, minimum, maximum and range. Core Python is enough to construct these ideas before introducing larger libraries.',
      goals:['Calculate count, total and mean from a list.','Calculate minimum, maximum and range.','Count observations that satisfy a rule.','Package a summary inside a function.'],
      sections:[
        {title:'A dataset is a collection of observations',body:'Once observations are stored in a list, the same operation can summarize the complete dataset.'},
        {title:'Summary statistics compress information',body:'Count, mean, minimum, maximum and range describe different properties of the same data.'},
        {title:'Programming makes the method reusable',body:'Instead of manually recalculating every dataset, Python can apply the same statistical procedure consistently to new observations.'}
      ],
      syntax:[['Count','len(values)'],['Total','sum(values)'],['Mean','sum(values) / len(values)'],['Minimum','min(values)'],['Maximum','max(values)'],['Range','max(values) - min(values)']],
      pitfalls:['Confusing statistical range with Python range().','Forgetting to divide the total by the number of observations.','Mixing text values into a numeric list.'],
      diagrams:[
        {type:'stats-pipeline',title:'Dataset → summaries',description:'A single list feeds several descriptive statistics without changing the original observations.'},
        {type:'mean-balance',title:'Mean as equal share',description:'The mean can be understood as redistributing the total equally across all observations.'},
        {type:'range-span',title:'Range as maximum − minimum',description:'Range measures the full span between the smallest and largest observations.'},
        {type:'above-mean',title:'Counting observations above the mean',description:'Lists, loops, conditions and a counter can work together to answer a statistical question.'}
      ],
      workshopIntro:'This final workshop integrates the complete foundation path.',
      exercises:[
        {key:'stat-01',title:'Count and total',prompt:'Print count and total, one per line.',mode:'code',code:'values = [8, 12, 10, 14, 6]\nprint(len(values))\nprint(sum(values))'},
        {key:'stat-02',title:'Mean',prompt:'Calculate the mean.',mode:'code',code:'values = [8, 12, 10, 14, 6]\nprint(sum(values) / len(values))'},
        {key:'stat-03',title:'Range',prompt:'Print max - min.',mode:'code',code:'values = [8, 12, 10, 14, 6]\nprint(max(values) - min(values))'},
        {key:'stat-04',title:'Above the mean',prompt:'Count how many values are greater than the mean.',mode:'code',code:'values = [8, 12, 10, 14, 6]\nmean = sum(values) / len(values)\ncount = 0\nfor value in values:\n    if value > mean:\n        count = count + 1\nprint(count)'},
        {key:'stat-05',title:'Summary function',prompt:'Return mean and range from a function, then print them.',mode:'code',code:'def summary(values):\n    mean = sum(values) / len(values)\n    data_range = max(values) - min(values)\n    return mean, data_range\n\nprint(summary([2, 4, 6, 8]))'},
        {key:'stat-06',title:'Range meaning',prompt:'In descriptive statistics, range means:',mode:'choice',choices:['number of values','maximum + minimum','maximum - minimum','Python range()']}
      ]
    }
  ];

  window.IJR_PYTHON_HUB_TOPICS = Object.freeze(topics.map(topic => Object.freeze(topic)));
  window.IJR_PYTHON_HUB_TOPIC_MAP = Object.freeze(Object.fromEntries(topics.map(topic => [topic.slug, topic])));
})();
