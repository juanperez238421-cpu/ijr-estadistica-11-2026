#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""JP Classroom ManimCE Style Library.

Reusable base architecture derived from the class-layout conventions used in
`statistics10_frequency_variance_layout_v10(1).py`.

Design contract
---------------
- Horizontal Full HD 16:9, 1920x1080, 30 fps.
- White background.
- Black text / MathTex and neutral gray hierarchy.
- Persistent numbered section header + subtitle.
- Safe-layout fitting before animation.
- Custom tables with independently addressable cells/rows/columns.
- Controlled MovingCameraScene focus that temporarily hides the header.
- Centralized timing and LESSON_TIME_SCALE for QA previews.
- Geometry, equations and tables should coexist when pedagogically useful.
- Numerical/data claims should be validated before rendering.

Compatible target: Manim Community Edition 0.20.x.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable, Sequence

import numpy as np
from manim import *


# =============================================================================
# RENDER CONFIGURATION — PROJECT DEFAULT
# =============================================================================
config.pixel_width = 1920
config.pixel_height = 1080
config.frame_width = 16
config.frame_height = 9
config.frame_rate = 30
config.background_color = WHITE


# =============================================================================
# VISUAL SYSTEM — MONOCHROME CLASSROOM
# =============================================================================
BLACK_TEXT = BLACK
BLACK_LINE = BLACK
DARK_GRAY = "#303030"
MID_GRAY = "#787878"
LIGHT_GRAY = "#D7D7D7"
VERY_LIGHT_GRAY = "#F0F0F0"
PAPER_GRAY = "#F8F8F8"
WHITE_FILL = WHITE

FRAME_WIDTH = 16.0
FRAME_HEIGHT = 9.0
SAFE_WIDTH = 14.75
SAFE_HEIGHT = 7.65
CONTENT_TOP_Y = 2.60
CONTENT_BOTTOM_Y = -4.05

TIME_SCALE = float(os.getenv("LESSON_TIME_SCALE", "1.0"))

RUN_QUICK = 0.70
RUN_NORMAL = 1.00
RUN_SLOW = 1.35
RUN_CAMERA = 1.25

PAUSE_SHORT = 0.85
PAUSE_READ = 1.80
PAUSE_EXPLAIN = 2.80
PAUSE_WORK = 3.80
PAUSE_SUMMARY = 4.60
PAUSE_FINAL = 5.20


# =============================================================================
# STRUCTURED RETURN OBJECTS
# =============================================================================
@dataclass
class TableDiagram:
    """Structured access to a custom table and its visual components."""

    group: VGroup
    rectangles: list[list[Rectangle]]
    entries: list[list[Mobject]]
    rows: list[VGroup]
    columns: list[VGroup]
    header: VGroup
    body: VGroup


@dataclass
class FigurePanel:
    """A figure plus optional title/caption and its containing panel."""

    group: VGroup
    box: RoundedRectangle
    figure: Mobject
    title: Mobject | None
    caption: Mobject | None


@dataclass
class SplitLayout:
    """Two-column composition for visual + mathematical explanation."""

    group: VGroup
    left: Mobject
    right: Mobject


# =============================================================================
# BASE SCENE
# =============================================================================
class JPClassroomScene(MovingCameraScene):
    """Base scene for all classroom videos using the consolidated visual style.

    Subclasses normally override:
        - validate_lesson_data()
        - construct()

    Typical scene flow:
        opening -> vocabulary -> visual model -> equations -> worked example
        -> checks -> interpretation -> summary.
    """

    def setup(self) -> None:
        super().setup()
        self.validate_lesson_data()
        self.camera.background_color = WHITE
        self.camera.frame.set(width=FRAME_WIDTH).move_to(ORIGIN)
        self.header_group: VGroup | None = None
        self.subtitle_group: Mobject | None = None

    # ---------------------------------------------------------------------
    # Data validation hook
    # ---------------------------------------------------------------------
    def validate_lesson_data(self) -> None:
        """Override in each lesson to assert every displayed numerical claim.

        Example:
            assert abs(sum(values) / len(values) - EXPECTED_MEAN) < 1e-12
        """

    # ---------------------------------------------------------------------
    # Global timing wrappers
    # ---------------------------------------------------------------------
    def play(self, *animations, **kwargs):
        if kwargs.get("run_time") is not None:
            kwargs["run_time"] *= TIME_SCALE
        return super().play(*animations, **kwargs)

    def wait(self, duration: float = DEFAULT_WAIT_TIME, *args, **kwargs):
        return super().wait(duration * TIME_SCALE, *args, **kwargs)

    # ---------------------------------------------------------------------
    # Typography
    # ---------------------------------------------------------------------
    def text(
        self,
        content: str,
        size: int = 30,
        weight=NORMAL,
        **kwargs,
    ) -> Text:
        return Text(
            content,
            font_size=size,
            color=BLACK_TEXT,
            weight=weight,
            line_spacing=0.92,
            **kwargs,
        )

    def math(self, expression: str, size: int = 38, **kwargs) -> MathTex:
        return MathTex(expression, font_size=size, color=BLACK_TEXT, **kwargs)

    def fit(
        self,
        mob: Mobject,
        max_width: float = SAFE_WIDTH,
        max_height: float = SAFE_HEIGHT,
    ) -> Mobject:
        """Only scale down; never enlarge. This preserves typography hierarchy."""
        if mob.width > max_width:
            mob.scale_to_fit_width(max_width)
        if mob.height > max_height:
            mob.scale_to_fit_height(max_height)
        return mob

    def fit_content_zone(
        self,
        mob: Mobject,
        max_width: float = 14.4,
        max_height: float = 5.85,
    ) -> Mobject:
        return self.fit(mob, max_width=max_width, max_height=max_height)

    # ---------------------------------------------------------------------
    # Core panels
    # ---------------------------------------------------------------------
    def formula_panel(
        self,
        expression: str,
        width: float = 8.4,
        height: float = 1.25,
        font_size: int = 42,
        fill_opacity: float = 1.0,
    ) -> VGroup:
        panel = RoundedRectangle(
            width=width,
            height=height,
            corner_radius=0.12,
            stroke_color=BLACK_LINE,
            stroke_width=2.0,
            fill_color=PAPER_GRAY,
            fill_opacity=fill_opacity,
        )
        equation = self.math(expression, font_size)
        self.fit(equation, width - 0.55, height - 0.28)
        equation.move_to(panel)
        return VGroup(panel, equation)

    def note_panel(
        self,
        title: str,
        lines: Sequence[str],
        width: float = 6.4,
        title_size: int = 26,
        body_size: int = 23,
        max_text_height: float = 2.55,
    ) -> VGroup:
        title_mob = self.text(title, title_size, BOLD)
        body = VGroup(*[self.text(line, body_size) for line in lines])
        body.arrange(DOWN, aligned_edge=LEFT, buff=0.16)
        content = VGroup(title_mob, body).arrange(DOWN, aligned_edge=LEFT, buff=0.22)
        self.fit(content, width - 0.62, max_text_height)

        box_height = max(1.10, content.height + 0.64)
        box = RoundedRectangle(
            width=width,
            height=box_height,
            corner_radius=0.12,
            stroke_color=BLACK_LINE,
            stroke_width=1.8,
            fill_color=WHITE_FILL,
            fill_opacity=1.0,
        )
        content.move_to(box)
        content.align_to(box, LEFT).shift(RIGHT * 0.31)
        return VGroup(box, content)

    def key_value_panel(
        self,
        title: str,
        pairs: Sequence[tuple[str, str]],
        width: float = 6.0,
        label_size: int = 23,
        value_size: int = 28,
    ) -> VGroup:
        """Compact glossary/data card for symbol-definition pairs."""
        title_mob = self.text(title, 26, BOLD)
        rows = VGroup()
        for label, value in pairs:
            lhs = self.text(label, label_size, BOLD)
            rhs = self.math(value, value_size) if any(c in value for c in "_^\\=") else self.text(value, value_size)
            row = VGroup(lhs, rhs).arrange(RIGHT, buff=0.25)
            rows.add(row)
        rows.arrange(DOWN, aligned_edge=LEFT, buff=0.18)
        content = VGroup(title_mob, rows).arrange(DOWN, aligned_edge=LEFT, buff=0.22)
        self.fit(content, width - 0.60, 4.8)
        box = RoundedRectangle(
            width=width,
            height=max(1.3, content.height + 0.65),
            corner_radius=0.12,
            stroke_color=BLACK_LINE,
            stroke_width=1.8,
            fill_color=WHITE_FILL,
            fill_opacity=1,
        )
        content.move_to(box).align_to(box, LEFT).shift(RIGHT * 0.30)
        return VGroup(box, content)

    # ---------------------------------------------------------------------
    # Persistent section header
    # ---------------------------------------------------------------------
    def set_header(self, number: int, title: str, subtitle: str) -> None:
        number_box = RoundedRectangle(
            width=0.72,
            height=0.52,
            corner_radius=0.10,
            stroke_color=BLACK_LINE,
            stroke_width=2.0,
            fill_color=WHITE_FILL,
            fill_opacity=1.0,
        )
        number_text = self.text(f"{number:02d}", 23, BOLD).move_to(number_box)

        title_text = self.text(title, 34, BOLD)
        available_title_width = SAFE_WIDTH - number_box.width - 0.38
        self.fit(title_text, available_title_width, 0.56)
        title_row = VGroup(VGroup(number_box, number_text), title_text)
        title_row.arrange(RIGHT, buff=0.25)
        title_row.to_edge(UP, buff=0.16).to_edge(LEFT, buff=0.48)

        rule = Line(LEFT * 7.48, RIGHT * 7.48, color=LIGHT_GRAY, stroke_width=2)
        rule.next_to(title_row, DOWN, buff=0.07)

        words = subtitle.split()
        if len(subtitle) > 96:
            midpoint = len(words) // 2
            best = midpoint
            best_gap = 10**9
            for index in range(max(1, midpoint - 5), min(len(words), midpoint + 6)):
                gap = abs(len(" ".join(words[:index])) - len(" ".join(words[index:])))
                if gap < best_gap:
                    best = index
                    best_gap = gap
            subtitle_lines = [" ".join(words[:best]), " ".join(words[best:])]
            subtitle_text = VGroup(*[self.text(line, 20) for line in subtitle_lines])
            subtitle_text.arrange(DOWN, aligned_edge=LEFT, buff=0.04)
        else:
            subtitle_text = self.text(subtitle, 21)

        self.fit(subtitle_text, 14.25, 0.70)
        subtitle_text.next_to(rule, DOWN, buff=0.08).align_to(title_row, LEFT)

        new_header = VGroup(title_row, rule)
        if self.header_group is None:
            self.header_group = new_header
            self.add(new_header)
        else:
            old_header = self.header_group
            self.header_group = new_header
            self.play(ReplacementTransform(old_header, new_header), run_time=RUN_QUICK)

        if self.subtitle_group is None:
            self.subtitle_group = subtitle_text
            self.add(subtitle_text)
        else:
            old_subtitle = self.subtitle_group
            self.subtitle_group = subtitle_text
            self.play(ReplacementTransform(old_subtitle, subtitle_text), run_time=RUN_QUICK)

    def clear_stage(self, keep_header: bool = True) -> None:
        keep_family_ids: set[int] = set()
        if keep_header:
            for persistent in (self.header_group, self.subtitle_group):
                if persistent is not None:
                    keep_family_ids.update(id(member) for member in persistent.get_family())

        removable = [mob for mob in self.mobjects if id(mob) not in keep_family_ids]
        if removable:
            self.play(*[FadeOut(mob) for mob in removable], run_time=RUN_NORMAL)

        self.camera.frame.set(width=FRAME_WIDTH).move_to(ORIGIN)

    # ---------------------------------------------------------------------
    # Camera and frame safety
    # ---------------------------------------------------------------------
    def assert_within_frame(self, mob: Mobject, label: str, margin: float = 0.03) -> None:
        left, right = mob.get_left()[0], mob.get_right()[0]
        bottom, top = mob.get_bottom()[1], mob.get_top()[1]
        if left < -FRAME_WIDTH / 2 + margin or right > FRAME_WIDTH / 2 - margin:
            raise ValueError(
                f"{label} exceeds horizontal frame bounds: left={left:.3f}, right={right:.3f}"
            )
        if bottom < -FRAME_HEIGHT / 2 + margin or top > FRAME_HEIGHT / 2 - margin:
            raise ValueError(
                f"{label} exceeds vertical frame bounds: bottom={bottom:.3f}, top={top:.3f}"
            )

    def assert_content_safe(self, mob: Mobject, label: str) -> None:
        self.assert_within_frame(mob, label, margin=0.15)
        if mob.get_top()[1] > CONTENT_TOP_Y:
            raise ValueError(f"{label} overlaps the persistent header zone")
        if mob.get_bottom()[1] < CONTENT_BOTTOM_Y:
            raise ValueError(f"{label} exceeds the safe lower content zone")

    def focus_on(self, mob: Mobject, width: float = 8.0, pause: float = PAUSE_READ) -> None:
        persistent = [
            item for item in (self.header_group, self.subtitle_group) if item is not None
        ]
        if persistent:
            self.play(*[FadeOut(item) for item in persistent], run_time=RUN_QUICK)

        self.camera.frame.save_state()
        target_width = max(width, mob.width + 0.8)
        self.play(
            self.camera.frame.animate.set(width=target_width).move_to(mob),
            run_time=RUN_CAMERA,
        )
        self.wait(pause)
        self.play(Restore(self.camera.frame), run_time=RUN_CAMERA)

        if persistent:
            self.play(*[FadeIn(item) for item in persistent], run_time=RUN_QUICK)

    def focus_sequence(
        self,
        objects: Sequence[Mobject],
        widths: Sequence[float] | None = None,
        pause: float = PAUSE_READ,
    ) -> None:
        widths = widths or [8.0] * len(objects)
        for mob, width in zip(objects, widths):
            self.focus_on(mob, width=width, pause=pause)

    # ---------------------------------------------------------------------
    # Custom tables
    # ---------------------------------------------------------------------
    def build_table(
        self,
        headers: Sequence[str],
        body_rows: Sequence[Sequence[str]],
        column_widths: Sequence[float],
        *,
        math_columns: Iterable[int] = (),
        row_height: float = 0.62,
        header_height: float = 0.72,
        body_font_size: int = 25,
        header_font_size: int = 23,
    ) -> TableDiagram:
        if len(headers) != len(column_widths):
            raise ValueError("headers and column_widths must have equal length")
        if any(len(row) != len(headers) for row in body_rows):
            raise ValueError("every body row must match the header length")

        math_column_set = set(math_columns)
        row_count = 1 + len(body_rows)
        column_count = len(headers)
        total_width = sum(column_widths)
        total_height = header_height + len(body_rows) * row_height

        rectangles: list[list[Rectangle]] = []
        entries: list[list[Mobject]] = []
        row_groups: list[VGroup] = []

        left_edge = -total_width / 2
        top_edge = total_height / 2

        for row_index in range(row_count):
            current_height = header_height if row_index == 0 else row_height
            y_center = top_edge - current_height / 2
            if row_index > 0:
                y_center -= header_height + (row_index - 1) * row_height

            row_rectangles: list[Rectangle] = []
            row_entries: list[Mobject] = []
            x_cursor = left_edge

            for column_index, column_width in enumerate(column_widths):
                x_center = x_cursor + column_width / 2
                is_header = row_index == 0

                rectangle = Rectangle(
                    width=column_width,
                    height=current_height,
                    stroke_color=BLACK_LINE,
                    stroke_width=1.25,
                    fill_color=VERY_LIGHT_GRAY if is_header else WHITE_FILL,
                    fill_opacity=1.0,
                )
                rectangle.move_to([x_center, y_center, 0])

                content = headers[column_index] if is_header else body_rows[row_index - 1][column_index]
                if is_header:
                    is_math_header = any(marker in content for marker in ("_", "^", "\\", "="))
                    entry = (
                        self.math(content, header_font_size)
                        if is_math_header
                        else self.text(content, header_font_size, BOLD)
                    )
                elif column_index in math_column_set:
                    entry = self.math(content, body_font_size)
                else:
                    entry = self.text(content, body_font_size)

                self.fit(entry, column_width - 0.18, current_height - 0.12)
                entry.move_to(rectangle)

                row_rectangles.append(rectangle)
                row_entries.append(entry)
                x_cursor += column_width

            rectangles.append(row_rectangles)
            entries.append(row_entries)
            row_groups.append(VGroup(*row_rectangles, *row_entries))

        column_groups: list[VGroup] = []
        for column_index in range(column_count):
            column_items: list[Mobject] = []
            for row_index in range(row_count):
                column_items.extend(
                    [rectangles[row_index][column_index], entries[row_index][column_index]]
                )
            column_groups.append(VGroup(*column_items))

        header_group = row_groups[0]
        body_group = VGroup(*row_groups[1:])
        full_group = VGroup(*row_groups)

        return TableDiagram(
            group=full_group,
            rectangles=rectangles,
            entries=entries,
            rows=row_groups,
            columns=column_groups,
            header=header_group,
            body=body_group,
        )

    def shade_cells(
        self,
        table: TableDiagram,
        coordinates: Sequence[tuple[int, int]],
        opacity: float = 1.0,
    ) -> AnimationGroup:
        animations = []
        for row_index, column_index in coordinates:
            animations.append(
                table.rectangles[row_index][column_index].animate.set_fill(
                    LIGHT_GRAY, opacity=opacity
                )
            )
        return AnimationGroup(*animations, lag_ratio=0.08)

    def animate_table_rows(
        self,
        table: TableDiagram,
        *,
        direction: np.ndarray = RIGHT,
        pause: float = PAUSE_SHORT,
        include_header: bool = True,
    ) -> None:
        start = 0 if include_header else 1
        for index in range(start, len(table.rows)):
            self.play(FadeIn(table.rows[index], shift=direction * 0.12), run_time=RUN_NORMAL)
            self.wait(pause)

    # ---------------------------------------------------------------------
    # Figures and diagrams
    # ---------------------------------------------------------------------
    def figure_panel(
        self,
        figure: Mobject,
        *,
        width: float = 6.2,
        height: float = 4.5,
        title: str | None = None,
        caption: str | None = None,
        inner_margin: float = 0.38,
        title_size: int = 25,
        caption_size: int = 19,
        fill_color=WHITE_FILL,
    ) -> FigurePanel:
        """Place any Manim geometry/graph/image inside a stable classroom panel."""
        box = RoundedRectangle(
            width=width,
            height=height,
            corner_radius=0.12,
            stroke_color=BLACK_LINE,
            stroke_width=1.8,
            fill_color=fill_color,
            fill_opacity=1.0,
        )

        title_mob = self.text(title, title_size, BOLD) if title else None
        caption_mob = self.text(caption, caption_size) if caption else None

        available_h = height - 2 * inner_margin
        if title_mob is not None:
            available_h -= 0.55
        if caption_mob is not None:
            available_h -= 0.48

        self.fit(figure, width - 2 * inner_margin, max(0.8, available_h))
        figure.move_to(box)

        components: list[Mobject] = [box, figure]
        if title_mob is not None:
            self.fit(title_mob, width - 0.55, 0.42)
            title_mob.next_to(box.get_top(), DOWN, buff=0.18)
            components.append(title_mob)
            figure.shift(DOWN * 0.18)
        if caption_mob is not None:
            self.fit(caption_mob, width - 0.55, 0.40)
            caption_mob.next_to(box.get_bottom(), UP, buff=0.18)
            components.append(caption_mob)
            figure.shift(UP * 0.12)

        group = VGroup(*components)
        return FigurePanel(group, box, figure, title_mob, caption_mob)

    def image_panel(
        self,
        image_path: str | Path,
        **kwargs,
    ) -> FigurePanel:
        path = Path(image_path)
        if path.is_absolute():
            raise ValueError(
                f"Use project-relative asset paths, not absolute paths: {path}"
            )
        if not path.exists():
            raise FileNotFoundError(path)
        image = ImageMobject(str(path))
        return self.figure_panel(image, **kwargs)

    def split_layout(
        self,
        left: Mobject,
        right: Mobject,
        *,
        left_width: float = 6.7,
        right_width: float = 6.7,
        max_height: float = 5.5,
        gap: float = 0.45,
        center_y: float = -0.40,
    ) -> SplitLayout:
        """Integrate figure + explanation without sacrificing readability."""
        self.fit(left, left_width, max_height)
        self.fit(right, right_width, max_height)
        left.move_to(LEFT * ((right_width + gap) / 2) + UP * center_y)
        right.move_to(RIGHT * ((left_width + gap) / 2) + UP * center_y)
        group = VGroup(left, right)
        self.fit_content_zone(group, max_width=14.4, max_height=max_height)
        return SplitLayout(group=group, left=left, right=right)

    def labeled_segment(
        self,
        start: np.ndarray,
        end: np.ndarray,
        label: str,
        *,
        label_size: int = 28,
        label_offset: np.ndarray = UP * 0.20,
        dashed: bool = False,
    ) -> VGroup:
        line_cls = DashedLine if dashed else Line
        segment = line_cls(start, end, color=BLACK_LINE, stroke_width=2.4)
        label_mob = self.math(label, label_size)
        label_mob.move_to((start + end) / 2 + label_offset)
        return VGroup(segment, label_mob)

    def labeled_dot(
        self,
        point: np.ndarray,
        label: str,
        *,
        radius: float = 0.075,
        label_offset: np.ndarray = UR * 0.18,
        label_size: int = 24,
    ) -> VGroup:
        dot = Dot(point, radius=radius, color=BLACK_LINE)
        label_mob = self.math(label, label_size).next_to(dot, label_offset, buff=0.06)
        return VGroup(dot, label_mob)

    # ---------------------------------------------------------------------
    # Equation sequencing
    # ---------------------------------------------------------------------
    def equation_stack(
        self,
        equations: Sequence[str],
        *,
        sizes: Sequence[int] | None = None,
        buff: float = 0.26,
        max_width: float = 7.2,
        max_height: float = 4.8,
    ) -> VGroup:
        sizes = sizes or [36] * len(equations)
        mobs = VGroup(*[self.math(eq, size) for eq, size in zip(equations, sizes)])
        mobs.arrange(DOWN, aligned_edge=LEFT, buff=buff)
        self.fit(mobs, max_width, max_height)
        return mobs

    def animate_equation_stack(
        self,
        stack: VGroup,
        *,
        pause: float = PAUSE_READ,
        write: bool = True,
    ) -> None:
        for line in stack:
            anim = Write(line) if write else FadeIn(line, shift=UP * 0.08)
            self.play(anim, run_time=RUN_NORMAL)
            self.wait(pause)

    def transform_equation_chain(
        self,
        expressions: Sequence[str],
        *,
        size: int = 42,
        position: np.ndarray = ORIGIN,
        pause: float = PAUSE_EXPLAIN,
    ) -> Mobject:
        if not expressions:
            raise ValueError("expressions cannot be empty")
        current = self.math(expressions[0], size).move_to(position)
        self.fit(current, 13.8, 2.4)
        self.play(Write(current), run_time=RUN_NORMAL)
        self.wait(pause)
        for expression in expressions[1:]:
            target = self.math(expression, size).move_to(position)
            self.fit(target, 13.8, 2.4)
            self.play(TransformMatchingTex(current, target), run_time=RUN_SLOW)
            current.become(target)
            self.wait(pause)
        return current

    # ---------------------------------------------------------------------
    # Small reusable visualization components
    # ---------------------------------------------------------------------
    def boxed_values(
        self,
        values: Sequence[str | int | float],
        *,
        box_size: float = 0.78,
        font_size: int = 38,
        buff: float = 0.12,
    ) -> VGroup:
        boxes = VGroup(*[
            Square(
                side_length=box_size,
                stroke_color=BLACK_LINE,
                stroke_width=1.7,
                fill_color=WHITE_FILL,
                fill_opacity=1.0,
            )
            for _ in values
        ])
        boxes.arrange(RIGHT, buff=buff)
        texts = VGroup(*[self.math(str(value), font_size) for value in values])
        for box, value in zip(boxes, texts):
            self.fit(value, box_size - 0.12, box_size - 0.12)
            value.move_to(box)
        return VGroup(boxes, texts)

    def process_map(
        self,
        steps: Sequence[tuple[str, str]],
        *,
        card_width: float = 4.3,
        card_height: float = 1.10,
        columns: int = 3,
    ) -> VGroup:
        """Create a compact method/recipe map for final summaries."""
        cards = VGroup()
        for number, text_value in steps:
            badge = RoundedRectangle(
                width=0.66,
                height=0.50,
                corner_radius=0.08,
                stroke_color=BLACK_LINE,
                stroke_width=1.5,
                fill_color=VERY_LIGHT_GRAY,
                fill_opacity=1,
            )
            badge_text = self.text(number, 19, BOLD).move_to(badge)
            body = self.text(text_value, 21, BOLD)
            content = VGroup(VGroup(badge, badge_text), body).arrange(RIGHT, buff=0.18)
            self.fit(content, card_width - 0.35, card_height - 0.20)
            box = RoundedRectangle(
                width=card_width,
                height=card_height,
                corner_radius=0.10,
                stroke_color=BLACK_LINE,
                stroke_width=1.5,
                fill_color=WHITE_FILL,
                fill_opacity=1,
            )
            content.move_to(box)
            cards.add(VGroup(box, content))
        cards.arrange_in_grid(cols=columns, buff=(0.25, 0.25))
        return cards

    # ---------------------------------------------------------------------
    # Standard opening/closing
    # ---------------------------------------------------------------------
    def standard_opening(
        self,
        course_label: str,
        title: str,
        subtitle: str,
        promise: str,
    ) -> None:
        label = self.text(course_label, 28, BOLD)
        title_mob = self.text(title, 50, BOLD)
        rule = Line(LEFT * 5.5, RIGHT * 5.5, color=BLACK_LINE, stroke_width=2.2)
        subtitle_mob = self.text(subtitle, 27)
        promise_mob = self.text(promise, 25, MEDIUM)
        group = VGroup(label, title_mob, rule, subtitle_mob, promise_mob)
        group.arrange(DOWN, buff=0.30)
        self.fit(group, 14.4, 6.6)

        self.play(FadeIn(label, shift=UP * 0.18), run_time=RUN_NORMAL)
        self.play(Write(title_mob), run_time=RUN_SLOW)
        self.play(Create(rule), FadeIn(subtitle_mob), run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)
        self.play(FadeIn(promise_mob, shift=UP * 0.15), run_time=RUN_NORMAL)
        self.wait(PAUSE_FINAL)
        self.play(FadeOut(group), run_time=RUN_NORMAL)

    def standard_closing(self, sentence: str) -> None:
        closing = self.text(sentence, 34, BOLD)
        self.fit(closing, 13.8, 1.2)
        closing.move_to(ORIGIN)
        self.play(*[FadeOut(mob) for mob in list(self.mobjects)], run_time=RUN_NORMAL)
        self.play(FadeIn(closing), run_time=RUN_SLOW)
        self.wait(PAUSE_FINAL)
        self.play(FadeOut(closing), run_time=RUN_NORMAL)


# =============================================================================
# OPTIONAL SPECIALIZED BASES
# =============================================================================
class JPMathClassroomScene(JPClassroomScene):
    """Alias base for mathematics/statistics/physics 2D classroom lessons."""


class JPThreeDClassroomScene(ThreeDScene):
    """3D companion with the same visual constants.

    Use when a scene genuinely needs ThreeDScene. For mixed 2D/3D lessons,
    keep 3D segments separate and preserve the same monochrome hierarchy.
    """

    def setup(self) -> None:
        super().setup()
        self.camera.background_color = WHITE

    def text(self, content: str, size: int = 30, weight=NORMAL, **kwargs) -> Text:
        return Text(content, font_size=size, color=BLACK_TEXT, weight=weight, **kwargs)

    def math(self, expression: str, size: int = 38, **kwargs) -> MathTex:
        return MathTex(expression, font_size=size, color=BLACK_TEXT, **kwargs)


# =============================================================================
# UTILITY VALIDATORS FOR LESSON DATA
# =============================================================================
def assert_close(actual: float, expected: float, *, tol: float = 1e-10, label: str = "value") -> None:
    if abs(actual - expected) > tol:
        raise AssertionError(f"{label}: expected {expected}, got {actual}")


def validate_relative_asset(path: str | Path) -> Path:
    path = Path(path)
    if path.is_absolute():
        raise ValueError(f"Absolute asset path is not portable: {path}")
    if not path.exists():
        raise FileNotFoundError(path)
    return path


def validate_all(checks: Sequence[tuple[str, Callable[[], bool]]]) -> None:
    """Run named lesson checks with useful failure messages."""
    failed = [name for name, check in checks if not check()]
    if failed:
        raise AssertionError("Lesson validation failed: " + ", ".join(failed))