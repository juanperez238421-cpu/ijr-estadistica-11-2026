(() => {
  'use strict';

  const arrays = window.IJR_PYTHON_HUB_TOPIC_MAP?.arrays;
  if (!arrays) return;

  const prompts = {
    'arr-01': 'Start from a blank Python cell. Create a variable named values containing [6, 10, 15, 21]. Use zero-based bracket indexing to access the item in the third position, then print the value obtained from the list. The printed result must come from the indexing operation; do not copy the visible third number into a direct print.',
    'arr-02': 'Start from a blank Python cell. Create a variable named values containing [5, 10, 15, 20]. Use Python\'s len() function on the list variable to obtain the number of items, then print that returned count. Do not count the items manually and do not print a guessed count.',
    'arr-03': 'Start from a blank Python cell. Create a variable named values containing [5, 10, 15, 20]. Use Python\'s sum() function on the complete list and print the value returned by that calculation. Do not add the visible numbers manually and do not print a pre-calculated total.',
    'arr-04': 'Start from a blank Python cell. Create a variable named values containing [8, 4, 21, 13]. Use min() and max() on the list variable. Print the minimum first and the maximum second, one output per line. Both outputs must come from the list operations rather than copied values.',
    'arr-05': 'Start from a blank Python cell. Create a variable named values containing [6, 12]. Use append() to add 18 to that same list. After the list changes, print the list variable itself. Do not type the completed list directly as the answer.',
    'arr-06': 'Start from a blank Python cell. Create a variable named values containing [10, 15, 5, 20]. Calculate the mean from the list by dividing its sum by its length. Store the calculated mean in a variable and print that variable. Do not calculate the final mean outside Python and print it as a literal.',
    'arr-07': 'Start from a blank Python cell. Create a variable named values containing [4, 9, 16, 25]. Use zero-based bracket indexing to access the item in the second position and print the value obtained from the list. Do not copy the visible second number into a direct print.',
    'arr-08': 'Start from a blank Python cell. Create a variable named values containing [3, 7, 11, 15]. Use len() to obtain the list length, derive the last valid zero-based index from that length, then use the calculated index to access and print the last item. Do not hard-code the final item or the final index.',
    'arr-09': 'Start from a blank Python cell. Create a variable named values containing [5, 10, 15, 20]. Append 25 to the same list first. Then use len() on the updated list and print the returned count. The count must be measured after the append operation, not typed directly.',
    'arr-10': 'Start from a blank Python cell. Create a variable named values containing [12, 7, 19, 10]. Use max() and min() on the list and subtract the minimum from the maximum. Print the calculated range. Do not inspect the numbers and type the range directly.',
    'arr-11': 'Start from a blank Python cell. Create a variable named values containing [2, 4, 6]. Append 8 to the same list, then use sum() on the updated list and print the calculated total. Do not type the post-append total directly.',
    'arr-12': 'Start from a blank Python cell. Create a variable named values containing [11, 22, 33, 44]. Access the first and last items through list indexing, add the two accessed values, and print the calculated result. Do not copy the visible endpoint numbers into a separate direct calculation.'
  };

  for (const exercise of arrays.exercises || []) {
    if (prompts[exercise.key]) exercise.prompt = prompts[exercise.key];
  }

  window.IJR_PYTHON_HUB_ARRAY_PROMPTS_V28 = Object.freeze({
    topic: 'arrays',
    stages: Object.keys(prompts).length,
    blankCellAuthorship: true
  });
})();