(() => {
  'use strict';
  const C=(key,title,prompt)=>({key,title,prompt:`Start from a blank cell. ${prompt}`,mode:'code',code:''});
  const Q=(key,title,prompt,choices)=>({key,title,prompt,mode:'choice',choices});
  const T=(slug,sequence,title,nav,lead,definition,syntax,sections,exercises)=>({
    slug,sequence,title,nav,lead,definition,
    goals:[`Use ${nav.toLowerCase()} to answer a statistical question.`,`Interpret the result in data-analysis context.`],
    sections:sections.map(([sectionTitle,body])=>({title:sectionTitle,body})),syntax,
    pitfalls:['Calculating before checking the data.','Typing a final answer instead of generating it from the dataset.','Interpreting a numerical result without context.'],
    diagrams:[
      {type:'stats-pipeline',title:'Data → method → evidence',description:'Start from observations, apply a reproducible method, then interpret the evidence.'},
      {type:'stats-bridge',title:'Python foundations → data analysis',description:'Each topic extends the same notebook workflow to richer datasets.'}
    ],
    workshopIntro:'Complete all 12 stages. Code stages start blank: write, run, inspect, correct and validate.',exercises
  });

  const analystTopics=[
    T('descriptive',9,'Descriptive statistics: center and spread','Descriptive statistics','Go beyond the mean with median, mode, variance and standard deviation.','Analysts combine measures of center and spread because one statistic cannot describe a complete distribution.',
      [['Median','statistics.median(values)'],['Variance','statistics.variance(values)'],['Std. deviation','statistics.pstdev(values)']],
      [['Center','Mean, median and mode answer different questions; extreme values can affect them differently.'],['Spread','Variance and standard deviation quantify how far observations vary around the center.']],
      [
        C('desc-01','Median','Use statistics.median to print the median of [2,4,8,10,12].'),
        C('desc-02','Mode','Use statistics.mode to print the mode of [1,2,2,3,4].'),
        C('desc-03','Sample variance','Use statistics.variance to print the sample variance of [2,4,6].'),
        C('desc-04','Population standard deviation','Use statistics.pstdev on [2,4,6,8], round to 2 decimals, and print it.'),
        C('desc-05','Mean versus median','For [2,3,4,30], print the mean and then the median on separate lines.'),
        C('desc-06','Compact summary','For [4,6,6,8,6], print count, mean, median and mode, one per line.'),
        Q('desc-07','Robust center','Which center measure is usually less affected by one extreme outlier?',['Mean','Median','Range','Variance']),
        Q('desc-08','Sample variance function','Which function calculates sample variance?',['statistics.pvariance','statistics.variance','statistics.pstdev','statistics.mode']),
        Q('desc-09','Standard-deviation units','If height is measured in centimeters, standard deviation is measured in:',['square centimeters','centimeters','percent only','no units']),
        Q('desc-10','Variance meaning','Variance measures:',['squared spread around the mean','the most frequent value','the middle label','the number of columns']),
        Q('desc-11','Mode meaning','The mode is:',['the most frequent value','always the mean','the maximum value','Q3-Q1']),
        Q('desc-12','Why compare summaries?','Two groups can have the same mean but different:',['spread','column names only','Python versions only','file extensions'])
      ]),
    T('position-outliers',10,'Quartiles, percentiles, IQR and outliers','Position & outliers','Describe position with quartiles and percentiles, then use IQR fences to flag potential outliers.','IQR focuses on the middle 50% of an ordered distribution and supports a resistant rule for identifying unusually distant observations.',
      [['Q1','np.percentile(values,25)'],['IQR','q3-q1'],['Upper fence','q3+1.5*iqr']],
      [['Quartiles','Q1, Q2 and Q3 correspond to the 25th, 50th and 75th percentile positions.'],['Outliers','Values outside the 1.5×IQR fences are potential outliers to investigate, not automatic errors.']],
      [
        C('pos-01','First quartile','Use NumPy to print Q1 of [2,4,6,8,10].'),
        C('pos-02','Third quartile','Use NumPy to print Q3 of [2,4,6,8,10].'),
        C('pos-03','Interquartile range','Use NumPy to calculate and print IQR for [2,4,6,8,10].'),
        C('pos-04','IQR fences','For [2,4,6,8,10], print the lower and upper 1.5×IQR fences on separate lines.'),
        C('pos-05','Detect an outlier','For [2,4,6,8,30], calculate IQR fences and print the list of values outside them.'),
        C('pos-06','90th percentile','Use NumPy to print the 90th percentile of [10,20,30,40,50].'),
        Q('pos-07','Q2 meaning','Q2 is another name for the:',['mean','median','mode','range']),
        Q('pos-08','Upper-outlier rule','A potential upper outlier is greater than:',['Q3 + 1.5 × IQR','Q3 + IQR','mean + IQR','maximum + IQR']),
        Q('pos-09','Why IQR?','IQR is resistant to extreme values because it focuses on:',['the central 50%','only the maximum','all file rows equally','column names']),
        Q('pos-10','Boxplot center','The line inside a standard boxplot box usually represents the:',['median','mean always','range','sample size']),
        Q('pos-11','Percentile meaning','The 75th percentile marks approximately:',['the 75% position in ordered data','75 missing rows','a fixed score of 75','the variance']),
        Q('pos-12','Outlier caution','A flagged outlier should be:',['investigated in context','deleted automatically','changed to the mean automatically','ignored always'])
      ]),
    T('pandas-dataframes',11,'CSV and Pandas DataFrames','CSV → DataFrame','Move from small lists to real tabular datasets with Pandas.','A DataFrame is a two-dimensional labeled table in which rows represent observations and columns represent variables.',
      [['Import','import pandas as pd'],['Load CSV','pd.read_csv(source)'],['Inspect','df.shape · df.head()']],
      [['DataFrame anatomy','Rows are cases and columns are variables; the index identifies row labels.'],['Inspect first','Check shape, column names, data types and sample rows before calculating.']],
      [
        C('pd-01','DataFrame shape','Create student=["A","B","C"] and score=[70,80,90] in a DataFrame; print df.shape.'),
        C('pd-02','Column names','Create the same DataFrame and print df.columns.tolist().'),
        C('pd-03','Preview rows','Create the same DataFrame and print the score values from df.head(2) as a list.'),
        C('pd-04','Read CSV','Use StringIO with "student,score\\nA,70\\nB,80\\nC,90", load with pd.read_csv, and print the row count.'),
        C('pd-05','Column mean','Create the student/score DataFrame and print the score mean.'),
        C('pd-06','Describe a column','Create the score DataFrame, call describe(), and print the value under "mean".'),
        Q('pd-07','Shape meaning','df.shape returns:',['(rows, columns)','(columns, rows)','only columns','only rows']),
        Q('pd-08','DataFrame definition','A DataFrame is:',['a two-dimensional labeled table','a loop','one Boolean','only a chart']),
        Q('pd-09','read_csv purpose','pd.read_csv is used to:',['load CSV data into a DataFrame','draw a scatterplot','delete missing values automatically','define a loop']),
        Q('pd-10','Rows versus columns','In a student dataset, one student record is usually a:',['row','column name','Python package','plot title']),
        Q('pd-11','Inspect first','Before analysis, you should first:',['inspect structure and data types','assume all types are correct','drop half the rows','create a conclusion']),
        Q('pd-12','Column concept','A variable such as score is usually stored as a:',['column','browser tab','function name only','file extension'])
      ]),
    T('data-cleaning',12,'Data cleaning and quality checks','Cleaning & quality','Find missing values, duplicates and invalid types before trusting a result.','Cleaning is a controlled, documented transformation of raw data into an analyzable dataset.',
      [['Missing','df.isna().sum()'],['Duplicates','df.duplicated()'],['Convert','pd.to_numeric(...,errors="coerce")']],
      [['Missingness','Inspect how much is missing and why before choosing drop or fill.'],['Duplicates and types','Repeated rows and invalid numeric text can bias summaries if left unchecked.']],
      [
        C('clean-01','Count missing values','Create score=[70,None,90] and print the number of missing scores.'),
        C('clean-02','Fill missing with mean','Create score=[70,None,90], fill the missing value with the column mean, and print the cleaned list.'),
        C('clean-03','Count duplicates','Create x=[1,2,2,3] and print df.duplicated().sum().'),
        C('clean-04','Drop duplicates','Create x=[1,2,2,3], drop duplicates, and print the remaining row count.'),
        C('clean-05','Convert invalid text','Create score=["10","bad","30"], convert with pd.to_numeric(errors="coerce"), and print the missing-value count afterward.'),
        C('clean-06','Trim text','Create group=[" 11A","11B "], strip whitespace, and print the cleaned list.'),
        Q('clean-07','Missing first step','The best first step with missing values is to:',['inspect how much is missing and why','delete the dataset','replace everything with zero','ignore them']),
        Q('clean-08','Duplicate decision','A duplicate should be removed:',['after confirming it is not a legitimate repeated observation','always without checking','only if text','never']),
        Q('clean-09','coerce meaning','errors="coerce" converts invalid numeric text to:',['NaN / missing values','zero automatically','column names','True']),
        Q('clean-10','Why clean first?','Cleaning before analysis helps prevent:',['biased or invalid summaries','column labels from existing','Python from running','all uncertainty']),
        Q('clean-11','Documentation','A cleaning decision should record:',['what changed and why','only the final graph','nothing','a random number']),
        Q('clean-12','Quality dimensions','Core checks include:',['missingness, duplicates and data types','font size only','browser history','screen resolution'])
      ]),
    T('filter-transform',13,'Filtering, sorting and transformation','Filter & transform','Select the observations and variables needed to answer a precise question.','Filtering applies Boolean rules to rows; transformation creates or changes variables for analysis.',
      [['Filter','df[df["score"]>=80]'],['Sort','df.sort_values("score")'],['Derived','df["ratio"]=df["score"]/100']],
      [['Filtering','A Boolean mask converts an analytical rule into a subset of observations.'],['Transformation','Derived variables encode useful quantities calculated from existing columns.']],
      [
        C('filt-01','Filter rows','Create score=[70,85,90], keep score>=80, and print the row count.'),
        C('filt-02','Sort descending','Create score=[70,90,80], sort descending, and print the sorted score list.'),
        C('filt-03','Derived column','Create score=[70,80,90], add score_pct=score/100, and print the new list.'),
        C('filt-04','Two conditions','Create group=["A","A","B"] and score=[70,90,85]; keep group=="A" AND score>=80, then print the row count.'),
        C('filt-05','query method','Create score=[60,75,90], use df.query("score >= 70"), and print the row count.'),
        C('filt-06','Top two','Create student=["A","B","C"] and score=[70,80,90]; use nlargest to print the top two student labels as a list.'),
        Q('filt-07','Boolean mask','A Boolean mask mainly contains:',['True and False','file names','averages only','colors']),
        Q('filt-08','Multiple Pandas conditions','For Pandas Series, multiple conditions usually use:',['& and | with parentheses','and only without parentheses','HTML','SQL only']),
        Q('filt-09','sort_values purpose','sort_values is used to:',['order rows by values','import CSV','calculate only variance','remove all columns']),
        Q('filt-10','Derived variable','A derived variable is:',['calculated from existing variables','always typed manually','a browser setting','an image file']),
        Q('filt-11','Filtering purpose','Filtering helps answer:',['questions about a subset of observations','only file storage questions','nothing statistical','only formatting questions']),
        Q('filt-12','Transformation caution','Before transforming units, analysts should confirm:',['the original units and meaning','the browser theme','the student name only','the plot color'])
      ]),
    T('group-aggregate',14,'Grouping, frequencies and aggregation','Group & aggregate','Summarize categories with frequencies and compare groups with aggregation.','Grouping splits observations by category, applies a statistic to each group, and combines the results for comparison.',
      [['Frequency','df["group"].value_counts()'],['Grouped mean','df.groupby("group")["score"].mean()'],['Aggregate','.agg(["mean","min","max"])']],
      [['Frequency tables','value_counts() answers how many observations belong to each category.'],['Group comparison','groupby applies summaries separately to subgroups so differences become visible.']],
      [
        C('grp-01','Category frequencies','Create group=["A","A","B"], use value_counts(), and print the result as a dictionary.'),
        C('grp-02','Mean by group','Create group=["A","A","B","B"] and score=[70,90,60,80]; print mean A then mean B.'),
        C('grp-03','Count by group','Using groups ["A","A","B","B"], use groupby.size() and print a dictionary.'),
        C('grp-04','Aggregate summaries','Using A scores [70,90], aggregate mean, min and max and print those values as a list.'),
        C('grp-05','Cross-tab','Create group=["A","A","B","B"] and status=["pass","review","pass","pass"]; build pd.crosstab and print B/pass.'),
        C('grp-06','Pivot table','Using A scores 70,90 and B scores 60,80, create a mean-score pivot table by group and print B mean.'),
        Q('grp-07','groupby purpose','groupby is used to:',['calculate summaries separately for categories','delete a DataFrame','load CSV only','rename Python']),
        Q('grp-08','value_counts purpose','value_counts is useful for:',['category frequencies','scatterplots only','function definitions','type conversion only']),
        Q('grp-09','Quantitative comparison','To compare typical quantitative scores across groups, a reasonable first summary is:',['mean','file size','column name','browser width']),
        Q('grp-10','Unequal groups','When group sizes differ, analysts should also inspect:',['counts/sample sizes','only colors','nothing else','file extension']),
        Q('grp-11','Association caution','A difference between group means by itself proves causation.',['True','False']),
        Q('grp-12','Categorical summary','For categorical variables, a natural first summary is:',['frequency/count','variance of labels','numeric mean of text','standard deviation of names'])
      ]),
    T('visualization',15,'Data visualization with Matplotlib','Visualization','Choose charts that match the variable types and analytical question.','Good visualization turns data into graphical evidence with an appropriate chart, clear labels and a defensible interpretation.',
      [['Histogram','plt.hist(values)'],['Boxplot','plt.boxplot(values)'],['Scatter','plt.scatter(x,y)']],
      [['Choose by question','Bars compare categories, histograms show one quantitative distribution, and scatterplots explore two quantitative variables.'],['Label clearly','Titles, axis labels and units are part of the analytical communication.']],
      [
        C('viz-01','Bar chart','Create a Pandas Series [80,70] indexed by ["A","B"], plot kind="bar", print the number of bar patches, and close the figure.'),
        C('viz-02','Histogram','Create a histogram of [1,2,2,3,3,3] with bins=3, print the number of patches, and close the figure.'),
        C('viz-03','Boxplot','Create a boxplot for [2,4,6,8,10], print the number of boxes returned, and close the figure.'),
        C('viz-04','Scatterplot','Create a scatterplot for x=[1,2,3], y=[2,4,6], print the number of collections, and close the figure.'),
        C('viz-05','Chart title','Create a simple line plot, set title "Scores by group", print the title, and close the figure.'),
        C('viz-06','Axis labels','Create a scatterplot, set x-label "Study hours" and y-label "Score", print them as "Study hours | Score", and close the figure.'),
        Q('viz-07','Distribution chart','Best chart for one quantitative distribution:',['Histogram','Scatterplot','Pie chart only','Network diagram']),
        Q('viz-08','Category comparison','Best chart for comparing one summary across categories:',['Bar chart','Scatterplot','Unordered line chart only','None']),
        Q('viz-09','Relationship chart','Best chart for two quantitative variables:',['Scatterplot','Pie chart','Single number','Text only']),
        Q('viz-10','Boxplot purpose','A boxplot shows:',['median, quartiles, spread and potential outliers','only file names','only category labels','syntax errors']),
        Q('viz-11','Line chart use','A line chart is especially appropriate when x has:',['meaningful order such as time','no order at all','only text labels with no sequence','missing code']),
        Q('viz-12','Chart principle','The best chart:',['matches variable types and the analytical question','has the most colors','uses 3D effects','has no labels'])
      ]),
    T('analyst-project',16,'Data Analyst capstone workflow','Analyst capstone','Integrate loading, inspection, cleaning, statistics, grouping, visualization and interpretation.','A reproducible analysis moves from a question to data quality checks, numerical and graphical evidence, and a conclusion that states limitations.',
      [['Load','pd.read_csv(...)'],['Compare','df.groupby(...)'],['Relationship','df["hours"].corr(df["score"])']],
      [['Workflow','Question → load → inspect/clean → analyze → visualize → interpret → communicate.'],['Evidence','Correlation and group differences describe association; they do not prove causation.']],
      [
        C('cap-01','Load project data','Use StringIO and pd.read_csv on "group,hours,score\\nA,1,50\\nA,2,60\\nB,3,70\\nB,4,80\\nB,5,90"; print df.shape.'),
        C('cap-02','Check missingness','Load the same dataset and print the total missing-value count.'),
        C('cap-03','Overall mean','Load the project dataset and print mean score.'),
        C('cap-04','Compare groups','Load the project dataset, calculate mean score by group, and print A mean then B mean.'),
        C('cap-05','Correlation','Load the project dataset and print the hours-score Pearson correlation rounded to 2 decimals.'),
        C('cap-06','Scatter evidence','Load the project dataset, scatter hours versus score, print the number of scatter collections, and close the figure.'),
        Q('cap-07','Correlation caution','A correlation of 0.90 proves that one variable causes the other.',['True','False']),
        Q('cap-08','Evidence-based conclusion','Best conclusion:',['The observed group mean differs in this dataset; more context is needed before explaining why','Group B is smarter because its mean is higher','The chart proves causation','No limitation is needed']),
        Q('cap-09','Quality first','Before interpreting a result, an analyst should:',['inspect data quality','assume no missing values','delete random rows','choose a conclusion']),
        Q('cap-10','Reproducibility','A reproducible notebook should contain:',['data steps, code, outputs and explanation','only the final answer','only screenshots','no code']),
        Q('cap-11','Limitation','A good conclusion should mention:',['relevant limitations','only positive results','no uncertainty','the browser version']),
        Q('cap-12','Analyst workflow','Best sequence:',['Question → load → inspect/clean → analyze → visualize → interpret → communicate','Visualize → guess → delete data → conclude','Code first → question later','Mean only → conclusion'])
      ])
  ];

  const base=window.IJR_PYTHON_HUB_TOPICS||[];
  const upgradedBase=base.map(topic=>topic.slug==='statistics'?Object.freeze({...topic,title:'Statistics foundations with lists',nav:'Statistics foundations',lead:'Use Python lists for the first summaries, then continue into a complete Statistics & Data Analysis pathway.'}):topic);
  const combined=Object.freeze([...upgradedBase,...analystTopics.map(topic=>Object.freeze(topic))]);
  window.IJR_PYTHON_HUB_TOPICS=combined;
  window.IJR_PYTHON_HUB_TOPIC_MAP=Object.freeze(Object.fromEntries(combined.map(topic=>[topic.slug,topic])));
  window.IJR_PYTHON_HUB_WORKSHOP_POLICY_V30=Object.freeze({minimumProblemsPerTopic:12,blankCodeCells:true,totalTopics:combined.length,totalProblems:combined.reduce((sum,topic)=>sum+topic.exercises.length,0)});

  if(typeof window.loadPyodide==='function'&&!window.loadPyodide.__ijrAnalystWrapped){
    const originalLoad=window.loadPyodide;
    const wrapped=async(...args)=>{
      const py=await originalLoad(...args);
      if(!py.__ijrAutoPackages){
        const originalRun=py.runPythonAsync.bind(py);
        py.runPythonAsync=async(source,...rest)=>{try{await py.loadPackagesFromImports(String(source||''));}catch(_error){}return originalRun(source,...rest);};
        py.__ijrAutoPackages=true;
      }
      return py;
    };
    wrapped.__ijrAnalystWrapped=true;
    window.loadPyodide=wrapped;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const path=location.pathname.replace(/\/+$/,'');
    if(!path.endsWith('/python'))return;
    const progression=[...document.querySelectorAll('.sequence-rule')].find(el=>el.textContent.includes('Progression rule'));
    if(progression){
      const span=progression.querySelector('span');
      const small=progression.querySelector('small');
      if(span)span.textContent='01–07 Python foundations → 08 Statistics foundations → 09 Descriptive statistics → 10 IQR & outliers → 11 Pandas → 12 Cleaning → 13 Filter & transform → 14 Group & aggregate → 15 Visualization → 16 Analyst capstone';
      if(small)small.textContent='Operations, Variable Types and Arrays open immediately. From Logic onward, each topic unlocks after the previous workshop is complete.';
    }
    const overview=document.querySelector('.hub-overview');
    if(overview){const h1=overview.querySelector('h1');if(h1)h1.textContent='Learn Python. Think like a data analyst.';}
    const heading=document.querySelector('.topic-grid-heading');
    if(heading){const h2=heading.querySelector('h2');const p=heading.querySelector('p:last-child');if(h2)h2.textContent='One pathway · sixteen analytical topics';if(p)p.innerHTML='Begin with Python foundations, then progress into a complete <strong>Statistics & Data Analysis</strong> pathway. Every workshop has 12 required stages and automatic Supabase progress saving.';}
  });
})();