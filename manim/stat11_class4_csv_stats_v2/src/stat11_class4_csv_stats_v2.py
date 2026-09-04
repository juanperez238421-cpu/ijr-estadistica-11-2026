#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Statistics 11 — Class 4 V2: From Small CSV to Big Data in Google Colab.

This version keeps the complete Statistics 11 Class 4 statistical workflow and
adds an explicit scale bridge:

SMALL DATASET -> BIG DATASET -> SAME STATISTICAL QUESTIONS

The large dataset is a transparent synthetic scale demonstration: the 10-row
grade pattern from estudiantes.csv is repeated 100,000 times, producing
1,000,000 observations. The purpose is not to introduce advanced programming;
it is to show why Colab + Pandas matter when manual inspection stops being
possible.

Target: Manim Community Edition 0.20.1
Render target: 1920x1080, 30 fps, H.264/yuv420p.
"""
from __future__ import annotations

import statistics
import sys
from pathlib import Path

import numpy as np
from manim import *

HERE = Path(__file__).resolve()
V1_SRC = HERE.parents[2] / "stat11_class4_csv_stats" / "src"
sys.path.insert(0, str(V1_SRC))

from stat11_class4_csv_stats import (
    Stat11Class4CSVStats,
    EXPECTED_GRADES,
    EXPECTED_MEAN,
    EXPECTED_MEDIAN,
    EXPECTED_MODE,
    EXPECTED_MIN,
    EXPECTED_MAX,
    EXPECTED_APPROVED_COUNT,
    EXPECTED_APPROVED_MEAN,
    PASS_MARK,
    BLACK_LINE,
    BLACK_TEXT,
    GOOGLE_GRAY_600,
    GOOGLE_BLUE,
    RUN_NORMAL,
    RUN_QUICK,
    RUN_SLOW,
    PAUSE_SHORT,
    PAUSE_READ,
    PAUSE_EXPLAIN,
    PAUSE_WORK,
    PAUSE_FINAL,
)

SMALL_ROWS = 10
BIG_ROWS = 1_000_000
REPEAT_FACTOR = BIG_ROWS // SMALL_ROWS
BIG_COLUMNS = 6
BIG_APPROVED_COUNT = EXPECTED_APPROVED_COUNT * REPEAT_FACTOR
BIG_MODE_COUNT = EXPECTED_GRADES.count(EXPECTED_MODE) * REPEAT_FACTOR

BIG_PREVIEW = [
    ["1", "17", "4.2", "0.96", "6.5", "True"],
    ["2", "16", "3.8", "0.88", "4.0", "True"],
    ["3", "17", "3.5", "0.91", "3.5", "True"],
    ["4", "16", "4.0", "0.94", "5.5", "True"],
    ["5", "17", "2.9", "0.78", "2.5", "False"],
]


class Stat11Class4CSVStatsV2(Stat11Class4CSVStats):
    """Class 4 V2 — preserves V1 and adds an explicit small-to-big-data story."""

    def validate_lesson_data(self) -> None:
        super().validate_lesson_data()

        assert BIG_ROWS == SMALL_ROWS * REPEAT_FACTOR
        assert REPEAT_FACTOR == 100_000
        assert BIG_COLUMNS == 6

        # Repeating the same 10-value pattern preserves the distribution.
        assert abs(sum(EXPECTED_GRADES) * REPEAT_FACTOR / BIG_ROWS - EXPECTED_MEAN) < 1e-12
        assert statistics.median(EXPECTED_GRADES) == EXPECTED_MEDIAN
        assert statistics.multimode(EXPECTED_GRADES) == [EXPECTED_MODE]
        assert min(EXPECTED_GRADES) == EXPECTED_MIN
        assert max(EXPECTED_GRADES) == EXPECTED_MAX
        assert BIG_APPROVED_COUNT == 800_000
        assert BIG_MODE_COUNT == 300_000

        approved = [x for x in EXPECTED_GRADES if x >= PASS_MARK]
        assert abs(statistics.mean(approved) - EXPECTED_APPROVED_MEAN) < 1e-12

    # ------------------------------------------------------------------
    # Header numbering support
    # ------------------------------------------------------------------
    def set_header(self, number: int, title: str, subtitle: str) -> None:
        """Allow inherited V1 sections to be shifted without rewriting them."""
        offset = getattr(self, "_header_offset", 0)
        return super().set_header(number + offset, title, subtitle)

    def absolute_header(self, number: int, title: str, subtitle: str) -> None:
        old = getattr(self, "_header_offset", 0)
        self._header_offset = 0
        try:
            self.set_header(number, title, subtitle)
        finally:
            self._header_offset = old

    # ------------------------------------------------------------------
    # Main orchestration
    # ------------------------------------------------------------------
    def construct(self) -> None:
        self._header_offset = 0
        self.standard_opening(
            "STATISTICS 11 · PYTHON / GOOGLE COLAB",
            "CLASS 4 V2 — FROM SMALL CSV TO BIG DATA",
            "How can the same statistical questions scale from 10 rows to 1,000,000?",
            "SEE SMALL DATA  →  SCALE UP  →  QUERY BIG DATA  →  DESCRIBE  →  FILTER  →  INTERPRET",
        )

        # V1 foundation: see a simple CSV and DataFrame.
        self._header_offset = 0
        self.csv_to_dataframe()               # 01

        # New scale bridge.
        self.scale_bridge()                   # 02
        self.big_dataset_in_colab()           # 03

        # Preserve the V1 statistical workflow, shifted by +2.
        self._header_offset = 2
        self.load_in_colab()                  # 04
        self.explore_before_calculating()     # 05
        self.select_grade_column()            # 06
        self.central_tendency()               # 07 + 08
        self.basic_summary()                  # 09

        # New scale-aware statistical comparison.
        self._header_offset = 0
        self.same_code_different_scale()      # 10
        self.filter_at_scale()                # 11
        self.big_data_strategy()              # 12
        self.workshop_v2()                    # 13
        self.summary_v2()                     # 14

    # ------------------------------------------------------------------
    # New scenes
    # ------------------------------------------------------------------
    def scale_bridge(self) -> None:
        self.absolute_header(
            2,
            "WHEN THE DATASET GROWS, MANUAL READING STOPS WORKING",
            "Ten rows can be inspected by eye. One million rows require questions, filters and statistical summaries.",
        )

        small_box = RoundedRectangle(
            width=4.6, height=4.6, corner_radius=0.14,
            stroke_color=BLACK_LINE, stroke_width=2,
            fill_color=WHITE, fill_opacity=1,
        ).move_to(LEFT * 4.5 + DOWN * 0.35)
        small_title = self.text("SMALL DATASET", 28, BOLD)
        small_count = self.text("10 rows", 44, BOLD)
        small_desc = self.text("You can still inspect every observation.", 21)
        self.fit(small_desc, 4.0, 0.55)
        mini_rows = VGroup(
            *[self.code(x, 18) for x in [
                "S01,17,4.2",
                "S02,16,3.8",
                "S03,17,3.5",
                "S04,16,4.0",
                "...",
                "S10,16,3.8",
            ]]
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.09)
        small_content = VGroup(small_title, small_count, mini_rows, small_desc).arrange(
            DOWN, buff=0.24
        )
        small_content.move_to(small_box)
        small_group = VGroup(small_box, small_content)

        big_box = RoundedRectangle(
            width=5.2, height=4.6, corner_radius=0.14,
            stroke_color=BLACK_LINE, stroke_width=2.2,
            fill_color=WHITE, fill_opacity=1,
        ).move_to(RIGHT * 4.15 + DOWN * 0.35)
        big_title = self.text("BIG DATASET", 28, BOLD)
        numbers = VGroup(
            self.text("10 rows", 35, BOLD),
            self.text("1,000 rows", 35, BOLD),
            self.text("100,000 rows", 35, BOLD),
            self.text("1,000,000 rows", 42, BOLD),
        )
        numbers.arrange(DOWN, buff=0.18)
        big_desc = self.text("Scrolling is no longer analysis.", 23, BOLD)
        big_sub = self.text("Ask the DataFrame questions instead.", 21)
        big_content = VGroup(big_title, numbers[0], big_desc, big_sub).arrange(DOWN, buff=0.28)
        big_content.move_to(big_box)
        big_group = VGroup(big_box, big_content)

        arrow = Arrow(
            LEFT * 0.72, RIGHT * 0.72, buff=0,
            stroke_width=3.3, color=BLACK_LINE,
        ).move_to(DOWN * 0.35)
        scale_label = self.text("× 100,000", 22, BOLD).next_to(arrow, UP, buff=0.18)

        self.assert_content_safe(VGroup(small_group, big_group, arrow, scale_label), "scale bridge")

        self.play(FadeIn(small_box), FadeIn(big_box), run_time=RUN_NORMAL)
        self.play(Write(small_title), Write(small_count), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[Write(r) for r in mini_rows], lag_ratio=0.08), run_time=RUN_SLOW)
        self.play(Write(small_desc), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)

        self.play(Write(big_title), FadeIn(numbers[0]), run_time=RUN_NORMAL)
        self.wait(PAUSE_SHORT)
        for target in numbers[1:]:
            target.move_to(numbers[0])
            self.play(Transform(numbers[0], target), run_time=RUN_NORMAL)
            self.wait(PAUSE_SHORT)

        self.play(GrowArrow(arrow), Write(scale_label), run_time=RUN_NORMAL)
        self.play(Write(big_desc), Write(big_sub), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)

        rule = self.formula_panel(
            r"\text{More rows do not require more lines of analysis code.}",
            width=10.8, height=0.95, font_size=29,
        ).to_edge(DOWN, buff=0.28)
        self.play(FadeIn(rule), run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)
        self.clear_stage()

    def big_dataset_in_colab(self) -> None:
        self.absolute_header(
            3,
            "A BIG DATASET IS PREVIEWED, NOT PRINTED ROW BY ROW",
            "head() shows a few observations while shape tells us the true scale of the complete DataFrame.",
        )

        bar = self.colab_bar("Statistics11_BigData.ipynb").move_to(UP * 1.80)
        cell = self.cell(
            [
                'df_big = pd.read_csv("estudiantes_big.csv")',
                "df_big.shape",
                "df_big.head()",
            ],
            width=12.2, height=2.15, size=25,
        ).move_to(UP * 0.35)

        self.assert_content_safe(VGroup(bar, cell), "big data Colab top")
        self.play(FadeIn(bar, shift=UP * 0.05), run_time=RUN_NORMAL)
        self.play_cell(cell, 2, 0.74)

        shape = self.text("(1000000, 6)", 30, BOLD).move_to(DOWN * 1.00)
        shape_note = self.text("1,000,000 observations × 6 variables", 22)
        shape_note.next_to(shape, RIGHT, buff=0.32)
        self.play(Write(shape), Write(shape_note), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)

        table = self.build_table(
            headers=("student_id", "age", "grade", "attendance", "study_hours", "passed"),
            body_rows=BIG_PREVIEW,
            column_widths=(2.05, 1.05, 1.20, 2.00, 2.10, 1.45),
            math_columns=(0, 1, 2, 3, 4),
            row_height=0.34,
            header_height=0.42,
            body_font_size=16,
            header_font_size=15,
        )
        table.group.move_to(DOWN * 2.45)
        self.assert_content_safe(table.group, "big dataset head table")
        self.animate_table_rows(table, include_header=True, pause=0.20)

        ellipsis = self.text("⋮    999,995 additional rows remain in the DataFrame", 21, BOLD)
        ellipsis.to_edge(DOWN, buff=0.26)
        self.fit(ellipsis, 13.4, 0.42)
        self.play(Write(ellipsis), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def same_code_different_scale(self) -> None:
        self.absolute_header(
            10,
            "THE SAME STATISTICAL CODE SCALES FROM 10 TO 1,000,000 ROWS",
            "Pandas applies the operation to an entire column; the analyst writes the question once.",
        )

        left_title = self.text("SMALL · 10 rows", 26, BOLD)
        right_title = self.text("BIG · 1,000,000 rows", 26, BOLD)

        left_cell = self.cell(
            [
                'df["grade"].mean()',
                'df["grade"].median()',
                'df["grade"].mode()[0]',
            ],
            width=6.3, height=2.45, size=22,
        )
        right_cell = self.cell(
            [
                'df_big["grade"].mean()',
                'df_big["grade"].median()',
                'df_big["grade"].mode()[0]',
            ],
            width=6.3, height=2.45, size=21,
        )

        left = VGroup(left_title, left_cell).arrange(DOWN, buff=0.22)
        right = VGroup(right_title, right_cell).arrange(DOWN, buff=0.22)
        left.move_to(LEFT * 3.6 + UP * 0.55)
        right.move_to(RIGHT * 3.6 + UP * 0.55)
        self.assert_content_safe(VGroup(left, right), "same code cells")

        self.play(Write(left_title), Write(right_title), run_time=RUN_NORMAL)
        self.play_cell(left_cell, 6, 0.55)
        self.play_cell(right_cell, 7, 0.55)

        left_result = self.note_panel(
            "RESULT",
            ["mean = 3.55", "median = 3.80", "mode = 3.80 (3 rows)"],
            width=5.8, title_size=23, body_size=22, max_text_height=1.55,
        ).move_to(LEFT * 3.6 + DOWN * 2.15)

        right_result = self.note_panel(
            "RESULT",
            ["mean = 3.55", "median = 3.80", "mode = 3.80 (300,000 rows)"],
            width=5.8, title_size=23, body_size=22, max_text_height=1.55,
        ).move_to(RIGHT * 3.6 + DOWN * 2.15)

        self.play(FadeIn(left_result), FadeIn(right_result), run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)

        message = self.text(
            "100,000× more observations — almost the same analysis code.",
            27, BOLD,
        ).to_edge(DOWN, buff=0.25)
        self.fit(message, 13.5, 0.50)
        self.play(Write(message), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def filter_at_scale(self) -> None:
        self.absolute_header(
            11,
            "ONE CONDITION CAN FILTER HUNDREDS OF THOUSANDS OF ROWS",
            "The comparison from the previous class becomes a mask: grade >= 3.0 is evaluated across the whole DataFrame.",
        )

        question = self.formula_panel(
            r"\text{Question: which observations have grade } \ge 3.0\text{?}",
            width=11.8, height=0.96, font_size=30,
        ).move_to(UP * 1.72)
        self.play(FadeIn(question), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)

        small_cell = self.cell(
            [
                'approved = df[df["grade"] >= 3.0]',
                "approved.shape",
            ],
            width=6.1, height=1.90, size=21,
        ).move_to(LEFT * 3.55 + UP * 0.20)

        big_cell = self.cell(
            [
                'approved_big = df_big[df_big["grade"] >= 3.0]',
                "approved_big.shape",
            ],
            width=6.1, height=1.90, size=19,
        ).move_to(RIGHT * 3.55 + UP * 0.20)

        self.play_cell(small_cell, 8, 0.58)
        self.play_cell(big_cell, 9, 0.58)

        small_card = self.stat_card(
            "SMALL FILTER", "8 / 10", "approved mean = 3.85", width=5.6
        ).move_to(LEFT * 3.55 + DOWN * 2.05)
        big_card = self.stat_card(
            "BIG FILTER", "800,000 / 1,000,000", "approved mean = 3.85", width=5.6
        ).move_to(RIGHT * 3.55 + DOWN * 2.05)

        self.play(FadeIn(small_card), FadeIn(big_card), run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)

        line = self.text(
            "The condition is simple; the number of rows can be enormous.",
            25, BOLD,
        ).to_edge(DOWN, buff=0.24)
        self.play(Write(line), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def big_data_strategy(self) -> None:
        self.absolute_header(
            12,
            "WITH BIG DATA, DO NOT ASK TO SEE EVERYTHING",
            "A DataFrame becomes useful when we replace scrolling with targeted statistical questions.",
        )

        raw = self.note_panel(
            "1 · PREVIEW",
            [
                "head() → inspect a sample",
                "shape → measure the scale",
                "columns / info() → understand structure",
            ],
            width=4.2, title_size=24, body_size=20, max_text_height=2.0,
        )
        describe = self.note_panel(
            "2 · DESCRIBE",
            [
                "count / min / max",
                "mean / median / mode",
                "summaries replace row-by-row reading",
            ],
            width=4.2, title_size=24, body_size=20, max_text_height=2.0,
        )
        query = self.note_panel(
            "3 · QUERY",
            [
                "filter with conditions",
                "compare meaningful subsets",
                "interpret the result statistically",
            ],
            width=4.2, title_size=24, body_size=20, max_text_height=2.0,
        )
        cards = VGroup(raw, describe, query).arrange(RIGHT, buff=0.34).move_to(UP * 0.10)
        self.fit(cards, 13.7, 4.4)
        self.assert_content_safe(cards, "big data strategy")

        for card in cards:
            self.play(FadeIn(card[0], shift=UP * 0.06), FadeIn(card[1]), run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)

        flow = self.formula_panel(
            r"1{,}000{,}000\ \text{rows} \rightarrow \text{a few questions} \rightarrow \text{interpretable information}",
            width=12.4, height=1.02, font_size=31,
        ).to_edge(DOWN, buff=0.32)
        self.play(FadeIn(flow), run_time=RUN_NORMAL)
        self.wait(PAUSE_FINAL)
        self.clear_stage()

    def workshop_v2(self) -> None:
        self.absolute_header(
            13,
            "WORKSHOP — THINK SMALL FIRST, THEN SCALE THE SAME QUESTION",
            "Use the 10-row dataset to understand the meaning. Then explain how the same code works on the 1,000,000-row dataset.",
        )

        left = VGroup(
            self.question_card(
                "1 · SMALL DATASET",
                "Read all 10 rows. Identify the variables and the grade column.",
                width=6.25,
            ),
            self.question_card(
                "2 · DESCRIBE",
                "Find count, min, max, mean, median and mode for grade.",
                width=6.25,
            ),
            self.question_card(
                "3 · INTERPRET",
                "Why is mean = 3.55 lower than median = 3.80?",
                width=6.25,
            ),
        ).arrange(DOWN, buff=0.18)

        right = VGroup(
            self.question_card(
                "4 · BIG DATASET",
                "Use shape and head(). Explain why printing 1,000,000 rows is unnecessary.",
                width=6.25,
            ),
            self.question_card(
                "5 · SAME STATISTICS",
                "Run mean, median and mode on df_big['grade'].",
                width=6.25,
            ),
            self.question_card(
                "6 · FILTER AT SCALE",
                "Filter grade >= 3.0. Explain 8/10 versus 800,000/1,000,000.",
                width=6.25,
            ),
        ).arrange(DOWN, buff=0.18)

        columns = VGroup(left, right).arrange(RIGHT, buff=0.40).move_to(DOWN * 0.20)
        self.fit(columns, 13.5, 5.0)
        self.assert_content_safe(columns, "V2 workshop columns")

        for pair in zip(left, right):
            self.play(
                FadeIn(pair[0][0], shift=RIGHT * 0.04),
                FadeIn(pair[0][1]),
                FadeIn(pair[1][0], shift=LEFT * 0.04),
                FadeIn(pair[1][1]),
                run_time=RUN_NORMAL,
            )
            self.wait(PAUSE_READ)

        final = self.text(
            "Your explanation must mention the data and the statistical question — not only the Python command.",
            23, BOLD,
        ).to_edge(DOWN, buff=0.24)
        self.fit(final, 13.6, 0.45)
        self.play(Write(final), run_time=RUN_NORMAL)
        self.wait(PAUSE_FINAL)
        self.clear_stage()

    def summary_v2(self) -> None:
        self.absolute_header(
            14,
            "COLAB BECOMES POWERFUL WHEN THE DATA IS TOO LARGE TO READ MANUALLY",
            "The tool scales the computation; statistical reasoning still decides what to ask and how to interpret the answer.",
        )

        scale = VGroup(
            self.stat_card("SMALL", "10 rows", "see every observation", width=3.8),
            self.stat_card("BIG", "1,000,000 rows", "query instead of scroll", width=4.4),
            self.stat_card("SAME IDEA", "1 column", "describe · filter · interpret", width=4.4),
        ).arrange(RIGHT, buff=0.34).move_to(UP * 1.05)
        self.fit(scale, 13.5, 2.2)

        self.play(
            LaggedStart(*[FadeIn(card, shift=UP * 0.08) for card in scale], lag_ratio=0.12),
            run_time=RUN_SLOW,
        )
        self.wait(PAUSE_EXPLAIN)

        route = self.process_map(
            [
                ("1", "LOAD"),
                ("2", "PREVIEW"),
                ("3", "MEASURE SCALE"),
                ("4", "SELECT VARIABLE"),
                ("5", "DESCRIBE / FILTER"),
                ("6", "INTERPRET"),
            ],
            columns=3,
        )
        route.move_to(DOWN * 1.10)
        self.fit(route, 13.6, 3.2)
        self.play(
            LaggedStart(*[FadeIn(card, shift=UP * 0.06) for card in route], lag_ratio=0.08),
            run_time=RUN_SLOW * 1.5,
        )
        self.wait(PAUSE_WORK)

        takeaway = self.formula_panel(
            r"\text{Do not scroll through big data. Ask it statistical questions.}",
            width=11.2, height=0.98, font_size=31,
        ).to_edge(DOWN, buff=0.27)
        self.play(FadeIn(takeaway), run_time=RUN_NORMAL)
        self.wait(PAUSE_FINAL)
        self.standard_closing("SMALL DATA HELPS US SEE · BIG DATA SHOWS WHY CODE MATTERS")


# Preview:
#   manim -pql src/stat11_class4_csv_stats_v2.py Stat11Class4CSVStatsV2 --disable_caching
# Final:
#   manim -pqh src/stat11_class4_csv_stats_v2.py Stat11Class4CSVStatsV2 --disable_caching
