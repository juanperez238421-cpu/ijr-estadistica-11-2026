#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Final senior visual-QA refinement for Statistics 11 Boolean Logic V3.

This scene subclasses the traceable V3 baseline and only overrides layouts that
were identified during the first 30-frame audit as too crowded or overlapping.
The pedagogy, data, timing, Colab model and lesson sequence remain unchanged.
"""

from stat11_comparisons_logic_protocol_v3 import *

_BaseComparisonsLogicV3 = Stat11ComparisonsLogicProtocolV3


class Stat11ComparisonsLogicProtocolV3(_BaseComparisonsLogicV3):
    """Final render scene after senior frame-by-frame spacing corrections."""

    def comparison_operators(self) -> None:
        self.set_header(
            4,
            "THE SIX COMPARISON OPERATORS",
            "Each operator asks one precise question about two values.",
        )
        specs = [
            (">", "greater than", "4.2 > 3.0", "True"),
            ("<", "less than", "2.8 < 3.0", "True"),
            (">=", "greater than or equal to", "3.0 >= 3.0", "True"),
            ("<=", "less than or equal to", "2.8 <= 3.0", "True"),
            ("==", "equal to", "3.0 == 3.0", "True"),
            ("!=", "not equal to", "4.2 != 3.0", "True"),
        ]

        # Stage A: one operator at a time. Do not keep previous cards visible;
        # this preserves a clean prediction stage with no transient collisions.
        for i, (_, meaning, example, result) in enumerate(specs):
            q = self.text(f"Question {i + 1}: {meaning}?", 27, BOLD).move_to(UP * 1.45)
            expr = self.mono(example, 36, BOLD).move_to(UP * 0.30)
            predict = self.text("Predict: True or False?", 27, BOLD).move_to(DOWN * 0.70)
            answer = self.result_badge(result).move_to(DOWN * 1.70)
            self.play(Write(q), run_time=RUN_NORMAL)
            self.play(Write(expr, rate_func=linear), run_time=RUN_NORMAL)
            self.play(Write(predict), run_time=RUN_NORMAL)
            self.wait(PAUSE_WORK)
            self.play(Create(answer[0]), Write(answer[1]), run_time=RUN_NORMAL)
            self.wait(PAUSE_EXPLAIN)
            self.play(FadeOut(q), FadeOut(expr), FadeOut(predict), FadeOut(answer), run_time=RUN_QUICK)

        # Stage B: only after all six individual predictions, assemble the
        # stable 2x3 reference grid.
        final_cards = VGroup()
        positions = [
            UP * 1.25 + LEFT * 4.35,
            UP * 1.25,
            UP * 1.25 + RIGHT * 4.35,
            DOWN * 1.02 + LEFT * 4.35,
            DOWN * 1.02,
            DOWN * 1.02 + RIGHT * 4.35,
        ]
        for (symbol, meaning, example, result), position in zip(specs, positions):
            card = self.logic_operator_card(symbol, meaning, f"{example} → {result}")
            card.scale(0.88).move_to(position)
            final_cards.add(card)

        self.assert_content_safe(final_cards, "scene4 final operator grid")
        self.play(
            LaggedStart(*[FadeIn(card, shift=UP * 0.08) for card in final_cards], lag_ratio=0.12),
            run_time=RUN_SLOW * 1.45,
        )
        self.wait(PAUSE_EXPLAIN)

        eq_box = SurroundingRectangle(final_cards[4], color=BLACK_LINE, buff=0.08, stroke_width=2.5)
        ne_box = SurroundingRectangle(final_cards[5], color=BLACK_LINE, buff=0.08, stroke_width=2.5)
        self.play(Create(eq_box), Create(ne_box), run_time=RUN_NORMAL)
        note = self.text(
            "Pay special attention:  == means equal · != means different",
            25,
            BOLD,
        ).next_to(final_cards, DOWN, buff=0.22)
        self.play(Write(note), run_time=RUN_SLOW)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def motivate_logic(self) -> None:
        self.set_header(
            7,
            "ONE COMPARISON IS SOMETIMES NOT ENOUGH",
            "A data rule can require two questions to be true at the same time.",
        )
        score = self.neutral_card("score", "4.2", width=3.0).move_to(UP * 1.72)
        self.play(FadeIn(score), run_time=RUN_NORMAL)

        question = self.text(
            "Is this score BOTH at least 3.0 AND at most 5.0?",
            29,
            BOLD,
        ).move_to(UP * 0.63)
        self.fit(question, 13.3, 0.62)
        self.play(Write(question), run_time=RUN_SLOW)
        self.wait(PAUSE_EXPLAIN)

        a = self.condition_card("QUESTION A", "score >= 3.0", "True", width=5.1)
        b = self.condition_card("QUESTION B", "score <= 5.0", "True", width=5.1)
        pair = VGroup(a, b).arrange(RIGHT, buff=0.60).move_to(DOWN * 0.72)
        self.assert_content_safe(pair, "scene7 separated condition cards")
        self.play(FadeIn(a, shift=LEFT * 0.10), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)
        self.play(FadeIn(b, shift=RIGHT * 0.10), run_time=RUN_NORMAL)
        self.wait(PAUSE_READ)

        combine = self.mono("True  AND  True", 31, BOLD).next_to(pair, DOWN, buff=0.25)
        self.play(Write(combine), run_time=RUN_SLOW)
        self.wait(PAUSE_WORK)
        result = self.result_badge("True").next_to(combine, RIGHT, buff=0.42)
        self.play(Create(result[0]), Write(result[1]), run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)

        python = self.mono("score >= 3.0 and score <= 5.0", 27, BOLD).next_to(combine, DOWN, buff=0.28)
        self.fit(python, 12.4, 0.60)
        self.play(TransformFromCopy(combine, python), run_time=RUN_SLOW)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def and_operator(self) -> None:
        self.set_header(
            8,
            "AND = BOTH CONDITIONS",
            "The combined result is True only when both conditions are True.",
        )

        title = self.mono("and", 40, BOLD)
        meaning = self.text("BOTH requirements must hold", 26, BOLD)
        heading = VGroup(title, meaning).arrange(DOWN, buff=0.10).move_to(UP * 1.67)
        self.play(Write(title), Write(meaning), run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)

        cases = [
            ("True", "True", "True"),
            ("True", "False", "False"),
            ("False", "True", "False"),
            ("False", "False", "False"),
        ]
        case_cards = VGroup()
        for left, right, answer in cases:
            expression = self.mono(f"{left} and {right}", 20, BOLD)
            arrow = Arrow(LEFT * 0.26, RIGHT * 0.26, color=BLACK_LINE, stroke_width=1.5)
            badge = self.result_badge(answer, width=1.55)
            row = VGroup(expression, arrow, badge).arrange(RIGHT, buff=0.14)
            box = RoundedRectangle(
                width=3.25,
                height=0.78,
                corner_radius=0.09,
                stroke_color=LIGHT_GRAY,
                stroke_width=1.3,
                fill_color=WHITE_FILL,
                fill_opacity=1.0,
            )
            self.fit(row, 2.95, 0.60)
            row.move_to(box)
            case_cards.add(VGroup(box, row))
        case_cards.arrange_in_grid(rows=2, cols=2, buff=(0.24, 0.22))
        case_cards.move_to(LEFT * 3.65 + DOWN * 0.35)

        table = self.truth_table("and")
        table.group.scale(0.72).move_to(RIGHT * 3.70 + DOWN * 0.35)
        stable = VGroup(case_cards, table.group)
        self.assert_content_safe(stable, "scene8 and cases and truth table")

        self.play(
            LaggedStart(*[FadeIn(card, shift=UP * 0.06) for card in case_cards], lag_ratio=0.14),
            run_time=RUN_SLOW,
        )
        self.wait(PAUSE_EXPLAIN)
        self.play(FadeIn(table.group), run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)

        ex1 = self.mono("4.2 >= 3.0 and 4.2 <= 5.0  →  True", 22, BOLD).move_to(DOWN * 2.38)
        ex2 = self.mono("2.8 >= 3.0 and 2.8 <= 5.0  →  False", 22, BOLD).next_to(ex1, DOWN, buff=0.16)
        self.play(Write(ex1, rate_func=linear), run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)
        self.play(Write(ex2, rate_func=linear), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def or_operator(self) -> None:
        self.set_header(
            9,
            "OR = AT LEAST ONE CONDITION",
            "A flag rule is True when either side is True, or when both are True.",
        )
        rule_text = self.text(
            "Flag a score if it is below 3.0 OR at least 4.5.",
            28,
            BOLD,
        ).move_to(UP * 1.62)
        code = self.mono("score < 3.0 or score >= 4.5", 28, BOLD).next_to(rule_text, DOWN, buff=0.24)
        self.play(Write(rule_text), run_time=RUN_SLOW)
        self.play(Write(code, rate_func=linear), run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)

        tests = [
            ("score = 2.8", "True or False", "True"),
            ("score = 4.5", "False or True", "True"),
            ("score = 3.7", "False or False", "False"),
        ]
        test_rows = VGroup()
        for score_label, states, result in tests:
            score_mob = self.mono(score_label, 21, BOLD)
            state_mob = self.mono(states, 20, BOLD)
            badge = self.result_badge(result, width=1.55)
            row = VGroup(score_mob, state_mob, badge).arrange(RIGHT, buff=0.28)
            box = RoundedRectangle(
                width=6.0,
                height=0.74,
                corner_radius=0.08,
                stroke_color=LIGHT_GRAY,
                stroke_width=1.2,
                fill_color=WHITE_FILL,
                fill_opacity=1.0,
            )
            self.fit(row, 5.65, 0.56)
            row.move_to(box)
            test_rows.add(VGroup(box, row))
        test_rows.arrange(DOWN, buff=0.18).move_to(LEFT * 3.25 + DOWN * 0.45)

        table = self.truth_table("or")
        table.group.scale(0.67).move_to(RIGHT * 3.85 + DOWN * 0.45)
        self.assert_content_safe(VGroup(test_rows, table.group), "scene9 separated or cases and truth table")

        for row in test_rows:
            self.play(FadeIn(row, shift=UP * 0.05), run_time=RUN_QUICK)
            self.wait(PAUSE_EXPLAIN)
        self.play(FadeIn(table.group), run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)

        key = self.text(
            "or means AT LEAST ONE condition must hold.",
            25,
            BOLD,
        ).move_to(DOWN * 2.62)
        self.play(Write(key), run_time=RUN_SLOW)
        self.wait(PAUSE_WORK)
        self.clear_stage()

    def final_challenge(self) -> None:
        self.set_header(
            18,
            "FINAL CHALLENGE",
            "Build the Boolean rule from the question before evaluating it.",
        )
        score = self.neutral_card("new observation", "4.7", width=3.3).move_to(UP * 1.72)
        self.play(FadeIn(score), run_time=RUN_NORMAL)

        q = self.text(
            "Is the score passing AND below 4.5?",
            30,
            BOLD,
        ).move_to(UP * 0.72)
        self.play(Write(q), run_time=RUN_SLOW)
        self.wait(PAUSE_WORK)

        steps = VGroup(
            self.mono("1. passing       →  score >= 3.0", 26, BOLD),
            self.mono("2. below 4.5     →  score < 4.5", 26, BOLD),
            self.mono("3. combine       →  (score >= 3.0) and (score < 4.5)", 25, BOLD),
        )
        steps.arrange(DOWN, aligned_edge=LEFT, buff=0.22).move_to(DOWN * 0.50)
        self.fit(steps, 12.8, 1.75)
        self.assert_content_safe(steps, "scene18 challenge steps")
        for line in steps:
            self.play(Write(line, rate_func=linear), run_time=RUN_NORMAL)
            self.wait(PAUSE_READ)
        self.wait(PAUSE_WORK)

        eval_line = self.mono("True and False", 30, BOLD).move_to(DOWN * 1.68)
        self.play(FadeIn(eval_line, shift=UP * 0.08), run_time=RUN_NORMAL)
        self.wait(PAUSE_WORK)
        result = self.result_badge("False").next_to(eval_line, RIGHT, buff=0.45)
        self.play(Create(result[0]), Write(result[1]), run_time=RUN_NORMAL)
        self.wait(PAUSE_EXPLAIN)

        interpretation = self.text(
            "The score passes, but it is not below 4.5. AND requires both conditions.",
            23,
            BOLD,
        ).move_to(DOWN * 2.55)
        self.fit(interpretation, 13.5, 0.60)
        self.play(Write(interpretation), run_time=RUN_SLOW)
        self.wait(PAUSE_FINAL)
        self.clear_stage()
