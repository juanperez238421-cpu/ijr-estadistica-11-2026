#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Compatibility wrapper for the senior-QA Statistics 11 comparisons scene.

Keeps the complete pedagogical scene in stat11_comparisons_colab.py and adds
small compatibility helpers required by the shared JP classroom style.

Target: ManimCE 0.20.1
"""

from __future__ import annotations

from library.jp_classroom_style import *
from src.stat11_comparisons_colab import Stat11ComparisonsColabClass


class Stat11ComparisonsColabClassFinal(Stat11ComparisonsColabClass):
    """Final render class with Colab accent and prompt-card compatibility."""

    def text(self, content, size=28, weight=None, color=None, **kwargs):
        """Preserve JP text behavior while allowing an optional color argument."""
        if "font_size" in kwargs:
            size = kwargs.pop("font_size")
        if weight is None:
            mob = super().text(content, size)
        else:
            mob = super().text(content, size, weight)
        if color is not None:
            mob.set_color(color)
        return mob

    def prompt_card(
        self,
        number: str,
        prompt: str,
        *,
        width: float = 6.4,
        body_size: int = 25,
    ) -> VGroup:
        """Classroom-safe prompt banner used before each coding task."""
        badge = RoundedRectangle(
            width=0.64,
            height=0.52,
            corner_radius=0.09,
            stroke_color=BLACK_LINE,
            stroke_width=1.6,
            fill_color=VERY_LIGHT_GRAY,
            fill_opacity=1.0,
        )
        badge_text = self.text(number, 20, BOLD).move_to(badge)
        body = self.text(prompt, body_size, MEDIUM)
        self.fit(body, width - 1.35, 1.15)
        row = VGroup(VGroup(badge, badge_text), body).arrange(RIGHT, buff=0.20)
        box = RoundedRectangle(
            width=width,
            height=max(1.05, row.height + 0.42),
            corner_radius=0.10,
            stroke_color=BLACK_LINE,
            stroke_width=1.5,
            fill_color=WHITE_FILL,
            fill_opacity=1.0,
        )
        row.move_to(box).align_to(box, LEFT).shift(RIGHT * 0.22)
        return VGroup(box, row)
