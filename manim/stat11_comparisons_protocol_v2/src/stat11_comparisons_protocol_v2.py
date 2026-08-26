#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Statistics 11 — Comparison operators in Google Colab.

Protocol-aligned classroom scene.

Visual contract
---------------
- JP classroom style: white background, black text, neutral gray hierarchy.
- 1920x1080, 16:9, 30 fps.
- Persistent numbered headers and subtitles.
- Large projection-safe typography and explicit content-zone checks.
- One idea at a time; meaningful waits after each construction.
- Colab-inspired notebook layout is simplified and monochrome so it remains
  consistent with the classroom protocol rather than becoming a UI mockup.

Pedagogical route
-----------------
SHOW THE DATA FIRST -> ASK THE QUESTION -> WRITE THE COMPARISON -> RUN ->
READ TRUE/FALSE -> INTERPRET THE DATA.

Target: Manim Community Edition 0.20.1
"""

from __future__ import annotations

from library.jp_classroom_style import *


SCORES = [4.2, 2.8, 3.0, 4.5, 3.7]
PASS_MARK = 3.0
A_VALUE = 12
B_VALUE = 18


class Stat11ComparisonsProtocolV2(JPMathClassroomScene):
    """Full protocol-based lesson on Python comparison operators in Colab."""

    def validate_lesson_data(self) -> None:
        assert SCORES == [4.2, 2.8, 3.0, 4.5, 3.7]
        assert PASS_MARK == 3.0
        assert (SCORES[0] >= PASS_MARK) is True
        assert (SCORES[1] < PASS_MARK) is True
        assert (SCORES[2] == PASS_MARK) is True
        assert (SCORES[3] > SCORES[1]) is True
        assert (A_VALUE < B_VALUE) is True
        assert (A_VALUE != B_VALUE) is True

    def mono(self, content: str, size: int = 25, weight=MEDIUM) -> Text:
        return self.text(content, size, weight, font="DejaVu Sans Mono")

    def colab_shell(self, title: str, *, width: float = 14.25, height: float = 5.25) -> VGroup:
        outer = RoundedRectangle(width=width, height=height, corner_radius=0.14, stroke_color=BLACK_LINE, stroke_width=1.8, fill_color=WHITE_FILL, fill_opacity=1.0)
        notebook_name = self.text(title, 23, BOLD)
        notebook_name.move_to(outer.get_top() + DOWN * 0.34)
        notebook_name.align_to(outer, LEFT).shift(RIGHT * 0.58)
        connect_box = RoundedRectangle(width=1.50, height=0.44, corner_radius=0.16, stroke_color=BLACK_LINE, stroke_width=1.5, fill_color=WHITE_FILL, fill_opacity=1.0)
        connect_text = self.text("Connect", 16, BOLD).move_to(connect_box)
        connect = VGroup(connect_box, connect_text)
        connect.move_to(outer.get_top() + DOWN * 0.34)
        connect.align_to(outer, RIGHT).shift(LEFT * 0.48)
        menus = VGroup(*[self.text(label, 15, MEDIUM) for label in ["File", "Edit", "View", "Insert", "Runtime", "Tools", "Help"]])
        menus.arrange(RIGHT, buff=0.30)
        menus.next_to(notebook_name, DOWN, aligned_edge=LEFT, buff=0.14)
        code_btn_box = RoundedRectangle(width=1.08, height=0.38, corner_radius=0.10, stroke_color=LIGHT_GRAY, stroke_width=1.3, fill_color=PAPER_GRAY, fill_opacity=1.0)
        code_btn_text = self.text("+ Code", 15, BOLD).move_to(code_btn_box)
        code_btn = VGroup(code_btn_box, code_btn_text)
        text_btn_box = RoundedRectangle(width=1.06, height=0.38, corner_radius=0.10, stroke_color=LIGHT_GRAY, stroke_width=1.3, fill_color=PAPER_GRAY, fill_opacity=1.0)
        text_btn_text = self.text("+ Text", 15, BOLD).move_to(text_btn_box)
        text_btn = VGroup(text_btn_box, text_btn_text)
        toolbar = VGroup(code_btn, text_btn).arrange(RIGHT, buff=0.14)
        toolbar.next_to(menus, DOWN, aligned_edge=LEFT, buff=0.12)
        divider = Line(outer.get_left() + RIGHT * 0.22, outer.get_right() + LEFT * 0.22, color=LIGHT_GRAY, stroke_width=1.4)
        divider.set_y(toolbar.get_bottom()[1] - 0.15)
        rail = VGroup()
        for symbol in ["≡", "□", "{}"]:
            box = RoundedRectangle(width=0.52, height=0.46, corner_radius=0.08, stroke_color=LIGHT_GRAY, stroke_width=1.1, fill_color=WHITE_FILL, fill_opacity=1.0)
            txt = self.text(symbol, 16, BOLD).move_to(box)
            rail.add(VGroup(box, txt))
        rail.arrange(DOWN, buff=0.14)
        rail.move_to(outer.get_left() + RIGHT * 0.42 + DOWN * 0.55)
        return VGroup(outer, notebook_name, connect, menus, toolbar, divider, rail)

    def code_cell(self, lines: list[str], *, width: float = 9.60, min_height: float = 1.55, line_size: int = 25, exec_label: str = "[ ]") -> VGroup:
        line_mobs = VGroup(*[self.mono(line, line_size) for line in lines])
        line_mobs.arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        self.fit(line_mobs, width - 1.42, 3.20)
        height = max(min_height, line_mobs.height + 0.58)
        box = RoundedRectangle(width=width, height=height, corner_radius=0.10, stroke_color=LIGHT_GRAY, stroke_width=1.6, fill_color=VERY_LIGHT_GRAY, fill_opacity=0.58)
        run_circle = Circle(radius=0.19, stroke_color=BLACK_LINE, stroke_width=1.6, fill_color=WHITE_FILL, fill_opacity=1.0)
        run_triangle = Triangle(stroke_color=BLACK_LINE, stroke_width=1.2, fill_color=BLACK_LINE, fill_opacity=1.0).scale(0.064).rotate(-PI / 2)
        run_icon = VGroup(run_circle, run_triangle)
        count = self.mono(exec_label, 15, MEDIUM)
        gutter = VGroup(run_icon, count).arrange(DOWN, buff=0.13)
        gutter.move_to(box.get_left() + RIGHT * 0.46)
        line_mobs.move_to(box)
        line_mobs.align_to(box, LEFT).shift(RIGHT * 1.02)
        return VGroup(box, gutter, line_mobs)

    def output_block(self, lines: list[str], *, width: float = 7.0, line_size: int = 25) -> VGroup:
        text_group = VGroup(*[self.mono(line, line_size) for line in lines])
        text_group.arrange(DOWN, aligned_edge=LEFT, buff=0.12)
        self.fit(text_group, width - 0.55, 1.55)
        box = RoundedRectangle(width=width, height=max(0.72, text_group.height + 0.38), corner_radius=0.08, stroke_color=LIGHT_GRAY, stroke_width=1.25, fill_color=WHITE_FILL, fill_opacity=1.0)
        text_group.move_to(box)
        text_group.align_to(box, LEFT).shift(RIGHT * 0.25)
        return VGroup(box, text_group)

    def type_cell(self, cell: VGroup, *, line_time: float = 1.10, zoom_width: float | None = None) -> None:
        box, gutter, lines = cell
        self.play(Create(box), FadeIn(gutter), run_time=RUN_NORMAL)
        if zoom_width is not None:
            persistent = [x for x in (self.header_group, self.subtitle_group) if x is not None]
            if persistent:
                self.play(*[FadeOut(x) for x in persistent], run_time=RUN_QUICK)
            self.camera.frame.save_state()
            self.play(self.camera.frame.animate.set(width=max(zoom_width, cell.width + 0.9)).move_to(cell), run_time=RUN_CAMERA)
        for line in lines:
            self.play(Write(line, rate_func=linear), run_time=line_time)
            self.wait(0.32)
        if zoom_width is not None:
            self.play(Restore(self.camera.frame), run_time=RUN_CAMERA)
            persistent = [x for x in (self.header_group, self.subtitle_group) if x is not None]
            if persistent:
                self.play(*[FadeIn(x) for x in persistent], run_time=RUN_QUICK)

    def execute_cell(self, cell: VGroup, number: int) -> None:
        run_icon = cell[1][0]
        old_count = cell[1][1]
        new_count = self.mono(f"[{number}]", 15, MEDIUM).move_to(old_count)
        self.play(Indicate(run_icon, color=BLACK, scale_factor=1.18), run_time=0.55)
        self.play(Transform(old_count, new_count), run_time=0.38)
        self.wait(PAUSE_SHORT)

    def reveal_output(self, output: VGroup, *, pause: float = PAUSE_READ) -> None:
        self.play(Create(output[0]), run_time=RUN_QUICK)
        self.play(LaggedStart(*[Write(line) for line in output[1]], lag_ratio=0.18), run_time=RUN_NORMAL)
        self.wait(pause)

    def data_card(self, label: str, value: str, *, width: float = 2.75) -> VGroup:
        label_mob = self.text(label, 20, BOLD)
        value_mob = self.mono(value, 30, BOLD)
        content = VGroup(label_mob, value_mob).arrange(DOWN, buff=0.12)
        box = RoundedRectangle(width=width, height=1.18, corner_radius=0.12, stroke_color=BLACK_LINE, stroke_width=1.7, fill_color=WHITE_FILL, fill_opacity=1.0)
        content.move_to(box)
        return VGroup(box, content)

    def result_badge(self, result: str, *, width: float = 2.25) -> VGroup:
        box = RoundedRectangle(width=width, height=0.74, corner_radius=0.12, stroke_color=BLACK_LINE, stroke_width=1.7, fill_color=PAPER_GRAY, fill_opacity=1.0)
        text = self.mono(result, 28, BOLD).move_to(box)
        return VGroup(box, text)

    def operator_card(self, symbol: str, name: str, example: str, result: str) -> VGroup:
        symbol_mob = self.mono(symbol, 32, BOLD)
        name_mob = self.text(name, 19, BOLD)
        example_mob = self.mono(example, 18, MEDIUM)
        result_mob = self.mono(result, 18, BOLD)
        content = VGroup(symbol_mob, name_mob, example_mob, result_mob)
        content.arrange(DOWN, buff=0.07)
        box = RoundedRectangle(width=4.15, height=1.63, corner_radius=0.12, stroke_color=LIGHT_GRAY, stroke_width=1.45, fill_color=WHITE_FILL, fill_opacity=1.0)
        content.move_to(box)
        return VGroup(box, content)

    def score_strip(self) -> VGroup:
        boxes = VGroup()
        values = VGroup()
        indices = VGroup()
        for index, value in enumerate(SCORES):
            box = RoundedRectangle(width=1.23, height=0.82, corner_radius=0.08, stroke_color=BLACK_LINE, stroke_width=1.55, fill_color=WHITE_FILL, fill_opacity=1.0)
            val = self.mono(str(value), 25, BOLD).move_to(box)
            idx = self.mono(str(index), 16, MEDIUM).next_to(box, DOWN, buff=0.08)
            boxes.add(box); values.add(val); indices.add(idx)
        boxes.arrange(RIGHT, buff=0.11)
        for index, box in enumerate(boxes):
            values[index].move_to(box)
            indices[index].next_to(box, DOWN, buff=0.08)
        name = self.mono("scores", 26, BOLD)
        name.next_to(boxes, LEFT, buff=0.30)
        arrow = Arrow(name.get_right(), boxes.get_left(), buff=0.07, stroke_width=1.8, color=BLACK_LINE)
        return VGroup(name, arrow, boxes, values, indices)

    def prediction_panel(self, number: int, question: str, code: str) -> VGroup:
        badge = RoundedRectangle(width=0.58, height=0.52, corner_radius=0.08, stroke_color=BLACK_LINE, stroke_width=1.5, fill_color=WHITE_FILL, fill_opacity=1.0)
        badge_text = self.text(str(number), 21, BOLD).move_to(badge)
        q = self.text(question, 23, BOLD)
        c = self.mono(code, 24, MEDIUM)
        content = VGroup(VGroup(badge, badge_text), VGroup(q, c).arrange(DOWN, aligned_edge=LEFT, buff=0.14))
        content.arrange(RIGHT, buff=0.28)
        box = RoundedRectangle(width=12.6, height=1.48, corner_radius=0.12, stroke_color=LIGHT_GRAY, stroke_width=1.5, fill_color=WHITE_FILL, fill_opacity=1.0)
        content.move_to(box)
        content.align_to(box, LEFT).shift(RIGHT * 0.34)
        return VGroup(box, content)

    def construct(self) -> None:
        self.opening(); self.interface_and_first_question(); self.assignment_vs_equality(); self.operator_family(); self.boolean_result_is_data(); self.compare_values_from_a_list(); self.guided_practice(); self.summary()

    def opening(self) -> None:
        self.standard_opening("STATISTICS 11 · PYTHON / COLAB", "COMPARISON OPERATORS", "Ask a data question and obtain True or False", "DATA → QUESTION → COMPARISON → RUN → INTERPRET")

    def interface_and_first_question(self) -> None:
        self.set_header(1, "FROM DATA TO A QUESTION", "Start with the values. Only then translate the statistical question into Python.")
        score_card = self.data_card("observed score", "4.2"); mark_card = self.data_card("pass mark", "3.0")
        cards = VGroup(score_card, mark_card).arrange(RIGHT, buff=0.70).move_to(DOWN * 0.28)
        self.assert_content_safe(cards, "data cards")
        self.play(LaggedStart(FadeIn(score_card, shift=UP * 0.12), FadeIn(mark_card, shift=UP * 0.12), lag_ratio=0.30), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        question = self.text("Question: Did the score reach the pass mark?", 31, BOLD).next_to(cards, DOWN, buff=0.58)
        self.fit(question, 13.8, 0.62); self.play(Write(question), run_time=RUN_SLOW); self.wait(PAUSE_EXPLAIN)
        relation = self.mono("4.2  ≥  3.0", 39, BOLD).next_to(question, DOWN, buff=0.45)
        self.play(FadeIn(relation, shift=UP * 0.12), run_time=RUN_NORMAL); self.wait(PAUSE_READ)
        result = self.result_badge("True").next_to(relation, RIGHT, buff=0.48)
        self.play(Create(result[0]), Write(result[1]), run_time=RUN_NORMAL); self.wait(PAUSE_WORK); self.clear_stage()

        self.set_header(2, "THE COLAB WORKFLOW", "Write code in a cell, run it, then read the output below the cell.")
        shell = self.colab_shell("Statistics11_Comparisons.ipynb").move_to(DOWN * 0.62)
        self.assert_content_safe(shell, "colab shell")
        self.play(Create(shell[0]), run_time=RUN_NORMAL); self.play(FadeIn(shell[1]), FadeIn(shell[2]), run_time=RUN_QUICK)
        self.play(FadeIn(shell[3]), FadeIn(shell[4]), Create(shell[5]), FadeIn(shell[6]), run_time=RUN_NORMAL); self.wait(PAUSE_READ)
        cell = self.code_cell(["score = 4.2", "score >= 3.0"], width=9.4, line_size=26, min_height=1.74).move_to(DOWN * 0.60 + RIGHT * 0.35)
        self.type_cell(cell, line_time=1.25, zoom_width=10.8); self.execute_cell(cell, 1)
        output = self.output_block(["True"], width=4.3, line_size=27).next_to(cell, DOWN, aligned_edge=LEFT, buff=0.22)
        self.reveal_output(output, pause=PAUSE_EXPLAIN)
        run_label = self.text("RUN", 18, BOLD).next_to(cell[1][0], LEFT, buff=0.18); output_label = self.text("OUTPUT", 18, BOLD).next_to(output, RIGHT, buff=0.22)
        self.play(FadeIn(run_label), FadeIn(output_label), run_time=RUN_QUICK); self.wait(PAUSE_WORK); self.clear_stage()

    def assignment_vs_equality(self) -> None:
        self.set_header(3, "A CRITICAL DIFFERENCE:  =  VS  ==", "Assignment stores a value. Equality asks whether two values are the same.")
        left_title = self.text("STORE A VALUE", 25, BOLD); left_code = self.mono("score = 4.2", 32, BOLD); left_note = self.text("The variable score now contains 4.2", 21)
        left_content = VGroup(left_title, left_code, left_note).arrange(DOWN, buff=0.24)
        left_box = RoundedRectangle(width=6.30, height=2.55, corner_radius=0.12, stroke_color=BLACK_LINE, stroke_width=1.7, fill_color=WHITE_FILL, fill_opacity=1.0); left_content.move_to(left_box); left = VGroup(left_box, left_content)
        right_title = self.text("ASK A QUESTION", 25, BOLD); right_code = self.mono("score == 4.2", 32, BOLD); right_result = self.result_badge("True", width=1.95)
        right_content = VGroup(right_title, right_code, right_result).arrange(DOWN, buff=0.20)
        right_box = RoundedRectangle(width=6.30, height=2.55, corner_radius=0.12, stroke_color=BLACK_LINE, stroke_width=1.7, fill_color=WHITE_FILL, fill_opacity=1.0); right_content.move_to(right_box); right = VGroup(right_box, right_content)
        pair = VGroup(left, right).arrange(RIGHT, buff=0.58).move_to(DOWN * 0.45); self.assert_content_safe(pair, "assignment equality")
        self.play(Create(left_box), run_time=RUN_QUICK); self.play(Write(left_title), run_time=RUN_NORMAL); self.play(Write(left_code, rate_func=linear), run_time=1.25); self.play(FadeIn(left_note), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN); self.focus_on(left_code, width=7.3, pause=PAUSE_READ)
        self.play(Create(right_box), run_time=RUN_QUICK); self.play(Write(right_title), run_time=RUN_NORMAL); self.play(Write(right_code, rate_func=linear), run_time=1.25); self.play(Create(right_result[0]), Write(right_result[1]), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN); self.focus_on(right_code, width=7.3, pause=PAUSE_READ)
        warning = self.text("Do not use = when you mean 'is equal to?'", 27, BOLD).next_to(pair, DOWN, buff=0.48)
        self.play(Write(warning), run_time=RUN_SLOW); self.wait(PAUSE_WORK); self.clear_stage()

    def operator_family(self) -> None:
        self.set_header(4, "THE SIX COMPARISON OPERATORS", "Every comparison evaluates a statement and produces one Boolean result: True or False.")
        specs = [(">", "greater than", "4.2 > 3.0", "True"), ("<", "less than", "2.8 < 3.0", "True"), (">=", "greater or equal", "3.0 >= 3.0", "True"), ("<=", "less or equal", "2.8 <= 3.0", "True"), ("==", "equal to", "3.0 == 3.0", "True"), ("!=", "not equal to", "4.2 != 3.0", "True")]
        cards = VGroup(*[self.operator_card(*spec) for spec in specs]); cards.arrange_in_grid(rows=2, cols=3, buff=(0.38, 0.34)); cards.move_to(DOWN * 0.48); self.assert_content_safe(cards, "operator grid")
        for index, card in enumerate(cards):
            self.play(FadeIn(card[0]), run_time=0.45); self.play(Write(card[1][0]), run_time=0.55); self.play(FadeIn(card[1][1]), Write(card[1][2]), run_time=0.72); self.play(Write(card[1][3]), run_time=0.45); self.wait(0.72)
            if index in (1, 3, 5): self.wait(PAUSE_SHORT)
        self.wait(PAUSE_EXPLAIN); self.play(Indicate(cards[4], color=BLACK, scale_factor=1.04), run_time=RUN_NORMAL); self.play(Indicate(cards[5], color=BLACK, scale_factor=1.04), run_time=RUN_NORMAL)
        note = self.text("== asks 'equal?'     ·     != asks 'different?'", 27, BOLD).next_to(cards, DOWN, buff=0.32)
        self.play(Write(note), run_time=RUN_SLOW); self.wait(PAUSE_WORK); self.clear_stage()

    def boolean_result_is_data(self) -> None:
        self.set_header(5, "TRUE AND FALSE ARE DATA TOO", "Python stores comparison results using the Boolean data type: bool.")
        cell = self.code_cell(["score = 4.2", "passed = score >= 3.0", "print(passed)", "print(type(passed).__name__)"], width=11.2, line_size=25, min_height=2.55).move_to(DOWN * 0.30)
        self.assert_content_safe(cell, "boolean code"); self.type_cell(cell, line_time=1.05, zoom_width=12.3); self.execute_cell(cell, 2)
        output = self.output_block(["True", "bool"], width=4.7, line_size=26).next_to(cell, DOWN, aligned_edge=LEFT, buff=0.24); self.reveal_output(output, pause=PAUSE_EXPLAIN)
        chain = VGroup(self.text("comparison", 24, BOLD), Arrow(LEFT * 0.45, RIGHT * 0.45, color=BLACK_LINE, stroke_width=1.8), self.text("Boolean value", 24, BOLD), Arrow(LEFT * 0.45, RIGHT * 0.45, color=BLACK_LINE, stroke_width=1.8), self.mono("True / False", 25, BOLD)).arrange(RIGHT, buff=0.24)
        chain.next_to(output, RIGHT, buff=0.55); self.fit(chain, 8.0, 0.8); self.play(LaggedStart(*[FadeIn(x) for x in chain], lag_ratio=0.12), run_time=RUN_NORMAL); self.wait(PAUSE_WORK); self.clear_stage()

    def compare_values_from_a_list(self) -> None:
        self.set_header(6, "COMPARISONS WITH OUR LIST OF SCORES", "Use an index to select observations first; then compare the selected values.")
        strip = self.score_strip().move_to(UP * 0.45); self.assert_content_safe(strip, "score strip")
        self.play(FadeIn(strip[0]), Create(strip[1]), run_time=RUN_NORMAL); self.play(LaggedStart(*[Create(box) for box in strip[2]], lag_ratio=0.10), run_time=RUN_NORMAL); self.play(LaggedStart(*[Write(v) for v in strip[3]], lag_ratio=0.10), run_time=RUN_NORMAL); self.play(LaggedStart(*[Write(i) for i in strip[4]], lag_ratio=0.10), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        highlight_3 = SurroundingRectangle(strip[2][3], color=BLACK_LINE, buff=0.07, stroke_width=3.0); highlight_1 = SurroundingRectangle(strip[2][1], color=BLACK_LINE, buff=0.07, stroke_width=3.0)
        self.play(Create(highlight_3), run_time=RUN_QUICK); index3 = self.mono("scores[3] = 4.5", 26, BOLD).next_to(strip, DOWN, buff=0.44).shift(LEFT * 2.5); self.play(Write(index3), run_time=RUN_NORMAL); self.wait(PAUSE_READ)
        self.play(Create(highlight_1), run_time=RUN_QUICK); index1 = self.mono("scores[1] = 2.8", 26, BOLD).next_to(strip, DOWN, buff=0.44).shift(RIGHT * 2.5); self.play(Write(index1), run_time=RUN_NORMAL); self.wait(PAUSE_READ)
        comparison = self.mono("scores[3] > scores[1]", 31, BOLD).next_to(VGroup(index3, index1), DOWN, buff=0.52); self.play(Write(comparison, rate_func=linear), run_time=1.35); self.wait(PAUSE_READ)
        substitution = self.mono("4.5 > 2.8", 31, BOLD).next_to(comparison, DOWN, buff=0.35); result = self.result_badge("True", width=1.95).next_to(substitution, RIGHT, buff=0.44)
        self.play(FadeIn(substitution, shift=UP * 0.12), run_time=RUN_NORMAL); self.play(Create(result[0]), Write(result[1]), run_time=RUN_NORMAL); self.wait(PAUSE_WORK); self.clear_stage()

    def guided_practice(self) -> None:
        self.set_header(7, "MINI WORKSHOP: PREDICT → RUN → INTERPRET", "Read each question, predict True or False, and only then execute the comparison.")
        exercises = [(1, "Is the second score below the pass mark?", "scores[1] < 3.0", "True", "2.8 is below 3.0"), (2, "Is the third score exactly the pass mark?", "scores[2] == 3.0", "True", "3.0 equals 3.0"), (3, "Is the first score different from 4.2?", "scores[0] != 4.2", "False", "4.2 is not different from 4.2")]
        for number, question, code, expected, interpretation in exercises:
            panel = self.prediction_panel(number, question, code).move_to(UP * 0.35); self.assert_content_safe(panel, f"exercise {number}")
            self.play(FadeIn(panel[0]), run_time=RUN_QUICK); self.play(FadeIn(panel[1][0]), Write(panel[1][1][0]), run_time=RUN_NORMAL); self.play(Write(panel[1][1][1], rate_func=linear), run_time=1.15)
            predict = self.text("Predict before running:   True   or   False ?", 27, BOLD).next_to(panel, DOWN, buff=0.48); self.play(Write(predict), run_time=RUN_SLOW); self.wait(PAUSE_WORK)
            cell = self.code_cell([code], width=8.7, line_size=27, min_height=1.30).next_to(predict, DOWN, buff=0.42); self.play(FadeOut(predict), run_time=RUN_QUICK); self.type_cell(cell, line_time=1.10); self.execute_cell(cell, 2 + number)
            output = self.output_block([expected], width=3.8, line_size=28).next_to(cell, DOWN, aligned_edge=LEFT, buff=0.20); self.reveal_output(output, pause=PAUSE_READ)
            interpretation_mob = self.text(f"Interpretation: {interpretation}.", 24, BOLD).next_to(output, RIGHT, buff=0.45); self.fit(interpretation_mob, 8.0, 0.62); self.play(FadeIn(interpretation_mob, shift=UP * 0.10), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
            self.play(FadeOut(panel), FadeOut(cell), FadeOut(output), FadeOut(interpretation_mob), run_time=RUN_NORMAL)
        self.wait(PAUSE_SHORT); self.clear_stage()

    def summary(self) -> None:
        self.set_header(8, "TAKEAWAY", "Comparison operators convert data questions into Boolean results that Python can use later.")
        rows = VGroup(self.note_panel("1 · START WITH THE DATA", ["Know the values you are comparing."], width=6.25, body_size=22), self.note_panel("2 · WRITE THE QUESTION", ["Use >, <, >=, <=, ==, or !=."], width=6.25, body_size=22), self.note_panel("3 · RUN IN COLAB", ["The cell evaluates the expression."], width=6.25, body_size=22), self.note_panel("4 · INTERPRET", ["True or False must be explained in context."], width=6.25, body_size=22))
        rows.arrange_in_grid(rows=2, cols=2, buff=(0.48, 0.40)); rows.move_to(DOWN * 0.48); self.assert_content_safe(rows, "summary grid")
        self.play(LaggedStart(*[FadeIn(row, shift=UP * 0.10) for row in rows], lag_ratio=0.20), run_time=RUN_SLOW); self.wait(PAUSE_SUMMARY)
        bridge = self.mono("comparison  →  True / False  →  later: conditions and filtering", 26, BOLD).next_to(rows, DOWN, buff=0.36); self.fit(bridge, 13.8, 0.72)
        self.play(Write(bridge), run_time=RUN_SLOW); self.wait(PAUSE_FINAL); self.standard_closing("A comparison asks a precise question about data — and Python answers True or False.")
