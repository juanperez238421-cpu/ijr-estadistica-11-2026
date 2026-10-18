#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Statistics 11 — Class 4: From CSV to Statistical Information.

Curricular focus:
- load an anonymized classroom-style CSV with pandas;
- understand DataFrame rows, columns, shape and dtypes;
- select one statistical variable;
- calculate count, minimum, maximum, mean, median and mode;
- reuse previous comparison knowledge as a Pandas row filter;
- interpret the numbers rather than treating Python as the lesson objective.

Target: Manim Community Edition 0.20.1.
Render target: 1920x1080, 30 fps, H.264/yuv420p.
"""
from __future__ import annotations

import csv
import statistics
from pathlib import Path

import numpy as np
from manim import *

from library.jp_classroom_style import *


HERE = Path(__file__).resolve()
DATA_PATH = HERE.parents[1] / "assets" / "estudiantes.csv"

PASS_MARK = 3.0
EXPECTED_GRADES = [4.2, 3.8, 3.5, 4.0, 2.9, 3.8, 4.5, 3.2, 1.8, 3.8]
EXPECTED_MEAN = 3.55
EXPECTED_MEDIAN = 3.80
EXPECTED_MODE = 3.80
EXPECTED_MIN = 1.80
EXPECTED_MAX = 4.50
EXPECTED_COUNT = 10
EXPECTED_APPROVED_COUNT = 8
EXPECTED_APPROVED_MEAN = 3.85

COLAB_ORANGE = "#E8710A"
COLAB_YELLOW = "#F9AB00"
GOOGLE_GRAY_50 = "#F8F9FA"
GOOGLE_GRAY_200 = "#DADCE0"
GOOGLE_GRAY_600 = "#5F6368"
GOOGLE_GREEN = "#188038"
GOOGLE_BLUE = "#1A73E8"


class Stat11Class4CSVStats(JPMathClassroomScene):
    """Class 4: CSV -> DataFrame -> descriptive statistics -> interpretation."""

    def validate_lesson_data(self) -> None:
        if not DATA_PATH.exists():
            raise FileNotFoundError(f"Dataset asset not found: {DATA_PATH}")

        with DATA_PATH.open("r", encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))

        grades = [float(row["grade"]) for row in rows]
        ages = [int(row["age"]) for row in rows]

        assert len(rows) == EXPECTED_COUNT
        assert grades == EXPECTED_GRADES
        assert set(ages) == {16, 17}
        assert abs(statistics.mean(grades) - EXPECTED_MEAN) < 1e-12
        assert abs(statistics.median(grades) - EXPECTED_MEDIAN) < 1e-12
        assert statistics.multimode(grades) == [EXPECTED_MODE]
        assert min(grades) == EXPECTED_MIN
        assert max(grades) == EXPECTED_MAX

        approved = [g for g in grades if g >= PASS_MARK]
        assert len(approved) == EXPECTED_APPROVED_COUNT
        assert abs(statistics.mean(approved) - EXPECTED_APPROVED_MEAN) < 1e-12

    def code(self, content: str, size: int = 28, weight=MEDIUM) -> Text:
        return Text(
            content,
            font="Noto Sans Mono",
            font_size=size,
            color=BLACK_TEXT,
            weight=weight,
        )

    def colab_logo(self) -> VGroup:
        c = Text("C", font="Noto Sans", font_size=25, weight=BOLD, color=COLAB_ORANGE)
        o = Text("O", font="Noto Sans", font_size=25, weight=BOLD, color=COLAB_YELLOW)
        return VGroup(c, o).arrange(RIGHT, buff=-0.06)

    def play_triangle(self, center=ORIGIN) -> Polygon:
        tri = Polygon(
            LEFT * 0.045 + DOWN * 0.070,
            LEFT * 0.045 + UP * 0.070,
            RIGHT * 0.082,
            stroke_width=0,
            fill_color=WHITE,
            fill_opacity=1,
        )
        tri.move_to(center)
        return tri

    def run_button(self, center=ORIGIN) -> VGroup:
        circle = Circle(
            radius=0.18,
            stroke_width=0,
            fill_color=GOOGLE_GRAY_600,
            fill_opacity=1,
        ).move_to(center)
        return VGroup(circle, self.play_triangle(circle.get_center()))

    def colab_bar(self, notebook_title="Statistics11_Class4_CSV.ipynb", width=13.25) -> VGroup:
        spacer = Rectangle(width=width, height=1.08, stroke_opacity=0, fill_opacity=0)
        logo = self.colab_logo()
        title = self.text(notebook_title, 20, MEDIUM)
        self.fit(title, 4.6, 0.30)

        resources = self.text("RAM 0.8 / 12.7 GB    Disk 22.4 / 107.7 GB", 12, MEDIUM)
        resources.set_color(GOOGLE_GRAY_600)
        self.fit(resources, 3.6, 0.24)

        share_text = self.text("Share", 13, BOLD).set_color(WHITE)
        share_pill = RoundedRectangle(
            width=1.05,
            height=0.34,
            corner_radius=0.16,
            stroke_color=GOOGLE_BLUE,
            stroke_width=1,
            fill_color=GOOGLE_BLUE,
            fill_opacity=1,
        )
        share_text.move_to(share_pill)
        top = VGroup(logo, title, resources, VGroup(share_pill, share_text)).arrange(RIGHT, buff=0.24)
        self.fit(top, width - 0.36, 0.36)
        top.move_to(spacer.get_center() + UP * 0.28)

        menus = self.text("File   Edit   View   Insert   Runtime   Tools   Help", 13, MEDIUM)
        menus.set_color(GOOGLE_GRAY_600)
        actions = self.text("Commands     + Code     + Text     Run all", 14, MEDIUM)
        self.fit(actions, 5.2, 0.27)
        bottom = VGroup(menus, actions).arrange(RIGHT, buff=0.48)
        self.fit(bottom, width - 0.36, 0.29)
        bottom.move_to(spacer.get_center() + DOWN * 0.25)

        divider = Line(
            spacer.get_left() + RIGHT * 0.08,
            spacer.get_right() + LEFT * 0.08,
            stroke_color=GOOGLE_GRAY_200,
            stroke_width=1.0,
        ).move_to(spacer.get_center() + UP * 0.02)
        bottom_rule = Line(
            spacer.get_left(),
            spacer.get_right(),
            stroke_color=GOOGLE_GRAY_200,
            stroke_width=1.2,
        ).move_to(spacer.get_bottom() + UP * 0.02)

        return VGroup(spacer, divider, bottom_rule, top, bottom)

    def cell(self, lines, width=11.6, height=None, size=29, execution="[ ]") -> VGroup:
        code = VGroup(*[self.code(line, size) for line in lines])
        code.arrange(DOWN, aligned_edge=LEFT, buff=0.18)
        h = height or max(1.40, code.height + 0.62)

        box = RoundedRectangle(
            width=width,
            height=h,
            corner_radius=0.08,
            stroke_color=GOOGLE_GRAY_200,
            stroke_width=1.25,
            fill_color=GOOGLE_GRAY_50,
            fill_opacity=1,
        )
        selection = Line(
            box.get_corner(UL) + DOWN * 0.07,
            box.get_corner(DL) + UP * 0.07,
            stroke_color=GOOGLE_BLUE,
            stroke_width=2.5,
        )

        self.fit(code, width - 1.55, h - 0.30)
        code.move_to(box).align_to(box, LEFT).shift(RIGHT * 1.28)
        first_y = code[0].get_center()[1]

        run_center = np.array([box.get_left()[0] + 0.77, first_y, 0.0])
        run = self.run_button(run_center)

        count = self.code(execution, 13, MEDIUM)
        count.move_to(
            np.array([
                box.get_left()[0] + 0.30,
                box.get_top()[1] - 0.26,
                0.0,
            ])
        )

        check = Text("✓", font="Noto Sans", font_size=12, weight=BOLD, color=GOOGLE_GREEN)
        elapsed = self.code("0s", 11, MEDIUM).set_color(GOOGLE_GRAY_600)
        status = VGroup(check, elapsed).arrange(RIGHT, buff=0.05)
        status.next_to(count, DOWN, buff=0.08)

        more = self.text("⋮", 18, MEDIUM).set_color(GOOGLE_GRAY_600)
        more.move_to(box.get_corner(UR) + LEFT * 0.22 + DOWN * 0.22)

        return VGroup(VGroup(box, selection, more), VGroup(run, count, status), code)

    def play_cell(self, cell: VGroup, run_no: int, line_time=0.75) -> None:
        frame, controls, code = cell
        run, count, status = controls
        self.play(FadeIn(frame), FadeIn(run), FadeIn(count), run_time=RUN_NORMAL)
        for line in code:
            self.play(Write(line, rate_func=linear), run_time=line_time)
            self.wait(0.18)

        stop = Square(
            side_length=0.09,
            stroke_width=0,
            fill_color=WHITE,
            fill_opacity=1,
        ).move_to(run[0])
        self.play(Transform(run[1], stop), run_time=0.20)
        self.wait(0.15)

        new_count = self.code(f"[{run_no}]", 13, MEDIUM).move_to(count)
        self.play(Transform(count, new_count), run_time=0.25)
        self.play(FadeIn(status, shift=UP * 0.02), run_time=0.22)

        play = self.play_triangle(run[0].get_center())
        self.play(Transform(run[1], play), run_time=0.20)
        self.wait(PAUSE_SHORT)

    def output_block(self, lines, width=10.8, size=27) -> VGroup:
        texts = VGroup(*[self.code(str(line), size, MEDIUM) for line in lines])
        texts.arrange(DOWN, aligned_edge=LEFT, buff=0.08)
        self.fit(texts, width - 1.45, 1.50)
        h = max(0.50, texts.height + 0.18)
        spacer = Rectangle(width=width, height=h, stroke_opacity=0, fill_opacity=0)
        texts.move_to(spacer).align_to(spacer, LEFT).shift(RIGHT * 1.22)
        return VGroup(spacer, texts)

    def stat_card(self, label: str, value: str, explanation: str, width=3.55) -> VGroup:
        box = RoundedRectangle(
            width=width,
            height=2.05,
            corner_radius=0.12,
            stroke_color=BLACK_LINE,
            stroke_width=1.8,
            fill_color=WHITE,
            fill_opacity=1,
        )
        lab = self.text(label, 24, BOLD)
        val = self.text(value, 38, BOLD)
        desc = self.text(explanation, 18)
        self.fit(desc, width - 0.42, 0.48)
        content = VGroup(lab, val, desc).arrange(DOWN, buff=0.14)
        content.move_to(box)
        return VGroup(box, content)

    def question_card(self, question: str, answer: str, width=6.3) -> VGroup:
        q = self.text(question, 23, BOLD)
        a = self.text(answer, 23)
        self.fit(q, width - 0.5, 0.75)
        self.fit(a, width - 0.5, 0.75)
        content = VGroup(q, a).arrange(DOWN, aligned_edge=LEFT, buff=0.22)
        box = RoundedRectangle(
            width=width,
            height=max(1.45, content.height + 0.55),
            corner_radius=0.12,
            stroke_color=BLACK_LINE,
            stroke_width=1.6,
            fill_color=WHITE,
            fill_opacity=1,
        )
        content.move_to(box).align_to(box, LEFT).shift(RIGHT * 0.28)
        return VGroup(box, content)

    def construct(self) -> None:
        self.standard_opening(
            "STATISTICS 11 · PYTHON / GOOGLE COLAB",
            "CLASS 4 — FROM CSV TO STATISTICAL INFORMATION",
            "How can Python help us describe a dataset?",
            "LOAD  →  EXPLORE  →  SELECT  →  DESCRIBE  →  FILTER  →  INTERPRET",
        )
        self.csv_to_dataframe()
        self.load_in_colab()
        self.explore_before_calculating()
        self.select_grade_column()
        self.central_tendency()
        self.basic_summary()
        self.filter_with_conditions()
        self.workshop()
        self.summary()

    def csv_to_dataframe(self) -> None:
        self.set_header(
            1,
            "A CSV IS DATA ORGANIZED IN ROWS AND COLUMNS",
            "The file is only the container. Pandas turns it into a DataFrame that Python can inspect and analyze.",
        )

        file_box = RoundedRectangle(
            width=5.0,
            height=4.3,
            corner_radius=0.14,
            stroke_color=BLACK_LINE,
            stroke_width=2,
            fill_color=WHITE,
            fill_opacity=1,
        )
        file_title = self.text("estudiantes.csv", 30, BOLD)
        csv_lines = VGroup(
            self.code("student_id,age,grade", 22),
            self.code("S01,17,4.2", 22),
            self.code("S02,16,3.8", 22),
            self.code("S03,17,3.5", 22),
            self.code("...", 22),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.17)
        file_content = VGroup(file_title, csv_lines).arrange(DOWN, aligned_edge=LEFT, buff=0.36)
        file_content.move_to(file_box).align_to(file_box, LEFT).shift(RIGHT * 0.35)
        file_group = VGroup(file_box, file_content).move_to(LEFT * 4.6 + DOWN * 0.35)

        arrow = Arrow(
            LEFT * 0.95,
            RIGHT * 0.95,
            buff=0,
            stroke_width=3,
            color=BLACK_LINE,
        ).move_to(DOWN * 0.35)
        pandas_label = self.code("pd.read_csv(...)", 20).next_to(arrow, UP, buff=0.18)

        rows = [
            ["S01", "17", "4.2"],
            ["S02", "16", "3.8"],
            ["S03", "17", "3.5"],
            ["S04", "16", "4.0"],
            ["S05", "17", "2.9"],
        ]
        table = self.build_table(
            headers=("student_id", "age", "grade"),
            body_rows=rows,
            column_widths=(2.1, 1.5, 1.7),
            math_columns=(1, 2),
            row_height=0.52,
            header_height=0.60,
            body_font_size=22,
            header_font_size=19,
        )
        table.group.move_to(RIGHT * 4.2 + DOWN * 0.35)
        df_label = self.text("DataFrame", 28, BOLD).next_to(table.group, UP, buff=0.22)

        all_group = VGroup(file_group, arrow, pandas_label, table.group, df_label)
        self.assert_content_safe(all_group, "CSV to DataFrame")

        self.play(FadeIn(file_box), Write(file_title), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[Write(line) for line in csv_lines], lag_ratio=0.16), run_time=RUN_SLOW)
        self.wait(PAUSE_READ)
        self.play(GrowArrow(arrow), Write(pandas_label), run_time=RUN_NORMAL)
        self.animate_table_rows(table, include_header=True)
        self.play(Write(df_label), run_time=RUN_QUICK)
        self.wait(PAUSE_WORK)

        row_note = self.text("row = one observation", 22, BOLD).next_to(table.group, DOWN, buff=0.20)
        col_note = self.text("column = one variable", 22, BOLD).next_to(row_note, DOWN, buff=0.12)
        self.play(FadeIn(row_note), FadeIn(col_note), run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)
        self.clear_stage()

    def load_in_colab(self) -> None:
        self.set_header(
            2,
            "LOAD THE CSV IN GOOGLE COLAB",
            "The first job is not to calculate. It is to make the dataset visible and confirm that the file loaded correctly.",
        )

        bar = self.colab_bar().move_to(UP * 1.55)
        cell = self.cell(
            [
                "import pandas as pd",
                'df = pd.read_csv("estudiantes.csv")',
                "df.head()",
            ],
            width=11.8,
            height=2.35,
            size=27,
        ).move_to(DOWN * 0.15)

        self.assert_content_safe(VGroup(bar, cell), "load Colab layout")
        self.play(FadeIn(bar, shift=UP * 0.06), run_time=RUN_NORMAL)
        self.play_cell(cell, 1, 0.78)

        rows = [
            ["S01", "17", "4.2"],
            ["S02", "16", "3.8"],
            ["S03", "17", "3.5"],
            ["S04", "16", "4.0"],
            ["S05", "17", "2.9"],
        ]
        out = self.build_table(
            headers=("student_id", "age", "grade"),
            body_rows=rows,
            column_widths=(2.0, 1.4, 1.6),
            math_columns=(1, 2),
            row_height=0.42,
            header_height=0.48,
            body_font_size=19,
            header_font_size=17,
        )
        out.group.move_to(DOWN * 2.15)
        self.assert_content_safe(out.group, "df head output")
        self.animate_table_rows(out, include_header=True)
        self.wait(PAUSE_EXPLAIN)

        note = self.text("head() answers: “What does the beginning of my dataset look like?”", 24, BOLD)
        note.to_edge(DOWN, buff=0.25)
        self.fit(note, 13.8, 0.45)
        self.play(Write(note), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def explore_before_calculating(self) -> None:
        self.set_header(
            3,
            "EXPLORE BEFORE YOU CALCULATE",
            "A statistical analysis starts by understanding the structure: observations, variables, names and data types.",
        )

        code_panel = self.cell(
            ["df.shape", "df.columns", "df.info()"],
            width=6.0,
            height=2.35,
            size=29,
        ).move_to(LEFT * 4.25 + UP * 0.55)
        self.play_cell(code_panel, 2, 0.72)

        shape = self.question_card(
            "df.shape",
            "(10, 3)  →  10 observations × 3 variables",
            width=6.5,
        )
        columns = self.question_card(
            "df.columns",
            "student_id · age · grade",
            width=6.5,
        )
        info = self.question_card(
            "df.info()",
            "student_id: object · age: int64 · grade: float64",
            width=6.5,
        )
        cards = VGroup(shape, columns, info).arrange(DOWN, buff=0.20).move_to(RIGHT * 3.55 + DOWN * 0.10)
        self.fit(cards, 6.8, 5.0)
        self.assert_content_safe(cards, "exploration cards")

        for card in cards:
            self.play(FadeIn(card[0], shift=UP * 0.05), Write(card[1]), run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)

        prompt = self.text("Before asking “What is the mean?”, ask “What variables do I actually have?”", 25, BOLD)
        prompt.to_edge(DOWN, buff=0.28)
        self.fit(prompt, 13.8, 0.48)
        self.play(Write(prompt), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def select_grade_column(self) -> None:
        self.set_header(
            4,
            "SELECT THE VARIABLE YOU WANT TO DESCRIBE",
            "Statistics is computed on a variable. Here, the quantitative variable of interest is the grade column.",
        )

        rows = [
            ["S01", "17", "4.2"],
            ["S02", "16", "3.8"],
            ["S03", "17", "3.5"],
            ["S04", "16", "4.0"],
            ["S05", "17", "2.9"],
            ["S06", "16", "3.8"],
            ["S07", "17", "4.5"],
            ["S08", "16", "3.2"],
            ["S09", "17", "1.8"],
            ["S10", "16", "3.8"],
        ]
        table = self.build_table(
            headers=("student_id", "age", "grade"),
            body_rows=rows,
            column_widths=(2.2, 1.5, 1.8),
            math_columns=(1, 2),
            row_height=0.40,
            header_height=0.48,
            body_font_size=18,
            header_font_size=17,
        )
        table.group.move_to(LEFT * 3.9 + DOWN * 0.35)

        code = self.cell(['df["grade"]'], width=6.3, height=1.45, size=31).move_to(RIGHT * 3.75 + UP * 1.25)
        explain = self.note_panel(
            "WHAT THIS MEANS",
            [
                "df selects the DataFrame.",
                '["grade"] selects one column.',
                "The result is one statistical variable.",
            ],
            width=6.2,
            title_size=24,
            body_size=22,
            max_text_height=1.65,
        ).move_to(RIGHT * 3.75 + DOWN * 0.75)

        self.animate_table_rows(table, include_header=True)
        highlight = SurroundingRectangle(
            table.columns[2],
            color=BLACK_LINE,
            stroke_width=3,
            buff=0.06,
        )
        self.play(Create(highlight), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)
        self.play_cell(code, 3, 0.95)
        self.play(FadeIn(explain[0]), FadeIn(explain[1]), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def central_tendency(self) -> None:
        self.set_header(
            5,
            "MEAN, MEDIAN AND MODE DESCRIBE THE CENTER DIFFERENTLY",
            "Python returns the numbers quickly. Statistics explains why the numbers are different and what each one means.",
        )

        cell = self.cell(
            [
                'mean_grade = df["grade"].mean()',
                'median_grade = df["grade"].median()',
                'mode_grade = df["grade"].mode()[0]',
                "print(mean_grade, median_grade, mode_grade)",
            ],
            width=12.3,
            height=2.75,
            size=25,
        ).move_to(UP * 0.82)
        self.play_cell(cell, 4, 0.68)

        out = self.output_block(["3.55    3.8    3.8"], width=11.5, size=27).move_to(DOWN * 0.92)
        self.play(FadeIn(out, shift=UP * 0.04), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)

        cards = VGroup(
            self.stat_card("MEAN", "3.55", "average of all 10 grades"),
            self.stat_card("MEDIAN", "3.80", "middle of the ordered data"),
            self.stat_card("MODE", "3.80", "most frequent grade"),
        ).arrange(RIGHT, buff=0.38).move_to(DOWN * 2.35)
        self.fit(cards, 13.7, 2.25)
        for card in cards:
            self.play(FadeIn(card[0]), Write(card[1]), run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)

        self.wait(PAUSE_WORK)
        self.clear_stage()

        self.set_header(
            6,
            "INTERPRET THE DIFFERENCE",
            "The mean is lower than the median because low values affect the arithmetic average more strongly.",
        )

        values = [1.8, 2.9, 3.2, 3.5, 3.8, 3.8, 3.8, 4.0, 4.2, 4.5]
        axis = NumberLine(
            x_range=[1.5, 4.8, 0.5],
            length=11.6,
            include_numbers=True,
            font_size=22,
            color=BLACK_LINE,
        ).move_to(DOWN * 0.35)

        dots = VGroup()
        levels = {}
        for val in values:
            key = round(val, 1)
            level = levels.get(key, 0)
            levels[key] = level + 1
            dot = Dot(
                axis.n2p(val) + UP * (0.20 + 0.28 * level),
                radius=0.075,
                color=BLACK_LINE,
            )
            dots.add(dot)

        mean_mark = DashedLine(
            axis.n2p(EXPECTED_MEAN) + DOWN * 0.55,
            axis.n2p(EXPECTED_MEAN) + UP * 1.25,
            dash_length=0.08,
            color=BLACK_LINE,
        )
        median_mark = DashedLine(
            axis.n2p(EXPECTED_MEDIAN) + DOWN * 0.55,
            axis.n2p(EXPECTED_MEDIAN) + UP * 1.25,
            dash_length=0.08,
            color=GOOGLE_GRAY_600,
        )
        mean_label = self.text("mean 3.55", 22, BOLD).next_to(mean_mark, UP, buff=0.12)
        median_label = self.text("median 3.80", 22, BOLD).next_to(median_mark, UP, buff=0.48)

        low = SurroundingRectangle(
            VGroup(dots[0], dots[1]),
            color=BLACK_LINE,
            stroke_width=2.3,
            buff=0.16,
        )
        low_note = self.text("low grades pull the mean downward", 23, BOLD).next_to(axis, DOWN, buff=0.55)

        self.play(Create(axis), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[FadeIn(dot, shift=UP * 0.08) for dot in dots], lag_ratio=0.08), run_time=RUN_SLOW)
        self.play(Create(mean_mark), Write(mean_label), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)
        self.play(Create(median_mark), Write(median_label), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)
        self.play(Create(low), Write(low_note), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def basic_summary(self) -> None:
        self.set_header(
            7,
            "COUNT, MINIMUM AND MAXIMUM COMPLETE THE FIRST DESCRIPTION",
            "These values tell us how much data we have and the observed limits before we move into dispersion later.",
        )

        code = self.cell(
            [
                'df["grade"].count()',
                'df["grade"].min()',
                'df["grade"].max()',
            ],
            width=8.2,
            height=2.30,
            size=29,
        ).move_to(LEFT * 3.7 + UP * 0.25)
        self.play_cell(code, 5, 0.72)

        cards = VGroup(
            self.stat_card("COUNT", "10", "10 observations", width=3.7),
            self.stat_card("MIN", "1.80", "lowest observed grade", width=3.7),
            self.stat_card("MAX", "4.50", "highest observed grade", width=3.7),
        ).arrange(DOWN, buff=0.20).move_to(RIGHT * 3.85 + DOWN * 0.10)
        self.fit(cards, 4.3, 5.25)
        for card in cards:
            self.play(FadeIn(card[0]), Write(card[1]), run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)

        teaser = self.formula_panel(
            r"\text{Next: dispersion asks how spread out these values are.}",
            width=10.8,
            height=0.95,
            font_size=29,
        ).to_edge(DOWN, buff=0.28)
        self.play(FadeIn(teaser), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def filter_with_conditions(self) -> None:
        self.set_header(
            8,
            "PREVIOUS CLASS RETURNS: CONDITIONS BECOME DATA FILTERS",
            "The comparison grade >= 3.0 is evaluated for every row, so Pandas keeps only the observations that satisfy it.",
        )

        cell = self.cell(
            [
                'approved = df[df["grade"] >= 3.0]',
                'approved["grade"].mean()',
            ],
            width=11.9,
            height=2.05,
            size=27,
        ).move_to(UP * 1.20)
        self.play_cell(cell, 6, 0.82)

        out = self.output_block(["3.85"], width=10.8, size=30).move_to(DOWN * 0.32)
        self.play(FadeIn(out), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)

        all_box = self.stat_card("ALL STUDENTS", "10", "mean = 3.55", width=4.2)
        approved_box = self.stat_card("APPROVED", "8", "mean = 3.85", width=4.2)
        not_box = self.stat_card("BELOW 3.0", "2", "2.9 and 1.8", width=4.2)
        comparison = VGroup(all_box, approved_box, not_box).arrange(RIGHT, buff=0.34).move_to(DOWN * 2.20)
        self.fit(comparison, 13.5, 2.25)

        for card in comparison:
            self.play(FadeIn(card[0]), Write(card[1]), run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)

        why = self.text("Why did the mean rise from 3.55 to 3.85?  →  the two low grades were filtered out.", 24, BOLD)
        why.to_edge(DOWN, buff=0.24)
        self.fit(why, 13.7, 0.46)
        self.play(Write(why), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def workshop(self) -> None:
        self.set_header(
            9,
            "WORKSHOP — DESCRIBE THE DATASET YOURSELF",
            "Do not copy outputs. Run each step, record the result, and write one sentence explaining what the number means.",
        )

        steps = VGroup(
            self.question_card(
                "1 · LOAD",
                'import pandas as pd   →   df = pd.read_csv("estudiantes.csv")',
                width=6.5,
            ),
            self.question_card(
                "2 · EXPLORE",
                "Use head(), shape, columns and info().",
                width=6.5,
            ),
            self.question_card(
                "3 · DESCRIBE GRADE",
                "Find count, min, max, mean, median and mode.",
                width=6.5,
            ),
            self.question_card(
                "4 · FILTER",
                'Keep grade >= 3.0 and calculate the approved mean.',
                width=6.5,
            ),
        ).arrange(DOWN, buff=0.18).move_to(LEFT * 3.75 + DOWN * 0.12)
        self.fit(steps, 6.8, 5.2)

        challenge = self.note_panel(
            "FINAL INTERPRETATION",
            [
                "Mean = 3.55; median = 3.80.",
                "Explain why they are not equal.",
                "Then explain why approved mean = 3.85.",
                "Your answer must mention the data, not Python syntax.",
            ],
            width=6.4,
            title_size=26,
            body_size=23,
            max_text_height=2.85,
        ).move_to(RIGHT * 3.75 + DOWN * 0.12)

        for card in steps:
            self.play(FadeIn(card[0], shift=RIGHT * 0.05), Write(card[1]), run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)
        self.play(FadeIn(challenge[0]), FadeIn(challenge[1]), run_time=RUN_NORMAL)
        self.wait(PAUSE_FINAL)
        self.clear_stage()

    def summary(self) -> None:
        self.set_header(
            10,
            "THE WORKFLOW IS STATISTICAL, NOT ALGORITHMIC",
            "Python performs the calculation; the analyst chooses the variable, checks the structure, asks the question and interprets the result.",
        )

        route = self.process_map(
            [
                ("1", "LOAD CSV"),
                ("2", "EXPLORE"),
                ("3", "SELECT COLUMN"),
                ("4", "DESCRIBE"),
                ("5", "FILTER"),
                ("6", "INTERPRET"),
            ],
            columns=3,
        )
        route.move_to(UP * 0.10)
        self.fit(route, 13.8, 4.3)
        self.play(
            LaggedStart(*[FadeIn(card, shift=UP * 0.08) for card in route], lag_ratio=0.10),
            run_time=RUN_SLOW * 1.7,
        )
        self.wait(PAUSE_WORK)

        takeaway = self.formula_panel(
            r"\text{Python calculates. Statistics explains.}",
            width=8.5,
            height=1.0,
            font_size=36,
        ).to_edge(DOWN, buff=0.35)
        self.play(FadeIn(takeaway), run_time=RUN_NORMAL)
        self.wait(PAUSE_FINAL)
        self.standard_closing("LOAD · EXPLORE · DESCRIBE · FILTER · INTERPRET")


# Preview:
#   manim -pql src/stat11_class4_csv_stats.py Stat11Class4CSVStats --disable_caching
# Final:
#   manim -pqh src/stat11_class4_csv_stats.py Stat11Class4CSVStats --disable_caching
