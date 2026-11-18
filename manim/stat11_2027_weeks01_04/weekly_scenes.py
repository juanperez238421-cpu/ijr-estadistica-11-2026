#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Four separate full native ManimCE videos: Statistics 11, Quarter I, Weeks 01–04.

Authoritative basis: Statistics_11_2027_P1.docx (uploaded class planner).
Curricular scope checked against IJR Statistics 11 2026, Period I malla:
counting theorem, permutations, combinations, repeated and circular permutations.
Only the first four weeks have dated class descriptions, and therefore advanced
combinations, repeated and circular arrangements are NOT taught in these four
weekly lessons. They belong later in the full period.

The exact JP consolidated 0.20.x classroom library and validated native scene
bases are included next to this module. All visuals are native Manim vectors.
No Pillow/FFmpeg slide substitution.
"""
from __future__ import annotations
from itertools import product, permutations
from math import factorial
from library.jp_classroom_style import *
from stat11_week01_2027_native import Statistics11Week01Native
from stat11_q1_2027_overview import Statistics11Quarter1Overview


class SequentialWeekNumbering:
    """Use visually contiguous section numbers even for validated reused scenes."""
    def step(self, number: int, title: str, subtitle: str) -> None:
        self._lesson_section = getattr(self, "_lesson_section", 0) + 1
        return super().step(self._lesson_section, title, subtitle)


class Statistics11Week01_2027(SequentialWeekNumbering, Statistics11Week01Native):
    """Week 1 — INTRODUCTION TO COUNTING PROBLEMS, 19–22 Jan 2027.

    Formative evidence: recognize counting, complete list/table/tree, explain
    completeness without duplicated or missing results. Formal multiplication
    belongs to Week 2.
    """
    def opening(self) -> None:
        self.standard_opening(
            "STATISTICS 11 | QUARTER 1 | WEEK 01",
            "HOW MANY POSSIBILITIES?",
            "Introduction to counting problems",
            "Predict. List. Organize. Verify. Explain."
        )

    def construct(self) -> None:
        self.opening()
        self.choices()
        self.guess()
        self.complete_list()
        self.table()
        self.tree()
        self.compare()
        self.find_error()
        self.practice()
        self.written_reasoning()
        self.extra_challenge()
        self.exit_ticket()

    def extra_challenge(self) -> None:
        self.step(10, "INDEPENDENT CHECK: COMPLETE OR INCOMPLETE?",
                  "A coin and a two-color card: identify every unique outcome.")
        names=("Heads + Red","Heads + Blue","Tails + Red","Tails + Blue")
        grid=VGroup(*[self.outcome_chip(t,width=5.65) for t in names])
        grid.arrange_in_grid(rows=2,cols=2,buff=(.37,.40)).move_to(DOWN*.10)
        self.assert_content_safe(grid,"W1 independent complete list")
        for chip in grid:
            self.play(FadeIn(chip,shift=UP*.10),run_time=RUN_NORMAL)
            self.wait(.28)
        self.show_pause("Explain why the four outcomes are all different.",5)
        self.show_pause("Next: count the same results using multiplication.",3)


class Statistics11Week02_2027(SequentialWeekNumbering, Statistics11Quarter1Overview):
    """Week 2 — FUNDAMENTAL COUNTING PRINCIPLE, 25–29 Jan 2027."""
    def opening(self) -> None:
        self.standard_opening(
            "STATISTICS 11 | QUARTER 1 | WEEK 02",
            "COUNTING WITHOUT LISTING",
            "Fundamental Counting Principle",
            "See the tree. Count each stage. Justify the product."
        )

    def construct(self) -> None:
        self.opening()
        self.recall()
        self.tree()                # complete 2x3 path model (base)
        self.multiply()            # transform tree count into 3x2 (base)
        self.same_choices()
        self.new_problem()
        self.nonuniform()
        self.pair_practice()
        self.week2_exit()

    def recall(self) -> None:
        self.step(1,"RECALL THE ORGANIZED LIST",
                  "Two pencils and three notebooks: list each completed pair once.")
        chips=VGroup(*[self.pill(f"{p}+{n}",3.30)
                       for p in ("P1","P2") for n in ("N1","N2","N3")])
        chips.arrange_in_grid(rows=2,cols=3,buff=(.25,.35)).move_to(UP*.05)
        self.assert_content_safe(chips,"W2 opening list")
        for c in chips:
            self.play(FadeIn(c,shift=UP*.09),run_time=RUN_QUICK)
        self.pause_line("Six outcomes — can we count WITHOUT listing all six?",4.0)

    def same_choices(self) -> None:
        self.step(4,"WHY DOES MULTIPLICATION WORK?",
                  "Every first-stage option has exactly two second-stage options.")
        items=VGroup(*[self.tile(f"Snack {i}","2 drinks available",
                                 width=4.20,height=1.40,size=32)
                       for i in ("A","B","C")]).arrange(RIGHT,buff=.29)
        items.move_to(UP*.99)
        self.assert_content_safe(items,"W2 equal branch cards")
        for card in items:
            self.play(FadeIn(card,shift=UP*.17),run_time=RUN_NORMAL)
        arithmetic=self.math(r"2+2+2=3\times 2=6",55).move_to(DOWN*.80)
        self.play(Write(arithmetic),run_time=RUN_SLOW)
        self.pause_line("Equal number of choices at every first-stage branch.",4)

    def new_problem(self) -> None:
        self.step(5,"WORKED EXAMPLE: 4 SHIRTS AND 3 PANTS",
                  "Each shirt can be paired with each of the three pants.")
        rows=[[f"S{i}",*[f"S{i} + P{j}" for j in range(1,4)]]
              for i in range(1,5)]
        table=self.build_table(
            headers=("Shirt","Pants 1","Pants 2","Pants 3"),
            body_rows=rows,
            column_widths=(2.50,3.25,3.25,3.25),
            row_height=.73,header_height=.80,
            header_font_size=27,body_font_size=28
        )
        table.group.move_to(UP*.25)
        self.assert_content_safe(table.group,"W2 4x3 grid")
        self.animate_table_rows(table,include_header=True,pause=.35)
        self.play(self.shade_cells(table,[(r,c) for r in range(1,5)
                                               for c in range(1,4)]),
                  run_time=RUN_NORMAL)
        equation=self.math(r"4\times3=12\ \mathrm{outcomes}",48)
        equation.move_to(DOWN*2.19)
        self.play(Write(equation),run_time=RUN_SLOW)
        self.pause_line("Check: 12 table cells correspond to 12 different outfits.",3.3)

    def nonuniform(self) -> None:
        self.step(6,"A LIMITATION: DIFFERENT BRANCH COUNTS",
                  "If the number of second choices changes, add the branch totals.")
        root=Dot([-6.05,-.12,0],radius=.10,color=BLACK_LINE)
        self.play(FadeIn(root))
        first=[(-3.40,1.18,0),(-3.40,-1.30,0)]
        targets=[((.25,1.76,0),(.25,.91,0)),
                 ((.25,-.60,0),(.25,-1.40,0),(.25,-2.20,0))]
        leaves=[]
        for i,p in enumerate(first):
            trunk=Line(root.get_center(),p,color=BLACK_LINE,stroke_width=2.6)
            self.play(Create(trunk),run_time=.55)
            name=self.text("A" if i==0 else "B",31,BOLD)
            name.move_to((p[0]-.25,p[1]+.28,0))
            self.play(FadeIn(name),run_time=RUN_QUICK)
            for j,pos in enumerate(targets[i]):
                edge=Line(p,pos,stroke_width=2.3,color=BLACK_LINE)
                self.play(Create(edge),run_time=.38)
                chip=self.pill(f"{'A' if i==0 else 'B'} + {j+1}",2.54)
                chip.move_to([2.30,pos[1],0])
                leaves.append(chip)
                self.play(FadeIn(chip,shift=RIGHT*.12),run_time=RUN_QUICK)
        count=self.math(r"2+3=5",55).move_to([5.28,-.38,0])
        self.play(Write(count),run_time=RUN_SLOW)
        self.pause_line("There is NO fixed second-stage count here: add 2 and 3.",4)

    def pair_practice(self) -> None:
        self.step(7,"GUIDED PRACTICE",
                  "A café offers 5 sandwiches and 2 juices. Explain your answer.")
        a=self.tile("5 SANDWICHES","First-stage options",width=5.94,height=1.77)
        b=self.tile("2 JUICES","Second-stage options",width=5.94,height=1.77)
        row=VGroup(a,b).arrange(RIGHT,buff=.48).move_to(UP*.92)
        self.assert_content_safe(row,"W2 practice cards")
        self.play(FadeIn(a,shift=RIGHT*.15),FadeIn(b,shift=LEFT*.15))
        self.pause_line("PAUSE: How many different sandwich + juice orders?",7)
        answer=self.math(r"5\times2=10",65).move_to(DOWN*.95)
        self.play(Write(answer),run_time=RUN_SLOW)
        self.pause_line("Each sandwich allows two juice choices; 10 unique meals.",4)

    def week2_exit(self) -> None:
        self.step(8,"WEEK 02 — EXIT TICKET",
                  "Choose a method and defend it with a diagram or list.")
        prompts=(
            ("01","3 pens and 4 notebooks", "3 x 4 = 12"),
            ("02","2 hats and 5 scarves", "2 x 5 = 10"),
            ("03","A has 2 choices, B has 3", "2 + 3 = 5"),
        )
        cards=VGroup(*[self.tile(f"{i}  {question}",answer,
                         width=13.15,height=1.18,size=31)
                       for i,question,answer in prompts])
        cards.arrange(DOWN,buff=.29).move_to(DOWN*.16)
        self.assert_content_safe(cards,"W2 exit ticket")
        for item in cards:
            self.play(FadeIn(item,shift=RIGHT*.13),run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)
        self.pause_line("Next week: extend the same idea to THREE stages.",3)
        self.standard_closing("Count by stages. Verify every completed outcome.")


class Statistics11Week03_2027(SequentialWeekNumbering, Statistics11Quarter1Overview):
    """Week 3 — MULTI-STAGE COUNTING AND TREE DIAGRAMS, 1–5 Feb 2027."""
    def opening(self) -> None:
        self.standard_opening(
            "STATISTICS 11 | QUARTER 1 | WEEK 03",
            "THREE-STEP DECISIONS",
            "Multi-Stage Counting and Tree Diagrams",
            "Represent all stages. Multiply. Verify every path."
        )

    def construct(self) -> None:
        self.opening()
        self.warmup()
        self.multi_stage()             # native 12-leaf progressive tree (base)
        self.one_route()
        self.list_twelve()
        self.stage_changes()
        self.real_context()
        self.three_stage_practice()
        self.week3_exit()

    def warmup(self) -> None:
        self.step(1,"FROM TWO STAGES TO THREE",
                  "A choice now has a starting option, a middle option and an end.")
        cards=VGroup(*[
            self.tile(x,y,width=4.15,height=1.65,size=35)
            for x,y in (("2 ROUTES","Stage 1"),("3 ACTIVITIES","Stage 2"),
                        ("2 SNACKS","Stage 3"))
        ]).arrange(RIGHT,buff=.30).move_to(UP*.57)
        self.assert_content_safe(cards,"W3 three stages")
        for c in cards:self.play(FadeIn(c,shift=UP*.2),run_time=RUN_NORMAL)
        q=self.text("Is this a 2-stage or a 3-stage decision?",34,BOLD)
        q.move_to(DOWN*1.60)
        self.play(Write(q))
        self.pause_line("Each COMPLETE result contains one choice at each stage.",4)

    def one_route(self) -> None:
        self.step(3,"FOLLOW ONE COMPLETE ROUTE",
                  "A complete result has one route, one activity and one snack.")
        chips=VGroup(*[
            self.pill(s,width=3.50) for s in ("Route 1","Activity 2","Snack 1")
        ]).arrange(RIGHT,buff=1.0).move_to(UP*.55)
        self.assert_content_safe(chips,"W3 sample route")
        for k,c in enumerate(chips):
            self.play(FadeIn(c,shift=RIGHT*.15),run_time=RUN_NORMAL)
            if k:
                arrow=Arrow(chips[k-1].get_right(),c.get_left(),
                            buff=.10,stroke_width=2.1,
                            max_tip_length_to_length_ratio=.20,
                            color=BLACK_LINE)
                self.play(GrowArrow(arrow),run_time=RUN_NORMAL)
        eq=self.math(r"(R_1,A_2,S_1)",51).move_to(DOWN*1.45)
        self.play(Write(eq),run_time=RUN_SLOW)
        self.pause_line("A partial route is not yet a complete outcome.",3.5)

    def list_twelve(self) -> None:
        self.step(4,"VERIFY ALL 12 PATHS",
                  "List each combination of 2 routes, 3 activities and 2 snacks.")
        outcomes=[f"R{r} - A{a} - S{s}" for r in range(1,3)
                  for a in range(1,4) for s in range(1,3)]
        assert len(outcomes)==len(set(outcomes))==12
        chips=VGroup(*[self.pill(s,width=3.10) for s in outcomes])
        chips.arrange_in_grid(rows=3,cols=4,buff=(.26,.32)).move_to(UP*.20)
        self.assert_content_safe(chips,"W3 12 outcomes")
        self.play(LaggedStart(*[FadeIn(c,shift=UP*.08) for c in chips],
                              lag_ratio=.11),run_time=4.0)
        result=self.math(r"2\times 3\times 2=12",53).move_to(DOWN*2.22)
        self.play(Write(result),run_time=RUN_SLOW)
        self.pause_line("Twelve unique rows, matching twelve tree leaves.",3.5)

    def stage_changes(self) -> None:
        self.step(5,"WHAT IF ONE STAGE CHANGES?",
                  "Keep the first two stages; double the final options.")
        old=self.math(r"2\times 3\times 2=12",62).move_to(UP*.92)
        new=self.math(r"2\times 3\times 4=24",62).move_to(UP*.92)
        note=self.tile("LAST STAGE","2 options become 4 options",
                       width=8.8,height=1.75,size=36).move_to(DOWN*1.09)
        self.play(Write(old),run_time=RUN_SLOW)
        self.play(FadeIn(note,shift=UP*.14),run_time=RUN_NORMAL)
        self.play(TransformMatchingTex(old,new),run_time=RUN_SLOW)
        self.pause_line("Changing one stage changes the TOTAL number of outcomes.",4)

    def real_context(self) -> None:
        self.step(6,"WORKED EXAMPLE: SCHOOL SCHEDULE",
                  "Three workshops, two periods and two classrooms.")
        a=self.tile("3 WORKSHOPS","Choose one",width=4.26,height=1.50)
        b=self.tile("2 PERIODS","Choose one",width=4.26,height=1.50)
        c=self.tile("2 ROOMS","Choose one",width=4.26,height=1.50)
        cards=VGroup(a,b,c).arrange(RIGHT,buff=.29).move_to(UP*.80)
        self.assert_content_safe(cards,"W3 schedule choices")
        for x in cards:self.play(FadeIn(x,shift=UP*.13),run_time=RUN_NORMAL)
        formula=self.math(r"3\times2\times2=12",62).move_to(DOWN*.96)
        self.play(Write(formula),run_time=RUN_SLOW)
        self.pause_line("One assignment = workshop + period + classroom.",4)

    def three_stage_practice(self) -> None:
        self.step(7,"YOUR TURN: THREE-STAGE COUNTING",
                  "Choose from 2 buses, 2 departure times and 3 badges.")
        cards=VGroup(*[
            self.tile(a,b,width=4.25,height=1.47,size=33)
            for a,b in (("2 BUSES","Stage 1"),("2 TIMES","Stage 2"),
                        ("3 BADGES","Stage 3"))
        ]).arrange(RIGHT,buff=.28).move_to(UP*.77)
        self.play(LaggedStart(*[FadeIn(c,shift=UP*.17) for c in cards],
                              lag_ratio=.2),run_time=RUN_SLOW)
        self.pause_line("PAUSE: draw a compact tree and calculate the product.",8)
        formula=self.math(r"2\times2\times3=12",62).move_to(DOWN*.86)
        self.play(Write(formula),run_time=RUN_SLOW)
        self.pause_line("Explain why the product accounts for every tree leaf.",4)

    def week3_exit(self) -> None:
        self.step(8,"WEEK 03 — CHECK YOUR METHOD",
                  "Verify the number AND the interpretation of each completed path.")
        prompts=(
            "1. Label the THREE decision stages.",
            "2. Count the paths in your tree.",
            "3. Multiply the options and compare.",
            "4. Explain why both totals agree.",
        )
        cards=VGroup(*[self.tile(t,width=13.45,height=1.10,size=31)
                       for t in prompts]).arrange(DOWN,buff=.23)
        cards.move_to(DOWN*.20)
        self.assert_content_safe(cards,"W3 exit checklist")
        for c in cards:self.play(FadeIn(c,shift=RIGHT*.12),run_time=RUN_NORMAL)
        self.pause_line("Next week: what changes when the order matters?",3.5)
        self.standard_closing("A complete path makes each stage visible.")


class Statistics11Week04_2027(SequentialWeekNumbering, Statistics11Quarter1Overview):
    """Week 4 — BASIC PERMUTATIONS WITHOUT REPETITION, 8–12 Feb 2027."""
    def opening(self) -> None:
        self.standard_opening(
            "STATISTICS 11 | QUARTER 1 | WEEK 04",
            "DOES ORDER MATTER?",
            "Introduction to Permutations",
            "Arrange. Compare. Multiply. Use factorial notation."
        )

    def construct(self) -> None:
        self.opening()
        self.define_order()
        self.order_matters()       # real swapping movement AB != BA
        self.two_positions()
        self.permutations()        # 3!, six fully enumerated outcomes
        self.factorial_growth()
        self.no_repetition()
        self.count_four()
        self.practice()
        self.week4_exit()

    def define_order(self) -> None:
        self.step(1,"WHAT IS AN ARRANGEMENT?",
                  "Assign positions: FIRST, SECOND and THIRD.")
        boxes=VGroup(*[
            self.tile(f"{i+1}","POSITION",width=4.02,height=1.70,size=44)
            for i in range(3)
        ]).arrange(RIGHT,buff=.42).move_to(UP*.48)
        self.assert_content_safe(boxes,"W4 labeled slots")
        for x in boxes:self.play(FadeIn(x,shift=UP*.13),run_time=RUN_NORMAL)
        self.pause_line("A different order creates a different arrangement.",4)

    def two_positions(self) -> None:
        self.step(3,"RANK TWO STUDENTS FROM FOUR",
                  "Select the winner, then the runner-up: no person repeats.")
        slots=VGroup(self.tile("1st PLACE","4 choices",width=5.9,height=1.78),
                     self.tile("2nd PLACE","3 remaining",width=5.9,height=1.78))
        slots.arrange(RIGHT,buff=.46).move_to(UP*.65)
        self.assert_content_safe(slots,"W4 4P2 slots")
        self.play(FadeIn(slots[0],shift=RIGHT*.16))
        self.play(FadeIn(slots[1],shift=LEFT*.16))
        eq=self.math(r"4\times 3=12",63).move_to(DOWN*.93)
        self.play(Write(eq),run_time=RUN_SLOW)
        self.pause_line("A winner cannot also occupy second place.",4)

    def factorial_growth(self) -> None:
        self.step(5,"WHAT DOES FACTORIAL MEAN?",
                  "For n different objects, count n choices, then n-1, until 1.")
        tests=(("3!","3 x 2 x 1 = 6"),
               ("4!","4 x 3 x 2 x 1 = 24"),
               ("5!","5 x 4 x 3 x 2 x 1 = 120"))
        cards=VGroup(*[self.tile(a,b,width=11.75,height=1.33,size=40)
                       for a,b in tests]).arrange(DOWN,buff=.27).move_to(DOWN*.12)
        self.assert_content_safe(cards,"W4 factorial examples")
        for card in cards:
            self.play(FadeIn(card,shift=UP*.14),run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)
        self.pause_line("Factorial counts ordered positions WITHOUT repetition.",4)

    def no_repetition(self) -> None:
        self.step(6,"WHY NOT 3 x 3 x 3?",
                  "Used objects are removed from later positions.")
        wrong=self.tile("3 x 3 x 3 = 27","Incorrect when each object is used once",
                        width=6.50,height=2.27,size=35)
        right=self.tile("3 x 2 x 1 = 6","Correct: choices decrease after each pick",
                        width=6.50,height=2.27,size=35)
        group=VGroup(wrong,right).arrange(RIGHT,buff=.35).move_to(UP*.07)
        self.assert_content_safe(group,"W4 correct count comparison")
        self.play(FadeIn(wrong,shift=RIGHT*.15),run_time=RUN_NORMAL)
        self.pause_line("Can the same student occupy multiple positions?",3)
        self.play(FadeIn(right,shift=LEFT*.15),run_time=RUN_NORMAL)
        self.pause_line("Without replacement: three, then two, then one.",4)

    def count_four(self) -> None:
        self.step(7,"ANIMATE FOUR DISTINCT POSITIONS",
                  "Arrange A, B, C and D once each: four slots.")
        n=(4,3,2,1)
        cards=VGroup(*[self.tile(str(x),"CHOICES",width=3.18,height=1.48,size=42)
                       for x in n]).arrange(RIGHT,buff=.29).move_to(UP*.90)
        self.assert_content_safe(cards,"W4 four positions")
        for c in cards:
            self.play(FadeIn(c,shift=UP*.19),run_time=RUN_NORMAL)
        eq=self.math(r"4!=4\times3\times2\times1=24",57)
        eq.move_to(DOWN*.95)
        self.play(Write(eq),run_time=RUN_SLOW)
        self.pause_line("In a line, every change of position creates a new order.",4)

    def practice(self) -> None:
        self.step(8,"PRACTICE: ORDERED OR UNORDERED?",
                  "This week we count ordered arrangements without repetition.")
        panels=VGroup(
            self.tile("A. Line up 4 students","4! = 24",width=12.90,height=1.42,size=34),
            self.tile("B. Award 1st and 2nd from 5","5 x 4 = 20",
                      width=12.90,height=1.42,size=33),
            self.tile("C. Arrange A, B and C","3! = 6",width=12.90,height=1.42,size=34),
        ).arrange(DOWN,buff=.25).move_to(DOWN*.05)
        self.assert_content_safe(panels,"W4 formative practice")
        for x in panels:
            self.play(FadeIn(x,shift=RIGHT*.12),run_time=RUN_NORMAL)
            self.wait(PAUSE_EXPLAIN)
        self.pause_line("Explain why ORDER is essential in all three situations.",6)

    def week4_exit(self) -> None:
        self.step(9,"WEEK 04 — EXIT CHECK",
                  "Do not confuse a selection with an arrangement.")
        questions=(
            "1. Does swapping two positions change the outcome?",
            "2. May any object be used twice?",
            "3. Are we arranging all objects or only some?",
        )
        cards=VGroup(*[self.tile(q,width=13.20,height=1.16,size=32)
                       for q in questions]).arrange(DOWN,buff=.32).move_to(DOWN*.08)
        self.assert_content_safe(cards,"W4 exit prompts")
        for x in cards:
            self.play(FadeIn(x,shift=RIGHT*.13),run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)
        self.pause_line("Later in Period I: combinations, repeated and circular cases.",4)
        self.standard_closing("In permutations, changing order changes the outcome.")
