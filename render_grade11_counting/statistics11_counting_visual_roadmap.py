# -*- coding: utf-8 -*-
"""Grade 11 Statistics counting-techniques visual roadmap.

Concept-first ManimCE animation for the current operational counting unit.
Local patterns adapted from jr_permutation_scene.py and
statistics11_probability_bridge: tokens, slots, tree branches, duplicate
collapse, circular rotations, and standard-library-checked counting models.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date
from itertools import permutations
from typing import Sequence

import numpy as np
from manim import *


config.pixel_width = 1920
config.pixel_height = 1080
config.frame_width = 16
config.frame_height = 9
config.frame_rate = 30
config.background_color = WHITE

FONT = "Segoe UI"
INK = "#111827"
MUTED = "#6B7280"
LIGHT = "#E5E7EB"
PRIMARY = "#1F77B4"
GREEN = "#2E7D32"
ORANGE = "#D97706"
RED = "#C62828"
PURPLE = "#6D28D9"
TEAL = "#00897B"
PANEL = "#F8FAFC"
TIME_SCALE = 4.0

GRADE11_SOURCE_STATUS = (
    "Operational current counting unit based on verified local materials; "
    "not confirmed as the official Grade 11 second-period planning file."
)
TREAT_REFLECTIONS_AS_EQUIVALENT = False

GRADE11_ASSESSMENTS = [
    ("Assessment 3", "Counting Techniques Workshop", "15%", date(2026, 7, 30), "represent organize decide count verify"),
    ("Assessment 4", "Follow-up Assessment", "25%", date(2026, 8, 13), "interpret classify represent calculate justify"),
    ("Assessment 5", "Final Assessment", "20%", date(2026, 8, 20), "mixed counting verification"),
]

GRADE11_SCHEDULE = [("11A", "11:50-12:40"), ("11B", "12:45-1:35"), ("11C", "2:05-2:50")]


@dataclass(frozen=True)
class Stage:
    label: str
    choices: tuple[str, ...]


def require_counting_domain(n: int, r: int | None = None) -> None:
    if n < 0 or int(n) != n:
        raise ValueError("n must be a nonnegative integer")
    if r is not None and (r < 0 or int(r) != r or r > n):
        raise ValueError("require 0 <= r <= n")


def factorial_count(n: int) -> int:
    require_counting_domain(n)
    return math.factorial(n)


def permutation_count(n: int, r: int) -> int:
    require_counting_domain(n, r)
    return math.perm(n, r)


def combination_count(n: int, r: int) -> int:
    require_counting_domain(n, r)
    return math.comb(n, r)


def repeated_permutation_count(total: int, multiplicities: Sequence[int]) -> int:
    require_counting_domain(total)
    if any(k < 0 or int(k) != k for k in multiplicities):
        raise ValueError("multiplicities must be nonnegative integers")
    if sum(multiplicities) != total:
        raise ValueError("repeated multiplicities must sum to n")
    denominator = math.prod(math.factorial(k) for k in multiplicities)
    return math.factorial(total) // denominator


def circular_permutation_count(n: int) -> int:
    if n < 1 or int(n) != n:
        raise ValueError("circular permutations require n >= 1")
    return math.factorial(n - 1)


def product_rule(stages: Sequence[Stage]) -> int:
    return math.prod(len(stage.choices) for stage in stages)


def validate_grade11_counting() -> dict[str, int | str | bool]:
    banana_counts = (1, 3, 2)
    report: dict[str, int | str | bool] = {
        "source_status": GRADE11_SOURCE_STATUS,
        "factorial_5": factorial_count(5),
        "five_p_three": permutation_count(5, 3),
        "five_c_two": combination_count(5, 2),
        "banana": repeated_permutation_count(6, banana_counts),
        "circular_5": circular_permutation_count(5),
        "reflections_equivalent": TREAT_REFLECTIONS_AS_EQUIVALENT,
        "tree_2x3x2": product_rule(
            [
                Stage("main", ("A", "B")),
                Stage("side", ("1", "2", "3")),
                Stage("drink", ("X", "Y")),
            ]
        ),
        "weights_total": "15+25+15+25+20=100",
    }
    if report["five_p_three"] != 60:
        raise AssertionError("5P3 must equal 60")
    if report["five_c_two"] != 10:
        raise AssertionError("5C2 must equal 10")
    if report["banana"] != 60:
        raise AssertionError("BANANA must have 60 distinct arrangements")
    if report["circular_5"] != 24:
        raise AssertionError("five circular arrangements up to rotation must equal 24")
    if any(item[3].weekday() != 3 for item in GRADE11_ASSESSMENTS):
        raise AssertionError("Grade 11 assessments must fall on Thursdays")
    return report


class Statistics11CountingVisualRoadmap(MovingCameraScene):
    """Main Grade 11 scene."""

    def setup(self) -> None:
        super().setup()
        self.camera.background_color = WHITE
        self.camera.frame.set(width=16).move_to(ORIGIN)
        validate_grade11_counting()

    def play(self, *args, **kwargs):
        if "run_time" in kwargs and kwargs["run_time"] is not None:
            kwargs["run_time"] *= TIME_SCALE
        return super().play(*args, **kwargs)

    def wait(self, duration: float = DEFAULT_WAIT_TIME, *args, **kwargs):
        return super().wait(duration * TIME_SCALE, *args, **kwargs)

    def construct(self) -> None:
        self.opening()
        self.current_progress()
        self.counting_principle()
        self.factorial_positions()
        self.partial_permutations()
        self.combinations_visual()
        self.assessment_three_reveal()
        self.repeated_arrangements()
        self.circular_permutations()
        self.method_decision_process()
        self.assessment_four_reveal()
        self.mixed_problem_story()
        self.verification_strategies()
        self.final_assessment_reveal()
        self.group_calendar()
        self.final_summary()

    def tx(self, content: str, size: int = 30, color: str = INK, weight=NORMAL, **kwargs) -> Text:
        return Text(content, font=FONT, font_size=size, color=color, weight=weight, line_spacing=0.9, **kwargs)

    def title(self, main: str, sub: str = "") -> VGroup:
        title = self.tx(main, 38, PRIMARY, BOLD).to_edge(UP, buff=0.25)
        rule = Line(LEFT * 6.2, RIGHT * 6.2, color=LIGHT, stroke_width=2).next_to(title, DOWN, buff=0.08)
        group = VGroup(title, rule)
        if sub:
            subtitle = self.tx(sub, 20, MUTED, MEDIUM).next_to(rule, DOWN, buff=0.08)
            group.add(subtitle)
        return group

    def clear_scene(self, run_time: float = 0.55) -> None:
        if self.mobjects:
            self.play(FadeOut(Group(*self.mobjects), shift=UP * 0.04), run_time=run_time)
        self.camera.frame.move_to(ORIGIN).set(width=16)

    def focus(self, mob: Mobject, width: float = 8.5, hold: float = 0.55) -> None:
        self.play(self.camera.frame.animate.move_to(mob).set(width=width), run_time=0.85, rate_func=smooth)
        self.wait(hold)
        self.play(self.camera.frame.animate.move_to(ORIGIN).set(width=16), run_time=0.7, rate_func=smooth)

    def token(self, label: str, color: str = PRIMARY, radius: float = 0.32, square: bool = False) -> VGroup:
        shape: Mobject
        if square:
            shape = RoundedRectangle(width=0.76, height=0.76, corner_radius=0.10, stroke_color=color, stroke_width=3, fill_color=color, fill_opacity=0.12)
        else:
            shape = Circle(radius=radius, stroke_color=color, stroke_width=3, fill_color=color, fill_opacity=0.12)
        text = self.tx(label, 24, INK, BOLD).move_to(shape)
        return VGroup(shape, text)

    def slot(self, label: str, color: str = MUTED) -> VGroup:
        rect = RoundedRectangle(width=1.02, height=0.68, corner_radius=0.10, stroke_color=color, stroke_width=2.4, fill_color=WHITE, fill_opacity=1)
        text = self.tx(label, 20, color, BOLD).move_to(rect)
        return VGroup(rect, text)

    def badge(self, label: str, body: str, color: str) -> VGroup:
        circ = Circle(radius=0.32, stroke_color=color, stroke_width=3).set_fill(color, opacity=0.12)
        lab = self.tx(label, 22, color, BOLD).move_to(circ)
        body_mob = self.tx(body, 22, INK, MEDIUM)
        return VGroup(VGroup(circ, lab), body_mob).arrange(RIGHT, buff=0.18)

    def simple_tree(self, root: str, levels: Sequence[Sequence[str]], x_gap: float = 2.65, y_span: float = 5.2) -> VGroup:
        root_node = self.token(root, MUTED).move_to(LEFT * 6.1)
        previous = [root_node]
        all_nodes = VGroup(root_node)
        edges = VGroup()
        colors = [PRIMARY, GREEN, ORANGE]
        for level_index, choices in enumerate(levels):
            new_nodes = []
            total = len(previous) * len(choices)
            count = 0
            for parent in previous:
                for choice in choices:
                    y = y_span / 2 - count * (y_span / max(1, total - 1)) if total > 1 else 0
                    node = self.token(choice, colors[level_index % len(colors)], radius=0.25).move_to(LEFT * 6.1 + RIGHT * x_gap * (level_index + 1) + UP * y)
                    edges.add(Line(parent.get_right(), node.get_left(), color=MUTED, stroke_width=1.6))
                    new_nodes.append(node)
                    count += 1
            previous = new_nodes
            all_nodes.add(*new_nodes)
        return VGroup(edges, all_nodes)

    def opening(self) -> None:
        title = self.title("GRADE 11 STATISTICS", "Counting techniques roadmap - Tecnicas de conteo")
        words = VGroup(
            self.badge("1", "CHOOSE", PRIMARY),
            self.badge("2", "ORGANIZE", GREEN),
            self.badge("3", "COUNT", ORANGE),
            self.badge("4", "DECIDE", PURPLE),
            self.badge("5", "VERIFY", TEAL),
        ).arrange(RIGHT, buff=0.33).move_to(DOWN * 2.55)
        problem = self.tx("A situation creates choices before it creates formulas.", 31, INK, BOLD).move_to(UP * 1.7)
        icons = VGroup(
            self.token("A", PRIMARY),
            self.token("B", GREEN),
            self.token("C", ORANGE),
            self.token("D", PURPLE),
            self.token("E", TEAL),
        ).arrange(RIGHT, buff=0.55).move_to(ORIGIN)
        ref = self.tx("Reference date: July 13, 2026", 20, MUTED, MEDIUM).to_corner(UR, buff=0.35)
        self.play(FadeIn(title), FadeIn(ref), run_time=0.8)
        self.play(LaggedStart(*[FadeIn(icon, scale=0.85) for icon in icons], lag_ratio=0.14), FadeIn(problem), run_time=1.4)
        self.play(LaggedStart(*[FadeIn(word, shift=UP * 0.08) for word in words], lag_ratio=0.12), run_time=1.2)
        self.focus(VGroup(problem, icons), width=8.2, hold=0.7)
        self.wait(1.0)
        self.clear_scene()

    def current_progress(self) -> None:
        title = self.title("Assessment Progress", "First two grades completed; 60% remains")
        axis = NumberLine(x_range=[0, 100, 20], length=11.5, include_numbers=True, font_size=20, color=INK).shift(DOWN * 0.25)
        completed = Line(axis.n2p(0), axis.n2p(40), color=GREEN, stroke_width=11)
        remaining = Line(axis.n2p(40), axis.n2p(100), color=PRIMARY, stroke_width=11)
        labels = VGroup(
            self.tx("Initial Workshop\n15%", 19, GREEN, BOLD).move_to(axis.n2p(15) + UP * 0.78),
            self.tx("Quiz\n25%", 19, GREEN, BOLD).move_to(axis.n2p(40) + UP * 0.78),
            self.tx("Workshop\n15%", 19, PRIMARY, BOLD).move_to(axis.n2p(55) + DOWN * 0.78),
            self.tx("Follow-up\n25%", 19, PRIMARY, BOLD).move_to(axis.n2p(80) + DOWN * 0.78),
            self.tx("Final\n20%", 19, PRIMARY, BOLD).move_to(axis.n2p(100) + DOWN * 0.78),
        )
        validation = MathTex(r"15\%+25\%+15\%+25\%+20\%=100\%", color=INK, font_size=38).to_edge(DOWN, buff=0.55)
        self.play(FadeIn(title), Create(axis), run_time=0.8)
        self.play(Create(completed), FadeIn(labels[:2]), run_time=1.0)
        self.play(Create(remaining), FadeIn(labels[2:]), run_time=1.2)
        self.play(Write(validation), run_time=0.8)
        self.wait(1.0)
        self.clear_scene()

    def counting_principle(self) -> None:
        title = self.title("Fundamental Counting Principle", "Sequential choices become branching paths")
        tree = self.simple_tree("start", (("A", "B"), ("1", "2", "3"), ("X", "Y"))).scale(0.86).move_to(DOWN * 0.15)
        path = VGroup(tree[1][0], tree[1][1], tree[1][3], tree[1][9])
        formula = MathTex(r"2\times3\times2=12", color=INK, font_size=46).to_corner(DR, buff=0.6)
        note = self.tx("The product counts complete paths.", 26, PRIMARY, BOLD).to_edge(DOWN, buff=0.45)
        self.play(FadeIn(title), Create(tree[0]), run_time=1.2)
        self.play(LaggedStart(*[FadeIn(node, scale=0.85) for node in tree[1]], lag_ratio=0.03), run_time=1.3)
        box = SurroundingRectangle(path, color=ORANGE, buff=0.12, stroke_width=3)
        self.play(Create(box), FadeIn(note), run_time=0.8)
        self.focus(VGroup(path, box), width=6.2, hold=0.7)
        self.play(Write(formula), run_time=0.8)
        self.wait(1.0)
        self.clear_scene()

    def factorial_positions(self) -> None:
        title = self.title("Factorial Positions", "Arranging all distinct objects")
        tokens = VGroup(*[self.token(letter, [PRIMARY, GREEN, ORANGE, PURPLE, TEAL][i]) for i, letter in enumerate("ABCDE")]).arrange(RIGHT, buff=0.35).move_to(UP * 1.45)
        slots = VGroup(*[self.slot(str(k)) for k in [5, 4, 3, 2, 1]]).arrange(RIGHT, buff=0.36).move_to(DOWN * 0.35)
        arrows = VGroup(*[Arrow(tokens[i].get_bottom(), slots[i].get_top(), buff=0.12, color=MUTED) for i in range(5)])
        formula = MathTex(r"5! = 5\times4\times3\times2\times1 = 120", color=INK, font_size=42).to_edge(DOWN, buff=0.55)
        self.play(FadeIn(title), FadeIn(tokens), run_time=0.8)
        self.play(LaggedStart(*[FadeIn(s, shift=UP * 0.1) for s in slots], lag_ratio=0.14), Create(arrows), run_time=1.3)
        self.play(Write(formula), run_time=0.9)
        self.wait(1.0)
        self.clear_scene()

    def partial_permutations(self) -> None:
        title = self.title("Partial Permutations", "Choose and order only some positions")
        people = VGroup(*[self.token(str(i + 1), [PRIMARY, GREEN, ORANGE, PURPLE, TEAL][i]) for i in range(5)]).arrange(RIGHT, buff=0.35).move_to(UP * 1.45)
        podium = VGroup(self.slot("1st", PRIMARY), self.slot("2nd", GREEN), self.slot("3rd", ORANGE)).arrange(RIGHT, buff=0.48).move_to(DOWN * 0.15)
        counts = VGroup(self.tx("5 choices", 22, PRIMARY, BOLD), self.tx("4 choices", 22, GREEN, BOLD), self.tx("3 choices", 22, ORANGE, BOLD)).arrange(RIGHT, buff=0.78).next_to(podium, DOWN, buff=0.35)
        formula = MathTex(r"{}_{5}P_{3}=5\times4\times3=60", color=INK, font_size=46).to_edge(DOWN, buff=0.55)
        self.play(FadeIn(title), FadeIn(people), run_time=0.8)
        self.play(LaggedStart(*[FadeIn(s, shift=UP * 0.1) for s in podium], lag_ratio=0.12), FadeIn(counts), run_time=1.2)
        self.play(Write(formula), run_time=0.8)
        self.wait(1.0)
        self.clear_scene()

    def combinations_visual(self) -> None:
        title = self.title("Combinations", "Order does not create a new selection")
        students = VGroup(*[self.token(letter, [PRIMARY, GREEN, ORANGE, PURPLE, TEAL][i]) for i, letter in enumerate("ABCDE")]).arrange(RIGHT, buff=0.38).move_to(UP * 1.45)
        pair_ab = VGroup(self.token("A", PRIMARY), self.token("B", GREEN)).arrange(RIGHT, buff=0.26).move_to(LEFT * 2.4 + DOWN * 0.25)
        pair_ba = VGroup(self.token("B", GREEN), self.token("A", PRIMARY)).arrange(RIGHT, buff=0.26).move_to(RIGHT * 2.4 + DOWN * 0.25)
        same = self.tx("SAME COMMITTEE\nEl orden no cambia el grupo", 27, RED, BOLD).move_to(DOWN * 1.55)
        formula = MathTex(r"{}_{5}C_{2}=10", color=INK, font_size=48).to_edge(DOWN, buff=0.45)
        brace = DoubleArrow(pair_ab.get_right() + RIGHT * 0.2, pair_ba.get_left() + LEFT * 0.2, color=RED, buff=0)
        self.play(FadeIn(title), FadeIn(students), run_time=0.8)
        self.play(FadeIn(pair_ab, shift=DOWN * 0.1), FadeIn(pair_ba, shift=DOWN * 0.1), run_time=1.0)
        self.play(Create(brace), FadeIn(same), run_time=0.8)
        self.play(Write(formula), run_time=0.8)
        self.wait(1.0)
        self.clear_scene()

    def assessment_card(self, index: int) -> None:
        number, name, weight, when, actions = GRADE11_ASSESSMENTS[index]
        title = self.title(number.upper(), f"{name} - {weight}")
        date_line = self.tx(when.strftime("%A, %B %d, %Y").upper(), 31, PRIMARY, BOLD)
        schedule = VGroup(*[self.tx(f"{group} - {slot}", 25, INK, MEDIUM) for group, slot in GRADE11_SCHEDULE]).arrange(DOWN, buff=0.16, aligned_edge=LEFT)
        action = self.tx(actions.upper(), 24, [GREEN, PRIMARY, PURPLE][index], BOLD)
        group = VGroup(date_line, action, schedule).arrange(DOWN, buff=0.42).move_to(ORIGIN)
        self.play(FadeIn(title), FadeIn(group, shift=UP * 0.1), run_time=1.0)
        self.wait(1.3)
        self.clear_scene()

    def assessment_three_reveal(self) -> None:
        self.assessment_card(0)

    def repeated_arrangements(self) -> None:
        title = self.title("Repeated Elements", "Swapping identical objects does not create a new arrangement")
        letters = ["B", "A1", "N1", "A2", "N2", "A3"]
        colors = [PRIMARY, ORANGE, GREEN, ORANGE, GREEN, ORANGE]
        tiles = VGroup(*[self.token(label, color, square=True) for label, color in zip(letters, colors)]).arrange(RIGHT, buff=0.16).move_to(UP * 1.1)
        plain = VGroup(*[self.token(label[0], color, square=True) for label, color in zip(letters, colors)]).arrange(RIGHT, buff=0.16).move_to(UP * 1.1)
        swap_arrow = CurvedArrow(tiles[1].get_bottom(), tiles[3].get_bottom(), angle=-TAU / 4, color=RED)
        collapse = self.tx("Identical A's and N's collapse duplicate orders", 26, RED, BOLD).move_to(DOWN * 0.55)
        formula = MathTex(r"\frac{6!}{3!2!}=60", color=INK, font_size=52).to_edge(DOWN, buff=0.55)
        self.play(FadeIn(title), FadeIn(tiles), run_time=0.9)
        self.play(Create(swap_arrow), run_time=0.7)
        self.play(Transform(tiles, plain), FadeIn(collapse), run_time=1.0)
        self.play(Write(formula), run_time=0.8)
        self.wait(1.0)
        self.clear_scene()

    def circular_table(self, labels: Sequence[str], radius: float = 1.65) -> VGroup:
        table = Circle(radius=radius, color=LIGHT, stroke_width=5).set_fill(PANEL, opacity=0.7)
        seats = VGroup()
        colors = [PRIMARY, GREEN, ORANGE, PURPLE, TEAL]
        for i, label in enumerate(labels):
            angle = TAU / len(labels) * i + PI / 2
            seats.add(self.token(label, colors[i % len(colors)]).move_to(table.get_center() + radius * np.array([math.cos(angle), math.sin(angle), 0])))
        return VGroup(table, seats)

    def circular_permutations(self) -> None:
        title = self.title("Circular Permutations", "Rotations are equivalent; reflections remain different by default")
        table = self.circular_table(["A", "B", "C", "D", "E"]).move_to(LEFT * 2.3 + DOWN * 0.05)
        fixed = self.circular_table(["A", "B", "C", "D", "E"]).move_to(RIGHT * 2.9 + DOWN * 0.05)
        anchor = SurroundingRectangle(fixed[1][0], color=RED, buff=0.08, stroke_width=3)
        note = self.tx("Fix one reference person,\nthen arrange the other four.", 25, INK, BOLD).move_to(DOWN * 2.65)
        formula = MathTex(r"(5-1)! = 24", color=INK, font_size=50).to_edge(DOWN, buff=0.5)
        self.play(FadeIn(title), FadeIn(table), run_time=0.9)
        self.play(Rotate(table[1], angle=TAU / 5, about_point=table[0].get_center()), run_time=1.0)
        self.play(FadeIn(fixed), Create(anchor), FadeIn(note), run_time=1.0)
        self.play(Write(formula), run_time=0.8)
        self.wait(1.0)
        self.clear_scene()

    def method_decision_process(self) -> None:
        title = self.title("Method Decision Process", "Read the situation before choosing the formula")
        nodes = [
            ("Sequential stages?", PRIMARY, LEFT * 5.2 + UP * 1.4),
            ("Arrange or select?", GREEN, LEFT * 2.4 + UP * 0.35),
            ("Does order matter?", ORANGE, RIGHT * 0.55 + UP * 0.35),
            ("Repeated?", PURPLE, RIGHT * 3.35 + UP * 1.25),
            ("Circular?", TEAL, RIGHT * 3.35 + DOWN * 1.05),
        ]
        pills = VGroup()
        for text, color, pos in nodes:
            label = self.tx(text, 21, color, BOLD)
            box = RoundedRectangle(width=label.width + 0.55, height=0.72, corner_radius=0.12, stroke_color=color, stroke_width=2.5, fill_color=WHITE, fill_opacity=1).move_to(pos)
            label.move_to(box)
            pills.add(VGroup(box, label))
        arrows = VGroup(*[Arrow(pills[i].get_right(), pills[i + 1].get_left(), color=MUTED, buff=0.14) for i in range(3)])
        arrows.add(Arrow(pills[2].get_right(), pills[4].get_left(), color=MUTED, buff=0.14))
        terminal = VGroup(
            self.tx("tree / product", 20, PRIMARY, BOLD).next_to(pills[0], DOWN, buff=0.22),
            self.tx("nPr or n!", 20, ORANGE, BOLD).next_to(pills[2], DOWN, buff=0.22),
            self.tx("duplicate collapse", 20, PURPLE, BOLD).next_to(pills[3], RIGHT, buff=0.18),
            self.tx("(n-1)!", 20, TEAL, BOLD).next_to(pills[4], RIGHT, buff=0.18),
        )
        self.play(FadeIn(title), LaggedStart(*[FadeIn(p, scale=0.95) for p in pills], lag_ratio=0.12), run_time=1.3)
        self.play(Create(arrows), FadeIn(terminal), run_time=1.2)
        self.focus(VGroup(pills, arrows, terminal), width=12.8, hold=0.8)
        self.wait(0.8)
        self.clear_scene()

    def assessment_four_reveal(self) -> None:
        self.assessment_card(1)

    def mixed_problem_story(self) -> None:
        title = self.title("One School Event, Several Methods", "The context changes the counting model")
        families = VGroup(
            self.badge("GROUP", "select a committee\ncombination", PRIMARY),
            self.badge("SLOTS", "assign roles\npermutation", GREEN),
            self.badge("ORDER", "presenters in line\nfactorial / nPr", ORANGE),
            self.badge("CIRCLE", "seat finalists\ncircular permutation", PURPLE),
        ).arrange_in_grid(rows=2, cols=2, buff=(0.75, 0.58)).move_to(ORIGIN)
        guide = self.tx("Identify what changes -> decide if order matters -> count -> check", 25, INK, BOLD).to_edge(DOWN, buff=0.45)
        self.play(FadeIn(title), LaggedStart(*[FadeIn(f, shift=UP * 0.08) for f in families], lag_ratio=0.15), run_time=1.5)
        self.play(FadeIn(guide), run_time=0.7)
        self.wait(1.2)
        self.clear_scene()

    def verification_strategies(self) -> None:
        title = self.title("Verification Strategies", "MODEL - COUNT - CHECK")
        small_case = VGroup(*[self.tx("".join(p), 20, INK, MEDIUM) for p in permutations("ABC")]).arrange_in_grid(rows=2, cols=3, buff=(0.45, 0.25)).move_to(LEFT * 4.0)
        tree = self.simple_tree("S", (("A", "B"), ("1", "2"))).scale(0.65).move_to(RIGHT * 2.45)
        checks = VGroup(
            self.tx("list a smaller case", 22, PRIMARY, BOLD),
            self.tx("compare tree and product", 22, GREEN, BOLD),
            self.tx("reject r > n", 22, RED, BOLD),
            self.tx("rotate or swap to detect duplicates", 22, PURPLE, BOLD),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.18).to_edge(DOWN, buff=0.35)
        self.play(FadeIn(title), FadeIn(small_case), Create(tree[0]), FadeIn(tree[1]), run_time=1.3)
        self.play(FadeIn(checks), run_time=0.9)
        self.wait(1.1)
        self.clear_scene()

    def final_assessment_reveal(self) -> None:
        self.assessment_card(2)

    def group_calendar(self) -> None:
        title = self.title("Grade 11 Assessment Calendar", "Three Thursday checkpoints for each group")
        rows = VGroup()
        for i, (group, slot) in enumerate(GRADE11_SCHEDULE):
            y = 1.65 - i * 1.45
            label = self.tx(f"{group}   {slot}", 23, INK, BOLD).move_to(LEFT * 6.25 + UP * y)
            line = Line(LEFT * 4.4 + UP * y, RIGHT * 5.75 + UP * y, color=LIGHT, stroke_width=5)
            markers = VGroup()
            for j, (_, name, weight, when, _) in enumerate(GRADE11_ASSESSMENTS):
                x = -3.45 + j * 4.25
                dot = Dot([x, y, 0], color=[GREEN, PRIMARY, PURPLE][j], radius=0.13)
                text = self.tx(f"{when.strftime('%b %d')}\n{name.split()[0]} - {weight}", 17, INK, MEDIUM).next_to(dot, UP, buff=0.18)
                markers.add(VGroup(dot, text))
            rows.add(VGroup(label, line, markers))
        self.play(FadeIn(title), LaggedStart(*[FadeIn(row, shift=UP * 0.08) for row in rows], lag_ratio=0.18), run_time=1.7)
        self.wait(1.2)
        self.clear_scene()

    def final_summary(self) -> None:
        title = self.title("GRADE 11 STATISTICS", "Counting techniques - 2026")
        words = VGroup(
            self.badge("C", "CHOOSE", PRIMARY),
            self.badge("O", "ORGANIZE", GREEN),
            self.badge("C", "COUNT", ORANGE),
            self.badge("D", "DECIDE", PURPLE),
            self.badge("V", "VERIFY", TEAL),
        ).arrange(RIGHT, buff=0.33).move_to(UP * 0.55)
        closing = self.tx("READ THE SITUATION\nNOT ONLY THE FORMULA\nLeer la situacion, no solo la formula", 32, INK, BOLD).move_to(DOWN * 1.25)
        self.play(FadeIn(title), LaggedStart(*[FadeIn(word, scale=0.92) for word in words], lag_ratio=0.12), run_time=1.4)
        self.play(FadeIn(closing), run_time=0.9)
        self.play(self.camera.frame.animate.set(width=17.2), run_time=1.2, rate_func=smooth)
        self.wait(1.0)
        self.play(FadeOut(Group(*self.mobjects)), run_time=1.0)


# Preview:
# manim -pql statistics11_counting_visual_roadmap.py Statistics11CountingVisualRoadmap
# Final:
# manim -pqh statistics11_counting_visual_roadmap.py Statistics11CountingVisualRoadmap
