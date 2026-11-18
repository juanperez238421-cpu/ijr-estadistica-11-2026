#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Four *new* companion lessons for Statistics 11 (2027), weeks 01–04.

Pedagogical basis: user-provided Statistics_11_2027_P1.docx.
Cross-check: malla curricular - estadísticas 11° (2026), Period I.
All examples are additional worked problems, not substitutions for the first
four lessons. No early teaching of combinations, circular arrangements, or
distinguishable permutations. Output from real native ManimCE v0.20.1.

Usage:
    manim -pql advanced_companions.py Stat11W01Companion2027
    manim -pqh advanced_companions.py Stat11W01Companion2027
    # likewise Stat11W02Companion2027 ... Stat11W04Companion2027
"""
from __future__ import annotations

from itertools import product, permutations
from math import factorial
import numpy as np
from library.jp_classroom_style import *
from stat11_q1_2027_overview import Statistics11Quarter1Overview


class SeniorCompanion(Statistics11Quarter1Overview):
    """Shared JP Classroom geometry, timing, vector animation and checks."""

    def validate_lesson_data(self):
        super().validate_lesson_data()
        assert len(list(product(range(4), range(3)))) == 12
        assert len(list(product(range(6), range(4)))) == 24
        assert len(list(product(range(2), range(3), range(3)))) == 18
        assert factorial(4) == 24 and factorial(5) == 120
        assert 5 * 4 * 3 == 60 and 6 * 5 == 30
        # Disallowed pairs within 4x3: 12 - 2 = 10.
        permitted = [(i, j) for i in range(1,5) for j in range(1,4)
                     if (i, j) not in {(1,3), (3,2)}]
        assert len(permitted) == 10
        # Naive Week 1 draft has 11 entries, 10 distinct, 2 missing.
        draft = ((1,1),(1,2),(1,3),(2,1),(2,2),(2,3),
                 (3,1),(3,2),(3,2),(4,1),(4,2))
        assert len(draft) == 11 and len(set(draft)) == 10
        assert set(product(range(1,5), range(1,4))) - set(draft) == {(3,3),(4,3)}
        assert 2*3*3 == 18 and (2+3)*2 == 10
        assert 7*5 == 35 and 4*3*2 == 24

    def open_lesson(self, week: int, name: str, subtitle: str, promise: str):
        self.standard_opening(
            f"STATISTICS 11 | 2027 | WEEK {week:02d} | CHALLENGE LESSON",
            name, subtitle, promise
        )

    def message(self, content: str, size: int = 32, pos=DOWN*2.83):
        mob=self.text(content,size,BOLD)
        self.fit(mob,14.25,.56)
        mob.move_to(pos)
        self.play(FadeIn(mob,shift=UP*.14),run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)
        return mob

    def equation(self, latex: str, position=DOWN*2.43, size: int = 54):
        mob=self.math(latex,size).move_to(position)
        self.fit(mob,13.65,1.04)
        self.play(Write(mob),run_time=RUN_SLOW)
        return mob

    def outcome_grid(self, labels, cols: int, width: float = 3.10,
                     buff_x: float = .22, buff_y: float = .20,
                     center=DOWN*.22):
        cards=VGroup(*[self.pill(label,width=width) for label in labels])
        cards.arrange_in_grid(cols=cols,buff=(buff_x,buff_y)).move_to(center)
        self.assert_content_safe(cards, "complete outcome grid")
        return cards

    def fade_items(self, items, runtime=3.4, ratio=.13):
        self.play(LaggedStart(*[FadeIn(x,shift=UP*.12) for x in items],
                              lag_ratio=ratio),run_time=runtime)

    def two_panels(self, a_title, a_sub, b_title, b_sub):
        a=self.tile(a_title,a_sub,width=6.65,height=1.79,size=35)
        b=self.tile(b_title,b_sub,width=6.65,height=1.79,size=35)
        group=VGroup(a,b).arrange(RIGHT,buff=.37).move_to(UP*.32)
        self.assert_content_safe(group,"paired example")
        self.play(FadeIn(a,shift=RIGHT*.16),run_time=RUN_NORMAL)
        self.play(FadeIn(b,shift=LEFT*.16),run_time=RUN_NORMAL)
        return group

    def exit_cards(self, cards):
        group=VGroup(*[self.tile(t,width=13.35,height=1.18,size=30)
                       for t in cards]).arrange(DOWN,buff=.24).move_to(DOWN*.12)
        self.assert_content_safe(group,"exit cards")
        for x in group:
            self.play(FadeIn(x,shift=RIGHT*.12),run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)
        return group


class Stat11W01Companion2027(SeniorCompanion):
    """Complex systematic enumeration without teaching Week 2 multiplication."""

    def construct(self):
        self.open_lesson(1,"CAN YOU TRUST THE LIST?",
                         "Advanced counting with lists, tables and trees",
                         "Find the omissions. Repair the list. Prove it is complete.")
        self.situation()
        self.audit_incorrect_list()
        self.repair_listing()
        self.full_table()
        self.twelve_leaf_tree()
        self.challenge()
        self.written_justification()
        self.final_check()

    def situation(self):
        self.step(1,"A SCHOOL-SUPPLIES CHALLENGE",
                  "Select ONE of four shirt designs and ONE of three badges.")
        shirts=VGroup(*[self.tile(f"SHIRT {i}","School uniform",width=2.65,
                                 height=1.50,size=31) for i in range(1,5)])
        shirts.arrange(RIGHT,buff=.20).move_to(UP*1.02)
        badges=VGroup(*[self.pill(f"BADGE {j}",width=3.40)
                        for j in range(1,4)])
        badges.arrange(RIGHT,buff=.38).move_to(DOWN*.87)
        self.assert_content_safe(VGroup(shirts,badges),"school choices")
        self.fade_items(shirts,2.8)
        self.fade_items(badges,2.0)
        self.pause_line("What counts as ONE complete, unique outfit?",4)

    def audit_incorrect_list(self):
        self.step(2,"DETECT A DUPLICATE AND TWO OMISSIONS",
                  "An unorganized draft may repeat an outcome while missing others.")
        draft=((1,1),(1,2),(1,3),(2,1),(2,2),(2,3),
               (3,1),(3,2),(3,2),(4,1),(4,2))
        cards=self.outcome_grid([f"S{i} + B{j}" for i,j in draft],
                                cols=4,width=3.06,center=UP*.27)
        self.fade_items(cards,4)
        boxes=VGroup(*[SurroundingRectangle(cards[k],buff=.07,
                                            color=BLACK_LINE,stroke_width=3.0)
                       for k in (7,8)])
        self.play(*[Create(x) for x in boxes],run_time=RUN_NORMAL)
        self.message("11 entries, but only 10 different outcomes.",30,pos=DOWN*2.39)
        self.pause_line("Missing: S3 + B3 and S4 + B3.",4.5)

    def repair_listing(self):
        self.step(3,"REPAIR THE LIST — FIX ONE CHOICE",
                  "Keep one shirt fixed; cycle through every badge exactly once.")
        labels=[f"S{i} + B{j}" for i in range(1,5) for j in range(1,4)]
        cards=self.outcome_grid(labels,cols=3,width=3.91,
                                buff_x=.22,buff_y=.27,center=UP*.09)
        for i in range(4):
            row=cards[i*3:(i+1)*3]
            self.play(LaggedStart(*[FadeIn(c,shift=RIGHT*.14) for c in row],
                                  lag_ratio=.22),run_time=1.9)
            self.play(Circumscribe(VGroup(*row),color=BLACK_LINE,
                                  time_width=.5),run_time=RUN_NORMAL)
        self.equation(r"12\ \mathrm{different\ pairs}",DOWN*2.63,49)

    def full_table(self):
        self.step(4,"A 4-BY-3 OUTCOME TABLE",
                  "Each row is a shirt. Each column is a badge.")
        rows=[[f"Shirt {i}",*[f"S{i}+B{j}" for j in range(1,4)]]
              for i in range(1,5)]
        table=self.build_table(
            headers=("Shirt","Badge 1","Badge 2","Badge 3"),
            body_rows=rows,column_widths=(2.75,3.33,3.33,3.33),
            header_height=.86,row_height=.83,
            header_font_size=27,body_font_size=30)
        table.group.move_to(UP*.08)
        self.assert_content_safe(table.group,"12-cell table")
        self.animate_table_rows(table,include_header=True,pause=.35)
        self.play(self.shade_cells(table,[(i,3) for i in range(1,5)],opacity=.23),
                  run_time=RUN_NORMAL)
        self.pause_line("The previously missing outcomes are visible in the last column.",4)

    def twelve_leaf_tree(self):
        self.step(5,"TRACE TWELVE COMPLETE PATHS",
                  "Each branch goes from a shirt to one of its three badges.")
        origin=np.array([-6.50,0.0,0])
        first_y=[1.85,.54,-.77,-2.08]
        terminal_y=[2.12-i*.37 for i in range(12)]
        root=Dot(origin,radius=.105,color=BLACK_LINE)
        self.play(FadeIn(root),run_time=RUN_QUICK)
        leaves=VGroup()
        current_label=None
        for i,y in enumerate(first_y):
            mid=np.array([-3.45,y,0])
            trunk=Line(origin,mid,color=BLACK_LINE,stroke_width=2.5)
            self.play(Create(trunk),run_time=.45)
            self.play(FadeIn(self.pill(f"S{i+1}",width=1.68).move_to(mid)),
                      run_time=.32)
            for j in range(3):
                target=np.array([.12,terminal_y[i*3+j],0])
                path=Line(mid,target,color=BLACK_LINE,stroke_width=2)
                cursor=Dot(mid,radius=.045,color=BLACK_LINE)
                self.add(cursor)
                self.play(Create(path),MoveAlongPath(cursor,path),
                          run_time=.37)
                self.remove(cursor)
                leaf=Dot(target,radius=.070,color=BLACK_LINE)
                leaves.add(leaf)
                label=self.pill(f"S{i+1} + B{j+1}",width=3.20).move_to([4.08,.68,0])
                if current_label is None:
                    self.play(GrowFromCenter(leaf),FadeIn(label),
                              run_time=.31)
                else:
                    self.play(GrowFromCenter(leaf),
                              ReplacementTransform(current_label,label),
                              run_time=.31)
                current_label=label
        self.assert_content_safe(leaves,"twelve non-overlapping endpoints")
        result=self.tile("12 COMPLETE PATHS",
                         "Each endpoint represents one shirt + badge",
                         width=5.10,height=1.64,size=32).move_to([4.08,-1.35,0])
        self.play(FadeIn(result,shift=UP*.14),run_time=RUN_NORMAL)
        self.pause_line("Count completed paths — not only the first branches.",3.7)

    def challenge(self):
        self.step(6,"INDEPENDENT EXAMPLE: SCHOOL CLUBS",
                  "Three clubs offer four distinct workshop times each.")
        rows=[f"CLUB {i}" for i in range(1,4)]
        panel=VGroup(*[self.tile(name,"Times 1, 2, 3, 4",
                                 width=4.16,height=1.52,size=33)
                       for name in rows])
        panel.arrange(RIGHT,buff=.34).move_to(UP*.66)
        self.assert_content_safe(panel,"club example")
        self.fade_items(panel,3.0)
        self.pause_line("PAUSE: list ALL unique club + time choices.",8)
        self.play(FadeOut(panel),run_time=RUN_NORMAL)
        results=self.outcome_grid([f"C{i}-T{j}" for i in range(1,4)
                                   for j in range(1,5)],
                                  cols=4,width=2.81,center=DOWN*.85)
        self.fade_items(results,4.0)
        self.pause_line("Check row by row: four times for each club, without duplication.",4)

    def written_justification(self):
        self.step(7,"EXPLAIN COMPLETENESS IN WRITING",
                  "Mathematical evidence is more than a numerical answer.")
        self.exit_cards((
            "1. I fixed each first-stage choice in turn.",
            "2. I listed every second-stage choice once.",
            "3. I checked for repeats and for missing pairs.",
        ))
        self.pause_line("Compare your written reasoning with the visible table.",4)

    def final_check(self):
        self.step(8,"WEEK 01 — CHALLENGE CHECKPOINT",
                  "Show a complete organized list, then a confirming tree or table.")
        self.two_panels("LOOK FOR ERRORS","Repeated and missing outcomes",
                        "BUILD EVIDENCE","List + table + complete paths")
        self.pause_line("Ready for Week 2: from complete lists to efficient multiplication.",5)
        self.standard_closing("A count is reliable only when every outcome appears once.")


class Stat11W02Companion2027(SeniorCompanion):
    """Week 2: the multiplication rule, exceptions and restricted pairs."""

    def construct(self):
        self.open_lesson(2,"WHEN DOES MULTIPLICATION WORK?",
                         "Two-stage choices, restrictions, and independent checks",
                         "Count complete outcomes. Verify assumptions. Detect exclusions.")
        self.large_uniform_grid()
        self.derive_product()
        self.forbidden_pairs()
        self.branch_variation()
        self.new_large_case()
        self.diagnostic()
        self.final_check()

    def large_uniform_grid(self):
        self.step(1,"SIX FOOD CHOICES, FOUR DRINK CHOICES",
                  "Every lunch option has the same four drink options.")
        dots=VGroup()
        for row in range(6):
            y=1.95-row*.58
            group=VGroup(*[Dot([-3.10+j*.82,y,0],
                                radius=.105,color=BLACK_LINE) for j in range(4)])
            dots.add(group)
        self.assert_content_safe(dots,"6-by-4 dots")
        for i,row in enumerate(dots):
            self.play(LaggedStart(*[GrowFromCenter(d) for d in row],
                                  lag_ratio=.18),run_time=1.3)
        label=self.tile("6 ROWS","Each row contains 4 complete lunches",
                        width=6.05,height=1.62,size=33).move_to([3.70,.78,0])
        self.play(FadeIn(label,shift=RIGHT*.15))
        self.equation(r"6\cdot4=24",position=RIGHT*3.63+DOWN*1.29,size=64)
        self.pause_line("The dots are 24 DIFFERENT meal-and-drink pairs.",4)

    def derive_product(self):
        self.step(2,"REPEATED ADDITION BECOMES A PRODUCT",
                  "Counting by rows avoids writing every pair individually.")
        stack=self.equation_stack(
            [r"4+4+4+4+4+4=24",r"6\times4=24"],
            sizes=[52,62],buff=.68,max_width=12.8)
        stack.move_to(UP*.41)
        self.animate_equation_stack(stack,pause=PAUSE_EXPLAIN)
        focus=SurroundingRectangle(stack[-1],buff=.20,color=BLACK_LINE,
                                   stroke_width=2.6)
        self.play(Create(focus),run_time=RUN_NORMAL)
        self.pause_line("Only multiply when EACH initial choice has four follow-ups.",4)

    def forbidden_pairs(self):
        self.step(3,"EXAMPLE WITH TWO FORBIDDEN PAIRS",
                  "Four meals, three drinks; two specific combinations are unavailable.")
        bad={(1,3),(3,2)}
        rows=[[f"M{i}",*["X" if (i,j) in bad else f"M{i}+D{j}"
                         for j in range(1,4)]] for i in range(1,5)]
        tab=self.build_table(
            headers=("Meal","Drink 1","Drink 2","Drink 3"),
            body_rows=rows,column_widths=(2.7,3.35,3.35,3.35),
            row_height=.81,header_height=.85,
            header_font_size=28,body_font_size=28)
        tab.group.move_to(UP*.31)
        self.assert_content_safe(tab.group,"restricted table")
        self.animate_table_rows(tab,include_header=True,pause=.28)
        self.play(self.shade_cells(tab,[(1,3),(3,2)],opacity=.23),
                  run_time=RUN_NORMAL)
        self.equation(r"4\times3-2=10",DOWN*2.65,55)
        self.pause_line("Cross out the two invalid cells. Ten options remain.",3.5)

    def branch_variation(self):
        self.step(4,"WHY UNIFORM MULTIPLICATION CAN FAIL",
                  "Three food choices have 2, 4, and 3 available drinks.")
        panels=VGroup(*[
            self.tile(f"FOOD {i}",f"{count} drinks available",
                      width=4.25,height=1.52,size=31)
            for i,count in enumerate((2,4,3),start=1)
        ]).arrange(RIGHT,buff=.27).move_to(UP*.91)
        self.assert_content_safe(panels,"unequal branches")
        self.fade_items(panels,3.0)
        eq=self.equation(r"2+4+3=9",DOWN*.90,64)
        self.play(Circumscribe(eq,color=BLACK_LINE,time_width=.5))
        self.pause_line("There is NO single common second-stage count.",4)

    def new_large_case(self):
        self.step(5,"ANOTHER CONTEXT: SEVEN BAGS AND FIVE LABELS",
                  "Count an outcome by selecting one bag and one label.")
        columns=VGroup(*[self.tile(f"BAG {i}","5 labels",
                                     width=1.87,height=1.34,size=29)
                          for i in range(1,8)])
        columns.arrange(RIGHT,buff=.16).move_to(UP*1.05)
        self.assert_content_safe(columns,"seven bags")
        self.fade_items(columns,3.2)
        formula=self.equation(r"7\times5=35",DOWN*.73,65)
        self.pause_line("A list of 35 pairs would agree with this product.",4)

    def diagnostic(self):
        self.step(6,"YOU DECIDE: PRODUCT OR BRANCH SUM?",
                  "Two closely related cases have different reasoning.")
        self.two_panels("CASE A","5 routes; 3 stops for every route",
                        "CASE B","Route A: 2 stops; route B: 4")
        self.pause_line("PAUSE: explain which method fits each case.",8)
        eq1=self.math(r"5\times3=15",51).move_to([-3.42,-1.38,0])
        eq2=self.math(r"2+4=6",51).move_to([3.42,-1.38,0])
        self.play(Write(eq1),Write(eq2),run_time=RUN_SLOW)
        self.pause_line("Each calculation must correspond to the actual branches.",4)

    def final_check(self):
        self.step(7,"WEEK 02 — CHALLENGE CHECKPOINT",
                  "Verify the result with a table, complete tree or written argument.")
        self.exit_cards((
            "1. State the available choices at BOTH stages.",
            "2. Check whether the follow-up count is constant.",
            "3. Multiply valid options or sum unequal branch totals.",
        ))
        self.pause_line("Next: three consecutive decisions with three tree levels.",4)
        self.standard_closing("The multiplication rule counts complete pairs, not guesses.")


class Stat11W03Companion2027(SeniorCompanion):
    """Week 3: three-stage branching, an 18-leaf tree, conditional cases."""

    def construct(self):
        self.open_lesson(3,"THREE-STAGE DECISION LAB",
                         "Larger trees and conditional counting problems",
                         "Track each stage. Check every leaf. Explain the product.")
        self.context()
        self.eighteen_leaf_tree()
        self.path_explanation()
        self.compact_verification()
        self.conditional_case()
        self.practice()
        self.final_check()

    def context(self):
        self.step(1,"PLAN A SCHOOL ACTIVITY",
                  "Choose one of 2 buses, 3 activity times, and 3 badges.")
        cards=VGroup(*[
            self.tile(title,desc,width=4.32,height=1.75,size=33)
            for title,desc in (
                ("2 BUSES","Stage 1"),
                ("3 TIMES","Stage 2"),
                ("3 BADGES","Stage 3"),
            )])
        cards.arrange(RIGHT,buff=.27).move_to(UP*.69)
        self.assert_content_safe(cards,"three-stage choices")
        self.fade_items(cards,2.6)
        self.equation(r"2\times3\times3=18",DOWN*1.26,58)
        self.pause_line("Now verify that 18 is the number of complete routes.",4)

    def eighteen_leaf_tree(self):
        self.step(2,"CONSTRUCT AN 18-LEAF DECISION TREE",
                  "First 2 branches; then 3 from each; then 3 from each again.")
        origin=np.array([-6.45,-.10,0])
        first=[np.array([-4.28,1.38,0]),np.array([-4.28,-1.48,0])]
        middles=[np.array([-1.70,y,0]) for y in
                 (2.05,1.34,.63,-.82,-1.53,-2.24)]
        final_ys=[2.27-.26*k for k in range(18)]
        self.play(GrowFromCenter(Dot(origin,radius=.10,color=BLACK_LINE)))
        for i,a in enumerate(first):
            line=Line(origin,a,color=BLACK_LINE,stroke_width=2.55)
            self.play(Create(line),run_time=.62)
            tag=self.text(f"B{i+1}",28,BOLD).next_to(a,UP,buff=.16)
            self.play(FadeIn(tag),run_time=.34)
        for k,m in enumerate(middles):
            line=Line(first[k//3],m,color=BLACK_LINE,stroke_width=2.2)
            self.play(Create(line),run_time=.32)
        leaves=VGroup()
        for k in range(18):
            point=np.array([1.0,final_ys[k],0])
            seg=Line(middles[k//3],point,stroke_width=1.7,color=BLACK_LINE)
            node=Dot(point,radius=.052,color=BLACK_LINE)
            leaves.add(node)
            self.play(Create(seg),GrowFromCenter(node),run_time=.23)
        self.assert_content_safe(leaves,"18 endpoints")
        summary=self.tile("18 COMPLETE PATHS","2 x 3 x 3 = 18",
                          width=4.72,height=1.70,size=36)
        summary.move_to([4.28,.02,0])
        self.play(FadeIn(summary,shift=LEFT*.16),run_time=RUN_NORMAL)
        self.pause_line("Every endpoint corresponds to one bus, one time, one badge.",4)

    def path_explanation(self):
        self.step(3,"FOLLOW ONE COMPLETE 3-STEP PATH",
                  "A partial branch is not an outcome until all three choices exist.")
        parts=("BUS 2","TIME 3","BADGE 1")
        cards=VGroup(*[self.pill(t,width=3.4) for t in parts])
        cards.arrange(RIGHT,buff=1.15).move_to(UP*.64)
        self.assert_content_safe(cards,"one complete route")
        arrows=[]
        for i,c in enumerate(cards):
            self.play(FadeIn(c,shift=UP*.18),run_time=RUN_NORMAL)
            if i>0:
                arrow=Arrow(cards[i-1].get_right(),c.get_left(),color=BLACK_LINE,
                            buff=.08,stroke_width=2.6,
                            max_tip_length_to_length_ratio=.22)
                arrows.append(arrow)
                self.play(GrowArrow(arrow),run_time=RUN_NORMAL)
        self.equation(r"(B_2,T_3,G_1)",DOWN*1.36,58)
        self.pause_line("A valid outcome records exactly THREE chosen options.",3.5)

    def compact_verification(self):
        self.step(4,"VALIDATE THE TREE USING A COMPACT TABLE",
                  "There are six bus-time pairs; each pairs with three badges.")
        pairs=list(product(range(1,3),range(1,4)))
        rows=[[f"B{b}-T{t}",*[f"G{g}" for g in range(1,4)]]
              for b,t in pairs]
        table=self.build_table(
            headers=("Bus-Time","Badge 1","Badge 2","Badge 3"),
            body_rows=rows,column_widths=(3.30,3.18,3.18,3.18),
            header_height=.73,row_height=.63,
            header_font_size=27,body_font_size=28)
        table.group.move_to(UP*.23)
        self.assert_content_safe(table.group,"six by three verification")
        self.animate_table_rows(table,include_header=True,pause=.23)
        self.equation(r"6\ \mathrm{rows}\times3=18",DOWN*2.66,52)
        self.pause_line("A correct table and the tree yield the same result.",4)

    def conditional_case(self):
        self.step(5,"THREE STAGES WITH UNEQUAL MIDDLE BRANCHES",
                  "Bus A offers 2 times; Bus B offers 3; each time offers 2 badges.")
        group=VGroup(
            self.tile("BUS A","2 times x 2 badges = 4",
                      width=6.15,height=1.80,size=36),
            self.tile("BUS B","3 times x 2 badges = 6",
                      width=6.15,height=1.80,size=36),
        ).arrange(RIGHT,buff=.43).move_to(UP*.87)
        self.assert_content_safe(group,"dependent multi-stage counts")
        self.play(FadeIn(group[0],shift=RIGHT*.17),run_time=RUN_NORMAL)
        self.play(FadeIn(group[1],shift=LEFT*.17),run_time=RUN_NORMAL)
        self.equation(r"(2\times2)+(3\times2)=10",DOWN*1.06,58)
        self.pause_line("Add the separately counted branches: 4 + 6 = 10.",4)

    def practice(self):
        self.step(6,"CHALLENGE: DESIGN A THREE-STAGE SCHEDULE",
                  "Choose one of 4 entrances, 3 classrooms and 2 ID cards.")
        cards=VGroup(*[
            self.tile(a,b,width=4.2,height=1.58,size=32)
            for a,b in (("4 ENTRANCES","Stage 1"),
                        ("3 CLASSROOMS","Stage 2"),
                        ("2 ID CARDS","Stage 3"))
        ]).arrange(RIGHT,buff=.29).move_to(UP*.82)
        self.assert_content_safe(cards,"four by three by two")
        self.fade_items(cards,2.8)
        self.pause_line("PAUSE: draw a compact tree and justify the total.",9)
        self.equation(r"4\times3\times2=24",DOWN*1.08,62)
        self.pause_line("There are 24 complete entrance-room-card assignments.",4)

    def final_check(self):
        self.step(7,"WEEK 03 — EXPLAIN YOUR TREE",
                  "Your reasoning must verify the numerical result.")
        self.exit_cards((
            "1. Label each decision stage on the diagram.",
            "2. Count COMPLETE leaves, not partial branches.",
            "3. Compare the graph with the product or branch sum.",
        ))
        self.pause_line("A reliable three-stage answer has a visible justification.",4)
        self.standard_closing("Every completed branch is one valid three-stage outcome.")


class Stat11W04Companion2027(SeniorCompanion):
    """Week 4: ordered rankings, partial positions and basic factorials."""

    def construct(self):
        self.open_lesson(4,"THE ORDER CHANGES EVERYTHING",
                         "More complex arrangements without repetition",
                         "Animate rankings. Reduce choices. Validate factorials.")
        self.podium()
        self.rank_product()
        self.four_letter_list()
        self.factorial()
        self.partial_positions()
        self.common_mistake()
        self.practice()
        self.final_check()

    def podium(self):
        self.step(1,"PODIUM: FIVE CANDIDATES, THREE PLACES",
                  "First, second and third place are different positions.")
        people=VGroup(*[self.pill(p,width=2.12) for p in ("A","B","C","D","E")])
        people.arrange(RIGHT,buff=.27).move_to(UP*1.54)
        slots=VGroup(*[RoundedRectangle(width=2.2,height=.78,
                           corner_radius=.12,stroke_width=2.1,
                           color=BLACK_LINE) for _ in range(3)])
        slots.arrange(RIGHT,buff=.88).move_to(DOWN*.78)
        labels=VGroup(*[self.text(s,27,BOLD).next_to(slot,DOWN,buff=.22)
                        for s,slot in zip(("FIRST","SECOND","THIRD"),slots)])
        self.assert_content_safe(VGroup(people,slots,labels),"podium")
        self.fade_items(people,3)
        self.play(LaggedStart(*[Create(s) for s in slots],lag_ratio=.22))
        self.play(FadeIn(labels))
        for i in range(3):
            self.play(people[i].animate.move_to(slots[i].get_center()),
                      run_time=RUN_SLOW)
        self.pause_line("Swapping any two placed students produces another ranking.",4)

    def rank_product(self):
        self.step(2,"WHY THE CHOICES DECREASE: 5, 4, 3",
                  "Nobody can receive two different places on the same podium.")
        factors=VGroup(*[
            self.tile(h,small,width=4.23,height=1.59,size=34)
            for h,small in (
                ("5 FIRST","All candidates"),
                ("4 SECOND","One already used"),
                ("3 THIRD","Two already used"),
            )
        ]).arrange(RIGHT,buff=.34).move_to(UP*.89)
        self.assert_content_safe(factors,"decreasing choices")
        for x in factors:
            self.play(FadeIn(x,shift=UP*.14),run_time=RUN_NORMAL)
        self.equation(r"5\times4\times3=60",DOWN*.87,65)
        self.pause_line("60 different ordered podiums, not just five teams.",4)

    def four_letter_list(self):
        self.step(3,"ALL ORDERS OF FOUR DIFFERENT LETTERS",
                  "Fix the first letter, then enumerate the remaining three.")
        words=["".join(p) for p in permutations("ABCD")]
        assert len(words)==len(set(words))==24
        rows=[words[i*6:(i+1)*6] for i in range(4)]
        cards=VGroup(*[self.pill(w,width=2.03) for w in words])
        cards.arrange_in_grid(rows=4,cols=6,buff=(.16,.21)).move_to(UP*.07)
        self.assert_content_safe(cards,"24 four-letter permutations")
        for i in range(4):
            row=cards[i*6:(i+1)*6]
            self.play(LaggedStart(*[FadeIn(c,shift=UP*.10) for c in row],
                                  lag_ratio=.15),run_time=1.7)
            self.play(Circumscribe(VGroup(*row),color=BLACK_LINE),
                      run_time=RUN_NORMAL)
        self.equation(r"24\ \mathrm{distinct\ orders}",DOWN*2.80,47)

    def factorial(self):
        self.step(4,"FACTORIAL IS A PRODUCT OF DECREASING CHOICES",
                  "Arrange all four books; then compare with five books.")
        expressions=(r"4!=4\times3\times2\times1",
                     r"4!=24",
                     r"5!=5\times4\times3\times2\times1=120")
        mobs=self.equation_stack(expressions,sizes=[47,63,43],
                                 buff=.52,max_width=13.0)
        mobs.move_to(UP*.18)
        self.animate_equation_stack(mobs,pause=PAUSE_EXPLAIN)
        self.play(Circumscribe(mobs[-1],color=BLACK_LINE),run_time=RUN_NORMAL)
        self.pause_line("The factorial notation applies when arranging ALL objects.",4)

    def partial_positions(self):
        self.step(5,"PARTIAL RANKING: SIX RUNNERS, TWO MEDALS",
                  "Choosing only two distinct positions does not require 6!.")
        slots=VGroup(
            self.tile("GOLD MEDAL","6 runners possible",
                      width=5.90,height=1.85,size=34),
            self.tile("SILVER MEDAL","5 runners remain",
                      width=5.90,height=1.85,size=34),
        ).arrange(RIGHT,buff=.48).move_to(UP*.82)
        self.assert_content_safe(slots,"six runners two positions")
        self.play(FadeIn(slots[0],shift=RIGHT*.13),run_time=RUN_NORMAL)
        self.play(FadeIn(slots[1],shift=LEFT*.13),run_time=RUN_NORMAL)
        self.equation(r"6\times5=30",DOWN*1.02,62)
        self.pause_line("Count filled positions only: 30 valid ordered pairs.",4)

    def common_mistake(self):
        self.step(6,"COMMON ERROR: REUSING A CANDIDATE",
                  "The same person cannot occupy all three medal positions.")
        self.two_panels("WRONG: 5 x 5 x 5","Allows one runner multiple medals",
                        "RIGHT: 5 x 4 x 3","One fewer runner at each pick")
        wrong=self.math(r"125\ne60",58).move_to(DOWN*1.48)
        self.play(Write(wrong),run_time=RUN_SLOW)
        self.pause_line("Before multiplying, identify whether repetition is allowed.",4)

    def practice(self):
        self.step(7,"INDEPENDENT ARRANGEMENT PROBLEMS",
                  "Use decreasing choices and justify each factor.")
        prompts=VGroup(
            self.tile("Four students in a line","4 x 3 x 2 x 1 = 24",
                      width=12.78,height=1.25,size=30),
            self.tile("Choose president and deputy from 4","4 x 3 = 12",
                      width=12.78,height=1.25,size=30),
            self.tile("Choose three medalists from 5","5 x 4 x 3 = 60",
                      width=12.78,height=1.25,size=30),
        ).arrange(DOWN,buff=.25).move_to(DOWN*.05)
        self.assert_content_safe(prompts,"arrangement examples")
        for x in prompts:
            self.play(FadeIn(x,shift=RIGHT*.14),run_time=RUN_NORMAL)
            self.wait(PAUSE_WORK)
        self.pause_line("Why does the number of factors depend on positions filled?",5)

    def final_check(self):
        self.step(8,"WEEK 04 — THINK BEFORE YOU COUNT",
                  "Distinguish complete arrangements from partial rankings.")
        self.exit_cards((
            "1. Does changing the order create another outcome?",
            "2. Can an object occupy more than one position?",
            "3. Count only the positions that must be filled.",
        ))
        self.pause_line("Later in Period I: combinations and advanced arrangements.",4)
        self.standard_closing("Ordered positions are counted by decreasing choices.")
