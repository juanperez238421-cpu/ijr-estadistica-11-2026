#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Statistics 11 — Comparison Operators in Python / Google Colab.
V5 senior QA rebuild: Colab-faithful interface, executable notebook state,
literal multiline output, and projection-safe classroom layout.
Target: Manim Community Edition 0.20.1.
"""
from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve()
V4_SRC = HERE.parents[2] / "stat11_comparisons_v4" / "src"
sys.path.insert(0, str(V4_SRC))

from stat11_comparisons_v4 import Stat11ComparisonsV4, SCORES, PASS_MARK
from library.jp_classroom_style import *

COLAB_NOTEBOOK_TITLE = "Statistics11_Comparisons.ipynb"


class Stat11ComparisonsV5(Stat11ComparisonsV4):
    """V5: executable sequence + recognizable, projection-safe Colab notebook UI."""

    def validate_lesson_data(self) -> None:
        """QA gate: every displayed Colab cell works in the shown run order."""
        namespace = {}
        exec("score = 4.2", {}, namespace)
        assert eval("score >= 3.0", {}, namespace) is True

        exec("passed = score >= 3.0", {}, namespace)
        assert namespace["passed"] is True
        assert type(namespace["passed"]).__name__ == "bool"

        exec("scores = [4.2, 2.8, 3.0, 4.5, 3.7]", {}, namespace)
        assert namespace["scores"] == SCORES
        assert eval("scores[3] > scores[1]", {}, namespace) is True
        assert eval("scores[1] < 3.0", {}, namespace) is True
        assert eval("scores[2] == 3.0", {}, namespace) is True
        assert eval("scores[0] != 4.2", {}, namespace) is False

    def cell(self, lines, width=11.4, height=None, size=34, execution="[ ]") -> VGroup:
        """Projection-safe approximation of a modern Google Colab code cell."""
        code = VGroup(*[self.code(line, size) for line in lines])
        code.arrange(DOWN, aligned_edge=LEFT, buff=0.19)
        h = height or max(1.48, code.height + 0.66)

        box = RoundedRectangle(
            width=width, height=h, corner_radius=0.10,
            stroke_color=BLACK_LINE, stroke_width=1.6,
            fill_color=PAPER_GRAY, fill_opacity=1,
        )
        selection = Line(
            box.get_corner(UL) + DOWN*0.06,
            box.get_corner(DL) + UP*0.06,
            stroke_color=BLACK_LINE, stroke_width=3.2,
        )
        circle = Circle(
            radius=0.22, stroke_color=BLACK_LINE, stroke_width=1.8,
            fill_color=WHITE, fill_opacity=1,
        )
        tri = Triangle(
            stroke_color=BLACK_LINE, fill_color=BLACK_LINE, fill_opacity=1,
        ).scale(0.072).rotate(-PI/2)
        run = VGroup(circle, tri)

        count = self.code(execution, 16)
        gutter = VGroup(run, count).arrange(DOWN, buff=0.12)
        gutter.move_to(box.get_left() + RIGHT*0.43)

        self.fit(code, width-1.40, h-0.34)
        code.move_to(box).align_to(box, LEFT).shift(RIGHT*1.00)
        return VGroup(VGroup(box, selection), gutter, code)

    def colab_bar(self, notebook_title=COLAB_NOTEBOOK_TITLE, width=13.25) -> VGroup:
        """Compact Colab chrome enlarged for a classroom projector."""
        outer = RoundedRectangle(
            width=width, height=1.08, corner_radius=0.10,
            stroke_color=BLACK_LINE, stroke_width=1.4,
            fill_color=WHITE, fill_opacity=1,
        )
        brand = self.text("Colab", 24, BOLD)
        title = self.text(notebook_title, 22, MEDIUM)
        self.fit(title, 5.2, 0.34)

        connected = self.text("Connected", 15, BOLD)
        pill = RoundedRectangle(
            width=max(1.55, connected.width + 0.38), height=0.38,
            corner_radius=0.16, stroke_color=BLACK_LINE, stroke_width=1.2,
            fill_color=VERY_LIGHT_GRAY, fill_opacity=1,
        )
        connected.move_to(pill)
        top = VGroup(brand, title, VGroup(pill, connected)).arrange(RIGHT, buff=0.32)
        self.fit(top, width-0.52, 0.40)
        top.move_to(outer.get_center() + UP*0.23)

        menus = self.text("File   Edit   View   Insert   Runtime   Tools   Help", 14, MEDIUM)
        actions = self.text("+ Code     + Text     Run all", 16, BOLD)
        bottom = VGroup(menus, actions).arrange(RIGHT, buff=0.55)
        self.fit(bottom, width-0.52, 0.30)
        bottom.move_to(outer.get_center() + DOWN*0.26)

        divider = Line(
            outer.get_left() + RIGHT*0.18,
            outer.get_right() + LEFT*0.18,
            stroke_color=VERY_LIGHT_GRAY, stroke_width=1.0,
        ).move_to(outer.get_center() + DOWN*0.01)
        return VGroup(outer, divider, top, bottom)

    def colab_output(self, lines, width=10.8, size=30) -> VGroup:
        """Literal notebook output; separate print() calls stay on separate lines."""
        texts = VGroup(*[self.code(str(line), size, MEDIUM) for line in lines])
        texts.arrange(DOWN, aligned_edge=LEFT, buff=0.10)
        self.fit(texts, width-1.20, 1.20)
        guide_h = max(0.58, texts.height + 0.28)
        guide = Line(
            UP*(guide_h/2), DOWN*(guide_h/2),
            stroke_color=VERY_LIGHT_GRAY, stroke_width=2.0,
        )
        output = VGroup(guide, texts).arrange(RIGHT, buff=0.30, aligned_edge=UP)
        spacer = Rectangle(width=width, height=guide_h, stroke_opacity=0, fill_opacity=0)
        output.move_to(spacer).align_to(spacer, LEFT).shift(RIGHT*0.78)
        return VGroup(spacer, output)

    def interpretation(self, text, width=7.0) -> VGroup:
        return self.note_panel(
            "INTERPRETATION", [text],
            width=width, title_size=24, body_size=24, max_text_height=0.95,
        )

    def construct(self) -> None:
        self.validate_lesson_data()
        self.standard_opening(
            "STATISTICS 11 · PYTHON / GOOGLE COLAB",
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

    def colab_cycle(self) -> None:
        self.set_header(
            2, "INSIDE GOOGLE COLAB",
            "Menus and notebook actions stay above executable code cells; output appears underneath.",
        )
        bar = self.colab_bar().move_to(UP*1.45)
        self.assert_content_safe(bar, "colab toolbar")
        self.play(FadeIn(bar, shift=UP*0.08), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)

        c = self.cell(["score = 4.2", "score >= 3.0"], 11.6, 1.95, 34).move_to(DOWN*0.12)
        self.assert_content_safe(c, "colab code cell")
        self.play_cell(c, 1, 1.00)

        out = self.colab_output(["True"], 10.9, 31).move_to(DOWN*1.55)
        self.assert_content_safe(out, "colab literal output")
        self.play(FadeIn(out, shift=UP*0.06), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)

        note = self.interpretation("4.2 reached the pass mark of 3.0.", 7.1).move_to(DOWN*2.90)
        self.assert_content_safe(note, "colab interpretation")
        self.play(FadeIn(note[0]), Write(note[1][0]), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[Write(x) for x in note[1][1]], lag_ratio=0.18), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def operators_one(self) -> None:
        self.set_header(
            4, "COMPARISON OPERATORS · PART 1",
            "Read each expression from left to right and decide whether the statement is True or False.",
        )
        cards = VGroup(
            self.op_card(">", "greater than", "4.2 > 3.0"),
            self.op_card("<", "less than", "2.8 < 3.0"),
            self.op_card(">=", "greater than or equal to", "3.0 >= 3.0"),
        ).arrange(RIGHT, buff=0.42).move_to(UP*0.15)
        self.assert_content_safe(cards, "operators 1")
        for card in cards:
            self.play(FadeIn(card[0], shift=UP*0.08), run_time=RUN_QUICK)
            self.play(Write(card[1][0]), FadeIn(card[1][1]), Write(card[1][2]), run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)
        out = self.output("True · True · True", "All three relationships are satisfied.", 8.2).move_to(DOWN*2.10)
        self.assert_content_safe(out, "operators 1 output")
        self.reveal(out, PAUSE_WORK)
        self.clear_stage()

    def operators_two(self) -> None:
        self.set_header(
            5, "COMPARISON OPERATORS · PART 2",
            "Equality uses ==. Not-equal uses an exclamation mark followed by one equal sign.",
        )
        cards = VGroup(
            self.op_card("<=", "less than or equal to", "2.8 <= 3.0"),
            self.op_card("==", "equal to", "3.0 == 3.0"),
            self.op_card("!=", "not equal to", "4.2 != 3.0"),
        ).arrange(RIGHT, buff=0.42).move_to(UP*0.15)
        self.assert_content_safe(cards, "operators 2")
        for card in cards:
            self.play(FadeIn(card[0], shift=UP*0.08), run_time=RUN_QUICK)
            self.play(Write(card[1][0]), FadeIn(card[1][1]), Write(card[1][2]), run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)
        rule = self.note_panel(
            "READ THE SYMBOLS", ["== asks: equal?", "!= asks: different?"],
            width=6.6, title_size=28, body_size=29, max_text_height=1.7,
        ).move_to(DOWN*2.05)
        self.assert_content_safe(rule, "operators 2 rule")
        self.play(FadeIn(rule[0]), Write(rule[1][0]), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[Write(x) for x in rule[1][1]], lag_ratio=0.25), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def boolean_data(self) -> None:
        self.set_header(
            6, "A COMPARISON PRODUCES BOOLEAN DATA",
            "Each print() call appears on its own Colab output line. Python calls True / False values bool.",
        )
        bar = self.colab_bar().move_to(UP*1.55)
        self.assert_content_safe(bar, "boolean colab toolbar")
        self.play(FadeIn(bar), run_time=RUN_NORMAL)

        c = self.cell(
            [
                "score = 4.2",
                "passed = score >= 3.0",
                "print(passed)",
                "print(type(passed).__name__)",
            ],
            11.7, 2.46, 27,
        ).move_to(DOWN*0.34)
        self.assert_content_safe(c, "boolean cell")
        self.play_cell(c, 2, 0.78)

        out = self.colab_output(["True", "bool"], 10.9, 29).move_to(DOWN*1.92)
        self.assert_content_safe(out, "boolean multiline output")
        self.play(FadeIn(out, shift=UP*0.06), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)

        note = self.interpretation("The comparison result can be stored and reused as data.", 7.4).move_to(DOWN*2.98)
        self.assert_content_safe(note, "boolean interpretation")
        self.play(FadeIn(note[0]), Write(note[1][0]), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[Write(x) for x in note[1][1]], lag_ratio=0.18), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def list_comparison(self) -> None:
        self.set_header(
            7, "DEFINE THE LIST BEFORE YOU COMPARE",
            "Notebook state matters: run the cell that creates scores before using scores[index].",
        )
        bar = self.colab_bar().move_to(UP*1.55)
        self.assert_content_safe(bar, "list colab toolbar")
        self.play(FadeIn(bar), run_time=RUN_NORMAL)

        setup = self.cell(
            ["scores = [4.2, 2.8, 3.0, 4.5, 3.7]"],
            11.7, 1.48, 30,
        ).move_to(UP*0.18)
        self.assert_content_safe(setup, "scores setup cell")
        self.play_cell(setup, 3, 0.95)

        self.play(FadeOut(setup), FadeOut(bar), run_time=RUN_QUICK)
        strip = self.score_strip().move_to(UP*0.95)
        self.assert_content_safe(strip, "score strip")
        self.play(Write(strip[0]), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[FadeIn(x, shift=UP*0.08) for x in strip[1]], lag_ratio=0.12), run_time=RUN_SLOW)
        self.wait(PAUSE_READ)

        h3 = SurroundingRectangle(strip[1][3], color=BLACK_LINE, stroke_width=3, buff=0.08)
        h1 = SurroundingRectangle(strip[1][1], color=BLACK_LINE, stroke_width=3, buff=0.08)
        self.play(Create(h3), Create(h1), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)

        compare = self.cell(["scores[3] > scores[1]"], 10.5, 1.45, 34).move_to(DOWN*0.70)
        self.assert_content_safe(compare, "indexed comparison cell")
        self.play_cell(compare, 4, 1.05)

        out = self.colab_output(["True"], 9.7, 30).move_to(DOWN*1.76)
        self.play(FadeIn(out, shift=UP*0.06), run_time=RUN_NORMAL)
        note = self.interpretation(
            "Index 3 is 4.5 and index 1 is 2.8, so 4.5 > 2.8.", 8.1
        ).move_to(DOWN*2.82)
        self.assert_content_safe(note, "indexed comparison interpretation")
        self.play(FadeIn(note[0]), Write(note[1][0]), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[Write(x) for x in note[1][1]], lag_ratio=0.16), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def workshop(self) -> None:
        items = [
            (8, "WORKSHOP 1 · PASS MARK", "Is the second score below 3.0?", "scores[1] < 3.0", "True", "2.8 is below 3.0."),
            (9, "WORKSHOP 2 · EQUALITY", "Is the third score exactly 3.0?", "scores[2] == 3.0", "True", "3.0 equals 3.0."),
            (10, "WORKSHOP 3 · NOT EQUAL", "Is the first score different from 4.2?", "scores[0] != 4.2", "False", "False is valid: the first score is exactly 4.2."),
        ]
        run_no = 5
        for sec, title, question, expression, result, interpretation in items:
            self.set_header(sec, title, "Predict first. The scores list is already defined in notebook state.")
            q = self.banner(question).move_to(UP*1.15)
            self.assert_content_safe(q, f"{title} question")
            self.play(Create(q[0]), Write(q[1]), run_time=RUN_SLOW)
            self.wait(PAUSE_EXPLAIN)

            pred = self.text("PREDICT:   True   or   False ?", 34, BOLD).move_to(UP*0.08)
            self.play(Write(pred), run_time=RUN_NORMAL)
            self.wait(PAUSE_WORK)
            self.play(FadeOut(pred), run_time=RUN_QUICK)

            c = self.cell([expression], 10.8, 1.48, 35).move_to(DOWN*0.74)
            self.assert_content_safe(c, f"{title} cell")
            self.play_cell(c, run_no, 1.05)
            run_no += 1

            out = self.colab_output([result], 9.8, 31).move_to(DOWN*1.84)
            self.assert_content_safe(out, f"{title} literal output")
            self.play(FadeIn(out, shift=UP*0.06), run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)

            note = self.interpretation(interpretation, 8.3).move_to(DOWN*2.92)
            self.assert_content_safe(note, f"{title} interpretation")
            self.play(FadeIn(note[0]), Write(note[1][0]), run_time=RUN_NORMAL)
            self.play(LaggedStart(*[Write(x) for x in note[1][1]], lag_ratio=0.16), run_time=RUN_NORMAL)
            self.wait(PAUSE_WORK)
            self.clear_stage()

    def summary(self) -> None:
        self.set_header(
            11, "TAKEAWAY",
            "Correct syntax matters, notebook state matters, and every Boolean result must be interpreted in context.",
        )
        rail = self.step_rail(["DEFINE DATA", "ASK", "COMPARE", "RUN", "INTERPRET"]).move_to(UP*1.15)
        self.assert_content_safe(rail, "summary rail")
        self.play(LaggedStart(*[FadeIn(x, shift=UP*0.08) for x in rail], lag_ratio=0.14), run_time=RUN_SLOW)
        self.wait(PAUSE_READ)

        c = self.cell(["scores[2] == 3.0"], 10.6, 1.48, 34).move_to(DOWN*0.42)
        self.assert_content_safe(c, "summary cell")
        self.play_cell(c, 8, 1.05)

        out = self.colab_output(["True"], 9.7, 31).move_to(DOWN*1.52)
        self.assert_content_safe(out, "summary literal output")
        self.play(FadeIn(out, shift=UP*0.06), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)

        note = self.interpretation("The third score is exactly the pass mark: 3.0.", 7.7).move_to(DOWN*2.72)
        self.assert_content_safe(note, "summary interpretation")
        self.play(FadeIn(note[0]), Write(note[1][0]), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[Write(x) for x in note[1][1]], lag_ratio=0.18), run_time=RUN_NORMAL)
        self.wait(PAUSE_SUMMARY)
        self.standard_closing("COMPARISONS LET PYTHON ANSWER PRECISE QUESTIONS ABOUT DATA.")
