#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Compatibility wrapper for the senior-QA Statistics 11 comparisons scene.

Keeps the complete pedagogical scene in stat11_comparisons_colab.py and adds
one compatibility layer so scene-local calls may optionally pass a fourth
positional color argument while the shared JP classroom style keeps its
original three-argument text() helper API.

Target: ManimCE 0.20.1
"""

from __future__ import annotations

from src.stat11_comparisons_colab import Stat11ComparisonsColabClass


class Stat11ComparisonsColabClassFinal(Stat11ComparisonsColabClass):
    """Final render class with text-color compatibility for Colab accents."""

    def text(self, content, size=28, weight=None, color=None, **kwargs):
        # Preserve the exact shared classroom helper behavior by delegating
        # to the parent implementation, then apply color only when requested.
        if "font_size" in kwargs:
            size = kwargs.pop("font_size")
        if weight is None:
            mob = super().text(content, size)
        else:
            mob = super().text(content, size, weight)
        if color is not None:
            mob.set_color(color)
        return mob
