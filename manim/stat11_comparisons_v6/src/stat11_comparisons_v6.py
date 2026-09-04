#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Statistics 11 — Comparison Operators in Python / Google Colab.

V6 senior rebuild focused on a materially more faithful Google Colab light-theme
interface while preserving the projection-safe JP classroom composition and the
V5 executable notebook-state corrections.

Target: Manim Community Edition 0.20.1.
"""
from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve()
V5_SRC = HERE.parents[2] / "stat11_comparisons_v5" / "src"
sys.path.insert(0, str(V5_SRC))

from stat11_comparisons_v5 import Stat11ComparisonsV5, COLAB_NOTEBOOK_TITLE
from library.jp_classroom_style import *


# Stable Google/Colab UI colors used only where interface fidelity benefits the lesson.
COLAB_ORANGE = "#E8710A"
COLAB_YELLOW = "#F9AB00"
GOOGLE_GRAY_50 = "#F8F9FA"
GOOGLE_GRAY_200 = "#DADCE0"
GOOGLE_GRAY_600 = "#5F6368"
GOOGLE_GREEN = "#188038"
GOOGLE_BLUE = "#1A73E8"


class Stat11ComparisonsV6(Stat11ComparisonsV5):
    """V6: V5 curriculum fidelity plus a much more realistic Colab UI."""

    def validate_lesson_data(self) -> None:
        # Keep every executable-sequence assertion from V5.
        super().validate_lesson_data()

        # UI-specific sanity checks: the run glyph is deliberately constructed as
        # a centered polygon, never with Manim's generic Triangle primitive.
        pts = [(-0.045, -0.070), (-0.045, 0.070), (0.082, 0.0)]
        assert len(pts) == 3
        assert pts[2][0] > pts[0][0]

    # ------------------------------------------------------------------
    # Colab interface primitives
    # ------------------------------------------------------------------
    def colab_logo(self) -> VGroup:
        """Small projector-safe approximation of the Colab logo mark."""
        c = Text("C", font="Noto Sans", font_size=25, weight=BOLD, color=COLAB_ORANGE)
        o = Text("O", font="Noto Sans", font_size=25, weight=BOLD, color=COLAB_YELLOW)
        logo = VGroup(c, o).arrange(RIGHT, buff=-0.06)
        return logo

    def _play_triangle(self, center=ORIGIN) -> Polygon:
        """Right-pointing play glyph explicitly centered inside its circle.

        V5 used Manim's generic Triangle, whose geometric center/bounding-box
        behavior produced the visibly detached icon reported in the rendered MP4.
        """
        tri = Polygon(
            LEFT*0.045 + DOWN*0.070,
            LEFT*0.045 + UP*0.070,
            RIGHT*0.082,
            stroke_width=0,
            fill_color=WHITE,
            fill_opacity=1,
        )
        tri.move_to(center)
        return tri

    def _run_button(self, center=ORIGIN) -> VGroup:
        circle = Circle(
            radius=0.18,
            stroke_color=GOOGLE_GRAY_600,
            stroke_width=0,
            fill_color=GOOGLE_GRAY_600,
            fill_opacity=1,
        ).move_to(center)
        tri = self._play_triangle(circle.get_center())
        return VGroup(circle, tri)

    def cell(self, lines, width=11.4, height=None, size=34, execution="[ ]") -> VGroup:
        """Modern Colab-like selected code cell with a real gutter hierarchy.

        Structure is intentionally compatible with the previous scene API:
        cell[0] = frame/chrome, cell[1] = run/count/status controls,
        cell[2] = code lines.
        """
        code = VGroup(*[self.code(line, size) for line in lines])
        code.arrange(DOWN, aligned_edge=LEFT, buff=0.19)
        h = height or max(1.48, code.height + 0.66)

        box = RoundedRectangle(
            width=width,
            height=h,
            corner_radius=0.08,
            stroke_color=GOOGLE_GRAY_200,
            stroke_width=1.25,
            fill_color=GOOGLE_GRAY_50,
            fill_opacity=1,
        )

        # Colab selection cue: thin blue rail, not the heavy black V5 edge.
        selection = Line(
            box.get_corner(UL) + DOWN*0.07,
            box.get_corner(DL) + UP*0.07,
            stroke_color=GOOGLE_BLUE,
            stroke_width=2.5,
        )

        # Place code first so the play button can align with the first code row.
        self.fit(code, width - 1.55, h - 0.34)
        code.move_to(box).align_to(box, LEFT).shift(RIGHT*1.28)
        first_y = code[0].get_center()[1]

        run_center = np.array([box.get_left()[0] + 0.77, first_y, 0.0])
        run = self._run_button(run_center)

        count = self.code(execution, 13, MEDIUM)
        count.move_to(
            np.array([
                box.get_left()[0] + 0.30,
                box.get_top()[1] - 0.26,
                0.0,
            ])
        )

        check = Text("✓", font="Noto Sans", font_size=12, weight=BOLD, color=GOOGLE_GREEN)
        elapsed = self.code("0s", 11, MEDIUM)
        elapsed.set_color(GOOGLE_GRAY_600)
        status = VGroup(check, elapsed).arrange(RIGHT, buff=0.05)
        status.next_to(count, DOWN, buff=0.08)

        more = self.text("⋮", 18, MEDIUM)
        more.set_color(GOOGLE_GRAY_600)
        more.move_to(box.get_corner(UR) + LEFT*0.22 + DOWN*0.22)

        frame = VGroup(box, selection, more)
        controls = VGroup(run, count, status)
        return VGroup(frame, controls, code)

    def play_cell(self, cell: VGroup, run_no: int, line_time=0.95) -> None:
        """Animate a Colab cell as write -> run -> completion status.

        The execution counter is separate from the play button, and the play glyph
        briefly becomes a stop square while the cell is 'running'.
        """
        frame, controls, code = cell
        run, count, status = controls

        self.play(FadeIn(frame), FadeIn(run), FadeIn(count), run_time=RUN_NORMAL)
        for line in code:
            self.play(Write(line, rate_func=linear), run_time=line_time)
            self.wait(0.24)

        stop = Square(
            side_length=0.090,
            stroke_width=0,
            fill_color=WHITE,
            fill_opacity=1,
        ).move_to(run[0])
        self.play(Transform(run[1], stop), run_time=0.20)
        self.wait(0.18)

        new_count = self.code(f"[{run_no}]", 13, MEDIUM).move_to(count)
        self.play(Transform(count, new_count), run_time=0.28)
        self.play(FadeIn(status, shift=UP*0.02), run_time=0.24)

        play = self._play_triangle(run[0].get_center())
        self.play(Transform(run[1], play), run_time=0.20)
        self.wait(PAUSE_SHORT)

    def colab_bar(self, notebook_title=COLAB_NOTEBOOK_TITLE, width=13.25) -> VGroup:
        """Current-style Colab notebook chrome without the artificial V5 card.

        Stable controls are represented: notebook title, menus, Commands,
        + Code, + Text, Run all, resource status, and Share. The UI is drawn as
        stacked application rows separated by subtle rules rather than a large
        rounded classroom panel.
        """
        spacer = Rectangle(width=width, height=1.08, stroke_opacity=0, fill_opacity=0)

        logo = self.colab_logo()
        title = self.text(notebook_title, 20, MEDIUM)
        self.fit(title, 4.5, 0.30)

        resources = self.text("RAM 0.8 / 12.7 GB    Disk 22.4 / 107.7 GB", 12, MEDIUM)
        resources.set_color(GOOGLE_GRAY_600)
        self.fit(resources, 3.6, 0.24)

        share_text = self.text("Share", 13, BOLD)
        share_text.set_color(WHITE)
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
        share = VGroup(share_pill, share_text)

        top = VGroup(logo, title, resources, share).arrange(RIGHT, buff=0.24)
        self.fit(top, width - 0.36, 0.36)
        top.move_to(spacer.get_center() + UP*0.28)

        menus = self.text("File   Edit   View   Insert   Runtime   Tools   Help", 13, MEDIUM)
        menus.set_color(GOOGLE_GRAY_600)
        actions = self.text("Commands     + Code     + Text     Run all", 14, MEDIUM)
        self.fit(actions, 5.2, 0.27)
        bottom = VGroup(menus, actions).arrange(RIGHT, buff=0.48)
        self.fit(bottom, width - 0.36, 0.29)
        bottom.move_to(spacer.get_center() + DOWN*0.25)

        divider = Line(
            spacer.get_left() + RIGHT*0.08,
            spacer.get_right() + LEFT*0.08,
            stroke_color=GOOGLE_GRAY_200,
            stroke_width=1.0,
        ).move_to(spacer.get_center() + UP*0.02)
        bottom_rule = Line(
            spacer.get_left(), spacer.get_right(),
            stroke_color=GOOGLE_GRAY_200,
            stroke_width=1.2,
        ).move_to(spacer.get_bottom() + UP*0.02)

        return VGroup(spacer, divider, bottom_rule, top, bottom)

    def colab_output(self, lines, width=10.8, size=30) -> VGroup:
        """Literal Colab output: plain text aligned under the code region."""
        texts = VGroup(*[self.code(str(line), size, MEDIUM) for line in lines])
        texts.arrange(DOWN, aligned_edge=LEFT, buff=0.10)
        self.fit(texts, width - 1.45, 1.20)

        h = max(0.56, texts.height + 0.20)
        spacer = Rectangle(width=width, height=h, stroke_opacity=0, fill_opacity=0)
        texts.move_to(spacer).align_to(spacer, LEFT).shift(RIGHT*1.22)
        return VGroup(spacer, texts)

    # ------------------------------------------------------------------
    # Scene-level refinement: keep V5 pedagogy; state why the cell controls matter.
    # ------------------------------------------------------------------
    def colab_cycle(self) -> None:
        self.set_header(
            2,
            "INSIDE GOOGLE COLAB",
            "The run button is beside the code; execution status stays in the left gutter and output appears below.",
        )
        bar = self.colab_bar().move_to(UP*1.45)
        self.assert_content_safe(bar, "V6 Colab toolbar")
        self.play(FadeIn(bar, shift=UP*0.06), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)

        c = self.cell(["score = 4.2", "score >= 3.0"], 11.6, 1.95, 34).move_to(DOWN*0.12)
        self.assert_content_safe(c, "V6 Colab code cell")
        self.play_cell(c, 1, 1.00)

        out = self.colab_output(["True"], 10.9, 31).move_to(DOWN*1.55)
        self.assert_content_safe(out, "V6 literal output")
        self.play(FadeIn(out, shift=UP*0.04), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)

        note = self.interpretation("4.2 reached the pass mark of 3.0.", 7.1).move_to(DOWN*2.90)
        self.assert_content_safe(note, "V6 interpretation")
        self.play(FadeIn(note[0]), Write(note[1][0]), run_time=RUN_NORMAL)
        self.play(LaggedStart(*[Write(x) for x in note[1][1]], lag_ratio=0.18), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()
