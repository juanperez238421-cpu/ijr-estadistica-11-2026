#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Statistics 11 — Comparison Operators in Python / Google Colab.
V4 senior classroom rebuild using the JP ManimCE classroom protocol.
Target: Manim Community Edition 0.20.1.
"""
from __future__ import annotations
from library.jp_classroom_style import *

SCORES = [4.2, 2.8, 3.0, 4.5, 3.7]
PASS_MARK = 3.0


class Stat11ComparisonsV4(JPMathClassroomScene):
    """Large-type, stable-layout, step-by-step comparison operators lesson."""

    def validate_lesson_data(self) -> None:
        assert SCORES == [4.2, 2.8, 3.0, 4.5, 3.7]
        assert SCORES[0] >= PASS_MARK
        assert SCORES[1] < PASS_MARK
        assert SCORES[2] == PASS_MARK
        assert SCORES[3] > SCORES[1]
        assert (SCORES[0] != 4.2) is False

    def code(self, s: str, size: int = 34, weight=MEDIUM) -> Text:
        return self.text(s, size, weight, font="Noto Sans Mono")

    def cell(self, lines, width=11.4, height=None, size=34, execution="[ ]") -> VGroup:
        code = VGroup(*[self.code(line, size) for line in lines])
        code.arrange(DOWN, aligned_edge=LEFT, buff=0.19)
        h = height or max(1.55, code.height + 0.72)
        box = RoundedRectangle(width=width, height=h, corner_radius=0.12,
            stroke_color=BLACK_LINE, stroke_width=2, fill_color=PAPER_GRAY, fill_opacity=1)
        circle = Circle(radius=0.23, stroke_color=BLACK_LINE, stroke_width=2,
            fill_color=WHITE, fill_opacity=1)
        tri = Triangle(stroke_color=BLACK_LINE, fill_color=BLACK_LINE,
            fill_opacity=1).scale(0.078).rotate(-PI/2)
        run = VGroup(circle, tri)
        count = self.code(execution, 17)
        gutter = VGroup(run, count).arrange(DOWN, buff=0.16)
        gutter.move_to(box.get_left() + RIGHT*0.48)
        self.fit(code, width-1.45, h-0.40)
        code.move_to(box).align_to(box, LEFT).shift(RIGHT*1.05)
        return VGroup(box, gutter, code)

    def play_cell(self, cell: VGroup, run_no: int, line_time=0.95) -> None:
        self.play(Create(cell[0]), FadeIn(cell[1]), run_time=RUN_NORMAL)
        for line in cell[2]:
            self.play(Write(line, rate_func=linear), run_time=line_time)
            self.wait(0.28)
        new_count = self.code(f"[{run_no}]", 17).move_to(cell[1][1])
        self.play(Indicate(cell[1][0], color=BLACK, scale_factor=1.13), run_time=0.48)
        self.play(Transform(cell[1][1], new_count), run_time=0.35)
        self.wait(PAUSE_SHORT)

    def output(self, result: str, note: str, width=6.2) -> VGroup:
        r = self.code(result, 36, BOLD)
        n = self.text(note, 24, MEDIUM)
        self.fit(n, width-0.55, 0.65)
        content = VGroup(r, n).arrange(DOWN, buff=0.16)
        box = RoundedRectangle(width=width, height=max(1.15, content.height+0.50),
            corner_radius=0.12, stroke_color=BLACK_LINE, stroke_width=2,
            fill_color=WHITE, fill_opacity=1)
        content.move_to(box)
        return VGroup(box, content)

    def reveal(self, card: VGroup, pause=PAUSE_EXPLAIN) -> None:
        self.play(Create(card[0]), run_time=RUN_QUICK)
        self.play(Write(card[1][0]), FadeIn(card[1][1], shift=UP*0.08), run_time=RUN_NORMAL)
        self.wait(pause)

    def value_card(self, label: str, value: str) -> VGroup:
        content = VGroup(self.text(label, 25, BOLD), self.code(value, 42, BOLD))
        content.arrange(DOWN, buff=0.14)
        box = RoundedRectangle(width=3.35, height=1.45, corner_radius=0.12,
            stroke_color=BLACK_LINE, stroke_width=2, fill_color=WHITE, fill_opacity=1)
        content.move_to(box)
        return VGroup(box, content)

    def banner(self, text: str) -> VGroup:
        q = self.text(text, 31, BOLD)
        self.fit(q, 12.6, 0.72)
        box = RoundedRectangle(width=13.4, height=1.08, corner_radius=0.12,
            stroke_color=BLACK_LINE, stroke_width=1.8, fill_color=WHITE, fill_opacity=1)
        q.move_to(box)
        return VGroup(box, q)

    def op_card(self, symbol: str, name: str, example: str) -> VGroup:
        content = VGroup(self.code(symbol, 42, BOLD), self.text(name, 24, BOLD), self.code(example, 25))
        content.arrange(DOWN, buff=0.12)
        self.fit(content, 3.95, 1.72)
        box = RoundedRectangle(width=4.35, height=2.08, corner_radius=0.12,
            stroke_color=BLACK_LINE, stroke_width=1.8, fill_color=WHITE, fill_opacity=1)
        content.move_to(box)
        return VGroup(box, content)

    def step_rail(self, labels) -> VGroup:
        cards = VGroup()
        n = len(labels)
        width = 13.4
        cw = (width - 0.26*(n-1))/n
        for i, label in enumerate(labels, start=1):
            badge = RoundedRectangle(width=0.54, height=0.48, corner_radius=0.08,
                stroke_color=BLACK_LINE, stroke_width=1.5,
                fill_color=VERY_LIGHT_GRAY, fill_opacity=1)
            num = self.text(str(i), 18, BOLD).move_to(badge)
            body = self.text(label, 22, BOLD)
            content = VGroup(VGroup(badge, num), body).arrange(RIGHT, buff=0.16)
            self.fit(content, cw-0.28, 0.68)
            box = RoundedRectangle(width=cw, height=0.96, corner_radius=0.10,
                stroke_color=BLACK_LINE, stroke_width=1.6, fill_color=WHITE, fill_opacity=1)
            content.move_to(box)
            cards.add(VGroup(box, content))
        cards.arrange(RIGHT, buff=0.26)
        return cards

    def score_strip(self) -> VGroup:
        cells = VGroup()
        for i, value in enumerate(SCORES):
            box = RoundedRectangle(width=1.75, height=1.05, corner_radius=0.08,
                stroke_color=BLACK_LINE, stroke_width=1.9, fill_color=WHITE, fill_opacity=1)
            val = self.code(str(value), 31, BOLD).move_to(box)
            idx = self.code(str(i), 18).next_to(box, DOWN, buff=0.08)
            cells.add(VGroup(box, val, idx))
        cells.arrange(RIGHT, buff=0.16)
        label = self.code("scores", 31, BOLD).next_to(cells, LEFT, buff=0.42)
        return VGroup(label, cells)

    def construct(self) -> None:
        self.standard_opening(
            "STATISTICS 11 · PYTHON / COLAB",
            "COMPARISON OPERATORS",
            "Turn a data question into a True / False result",
            "READ DATA  →  ASK  →  COMPARE  →  RUN  →  INTERPRET",
        )
        self.question_to_code()
        self.colab_cycle()
        self.assignment_vs_equality()
        self.operators_one()
        self.operators_two()
        self.boolean_data()
        self.list_comparison()
        self.workshop()
        self.summary()

    def question_to_code(self) -> None:
        self.set_header(1, "START WITH A DATA QUESTION",
            "A comparison operator turns a relationship between values into a result Python can evaluate.")
        values = VGroup(self.value_card("observed score", "4.2"), self.value_card("pass mark", "3.0"))
        values.arrange(RIGHT, buff=0.75).move_to(UP*0.72)
        self.assert_content_safe(values, "values")
        self.play(FadeIn(values[0], shift=UP*0.12), run_time=RUN_NORMAL)
        self.wait(PAUSE_SHORT)
        self.play(FadeIn(values[1], shift=UP*0.12), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)
        q = self.banner("Did the observed score reach the pass mark?").move_to(DOWN*0.58)
        self.assert_content_safe(q, "question")
        self.play(Create(q[0]), Write(q[1]), run_time=RUN_SLOW)
        self.wait(PAUSE_EXPLAIN)
        expression = self.code("score >= 3.0", 42, BOLD).move_to(DOWN*1.86)
        self.play(Write(expression), run_time=RUN_SLOW)
        self.wait(PAUSE_READ)
        out = self.output("True", "Yes — 4.2 is at least 3.0.", 5.8).move_to(DOWN*3.05)
        self.assert_content_safe(out, "question output")
        self.reveal(out, PAUSE_WORK)
        self.clear_stage()

    def colab_cycle(self) -> None:
        self.set_header(2, "THE COLAB CYCLE",
            "Use one readable cell: write the code, run it, read the output, then interpret the result.")
        rail = self.step_rail(["WRITE", "RUN", "OUTPUT", "INTERPRET"]).move_to(UP*1.28)
        self.assert_content_safe(rail, "cycle rail")
        self.play(LaggedStart(*[FadeIn(x, shift=UP*0.08) for x in rail], lag_ratio=0.16), run_time=RUN_SLOW)
        self.wait(PAUSE_READ)
        c = self.cell(["score = 4.2", "score >= 3.0"], 11.6, 2.15, 36).move_to(DOWN*0.52)
        self.assert_content_safe(c, "cycle cell")
        self.play_cell(c, 1, 1.05)
        out = self.output("True", "The relationship is satisfied.", 6.0).move_to(DOWN*2.75)
        self.assert_content_safe(out, "cycle output")
        self.reveal(out, PAUSE_WORK)
        self.clear_stage()

    def assignment_vs_equality(self) -> None:
        self.set_header(3, "DO NOT CONFUSE  =  WITH  ==",
            "Assignment stores a value. Equality asks whether two values are the same.")
        left = self.note_panel("=  ASSIGNMENT", ["Stores a value.", "score = 4.2"],
            width=6.35, title_size=30, body_size=29, max_text_height=1.9)
        right = self.note_panel("==  EQUALITY TEST", ["Asks a question.", "score == 4.2  →  True"],
            width=6.35, title_size=30, body_size=29, max_text_height=1.9)
        pair = VGroup(left, right).arrange(RIGHT, buff=0.58).move_to(UP*0.45)
        self.assert_content_safe(pair, "assignment pair")
        self.play(FadeIn(left[0]), Write(left[1][0]), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[Write(x) for x in left[1][1]], lag_ratio=0.2), run_time=RUN_SLOW)
        self.wait(PAUSE_EXPLAIN)
        self.play(FadeIn(right[0]), Write(right[1][0]), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[Write(x) for x in right[1][1]], lag_ratio=0.2), run_time=RUN_SLOW)
        self.wait(PAUSE_EXPLAIN)
        rule = self.note_panel("REMEMBER", ["= stores", "== compares"], width=5.2,
            title_size=28, body_size=30, max_text_height=1.7).move_to(DOWN*2.05)
        self.assert_content_safe(rule, "assignment reminder")
        self.play(FadeIn(rule[0]), Write(rule[1][0]), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[Write(x) for x in rule[1][1]], lag_ratio=0.25), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def operators_one(self) -> None:
        self.set_header(4, "COMPARISON OPERATORS · PART 1",
            "Read the expression from left to right and decide whether the statement is True or False.")
        cards = VGroup(
            self.op_card(">", "greater than", "4.2 > 3.0"),
            self.op_card("<", "less than", "2.8 < 3.0"),
            self.op_card(">=", "greater or equal", "3.0 >= 3.0"),
        ).arrange(RIGHT, buff=0.42).move_to(UP*0.15)
        self.assert_content_safe(cards, "operators 1")
        for card in cards:
            self.play(FadeIn(card[0], shift=UP*0.08), run_time=RUN_QUICK)
            self.play(Write(card[1][0]), FadeIn(card[1][1]), Write(card[1][2]), run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)
        out = self.output("True · True · True", "The values make all three statements true.", 8.2).move_to(DOWN*2.10)
        self.assert_content_safe(out, "operators 1 output")
        self.reveal(out, PAUSE_WORK)
        self.clear_stage()

    def operators_two(self) -> None:
        self.set_header(5, "COMPARISON OPERATORS · PART 2",
            "Equality uses ==. Not-equal uses an exclamation mark followed by one equal sign.")
        cards = VGroup(
            self.op_card("<=", "less or equal", "2.8 <= 3.0"),
            self.op_card("==", "equal to", "3.0 == 3.0"),
            self.op_card("!=", "not equal to", "4.2 != 3.0"),
        ).arrange(RIGHT, buff=0.42).move_to(UP*0.15)
        self.assert_content_safe(cards, "operators 2")
        for card in cards:
            self.play(FadeIn(card[0], shift=UP*0.08), run_time=RUN_QUICK)
            self.play(Write(card[1][0]), FadeIn(card[1][1]), Write(card[1][2]), run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)
        rule = self.note_panel("READ THE SYMBOLS", ["== asks: equal?", "!= asks: different?"],
            width=6.6, title_size=28, body_size=29, max_text_height=1.7).move_to(DOWN*2.05)
        self.assert_content_safe(rule, "operators 2 rule")
        self.play(FadeIn(rule[0]), Write(rule[1][0]), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[Write(x) for x in rule[1][1]], lag_ratio=0.25), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def boolean_data(self) -> None:
        self.set_header(6, "A COMPARISON PRODUCES BOOLEAN DATA",
            "True and False are values. Python calls this data type bool.")
        c = self.cell(["score = 4.2", "passed = score >= 3.0", "print(passed)", "print(type(passed).__name__)"],
            12.2, 3.25, 31).move_to(UP*0.15)
        self.assert_content_safe(c, "boolean cell")
        self.play_cell(c, 2, 0.88)
        out = self.output("True    bool", "The comparison result can be stored in a variable.", 8.3).move_to(DOWN*2.55)
        self.assert_content_safe(out, "boolean output")
        self.reveal(out, PAUSE_WORK)
        self.clear_stage()

    def list_comparison(self) -> None:
        self.set_header(7, "COMPARE VALUES INSIDE A LIST",
            "Select observations with their indexes first. Then compare the selected values.")
        strip = self.score_strip().move_to(UP*1.10)
        self.assert_content_safe(strip, "score strip")
        self.play(Write(strip[0]), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[FadeIn(x, shift=UP*0.08) for x in strip[1]], lag_ratio=0.13), run_time=RUN_SLOW)
        self.wait(PAUSE_EXPLAIN)
        h3 = SurroundingRectangle(strip[1][3], color=BLACK_LINE, stroke_width=3, buff=0.08)
        h1 = SurroundingRectangle(strip[1][1], color=BLACK_LINE, stroke_width=3, buff=0.08)
        labels = VGroup(self.code("scores[3] = 4.5", 29, BOLD), self.code("scores[1] = 2.8", 29, BOLD))
        labels.arrange(RIGHT, buff=1.1).move_to(DOWN*0.35)
        self.play(Create(h3), Write(labels[0]), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)
        self.play(Create(h1), Write(labels[1]), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)
        expr = self.code("scores[3] > scores[1]", 38, BOLD).move_to(DOWN*1.55)
        sub = self.code("4.5 > 2.8", 34).next_to(expr, DOWN, buff=0.28)
        self.play(Write(expr), run_time=RUN_SLOW)
        self.play(FadeIn(sub, shift=UP*0.08), run_time=RUN_NORMAL)
        out = self.output("True", "4.5 is greater than 2.8.", 5.8).move_to(DOWN*3.08)
        self.assert_content_safe(out, "list output")
        self.reveal(out, PAUSE_WORK)
        self.clear_stage()

    def workshop(self) -> None:
        items = [
            (8, "WORKSHOP 1 · PASS MARK", "Is the second score below 3.0?", "scores[1] < 3.0", "True", "2.8 is below 3.0."),
            (9, "WORKSHOP 2 · EQUALITY", "Is the third score exactly 3.0?", "scores[2] == 3.0", "True", "3.0 equals 3.0."),
            (10, "WORKSHOP 3 · NOT EQUAL", "Is the first score different from 4.2?", "scores[0] != 4.2", "False", "The first score is exactly 4.2."),
        ]
        run_no = 3
        for sec, title, question, expression, result, interpretation in items:
            self.set_header(sec, title, "Predict first. Run only after you have chosen True or False.")
            q = self.banner(question).move_to(UP*1.20)
            self.assert_content_safe(q, f"{title} question")
            self.play(Create(q[0]), Write(q[1]), run_time=RUN_SLOW)
            self.wait(PAUSE_EXPLAIN)
            pred = self.text("PREDICT:   True   or   False ?", 35, BOLD).move_to(UP*0.10)
            self.play(Write(pred), run_time=RUN_NORMAL)
            self.wait(PAUSE_WORK)
            self.play(FadeOut(pred), run_time=RUN_QUICK)
            c = self.cell([expression], 10.8, 1.65, 38).move_to(DOWN*0.70)
            self.assert_content_safe(c, f"{title} cell")
            self.play_cell(c, run_no, 1.15)
            run_no += 1
            out = self.output(result, interpretation, 6.7).move_to(DOWN*2.65)
            self.assert_content_safe(out, f"{title} output")
            self.reveal(out, PAUSE_WORK)
            self.clear_stage()

    def summary(self) -> None:
        self.set_header(11, "TAKEAWAY",
            "Correct syntax matters, but every True or False result must also be interpreted in the data context.")
        rail = self.step_rail(["READ VALUES", "ASK", "COMPARE", "RUN", "INTERPRET"]).move_to(UP*1.15)
        self.assert_content_safe(rail, "summary rail")
        self.play(LaggedStart(*[FadeIn(x, shift=UP*0.08) for x in rail], lag_ratio=0.14), run_time=RUN_SLOW)
        self.wait(PAUSE_READ)
        c = self.cell(["score = 4.2", "passed = score >= 3.0", "passed"], 10.8, 2.50, 32).move_to(DOWN*0.75)
        self.assert_content_safe(c, "summary cell")
        self.play(Create(c[0]), FadeIn(c[1]), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[Write(line) for line in c[2]], lag_ratio=0.20), run_time=RUN_SLOW)
        out = self.output("True", "The score reached the pass mark.", 6.1).move_to(DOWN*2.85)
        self.assert_content_safe(out, "summary output")
        self.reveal(out, PAUSE_SUMMARY)
        self.standard_closing("COMPARISONS LET PYTHON ANSWER PRECISE QUESTIONS ABOUT DATA.")
