(() => {
  'use strict';

  const topics = window.IJR_PYTHON_HUB_TOPICS || [];
  const bySlug = Object.fromEntries(topics.map(topic => [topic.slug, topic]));

  const promptOverrides = {
    'type-01': 'Start from a blank cell. Create a variable named value with the integer 42. Print only the short Python type name of that variable.',
    'type-02': 'Start from a blank cell. Create a variable named value with the decimal 4.5. Print only the short Python type name of that variable.',
    'type-03': 'Start from a blank cell. Create a variable named value with the text "11A". Print only the short Python type name of that variable.',
    'type-04': 'Start from a blank cell. Create a variable named value with the Boolean True. Print only the short Python type name of that variable.',
    'type-05': 'Start from a blank cell. Store the text "12" in a variable. Convert it to an integer, add 3 to the converted number, and print the calculated result. Do not type the final result directly.',
    'type-06': 'Start from a blank cell. Create a variable named value whose value is None. Print only the short Python type name of that variable.',

    'arr-01': 'Start from a blank cell. Create the list [6, 10, 15, 21]. Print the third value by using its zero-based index. Do not copy the visible number directly into print(...).',
    'arr-02': 'Start from a blank cell. Create the list [5, 10, 15, 20]. Use Python to print the number of items in the list; do not count the items manually.',
    'arr-03': 'Start from a blank cell. Create the list [5, 10, 15, 20]. Use Python to calculate and print the total of the complete list.',
    'arr-04': 'Start from a blank cell. Create the list [8, 4, 21, 13]. Print the minimum on the first output line and the maximum on the second output line.',
    'arr-05': 'Start from a blank cell. Create the list [6, 12]. Append 18 to that same list, then print the complete updated list.',
    'arr-06': 'Start from a blank cell. Create the list [10, 15, 5, 20]. Calculate the mean using the total of the list divided by its length, then print the calculated mean.',

    'logic-01': 'Start from a blank cell. Store 85 in a variable named score. Print the Boolean result of checking whether score is at least 70.',
    'logic-02': 'Start from a blank cell. Store the text "11A" in a variable named group. Print the Boolean result of checking whether group equals "11A".',
    'logic-03': 'Start from a blank cell. Store the text "pending" in a variable named status. Print the Boolean result of checking whether status is different from "done".',
    'logic-04': 'Start from a blank cell. Store score = 76 and attendance = 0.85. Print the Boolean result of the rule: score must be at least 70 AND attendance must be at least 0.80.',
    'logic-05': 'Start from a blank cell. Store x = 120. Print the Boolean result of checking whether x is negative OR greater than 100.',

    'cond-01': 'Start from a blank cell. Store score = 76. Write an if/else decision that prints "pass" when score is at least 70 and prints "review" otherwise.',
    'cond-02': 'Start from a blank cell. Store score = 68. Write an if/elif/else chain: print "pass" for scores at least 70, "close" for scores at least 60, and "review" otherwise.',
    'cond-03': 'Start from a blank cell. Store room = "physics". Write an if/else decision that prints "lab" when room equals "physics" and "classroom" otherwise.',
    'cond-04': 'Start from a blank cell. Store age = 17 and has_id = True. Print "enter" only when age is at least 16 AND has_id is True; otherwise print "wait".',

    'loop-01': 'Start from a blank cell. Create the list [3, 6, 9]. Use a for loop to print each item on its own output line.',
    'loop-02': 'Start from a blank cell. Create the list [2, 4, 6, 8]. Use a loop and an accumulator that starts at 0 to add all values, then print the final total after the loop.',
    'loop-03': 'Start from a blank cell. Create the list [4, 12, 18, 7, 15]. Use a loop and a counter to count how many values are greater than 10, then print the final count.',
    'loop-04': 'Start from a blank cell. Use a for loop with range(4) and print the loop variable on each iteration.',

    'fn-01': 'Start from a blank cell. Define a function named add with two parameters. Return their sum. Call add with 4 and 6, and print the returned value.',
    'fn-02': 'Start from a blank cell. Define a function named average that receives a list, returns sum(values) divided by len(values), then call it with [3, 6, 9] and print the returned mean.',
    'fn-03': 'Start from a blank cell. Define a function named square with one parameter that returns the parameter raised to power 2. Print square(3) and square(5), one result per line.',
    'fn-04': 'Start from a blank cell. Define a function with two parameters that returns the larger value using max(...). Call it with 7 and 12 and print the returned value.',

    'stat-01': 'Start from a blank cell. Create the dataset [8, 12, 10, 14, 6]. Print the number of observations on the first line and the total on the second line.',
    'stat-02': 'Start from a blank cell. Create the dataset [8, 12, 10, 14, 6]. Calculate the mean as total divided by number of observations and print it.',
    'stat-03': 'Start from a blank cell. Create the dataset [8, 12, 10, 14, 6]. Calculate the statistical range as maximum minus minimum and print it.',
    'stat-04': 'Start from a blank cell. Create the dataset [8, 12, 10, 14, 6]. Calculate its mean, then use a loop and counter to count values strictly greater than the mean. Print the count.',
    'stat-05': 'Start from a blank cell. Define a function named summary(values) that returns two calculated values: the mean and the statistical range. Call it with [2, 4, 6, 8] and print the returned pair.'
  };

  const additions = {
    operations: [
      {key:'op-11', title:'Reuse subtraction and division', prompt:'Start from a blank cell. Store total = 96 and used = 28. Create a variable for the remaining amount using subtraction. Then create another variable equal to half of that remaining amount using division, and print only the final calculated value.', mode:'code', code:''},
      {key:'op-12', title:'Build a multi-step total', prompt:'Start from a blank cell. Store price = 12.5, quantity = 4, and fee = 3. Calculate subtotal from price times quantity, then calculate total from subtotal plus fee. Print only the final total. Do not type the final numerical answer directly.', mode:'code', code:''}
    ],
    types: [
      {key:'type-07', title:'Convert text and inspect type', prompt:'Start from a blank cell. Store the text "25" in a variable. Convert it to an integer in a second variable and print only the short type name of the converted variable.', mode:'code', code:''},
      {key:'type-08', title:'Convert integer to float', prompt:'Start from a blank cell. Store the integer 7 in a variable. Convert it to a float in a second variable and print the converted value.', mode:'code', code:''},
      {key:'type-09', title:'Convert number to string', prompt:'Start from a blank cell. Store the integer 34 in a variable. Convert it to text in a second variable and print only the short type name of the converted value.', mode:'code', code:''},
      {key:'type-10', title:'A comparison creates a Boolean', prompt:'Start from a blank cell. Store score = 15. Create a second variable containing the result of checking whether score is greater than 10. Print only the short type name of that second variable.', mode:'code', code:''},
      {key:'type-11', title:'Use string conversion', prompt:'Start from a blank cell. Store age = 16. Convert age to text in a second variable and print the converted text value.', mode:'code', code:''},
      {key:'type-12', title:'Reassignment can change type', prompt:'Start from a blank cell. Create value = None. On a later line reassign value = 3.5. Print only the short type name after the reassignment.', mode:'code', code:''}
    ],
    arrays: [
      {key:'arr-07', title:'Read the second item', prompt:'Start from a blank cell. Create the list [4, 9, 16, 25]. Print the second item by using its zero-based index, not by copying the visible value.', mode:'code', code:''},
      {key:'arr-08', title:'Read the last item using length', prompt:'Start from a blank cell. Create the list [3, 7, 11, 15]. Use len(values) to calculate the index of the last item and print that item.', mode:'code', code:''},
      {key:'arr-09', title:'Append and measure length', prompt:'Start from a blank cell. Create [5, 10, 15, 20], append 25 to the same list, then print the new length of the list.', mode:'code', code:''},
      {key:'arr-10', title:'Range from a list', prompt:'Start from a blank cell. Create [12, 7, 19, 10]. Calculate maximum minus minimum from the list and print the result.', mode:'code', code:''},
      {key:'arr-11', title:'Append before summing', prompt:'Start from a blank cell. Create [2, 4, 6], append 8, then use Python to calculate and print the total of the updated list.', mode:'code', code:''},
      {key:'arr-12', title:'Combine first and last items', prompt:'Start from a blank cell. Create [11, 22, 33, 44]. Use indexes to access the first and last values, add those accessed values, and print the calculated result.', mode:'code', code:''}
    ],
    logic: [
      {key:'logic-07', title:'Compare a group label', prompt:'Start from a blank cell. Store group = "11B". Print the Boolean result of checking whether group equals "11B".', mode:'code', code:''},
      {key:'logic-08', title:'Invert a Boolean with not', prompt:'Start from a blank cell. Store score = 55. Create passed from the comparison score >= 70. Print the Boolean result of not passed.', mode:'code', code:''},
      {key:'logic-09', title:'Either condition with or', prompt:'Start from a blank cell. Store temperature = 18. Print whether temperature is below 10 OR above 30.', mode:'code', code:''},
      {key:'logic-10', title:'Two limits with and', prompt:'Start from a blank cell. Store x = 12. Print whether x is greater than 5 AND less than 20.', mode:'code', code:''},
      {key:'logic-11', title:'Check two values are different', prompt:'Start from a blank cell. Store a = 8 and b = 12. Print the Boolean result of checking whether the two values are different.', mode:'code', code:''},
      {key:'logic-12', title:'Combine comparison and not', prompt:'Start from a blank cell. Store age = 17 and has_id = False. Print the Boolean result of: age is at least 16 AND has_id is not True.', mode:'code', code:''}
    ],
    conditions: [
      {key:'cond-07', title:'Classify sign', prompt:'Start from a blank cell. Store number = -4. Use if/elif/else to print "positive" when number > 0, "negative" when number < 0, and "zero" otherwise.', mode:'code', code:''},
      {key:'cond-08', title:'Even or odd decision', prompt:'Start from a blank cell. Store number = 18. Use the remainder operator inside an if/else decision to print "even" when the number is divisible by 2 and "odd" otherwise.', mode:'code', code:''},
      {key:'cond-09', title:'Three score bands', prompt:'Start from a blank cell. Store score = 82. Use if/elif/else to print "excellent" for score >= 90, "approved" for score >= 70, and "review" otherwise.', mode:'code', code:''},
      {key:'cond-10', title:'Select the larger variable', prompt:'Start from a blank cell. Store a = 14 and b = 9. Use if/else to print "a" when a is greater than b; otherwise print "b".', mode:'code', code:''},
      {key:'cond-11', title:'Temperature category', prompt:'Start from a blank cell. Store temperature = 30. Use if/elif/else to print "hot" for temperature >= 30, "warm" for temperature >= 20, and "cool" otherwise.', mode:'code', code:''},
      {key:'cond-12', title:'Eligibility decision', prompt:'Start from a blank cell. Store score = 76 and attendance = 0.85. Use one if/else decision to print "eligible" only when score >= 70 AND attendance >= 0.80; otherwise print "review".', mode:'code', code:''}
    ],
    loops: [
      {key:'loop-07', title:'Double every value', prompt:'Start from a blank cell. Create [2, 4, 6]. Use a for loop to print each value multiplied by 2 on its own output line.', mode:'code', code:''},
      {key:'loop-08', title:'Count even observations', prompt:'Start from a blank cell. Create [3, 4, 8, 11, 14]. Use a loop, a remainder test, and a counter to count the even values. Print the final count after the loop.', mode:'code', code:''},
      {key:'loop-09', title:'Sum values above a threshold', prompt:'Start from a blank cell. Create [5, 12, 7, 20, 15]. Use a loop and accumulator to add only the values greater than 10, then print the final total.', mode:'code', code:''},
      {key:'loop-10', title:'Range with a nonzero start', prompt:'Start from a blank cell. Use a for loop with range(1, 5) and print the loop variable on each iteration.', mode:'code', code:''},
      {key:'loop-11', title:'Product accumulator', prompt:'Start from a blank cell. Create [2, 3, 4]. Start product = 1, multiply the accumulator by each value inside a loop, then print the final product.', mode:'code', code:''},
      {key:'loop-12', title:'Sum of squares', prompt:'Start from a blank cell. Create [1, 2, 3, 4]. Use a loop and accumulator to add the square of every value, then print the final accumulated total.', mode:'code', code:''}
    ],
    functions: [
      {key:'fn-07', title:'Return a difference', prompt:'Start from a blank cell. Define subtract(a, b) so it returns a minus b. Call subtract(20, 7) and print the returned result.', mode:'code', code:''},
      {key:'fn-08', title:'Return an even check', prompt:'Start from a blank cell. Define is_even(number) so it returns the Boolean result of checking whether the remainder after division by 2 is zero. Call is_even(14) and print the returned value.', mode:'code', code:''},
      {key:'fn-09', title:'Return a list total', prompt:'Start from a blank cell. Define list_total(values) so it returns the sum of the list. Call it with [3, 6, 9] and print the returned total.', mode:'code', code:''},
      {key:'fn-10', title:'Return statistical range', prompt:'Start from a blank cell. Define data_range(values) so it returns maximum minus minimum. Call it with [4, 11, 7, 19] and print the returned range.', mode:'code', code:''},
      {key:'fn-11', title:'Function with a threshold', prompt:'Start from a blank cell. Define count_above(values, threshold). Use a loop and counter inside the function to count values greater than threshold, return the count, then call it with [5, 12, 18, 7] and threshold 10 and print the returned result.', mode:'code', code:''},
      {key:'fn-12', title:'Return first and last', prompt:'Start from a blank cell. Define first_last(values) so it returns a pair containing the first and last list items. Use indexes, call it with [8, 10, 12, 14], and print the returned pair.', mode:'code', code:''}
    ],
    statistics: [
      {key:'stat-07', title:'Minimum and maximum', prompt:'Start from a blank cell. Create [18, 5, 12, 20]. Print the minimum on the first line and the maximum on the second line.', mode:'code', code:''},
      {key:'stat-08', title:'Mean after a new observation', prompt:'Start from a blank cell. Create [4, 6, 8], append 10, then calculate and print the mean of the updated dataset.', mode:'code', code:''},
      {key:'stat-09', title:'Percentage meeting a threshold', prompt:'Start from a blank cell. Create [60, 75, 80, 55, 90]. Use a loop to count values at least 70, divide the count by the dataset length, multiply by 100, and print the calculated percentage.', mode:'code', code:''},
      {key:'stat-10', title:'Compare two ranges', prompt:'Start from a blank cell. Create dataset_a = [4, 8, 12] and dataset_b = [10, 11, 12]. Calculate each statistical range. Print the range of dataset_a first and the range of dataset_b second.', mode:'code', code:''},
      {key:'stat-11', title:'Mean and range together', prompt:'Start from a blank cell. Create [2, 4, 6, 8]. Calculate the mean and the statistical range. Print the mean on the first line and the range on the second line.', mode:'code', code:''},
      {key:'stat-12', title:'Count observations below the mean', prompt:'Start from a blank cell. Create [3, 5, 7, 9, 11]. Calculate the mean, then use a loop and counter to count values strictly below the mean. Print the final count.', mode:'code', code:''}
    ]
  };

  for (const topic of topics) {
    for (const exercise of topic.exercises || []) {
      if (promptOverrides[exercise.key]) exercise.prompt = promptOverrides[exercise.key];
      if (exercise.mode === 'code') exercise.code = '';
    }

    const existingKeys = new Set((topic.exercises || []).map(exercise => exercise.key));
    for (const exercise of additions[topic.slug] || []) {
      if (!existingKeys.has(exercise.key)) {
        topic.exercises.push(exercise);
        existingKeys.add(exercise.key);
      }
    }

    if ((topic.exercises || []).length < 12) {
      throw new Error(`Workshop ${topic.slug} must contain at least 12 stages.`);
    }
  }

  window.IJR_PYTHON_HUB_WORKSHOP_POLICY_V27 = Object.freeze({
    minimumProblemsPerTopic: 12,
    blankCodeCells: true,
    totalProblems: topics.reduce((sum, topic) => sum + topic.exercises.length, 0)
  });
})();
