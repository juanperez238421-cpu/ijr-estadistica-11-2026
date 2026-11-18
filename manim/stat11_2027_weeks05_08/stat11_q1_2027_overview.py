#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Statistics 11: Quarter 1 overview — native ManimCE 0.20.x.

Verified reference: Statistics_11_2027_P1.docx.
The uploaded planner contains four dated lessons (weeks 1-4) and explicitly
mentions combinations + advanced permutations for later in the quarter.
It does NOT provide the rest of the quarter or full academic year.
This lesson deliberately labels the undated topics as PREVIEW.

Visual design: use the genuine JP Classroom consolidated style library.
Output: 16:9, white background, black typography, 30 fps, native vector motion.
Run:
 manim -pql stat11_q1_2027_overview.py Statistics11Quarter1Overview
 manim -pqh stat11_q1_2027_overview.py Statistics11Quarter1Overview
"""
from __future__ import annotations
import itertools
from library.jp_classroom_style import *

SCHOOL_PAIRS = tuple(itertools.product(("P1", "P2"), ("N1", "N2", "N3")))
PERMUTATIONS_3 = tuple("".join(p) for p in itertools.permutations("ABC"))
THREE_STAGE = tuple(itertools.product(range(2), range(3), range(2)))
TWO_PERSON_GROUPS = tuple(itertools.combinations("ABC", 2))


class Statistics11Quarter1Overview(JPMathClassroomScene):
    """Full moving-concept overview of documented Q1 sequence, not static slides."""

    def validate_lesson_data(self) -> None:
        assert len(SCHOOL_PAIRS) == len(set(SCHOOL_PAIRS)) == 6
        assert len(THREE_STAGE) == 12
        assert PERMUTATIONS_3 == ("ABC", "ACB", "BAC", "BCA", "CAB", "CBA")
        assert TWO_PERSON_GROUPS == (("A", "B"), ("A", "C"), ("B", "C"))
        assert 3 * 2 == 6 and 2 * 3 * 2 == 12 and 3 * 2 * 1 == 6

    def construct(self) -> None:
        self.opening()
        self.roadmap()
        self.choices()
        self.organized_list()
        self.table()
        self.tree()
        self.multiply()
        self.multi_stage()
        self.order_matters()
        self.permutations()
        self.later_preview()
        self.connections()
        self.exit_ticket()

    # -------------------- JP consolidated design helpers --------------------
    def step(self, number: int, title: str, subtitle: str) -> None:
        self.clear_stage(keep_header=False)
        num_border = RoundedRectangle(width=.86, height=.63, corner_radius=.10,
                                     stroke_width=2.3, stroke_color=BLACK_LINE)
        num = self.text(f"{number:02d}", 32, BOLD).move_to(num_border)
        heading = self.text(title, 45, BOLD)
        self.fit(heading, 13.0, .80)
        line = VGroup(VGroup(num_border, num), heading).arrange(RIGHT, buff=.29)
        line.move_to([-7.35 + line.width/2, 3.66, 0])
        rule = Line(LEFT*7.40, RIGHT*7.40, stroke_width=2.2,
                    stroke_color=LIGHT_GRAY).move_to(UP*3.12)
        detail = self.text(subtitle, 25)
        self.fit(detail, 14.55, .51)
        detail.move_to([-7.32 + detail.width/2, 2.78, 0])
        self.header_group = VGroup(line, rule)
        self.subtitle_group = detail
        self.play(FadeIn(self.header_group, shift=DOWN*.12), FadeIn(detail),
                  run_time=RUN_QUICK)

    def tile(self, headline: str, line: str = "", width: float = 4.3,
             height: float = 1.50, size: int = 31) -> VGroup:
        border = RoundedRectangle(width=width, height=height,
                                  corner_radius=.13, stroke_color=BLACK_LINE,
                                  stroke_width=2, fill_color=WHITE_FILL,
                                  fill_opacity=1)
        head = self.text(headline, size, BOLD)
        if line:
            sub = self.text(line, 22)
            inner = VGroup(head, sub).arrange(DOWN, buff=.13)
        else:
            inner = VGroup(head)
        self.fit(inner, width-.33, height-.23)
        inner.move_to(border)
        return VGroup(border, inner)

    def pill(self, label: str, width: float = 2.30) -> VGroup:
        shape = RoundedRectangle(width=width, height=.72, corner_radius=.16,
                                 stroke_color=BLACK_LINE, stroke_width=1.8,
                                 fill_color=PAPER_GRAY, fill_opacity=1)
        name = self.text(label, 27, BOLD).move_to(shape)
        self.fit(name, width-.24, .57)
        return VGroup(shape, name)

    def pause_line(self, phrase: str, seconds: float = 3.0) -> None:
        t = self.text(phrase, 26, BOLD).move_to(DOWN*3.52)
        self.fit(t, 14.3, .48)
        self.play(FadeIn(t, shift=UP*.10), run_time=RUN_QUICK)
        self.wait(seconds)
        self.play(FadeOut(t), run_time=RUN_QUICK)

    # ------------------------------- intro ---------------------------------
    def opening(self) -> None:
        self.standard_opening(
            "STATISTICS 11  |  2027  |  QUARTER 1",
            "THE MATHEMATICS OF CHOICES",
            "From organized counting to permutations",
            "Observe it. Represent it. Count it. Explain it.",
        )

    def roadmap(self) -> None:
        self.step(1, "THE FOUR DOCUMENTED WEEKS",
                  "Each week extends an idea introduced during the previous lesson.")
        parts = (
            ("WEEK 01   |   JAN 19-22", "Organized lists, tables, trees"),
            ("WEEK 02   |   JAN 25-29", "Fundamental counting principle"),
            ("WEEK 03   |   FEB 01-05", "Three-stage choices"),
            ("WEEK 04   |   FEB 08-12", "Permutations and factorials"),
        )
        cards = VGroup(*[
            self.tile(a, b, width=6.80, height=1.82, size=29)
            for a, b in parts
        ]).arrange_in_grid(rows=2, cols=2, buff=(.28,.34))
        cards.move_to(DOWN*.15)
        self.assert_content_safe(cards, "four dated topics")
        for item in cards:
            self.play(FadeIn(item, shift=UP*.20), run_time=RUN_NORMAL)
            self.wait(.55)
        self.pause_line("Later in the quarter: combinations and advanced permutations.", 4)

    def choices(self) -> None:
        self.step(2, "WEEK 01 — WHAT COUNTS AS AN OUTCOME?",
                  "Two pencils and three notebooks: choose one of each.")
        pencils = VGroup(*[self.tile(p, width=2.60, height=1.06) for p in ("P1","P2")])
        notebooks = VGroup(*[self.tile(n, width=2.25, height=.95)
                             for n in ("N1","N2","N3")])
        pencils.arrange(DOWN, buff=.29).move_to(LEFT*4.65+UP*.10)
        notebooks.arrange(DOWN, buff=.21).move_to(RIGHT*3.70+UP*.09)
        a = self.text("PENCILS", 31, BOLD).next_to(pencils, UP, buff=.36)
        b = self.text("NOTEBOOKS", 31, BOLD).next_to(notebooks, UP, buff=.34)
        self.assert_content_safe(VGroup(pencils,notebooks,a,b), "choice model")
        self.play(Write(a), Write(b))
        self.play(LaggedStart(*[FadeIn(x, shift=RIGHT*.18) for x in pencils],
                              lag_ratio=.20), run_time=1.65)
        self.play(LaggedStart(*[FadeIn(x, shift=LEFT*.18) for x in notebooks],
                              lag_ratio=.20), run_time=1.80)
        for j in range(2):
            for k in range(3):
                link=Line(pencils[j].get_right(),notebooks[k].get_left(),
                          color=BLACK_LINE, stroke_width=1.8)
                self.play(Create(link), run_time=.37)
                self.play(FadeOut(link), run_time=.18)
        self.pause_line("A pair is a complete outcome: pencil + notebook.", 3.5)

    def organized_list(self) -> None:
        self.step(3, "WEEK 01 — A COMPLETE ORGANIZED LIST",
                  "Fix the first choice; then list every second choice once.")
        names=("P1 + N1","P1 + N2","P1 + N3","P2 + N1","P2 + N2","P2 + N3")
        positions=[(-4.58,1.12), (0,1.12), (4.58,1.12),
                   (-4.58,-.51), (0,-.51), (4.58,-.51)]
        all_pills=VGroup()
        for name,(x,y) in zip(names,positions):
            chip=self.pill(name,3.77).move_to([x,y,0])
            all_pills.add(chip)
            self.play(FadeIn(chip, shift=UP*.12), run_time=RUN_NORMAL)
        self.assert_content_safe(all_pills, "complete list")
        count = self.tile("6 DIFFERENT PAIRS", "No missing cases. No duplicates.",
                          width=8.0,height=1.25,size=31).move_to(DOWN*2.43)
        self.play(Create(SurroundingRectangle(all_pills, color=BLACK_LINE,
                                              stroke_width=2,buff=.18)),
                  FadeIn(count, shift=UP*.17),run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)

    def table(self) -> None:
        self.step(4, "WEEK 01 — THE SAME OUTCOMES IN A TABLE",
                  "Rows identify the pencil; columns identify the notebook.")
        table=self.build_table(
            headers=("Pencil","Notebook 1","Notebook 2","Notebook 3"),
            body_rows=(("P1","P1+N1","P1+N2","P1+N3"),
                       ("P2","P2+N1","P2+N2","P2+N3")),
            column_widths=(2.75,3.20,3.20,3.20),
            row_height=1.19, header_height=1.09,
            header_font_size=30, body_font_size=32)
        table.group.move_to(DOWN*.25)
        self.assert_content_safe(table.group, "outcome table")
        self.animate_table_rows(table, include_header=True, pause=.70)
        self.play(self.shade_cells(table, [(1,1),(1,2),(1,3),
                                           (2,1),(2,2),(2,3)]),run_time=RUN_NORMAL)
        self.pause_line("Six cells, six possible outcomes.", 3)

    def tree(self) -> None:
        self.step(5, "WEEK 01 — TREE DIAGRAM",
                  "One completed route from start to finish represents one outcome.")
        origin=LEFT*6.64+DOWN*.48
        ppoints=[[-2.85,1.16,0],[-2.85,-1.72,0]]
        ys=[[1.82,1.07,.32],[-1.12,-1.90,-2.68]]
        self.play(GrowFromCenter(Dot(origin,radius=.11,color=BLACK_LINE)))
        for i,p in enumerate(("P1","P2")):
            point=ppoints[i]
            trunk=Line(origin,point,stroke_width=3,color=BLACK_LINE)
            label=self.text(p,30,BOLD).move_to([-3.08,point[1]+.29,0])
            self.play(Create(trunk),FadeIn(label),run_time=RUN_NORMAL)
            for k,n in enumerate(("N1","N2","N3")):
                end=[.82,ys[i][k],0]
                segment=Line(point,end,color=BLACK_LINE,stroke_width=2.3)
                cursor=Dot(point,radius=.055,color=BLACK_LINE)
                self.add(cursor)
                self.play(Create(segment),MoveAlongPath(cursor,segment),
                          run_time=RUN_NORMAL)
                self.remove(cursor)
                out=self.pill(f"{p} + {n}",width=2.75)
                out.move_to([3.62,ys[i][k],0])
                self.play(FadeIn(out,shift=RIGHT*.12),run_time=RUN_QUICK)
        self.pause_line("Count the six completed paths, not the number of branches.",3.3)

    def multiply(self) -> None:
        self.step(6, "WEEK 02 — FROM A TREE TO MULTIPLICATION",
                  "Three snack choices and two drink choices at each snack.")
        snack=self.text("SNACKS",30,BOLD).move_to([-4.85,1.91,0])
        drink=self.text("DRINKS",30,BOLD).move_to([.92,1.91,0])
        self.play(Write(snack),Write(drink))
        left_y=(1.02,0.02,-.98)
        right_y=((1.43,.87),(.45,-.11),(-.53,-1.09))
        total=0
        for i,y in enumerate(left_y):
            first=self.pill(f"S{i+1}",2.08).move_to([-4.75,y,0])
            self.play(FadeIn(first,shift=RIGHT*.09),run_time=RUN_QUICK)
            for j,ey in enumerate(right_y[i]):
                stop=[-.30,ey,0]
                branch=Line(first.get_right(),stop,color=BLACK_LINE,stroke_width=2.1)
                tag=self.pill(f"S{i+1} + D{j+1}",3.4).move_to([2.60,ey,0])
                self.play(Create(branch),FadeIn(tag,shift=RIGHT*.10),
                          run_time=RUN_NORMAL)
                total+=1
        assert total == 6
        formula=self.math(r"3\times2=6",62).move_to(DOWN*2.40)
        self.play(Write(formula),run_time=RUN_SLOW)
        self.pause_line("The product agrees with all six completed tree paths.",3)

    def multi_stage(self) -> None:
        self.step(7, "WEEK 03 — THREE SUCCESSIVE CHOICES",
                  "Two options, then three options, then two options: twelve routes.")
        ys_two=[1.42,-1.42]
        ys_six=[2.21,1.43,.65,-.65,-1.43,-2.21]
        ys_twelve=[2.42-i*.44 for i in range(12)]
        root=Dot([-6.25,0,0],radius=.08,color=BLACK_LINE)
        self.add(root)
        lines=VGroup()
        first=[]
        for y in ys_two:
            x=[-3.75,y,0]
            edge=Line(root.get_center(),x,stroke_width=2.35,color=BLACK_LINE)
            lines.add(edge)
            first.append(x)
            self.play(Create(edge),run_time=.52)
        second=[]
        for i,p in enumerate(first):
            for j in range(3):
                pos=[-.76,ys_six[3*i+j],0]
                edge=Line(p,pos,stroke_width=2.0,color=BLACK_LINE)
                lines.add(edge)
                second.append(pos)
                self.play(Create(edge),run_time=.32)
        ends=VGroup()
        for i,p in enumerate(second):
            for j in range(2):
                dest=[2.70,ys_twelve[2*i+j],0]
                edge=Line(p,dest,stroke_width=1.75,color=BLACK_LINE)
                dot=Dot(dest,radius=.053,color=BLACK_LINE)
                lines.add(edge)
                ends.add(dot)
                self.play(Create(edge),FadeIn(dot),run_time=.20)
        group=VGroup(lines,ends)
        self.assert_content_safe(group,"three stage tree")
        labels=VGroup(self.text("2",31,BOLD).move_to([-4.5,2.27,0]),
                      self.text("3",31,BOLD).move_to([-1.7,2.27,0]),
                      self.text("2",31,BOLD).move_to([1.52,2.27,0]))
        self.play(LaggedStart(*[FadeIn(x) for x in labels],lag_ratio=.2))
        total=self.math(r"2\times3\times2=12",54).move_to([5.03,-.15,0])
        self.fit(total,4.45,1.0)
        self.play(Write(total),run_time=RUN_SLOW)
        self.pause_line("Every additional stage multiplies the available paths.",3)

    def order_matters(self) -> None:
        self.step(8, "WEEK 04 — DOES THE ORDER MATTER?",
                  "Assign first and second place: A then B differs from B then A.")
        first=self.tile("FIRST",width=4.7,height=1.25)
        second=self.tile("SECOND",width=4.7,height=1.25)
        first.move_to([-3.38,1.40,0])
        second.move_to([3.38,1.40,0])
        a=self.pill("A",2.02).move_to([-3.38,-.15,0])
        b=self.pill("B",2.02).move_to([3.38,-.15,0])
        self.play(FadeIn(first),FadeIn(second))
        self.play(FadeIn(a,shift=UP*.2),FadeIn(b,shift=UP*.2))
        eq1=self.math(r"AB",60).move_to(DOWN*2.18)
        self.play(Write(eq1))
        pa=a.get_center().copy()
        pb=b.get_center().copy()
        self.play(a.animate.move_to(pb+UP*.45),
                  b.animate.move_to(pa+DOWN*.45),run_time=RUN_SLOW)
        self.play(a.animate.move_to(pb),b.animate.move_to(pa),
                  run_time=RUN_SLOW)
        eq2=self.math(r"AB\ne BA",60).move_to(DOWN*2.18)
        self.play(ReplacementTransform(eq1,eq2),run_time=RUN_SLOW)
        self.pause_line("The same two people can form TWO different arrangements.",3)

    def permutations(self) -> None:
        self.step(9, "WEEK 04 — INTRODUCTION TO PERMUTATIONS",
                  "Place three different objects in order, without repetition.")
        counts=(3,2,1)
        slots=VGroup(*[self.tile(str(n),"CHOICES",width=3.5,height=1.53)
                       for n in counts]).arrange(RIGHT,buff=.38)
        slots.move_to(UP*1.05)
        self.assert_content_safe(slots,"permutation slots")
        for s in slots:
            self.play(FadeIn(s,shift=DOWN*.20),run_time=RUN_NORMAL)
        equation=self.math(r"3!=3\times2\times1=6",55).move_to(DOWN*.40)
        self.play(Write(equation),run_time=RUN_SLOW)
        outcomes=VGroup(*[self.pill(p,2.00) for p in PERMUTATIONS_3])
        outcomes.arrange(RIGHT,buff=.21).move_to(DOWN*2.17)
        self.assert_content_safe(outcomes,"six ordered outcomes")
        self.play(LaggedStart(*[FadeIn(p,shift=UP*.11) for p in outcomes],
                              lag_ratio=.12),run_time=2.8)
        self.pause_line("The order changes the arrangement: six distinct results.",3)

    def later_preview(self) -> None:
        self.step(10, "LATER IN QUARTER 1 — PREVIEW ONLY",
                  "The planner mentions these topics without assigning class dates.")
        left=self.tile("COMBINATIONS","When order does NOT matter.",
                       width=6.63,height=1.50,size=33)
        right=self.tile("ADVANCED PERMUTATIONS","More positions and restrictions.",
                        width=6.63,height=1.50,size=32)
        pair=VGroup(left,right).arrange(RIGHT,buff=.38).move_to(UP*1.38)
        self.assert_content_safe(pair,"later topic cards")
        self.play(FadeIn(left,shift=RIGHT*.2),FadeIn(right,shift=LEFT*.2))
        a=self.pill("A + B",2.76).move_to([-3.05,-.28,0])
        b=self.pill("B + A",2.76).move_to([3.05,-.28,0])
        self.play(FadeIn(a),FadeIn(b))
        eq=self.math(r"\{A,B\}=\{B,A\}",51).move_to(DOWN*1.62)
        self.play(Write(eq),run_time=RUN_SLOW)
        self.pause_line("Preview: teams can ignore order; rankings cannot.",4)

    def connections(self) -> None:
        self.step(11, "HOW THESE COUNTING TOOLS CONNECT",
                  "Each method helps verify or simplify a different kind of choice.")
        stages=(
            ("01", "LIST","Check each outcome"),
            ("02", "TABLE / TREE","Visualize all paths"),
            ("03", "PRODUCT","Count the stages"),
            ("04", "PERMUTATION","Order matters"),
        )
        cards=VGroup(*[
            self.tile(f"{n}  {name}",desc,width=6.8,height=1.67,size=30)
            for n,name,desc in stages
        ]).arrange_in_grid(rows=2,cols=2,buff=(.29,.36)).move_to(DOWN*.16)
        self.assert_content_safe(cards,"method map")
        for c in cards:
            self.play(FadeIn(c,shift=RIGHT*.13),run_time=RUN_NORMAL)
            self.wait(.55)
        self.pause_line("First organize; then choose the correct counting method.",3)

    def exit_ticket(self) -> None:
        self.step(12, "YOUR CHECKPOINT — EXPLAIN THE REASONING",
                  "Pause and discuss the question with a partner before counting.")
        questions=(
            "1. Why must every outcome appear only once?",
            "2. When can we multiply the number of choices?",
            "3. Why are AB and BA different in a ranking?",
        )
        cards=VGroup(*[self.tile(q,width=13.4,height=1.13,size=30)
                       for q in questions]).arrange(DOWN,buff=.31).move_to(DOWN*.15)
        self.assert_content_safe(cards,"course questions")
        for item in cards:
            self.play(FadeIn(item,shift=RIGHT*.12),run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)
        self.pause_line("These four dated lessons form the verified start of Q1.",3)
        # Do not clear before closing: the stock closing fades the visible stage.
        self.standard_closing("Systematic counting makes every choice visible.")
