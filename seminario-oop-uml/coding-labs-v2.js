(() => {
  const cell=(id,title,purpose,steps,code)=>({id,title,purpose,steps,code});
  window.IJR_OOP_CODING_LABS={
    1:{
      theory:[
        cell('theory-example','Run the object model','Create two objects from one class and inspect independent state.',['Run the cell exactly as written.','Change only Nova battery from 65 to 80.','Run again and compare both objects.'],`class Robot:\n    def __init__(self, name, battery):\n        self.name = name\n        self.battery = battery\n\n    def describe(self):\n        return f"{self.name}: {self.battery}%"\n\nr1 = Robot("Atlas", 100)\nr2 = Robot("Nova", 65)\nprint(r1.describe())\nprint(r2.describe())`),
        cell('theory-try','Your turn: one blueprint, two instances','Complete the missing values without changing the class name.',['Create student_a and student_b.','Give them different names and scores.','Print both descriptions.'],`class Student:\n    def __init__(self, name, score):\n        self.name = name\n        self.score = score\n\n    def describe(self):\n        return f"{self.name} -> {self.score}"\n\n# TODO: create two different Student objects\n# student_a = ...\n# student_b = ...\n\n# TODO: print both descriptions`)
      ],
      workshop:[
        cell('implement','Cell 1 · Implement the class','Build a class with state and one behavior.',['Choose a class name related to a real object.','Add at least two instance attributes in __init__.','Add one method that uses object state.'],`# Build your class here.\n# Requirement: at least 2 attributes + 1 method.\n\nclass YourClass:\n    def __init__(self, ...):\n        pass\n\n    def describe(self):\n        pass`),
        cell('test','Cell 2 · Test independent state','Prove that two instances keep different state.',['Create two objects from your class.','Give them different values.','Print a method result from each object.'],`# Your class from Cell 1 remains available in this runtime.\n# Create two objects and prove their state is independent.\n\n# object_a = ...\n# object_b = ...\n# print(...)`),
        cell('modify','Cell 3 · Modify the design','Add one new attribute and make the method use it.',['Update the class in Cell 1.','Run Cell 1 again to redefine the class.','Return here, create a new object and verify the new state appears.'],`# After modifying the class, test the new requirement here.\n# new_object = ...\n# print(...)`)
      ]
    },
    2:{
      theory:[
        cell('theory-example','Run state-changing behavior','Watch a method modify object state.',['Run once and read both balances.','Change deposit(25) to deposit(60).','Run again and explain which line changes state.'],`class BankAccount:\n    def __init__(self, owner, balance=0):\n        self.owner = owner\n        self.balance = balance\n\n    def deposit(self, amount):\n        self.balance += amount\n\naccount = BankAccount("Ana", 100)\nprint("before:", account.balance)\naccount.deposit(25)\nprint("after:", account.balance)`),
        cell('theory-try','Your turn: controlled state change','Complete a method that decreases available stock.',['Store stock in the object.','Subtract quantity only when enough stock exists.','Print stock before and after.'],`class Product:\n    def __init__(self, name, stock):\n        self.name = name\n        self.stock = stock\n\n    def sell(self, quantity):\n        # TODO: change stock only when quantity is valid\n        pass\n\nitem = Product("Notebook", 10)\nprint("before:", item.stock)\n# TODO: call sell(...)\nprint("after:", item.stock)`)
      ],
      workshop:[
        cell('implement','Cell 1 · Implement state + behavior','Create an object whose method changes one stored value.',['Define one numeric state attribute.','Write one method that changes it.','Make the rule visible in the code.'],`class Counter:\n    def __init__(self, value=0):\n        self.value = value\n\n    def change(self, amount):\n        # TODO: update self.value\n        pass`),
        cell('test','Cell 2 · Test the transition','Show the state before and after the method call.',['Create one object.','Print the initial state.','Call the method and print the new state.'],`# counter = Counter(...)\n# print("before:", ...)\n# counter.change(...)\n# print("after:", ...)`),
        cell('modify','Cell 3 · Add a business rule','Prevent one invalid state change.',['Choose a meaningful invariant.','Update the method in Cell 1.','Re-run Cell 1 and test both valid and invalid changes.'],`# Test one valid and one invalid state transition here.`)
      ]
    },
    3:{
      theory:[
        cell('theory-example','Run constructor validation','See a constructor accept coherent state and reject invalid state.',['Run the valid object first.','Uncomment the invalid object line.','Run again and read the terminal error.'],`class Student:\n    def __init__(self, name, grade):\n        if not name.strip():\n            raise ValueError("name required")\n        if not 0 <= grade <= 5:\n            raise ValueError("grade must be 0..5")\n        self.name = name\n        self.grade = grade\n\nstudent = Student("Laura", 4.2)\nprint(student.name, student.grade)\n# invalid = Student("", 8)`),
        cell('theory-try','Your turn: valid birth state','Add validation to a Rectangle constructor.',['Reject non-positive width.','Reject non-positive height.','Create one valid rectangle and print its area.'],`class Rectangle:\n    def __init__(self, width, height):\n        # TODO: validate width and height\n        self.width = width\n        self.height = height\n\n    def area(self):\n        return self.width * self.height\n\n# TODO: create and test a valid rectangle`)
      ],
      workshop:[
        cell('implement','Cell 1 · Constructor contract','Create a class that cannot start with invalid required state.',['Choose two required constructor parameters.','Validate at least one parameter.','Raise ValueError with a readable message.'],`class CourseMember:\n    def __init__(self, name, level):\n        # TODO: validate required state\n        pass`),
        cell('test','Cell 2 · Valid + invalid construction','Demonstrate both accepted and rejected construction.',['Create one valid object.','Use try/except for one invalid case.','Print the result of both cases.'],`# valid = CourseMember(...)\n# print(...)\n\n# try:\n#     invalid = CourseMember(...)\n# except ValueError as error:\n#     print("rejected:", error)`),
        cell('modify','Cell 3 · New required state','Add one constructor requirement and update the test.',['Add a third constructor parameter.','Validate or normalize it.','Create an object using the new signature.'],`# Test the new constructor signature after redefining the class.`)
      ]
    },
    4:{
      theory:[
        cell('theory-example','Run controlled access','Use a method instead of uncontrolled direct changes.',['Run the valid temperature update.','Try set_temperature(80).','Observe that the invariant stays protected.'],`class Thermostat:\n    def __init__(self, temperature):\n        self._temperature = temperature\n\n    @property\n    def temperature(self):\n        return self._temperature\n\n    def set_temperature(self, value):\n        if 10 <= value <= 30:\n            self._temperature = value\n        else:\n            print("rejected")\n\nt = Thermostat(20)\nt.set_temperature(25)\nprint(t.temperature)`),
        cell('theory-try','Your turn: protect an invariant','Control changes to a score.',['Store score as _score.','Expose a read-only property.','Allow updates only from 0 to 100.'],`class GamePlayer:\n    def __init__(self, score=0):\n        self._score = score\n\n    # TODO: add a property\n    # TODO: add a controlled update method`)
      ],
      workshop:[
        cell('implement','Cell 1 · Encapsulate state','Protect one internal attribute behind public behavior.',['Use an underscore-prefixed internal attribute.','Add a public method to change it.','Reject invalid updates.'],`class ProtectedValue:\n    def __init__(self, value):\n        self._value = value\n\n    def update(self, value):\n        # TODO: validate and update\n        pass`),
        cell('test','Cell 2 · Test the public interface','Use only the public method in the normal test path.',['Create an object.','Run one valid update.','Run one invalid update and show final state.'],`# item = ProtectedValue(...)\n# item.update(...)\n# item.update(...)\n# print(item._value)`),
        cell('modify','Cell 3 · Strengthen the invariant','Add one more validation rule without changing the public goal.',['Redefine the class.','Keep the same update(...) method name.','Test the strengthened rule.'],`# Test the stronger invariant here.`)
      ]
    },
    5:{
      theory:[
        cell('theory-example','Run a has-a relationship','Build an Order that contains Item objects.',['Run and inspect the total.','Add a third Item.','Explain why Order has Items instead of being an Item.'],`class Item:\n    def __init__(self, name, price):\n        self.name = name\n        self.price = price\n\nclass Order:\n    def __init__(self):\n        self.items = []\n\n    def add_item(self, item):\n        self.items.append(item)\n\n    def total(self):\n        return sum(item.price for item in self.items)\n\norder = Order()\norder.add_item(Item("A", 12))\norder.add_item(Item("B", 8))\nprint(order.total())`),
        cell('theory-try','Your turn: collaboration','Connect a Library and Book objects.',['Create Book with title.','Create Library with a list of books.','Add and print at least two titles.'],`# TODO: define Book\n# TODO: define Library\n# TODO: create the object graph and print the titles`)
      ],
      workshop:[
        cell('implement','Cell 1 · Build collaborating classes','Create at least two classes in a has-a relationship.',['Give each class one focused responsibility.','Store a reference/list of the related object.','Add one collaboration method.'],`# Define class A and class B.\n# Make one object contain or reference the other.`),
        cell('test','Cell 2 · Create the object graph','Instantiate the collaboration and make objects interact.',['Create the part/dependency first.','Create the owner/collaborator.','Call behavior that crosses the relationship.'],`# Build and exercise the object graph here.`),
        cell('modify','Cell 3 · Change ownership','Modify who owns or creates the related object.',['Change the lifecycle decision.','Update code to match the UML relationship.','Run the collaboration again.'],`# Test the changed ownership decision here.`)
      ]
    },
    6:{
      theory:[
        cell('theory-example','Run inheritance + override','Call the same method on parent and child objects.',['Run and compare outputs.','Create another child class.','Override move() differently.'],`class Vehicle:\n    def move(self):\n        return "moving"\n\nclass Bicycle(Vehicle):\n    def move(self):\n        return "pedaling"\n\nvehicles = [Vehicle(), Bicycle()]\nfor vehicle in vehicles:\n    print(vehicle.move())`),
        cell('theory-try','Your turn: valid is-a','Create Animal and one specialized child.',['Parent defines speak().','Child overrides speak().','Print both through the same method name.'],`class Animal:\n    def speak(self):\n        return "sound"\n\n# TODO: define a child class\n# TODO: create objects and call speak()`)
      ],
      workshop:[
        cell('implement','Cell 1 · Parent + child','Implement a defensible is-a hierarchy.',['Parent owns shared behavior.','Child inherits from parent.','Override one method.'],`class Parent:\n    def behavior(self):\n        return "parent"\n\n# TODO: define Child(Parent) and override behavior()`),
        cell('test','Cell 2 · Substitution test','Use parent and child through the same expected behavior.',['Create one parent and one child.','Put them in one list.','Call the same method on both.'],`# objects = [Parent(), Child()]\n# for obj in objects:\n#     print(obj.behavior())`),
        cell('modify','Cell 3 · Add another subtype','Add a second child only if the is-a relationship remains true.',['Create another child.','Override the shared behavior.','Compare all three objects.'],`# Add and test a second child class.`)
      ]
    },
    7:{
      theory:[
        cell('theory-example','Run polymorphism through a contract','Use different Shape implementations through area().',['Run the list of shapes.','Change Circle radius.','Add another Shape implementation.'],`from abc import ABC, abstractmethod\n\nclass Shape(ABC):\n    @abstractmethod\n    def area(self):\n        pass\n\nclass Circle(Shape):\n    def __init__(self, radius):\n        self.radius = radius\n    def area(self):\n        return 3.1416 * self.radius**2\n\nclass Square(Shape):\n    def __init__(self, side):\n        self.side = side\n    def area(self):\n        return self.side**2\n\nfor shape in [Circle(2), Square(3)]:\n    print(round(shape.area(), 2))`),
        cell('theory-try','Your turn: common contract','Create two payment strategies with pay(amount).',['Define a common abstract contract or shared expectation.','Create two implementations.','Process both in one loop.'],`# TODO: define a Payment contract\n# TODO: define two concrete implementations\n# TODO: call pay(amount) polymorphically`)
      ],
      workshop:[
        cell('implement','Cell 1 · Stable contract','Define one contract and two implementations.',['Use ABC/abstractmethod or a clear common method.','Both classes implement the same behavior name.','Keep caller knowledge minimal.'],`# Define the contract and two concrete classes here.`),
        cell('test','Cell 2 · Polymorphic caller','Write caller code that depends on the contract, not class-specific branches.',['Create both implementations.','Store them together.','Call the same behavior on each.'],`# Use one loop/function to call the common behavior.`),
        cell('modify','Cell 3 · Extend without changing caller','Add a third implementation.',['Do not rewrite caller logic.','Implement the same contract.','Run the caller with all implementations.'],`# Add a third concrete implementation and reuse the same caller.`)
      ]
    },
    8:{
      theory:[
        cell('theory-example','Run a small architecture','Coordinate several focused services.',['Run the system.','Add one more service object.','Explain why ProjectSystem coordinates instead of doing every task itself.'],`class Service:\n    def __init__(self, name):\n        self.name = name\n    def start(self):\n        return f"{self.name} started"\n\nclass ProjectSystem:\n    def __init__(self, services):\n        self.services = services\n    def start(self):\n        return [service.start() for service in self.services]\n\nsystem = ProjectSystem([Service("API"), Service("Database")])\nprint(system.start())`),
        cell('theory-try','Your turn: three responsibilities','Create a small 3-class architecture.',['Give each class one responsibility sentence.','Connect them with explicit references.','Execute one end-to-end use case.'],`# TODO: define 3 focused classes\n# TODO: connect them\n# TODO: run one use case`)
      ],
      workshop:[
        cell('implement','Cell 1 · Architecture skeleton','Translate a 3–6 class UML design into a thin Python skeleton.',['Create class names from the UML.','Add only essential state and method signatures.','Wire dependencies explicitly.'],`# Implement the architecture skeleton here.`),
        cell('test','Cell 2 · One use case','Instantiate the collaboration path for one concrete scenario.',['Create dependencies in a logical order.','Create the coordinating object.','Run one end-to-end behavior.'],`# Instantiate and run one architecture use case.`),
        cell('modify','Cell 3 · Move a responsibility','Refactor one misplaced responsibility to a better class.',['Identify one low-cohesion class.','Move behavior/state.','Re-run the same use case.'],`# Test the architecture after moving one responsibility.`)
      ]
    },
    9:{
      theory:[
        cell('theory-example','Run a refactoring without behavior change','Separate data access from service logic.',['Run and record the result.','Rename/refactor an internal helper.','Run again and keep the observable result equal.'],`class Repository:\n    def load(self):\n        return [2, 4, 6]\n\nclass Service:\n    def __init__(self, repository):\n        self.repository = repository\n    def execute(self):\n        data = self.repository.load()\n        return sum(data)\n\nservice = Service(Repository())\nprint(service.execute())`),
        cell('theory-try','Your turn: preserve behavior','Refactor a class while keeping output stable.',['Run a before result.','Improve one structural issue.','Run after and compare results.'],`# Write a small before/after refactor experiment here.`)
      ],
      workshop:[
        cell('implement','Cell 1 · Baseline design','Create the current design and record its observable behavior.',['Implement the current structure.','Run a representative use case.','Print a baseline result.'],`# Current design + baseline output.`),
        cell('test','Cell 2 · Regression check','Create a repeatable behavior check before refactoring.',['Store expected output.','Run current code.','Use assert to verify behavior.'],`# expected = ...\n# actual = ...\n# assert actual == expected\n# print("baseline behavior preserved")`),
        cell('modify','Cell 3 · Refactor + re-test','Improve structure and prove behavior is preserved.',['Refactor one responsibility/dependency.','Re-run definitions.','Execute the same assertion.'],`# Refactored design + the same regression check.`)
      ]
    },
    10:{
      theory:[
        cell('theory-example','Run an architecture defense example','Show a clean dependency and one use case.',['Run the use case.','Change the request value.','Identify the dependency you would replace first.'],`class DomainService:\n    def execute(self, request):\n        return request.upper()\n\nclass FinalProject:\n    def __init__(self, domain_service):\n        self.domain_service = domain_service\n    def run_use_case(self, request):\n        return self.domain_service.execute(request)\n\nproject = FinalProject(DomainService())\nprint(project.run_use_case("demo"))`),
        cell('theory-try','Your turn: defendable change','Create one small architecture and prepare a live change.',['Implement two or more collaborating classes.','Run one use case.','Change one requirement and keep the model coherent.'],`# Build a small defendable architecture here.`)
      ],
      workshop:[
        cell('implement','Cell 1 · Final synchronized implementation','Implement the architecture represented by your current UML diagram.',['Match class names and responsibilities.','Match important relationships/dependencies.','Keep code small enough to explain live.'],`# Implement your final architecture here.`),
        cell('test','Cell 2 · Representative use case','Demonstrate one end-to-end behavior that proves the design works.',['Create the object graph.','Run one representative use case.','Print/assert the expected result.'],`# Run the representative use case here.`),
        cell('modify','Cell 3 · Live requirement change','Accept one small requirement change and propagate it through code.',['State the change in one sentence.','Update the correct class/relationship.','Re-run the use case and explain the impact.'],`# Implement and test the live change here.`)
      ]
    }
  };
})();
