#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Statistics 11 — Comparison operators in a Colab-inspired interface.

Senior-QA teaching sequence.
Focus:
1) tour the notebook interface students actually use,
2) connect comparisons with statistical questions,
3) distinguish assignment (=) from equality (==),
4) introduce >, <, >=, <=, ==, != one by one,
5) make Boolean outputs visible and meaningful,
6) reuse arrays/lists by comparing indexed observations,
7) finish with a short prediction-and-code workshop.

Target: ManimCE 0.20.1
"""

from __future__ import annotations

from library.jp_classroom_style import *


SCORES = [4.2, 2.8, 3.0, 4.5, 3.7]
PASS_MARK = 3.0
A_VALUE = 12
B_VALUE = 18


class Stat11ComparisonsColabClass(JPMathClassroomScene):
    """Comparison operators taught through a realistic Colab-like workflow."""

    def validate_lesson_data(self) -> None:
        assert SCORES == [4.2, 2.8, 3.0, 4.5, 3.7]
        assert PASS_MARK == 3.0
        assert SCORES[0] >= PASS_MARK
        assert SCORES[1] < PASS_MARK
        assert SCORES[2] == PASS_MARK
        assert A_VALUE < B_VALUE

    # ------------------------------------------------------------------
    # Colab-inspired visual components
    # ------------------------------------------------------------------
    def colab_window(self, title: str, body: Mobject, *, width: float = 14.3, height: float = 5.35) -> VGroup:
        """Notebook window inspired by the current Colab layout, simplified for projection."""
        outer = RoundedRectangle(
            width=width,
            height=height,
            corner_radius=0.14,
            stroke_color=LIGHT_GRAY,
            stroke_width=1.8,
            fill_color=WHITE_FILL,
            fill_opacity=1.0,
        )

        logo_box = RoundedRectangle(
            width=0.70,
            height=0.46,
            corner_radius=0.10,
            stroke_color=BLUE_D,
            stroke_width=1.8,
            fill_color=WHITE_FILL,
            fill_opacity=1.0,
        )
        logo = self.text("CO", 17, BOLD, BLUE_D).move_to(logo_box)
        notebook_title = self.text(title, 23, BOLD)
        top_left = VGroup(VGroup(logo_box, logo), notebook_title).arrange(RIGHT, buff=0.18)

        connect_box = RoundedRectangle(
            width=1.52,
            height=0.46,
            corner_radius=0.18,
            stroke_color=BLUE_D,
            stroke_width=1.7,
            fill_color=WHITE_FILL,
            fill_opacity=1.0,
        )
        connect = self.text("Connect", 17, BOLD, BLUE_D).move_to(connect_box)
        top_right = VGroup(connect_box, connect)

        top_left.move_to(outer.get_top() + DOWN * 0.38 + LEFT * (width / 2 - 3.15))
        top_right.move_to(outer.get_top() + DOWN * 0.38 + RIGHT * (width / 2 - 1.05))

        menu = VGroup(*[
            self.text(label, 16, MEDIUM)
            for label in ["File", "Edit", "View", "Insert", "Runtime", "Tools", "Help"]
        ]).arrange(RIGHT, buff=0.28)
        menu.align_to(top_left, LEFT).shift(DOWN * 0.56)

        code_btn = RoundedRectangle(
            width=1.10,
            height=0.40,
            corner_radius=0.13,
            stroke_color=LIGHT_GRAY,
            stroke_width=1.4,
            fill_color=PAPER_GRAY,
            fill_opacity=1.0,
        )
        code_txt = self.text("+ Code", 16, BOLD).move_to(code_btn)
        text_btn = RoundedRectangle(
            width=1.08,
            height=0.40,
            corner_radius=0.13,
            stroke_color=LIGHT_GRAY,
            stroke_width=1.4,
            fill_color=PAPER_GRAY,
            fill_opacity=1.0,
        )
        text_txt = self.text("+ Text", 16, BOLD).move_to(text_btn)
        toolbar = VGroup(VGroup(code_btn, code_txt), VGroup(text_btn, text_txt)).arrange(RIGHT, buff=0.16)
        toolbar.next_to(menu, DOWN, aligned_edge=LEFT, buff=0.12)

        divider = Line(
            outer.get_left() + RIGHT * 0.18,
            outer.get_right() + LEFT * 0.18,
            color=LIGHT_GRAY,
            stroke_width=1.2,
        )
        divider.set_y(toolbar.get_bottom()[1] - 0.16)

        rail = VGroup()
        for lab in ["TOC", "F", "V"]:
            box = RoundedRectangle(
                width=0.62,
                height=0.48,
                corner_radius=0.08,
                stroke_color=LIGHT_GRAY,
                stroke_width=1.2,
                fill_color=WHITE_FILL,
                fill_opacity=1.0,
            )
            txt = self.text(lab, 12 if lab == "TOC" else 15, BOLD).move_to(box)
            rail.add(VGroup(box, txt))
        rail.arrange(DOWN, buff=0.16)
        rail.move_to(outer.get_left() + RIGHT * 0.48 + DOWN * 0.55)

        body.move_to(outer).shift(RIGHT * 0.43 + DOWN * 0.62)
        self.fit(body, width - 1.65, height - 1.85)

        return VGroup(outer, top_left, top_right, menu, toolbar, divider, rail, body)

    def code_cell(
        self,
        lines: list[str],
        *,
        exec_label: str = "[ ]",
        width: float = 8.7,
        line_size: int = 25,
        min_height: float = 1.55,
    ) -> VGroup:
        """Code cell with play button, execution counter, and editor region."""
        editor_lines = VGroup(*[self.text(line, line_size, MEDIUM) for line in lines])
        editor_lines.arrange(DOWN, aligned_edge=LEFT, buff=0.14)
        self.fit(editor_lines, width - 1.25, 3.55)

        box = RoundedRectangle(
            width=width,
            height=max(min_height, editor_lines.height + 0.52),
            corner_radius=0.10,
            stroke_color=LIGHT_GRAY,
            stroke_width=1.6,
            fill_color=VERY_LIGHT_GRAY,
            fill_opacity=0.62,
        )

        play_circle = Circle(
            radius=0.19,
            stroke_color=BLUE_D,
            stroke_width=1.8,
            fill_color=WHITE_FILL,
            fill_opacity=1.0,
        )
        play_tri = Triangle(
            stroke_color=BLUE_D,
            fill_color=BLUE_D,
            fill_opacity=1.0,
        ).scale(0.068).rotate(-PI / 2)
        play = VGroup(play_circle, play_tri)

        count = self.text(exec_label, 16, MEDIUM)
        gutter = VGroup(play, count).arrange(DOWN, buff=0.14)
        gutter.move_to(box.get_left() + RIGHT * 0.44)

        editor_lines.move_to(box).align_to(box, LEFT).shift(RIGHT * 1.02)
        return VGroup(box, gutter, editor_lines)

    def output_block(self, lines: list[str], *, width: float = 7.7, line_size: int = 24) -> VGroup:
        output_lines = VGroup(*[self.text(line, line_size, MEDIUM) for line in lines])
        output_lines.arrange(DOWN, aligned_edge=LEFT, buff=0.12)
        self.fit(output_lines, width - 0.55, 2.2)
        box = RoundedRectangle(
            width=width,
            height=max(0.78, output_lines.height + 0.40),
            corner_radius=0.08,
            stroke_color=LIGHT_GRAY,
            stroke_width=1.3,
            fill_color=WHITE_FILL,
            fill_opacity=1.0,
        )
        output_lines.move_to(box).align_to(box, LEFT).shift(RIGHT * 0.24)
        return VGroup(box, output_lines)

    def type_cell(self, cell: VGroup, *, line_time: float = 0.85, between: float = 0.24, zoom_width: float | None = None) -> None:
        """Build the cell shell and type code line by line."""
        box, gutter, lines = cell
        self.play(Create(box), FadeIn(gutter), run_time=RUN_QUICK)
        if zoom_width:
            self.camera.frame.save_state()
            self.play(self.camera.frame.animate.set(width=zoom_width).move_to(cell), run_time=RUN_CAMERA)
        for line in lines:
            self.play(Write(line), run_time=line_time)
            self.wait(between)
        if zoom_width:
            self.play(Restore(self.camera.frame), run_time=RUN_CAMERA)

    def execute_cell(self, cell: VGroup, *, number: int) -> None:
        """Pulse the Colab run button and change [ ] into an execution number."""
        play = cell[1][0]
        old_count = cell[1][1]
        new_count = self.text(f"[{number}]", 16, MEDIUM).move_to(old_count)
        self.play(Indicate(play, scale_factor=1.20), run_time=0.50)
        self.play(Transform(old_count, new_count), run_time=0.35)

    def reveal_output(self, block: VGroup, *, pause: float = PAUSE_READ) -> None:
        self.play(Create(block[0]), run_time=RUN_QUICK)
        self.play(LaggedStart(*[Write(x) for x in block[1]], lag_ratio=0.16), run_time=RUN_NORMAL)
        self.wait(pause)

    def colab_interface_tour(self) -> VGroup:
        """Return a full notebook mockup for the explicit UI tour."""
        sample = self.code_cell([
            "score = 4.2",
            "score >= 3.0",
        ], exec_label="[ ]", width=9.4, line_size=24, min_height=1.85)
        out = self.output_block(["True"], width=4.3, line_size=24)
        body = VGroup(sample, out).arrange(DOWN, aligned_edge=LEFT, buff=0.20)
        notebook = self.colab_window("Statistics11_Comparisons.ipynb", body, width=14.2, height=5.35)
        return notebook

    def boolean_badge(self, value: bool, *, width: float = 2.1) -> VGroup:
        box = RoundedRectangle(
            width=width,
            height=0.72,
            corner_radius=0.13,
            stroke_color=BLACK_LINE,
            stroke_width=1.6,
            fill_color=VERY_LIGHT_GRAY,
            fill_opacity=1.0,
        )
        text = self.text("True" if value else "False", 27, BOLD).move_to(box)
        return VGroup(box, text)

    def operator_card(self, symbol: str, name: str, example: str) -> VGroup:
        sym = self.text(symbol, 34, BOLD, BLUE_D)
        label = self.text(name, 20, BOLD)
        ex = self.text(example, 18, MEDIUM)
        content = VGroup(sym, label, ex).arrange(DOWN, buff=0.10)
        box = RoundedRectangle(
            width=4.25,
            height=1.45,
            corner_radius=0.12,
            stroke_color=LIGHT_GRAY,
            stroke_width=1.5,
            fill_color=WHITE_FILL,
            fill_opacity=1.0,
        )
        content.move_to(box)
        return VGroup(box, content)

    def score_strip(self, *, highlight: tuple[int, ...] = ()) -> VGroup:
        boxes = VGroup()
        labels = VGroup()
        idx = VGroup()
        for i, value in enumerate(SCORES):
            fill = VERY_LIGHT_GRAY if i in highlight else WHITE_FILL
            box = RoundedRectangle(
                width=1.12,
                height=0.78,
                corner_radius=0.08,
                stroke_color=BLACK_LINE,
                stroke_width=1.5,
                fill_color=fill,
                fill_opacity=1.0,
            )
            val = self.text(str(value), 24, BOLD).move_to(box)
            ind = self.text(str(i), 16, MEDIUM).next_to(box, DOWN, buff=0.08)
            boxes.add(box)
            labels.add(val)
            idx.add(ind)
        boxes.arrange(RIGHT, buff=0.10)
        for i, box in enumerate(boxes):
            labels[i].move_to(box)
            idx[i].next_to(box, DOWN, buff=0.08)
        title = self.text("scores", 26, BOLD)
        title.next_to(boxes, LEFT, buff=0.25)
        arrow = Arrow(title.get_right(), boxes.get_left(), buff=0.07, stroke_width=1.8, color=BLACK_LINE)
        return VGroup(title, arrow, boxes, labels, idx)

    # ------------------------------------------------------------------
    # Scene flow
    # ------------------------------------------------------------------
    def construct(self) -> None:
        self.opening()
        self.interface_first()
        self.why_compare()
        self.assignment_vs_equality()
        self.operator_family()
        self.boolean_results()
        self.compare_array_values()
        self.mini_workshop()
        self.summary()

    def opening(self) -> None:
        self.standard_opening(
            "STATISTICS 11 · PYTHON / COLAB",
            "COMPARISON OPERATORS",
            "Turn data questions into True / False expressions",
            "Colab interface · live typing · execute · interpret",
        )

    def interface_first(self) -> None:
        self.set_header(
            1,
            "FIRST: UNDERSTAND THE COLAB WORKSPACE",
            "Before learning a new operator, identify where code is written, executed, and read in a notebook.",
        )
        notebook = self.colab_interface_tour()
        notebook.move_to(DOWN * 0.45)
        self.assert_content_safe(notebook, "colab interface")

        # Build outer notebook, then reveal interface regions in the order students use them.
        self.play(Create(notebook[0]), run_time=RUN_NORMAL)
        self.play(FadeIn(notebook[1]), FadeIn(notebook[2]), run_time=RUN_NORMAL)
        self.play(FadeIn(notebook[3]), FadeIn(notebook[4]), Create(notebook[5]), run_time=RUN_NORMAL)
        self.play(FadeIn(notebook[6]), run_time=RUN_QUICK)
        self.wait(PAUSE_READ)

        body = notebook[7]
        cell = body[0]
        output = body[1]
        self.type_cell(cell, line_time=0.85, between=0.25, zoom_width=10.4)
        self.execute_cell(cell, number=1)
        self.reveal_output(output, pause=PAUSE_READ)

        labels = [
            (notebook[1], "Notebook name"),
            (notebook[3], "Menus"),
            (notebook[4], "+ Code / + Text"),
            (cell[1][0], "Run ▶"),
            (cell[1][1], "Execution count"),
            (output, "Output"),
            (notebook[2], "Runtime connection"),
        ]
        for target, text in labels:
            call = self.text(text, 18, BOLD, BLUE_D)
            call.next_to(target, UP, buff=0.10)
            if call.get_top()[1] > 3.32:
                call.next_to(target, DOWN, buff=0.10)
            self.play(Indicate(target, scale_factor=1.05), FadeIn(call), run_time=0.55)
            self.wait(0.28)
            self.play(FadeOut(call), run_time=0.22)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def why_compare(self) -> None:
        self.set_header(
            2,
            "WHY DO WE NEED COMPARISONS?",
            "In statistics, many questions ask whether a value satisfies a rule, threshold, or relationship.",
        )

        questions = self.process_map(
            [
                ("1", "Is the score at least 3.0?"),
                ("2", "Is measurement A smaller than B?"),
                ("3", "Are two values exactly equal?"),
                ("4", "Is a value different from the limit?"),
            ],
            card_width=5.7,
            card_height=1.05,
            columns=2,
        )
        questions.move_to(UP * 0.55)
        bridge = self.formula_panel(
            r"\text{data question} \longrightarrow \text{comparison expression} \longrightarrow \text{True or False}",
            width=11.8,
            height=1.12,
            font_size=32,
        )
        bridge.move_to(DOWN * 2.38)
        self.assert_content_safe(VGroup(questions, bridge), "why compare")
        self.play(LaggedStart(*[FadeIn(card, shift=UP * 0.08) for card in questions], lag_ratio=0.14), run_time=RUN_SLOW * 1.7)
        self.wait(PAUSE_WORK)
        self.play(FadeIn(bridge), run_time=RUN_NORMAL)
        self.wait(PAUSE_SUMMARY)
        self.clear_stage()

    def assignment_vs_equality(self) -> None:
        self.set_header(
            3,
            "CRITICAL DIFFERENCE: = IS NOT ==",
            "Assignment stores a value. Equality asks a question and returns a Boolean result.",
        )

        assign = self.code_cell(["score = 4.2"], exec_label="[ ]", width=6.0, line_size=28, min_height=1.45)
        assign_note = self.note_panel(
            "ASSIGNMENT",
            ["Store 4.2 inside score.", "No True/False question yet."],
            width=5.4,
            title_size=23,
            body_size=21,
        )
        left = VGroup(assign, assign_note).arrange(DOWN, buff=0.32)

        equal = self.code_cell(["score == 4.2"], exec_label="[ ]", width=6.0, line_size=28, min_height=1.45)
        result = self.boolean_badge(True)
        eq_note = self.note_panel(
            "EQUALITY TEST",
            ["Ask: is score equal to 4.2?", "Python answers True."],
            width=5.4,
            title_size=23,
            body_size=21,
        )
        right = VGroup(equal, result, eq_note).arrange(DOWN, buff=0.25)

        layout = self.split_layout(left, right, center_y=-0.55)
        self.assert_content_safe(layout.group, "assignment vs equality")

        self.type_cell(assign, line_time=1.05, between=0.20, zoom_width=7.0)
        self.execute_cell(assign, number=1)
        self.play(FadeIn(assign_note), run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)

        self.type_cell(equal, line_time=1.10, between=0.20, zoom_width=7.0)
        # Emphasize the double equals visually.
        self.play(Indicate(equal[2][0], scale_factor=1.10), run_time=RUN_NORMAL)
        self.execute_cell(equal, number=2)
        self.play(FadeIn(result, scale=0.92), run_time=RUN_NORMAL)
        self.play(FadeIn(eq_note), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def operator_family(self) -> None:
        self.set_header(
            4,
            "THE SIX COMPARISON OPERATORS",
            "Read each expression like a question. Python evaluates the relationship and returns True or False.",
        )
        cards = VGroup(
            self.operator_card(">", "greater than", "4.2 > 3.0"),
            self.operator_card("<", "less than", "2.8 < 3.0"),
            self.operator_card(">=", "greater or equal", "3.0 >= 3.0"),
            self.operator_card("<=", "less or equal", "2.8 <= 3.0"),
            self.operator_card("==", "equal to", "3.0 == 3.0"),
            self.operator_card("!=", "not equal to", "4.2 != 3.0"),
        )
        cards.arrange_in_grid(rows=2, cols=3, buff=(0.28, 0.34))
        cards.move_to(DOWN * 0.35)
        self.assert_content_safe(cards, "operators")
        self.play(LaggedStart(*[FadeIn(card, shift=UP * 0.06) for card in cards], lag_ratio=0.12), run_time=RUN_SLOW * 2.0)
        for card in cards:
            self.play(Indicate(card[1][0], scale_factor=1.16), run_time=0.38)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def boolean_results(self) -> None:
        self.set_header(
            5,
            "COMPARISONS PRODUCE BOOLEAN DATA",
            "The result of a comparison has type bool: True or False. It can also be stored in a variable.",
        )

        cell = self.code_cell([
            "score = 4.2",
            "passed = score >= 3.0",
            "print(passed)",
            "print(type(passed).__name__)",
        ], exec_label="[ ]", width=8.0, line_size=24, min_height=3.00)
        output = self.output_block(["True", "bool"], width=3.5, line_size=24)
        note = self.note_panel(
            "INTERPRETATION",
            [
                "passed is now a Boolean variable.",
                "It stores the answer to a data question.",
                "No if/else is needed yet.",
            ],
            width=5.5,
            title_size=23,
            body_size=21,
        )
        right = VGroup(output, note).arrange(DOWN, buff=0.36)
        layout = self.split_layout(cell, right, center_y=-0.55)
        self.assert_content_safe(layout.group, "boolean result")

        self.type_cell(cell, line_time=0.78, between=0.24, zoom_width=8.8)
        self.execute_cell(cell, number=3)
        self.reveal_output(output, pause=PAUSE_READ)
        self.play(FadeIn(note), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def compare_array_values(self) -> None:
        self.set_header(
            6,
            "CONNECT COMPARISONS WITH ARRAYS / LISTS",
            "Use indexes to select observations, then compare the selected values.",
        )

        strip = self.score_strip(highlight=(1, 3))
        strip.scale(0.98)
        strip.move_to(UP * 1.25)

        cell = self.code_cell([
            "scores = [4.2, 2.8, 3.0, 4.5, 3.7]",
            "scores[3] > scores[1]",
        ], exec_label="[ ]", width=9.6, line_size=24, min_height=2.15)
        output = self.output_block(["True"], width=2.9, line_size=25)
        code_stack = VGroup(cell, output).arrange(DOWN, aligned_edge=LEFT, buff=0.22)
        code_stack.move_to(DOWN * 1.15)
        self.assert_content_safe(VGroup(strip, code_stack), "array comparison")

        # Construct the list first so the comparison has a concrete visual reference.
        self.play(FadeIn(strip[0]), GrowArrow(strip[1]), run_time=RUN_NORMAL)
        for i in range(len(SCORES)):
            self.play(Create(strip[2][i]), Write(strip[3][i]), FadeIn(strip[4][i]), run_time=0.42)
        self.wait(PAUSE_READ)
        self.type_cell(cell, line_time=0.88, between=0.28, zoom_width=10.0)
        self.play(Indicate(strip[2][3], scale_factor=1.16), Indicate(strip[2][1], scale_factor=1.16), run_time=RUN_NORMAL)
        self.execute_cell(cell, number=4)
        self.reveal_output(output, pause=PAUSE_READ)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def mini_workshop(self) -> None:
        self.set_header(
            7,
            "MINI WORKSHOP — PREDICT BEFORE YOU RUN",
            "Students should say the expected Boolean result first, then use Colab to verify it.",
        )

        prompt1 = self.prompt_card(
            "1",
            "Given score = 2.8, write a comparison that asks whether the score passed a 3.0 threshold.",
            width=13.0,
            body_size=24,
        )
        prompt1.move_to(UP * 1.90)
        cell1 = self.code_cell([
            "score = 2.8",
            "score >= 3.0",
        ], exec_label="[ ]", width=6.6, line_size=27, min_height=2.0)
        out1 = self.output_block(["False"], width=2.9, line_size=25)
        note1 = self.note_panel(
            "WHY?",
            ["2.8 is less than 3.0.", "Therefore 2.8 >= 3.0 is False."],
            width=5.6,
            title_size=23,
            body_size=21,
        )
        right1 = VGroup(out1, note1).arrange(DOWN, buff=0.30)
        layout1 = self.split_layout(cell1, right1, center_y=-0.78)
        self.assert_content_safe(VGroup(prompt1, layout1.group), "workshop 1")
        self.play(FadeIn(prompt1), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.type_cell(cell1, line_time=0.92, between=0.30, zoom_width=8.0)
        self.execute_cell(cell1, number=5)
        self.reveal_output(out1, pause=PAUSE_READ)
        self.play(FadeIn(note1), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

        self.set_header(
            7,
            "MINI WORKSHOP — EQUALITY AND NOT-EQUAL",
            "Use == when asking if two values match, and != when asking if they are different.",
        )
        prompt2 = self.prompt_card(
            "2",
            "Predict both outputs before running: 3.0 == 3.0 and 4.2 != 3.0.",
            width=12.5,
            body_size=25,
        )
        prompt2.move_to(UP * 1.82)
        cell2 = self.code_cell([
            "3.0 == 3.0",
            "4.2 != 3.0",
        ], exec_label="[ ]", width=6.2, line_size=28, min_height=2.0)
        out2 = self.output_block(["True", "True"], width=2.9, line_size=25)
        rules = self.note_panel(
            "READ THE SYMBOLS",
            ["==  asks: equal?", "!=  asks: different?"],
            width=5.5,
            title_size=23,
            body_size=22,
        )
        right2 = VGroup(out2, rules).arrange(DOWN, buff=0.30)
        layout2 = self.split_layout(cell2, right2, center_y=-0.75)
        self.assert_content_safe(VGroup(prompt2, layout2.group), "workshop 2")
        self.play(FadeIn(prompt2), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.type_cell(cell2, line_time=0.95, between=0.32, zoom_width=7.6)
        self.execute_cell(cell2, number=6)
        self.reveal_output(out2, pause=PAUSE_READ)
        self.play(FadeIn(rules), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def summary(self) -> None:
        self.set_header(
            8,
            "FINAL TAKEAWAY",
            "A comparison converts a relationship between values into Boolean data: True or False.",
        )

        route = self.process_map(
            [
                ("1", "WRITE / SELECT VALUES"),
                ("2", "COMPARE WITH > < >= <= == !="),
                ("3", "RUN THE COLAB CELL"),
                ("4", "INTERPRET TRUE / FALSE"),
            ],
            card_width=3.15,
            card_height=1.10,
            columns=4,
        )
        route.move_to(UP * 1.05)

        final_cell = self.code_cell([
            "score = 4.2",
            "passed = score >= 3.0",
            "passed",
        ], exec_label="[ ]", width=7.2, line_size=26, min_height=2.45)
        final_output = self.output_block(["True"], width=2.9, line_size=25)
        pair = VGroup(final_cell, final_output).arrange(DOWN, aligned_edge=LEFT, buff=0.20)
        pair.move_to(DOWN * 1.12)

        next_note = self.formula_panel(
            r"\text{Next bridge: comparisons} \rightarrow \text{logical conditions and data filtering}",
            width=10.4,
            height=1.02,
            font_size=32,
        )
        next_note.move_to(DOWN * 3.35)
        self.assert_content_safe(VGroup(route, pair, next_note), "summary")

        self.play(LaggedStart(*[FadeIn(card) for card in route], lag_ratio=0.12), run_time=RUN_SLOW * 1.8)
        self.wait(PAUSE_READ)
        self.type_cell(final_cell, line_time=0.88, between=0.28, zoom_width=8.0)
        self.execute_cell(final_cell, number=7)
        self.reveal_output(final_output, pause=PAUSE_READ)
        self.play(FadeIn(next_note), run_time=RUN_NORMAL)
        self.wait(PAUSE_FINAL)
        self.standard_closing(
            "Comparison operators let Python answer data questions with True or False."
        )


# Preview gate:
# manim -pql stat11_comparisons_colab.py Stat11ComparisonsColabClass --format=mp4 --disable_caching
# Final gate:
# manim -pqh stat11_comparisons_colab.py Stat11ComparisonsColabClass --format=mp4 --disable_caching
