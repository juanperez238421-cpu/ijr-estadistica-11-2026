#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Statistics 11, Quarter 1, Week 01 — 19–22 January 2027.

PRIMARY TOPIC: Introduction to Counting Problems.
Official reference: Statistics_11_2027_P1.docx, class 1 / Week 1.

Scene objectives:
  (1) Recognize simple counting situations.
  (2) List outcomes without missing/repeating cases.
  (3) Represent the same outcomes in a table and a simple tree.
  (4) Explain/verify the counting procedure in writing.

Fundamental Counting Principle (formal multiplication) belongs to WEEK 02;
three-stage choice problems belong to WEEK 03, and permutations to WEEK 04.

Use the consolidated JP classroom library (ManimCE 0.20.x):
  manim -pql stat11_week01_2027_native.py Statistics11Week01Native
  manim -pqh stat11_week01_2027_v2.py Statistics11Week01Native

Runtime control: environment variable LESSON_TIME_SCALE=0.3 for QA.
"""
from __future__ import annotations
import itertools
import numpy as np
from library.jp_classroom_style import *

PENCILS = ('A', 'B')
NOTEBOOKS = ('1', '2', '3')
OUTCOMES = [f'{p} + {n}' for p, n in itertools.product(PENCILS, NOTEBOOKS)]
PRACTICE_SHIRTS = ('Black', 'White')
PRACTICE_JACKETS = ('Denim', 'Leather')


class Statistics11Week01Native(JPMathClassroomScene):
    """Native Manim version: large typography and continuous elementary motion."""

    def validate_lesson_data(self) -> None:
        assert len(OUTCOMES) == 6
        assert len(set(OUTCOMES)) == 6
        assert OUTCOMES == ['A + 1', 'A + 2', 'A + 3', 'B + 1', 'B + 2', 'B + 3']
        assert len(list(itertools.product(PRACTICE_SHIRTS, PRACTICE_JACKETS))) == 4
        assert len(set(PRACTICE_SHIRTS)) == 2

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
        self.exit_ticket()

    # ----------------------------- Visual system -----------------------------
    def step(self, number: int, title: str, subtitle: str) -> None:
        """Large high-contrast local header, replacing the small default sizes."""
        self.clear_stage(keep_header=False)
        number_rect = RoundedRectangle(width=0.83, height=0.62, corner_radius=0.11,
                                       color=BLACK_LINE, stroke_width=2.2)
        number_txt = self.text(f'{number:02d}', 31, BOLD).move_to(number_rect)
        title_mob = self.text(title, 47, BOLD)
        self.fit(title_mob, 13.5, 0.77)
        title_row = VGroup(VGroup(number_rect, number_txt), title_mob).arrange(RIGHT, buff=0.32)
        title_row.move_to([0, 3.64, 0]).align_to(LEFT * 7.30, LEFT)
        underline = Line(LEFT * 7.40, RIGHT * 7.40, stroke_color=LIGHT_GRAY,
                         stroke_width=2.2).move_to(UP * 3.13)
        subtitle_mob = self.text(subtitle, 26)
        self.fit(subtitle_mob, 14.65, 0.50)
        subtitle_mob.move_to([0, 2.80, 0]).align_to(LEFT * 7.28, LEFT)
        self.header_group = VGroup(title_row, underline)
        self.subtitle_group = subtitle_mob
        self.play(FadeIn(self.header_group, shift=DOWN * 0.08),
                  FadeIn(subtitle_mob), run_time=RUN_QUICK)

    def card(self, label: str, subtitle: str = '', width: float = 3.9,
             height: float = 1.55) -> VGroup:
        box = RoundedRectangle(width=width, height=height,
                               corner_radius=0.14, color=BLACK_LINE,
                               fill_color=WHITE_FILL, fill_opacity=1,
                               stroke_width=2.0)
        title = self.text(label, 34, BOLD)
        subtitle_obj = self.text(subtitle, 24) if subtitle else None
        content = VGroup(title, subtitle_obj) if subtitle_obj else VGroup(title)
        content.arrange(DOWN, buff=0.18)
        self.fit(content, width-0.35, height-0.30)
        content.move_to(box)
        return VGroup(box, content)

    def outcome_chip(self, name: str, width: float = 3.12) -> VGroup:
        chip = RoundedRectangle(width=width, height=0.72,
                                corner_radius=0.14, color=BLACK_LINE,
                                stroke_width=1.9, fill_color=PAPER_GRAY,
                                fill_opacity=1)
        text = self.text(name, 29, BOLD).move_to(chip)
        return VGroup(chip, text)

    def show_pause(self, text: str, duration: float = 5) -> None:
        caption = self.text(text, 27, BOLD)
        self.fit(caption, 14.0, 0.5)
        caption.move_to(DOWN * 3.46)
        self.play(FadeIn(caption, shift=UP * 0.08), run_time=RUN_QUICK)
        self.wait(duration)
        self.play(FadeOut(caption), run_time=RUN_QUICK)

    # ------------------------------- Sections --------------------------------
    def opening(self) -> None:
        self.standard_opening(
            'STATISTICS 11   |   Q1   |   WEEK 01',
            'HOW MANY POSSIBILITIES?',
            'Introduction to Counting Problems',
            'Recognize. Organize. Represent. Verify. Explain.',
        )

    def choices(self) -> None:
        self.step(1, 'A SCHOOL SUPPLY CHOICE', 'Choose ONE pencil and ONE notebook.')
        left_title = self.text('PENCILS', 30, BOLD).move_to([-3.82, 1.98, 0])
        right_title = self.text('NOTEBOOKS', 30, BOLD).move_to([3.72, 1.98, 0])
        pencils = VGroup(*[self.card(f'Pencil {p}', width=4.2, height=1.50)
                           for p in PENCILS]).arrange(DOWN, buff=0.22)
        notebooks = VGroup(*[self.card(f'Notebook {n}', width=4.2, height=1.10)
                             for n in NOTEBOOKS]).arrange(DOWN, buff=0.17)
        pencils.move_to([-3.82, -0.02, 0])
        notebooks.move_to([3.75, 0.00, 0])
        self.assert_content_safe(VGroup(pencils, notebooks), 'choice cards')
        self.play(Write(left_title), Write(right_title))
        for item in pencils:
            self.play(FadeIn(item, shift=RIGHT*0.20), run_time=RUN_NORMAL)
        for item in notebooks:
            self.play(FadeIn(item, shift=LEFT*0.22), run_time=RUN_NORMAL)
        self.show_pause('What counts as ONE different result?', 4.0)

    def guess(self) -> None:
        self.step(2, 'CAN WE TRUST A QUICK GUESS?',
                  'An unorganized list may repeat one result and miss another.')
        guessed = ['A + 1', 'B + 3', 'A + 2', 'A + 1', 'B + 1']
        positions = [LEFT*4.6+UP*1.20, RIGHT*2.45+UP*0.82,
                     LEFT*0.9+DOWN*0.2, RIGHT*4.25+DOWN*1.45,
                     LEFT*4.25+DOWN*2.00]
        chips = VGroup()
        for name, pos in zip(guessed, positions):
            chip = self.outcome_chip(name).move_to(pos)
            chips.add(chip)
            self.play(FadeIn(chip, shift=UP*0.16), run_time=RUN_QUICK)
        outline = SurroundingRectangle(chips[3], color=BLACK_LINE,
                                       buff=0.10, stroke_width=3.2)
        self.play(Create(outline))
        self.show_pause('Which result appears twice? Which result is missing?', 5)

    def complete_list(self) -> None:
        self.step(3, 'BUILD AN ORGANIZED LIST',
                  'Finish every notebook option for pencil A, then repeat for B.')
        headers = VGroup(self.text('PENCIL A', 33, BOLD),
                         self.text('PENCIL B', 33, BOLD))
        headers[0].move_to(LEFT*3.45+UP*2.04)
        headers[1].move_to(RIGHT*3.38+UP*2.04)
        self.play(*[Write(h) for h in headers])
        for j,p in enumerate(PENCILS):
            for k,n in enumerate(NOTEBOOKS):
                c = self.outcome_chip(f'{p} + Notebook {n}', 5.55)
                c.move_to([(j*2-1)*3.47, 1.03-k*1.12, 0])
                self.assert_content_safe(c, 'list chip')
                self.play(FadeIn(c, shift=DOWN*0.16), run_time=RUN_NORMAL)
                self.wait(PAUSE_SHORT)
        self.show_pause('Six DISTINCT outcomes. Each one appears exactly once.', 4)

    def table(self) -> None:
        self.step(4, 'ORGANIZE THE SAME DATA IN A TABLE',
                  'Rows represent pencils; columns represent notebooks.')
        table = self.build_table(
            headers=('Pencil', 'Notebook 1', 'Notebook 2', 'Notebook 3'),
            body_rows=(('A', 'A + 1', 'A + 2', 'A + 3'),
                       ('B', 'B + 1', 'B + 2', 'B + 3')),
            column_widths=(2.90, 3.10, 3.10, 3.10),
            row_height=1.20, header_height=1.07,
            header_font_size=30, body_font_size=31,
        )
        table.group.move_to(DOWN*0.03)
        self.assert_content_safe(table.group, '2x3 table')
        self.animate_table_rows(table, include_header=True, pause=PAUSE_READ)
        self.play(self.shade_cells(table, [(1,1),(1,2),(1,3),(2,1),(2,2),(2,3)]))
        self.show_pause('Check every cell: one cell = one unique pair.', 4)

    def tree(self) -> None:
        self.step(5, 'BUILD A TREE: FOLLOW EVERY PATH',
                  'Start -> choose a pencil -> choose a notebook -> record the pair.')
        origin=LEFT*6.57+DOWN*0.52
        pencil_points=[LEFT*2.64+UP*1.03, LEFT*2.64+DOWN*1.65]
        leaf_y=[[1.73,0.91,0.09],[-1.27,-2.09,-2.91]]
        labels=VGroup()
        root=Dot(origin,color=BLACK_LINE,radius=.095)
        self.play(FadeIn(root))
        for j,p in enumerate(PENCILS):
            pn=Dot(pencil_points[j],radius=.095,color=BLACK_LINE)
            link=Line(origin,pencil_points[j],stroke_width=3,color=BLACK_LINE)
            self.play(Create(link), FadeIn(pn),run_time=RUN_NORMAL)
            name=self.text(f'Pencil {p}', 29, BOLD).next_to(pn,UP,buff=.12)
            self.play(FadeIn(name),run_time=RUN_QUICK)
            for k,n in enumerate(NOTEBOOKS):
                leaf=RIGHT*1.72+UP*leaf_y[j][k]
                link2=Line(pencil_points[j],leaf,color=BLACK_LINE,stroke_width=2.6)
                path=Dot(pencil_points[j],radius=.065,color=BLACK_LINE)
                self.add(path)
                self.play(Create(link2), MoveAlongPath(path,link2),run_time=RUN_NORMAL)
                self.remove(path)
                label=self.outcome_chip(f'{p} + {n}',width=2.64)
                label.move_to(leaf+RIGHT*2.12)
                labels.add(label)
                self.assert_content_safe(label, 'tree leaf label')
                self.play(FadeIn(label,scale=.90),run_time=RUN_QUICK)
                self.wait(PAUSE_SHORT)
        self.show_pause('Count six completed paths: every endpoint is different.', 4)

    def compare(self) -> None:
        self.step(6, 'THREE REPRESENTATIONS — ONE RESULT',
                  'The list, table, and tree should represent exactly the same outcomes.')
        names=('ORGANIZED LIST','TWO-WAY TABLE','TREE DIAGRAM')
        notes=('Six pairs in groups','One result per cell','One result per leaf')
        cards=VGroup(*[self.card(a,b,width=4.65,height=2.65)
                       for a,b in zip(names,notes)])
        cards.arrange(RIGHT,buff=.22).move_to(UP*.10)
        self.assert_content_safe(cards,'comparison cards')
        self.play(LaggedStart(*[FadeIn(c, shift=UP*.10) for c in cards],lag_ratio=.25))
        self.show_pause('Verification: no omissions and no repetitions.', 5)

    def find_error(self) -> None:
        self.step(7, 'SPOT THE ERROR',
                  'Find the repeated pair, then identify the missing one.')
        wrong=('A + 1','A + 2','A + 3','B + 1','B + 1','B + 2')
        group=VGroup(*[self.outcome_chip(x,width=4.45) for x in wrong])
        group.arrange_in_grid(rows=3, cols=2, buff=(.56,.54))
        group.move_to(UP*.12)
        self.assert_content_safe(group,'error grid')
        for chip in group:
            self.play(FadeIn(chip),run_time=RUN_QUICK)
        self.show_pause('Pause: circle the duplicate and fix your list.', 5)
        duplicate=SurroundingRectangle(group[4],color=BLACK_LINE,buff=.12,stroke_width=3)
        corrected=self.outcome_chip('B + 3',width=4.45).move_to(group[4])
        self.play(Create(duplicate),run_time=RUN_QUICK)
        self.play(FadeOut(duplicate),ReplacementTransform(group[4], corrected),run_time=RUN_NORMAL)
        self.show_pause('Correct: B + 3 replaces the second B + 1.', 3)

    def practice(self) -> None:
        self.step(8, 'YOUR TURN — PAIR WORK',
                  'Two shirts and two jackets: make a complete organized list.')
        a=self.card('SHIRTS','Black  |  White',width=6.1,height=2.55)
        b=self.card('JACKETS','Denim  |  Leather',width=6.1,height=2.55)
        cards=VGroup(a,b).arrange(RIGHT,buff=.35).move_to(UP*.26)
        self.assert_content_safe(cards,'practice cards')
        self.play(FadeIn(a,shift=RIGHT*.1),FadeIn(b,shift=LEFT*.1))
        self.show_pause('Work with a partner. Explain how you checked your answer.', 8)
        answers=['Black + Denim','Black + Leather','White + Denim','White + Leather']
        groups=VGroup(*[self.outcome_chip(x,width=6.18) for x in answers])
        groups.arrange_in_grid(rows=2,cols=2,buff=(.20,.18)).move_to(DOWN*.5)
        self.play(FadeOut(cards))
        for item in groups:self.play(FadeIn(item,shift=UP*.08),run_time=RUN_QUICK)
        self.show_pause('Four outcomes, without omissions or repetitions.', 3)

    def written_reasoning(self) -> None:
        self.step(9, 'WRITE A SHORT JUSTIFICATION',
                  'Another student should be able to reproduce your counting.')
        statements=(
            '1. I listed the first choices.',
            '2. I paired each with all second choices.',
            '3. I checked for missing or repeated outcomes.',
            '4. I counted every different result once.',
        )
        v=VGroup(*[self.card(statement,width=13.3,height=.97) for statement in statements])
        v.arrange(DOWN,buff=.24).move_to(DOWN*.20)
        self.assert_content_safe(v,'reasoning steps')
        for c in v:
            self.play(FadeIn(c,shift=RIGHT*.12),run_time=RUN_NORMAL)
            self.wait(PAUSE_SHORT)
        self.show_pause('What evidence shows that your list is complete?', 4)

    def exit_ticket(self) -> None:
        self.step(10, 'EXIT TICKET: THREE CHECKS',
                  'Assess your method, not only the numerical answer.')
        questions=(
            'Can you recognize a counting situation?',
            'Can you list every outcome exactly once?',
            'Can you draw and explain a small tree?',
        )
        panels=VGroup(*[self.card(q,width=13.6,height=1.12) for q in questions])
        panels.arrange(DOWN,buff=.32).move_to(UP*.02)
        self.assert_content_safe(panels,'exit ticket')
        for p in panels:
            self.play(FadeIn(p,shift=UP*.10),run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)
        self.show_pause('Next week: from a complete tree to the multiplication rule.', 5)
        # standard_closing handles FadeOut of the remaining objects.
        self.standard_closing('Every outcome once. Every choice justified.')