#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Statistics 11 | Period I, proposed Weeks 05–08 | native ManimCE 0.20.1.

CURRICULUM PROVENANCE
- Statistics_11_2027_P1.docx documents exact lessons for weeks 01–04 ONLY.
- IJR "malla curricular - estadísticas 11° (2026)" lists Period I:
  fundamental theorem of counting, permutations, combinations,
  distinguishable permutations, circular permutations + graphical solutions.
- Weeks 05–08 below are an INFERRED pedagogical sequence, not dates or
  official lessons certified by the 2027 planner.
  Week 05: Extended permutations, no repeated objects.
  Week 06: Combinations / order is irrelevant.
  Week 07: Distinguishable permutations with repeated elements.
  Week 08: Circular permutations, graphs, and restrictions.

STYLE CONTRACT
Genuine jp_classroom_style.py from the prior validated release: white 16:9
background, black text, numbered header, large vectors and MathTex, safety QA.
No rasterized slide generator; every final video is rendered by ManimCE.
"""
from __future__ import annotations

from itertools import combinations, permutations
from math import comb, factorial
from collections import Counter
import numpy as np
from library.jp_classroom_style import *
from stat11_q1_2027_overview import Statistics11Quarter1Overview


class PeriodOneContinuation(Statistics11Quarter1Overview):
    """Shared visuals and strict formula assertions for Weeks 05–08."""

    def validate_lesson_data(self):
        super().validate_lesson_data()
        assert 5*4*3 == factorial(5)//factorial(2) == 60
        assert 2*4*3 == 24
        assert 2*factorial(3) == 12
        assert 7*6*5 == 210
        assert comb(5,2) == len(list(combinations("ABCDE",2))) == 10
        assert comb(6,3) == 20 and comb(7,3) == 35
        assert comb(4,2)*comb(3,1) == 18
        assert sorted(set("".join(p) for p in permutations("AABB"))) == [
            "AABB","ABAB","ABBA","BAAB","BABA","BBAA"
        ]
        assert factorial(5)//(factorial(2)*factorial(2)) == 30
        assert factorial(6)//(factorial(3)*factorial(2)) == 60
        assert factorial(7)//(factorial(2)*factorial(2)) == 1260
        assert factorial(4)//4 == factorial(3) == 6
        assert factorial(5)//5 == 24
        assert factorial(6)//6 == 120
        assert 2*factorial(3) == 12
        assert factorial(4) == 24

    def step(self, number: int, title: str, subtitle: str):
        self._current_section = getattr(self, "_current_section", 0) + 1
        return super().step(self._current_section, title, subtitle)

    def open_week(self, week: int, title: str, subtitle: str, promise: str):
        self.standard_opening(
            f"STATISTICS 11 | PERIOD I | PROPOSED WEEK {week:02d}",
            title, subtitle, promise
        )

    def equation(self, expression: str, where=DOWN*2.28, size: int=56):
        m=self.math(expression,size)
        self.fit(m,13.60,1.10)
        m.move_to(where)
        self.play(Write(m),run_time=RUN_SLOW)
        return m

    def animate_cards(self, cards, runtime=2.6):
        self.play(LaggedStart(*[FadeIn(c,shift=UP*.15) for c in cards],
                              lag_ratio=.18),run_time=runtime)

    def row_cards(self, headlines, captions, widths=4.15, height=1.55, y=.75):
        cards=VGroup(*[
            self.tile(a,b,width=widths,height=height,size=33)
            for a,b in zip(headlines,captions)
        ])
        cards.arrange(RIGHT,buff=.32).move_to(UP*y)
        self.assert_content_safe(cards,"row cards")
        self.animate_cards(cards)
        return cards

    def question_cards(self, prompts):
        cards=VGroup(*[
            self.tile(text,width=13.28,height=1.10,size=30)
            for text in prompts
        ]).arrange(DOWN,buff=.24).move_to(DOWN*.04)
        self.assert_content_safe(cards,"formative checklist")
        for card in cards:
            self.play(FadeIn(card,shift=RIGHT*.16),run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)
        return cards

    def math_chain(self, expressions, size=53, y=-.25):
        active=self.math(expressions[0],size).move_to([0,y,0])
        self.fit(active,13.30,1.10)
        self.play(Write(active),run_time=RUN_SLOW)
        self.wait(PAUSE_READ)
        for expr in expressions[1:]:
            next_one=self.math(expr,size).move_to([0,y,0])
            self.fit(next_one,13.30,1.10)
            self.play(ReplacementTransform(active,next_one),run_time=RUN_SLOW)
            active=next_one
            self.wait(PAUSE_READ)
        return active


# ====================================================================
# WEEK 05 — ADVANCED PERMUTATIONS / ORDERED ROLES
# ====================================================================

class Statistics11Week05_2027(PeriodOneContinuation):
    """Proposed follow-on: P(n,r), restricted roles and adjacency in a line."""

    def construct(self):
        self.open_week(5,"ORDERED ROLES AND RESTRICTIONS",
                       "Advanced permutations without repetition",
                       "From choices to formulas, restricted cases, and proofs.")
        self.podium()
        self.partial_formula()
        self.constraint_first_role()
        self.adjacent_people()
        self.compare_ranking_and_group()
        self.independent_problem()
        self.summary()

    def podium(self):
        self.step(1,"A FIVE-PERSON LEADERSHIP TEAM",
                  "Choose President, Vice-President and Secretary in that order.")
        candidates=VGroup(*[self.pill(x,width=2.18) for x in ("A","B","C","D","E")])
        candidates.arrange(RIGHT,buff=.35).move_to(UP*1.75)
        roles=VGroup(*[
            self.tile(a,b,width=4.05,height=1.20,size=29)
            for a,b in (
                ("PRESIDENT","Position 1"),
                ("VICE-PRESIDENT","Position 2"),
                ("SECRETARY","Position 3"),
            )
        ]).arrange(RIGHT,buff=.30).move_to(DOWN*.75)
        self.assert_content_safe(VGroup(candidates,roles),"roles")
        self.animate_cards(candidates)
        self.animate_cards(roles)
        for i,k in enumerate((0,1,2)):
            self.play(candidates[k].animate.move_to(roles[i].get_center()+UP*.92),
                      run_time=RUN_SLOW)
        self.pause_line("Once a student fills one position, that student is unavailable.",4)

    def partial_formula(self):
        self.step(2,"COUNT THE FILLED POSITIONS, NOT EVERY STUDENT",
                  "Five candidates; only THREE ordered positions are required.")
        self.row_cards(("5 OPTIONS","4 OPTIONS","3 OPTIONS"),
                       ("President","Vice-President","Secretary"),
                       y=1.08)
        self.math_chain((
            r"5\times4\times3=60",
            r"{}_{5}P_{3}=\frac{5!}{(5-3)!}",
            r"{}_{5}P_{3}=\frac{5!}{2!}=60",
        ),size=54,y=-1.12)
        self.pause_line("The denominator removes the unfilled final positions.",4)

    def constraint_first_role(self):
        self.step(3,"RESTRICTED ROLE: TWO ELIGIBLE PRESIDENTS",
                  "Only A or B can be President; any remaining student can fill other roles.")
        self.row_cards(("2 OPTIONS","4 OPTIONS","3 OPTIONS"),
                       ("President","Vice-President","Secretary"),
                       y=.90)
        total=self.equation(r"2\times4\times3=24",DOWN*1.26,61)
        self.play(Circumscribe(total,color=BLACK_LINE),run_time=RUN_NORMAL)
        self.pause_line("Check the restriction BEFORE choosing a counting formula.",4)

    def adjacent_people(self):
        self.step(4,"RESTRICTION: A AND B MUST STAND TOGETHER",
                  "Arrange A, B, C and D in a line, treating A-B as one temporary block.")
        a=self.pill("A",width=1.42)
        b=self.pill("B",width=1.42)
        block=VGroup(a,b).arrange(RIGHT,buff=.09)
        frame=SurroundingRectangle(block,buff=.14,color=BLACK_LINE,
                                    stroke_width=2.4)
        frame.add(block)
        c=self.pill("C",width=1.52)
        d=self.pill("D",width=1.52)
        lineup=VGroup(frame,c,d).arrange(RIGHT,buff=.82).move_to(UP*.82)
        self.assert_content_safe(lineup,"adjacency block")
        self.animate_cards(lineup,3)
        choices=self.math(r"3!\ \mathrm{block\ positions}",44).move_to(DOWN*.52)
        self.play(Write(choices),run_time=RUN_SLOW)
        self.play(a.animate.move_to(b.get_center()),b.animate.move_to(a.get_center()),
                  run_time=RUN_SLOW)
        # Restore tokens to original order without changing the count.
        self.play(a.animate.move_to(b.get_center()),b.animate.move_to(a.get_center()),
                  run_time=RUN_SLOW)
        self.equation(r"2!\times3!=2\times6=12",DOWN*2.24,57)
        self.pause_line("There are 3! block orders, and A-B can be B-A.",4)

    def compare_ranking_and_group(self):
        self.step(5,"WHY THE ORDER CHANGES THE RESULT",
                  "The ordered roles A then B are different from B then A.")
        cards=VGroup(
            self.tile("A  |  B","President: A; Vice: B",width=6.30,height=1.58,size=36),
            self.tile("B  |  A","President: B; Vice: A",width=6.30,height=1.58,size=36)
        ).arrange(RIGHT,buff=.45).move_to(UP*.70)
        self.assert_content_safe(cards,"role order comparison")
        self.animate_cards(cards)
        self.equation(r"(A,B)\neq(B,A)",DOWN*1.05,65)
        self.pause_line("Ordered positions cannot be counted as unordered teams.",4)

    def independent_problem(self):
        self.step(6,"INDEPENDENT CHALLENGE: SEVEN RUNNERS",
                  "Award first, second and third place, with no ties.")
        self.row_cards(("7 RUNNERS","6 REMAIN","5 REMAIN"),
                       ("Gold","Silver","Bronze"),y=.96)
        self.pause_line("PAUSE: justify each factor before seeing the result.",8)
        self.equation(r"7\times6\times5=210",DOWN*1.20,61)
        self.pause_line("Every one of the 210 rankings has a unique order.",4)

    def summary(self):
        self.step(7,"WEEK 05 — METHOD CHECKPOINT",
                  "Explain why each factor represents a new position.")
        self.question_cards((
            "1. Are the roles ordered? If yes, order changes outcomes.",
            "2. Are repeated students forbidden? Reduce the choices.",
            "3. Is any position restricted? Apply that condition first.",
        ))
        self.pause_line("Next: what changes when order DOES NOT matter?",4)
        self.standard_closing("Permutations count distinct ordered assignments.")


# ====================================================================
# WEEK 06 — COMBINATIONS (UNORDERED SELECTION)
# ====================================================================

class Statistics11Week06_2027(PeriodOneContinuation):
    """Proposed continuation: binomial coefficients and choice of method."""

    def construct(self):
        self.open_week(6,"CHOOSE A TEAM, NOT A RANK",
                       "Combinations and justified method selection",
                       "Visual pairs, counting formulas, constraints and practice.")
        self.pairs_vs_rankings()
        self.graph_pairs()
        self.derive_combination()
        self.choose_three()
        self.mixed_team()
        self.committee_condition()
        self.practice()
        self.summary()

    def pairs_vs_rankings(self):
        self.step(1,"ORDERED PAIRS VERSUS UNORDERED TEAMS",
                  "From five students, choose two: a team has no first or second place.")
        group=VGroup(
            self.tile("A  THEN  B","One ordered pair",width=6.25,height=1.55,size=38),
            self.tile("B  THEN  A","Another ordered pair",width=6.25,height=1.55,size=38)
        ).arrange(RIGHT,buff=.42).move_to(UP*.98)
        self.assert_content_safe(group,"pair comparison")
        self.animate_cards(group)
        arrow=self.math(r"\{A,B\}=\{B,A\}",60).move_to(DOWN*.45)
        self.play(Write(arrow),run_time=RUN_SLOW)
        self.pause_line("These TWO rankings describe the SAME unordered team.",4)

    def graph_pairs(self):
        self.step(2,"GRAPHICAL PROOF: TEN DIFFERENT PAIRS",
                  "Connect each pair of five students exactly once.")
        center=np.array([-3.93,.25,0])
        radius=1.56
        symbols="ABCDE"
        angles=[np.pi/2-2*np.pi*i/5 for i in range(5)]
        points=[center+np.array([np.cos(a),np.sin(a),0])*radius
                for a in angles]
        dots=VGroup(*[
            Circle(radius=.27,stroke_width=2,stroke_color=BLACK_LINE,
                   fill_color=WHITE_FILL,fill_opacity=1).move_to(p)
            for p in points
        ])
        names=VGroup(*[self.text(s,29,BOLD).move_to(p) for s,p in zip(symbols,points)])
        self.play(LaggedStart(*[GrowFromCenter(d) for d in dots],
                              lag_ratio=.15),FadeIn(names),run_time=2.1)
        edges=VGroup()
        pairs=list(combinations(range(5),2))
        for i,j in pairs:
            line=Line(points[i],points[j],color=BLACK_LINE,
                      stroke_opacity=.80,stroke_width=2)
            edges.add(line)
            self.play(Create(line),run_time=.30)
            self.bring_to_front(dots,names)
        list_group=VGroup(*[
            self.pill(f"{symbols[i]} + {symbols[j]}",width=3.06)
            for i,j in pairs
        ]).arrange_in_grid(rows=5,cols=2,buff=(.25,.15))
        list_group.move_to([3.48,.11,0])
        self.assert_content_safe(list_group,"ten unordered pair labels")
        self.animate_cards(list_group,3.0)
        self.pause_line("Every graph edge stands for ONE team; there are 10 edges.",4)

    def derive_combination(self):
        self.step(3,"WHY DO WE DIVIDE BY TWO FACTORIAL?",
                  "Each two-person team appeared twice in the ordered list.")
        cards=self.row_cards(("ORDERED","REMOVE ORDER","UNORDERED"),
                             ("5 x 4 = 20","Divide by 2!","10 teams"),
                             y=1.09)
        self.math_chain((
            r"\frac{5\times4}{2!}=10",
            r"\binom{5}{2}=\frac{5!}{2!(5-2)!}",
            r"\binom{5}{2}=10",
        ),size=55,y=-1.22)
        self.pause_line("General rule: choose r from n without caring about order.",4)

    def choose_three(self):
        self.step(4,"SIX STUDENTS: CHOOSE THREE",
                  "Three positions would overcount each team by 3! arrangements.")
        self.row_cards(("6 OPTIONS","5 OPTIONS","4 OPTIONS"),
                       ("First name","Second name","Third name"),
                       y=1.10)
        eq=self.math(r"6\times5\times4=120",55).move_to(DOWN*.52)
        self.play(Write(eq),run_time=RUN_NORMAL)
        next_eq=self.math(r"\binom{6}{3}=\frac{120}{3!}=20",55).move_to(DOWN*.52)
        self.play(ReplacementTransform(eq,next_eq),run_time=RUN_SLOW)
        self.pause_line("One team of three has 3! = 6 possible listings.",4)

    def mixed_team(self):
        self.step(5,"CONSTRAINED TEAM: TWO FROM FOUR + ONE FROM THREE",
                  "Select two members from Group X and one member from Group Y.")
        self.row_cards(("GROUP X","GROUP Y"),
                       ("Choose 2 of 4","Choose 1 of 3"),
                       widths=6.16,y=.95)
        exp=self.equation(r"\binom{4}{2}\binom{3}{1}=6\times3=18",
                          DOWN*1.03,size=55)
        self.play(Circumscribe(exp,color=BLACK_LINE),run_time=RUN_NORMAL)
        self.pause_line("Each X-team can be matched with any one Y-member.",4)

    def committee_condition(self):
        self.step(6,"SEVEN CANDIDATES, THREE COMMITTEE SEATS",
                  "If A must serve, we only choose the other TWO from the remaining SIX.")
        panels=VGroup(
            self.tile("WITHOUT RESTRICTION","Choose 3 of 7",
                      width=6.25,height=1.55,size=32),
            self.tile("A MUST SERVE","Choose 2 of 6",
                      width=6.25,height=1.55,size=32)
        ).arrange(RIGHT,buff=.43).move_to(UP*1.12)
        self.animate_cards(panels)
        a=self.math(r"\binom{7}{3}=35",53).move_to([-3.40,-.63,0])
        b=self.math(r"\binom{6}{2}=15",53).move_to([3.40,-.63,0])
        self.play(Write(a),Write(b),run_time=RUN_SLOW)
        self.pause_line("The mandatory member has already been selected.",4)

    def practice(self):
        self.step(7,"INDEPENDENT WORK: ORDER MATTERS?",
                  "Choose the correct method before computing.")
        self.question_cards((
            "A. Select 2 of 8 classmates for a study group.",
            "B. Award first and second place among 8 finalists.",
            "C. Select 3 of 6 students for an unordered committee.",
        ))
        self.pause_line("PAUSE: compute three answers and defend the formulas.",8)
        self.math_chain((
            r"\binom{8}{2}=28",
            r"{}_{8}P_{2}=8\times7=56",
            r"\binom{6}{3}=20"
        ),size=56,y=-2.49)

    def summary(self):
        self.step(8,"WEEK 06 — DECISION RULE",
                  "Explain the difference between selecting a group and assigning roles.")
        self.question_cards((
            "1. Same members in a different order = same team?",
            "2. Yes: COMBINATION. No: PERMUTATION.",
            "3. Account for required members or other conditions.",
        ))
        self.pause_line("Next: arrangements when some objects are IDENTICAL.",4)
        self.standard_closing("Combinations ignore the order of selected members.")


# ====================================================================
# WEEK 07 — DISTINGUISHABLE PERMUTATIONS
# ====================================================================

class Statistics11Week07_2027(PeriodOneContinuation):
    """Proposed continuation: multiset permutations / dividing duplicate counts."""

    def construct(self):
        self.open_week(7,"REPEATED LETTERS, DISTINCT OUTCOMES",
                       "Distinguishable permutations of identical objects",
                       "Move the tokens, find duplicates, and correct the factorial.")
        self.aab_demonstration()
        self.aab_formula()
        self.aabb_grid()
        self.level_word()
        self.banana_word()
        self.balloons()
        self.practice()
        self.summary()

    def aab_demonstration(self):
        self.step(1,"THREE POSITIONS: A, A AND B",
                  "Two identical A letters cannot create new words by swapping.")
        tokens=VGroup(*[self.pill(z,width=2.54) for z in ("A","A","B")])
        tokens.arrange(RIGHT,buff=.50).move_to(UP*1.25)
        self.assert_content_safe(tokens,"AAB tokens")
        self.animate_cards(tokens)
        self.pause_line("Try moving B to a different position.",3)
        results=VGroup(*[self.pill(t,width=3.30) for t in ("AAB","ABA","BAA")])
        results.arrange(RIGHT,buff=.48).move_to(DOWN*.67)
        self.animate_cards(results)
        self.pause_line("Only THREE readable words exist, not six.",4)

    def aab_formula(self):
        self.step(2,"WHY THE NAIVE FACTORIAL OVERCOUNTS",
                  "Labelling the A letters as A1 and A2 creates artificial distinctions.")
        examples=self.row_cards(("A1 A2 B","A2 A1 B"),
                                ("Same visible word","Same visible word"),
                                widths=6.10,y=1.04)
        self.math_chain((
            r"3!=6\quad\mathrm{labelled\ orders}",
            r"\frac{3!}{2!}=\frac{6}{2}=3",
        ),size=56,y=-1.13)
        self.pause_line("Swapping the two identical A letters changes nothing.",4)

    def aabb_grid(self):
        self.step(3,"AABB: GRAPH EVERY DISTINCT PERMUTATION",
                  "Two As and two Bs; no repeated outcome should be counted twice.")
        words=sorted(set("".join(p) for p in permutations("AABB")))
        assert len(words)==6
        chips=VGroup(*[self.pill(w,width=3.55) for w in words])
        chips.arrange_in_grid(rows=2,cols=3,buff=(.38,.40)).move_to(UP*.32)
        self.assert_content_safe(chips,"six multiset outcomes")
        self.animate_cards(chips,3.0)
        self.equation(r"\frac{4!}{2!\,2!}=6",DOWN*1.98,61)
        self.pause_line("Each distinguishable sequence appears just once.",4)

    def level_word(self):
        self.step(4,"LEVEL — FIVE LETTERS WITH REPEATS",
                  "L appears twice, E appears twice, and V appears once.")
        row=VGroup(*[self.pill(letter,width=2.13) for letter in "LEVEL"])
        row.arrange(RIGHT,buff=.36).move_to(UP*1.18)
        self.assert_content_safe(row,"LEVEL symbols")
        self.animate_cards(row)
        legend=self.text("L: 2 copies    E: 2 copies    V: 1 copy",32,BOLD)
        legend.move_to(DOWN*.26)
        self.play(FadeIn(legend,shift=UP*.14),run_time=RUN_NORMAL)
        self.equation(r"\frac{5!}{2!\,2!}=\frac{120}{4}=30",
                      DOWN*1.74,58)
        self.pause_line("Divide by the internal swaps of each repeated letter.",4)

    def banana_word(self):
        self.step(5,"BANANA — COUNT A LARGE MULTISET",
                  "There are 3 As, 2 Ns, and 1 B.")
        letters=VGroup(*[self.pill(x,width=1.87) for x in "BANANA"])
        letters.arrange(RIGHT,buff=.30).move_to(UP*1.34)
        self.assert_content_safe(letters,"BANANA tokens")
        self.animate_cards(letters)
        self.math_chain((
            r"\frac{6!}{3!\,2!\,1!}",
            r"\frac{720}{6\times2}=60",
        ),size=63,y=-.91)
        self.pause_line("The factorials below account for invisible internal swaps.",4)

    def balloons(self):
        self.step(6,"BALLOON — AN INDEPENDENT CHECK",
                  "Seven letters: L repeated twice, O repeated twice.")
        symbols=VGroup(*[self.pill(x,width=1.65) for x in "BALLOON"])
        symbols.arrange(RIGHT,buff=.25).move_to(UP*1.22)
        self.assert_content_safe(symbols,"balloon letters")
        self.animate_cards(symbols,2.9)
        self.pause_line("PAUSE: write the corrected factorial before revealing.",8)
        self.equation(r"\frac{7!}{2!\,2!}=1260",DOWN*.99,62)
        self.pause_line("B, A and N are distinct; they need no correction factors.",4)

    def practice(self):
        self.step(7,"CHECK: IDENTICAL OBJECTS VERSUS UNIQUE OBJECTS",
                  "Compare two words with four total letters.")
        self.row_cards(("ABCD","AABC"),
                       ("All four distinct","Two As identical"),
                       widths=6.00,y=1.20)
        left=self.math(r"4!=24",54).move_to([-3.21,-1.06,0])
        right=self.math(r"\frac{4!}{2!}=12",54).move_to([3.21,-1.06,0])
        self.play(Write(left),Write(right),run_time=RUN_SLOW)
        self.pause_line("Repeated identical objects reduce the number of outcomes.",4)

    def summary(self):
        self.step(8,"WEEK 07 — JUSTIFY THE DENOMINATOR",
                  "Students should identify precisely which positions are interchangeable.")
        self.question_cards((
            "1. Count the total objects, including repeats.",
            "2. Divide by the factorial of EACH repeated group.",
            "3. Check short examples by listing all distinct words.",
        ))
        self.pause_line("Next: rotations may describe the SAME circular arrangement.",4)
        self.standard_closing("Identical objects create duplicate labelled arrangements.")


# ====================================================================
# WEEK 08 — CIRCULAR PERMUTATIONS & GRAPHICAL SOLUTIONS
# ====================================================================

class Statistics11Week08_2027(PeriodOneContinuation):
    """Proposed continuation: fixed-anchor cyclic arrangements and conditions."""

    def construct(self):
        self.open_week(8,"SEAT EVERYONE AROUND A CIRCLE",
                       "Circular permutations and graphical proofs",
                       "Rotate. Fix a reference. Count distinct arrangements.")
        self.rotate_four()
        self.anchor_four()
        self.derive_formula()
        self.more_seats()
        self.mirrors()
        self.neighbors_constraint()
        self.opposite_constraint()
        self.practice()
        self.summary()

    def circle_seats(self, names, center, radius=1.65):
        angles=[np.pi/2-i*2*np.pi/len(names) for i in range(len(names))]
        pts=[np.array(center)+radius*np.array([np.cos(a),np.sin(a),0])
             for a in angles]
        circle=Circle(radius=radius,stroke_width=2.2,stroke_color=BLACK_LINE)
        circle.move_to(center)
        seats=VGroup(*[
            Circle(radius=.38,stroke_width=2.2,stroke_color=BLACK_LINE,
                   fill_color=WHITE_FILL,fill_opacity=1).move_to(p)
            for p in pts
        ])
        labels=VGroup(*[self.text(n,33,BOLD).move_to(p)
                        for n,p in zip(names,pts)])
        return circle,seats,labels,angles,pts

    def rotate_four(self):
        self.step(1,"ROTATE THE TABLE WITHOUT CHANGING THE SEATING",
                  "Four friends move together; their circular neighbors stay unchanged.")
        center=np.array([-3.63,-.04,0])
        circ,seats,labels,angles,pts=self.circle_seats("ABCD",center)
        self.play(Create(circ),LaggedStart(*[GrowFromCenter(s) for s in seats],
                                                lag_ratio=.15),run_time=2.2)
        self.animate_cards(labels,1.5)
        info=self.tile("A - B - C - D",
                       "Clockwise order around the table",
                       width=5.35,height=1.70,size=35)
        info.move_to([3.33,.95,0])
        self.play(FadeIn(info,shift=LEFT*.13),run_time=RUN_NORMAL)
        for turn in range(3):
            paths=[Arc(radius=1.65,start_angle=a-turn*TAU/4,
                       angle=-TAU/4,arc_center=center)
                   for a in angles]
            self.play(*[MoveAlongPath(label,path)
                        for label,path in zip(labels,paths)],
                      run_time=RUN_SLOW)
            self.wait(.32)
        result=self.tile("SAME SEATING",
                         "Rotations are not new arrangements",
                         width=5.35,height=1.56,size=32)
        result.move_to([3.33,-1.37,0])
        self.play(FadeIn(result,shift=UP*.12),run_time=RUN_NORMAL)
        self.pause_line("For circular seating, only relative neighbor order matters.",4)

    def anchor_four(self):
        self.step(2,"FIX A AS A REFERENCE PERSON",
                  "Hold A fixed; arrange B, C and D around the other seats.")
        center=np.array([-3.76,.02,0])
        circle,seats,labels,_,_=self.circle_seats("ABCD",center)
        self.play(Create(circle),*[
            FadeIn(s) for s in seats],run_time=RUN_NORMAL)
        self.animate_cards(labels,1.5)
        box=SurroundingRectangle(VGroup(seats[0],labels[0]),
                                buff=.10,color=BLACK_LINE,stroke_width=2.8)
        self.play(Create(box),run_time=RUN_NORMAL)
        orders=["".join(p) for p in permutations("BCD")]
        chips=VGroup(*[self.pill("A | "+s,width=3.13) for s in orders])
        chips.arrange_in_grid(rows=3,cols=2,buff=(.23,.26)).move_to([3.16,.02,0])
        self.assert_content_safe(chips,"six anchored orders")
        self.animate_cards(chips,3)
        self.pause_line("Exactly six orders remain when the reference seat is fixed.",4)

    def derive_formula(self):
        self.step(3,"WHY CIRCULAR PERMUTATIONS USE (n-1)!",
                  "Each circular arrangement is counted n times as a linear order.")
        self.row_cards(("LINEAR","ROTATIONS","CIRCULAR"),
                       ("4! = 24","4 equivalent shifts","24 / 4 = 6"),
                       y=1.15)
        self.math_chain((
            r"\frac{4!}{4}=6",
            r"(4-1)!=3!=6",
            r"\mathrm{Circular}(n)=(n-1)!",
        ),size=58,y=-1.13)
        self.pause_line("Assumption: distinct people; rotations identical, reflections distinct.",4)

    def more_seats(self):
        self.step(4,"FIVE AND SIX FRIENDS AROUND A ROUND TABLE",
                  "Fix one reference person; arrange everybody else.")
        cards=VGroup(
            self.tile("5 PEOPLE","4! = 24 distinct circles",
                      width=6.25,height=1.65,size=33),
            self.tile("6 PEOPLE","5! = 120 distinct circles",
                      width=6.25,height=1.65,size=33)
        ).arrange(RIGHT,buff=.38).move_to(UP*1.03)
        self.assert_content_safe(cards,"table size examples")
        self.animate_cards(cards)
        one=self.math(r"(5-1)!=24",52).move_to([-3.34,-1.10,0])
        two=self.math(r"(6-1)!=120",52).move_to([3.34,-1.10,0])
        self.play(Write(one),Write(two),run_time=RUN_SLOW)
        self.pause_line("Fixing a single person removes rotational overcounting.",4)

    def mirrors(self):
        self.step(5,"IMPORTANT: A MIRROR IMAGE IS DIFFERENT",
                  "At an ordinary round table, clockwise ABCD differs from ADCB.")
        left=self.tile("A  B  C  D","Clockwise order",
                       width=6.25,height=1.54,size=37)
        right=self.tile("A  D  C  B","Reversed clockwise order",
                        width=6.25,height=1.54,size=37)
        pair=VGroup(left,right).arrange(RIGHT,buff=.45).move_to(UP*.69)
        self.assert_content_safe(pair,"mirror distinction")
        self.animate_cards(pair)
        self.equation(r"ABCD\ne ADCB",DOWN*1.15,62)
        self.pause_line("Reflection is NOT removed by (n-1)! for fixed round-table seating.",4)

    def neighbors_constraint(self):
        self.step(6,"FIVE FRIENDS: A AND B MUST BE NEIGHBORS",
                  "Treat A-B as a temporary block, then include both internal orders.")
        blocks=VGroup(*[
            self.pill(label,width=2.48) for label in ("[AB]","C","D","E")
        ])
        blocks.arrange(RIGHT,buff=.50).move_to(UP*1.25)
        self.assert_content_safe(blocks,"four cyclic units")
        self.animate_cards(blocks)
        calc=self.math(r"(4-1)!\times2!=3!\times2",56).move_to(DOWN*.30)
        self.play(Write(calc),run_time=RUN_SLOW)
        answer=self.equation(r"6\times2=12",DOWN*1.90,64)
        self.play(Circumscribe(answer,color=BLACK_LINE),run_time=RUN_NORMAL)
        self.pause_line("Two inner orders: AB and BA. Rotations remain equivalent.",4)

    def opposite_constraint(self):
        self.step(7,"SIX FRIENDS: A MUST SIT OPPOSITE B",
                  "Fix A; B has exactly one opposite seat, leaving four people.")
        center=np.array([-3.58,-.01,0])
        circle,seats,labels,_,pts=self.circle_seats("ABCDEF",center,radius=1.60)
        self.play(Create(circle),*[FadeIn(s) for s in seats],run_time=RUN_NORMAL)
        anchor=self.pill("A",width=1.18).move_to(pts[0])
        opposite=self.pill("B",width=1.18).move_to(pts[3])
        self.play(FadeIn(anchor),FadeIn(opposite),run_time=RUN_NORMAL)
        for k,n in zip((1,2,4,5),"CDEF"):
            t=self.text(n,30,BOLD).move_to(pts[k])
            self.play(FadeIn(t,shift=UP*.10),run_time=.35)
        explanation=self.tile("FOUR REMAINING SEATS",
                              "C, D, E, F can be arranged",
                              width=5.34,height=1.70,size=32)
        explanation.move_to([3.63,.94,0])
        self.play(FadeIn(explanation,shift=LEFT*.14))
        formula=self.math(r"4!=24",65).move_to([3.63,-1.13,0])
        self.play(Write(formula),run_time=RUN_SLOW)
        self.pause_line("Compare: without the opposite condition there are 5! = 120.",4)

    def practice(self):
        self.step(8,"LINE VERSUS CIRCLE — EXIT CHALLENGE",
                  "Decide which arrangements are equivalent before multiplying.")
        self.question_cards((
            "A. Five distinct friends standing in a line.",
            "B. Five distinct friends at a round table.",
            "C. Five around a circle, with two friends adjacent.",
        ))
        self.pause_line("PAUSE: justify all three outcomes using a diagram.",8)
        self.math_chain((
            r"\mathrm{Line}=5!=120",
            r"\mathrm{Circle}=4!=24",
            r"\mathrm{Adjacent}=2\times3!=12",
        ),size=53,y=-2.26)

    def summary(self):
        self.step(9,"WEEK 08 — EXPLAIN THE EQUIVALENCE RULE",
                  "Circular counting is about relative positions.")
        self.question_cards((
            "1. Can all people rotate together without changing the seating?",
            "2. Fix one reference, then order the remaining people.",
            "3. For a standard table, reverse order is still different.",
        ))
        self.pause_line("You can now solve the five thematic axes of Period I.",4)
        self.standard_closing("Circular permutations count arrangements up to rotation.")
