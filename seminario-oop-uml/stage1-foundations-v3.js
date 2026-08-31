(() => {
  'use strict';

  const topic=(window.IJR_OOP_UML_DATA?.topics||[]).find(item=>item.n===1);
  if(topic){
    Object.assign(topic,{
      lead:'Start with the idea, not the syntax. OOP is a way to organize software around concepts that have data and actions. First identify the concept; only then translate it into a programming language.',
      uml:{name:'Book',attrs:['- title: String','- pages: int'],ops:['+ describe(): String']},
      concepts:[
        'OOP (Object-Oriented Programming) is a way to model a program using concepts that keep related data and actions together.',
        'A class is the general model or category: Book, Student, Sensor, GamePlayer, ShoppingCart or any other concept your program needs.',
        'An object (instance) is one concrete example created from that class. Two objects can follow the same model but store different values.',
        'An attribute is data that describes an object, such as title, pages, name, score, temperature or position.',
        'A method is an action or behavior that belongs to that concept, such as describe(), move(), read(), addItem() or calculateTotal().',
        'The OOP idea is portable: Python, Java, JavaScript, C#, C++, Kotlin, Swift and other object-oriented or multi-paradigm languages express the same model with different syntax.'
      ],
      mistakes:[
        'Starting with class syntax before deciding what concept the program is modeling.',
        'Thinking that a class and an object are the same thing.',
        'Adding attributes or methods only because they look technical, instead of because they belong to the concept.',
        'Believing OOP belongs to one language. The syntax changes; the modeling questions remain.'
      ],
      evidence:[
        'Explain class, object, attribute and method in your own words',
        'Create one simple class and two different objects from it',
        'Show at least one attribute that stores a different value in each object',
        'Explain how the same model could be expressed in another programming language'
      ]
    });
  }

  const cell=(id,title,purpose,steps,code)=>({id,title,purpose,steps,code});
  if(window.IJR_OOP_CODING_LABS){
    window.IJR_OOP_CODING_LABS[1]={
      theory:[
        cell(
          'theory-example',
          'First idea: one class, two objects',
          'See the smallest useful OOP example before adding more syntax.',
          [
            'Read the code and point to the class name Book.',
            'Run it and identify book_a and book_b as two different objects.',
            'Change only one title, run again and observe that the other object keeps its own value.'
          ],
          `class Book:\n    def __init__(self, title):\n        self.title = title\n\nbook_a = Book("Science")\nbook_b = Book("History")\n\nprint(book_a.title)\nprint(book_b.title)`
        ),
        cell(
          'theory-try',
          'Second idea: add one action',
          'Connect the four beginner ideas: class → object → attribute → method.',
          [
            'Run the cell and find the attribute title.',
            'Find the method describe() and explain what action it represents.',
            'Change the example to a different concept such as Pet, Player, Sensor or Product.'
          ],
          `class Book:\n    def __init__(self, title):\n        self.title = title\n\n    def describe(self):\n        return "Book: " + self.title\n\nbook = Book("Science")\nprint(book.describe())`
        )
      ],
      workshop:[
        cell(
          'implement',
          'Cell 1 · Choose a concept and create one object',
          'Start from a concept you understand, then make the smallest class possible.',
          [
            'Choose any concept: Book, Pet, Player, Sensor, Product, Task, Car, Song or your own idea.',
            'Rename YourConcept and attribute so they match your idea.',
            'Create object_1 from your class and print its stored data.'
          ],
          `# BEFORE CODING, write your idea in plain language:\n# Concept / class: ____________________\n# One piece of data / attribute: ____________________\n\nclass YourConcept:\n    def __init__(self, attribute):\n        self.attribute = attribute\n\n# Create one real object from the class.\nobject_1 = None  # replace None with YourConcept(...)\n\nassert object_1 is not None, "Create object_1 from your class first."\nprint(object_1.__dict__)`
        ),
        cell(
          'test',
          'Cell 2 · Create a second object',
          'Prove that one class can create multiple objects with different data.',
          [
            'Use the same class from Cell 1.',
            'Create object_2 with a different attribute value.',
            'Print both objects and explain what is shared and what is different.'
          ],
          `# object_1 already exists from Cell 1.\nobject_2 = None  # replace None with another object from the same class\n\nassert object_2 is not None, "Create object_2 from the same class."\nassert object_1 is not object_2, "The two variables must refer to different objects."\nprint("object_1:", object_1.__dict__)\nprint("object_2:", object_2.__dict__)`
        ),
        cell(
          'modify',
          'Cell 3 · Add one method',
          'Turn the concept from data-only into data + behavior.',
          [
            'Return to Cell 1 and add one simple method that belongs to your concept.',
            'Run Cell 1 again so Python knows the updated class, then recreate the objects if needed.',
            'Call the method here and print its result.'
          ],
          `# Example idea only: a Book could describe itself; a Player could show_score();\n# a Sensor could read(); a Product could show_price().\n\nresult = None  # replace with a method call such as object_1.your_method()\nassert result is not None, "Call the method you added to your class."\nprint(result)`
        )
      ]
    };
  }

  window.IJR_OOP_STAGE1_FOUNDATIONS=Object.freeze({
    definition:'Object-Oriented Programming is a way to organize a program around concepts. Each concept can keep the data it needs and the actions it can perform.',
    fourQuestions:[
      ['1 · What concept exists in the problem?','CLASS','A general model such as Book, Student, Sensor, Player or ShoppingCart.'],
      ['2 · What information can differ?','ATTRIBUTE','Data such as title, name, score, temperature, position or total.'],
      ['3 · What can that concept do?','METHOD','An action such as describe, move, read, addItem or calculateTotal.'],
      ['4 · Give one concrete example.','OBJECT / INSTANCE','One specific Book, one specific Player or one specific Sensor created from the class.']
    ],
    domains:[
      ['School','Student','name · grade','study()'],
      ['Game','Player','health · position','move()'],
      ['Science / data','Sensor','value · unit','read()'],
      ['Store','Product','name · price','showPrice()'],
      ['Software','Task','title · completed','complete()']
    ],
    pseudocode:`CLASS Sensor\n    DATA value\n    DATA unit\n    ACTION describe()\n\nCREATE sensorA FROM Sensor\nCREATE sensorB FROM Sensor`,
    transfer:[
      ['Python','class Sensor:','object = Sensor(...)'],
      ['Java','class Sensor { ... }','Sensor object = new Sensor(...);'],
      ['JavaScript','class Sensor { ... }','const object = new Sensor(...);'],
      ['C#','class Sensor { ... }','var object = new Sensor(...);']
    ],
    boundary:'The modeling idea is broader than class syntax. Some languages do not use classes in the same way; they can represent similar responsibilities with structs, records, modules, functions or composition. The goal is to understand the model first and the syntax second.'
  });
})();
