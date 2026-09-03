#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Statistics 11 — Comparisons and Boolean Logic in Google Colab.

FULL-TOTAL SENIOR extension of the existing comparison-operator lesson.

Pedagogical route
-----------------
LIST -> OBSERVATION -> QUESTION -> COMPARISON -> True/False ->
AND/OR/NOT -> DATA RULE -> NEXT: DECISION WITH if

Visual contract
---------------
- JP Classroom monochrome style: white background, black text, neutral grays.
- 1920x1080, 16:9, 30 fps.
- Persistent numbered headers, projection-safe typography and safe-area checks.
- Simplified Google Colab shell with explicit Run / execution / output behavior.
- Staged construction, prediction pauses and contextual interpretation.
- Statistics-first examples using one score dataset throughout.

Target: Manim Community Edition 0.20.1
"""

from __future__ import annotations

from library.jp_classroom_style import *


SCORES = [4.2, 2.8, 3.0, 4.5, 3.7]
PASS_MARK = 3.0
MAX_SCORE = 5.0


class Stat11ComparisonsLogicProtocolV3(JPMathClassroomScene):
    """Full senior lesson: comparisons -> Boolean values -> combined conditions."""

    def validate_lesson_data(self) -> None:
        assert SCORES == [4.2, 2.8, 3.0, 4.5, 3.7]
        assert PASS_MARK == 3.0
        assert MAX_SCORE == 5.0
        assert (SCORES[0] >= PASS_MARK) is True
        assert (SCORES[1] < PASS_MARK) is True
        assert (SCORES[2] == PASS_MARK) is True
        assert (SCORES[3] > SCORES[1]) is True
        assert ((SCORES[0] >= 3.0) and (SCORES[0] <= 5.0)) is True
        assert ((SCORES[1] < 3.0) or (SCORES[1] >= 4.5)) is True
        assert (not (SCORES[3] < 3.0)) is True
        assert ((4.7 >= 3.0) and (4.7 < 4.5)) is False
        assert all((score >= 3.0) == expected for score, expected in zip(SCORES, [True, False, True, True, True]))

    def mono(self, content: str, size: int = 25, weight=MEDIUM) -> Text:
        return self.text(content, size, weight, font="DejaVu Sans Mono")

    def neutral_card(self, title: str, body: str, *, width: float = 3.2, height: float = 1.35, title_size: int = 20, body_size: int = 30) -> VGroup:
        box = RoundedRectangle(width=width, height=height, corner_radius=0.12, stroke_color=BLACK_LINE, stroke_width=1.7, fill_color=WHITE_FILL, fill_opacity=1.0)
        title_mob = self.text(title, title_size, BOLD)
        body_mob = self.mono(body, body_size, BOLD)
        content = VGroup(title_mob, body_mob).arrange(DOWN, buff=0.13)
        self.fit(content, width - 0.42, height - 0.25)
        content.move_to(box)
        return VGroup(box, content)

    def result_badge(self, value: str, *, width: float = 2.15) -> VGroup:
        box = RoundedRectangle(width=width, height=0.76, corner_radius=0.12, stroke_color=BLACK_LINE, stroke_width=1.8, fill_color=PAPER_GRAY, fill_opacity=1.0)
        txt = self.mono(value, 28, BOLD).move_to(box)
        return VGroup(box, txt)

    def logic_operator_card(self, keyword: str, meaning: str, example: str) -> VGroup:
        title = self.mono(keyword, 31, BOLD)
        meaning_mob = self.text(meaning, 23, BOLD)
        example_mob = self.mono(example, 19, MEDIUM)
        content = VGroup(title, meaning_mob, example_mob).arrange(DOWN, buff=0.13)
        box = RoundedRectangle(width=4.25, height=2.05, corner_radius=0.12, stroke_color=LIGHT_GRAY, stroke_width=1.6, fill_color=WHITE_FILL, fill_opacity=1.0)
        self.fit(content, 3.85, 1.65)
        content.move_to(box)
        return VGroup(box, content)

    def condition_card(self, label: str, expression: str, result: str, *, width: float = 5.4) -> VGroup:
        label_mob = self.text(label, 20, BOLD)
        expr_mob = self.mono(expression, 25, BOLD)
        result_mob = self.result_badge(result, width=1.85)
        content = VGroup(label_mob, expr_mob, result_mob).arrange(DOWN, buff=0.16)
        box = RoundedRectangle(width=width, height=2.0, corner_radius=0.12, stroke_color=BLACK_LINE, stroke_width=1.6, fill_color=WHITE_FILL, fill_opacity=1.0)
        self.fit(content, width - 0.45, 1.65)
        content.move_to(box)
        return VGroup(box, content)

    def question_pipeline(self, items: list[str], *, sizes: list[int] | None = None) -> VGroup:
        sizes = sizes or [22] * len(items)
        nodes = VGroup()
        for i, (item, size) in enumerate(zip(items, sizes)):
            if any(token in item for token in [">", "<", "==", "!=", ">=", "<=", "True", "False", "scores["]):
                mob = self.mono(item, size, BOLD)
            else:
                mob = self.text(item, size, BOLD)
            nodes.add(mob)
            if i < len(items) - 1:
                nodes.add(Arrow(LEFT * 0.35, RIGHT * 0.35, color=BLACK_LINE, stroke_width=1.8, max_tip_length_to_length_ratio=0.20))
        nodes.arrange(RIGHT, buff=0.18)
        self.fit(nodes, 14.0, 0.9)
        return nodes

    def score_strip(self, *, show_name: bool = True) -> VGroup:
        boxes = VGroup(); values = VGroup(); indices = VGroup()
        for index, value in enumerate(SCORES):
            box = RoundedRectangle(width=1.30, height=0.84, corner_radius=0.08, stroke_color=BLACK_LINE, stroke_width=1.55, fill_color=WHITE_FILL, fill_opacity=1.0)
            val = self.mono(str(value), 25, BOLD).move_to(box)
            idx = self.mono(str(index), 16, MEDIUM).next_to(box, DOWN, buff=0.08)
            boxes.add(box); values.add(val); indices.add(idx)
        boxes.arrange(RIGHT, buff=0.12)
        for i, box in enumerate(boxes):
            values[i].move_to(box); indices[i].next_to(box, DOWN, buff=0.08)
        if show_name:
            name = self.mono("scores", 26, BOLD); name.next_to(boxes, LEFT, buff=0.30)
            arrow = Arrow(name.get_right(), boxes.get_left(), buff=0.06, stroke_width=1.7, color=BLACK_LINE)
        else:
            name = VGroup(); arrow = VGroup()
        return VGroup(name, arrow, boxes, values, indices)

    def colab_shell(self, title: str, *, width: float = 14.20, height: float = 5.20) -> VGroup:
        outer = RoundedRectangle(width=width, height=height, corner_radius=0.14, stroke_color=BLACK_LINE, stroke_width=1.8, fill_color=WHITE_FILL, fill_opacity=1.0)
        notebook_name = self.text(title, 23, BOLD)
        notebook_name.move_to(outer.get_top() + DOWN * 0.34); notebook_name.align_to(outer, LEFT).shift(RIGHT * 0.58)
        connect_box = RoundedRectangle(width=1.50, height=0.44, corner_radius=0.16, stroke_color=BLACK_LINE, stroke_width=1.5, fill_color=WHITE_FILL, fill_opacity=1.0)
        connect_text = self.text("Connect", 16, BOLD).move_to(connect_box)
        connect = VGroup(connect_box, connect_text); connect.move_to(outer.get_top() + DOWN * 0.34); connect.align_to(outer, RIGHT).shift(LEFT * 0.48)
        menus = VGroup(*[self.text(label, 15, MEDIUM) for label in ["File", "Edit", "View", "Insert", "Runtime", "Tools", "Help"]]); menus.arrange(RIGHT, buff=0.30); menus.next_to(notebook_name, DOWN, aligned_edge=LEFT, buff=0.14)
        code_btn_box = RoundedRectangle(width=1.08, height=0.38, corner_radius=0.10, stroke_color=LIGHT_GRAY, stroke_width=1.3, fill_color=PAPER_GRAY, fill_opacity=1.0)
        code_btn_text = self.text("+ Code", 15, BOLD).move_to(code_btn_box); code_btn = VGroup(code_btn_box, code_btn_text)
        text_btn_box = RoundedRectangle(width=1.06, height=0.38, corner_radius=0.10, stroke_color=LIGHT_GRAY, stroke_width=1.3, fill_color=PAPER_GRAY, fill_opacity=1.0)
        text_btn_text = self.text("+ Text", 15, BOLD).move_to(text_btn_box); text_btn = VGroup(text_btn_box, text_btn_text)
        toolbar = VGroup(code_btn, text_btn).arrange(RIGHT, buff=0.14); toolbar.next_to(menus, DOWN, aligned_edge=LEFT, buff=0.12)
        divider = Line(outer.get_left() + RIGHT * 0.22, outer.get_right() + LEFT * 0.22, color=LIGHT_GRAY, stroke_width=1.4); divider.set_y(toolbar.get_bottom()[1] - 0.15)
        rail = VGroup()
        for symbol in ["≡", "□", "{}"]:
            box = RoundedRectangle(width=0.52, height=0.46, corner_radius=0.08, stroke_color=LIGHT_GRAY, stroke_width=1.1, fill_color=WHITE_FILL, fill_opacity=1.0)
            txt = self.text(symbol, 16, BOLD).move_to(box); rail.add(VGroup(box, txt))
        rail.arrange(DOWN, buff=0.14); rail.move_to(outer.get_left() + RIGHT * 0.42 + DOWN * 0.55)
        return VGroup(outer, notebook_name, connect, menus, toolbar, divider, rail)

    def code_cell(self, lines: list[str], *, width: float = 9.60, min_height: float = 1.55, line_size: int = 25, exec_label: str = "[ ]") -> VGroup:
        line_mobs = VGroup(*[self.mono(line, line_size) for line in lines]); line_mobs.arrange(DOWN, aligned_edge=LEFT, buff=0.15); self.fit(line_mobs, width - 1.42, 3.20)
        height = max(min_height, line_mobs.height + 0.58)
        box = RoundedRectangle(width=width, height=height, corner_radius=0.10, stroke_color=LIGHT_GRAY, stroke_width=1.6, fill_color=VERY_LIGHT_GRAY, fill_opacity=0.58)
        run_circle = Circle(radius=0.19, stroke_color=BLACK_LINE, stroke_width=1.6, fill_color=WHITE_FILL, fill_opacity=1.0)
        run_triangle = Triangle(stroke_color=BLACK_LINE, stroke_width=1.2, fill_color=BLACK_LINE, fill_opacity=1.0).scale(0.064).rotate(-PI / 2)
        run_icon = VGroup(run_circle, run_triangle); count = self.mono(exec_label, 15, MEDIUM); gutter = VGroup(run_icon, count).arrange(DOWN, buff=0.13); gutter.move_to(box.get_left() + RIGHT * 0.46)
        line_mobs.move_to(box); line_mobs.align_to(box, LEFT).shift(RIGHT * 1.02)
        return VGroup(box, gutter, line_mobs)

    def output_block(self, lines: list[str], *, width: float = 5.0, line_size: int = 25) -> VGroup:
        text_group = VGroup(*[self.mono(line, line_size) for line in lines]); text_group.arrange(DOWN, aligned_edge=LEFT, buff=0.12); self.fit(text_group, width - 0.55, 1.55)
        box = RoundedRectangle(width=width, height=max(0.72, text_group.height + 0.38), corner_radius=0.08, stroke_color=LIGHT_GRAY, stroke_width=1.25, fill_color=WHITE_FILL, fill_opacity=1.0)
        text_group.move_to(box); text_group.align_to(box, LEFT).shift(RIGHT * 0.25)
        return VGroup(box, text_group)

    def type_cell(self, cell: VGroup, *, line_time: float = 0.95, zoom_width: float | None = None) -> None:
        box, gutter, lines = cell; self.play(Create(box), FadeIn(gutter), run_time=RUN_NORMAL)
        if zoom_width is not None:
            persistent = [x for x in (self.header_group, self.subtitle_group) if x is not None]
            if persistent: self.play(*[FadeOut(x) for x in persistent], run_time=RUN_QUICK)
            self.camera.frame.save_state(); self.play(self.camera.frame.animate.set(width=max(zoom_width, cell.width + 0.9)).move_to(cell), run_time=RUN_CAMERA)
        for line in lines:
            self.play(Write(line, rate_func=linear), run_time=line_time); self.wait(0.30)
        if zoom_width is not None:
            self.play(Restore(self.camera.frame), run_time=RUN_CAMERA)
            persistent = [x for x in (self.header_group, self.subtitle_group) if x is not None]
            if persistent: self.play(*[FadeIn(x) for x in persistent], run_time=RUN_QUICK)

    def execute_cell(self, cell: VGroup, number: int) -> None:
        run_icon = cell[1][0]; old_count = cell[1][1]; new_count = self.mono(f"[{number}]", 15, MEDIUM).move_to(old_count)
        self.play(Indicate(run_icon, color=BLACK, scale_factor=1.18), run_time=0.58); self.play(Transform(old_count, new_count), run_time=0.40); self.wait(PAUSE_SHORT)

    def reveal_output(self, output: VGroup, *, pause: float = PAUSE_READ) -> None:
        self.play(Create(output[0]), run_time=RUN_QUICK); self.play(LaggedStart(*[Write(line) for line in output[1]], lag_ratio=0.18), run_time=RUN_NORMAL); self.wait(pause)

    def prediction_panel(self, number: int, question: str, code: str) -> VGroup:
        badge = RoundedRectangle(width=0.58, height=0.52, corner_radius=0.08, stroke_color=BLACK_LINE, stroke_width=1.5, fill_color=WHITE_FILL, fill_opacity=1.0); badge_text = self.text(str(number), 21, BOLD).move_to(badge)
        q = self.text(question, 23, BOLD); c = self.mono(code, 23, MEDIUM); self.fit(q, 9.9, 0.55); self.fit(c, 9.9, 0.55)
        content = VGroup(VGroup(badge, badge_text), VGroup(q, c).arrange(DOWN, aligned_edge=LEFT, buff=0.14)); content.arrange(RIGHT, buff=0.28)
        box = RoundedRectangle(width=12.9, height=1.48, corner_radius=0.12, stroke_color=LIGHT_GRAY, stroke_width=1.5, fill_color=WHITE_FILL, fill_opacity=1.0); content.move_to(box); content.align_to(box, LEFT).shift(RIGHT * 0.34)
        return VGroup(box, content)

    def truth_table(self, operator: str) -> TableDiagram:
        if operator == "and": rows = [["True", "True", "True"], ["True", "False", "False"], ["False", "True", "False"], ["False", "False", "False"]]
        elif operator == "or": rows = [["True", "True", "True"], ["True", "False", "True"], ["False", "True", "True"], ["False", "False", "False"]]
        else: raise ValueError(operator)
        return self.build_table(headers=("A", "B", f"A {operator} B"), body_rows=rows, column_widths=(2.0, 2.0, 3.0), math_columns=(), row_height=0.57, header_height=0.64, body_font_size=22, header_font_size=20)

    def construct(self) -> None:
        self.opening(); self.start_from_data(); self.colab_execution_model(); self.assignment_vs_equality(); self.comparison_operators(); self.boolean_values(); self.return_to_list(); self.motivate_logic(); self.and_operator(); self.or_operator(); self.not_operator(); self.logic_side_by_side(); self.natural_language_to_python(); self.parentheses_for_reading(); self.workshop_comparisons(); self.workshop_logic(); self.integrated_data_example(); self.common_errors(); self.final_challenge(); self.summary(); self.bridge_next_lesson()

    def opening(self) -> None:
        self.standard_opening("STATISTICS 11 · PYTHON / COLAB", "COMPARISONS AND BOOLEAN LOGIC", "Ask questions about your data", "DATA → QUESTION → True / False → COMBINE QUESTIONS")
        self.set_header(0, "CONNECT WITH THE LAST CLASS", "Lists store many observations. Today we will ask questions about them.")
        recap = self.mono("scores = [4.2, 2.8, 3.0, 4.5, 3.7]", 31, BOLD).move_to(UP * 0.65); self.play(Write(recap, rate_func=linear), run_time=RUN_SLOW); self.wait(PAUSE_READ)
        route = self.process_map([("1", "LIST"), ("2", "SELECT A VALUE"), ("3", "ASK A QUESTION")], columns=3); route.move_to(DOWN * 0.65); self.fit(route, 12.8, 2.1)
        self.play(LaggedStart(*[FadeIn(card, shift=UP * 0.10) for card in route], lag_ratio=0.20), run_time=RUN_SLOW); self.wait(PAUSE_EXPLAIN)
        question = self.text("What can Python tell us about these observations?", 29, BOLD).next_to(route, DOWN, buff=0.40); self.fit(question, 13.4, 0.62); self.play(Write(question), run_time=RUN_SLOW); self.wait(PAUSE_EXPLAIN)
        pipeline = self.question_pipeline(["DATA", "QUESTION", "True / False"], sizes=[24, 24, 25]).next_to(question, DOWN, buff=0.36); self.play(LaggedStart(*[FadeIn(x) for x in pipeline], lag_ratio=0.12), run_time=RUN_NORMAL); self.wait(PAUSE_WORK); self.clear_stage()

    def start_from_data(self) -> None:
        self.set_header(1, "START FROM DATA, NOT FROM SYNTAX", "First understand the statistical question. Then translate it into Python.")
        score_card = self.neutral_card("observed score", "4.2", width=3.35); mark_card = self.neutral_card("pass mark", "3.0", width=3.35); cards = VGroup(score_card, mark_card).arrange(RIGHT, buff=0.75).move_to(UP * 0.72); self.assert_content_safe(cards, "scene1 cards")
        self.play(LaggedStart(FadeIn(score_card, shift=UP * 0.10), FadeIn(mark_card, shift=UP * 0.10), lag_ratio=0.30), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        question = self.text("Did the score reach the pass mark?", 31, BOLD).move_to(DOWN * 0.15); self.play(Write(question), run_time=RUN_SLOW); self.wait(PAUSE_EXPLAIN)
        relation = self.mono("4.2  ≥  3.0", 39, BOLD).next_to(question, DOWN, buff=0.45); self.play(FadeIn(relation, shift=UP * 0.12), run_time=RUN_NORMAL); self.wait(PAUSE_WORK)
        yes = self.text("Yes", 31, BOLD).next_to(relation, RIGHT, buff=0.52); self.play(Write(yes), run_time=RUN_NORMAL); self.wait(PAUSE_READ)
        python_form = self.mono("score >= pass_mark", 32, BOLD).next_to(relation, DOWN, buff=0.48); self.play(TransformFromCopy(relation, python_form), run_time=RUN_SLOW); self.wait(PAUSE_EXPLAIN)
        result = self.result_badge("True").next_to(python_form, RIGHT, buff=0.50); self.play(Create(result[0]), Write(result[1]), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        interpretation = self.text('True means: "The observed score reached the pass mark."', 24, BOLD).next_to(python_form, DOWN, buff=0.42); self.fit(interpretation, 13.0, 0.62); self.play(FadeIn(interpretation, shift=UP * 0.10), run_time=RUN_NORMAL); self.wait(PAUSE_WORK)
        pipeline = self.question_pipeline(["data", "question", "comparison", "True", "interpretation"], sizes=[20, 20, 20, 21, 20]).next_to(interpretation, DOWN, buff=0.35); self.play(LaggedStart(*[FadeIn(x) for x in pipeline], lag_ratio=0.08), run_time=RUN_NORMAL); self.wait(PAUSE_SUMMARY); self.clear_stage()

    def colab_execution_model(self) -> None:
        self.set_header(2, "THE COLAB EXECUTION MODEL", "Python evaluates the expression. The result appears below the code cell.")
        shell = self.colab_shell("Statistics11_BooleanLogic.ipynb").move_to(DOWN * 0.60); self.assert_content_safe(shell, "scene2 shell")
        self.play(Create(shell[0]), run_time=RUN_NORMAL); self.play(FadeIn(shell[1]), FadeIn(shell[2]), FadeIn(shell[3]), FadeIn(shell[4]), Create(shell[5]), FadeIn(shell[6]), run_time=RUN_NORMAL); self.wait(PAUSE_READ)
        cell = self.code_cell(["score = 4.2", "pass_mark = 3.0", "score >= pass_mark"], width=9.8, min_height=2.15, line_size=25); cell.move_to(shell[0].get_center() + DOWN * 0.35 + RIGHT * 0.55); self.type_cell(cell, line_time=1.05, zoom_width=11.2); self.wait(PAUSE_READ)
        code_label = self.text("CODE CELL", 18, BOLD).next_to(cell, LEFT, buff=0.25); self.play(FadeIn(code_label), run_time=RUN_QUICK); self.execute_cell(cell, 1)
        run_label = self.text("RUN", 18, BOLD).next_to(cell[1][0], LEFT, buff=0.18); self.play(FadeIn(run_label), run_time=RUN_QUICK)
        output = self.output_block(["True"], width=4.4, line_size=28).next_to(cell, DOWN, aligned_edge=LEFT, buff=0.22); self.reveal_output(output, pause=PAUSE_EXPLAIN)
        output_label = self.text("OUTPUT", 18, BOLD).next_to(output, RIGHT, buff=0.24); self.play(FadeIn(output_label), run_time=RUN_QUICK)
        statement = self.text("Python evaluates the comparison. True is the evaluated result.", 24, BOLD).next_to(output, DOWN, buff=0.28); self.fit(statement, 11.5, 0.58); self.play(Write(statement), run_time=RUN_SLOW); self.wait(PAUSE_WORK); self.clear_stage()

    def assignment_vs_equality(self) -> None:
        self.set_header(3, "A CRITICAL DIFFERENCE:  =  VS  ==", "One equal sign stores. Two equal signs ask whether values are equal.")
        left = self.condition_card("ASSIGNMENT · STORE", "score = 4.2", "stored", width=6.0); right = self.condition_card("COMPARISON · ASK EQUAL?", "score == 4.2", "True", width=6.0); pair = VGroup(left, right).arrange(RIGHT, buff=0.55).move_to(UP * 0.45); self.assert_content_safe(pair, "scene3 pair")
        self.play(Create(left[0]), run_time=RUN_QUICK); self.play(Write(left[1][0]), Write(left[1][1], rate_func=linear), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        self.play(Create(right[0]), run_time=RUN_QUICK); self.play(Write(right[1][0]), Write(right[1][1], rate_func=linear), run_time=RUN_NORMAL); self.play(Create(right[1][2][0]), Write(right[1][2][1]), run_time=RUN_NORMAL); self.wait(PAUSE_WORK)
        one = self.mono("=", 42, BOLD).move_to(DOWN * 0.78 + LEFT * 2.2); two = self.mono("==", 42, BOLD).move_to(DOWN * 0.78 + RIGHT * 2.2); self.play(Write(one), run_time=RUN_NORMAL); self.wait(PAUSE_READ); self.play(TransformFromCopy(one, two), run_time=RUN_SLOW); self.wait(PAUSE_WORK)
        labels = VGroup(self.text("STORE", 24, BOLD).next_to(one, DOWN, buff=0.20), self.text('ASK "EQUAL?"', 24, BOLD).next_to(two, DOWN, buff=0.20)); self.play(LaggedStart(*[Write(x) for x in labels], lag_ratio=0.25), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        wrong = self.mono("score = 3.0", 27, BOLD).move_to(DOWN * 2.25 + LEFT * 2.25); wrong_note = self.text("NOT the question: Is score equal to 3.0?", 21).next_to(wrong, DOWN, buff=0.18)
        correct = self.mono("score == 3.0", 27, BOLD).move_to(DOWN * 2.25 + RIGHT * 2.25); correct_note = self.text("Correct equality comparison", 21, BOLD).next_to(correct, DOWN, buff=0.18)
        self.play(Write(wrong, rate_func=linear), FadeIn(wrong_note), run_time=RUN_NORMAL); self.wait(PAUSE_READ); self.play(Write(correct, rate_func=linear), FadeIn(correct_note), run_time=RUN_NORMAL); self.wait(PAUSE_WORK); self.clear_stage()

    def comparison_operators(self) -> None:
        self.set_header(4, "THE SIX COMPARISON OPERATORS", "Each operator asks one precise question about two values.")
        specs = [(">", "greater than", "4.2 > 3.0", "True"), ("<", "less than", "2.8 < 3.0", "True"), (">=", "greater than or equal to", "3.0 >= 3.0", "True"), ("<=", "less than or equal to", "2.8 <= 3.0", "True"), ("==", "equal to", "3.0 == 3.0", "True"), ("!=", "not equal to", "4.2 != 3.0", "True")]
        final_cards = VGroup(); positions = [UP * 1.30 + LEFT * 4.35, UP * 1.30, UP * 1.30 + RIGHT * 4.35, DOWN * 1.05 + LEFT * 4.35, DOWN * 1.05, DOWN * 1.05 + RIGHT * 4.35]
        for i, (symbol, meaning, example, result) in enumerate(specs):
            q = self.text(f"Question {i+1}: {meaning}?", 27, BOLD).move_to(UP * 1.55); expr = self.mono(example, 36, BOLD).move_to(UP * 0.40); predict = self.text("Predict: True or False?", 27, BOLD).move_to(DOWN * 0.55); answer = self.result_badge(result).move_to(DOWN * 1.55)
            self.play(Write(q), run_time=RUN_NORMAL); self.play(Write(expr, rate_func=linear), run_time=RUN_NORMAL); self.play(Write(predict), run_time=RUN_NORMAL); self.wait(PAUSE_WORK); self.play(Create(answer[0]), Write(answer[1]), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
            card = self.logic_operator_card(symbol, meaning, f"{example} → {result}"); card.scale(0.90).move_to(positions[i]); final_cards.add(card)
            self.play(FadeOut(q), FadeOut(expr), FadeOut(predict), FadeOut(answer), run_time=RUN_QUICK); self.play(FadeIn(card, shift=UP * 0.08), run_time=RUN_QUICK)
        self.assert_content_safe(final_cards, "scene4 operator grid"); self.wait(PAUSE_EXPLAIN)
        eq_box = SurroundingRectangle(final_cards[4], color=BLACK_LINE, buff=0.08, stroke_width=2.5); ne_box = SurroundingRectangle(final_cards[5], color=BLACK_LINE, buff=0.08, stroke_width=2.5); self.play(Create(eq_box), Create(ne_box), run_time=RUN_NORMAL)
        note = self.text("Pay special attention:  == means equal · != means different", 25, BOLD).next_to(final_cards, DOWN, buff=0.25); self.play(Write(note), run_time=RUN_SLOW); self.wait(PAUSE_WORK); self.clear_stage()

    def boolean_values(self) -> None:
        self.set_header(5, "TRUE AND FALSE ARE VALUES", "A comparison produces a Boolean value. Python calls this data type bool.")
        cell = self.code_cell(["score = 4.2", "passed = score >= 3.0"], width=10.5, min_height=1.75, line_size=27).move_to(UP * 0.65); self.type_cell(cell, line_time=1.0, zoom_width=11.6)
        question = self.text("What is stored in passed?", 29, BOLD).next_to(cell, DOWN, buff=0.42); self.play(Write(question), run_time=RUN_SLOW); self.wait(PAUSE_WORK)
        answer = self.result_badge("True").next_to(question, DOWN, buff=0.38); self.play(Create(answer[0]), Write(answer[1]), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        type_cell = self.code_cell(["print(type(passed).__name__)"], width=8.2, min_height=1.20, line_size=24).next_to(answer, DOWN, buff=0.32); self.type_cell(type_cell, line_time=0.95); self.execute_cell(type_cell, 2)
        output = self.output_block(["bool"], width=3.5, line_size=26).next_to(type_cell, RIGHT, buff=0.38); self.reveal_output(output, pause=PAUSE_READ)
        chain = self.question_pipeline(["comparison", "Boolean value", "True / False", "type: bool"], sizes=[21, 21, 22, 21]).next_to(type_cell, DOWN, buff=0.42); self.play(LaggedStart(*[FadeIn(x) for x in chain], lag_ratio=0.10), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        types = VGroup(self.note_panel("NUMBERS", ["describe quantities"], width=3.55, title_size=22, body_size=20), self.note_panel("STRINGS", ["describe text"], width=3.55, title_size=22, body_size=20), self.note_panel("BOOLEANS", ["describe logical states"], width=3.55, title_size=22, body_size=20)).arrange(RIGHT, buff=0.30); types.next_to(chain, DOWN, buff=0.35)
        self.play(LaggedStart(*[FadeIn(x, shift=UP * 0.08) for x in types], lag_ratio=0.18), run_time=RUN_NORMAL); self.wait(PAUSE_WORK); self.clear_stage()

    def return_to_list(self) -> None:
        self.set_header(6, "RETURN TO THE LIST", "Index first. Compare second. Interpret the result in the data context.")
        strip = self.score_strip().move_to(UP * 1.20); self.play(FadeIn(strip[0]), Create(strip[1]), run_time=RUN_NORMAL); self.play(LaggedStart(*[Create(b) for b in strip[2]], lag_ratio=0.10), run_time=RUN_NORMAL); self.play(LaggedStart(*[Write(v) for v in strip[3]], lag_ratio=0.10), run_time=RUN_NORMAL); self.play(LaggedStart(*[Write(i) for i in strip[4]], lag_ratio=0.10), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        h3 = SurroundingRectangle(strip[2][3], color=BLACK_LINE, buff=0.07, stroke_width=2.6); h1 = SurroundingRectangle(strip[2][1], color=BLACK_LINE, buff=0.07, stroke_width=2.6); self.play(Create(h3), run_time=RUN_QUICK)
        a = self.mono("scores[3]", 28, BOLD).move_to(LEFT * 2.6 + UP * 0.15); a_val = self.mono("4.5", 30, BOLD).next_to(a, DOWN, buff=0.18); self.play(Write(a), TransformFromCopy(strip[3][3], a_val), run_time=RUN_NORMAL); self.wait(PAUSE_READ)
        self.play(Create(h1), run_time=RUN_QUICK); b = self.mono("scores[1]", 28, BOLD).move_to(RIGHT * 2.6 + UP * 0.15); b_val = self.mono("2.8", 30, BOLD).next_to(b, DOWN, buff=0.18); self.play(Write(b), TransformFromCopy(strip[3][1], b_val), run_time=RUN_NORMAL); self.wait(PAUSE_READ)
        q = self.text("Is the fourth observation greater than the second?", 28, BOLD).move_to(DOWN * 0.95); self.play(Write(q), run_time=RUN_SLOW)
        code = self.mono("scores[3] > scores[1]", 31, BOLD).next_to(q, DOWN, buff=0.35); self.play(Write(code, rate_func=linear), run_time=RUN_NORMAL)
        substitute = self.mono("4.5 > 2.8", 31, BOLD).next_to(code, DOWN, buff=0.30); self.play(FadeIn(substitute, shift=UP * 0.08), run_time=RUN_SLOW); self.wait(PAUSE_WORK)
        result = self.result_badge("True").next_to(substitute, RIGHT, buff=0.45); self.play(Create(result[0]), Write(result[1]), run_time=RUN_NORMAL)
        interpretation = self.text("The fourth observation is greater than the second.", 24, BOLD).next_to(substitute, DOWN, buff=0.30); self.play(FadeIn(interpretation, shift=UP * 0.08), run_time=RUN_NORMAL); self.wait(PAUSE_WORK); self.clear_stage()

    def motivate_logic(self) -> None:
        self.set_header(7, "ONE COMPARISON IS SOMETIMES NOT ENOUGH", "A data rule can require two questions to be true at the same time.")
        score = self.neutral_card("score", "4.2", width=3.0).move_to(UP * 1.55); self.play(FadeIn(score), run_time=RUN_NORMAL)
        question = self.text("Is this score BOTH at least 3.0 AND at most 5.0?", 29, BOLD).next_to(score, DOWN, buff=0.45); self.fit(question, 13.3, 0.62); self.play(Write(question), run_time=RUN_SLOW); self.wait(PAUSE_EXPLAIN)
        a = self.condition_card("QUESTION A", "score >= 3.0", "True"); b = self.condition_card("QUESTION B", "score <= 5.0", "True"); pair = VGroup(a, b).arrange(RIGHT, buff=0.65).move_to(DOWN * 0.45)
        self.play(FadeIn(a, shift=LEFT * 0.10), run_time=RUN_NORMAL); self.wait(PAUSE_READ); self.play(FadeIn(b, shift=RIGHT * 0.10), run_time=RUN_NORMAL); self.wait(PAUSE_READ)
        combine = self.mono("True  AND  True", 32, BOLD).next_to(pair, DOWN, buff=0.38); self.play(Write(combine), run_time=RUN_SLOW); self.wait(PAUSE_WORK)
        result = self.result_badge("True").next_to(combine, RIGHT, buff=0.45); self.play(Create(result[0]), Write(result[1]), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        python = self.mono("score >= 3.0 and score <= 5.0", 28, BOLD).next_to(combine, DOWN, buff=0.33); self.fit(python, 12.4, 0.60); self.play(TransformFromCopy(combine, python), run_time=RUN_SLOW); self.wait(PAUSE_WORK); self.clear_stage()

    def and_operator(self) -> None:
        self.set_header(8, "AND = BOTH CONDITIONS", "The combined result is True only when both conditions are True.")
        title = self.mono("and", 42, BOLD).move_to(UP * 1.85); meaning = self.text("BOTH requirements must hold", 28, BOLD).next_to(title, DOWN, buff=0.18); self.play(Write(title), Write(meaning), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        cases = [("True", "True", "True"), ("True", "False", "False"), ("False", "True", "False"), ("False", "False", "False")]; row = VGroup()
        for left, right, answer in cases:
            text = self.mono(f"{left} and {right}", 26, BOLD); arrow = Arrow(LEFT * 0.30, RIGHT * 0.30, color=BLACK_LINE, stroke_width=1.6); badge = self.result_badge(answer, width=1.85); row.add(VGroup(text, arrow, badge).arrange(RIGHT, buff=0.20))
        row.arrange(DOWN, aligned_edge=LEFT, buff=0.22).move_to(LEFT * 3.35 + DOWN * 0.35)
        for item in row:
            self.play(FadeIn(item[0]), Create(item[1]), run_time=RUN_QUICK); self.wait(PAUSE_SHORT); self.play(Create(item[2][0]), Write(item[2][1]), run_time=RUN_QUICK); self.wait(PAUSE_READ)
        table = self.truth_table("and"); table.group.scale(0.83).move_to(RIGHT * 3.65 + DOWN * 0.25); self.play(FadeIn(table.group), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        ex1 = self.mono("4.2 >= 3.0 and 4.2 <= 5.0  →  True", 23, BOLD).move_to(DOWN * 2.65); ex2 = self.mono("2.8 >= 3.0 and 2.8 <= 5.0  →  False", 23, BOLD).next_to(ex1, DOWN, buff=0.17)
        self.play(Write(ex1, rate_func=linear), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN); self.play(Write(ex2, rate_func=linear), run_time=RUN_NORMAL); self.wait(PAUSE_WORK); self.clear_stage()

    def or_operator(self) -> None:
        self.set_header(9, "OR = AT LEAST ONE CONDITION", "A flag rule is True when either side is True, or when both are True.")
        rule_text = self.text("Flag a score if it is below 3.0 OR at least 4.5.", 29, BOLD).move_to(UP * 1.75); code = self.mono("score < 3.0 or score >= 4.5", 29, BOLD).next_to(rule_text, DOWN, buff=0.30)
        self.play(Write(rule_text), run_time=RUN_SLOW); self.play(Write(code, rate_func=linear), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        tests = [("score = 2.8", "True or False", "True"), ("score = 4.5", "False or True", "True"), ("score = 3.7", "False or False", "False")]; base_y = 0.40
        for i, (score_label, states, result) in enumerate(tests):
            score_mob = self.mono(score_label, 24, BOLD); state_mob = self.mono(states, 24, BOLD); badge = self.result_badge(result, width=1.85); g = VGroup(score_mob, state_mob, badge).arrange(RIGHT, buff=0.50); g.move_to(np.array([0, base_y - i * 0.88, 0]))
            self.play(Write(score_mob), run_time=RUN_QUICK); self.play(Write(state_mob), run_time=RUN_QUICK); self.wait(PAUSE_READ); self.play(Create(badge[0]), Write(badge[1]), run_time=RUN_QUICK); self.wait(PAUSE_EXPLAIN)
        table = self.truth_table("or"); table.group.scale(0.72).to_edge(RIGHT, buff=0.55).shift(DOWN * 0.80); self.play(FadeIn(table.group), run_time=RUN_NORMAL)
        key = self.text("or means AT LEAST ONE condition must hold.", 26, BOLD).move_to(DOWN * 2.95); self.play(Write(key), run_time=RUN_SLOW); self.wait(PAUSE_WORK); self.clear_stage()

    def not_operator(self) -> None:
        self.set_header(10, "NOT = INVERT THE ANSWER", "not reverses a Boolean result: True becomes False and False becomes True.")
        score = self.neutral_card("score", "2.8", width=2.8).move_to(UP * 1.45); self.play(FadeIn(score), run_time=RUN_NORMAL)
        expr = self.mono("score >= 3.0", 31, BOLD).move_to(UP * 0.35); self.play(Write(expr), run_time=RUN_NORMAL); false = self.result_badge("False").next_to(expr, RIGHT, buff=0.48); self.play(Create(false[0]), Write(false[1]), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        not_word = self.mono("not", 35, BOLD).move_to(LEFT * 2.8 + DOWN * 0.80); expr2 = self.mono("score >= 3.0", 31, BOLD).next_to(not_word, RIGHT, buff=0.28); self.play(TransformFromCopy(expr, expr2), Write(not_word), run_time=RUN_NORMAL)
        inversion = VGroup(self.mono("False", 29, BOLD), Arrow(LEFT * 0.35, RIGHT * 0.35, color=BLACK_LINE), self.text("NOT", 24, BOLD), Arrow(LEFT * 0.35, RIGHT * 0.35, color=BLACK_LINE), self.mono("True", 29, BOLD)).arrange(RIGHT, buff=0.20); inversion.next_to(VGroup(not_word, expr2), DOWN, buff=0.38)
        self.play(LaggedStart(*[FadeIn(x) for x in inversion], lag_ratio=0.12), run_time=RUN_NORMAL); self.wait(PAUSE_WORK)
        second = self.mono("not score < 3.0   with score = 4.2   →   True", 25, BOLD).next_to(inversion, DOWN, buff=0.42); self.play(Write(second, rate_func=linear), run_time=RUN_SLOW); self.wait(PAUSE_EXPLAIN)
        summary = self.question_pipeline(["True", "NOT", "False"], sizes=[25, 23, 25]).next_to(second, DOWN, buff=0.36); self.play(FadeIn(summary), run_time=RUN_NORMAL); self.wait(PAUSE_WORK); self.clear_stage()

    def logic_side_by_side(self) -> None:
        self.set_header(11, "AND / OR / NOT SIDE-BY-SIDE", "Keep the meanings simple: both · at least one · invert.")
        cards = VGroup(self.logic_operator_card("AND", "Both", "score >= 3.0 and score <= 5.0"), self.logic_operator_card("OR", "At least one", "score < 3.0 or score >= 4.5"), self.logic_operator_card("NOT", "Invert", "not score < 3.0")).arrange(RIGHT, buff=0.38).move_to(DOWN * 0.25); self.fit(cards, 14.0, 3.0)
        for card in cards:
            self.play(FadeIn(card[0], shift=UP * 0.08), run_time=RUN_QUICK); self.play(Write(card[1][0]), Write(card[1][1]), run_time=RUN_NORMAL); self.play(Write(card[1][2], rate_func=linear), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        self.wait(PAUSE_WORK); self.clear_stage()

    def natural_language_to_python(self) -> None:
        self.set_header(12, "FROM NATURAL LANGUAGE TO PYTHON", "Think in four steps. The syntax comes after the data question.")
        method = self.process_map([("1", "READ THE QUESTION"), ("2", "SEPARATE CONDITIONS"), ("3", "CHOOSE COMPARISONS"), ("4", "CONNECT WITH LOGIC")], columns=4); method.scale(0.90).move_to(UP * 1.55)
        self.play(LaggedStart(*[FadeIn(card, shift=UP * 0.10) for card in method], lag_ratio=0.15), run_time=RUN_SLOW); self.wait(PAUSE_EXPLAIN)
        natural = self.text("A valid score is at least 0 and at most 5.", 30, BOLD).move_to(UP * 0.15); self.play(Write(natural), run_time=RUN_SLOW); self.wait(PAUSE_EXPLAIN)
        c1 = self.mono("score >= 0", 29, BOLD).move_to(LEFT * 2.4 + DOWN * 0.75); and_word = self.mono("and", 28, BOLD).move_to(DOWN * 0.75); c2 = self.mono("score <= 5", 29, BOLD).move_to(RIGHT * 2.4 + DOWN * 0.75)
        self.play(Write(c1), run_time=RUN_NORMAL); self.wait(PAUSE_READ); self.play(Write(c2), run_time=RUN_NORMAL); self.wait(PAUSE_READ); self.play(Write(and_word), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        combined = self.mono("score >= 0 and score <= 5", 30, BOLD).move_to(DOWN * 1.65); self.play(TransformFromCopy(VGroup(c1, and_word, c2), combined), run_time=RUN_SLOW); self.wait(PAUSE_WORK)
        results = VGroup(self.mono("4.2  →  True", 24, BOLD), self.mono("5.5  →  False", 24, BOLD), self.mono("-0.5 →  False", 24, BOLD)).arrange(RIGHT, buff=0.75).next_to(combined, DOWN, buff=0.42)
        for r in results: self.play(Write(r), run_time=RUN_QUICK); self.wait(PAUSE_READ)
        self.wait(PAUSE_WORK); self.clear_stage()

    def parentheses_for_reading(self) -> None:
        self.set_header(13, "PARENTHESES HELP US READ COMPLEX EXPRESSIONS", "Use parentheses to make each question visually clear. We are not memorizing precedence tables.")
        plain = self.mono("score >= 3.0 and score <= 5.0", 31, BOLD).move_to(UP * 1.10); grouped = self.mono("(score >= 3.0) and (score <= 5.0)", 31, BOLD).move_to(UP * 0.05)
        self.play(Write(plain, rate_func=linear), run_time=RUN_NORMAL); self.wait(PAUSE_READ); self.play(TransformFromCopy(plain, grouped), run_time=RUN_SLOW); self.wait(PAUSE_EXPLAIN)
        left_box = SurroundingRectangle(grouped, color=LIGHT_GRAY, buff=0.12, stroke_width=1.8); self.play(Create(left_box), run_time=RUN_QUICK)
        read = self.text("Read it as two questions joined by AND.", 27, BOLD).next_to(grouped, DOWN, buff=0.48); self.play(Write(read), run_time=RUN_SLOW); self.wait(PAUSE_EXPLAIN)
        second = self.mono("(score < 3.0) or (score >= 4.5)", 30, BOLD).next_to(read, DOWN, buff=0.48); second_read = self.text('Read: "below 3 OR at least 4.5."', 25, BOLD).next_to(second, DOWN, buff=0.30)
        self.play(Write(second, rate_func=linear), run_time=RUN_NORMAL); self.wait(PAUSE_READ); self.play(FadeIn(second_read), run_time=RUN_NORMAL); self.wait(PAUSE_WORK); self.clear_stage()

    def workshop_comparisons(self) -> None:
        self.set_header(14, "MINI WORKSHOP 1: PREDICT BEFORE RUNNING", "Question → code → prediction pause → Run → output → interpretation.")
        exercises = [(1, "Is the second score below the pass mark?", "scores[1] < 3.0", "True", "2.8 is below 3.0."), (2, "Is the third score exactly the pass mark?", "scores[2] == 3.0", "True", "3.0 equals the pass mark."), (3, "Is the first score different from 4.2?", "scores[0] != 4.2", "False", "4.2 is not different from 4.2.")]
        for number, question, code, expected, interpretation in exercises:
            panel = self.prediction_panel(number, question, code).move_to(UP * 0.70); self.play(FadeIn(panel[0]), run_time=RUN_QUICK); self.play(FadeIn(panel[1][0]), Write(panel[1][1][0]), run_time=RUN_NORMAL); self.play(Write(panel[1][1][1], rate_func=linear), run_time=RUN_NORMAL)
            predict = self.text("Predict: True or False?", 29, BOLD).next_to(panel, DOWN, buff=0.45); self.play(Write(predict), run_time=RUN_NORMAL); self.wait(PAUSE_WORK)
            cell = self.code_cell([code], width=8.5, min_height=1.25, line_size=27).next_to(predict, DOWN, buff=0.35); self.play(FadeOut(predict), run_time=RUN_QUICK); self.type_cell(cell, line_time=1.0); self.execute_cell(cell, number + 2)
            output = self.output_block([expected], width=3.5, line_size=28).next_to(cell, DOWN, aligned_edge=LEFT, buff=0.20); self.reveal_output(output, pause=PAUSE_READ)
            interp = self.text(f"Interpretation: {interpretation}", 24, BOLD).next_to(output, RIGHT, buff=0.45); self.fit(interp, 8.2, 0.60); self.play(FadeIn(interp, shift=UP * 0.08), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
            self.play(FadeOut(panel), FadeOut(cell), FadeOut(output), FadeOut(interp), run_time=RUN_NORMAL)
        self.wait(PAUSE_SHORT); self.clear_stage()

    def workshop_logic(self) -> None:
        self.set_header(15, "MINI WORKSHOP 2: COMBINED CONDITIONS", "Use the same prediction routine, now with AND, OR and NOT.")
        exercises = [(4, "Is the first score inside the valid range 3.0 to 5.0?", "(scores[0] >= 3.0) and (scores[0] <= 5.0)", "True", "4.2 satisfies both limits."), (5, "Should the second score be flagged by the OR rule?", "(scores[1] < 3.0) or (scores[1] >= 4.5)", "True", "2.8 satisfies the first flag condition."), (6, "Is the fourth score NOT below 3.0?", "not (scores[3] < 3.0)", "True", "4.5 is not below 3.0.")]
        for number, question, code, expected, interpretation in exercises:
            panel = self.prediction_panel(number, question, code).move_to(UP * 0.70); self.play(FadeIn(panel[0]), run_time=RUN_QUICK); self.play(FadeIn(panel[1][0]), Write(panel[1][1][0]), run_time=RUN_NORMAL); self.play(Write(panel[1][1][1], rate_func=linear), run_time=RUN_NORMAL)
            predict = self.text("Predict before running.", 29, BOLD).next_to(panel, DOWN, buff=0.43); self.play(Write(predict), run_time=RUN_NORMAL); self.wait(PAUSE_WORK)
            cell = self.code_cell([code], width=11.3, min_height=1.25, line_size=24).next_to(predict, DOWN, buff=0.34); self.play(FadeOut(predict), run_time=RUN_QUICK); self.type_cell(cell, line_time=1.0); self.execute_cell(cell, number + 3)
            output = self.output_block([expected], width=3.6, line_size=28).next_to(cell, DOWN, aligned_edge=LEFT, buff=0.20); self.reveal_output(output, pause=PAUSE_READ)
            interp = self.text(f"Interpretation: {interpretation}", 23, BOLD).next_to(output, RIGHT, buff=0.42); self.fit(interp, 8.1, 0.60); self.play(FadeIn(interp, shift=UP * 0.08), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
            self.play(FadeOut(panel), FadeOut(cell), FadeOut(output), FadeOut(interp), run_time=RUN_NORMAL)
        self.wait(PAUSE_SHORT); self.clear_stage()

    def integrated_data_example(self) -> None:
        self.set_header(16, "INTEGRATED DATA EXAMPLE", "The same Boolean rule can be applied to different observations — one at a time for now.")
        strip = self.score_strip().move_to(UP * 1.55); self.play(FadeIn(strip[0]), Create(strip[1]), run_time=RUN_NORMAL); self.play(LaggedStart(*[Create(b) for b in strip[2]], lag_ratio=0.08), run_time=RUN_NORMAL); self.play(LaggedStart(*[Write(v) for v in strip[3]], lag_ratio=0.08), run_time=RUN_NORMAL); self.play(LaggedStart(*[Write(i) for i in strip[4]], lag_ratio=0.08), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        goal = self.text("Goal: describe a valid passing score.", 28, BOLD).move_to(UP * 0.40); rule1 = self.mono("score >= 3.0", 30, BOLD).next_to(goal, DOWN, buff=0.26); rule2 = self.mono("(score >= 3.0) and (score <= 5.0)", 30, BOLD).next_to(rule1, DOWN, buff=0.27)
        self.play(Write(goal), run_time=RUN_NORMAL); self.play(Write(rule1), run_time=RUN_NORMAL); self.wait(PAUSE_READ)
        extend = self.text("Extend the rule to include the valid maximum.", 23).next_to(rule1, RIGHT, buff=0.35); self.fit(extend, 5.0, 0.50); self.play(FadeIn(extend), run_time=RUN_QUICK); self.play(Write(rule2, rate_func=linear), run_time=RUN_SLOW); self.wait(PAUSE_EXPLAIN)
        expected = ["True", "False", "True", "True", "True"]; result_row = VGroup()
        for value, result in zip(SCORES, expected):
            val = self.mono(str(value), 25, BOLD); arrow = Arrow(LEFT * 0.26, RIGHT * 0.26, color=BLACK_LINE, stroke_width=1.6); badge = self.result_badge(result, width=1.70); result_row.add(VGroup(val, arrow, badge).arrange(RIGHT, buff=0.13))
        result_row.arrange(RIGHT, buff=0.28).move_to(DOWN * 1.78); self.fit(result_row, 14.0, 0.90)
        for item in result_row:
            self.play(Write(item[0]), Create(item[1]), run_time=RUN_QUICK); self.wait(PAUSE_SHORT); self.play(Create(item[2][0]), Write(item[2][1]), run_time=RUN_QUICK); self.wait(PAUSE_READ)
        key = self.text("THE SAME RULE can be applied to DIFFERENT OBSERVATIONS.", 27, BOLD).next_to(result_row, DOWN, buff=0.38); self.play(Write(key), run_time=RUN_SLOW); self.wait(PAUSE_WORK); self.clear_stage()

    def common_errors(self) -> None:
        self.set_header(17, "COMMON ERRORS: DEBUG THE QUESTION", "False can be a correct result. Syntax errors and logic errors are different problems.")
        errors = [("score = 3.0", "score == 3.0", "Use == when asking equality."), ("score => 3.0", "score >= 3.0", "Write >= in this order."), ("score =< 5.0", "score <= 5.0", "Write <= in this order."), ("score is greater than 3", "score > 3", "Translate the sentence into an operator."), ("and when only one is needed", "or", "Choose the connector from the data rule."), ("False = Python failed", "False = valid Boolean evidence", "False is not an execution error.")]
        y_positions = [1.55, 0.78, 0.01, -0.76, -1.53, -2.30]
        for i, ((wrong, correct, note), y) in enumerate(zip(errors, y_positions), start=1):
            num = self.text(f"{i}", 20, BOLD); wrong_m = self.mono(wrong, 21, MEDIUM); arrow = Arrow(LEFT * 0.32, RIGHT * 0.32, color=BLACK_LINE, stroke_width=1.5); correct_m = self.mono(correct, 21, BOLD); note_m = self.text(note, 19); row = VGroup(num, wrong_m, arrow, correct_m, note_m).arrange(RIGHT, buff=0.22); self.fit(row, 14.0, 0.54); row.move_to(np.array([0, y, 0]))
            self.play(FadeIn(num), Write(wrong_m, rate_func=linear), run_time=RUN_QUICK); self.wait(PAUSE_SHORT); self.play(Create(arrow), Write(correct_m, rate_func=linear), run_time=RUN_QUICK); self.play(FadeIn(note_m), run_time=RUN_QUICK); self.wait(PAUSE_EXPLAIN if i in (1, 5, 6) else PAUSE_READ)
        self.wait(PAUSE_WORK); self.clear_stage()

    def final_challenge(self) -> None:
        self.set_header(18, "FINAL CHALLENGE", "Build the Boolean rule from the question before evaluating it.")
        score = self.neutral_card("new observation", "4.7", width=3.3).move_to(UP * 1.60); self.play(FadeIn(score), run_time=RUN_NORMAL)
        q = self.text("Is the score passing AND below 4.5?", 31, BOLD).next_to(score, DOWN, buff=0.38); self.play(Write(q), run_time=RUN_SLOW); self.wait(PAUSE_WORK)
        step1 = self.mono("1. passing       →  score >= 3.0", 28, BOLD).move_to(UP * 0.10); step2 = self.mono("2. below 4.5     →  score < 4.5", 28, BOLD).next_to(step1, DOWN, buff=0.30); step3 = self.mono("3. combine       →  (score >= 3.0) and (score < 4.5)", 27, BOLD).next_to(step2, DOWN, buff=0.30); self.fit(step3, 13.0, 0.60)
        self.play(Write(step1, rate_func=linear), run_time=RUN_NORMAL); self.wait(PAUSE_READ); self.play(Write(step2, rate_func=linear), run_time=RUN_NORMAL); self.wait(PAUSE_READ); self.play(Write(step3, rate_func=linear), run_time=RUN_SLOW); self.wait(PAUSE_WORK)
        eval_line = self.mono("True and False", 31, BOLD).next_to(step3, DOWN, buff=0.42); self.play(FadeIn(eval_line, shift=UP * 0.08), run_time=RUN_NORMAL); self.wait(PAUSE_WORK)
        result = self.result_badge("False").next_to(eval_line, RIGHT, buff=0.50); self.play(Create(result[0]), Write(result[1]), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        interpretation = self.text("The score passes, but it is not below 4.5. AND requires both conditions.", 24, BOLD).next_to(eval_line, DOWN, buff=0.36); self.fit(interpretation, 13.5, 0.62); self.play(Write(interpretation), run_time=RUN_SLOW); self.wait(PAUSE_FINAL); self.clear_stage()

    def summary(self) -> None:
        self.set_header(19, "SUMMARY: BUILD A DATA RULE", "Comparisons answer one question. Logical operators combine questions into a reusable rule.")
        cards = VGroup(self.note_panel("1 · COMPARISON", [">  <  >=  <=  ==  !=", "asks ONE question"], width=3.25, title_size=22, body_size=20), self.note_panel("2 · BOOLEAN", ["True / False", "is the answer"], width=3.25, title_size=22, body_size=20), self.note_panel("3 · LOGIC", ["and = both", "or = at least one", "not = invert"], width=3.25, title_size=22, body_size=20), self.note_panel("4 · DATA", ["Apply the rule", "to observations"], width=3.25, title_size=22, body_size=20)).arrange(RIGHT, buff=0.28).move_to(UP * 0.65); self.fit(cards, 14.2, 2.75)
        self.play(LaggedStart(*[FadeIn(c, shift=UP * 0.10) for c in cards], lag_ratio=0.18), run_time=RUN_SLOW); self.wait(PAUSE_EXPLAIN)
        pipeline = self.question_pipeline(["DATA", "COMPARISON", "True / False", "LOGICAL RULE", "NEXT: DECISION"], sizes=[20, 20, 21, 20, 20]).move_to(DOWN * 1.40); self.play(LaggedStart(*[FadeIn(x) for x in pipeline], lag_ratio=0.08), run_time=RUN_NORMAL); self.wait(PAUSE_FINAL); self.clear_stage()

    def bridge_next_lesson(self) -> None:
        self.set_header(20, "BRIDGE TO THE NEXT LESSON", "Today Python answered questions. Next, Python will use those answers to make decisions.")
        first = self.question_pipeline(["comparison", "True / False"], sizes=[27, 29]).move_to(UP * 1.25); second = self.question_pipeline(["Boolean rule", "True / False"], sizes=[27, 29]).move_to(UP * 0.15)
        self.play(LaggedStart(*[FadeIn(x) for x in first], lag_ratio=0.15), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN); self.play(LaggedStart(*[FadeIn(x) for x in second], lag_ratio=0.15), run_time=RUN_NORMAL); self.wait(PAUSE_EXPLAIN)
        next_label = self.text("NEXT", 28, BOLD).move_to(DOWN * 0.90); preview = self.mono("if condition:\n    ...", 31, BOLD).next_to(next_label, DOWN, buff=0.28)
        self.play(Write(next_label), run_time=RUN_NORMAL); self.play(Write(preview, rate_func=linear), run_time=RUN_SLOW); self.wait(PAUSE_READ); self.play(FadeOut(preview), run_time=RUN_NORMAL)
        final = self.text("If the rule is True, what should Python DO?", 30, BOLD).move_to(DOWN * 1.80); self.play(Write(final), run_time=RUN_SLOW); self.wait(PAUSE_FINAL)
        self.standard_closing("LIST → OBSERVATION → QUESTION → BOOLEAN RULE → NEXT: DECISION")
