# ET 617 End-Semester Design

**Exam card** — P4 Adaptive tutor with automatic question generation · P4-T3 Linear equations in one variable (Class 8) · L5 Learner repeating the topic after failing once · C4 10-minute sessions  
**Identity token** — `23b0628`

## Educational problem

Class 8 learners who struggled with linear equations can remember a rule like “move it across” but lose track of what keeps an equation true. When they get a wrong answer, another question at the same level gives them little insight into where their reasoning went wrong. For a learner repeating the topic, that uncertainty can make it hard to attempt or explain a solution. The tutor will identify the first incorrect step, offer a short practice task suited to that difficulty, and ask the learner to check their solution by substitution.

**Context of use** — Individual practice at home after school on a shared Android phone, in sessions of up to 10 minutes. The learner can pause and return on the same device.

## Measurable learning outcomes

By the end of the activity, the learner can:

1. **Solve** a new two-step linear equation with an integer solution by choosing and applying valid operations, then **verify** the solution by substitution.
2. **Explain** why an equation-solving step preserves equality by naming the operation and showing that it is applied to both sides.
3. **Identify and correct** the first invalid step in a worked equation involving an incorrect inverse operation or division applied to only one term.

## Learner persona

**Meera**, 13, is in Class 8 and is revisiting linear equations after failing a unit test. She can substitute a small positive integer into a simple expression, knows multiplication facts, and can solve some one-step equations by inspection. Signed subtraction is inconsistent when she works under pressure. She reads school mathematics in English and talks through difficult ideas in Hindi at home, so prompts use short English sentences alongside symbolic steps.

Meera borrows a family Android phone after school and commonly has only 10 minutes before someone else needs it. She wants to solve the next worksheet independently but gets anxious when an answer is marked wrong without a way to recover. The tutor gives private, step-specific feedback and keeps retries available without a public score or a countdown.

- **M1 — Inverse operation.** For `x + 5 = 12`, Meera may write `x = 12 + 5`, carrying the plus sign across the equals sign.
- **M2 — Scope of division.** For `2x + 6 = 14`, Meera may divide the variable term and right side by 2 while leaving the constant as 6, producing `x + 6 = 7`.

## Content plan

### Concept and worked example

An equation says that two expressions have the same value. Subtracting the same number from both sides preserves that equality. Dividing both sides by the same nonzero number also preserves it. Dividing a sum means dividing every term in that sum.

For `3x + 4 = 19`, subtract 4 from both sides to get `3x = 15`. Divide both sides by 3 to get `x = 5`. Check the result by substituting `5`: `3 × 5 + 4 = 19`.

### Activity and feedback

| Task and format | Learner prompt | Model answer | Feedback shown after the response |
| --- | --- | --- | --- |
| 1 · Choose the next step | What should you do to isolate `x` in `x + 5 = 12`? Choose “subtract 5 from both sides,” “add 5 to both sides,” or “subtract 5 from the left side only.” | Subtract 5 from both sides. | **Correct:** “Subtracting 5 from both sides leaves `x = 7`.” **M1:** “Adding 5 makes the left side `x + 10`. Which operation would make the `+5` become zero?” **One side only:** “The left side changed by 5. What must happen to the right side to keep both values equal?” |
| 2 · Enter a number | Solve `3x + 2 = 20`. Enter `x`, then enter the value of `3x + 2` at your answer. | `x = 6` and `3(6) + 2 = 20`. | **Correct:** “Both sides equal 20 when `x = 6`.” **Retry:** “Put your value into `3x + 2`. If it gives a number other than 20, start by undoing the `+2`.” |
| 3 · Explain a step | Why does `3x + 2 = 20` become `3x = 18`? State what happens to each side. | “I subtract 2 from each side. The left becomes `3x` and the right becomes 18.” | **Correct:** “You named the operation and applied it to both sides, keeping the values equal.” **Incomplete:** “You described the left side. What did you do to 20?” |
| 4 · Spot and repair an error | A learner writes `2x + 6 = 14 → x + 6 = 7`. Tap the first line after the change and enter its correction if the learner divides first. | The second line is invalid. Dividing both sides and every left-side term by 2 gives `x + 3 = 7`. | **Correct:** “You divided `2x`, `6`, and `14` by 2.” **M2:** “You divided `2x` and `14` by 2. What happens to the `+6` when you divide the whole left side?” |
| 5 · Solve and verify a new equation | Solve `4x − 3 = 13`. Show your first step and check your solution. | Add 3 to both sides to get `4x = 16`, so `x = 4`. Check `4(4) − 3 = 13`. | **Correct:** “Adding 3 undoes subtracting 3. Your substitution gives 13, so the solution checks out.” **M1:** “The equation has `−3`. What can you add to both sides to make that term zero?” |

### How the tutor selects the next activity

The tutor scores numerical and structured answers against exact arithmetic. For short explanations, it looks for a valid operation and evidence that the learner applied it to both sides. If the explanation is ambiguous, the learner gets a focused follow-up instead of an automatic incorrect mark. The tutor chooses the next activity from the response history and uses parameterized templates to generate a fresh equation for the selected skill. Each generated practice item has a checked solution and a substitution check. A retry uses new numbers while keeping the reasoning demand stable.

| Evidence | Next action | Example the learner sees |
| --- | --- | --- |
| Two consecutive correct responses on the current skill, including one explanation that shows a valid operation on both sides | Generate a harder equation and keep the learner on the same learning outcome. | “Try `−2x + 5 = 13`. Show how you would isolate `−2x`, then check your answer.” Model answer is `x = −4`, with `−2(−4) + 5 = 13`. |
| A misconception or incomplete explanation, with the relevant arithmetic prerequisite intact | Give an alternative explanation and then a similar question with new numbers. | For M2, display `(2x + 6) ÷ 2 = 14 ÷ 2` and highlight each term. Ask the learner to divide `4x + 8 = 20` by 4. The target step is `x + 2 = 5`. |
| A diagnostic prompt confirms the learner misses the prerequisite needed for the next step | Teach the prerequisite with one worked example and one check, then return to the saved equation. | If the learner gets `9 − 14` wrong while solving `x + 14 = 9`, show how moving 14 places left from 9 gives `−5`. Ask for `7 − 10` before returning to `x + 14 = 9` and asking the learner to isolate `x`. |

### Ten-minute session and resume behavior

Plan for about 1 minute to start and try the step-choice prompt, 2 minutes for the worked example, 4 minutes for practice and one short adaptive branch, 2 minutes for the transfer task, and 1 minute for the recap. A session includes at most one adaptive detour. A learner who needs more time can pause at any point, and the tutor saves the current task, draft answer, feedback state, and pending next step in the browser. Returning to the start screen offers **Resume practice** and opens the saved task.

The learner moves through **Start or Resume → Worked Example → Practice → Targeted Feedback or Challenge → Transfer Check → Recap**. The recap names a skill the learner demonstrated and gives one next practice step. The footer on each screen and the About screen display `23b0628`.

### Contrasting scenarios to verify in the app

- **Correct path.** Meera solves `3x + 2 = 20`, verifies `x = 6`, and explains that subtracting 2 from both sides preserves equality. The tutor confirms her explanation and serves the negative-coefficient challenge.
- **Misconception path.** Meera changes `2x + 6 = 14` to `x + 6 = 7`. The tutor checks that she can calculate `6 ÷ 2`, highlights where the division must apply, and gives a new equation that tests the same step. The practice stays at the current difficulty.
