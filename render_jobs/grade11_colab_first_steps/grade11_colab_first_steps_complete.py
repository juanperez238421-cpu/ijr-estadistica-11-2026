from __future__ import annotations

"""Grade 11 - Google Colab and Python First Steps.

A complete introductory ManimCE lesson using the established Colab visual
language. The animation teaches the interface, cell anatomy, comments,
variables, arithmetic, strings, comparisons, Boolean logic, conditionals,
debugging, file upload, Pandas loading, and responsible saving/sharing.

Render scenes:
    Grade11ColabFirstStepsComplete
    Grade11ColabFirstStepsCompletePreview

Compatible with ManimCE 0.20.1.
"""

import os
from pathlib import Path

from statistics11_colab_data_analysis_foundations import *


LESSON_STAGES = ("ORIENT", "CELLS", "PYTHON", "LOGIC", "FILES", "SAVE")
FAST_PREVIEW = os.getenv("COLAB_FIRST_STEPS_SHORT_PAUSES", "0").strip() == "1"


def lesson_pause(seconds: float) -> float:
    return min(0.75, seconds * 0.18) if FAST_PREVIEW else seconds


class FirstStepsRibbon(VGroup):
    """Small stage indicator that remains inside the 16:9 safe area."""

    def __init__(self, active: int, **kwargs) -> None:
        super().__init__(**kwargs)
        baseline = Line(LEFT * 5.55, RIGHT * 5.55, color=LINE, stroke_width=2)
        xs = np.linspace(-5.55, 5.55, len(LESSON_STAGES))
        nodes = VGroup()
        labels = VGroup()
        for index, (x, label) in enumerate(zip(xs, LESSON_STAGES)):
            current = index == active
            complete = index < active
            color = BLUE if current else (GREEN if complete else LINE)
            dot = Circle(
                radius=0.105 if current else 0.083,
                stroke_color=color,
                stroke_width=2,
                fill_color=color if current or complete else WHITE,
                fill_opacity=1,
            ).move_to([x, 0, 0])
            text = fit_text(
                label,
                font_size=13,
                color=BLUE if current else (GREEN if complete else MUTED),
                weight="BOLD" if current else "NORMAL",
            )
            text.next_to(dot, DOWN, buff=0.08)
            nodes.add(dot)
            labels.add(text)
        self.add(baseline, nodes, labels)


class TextCellVisual(VGroup):
    """Simplified Colab Markdown/text cell with editor and rendered preview."""

    def __init__(
        self,
        source: str,
        rendered_lines: list[tuple[str, str, int]],
        *,
        width: float = 11.2,
        height: float = 3.35,
        show_source: bool = True,
        **kwargs,
    ) -> None:
        super().__init__(**kwargs)
        box = panel(width, height, fill=WHITE, stroke=GREEN, stroke_width=1.45, radius=0.09)
        label_box = panel(1.05, 0.34, fill=SOFT_GREEN, stroke=GREEN, stroke_width=1.0, radius=0.14)
        label = fit_text("TEXT", font_size=13, color=GREEN, weight="BOLD").move_to(label_box)
        badge = VGroup(label_box, label)
        badge.move_to(box.get_top() + DOWN * 0.25 + LEFT * (width / 2 - 0.75))

        parts: list[Mobject] = [box, badge]
        if show_source:
            divider = Line(ORIGIN, DOWN * (height - 0.50), color=LINE, stroke_width=1.0)
            divider.move_to(box.get_center())
            source_title = fit_text("MARKDOWN SOURCE", font_size=14, color=MUTED, weight="BOLD")
            source_text = Text(source, font=CODE_FONT, font_size=20, color=INK, line_spacing=0.82)
            if source_text.width > width * 0.43:
                source_text.scale_to_fit_width(width * 0.43)
            source_group = VGroup(source_title, source_text).arrange(DOWN, aligned_edge=LEFT, buff=0.20)
            source_group.move_to(box.get_center() + LEFT * (width * 0.25) + DOWN * 0.05)
            source_group.align_to(box.get_left() + RIGHT * 0.42, LEFT)
            parts.extend([divider, source_group])
            rendered_x = width * 0.25
            rendered_width = width * 0.43
        else:
            rendered_x = 0
            rendered_width = width - 0.9

        rendered = VGroup()
        for text, color, size in rendered_lines:
            rendered.add(fit_text(text, font_size=size, color=color, max_width=rendered_width, line_spacing=0.90))
        rendered.arrange(DOWN, aligned_edge=LEFT, buff=0.24)
        rendered.move_to(box.get_center() + RIGHT * rendered_x + DOWN * 0.05)
        rendered.align_to(box.get_center() + RIGHT * rendered_x + LEFT * rendered_width / 2, LEFT)
        parts.append(rendered)
        self.add(*parts)
        self.box = box
        self.rendered = rendered


class Grade11ColabFirstStepsComplete(Scene):
    TOTAL = 18

    def begin(self, number: int, title: str, subtitle: str, stage: int) -> None:
        header = ChapterHeader(title, subtitle, number=number, total=self.TOTAL)
        header.to_edge(UP, buff=0.20)
        ribbon = FirstStepsRibbon(stage)
        ribbon.to_edge(DOWN, buff=0.17)
        self.add(header, ribbon)

    def staged(self, group: VGroup, run_time: float = 1.10, lag: float = 0.18) -> None:
        self.play(
            LaggedStart(*[FadeIn(item, shift=UP * 0.08) for item in group], lag_ratio=lag),
            run_time=run_time,
        )

    def end(self, pause: float = 4.0) -> None:
        self.wait(lesson_pause(pause))
        if self.mobjects:
            self.play(FadeOut(Group(*self.mobjects), shift=UP * 0.04), run_time=0.42)
        self.clear()

    def construct(self) -> None:
        self.scene_01_welcome()
        self.scene_02_interface_map()
        self.scene_03_runtime_and_notebook()
        self.scene_04_two_cell_types()
        self.scene_05_text_cell_anatomy()
        self.scene_06_code_cell_anatomy()
        self.scene_07_run_read_repeat()
        self.scene_08_comments()
        self.scene_09_variables_and_types()
        self.scene_10_arithmetic_basics()
        self.scene_11_division_remainder_power()
        self.scene_12_strings_and_print()
        self.scene_13_comparisons()
        self.scene_14_boolean_logic()
        self.scene_15_conditionals()
        self.scene_16_debugging_and_order()
        self.scene_17_upload_csv_and_pandas()
        self.scene_18_save_share_exit_ticket()

    def scene_01_welcome(self) -> None:
        self.begin(1, "Google Colab + Python: your first complete notebook", "A friendly path from an empty notebook to a small data investigation", 0)
        notebook = ColabWindow("Grade11_Colab_First_Steps.ipynb")
        notebook.scale(0.67)
        notebook.move_to(UP * 0.45)
        outcomes = VGroup(
            info_card("UNDERSTAND", "Identify the interface, runtime, and cells.", width=3.55, height=1.25, accent=BLUE, fill=SOFT_BLUE, title_size=21, body_size=18),
            info_card("PROGRAM", "Use variables, operations, and logic.", width=3.55, height=1.25, accent=PURPLE, fill=SOFT_PURPLE, title_size=21, body_size=18),
            info_card("APPLY", "Upload a CSV and verify a real output.", width=3.55, height=1.25, accent=GREEN, fill=SOFT_GREEN, title_size=21, body_size=18),
        ).arrange(RIGHT, buff=0.38)
        outcomes.move_to(DOWN * 2.55)
        self.play(FadeIn(notebook, shift=UP * 0.10), run_time=0.95)
        self.staged(outcomes, run_time=1.20)
        self.end(5.0)

    def scene_02_interface_map(self) -> None:
        self.begin(2, "Orient yourself before writing code", "Every Colab notebook has four working zones", 0)
        colab = ColabWindow("Grade11_Colab_First_Steps.ipynb")
        colab.scale(0.79)
        colab.move_to(DOWN * 0.20)
        callouts = VGroup(
            info_card("TOP BAR", "Name, connection, and sharing.", width=3.25, height=1.05, accent=BLUE, fill=SOFT_BLUE, title_size=19, body_size=17),
            info_card("MENUS", "Insert cells and manage the runtime.", width=3.25, height=1.05, accent=PURPLE, fill=SOFT_PURPLE, title_size=19, body_size=17),
            info_card("SIDEBAR", "Files, search, and notebook tools.", width=3.25, height=1.05, accent=ORANGE, fill=SOFT_ORANGE, title_size=19, body_size=17),
            info_card("WORKSPACE", "Text cells, code cells, and outputs.", width=3.25, height=1.05, accent=GREEN, fill=SOFT_GREEN, title_size=19, body_size=17),
        )
        callouts[0].move_to(LEFT * 5.70 + UP * 2.35)
        callouts[1].move_to(RIGHT * 5.65 + UP * 2.35)
        callouts[2].move_to(LEFT * 5.70 + DOWN * 1.05)
        callouts[3].move_to(RIGHT * 5.65 + DOWN * 1.05)
        arrows = VGroup(
            Arrow(callouts[0].get_bottom(), colab.get_top() + LEFT * 2.8, buff=0.10, color=BLUE, stroke_width=2),
            Arrow(callouts[1].get_bottom(), colab.get_top() + RIGHT * 0.3 + DOWN * 0.48, buff=0.10, color=PURPLE, stroke_width=2),
            Arrow(callouts[2].get_right(), colab.get_left() + RIGHT * 0.35, buff=0.10, color=ORANGE, stroke_width=2),
            Arrow(callouts[3].get_left(), colab.canvas.get_center(), buff=0.10, color=GREEN, stroke_width=2),
        )
        self.play(FadeIn(colab, shift=UP * 0.08), run_time=0.85)
        for card, arrow in zip(callouts, arrows):
            self.play(FadeIn(card, shift=UP * 0.05), GrowArrow(arrow), run_time=0.55)
        self.end(5.0)

    def scene_03_runtime_and_notebook(self) -> None:
        self.begin(3, "Notebook file vs. runtime session", "The notebook is saved; the runtime is a temporary cloud computer", 0)
        notebook = info_card("NOTEBOOK FILE", "Stores text, code, and visible outputs in Drive. Rename it clearly and save it.", width=5.75, height=2.25, accent=BLUE, fill=SOFT_BLUE, title_size=25, body_size=21)
        runtime = info_card("RUNTIME SESSION", "Executes Python and remembers variables during the current session. A restart clears memory.", width=5.75, height=2.25, accent=ORANGE, fill=SOFT_ORANGE, title_size=25, body_size=21)
        pair = VGroup(notebook, runtime).arrange(RIGHT, buff=0.60)
        pair.move_to(UP * 1.05)
        memory_flow = VGroup(
            info_card("CONNECT", "Start the runtime.", width=3.25, height=1.05, accent=BLUE, fill=WHITE, title_size=20, body_size=18),
            Arrow(ORIGIN, RIGHT * 0.75, color=MUTED, stroke_width=2),
            info_card("RUN", "Create variables in memory.", width=3.25, height=1.05, accent=PURPLE, fill=WHITE, title_size=20, body_size=18),
            Arrow(ORIGIN, RIGHT * 0.75, color=MUTED, stroke_width=2),
            info_card("RESTART", "Memory becomes empty.", width=3.25, height=1.05, accent=RED, fill=SOFT_RED, title_size=20, body_size=18),
        ).arrange(RIGHT, buff=0.20)
        memory_flow.move_to(DOWN * 1.65)
        habit = info_card("SAFE HABIT", "Run all cells from top to bottom before sharing the notebook.", width=9.60, height=1.15, accent=GREEN, fill=SOFT_GREEN, title_size=21, body_size=19)
        habit.move_to(DOWN * 3.02)
        self.staged(pair)
        self.play(FadeIn(memory_flow, shift=UP * 0.08), run_time=0.90)
        self.play(FadeIn(habit, shift=UP * 0.08), run_time=0.70)
        self.end(5.2)

    def scene_04_two_cell_types(self) -> None:
        self.begin(4, "A notebook is built from two cell types", "Text cells explain; code cells execute", 1)
        text_cell = TextCellVisual("## Question\nWhat is the class mean?", [("Question", GREEN, 25), ("What is the class mean?", INK, 23)], width=6.25, height=3.20, show_source=False)
        code_cell = CodeCell("scores = [68, 74, 81]\nprint(sum(scores) / len(scores))", output="74.33333333333333", width=6.25, code_size=23, execution_count="1")
        pair = VGroup(text_cell, code_cell).arrange(RIGHT, buff=0.65)
        pair.move_to(UP * 0.45)
        roles = VGroup(
            info_card("TEXT CELL", "Question, method, explanation, and conclusion.", width=5.50, height=1.35, accent=GREEN, fill=SOFT_GREEN, title_size=22, body_size=19),
            info_card("CODE CELL", "Python instructions followed by a visible output.", width=5.50, height=1.35, accent=BLUE, fill=SOFT_BLUE, title_size=22, body_size=19),
        ).arrange(RIGHT, buff=0.65)
        roles.move_to(DOWN * 2.55)
        self.play(FadeIn(text_cell, shift=RIGHT * 0.08), FadeIn(code_cell, shift=LEFT * 0.08), run_time=0.90)
        self.staged(roles)
        self.end(5.0)

    def scene_05_text_cell_anatomy(self) -> None:
        self.begin(5, "Anatomy of a text cell", "Markdown turns simple symbols into readable structure", 1)
        cell = TextCellVisual("## Investigation question\n**Goal:** calculate a mean.\n- Load data\n- Check values\n`mean_score`", [("Investigation question", GREEN, 27), ("Goal: calculate a mean.", INK, 22), ("- Load data", INK, 20), ("- Check values", INK, 20), ("mean_score", BLUE, 20)], width=12.10, height=4.25, show_source=True)
        cell.move_to(UP * 0.45)
        legend = VGroup(
            info_card("##", "Heading", width=2.35, height=0.90, accent=GREEN, fill=SOFT_GREEN, title_size=21, body_size=17),
            info_card("** **", "Bold text", width=2.35, height=0.90, accent=BLUE, fill=SOFT_BLUE, title_size=21, body_size=17),
            info_card("-", "Bullet list", width=2.35, height=0.90, accent=ORANGE, fill=SOFT_ORANGE, title_size=21, body_size=17),
            info_card("` `", "Inline code", width=2.35, height=0.90, accent=PURPLE, fill=SOFT_PURPLE, title_size=21, body_size=17),
        ).arrange(RIGHT, buff=0.30)
        legend.move_to(DOWN * 2.75)
        self.play(FadeIn(cell, shift=UP * 0.08), run_time=0.90)
        self.staged(legend, run_time=1.10)
        self.end(5.7)

    def scene_06_code_cell_anatomy(self) -> None:
        self.begin(6, "Anatomy of a code cell", "Read the cell from control to instruction to result", 1)
        cell = CodeCell("numbers = [12, 18, 24]\ntotal = sum(numbers)\nprint(total)", output="54", width=9.30, code_size=25, execution_count="3")
        cell.move_to(UP * 0.40)
        labels = VGroup(
            info_card("RUN BUTTON", "Executes this cell.", width=2.75, height=1.00, accent=BLUE, fill=SOFT_BLUE, title_size=19, body_size=17),
            info_card("[3]", "Execution count.", width=2.75, height=1.00, accent=ORANGE, fill=SOFT_ORANGE, title_size=19, body_size=17),
            info_card("SOURCE", "Python instructions.", width=2.75, height=1.00, accent=PURPLE, fill=SOFT_PURPLE, title_size=19, body_size=17),
            info_card("OUTPUT", "Result or error message.", width=2.75, height=1.00, accent=GREEN, fill=SOFT_GREEN, title_size=19, body_size=17),
        )
        labels[0].move_to(LEFT * 5.65 + UP * 1.80)
        labels[1].move_to(LEFT * 5.65 + DOWN * 0.05)
        labels[2].move_to(RIGHT * 5.65 + UP * 1.45)
        labels[3].move_to(RIGHT * 5.65 + DOWN * 1.20)
        arrows = VGroup(
            Arrow(labels[0].get_right(), cell.play.get_center(), buff=0.10, color=BLUE, stroke_width=2),
            Arrow(labels[1].get_right(), cell.play.get_center() + DOWN * 0.52, buff=0.10, color=ORANGE, stroke_width=2),
            Arrow(labels[2].get_left(), cell.code.get_center(), buff=0.10, color=PURPLE, stroke_width=2),
            Arrow(labels[3].get_left(), cell.get_bottom() + UP * 0.42, buff=0.10, color=GREEN, stroke_width=2),
        )
        self.play(FadeIn(cell, shift=UP * 0.08), run_time=0.85)
        for card, arrow in zip(labels, arrows):
            self.play(FadeIn(card), GrowArrow(arrow), run_time=0.50)
        self.end(5.8)

    def scene_07_run_read_repeat(self) -> None:
        self.begin(7, "The essential cycle: write, run, read, improve", "A notebook is interactive; editing code does not automatically update its output", 1)
        step1 = CodeCell("value = 10\nprint(value)", width=7.80, code_size=27, execution_count="")
        step2 = CodeCell("value = 10\nprint(value)", output="10", width=7.80, code_size=27, execution_count="1")
        step3 = CodeCell("value = 25\nprint(value)", output="10", width=7.80, code_size=27, execution_count="1")
        step4 = CodeCell("value = 25\nprint(value)", output="25", width=7.80, code_size=27, execution_count="2")
        for cell in (step1, step2, step3, step4):
            cell.move_to(UP * 0.55)
        cycle = VGroup(
            info_card("1  WRITE", "Create or edit code.", width=2.65, height=1.05, accent=BLUE, fill=SOFT_BLUE, title_size=19, body_size=17),
            info_card("2  RUN", "Play or Shift + Enter.", width=2.65, height=1.05, accent=PURPLE, fill=SOFT_PURPLE, title_size=19, body_size=17),
            info_card("3  READ", "Verify output or error.", width=2.65, height=1.05, accent=GREEN, fill=SOFT_GREEN, title_size=19, body_size=17),
            info_card("4  IMPROVE", "Change and run again.", width=2.65, height=1.05, accent=ORANGE, fill=SOFT_ORANGE, title_size=19, body_size=17),
        ).arrange(RIGHT, buff=0.28)
        cycle.move_to(DOWN * 2.35)
        stale = info_card("STALE OUTPUT", "After editing 10 to 25, the old output remains until the cell runs again.", width=9.20, height=1.10, accent=RED, fill=SOFT_RED, title_size=20, body_size=18)
        stale.move_to(DOWN * 3.35)
        self.play(FadeIn(step1), run_time=0.65)
        self.play(Transform(step1, step2), run_time=0.65)
        self.play(Transform(step1, step3), run_time=0.65)
        self.play(FadeIn(stale, shift=UP * 0.05), run_time=0.55)
        self.play(Transform(step1, step4), FadeOut(stale), run_time=0.70)
        self.staged(cycle, run_time=1.10)
        self.end(5.6)

    def scene_08_comments(self) -> None:
        self.begin(8, "Comments make code understandable", "Python ignores text after #, but people use it to understand the program", 2)
        code = CodeCell("# Store two quiz scores\nquiz_1 = 72\nquiz_2 = 84\n\n# Calculate the average\naverage = (quiz_1 + quiz_2) / 2\nprint(average)", output="78.0", width=8.55, code_size=24, execution_count="4")
        code.move_to(LEFT * 2.10 + UP * 0.25)
        rules = VGroup(
            info_card("# COMMENT", "Explains one line or one short step.", width=4.10, height=1.20, accent=GREEN, fill=SOFT_GREEN, title_size=22, body_size=19),
            info_card("NOT EXECUTED", "Changing a comment does not change the calculation.", width=4.10, height=1.20, accent=ORANGE, fill=SOFT_ORANGE, title_size=22, body_size=19),
            info_card("TEXT CELL", "Use Markdown for long explanations, methods, and conclusions.", width=4.10, height=1.20, accent=BLUE, fill=SOFT_BLUE, title_size=22, body_size=19),
        ).arrange(DOWN, buff=0.30)
        rules.move_to(RIGHT * 5.10 + UP * 0.15)
        self.play(FadeIn(code, shift=RIGHT * 0.08), run_time=0.85)
        self.staged(rules, run_time=1.20)
        self.end(5.8)

    def scene_09_variables_and_types(self) -> None:
        self.begin(9, "Variables store values with meaningful names", "Python values have data types that determine what operations are possible", 2)
        code = CodeCell('student_id = "S014"\nscore = 78\nstudy_hours = 6.5\npassed = True\n\nprint(type(student_id))\nprint(type(score))\nprint(type(study_hours))\nprint(type(passed))', output="<class 'str'>\n<class 'int'>\n<class 'float'>\n<class 'bool'>", width=8.35, code_size=22, execution_count="5")
        code.move_to(LEFT * 2.25 + UP * 0.25)
        types = VGroup(
            info_card("str", "Text: student ID", width=3.95, height=1.00, accent=BLUE, fill=SOFT_BLUE, title_size=22, body_size=18),
            info_card("int", "Whole number: score", width=3.95, height=1.00, accent=GREEN, fill=SOFT_GREEN, title_size=22, body_size=18),
            info_card("float", "Decimal: study hours", width=3.95, height=1.00, accent=ORANGE, fill=SOFT_ORANGE, title_size=22, body_size=18),
            info_card("bool", "True or False: passed", width=3.95, height=1.00, accent=PURPLE, fill=SOFT_PURPLE, title_size=22, body_size=18),
        ).arrange(DOWN, buff=0.24)
        types.move_to(RIGHT * 5.05 + UP * 0.15)
        self.play(FadeIn(code, shift=RIGHT * 0.08), run_time=0.85)
        self.staged(types, run_time=1.25)
        self.end(6.0)

    def scene_10_arithmetic_basics(self) -> None:
        self.begin(10, "Basic arithmetic operations", "Python follows the same order of operations used in mathematics", 2)
        code = CodeCell("a = 18\nb = 7\n\nprint(a + b)\nprint(a - b)\nprint(a * b)\nprint((a + b) * 2)", output="25\n11\n126\n50", width=7.25, code_size=25, execution_count="6")
        code.move_to(LEFT * 3.35 + UP * 0.20)
        operations = VGroup(
            info_card("+", "Addition", width=2.60, height=1.05, accent=BLUE, fill=SOFT_BLUE, title_size=26, body_size=18),
            info_card("-", "Subtraction", width=2.60, height=1.05, accent=GREEN, fill=SOFT_GREEN, title_size=26, body_size=18),
            info_card("*", "Multiplication", width=2.60, height=1.05, accent=ORANGE, fill=SOFT_ORANGE, title_size=26, body_size=18),
            info_card("( )", "Priority", width=2.60, height=1.05, accent=PURPLE, fill=SOFT_PURPLE, title_size=26, body_size=18),
        ).arrange_in_grid(rows=2, cols=2, buff=(0.35, 0.35))
        operations.move_to(RIGHT * 3.85 + UP * 0.65)
        model = info_card("PRACTICAL FORMULA", "average = (quiz_1 + quiz_2) / 2", width=5.55, height=1.25, accent=BLUE, fill=WHITE, title_size=21, body_size=22)
        model.move_to(RIGHT * 3.85 + DOWN * 1.65)
        self.play(FadeIn(code, shift=RIGHT * 0.08), run_time=0.85)
        self.staged(operations, run_time=1.10)
        self.play(FadeIn(model, shift=UP * 0.08), run_time=0.70)
        self.end(5.8)

    def scene_11_division_remainder_power(self) -> None:
        self.begin(11, "Division, integer division, remainder, and powers", "Similar symbols answer different questions", 2)
        examples = VGroup(
            CodeCell("17 / 5", output="3.4", width=5.65, code_size=28, execution_count="7"),
            CodeCell("17 // 5", output="3", width=5.65, code_size=28, execution_count="8"),
            CodeCell("17 % 5", output="2", width=5.65, code_size=28, execution_count="9"),
            CodeCell("5 ** 2", output="25", width=5.65, code_size=28, execution_count="10"),
        ).arrange_in_grid(rows=2, cols=2, buff=(0.55, 0.45))
        examples.move_to(UP * 0.45)
        meanings = VGroup(
            info_card("/", "Decimal division", width=2.65, height=0.95, accent=BLUE, fill=SOFT_BLUE, title_size=22, body_size=17),
            info_card("//", "Complete groups", width=2.65, height=0.95, accent=GREEN, fill=SOFT_GREEN, title_size=22, body_size=17),
            info_card("%", "Remainder", width=2.65, height=0.95, accent=ORANGE, fill=SOFT_ORANGE, title_size=22, body_size=17),
            info_card("**", "Power", width=2.65, height=0.95, accent=PURPLE, fill=SOFT_PURPLE, title_size=22, body_size=17),
        ).arrange(RIGHT, buff=0.28)
        meanings.move_to(DOWN * 2.80)
        self.staged(examples, run_time=1.25, lag=0.15)
        self.staged(meanings, run_time=1.00)
        self.end(5.8)

    def scene_12_strings_and_print(self) -> None:
        self.begin(12, "Strings and print: communicate a result", "A useful output combines labels and values", 2)
        code = CodeCell('student = "S014"\nscore = 78\n\nprint(student)\nprint("Final score:", score)\nprint(f"{student} scored {score}")', output="S014\nFinal score: 78\nS014 scored 78", width=8.50, code_size=24, execution_count="11")
        code.move_to(LEFT * 2.10 + UP * 0.25)
        notes = VGroup(
            info_card("QUOTES", 'Create text: "Final score"', width=4.20, height=1.15, accent=BLUE, fill=SOFT_BLUE, title_size=22, body_size=19),
            info_card("print(...)", "Displays values below the cell.", width=4.20, height=1.15, accent=GREEN, fill=SOFT_GREEN, title_size=22, body_size=19),
            info_card("f-STRING", 'Inserts values inside text: f"{score}"', width=4.20, height=1.15, accent=PURPLE, fill=SOFT_PURPLE, title_size=22, body_size=19),
        ).arrange(DOWN, buff=0.30)
        notes.move_to(RIGHT * 5.05 + UP * 0.20)
        self.play(FadeIn(code, shift=RIGHT * 0.08), run_time=0.85)
        self.staged(notes, run_time=1.15)
        self.end(5.8)

    def scene_13_comparisons(self) -> None:
        self.begin(13, "Comparisons produce Boolean values", "Every comparison is either True or False", 3)
        code = CodeCell("score = 78\n\nprint(score >= 70)\nprint(score < 60)\nprint(score == 78)\nprint(score != 80)", output="True\nFalse\nTrue\nTrue", width=7.25, code_size=26, execution_count="12")
        code.move_to(LEFT * 3.25 + UP * 0.25)
        operators = VGroup(
            info_card(">=", "greater than or equal", width=3.15, height=1.05, accent=BLUE, fill=SOFT_BLUE, title_size=23, body_size=17),
            info_card("<", "less than", width=3.15, height=1.05, accent=GREEN, fill=SOFT_GREEN, title_size=23, body_size=17),
            info_card("==", "equal to", width=3.15, height=1.05, accent=PURPLE, fill=SOFT_PURPLE, title_size=23, body_size=17),
            info_card("!=", "not equal to", width=3.15, height=1.05, accent=ORANGE, fill=SOFT_ORANGE, title_size=23, body_size=17),
        ).arrange_in_grid(rows=2, cols=2, buff=(0.35, 0.35))
        operators.move_to(RIGHT * 3.80 + UP * 0.55)
        warning = info_card("IMPORTANT", "Use == to compare. Use = to assign a value.", width=6.60, height=1.15, accent=RED, fill=SOFT_RED, title_size=21, body_size=20)
        warning.move_to(RIGHT * 3.80 + DOWN * 1.95)
        self.play(FadeIn(code, shift=RIGHT * 0.08), run_time=0.85)
        self.staged(operators, run_time=1.05)
        self.play(FadeIn(warning, shift=UP * 0.08), run_time=0.65)
        self.end(5.8)

    def scene_14_boolean_logic(self) -> None:
        self.begin(14, "Combine conditions with and, or, and not", "Logic lets a program evaluate more realistic rules", 3)
        conditions = VGroup(
            info_card("and", "Both conditions must be True.", width=3.70, height=1.30, accent=BLUE, fill=SOFT_BLUE, title_size=25, body_size=19),
            info_card("or", "At least one condition must be True.", width=3.70, height=1.30, accent=GREEN, fill=SOFT_GREEN, title_size=25, body_size=19),
            info_card("not", "Reverses True and False.", width=3.70, height=1.30, accent=PURPLE, fill=SOFT_PURPLE, title_size=25, body_size=19),
        ).arrange(RIGHT, buff=0.45)
        conditions.move_to(UP * 1.85)
        code = CodeCell("score = 78\nattendance = 92\n\nready = score >= 70 and attendance >= 85\nsupport = score < 60 or attendance < 75\nnot_ready = not ready\n\nprint(ready, support, not_ready)", output="True False False", width=10.50, code_size=23, execution_count="13")
        code.move_to(DOWN * 0.50)
        self.staged(conditions, run_time=1.10)
        self.play(FadeIn(code, shift=UP * 0.08), run_time=0.90)
        self.end(6.2)

    def scene_15_conditionals(self) -> None:
        self.begin(15, "Use if / elif / else to make decisions", "Python checks conditions from top to bottom and runs one matching branch", 3)
        code = CodeCell("score = 78\n\nif score >= 80:\n    level = \"High\"\nelif score >= 60:\n    level = \"Developing\"\nelse:\n    level = \"Support\"\n\nprint(level)", output="Developing", width=7.55, code_size=24, execution_count="14")
        code.move_to(LEFT * 3.15 + UP * 0.20)
        flow = VGroup(
            info_card("IF", "Is score >= 80?\nNo", width=3.85, height=1.25, accent=BLUE, fill=SOFT_BLUE, title_size=23, body_size=19),
            Arrow(ORIGIN, DOWN * 0.55, color=MUTED, stroke_width=2),
            info_card("ELIF", "Is score >= 60?\nYes", width=3.85, height=1.25, accent=PURPLE, fill=SOFT_PURPLE, title_size=23, body_size=19),
            Arrow(ORIGIN, DOWN * 0.55, color=MUTED, stroke_width=2),
            info_card("RESULT", "level = Developing", width=3.85, height=1.25, accent=GREEN, fill=SOFT_GREEN, title_size=23, body_size=19),
        ).arrange(DOWN, buff=0.16)
        flow.move_to(RIGHT * 4.65 + UP * 0.15)
        syntax = info_card("INDENTATION", "The four spaces under each branch are part of Python syntax.", width=6.20, height=1.10, accent=ORANGE, fill=SOFT_ORANGE, title_size=21, body_size=19)
        syntax.move_to(RIGHT * 3.90 + DOWN * 2.75)
        self.play(FadeIn(code, shift=RIGHT * 0.08), run_time=0.85)
        self.play(FadeIn(flow, shift=UP * 0.08), run_time=1.00)
        self.play(FadeIn(syntax, shift=UP * 0.08), run_time=0.65)
        self.end(6.5)

    def scene_16_debugging_and_order(self) -> None:
        self.begin(16, "Errors are information: read, locate, correct, rerun", "The last line of the traceback usually names the problem", 3)
        error_cell = CodeCell("print(class_mean)", output="NameError: name 'class_mean' is not defined", width=6.60, code_size=22, execution_count="1")
        fix_cell = CodeCell("class_mean = 69.85\nprint(class_mean)", output="69.85", width=6.60, code_size=22, execution_count="2")
        pair = VGroup(error_cell, fix_cell).arrange(RIGHT, buff=0.55)
        pair.move_to(UP * 1.00)
        process = VGroup(
            info_card("1  READ", "NameError", width=2.65, height=1.05, accent=RED, fill=SOFT_RED, title_size=20, body_size=18),
            info_card("2  LOCATE", "class_mean", width=2.65, height=1.05, accent=ORANGE, fill=SOFT_ORANGE, title_size=20, body_size=18),
            info_card("3  DEFINE", "class_mean = 69.85", width=2.65, height=1.05, accent=BLUE, fill=SOFT_BLUE, title_size=20, body_size=17),
            info_card("4  RERUN", "Output: 69.85", width=2.65, height=1.05, accent=GREEN, fill=SOFT_GREEN, title_size=20, body_size=18),
        ).arrange(RIGHT, buff=0.28)
        process.move_to(DOWN * 1.35)
        order = info_card("EXECUTION ORDER", "A variable must be defined before another cell can use it. Use Runtime > Run all for a final check.", width=10.90, height=1.35, accent=PURPLE, fill=SOFT_PURPLE, title_size=22, body_size=20)
        order.move_to(DOWN * 2.90)
        self.play(FadeIn(error_cell, shift=RIGHT * 0.08), run_time=0.70)
        self.play(FadeIn(fix_cell, shift=LEFT * 0.08), run_time=0.70)
        self.staged(process, run_time=1.10)
        self.play(FadeIn(order, shift=UP * 0.08), run_time=0.70)
        self.end(6.2)

    def scene_17_upload_csv_and_pandas(self) -> None:
        self.begin(17, "Upload a CSV and verify it with Pandas", "The interface filename and the Python filename must match exactly", 4)
        steps = VGroup(
            info_card("1  FILES", "Open the left Files panel.", width=3.30, height=1.05, accent=PURPLE, fill=SOFT_PURPLE, title_size=20, body_size=18),
            info_card("2  UPLOAD", "Choose the CSV file.", width=3.30, height=1.05, accent=BLUE, fill=SOFT_BLUE, title_size=20, body_size=18),
            info_card("3  CHECK", "Read the exact filename.", width=3.30, height=1.05, accent=GREEN, fill=SOFT_GREEN, title_size=20, body_size=18),
        ).arrange(RIGHT, buff=0.42)
        steps.move_to(UP * 2.25)
        code = CodeCell("import pandas as pd\n\nfile_name = \"grade11_colab_student_success.csv\"\ndf = pd.read_csv(file_name)\n\nprint(df.shape)\ndf.head()", output="(72, 13)\nFirst five rows displayed as a table", width=10.80, code_size=24, execution_count="15")
        code.move_to(DOWN * 0.15)
        checks = VGroup(
            info_card("72", "rows / records", width=3.20, height=1.00, accent=BLUE, fill=SOFT_BLUE, title_size=24, body_size=17),
            info_card("13", "columns / variables", width=3.20, height=1.00, accent=PURPLE, fill=SOFT_PURPLE, title_size=24, body_size=17),
            info_card("head()", "visual preview", width=3.20, height=1.00, accent=GREEN, fill=SOFT_GREEN, title_size=22, body_size=17),
        ).arrange(RIGHT, buff=0.42)
        checks.move_to(DOWN * 2.92)
        self.staged(steps, run_time=1.05)
        self.play(FadeIn(code, shift=UP * 0.08), run_time=0.90)
        self.staged(checks, run_time=1.00)
        self.end(6.5)

    def scene_18_save_share_exit_ticket(self) -> None:
        self.begin(18, "Finish with a notebook that another person can run", "Save the file, preserve evidence, and explain what you learned", 5)
        checklist = VGroup(
            info_card("RENAME", "Clear notebook title", width=3.40, height=1.20, accent=BLUE, fill=SOFT_BLUE, title_size=21, body_size=18),
            info_card("COMMENT", "Explain important code", width=3.40, height=1.20, accent=GREEN, fill=SOFT_GREEN, title_size=21, body_size=18),
            info_card("RUN ALL", "Top-to-bottom test", width=3.40, height=1.20, accent=ORANGE, fill=SOFT_ORANGE, title_size=21, body_size=18),
            info_card("CHECK OUTPUTS", "Numbers, tables, errors", width=3.40, height=1.20, accent=PURPLE, fill=SOFT_PURPLE, title_size=21, body_size=18),
            info_card("SAVE / SHARE", "Correct Drive permissions", width=3.40, height=1.20, accent=RED, fill=SOFT_RED, title_size=21, body_size=18),
            info_card("SUBMIT", "Notebook + required CSV", width=3.40, height=1.20, accent=INK, fill=WHITE, title_size=21, body_size=18),
        ).arrange_in_grid(rows=2, cols=3, buff=(0.45, 0.45))
        checklist.move_to(UP * 0.65)
        ticket = info_card("EXIT TICKET", "Write one text cell and one code cell that store two values, calculate a result, use a comparison, and print a clear conclusion.", width=11.25, height=1.55, accent=BLUE, fill=WHITE, title_size=24, body_size=21)
        ticket.move_to(DOWN * 2.55)
        workflow = fit_text("ORIENT  ->  EXPLAIN  ->  CODE  ->  RUN  ->  READ  ->  IMPROVE  ->  SAVE", font_size=22, color=BLUE, weight="BOLD", max_width=12.20)
        workflow.move_to(DOWN * 3.62)
        self.staged(checklist, run_time=1.30, lag=0.12)
        self.play(FadeIn(ticket, shift=UP * 0.08), run_time=0.75)
        self.play(FadeIn(workflow), run_time=0.60)
        self.wait(lesson_pause(7.0))


class Grade11ColabFirstStepsCompletePreview(Grade11ColabFirstStepsComplete):
    """Critical-layout smoke test for the render protocol."""

    def construct(self) -> None:
        self.scene_02_interface_map()
        self.scene_05_text_cell_anatomy()
        self.scene_06_code_cell_anatomy()
        self.scene_08_comments()
        self.scene_10_arithmetic_basics()
        self.scene_14_boolean_logic()
        self.scene_15_conditionals()
        self.scene_17_upload_csv_and_pandas()
        self.scene_18_save_share_exit_ticket()
