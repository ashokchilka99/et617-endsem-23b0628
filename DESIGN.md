# ET 617 End-Semester Design

**Exam card** — P4 Adaptive tutor with automatic question generation · P4-T3 Linear equations in one variable (Class 8) · L5 Learner repeating the topic after failing once · C4 10-minute sessions  
**Identity token** — `23B0628`

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
| 5 · Enter the next equation | Add 3 to both sides of `2x − 3 = 9`. Enter the equation before dividing. | `2x = 12`. | “The constant on the left becomes zero. Apply the same operation to the number on the right.” |
| 6 · Enter the next equation | Subtract 3 from both sides of `3x + 3 = 18`. Enter the equation before dividing. | `3x = 15`. | “Check what changed on the left and on the right, then try writing the equation again.” |
| 7 · Spot and repair an error | Correct `3x + 6 = 27 → x + 6 = 9` after dividing by 3. | `x + 2 = 9`. | “Apply the operation to the whole left side and the whole right side.” |
| 8 · Solve and verify a new equation | Solve `4x − 3 = 13`. Choose the first operation and write the substituted left side. | Add 3 to both sides, then divide by 4 to get `x = 4`. Enter `4(4) − 3`. It evaluates to `13`. | “Your substitution gives 13 on both sides. The solution checks out.” |

Tasks 5–7 show example numbers from the templates. Two practice slots can be replaced by adaptive activities. The session keeps eight numbered tasks and ends with an independent substitution check.

### How the tutor selects the next activity

The tutor scores numerical and structured answers against exact arithmetic. For short explanations, it checks for a valid operation on both sides, accepts common paraphrases, and asks for clarification when the reasoning is ambiguous. Retries keep the current equation. An adaptive activity uses a fresh equation or calculation and shows “Why this next?” A hint stays recorded as support after it is closed.

| Evidence | Next action | Example the learner sees |
| --- | --- | --- |
| Two independent correct responses in a row | Generate a harder equation with a negative coefficient. | `−2x + 5 = 13` has solution `x = −4`. Substitution gives `−2(−4) + 5 = 13`. |
| The one-side-only tag appears twice | Explain the operation with a balance, then give a similar question. | Show `(2x + 6) ÷ 2 = 14 ÷ 2` and explain that the divisor reaches both terms on the left. |
| The sign-flip tag appears twice | Show an integer mini-lesson using the original equation’s right side and the inverse of its constant. | For `x + 5 = 12`, move five places left from 12 to reach 7, then ask for `11 − 5`. |

### AI functionality

When a harder question is selected, `GET /api/question?variant=0` (or variant 1–3) asks Vercel AI Gateway for one equation with a specified negative coefficient, bounded integer values, and the four JSON fields `a`, `b`, `c`, and `x`. The server and browser validate the object and solve `(c − b) ÷ a` again before showing the question. Invalid output, timeouts, and unavailable credentials use a checked question labelled **Sample (offline)**. Learner answers and identifying information stay in the browser.

### Ten-minute session and resume behavior

Plan for about 1 minute for the warm-up, 2 minutes for the worked example, 4 minutes for the practice tasks, 2 minutes for the transfer task, and 1 minute for the recap. Adaptive tasks replace practice slots. **Save & stop** preserves the current task, draft, mastery, misconception tags, history, feedback, and planned next step in the browser. **Resume practice** opens the saved task. The progress bar shows the current step, and the optional practice details show time on task, hints, and retries.

The learner moves through **Start or Resume → Warm-up and Worked Example → Practice and Adaptive Feedback → Transfer Check → Session complete**. The recap distinguishes independent work from supported work and gives one next practice step. The footer on each screen and the About screen display `23B0628`.

### Contrasting scenarios to verify in the app

- **Correct path.** Meera solves `3x + 2 = 20`, verifies `x = 6`, and explains that subtracting 2 from both sides preserves equality. The tutor confirms her explanation and serves the negative-coefficient challenge.
- **Misconception path.** Meera twice writes `x = 7 + 6` while correcting `2x + 6 = 14`. The tutor shows the balance and gives a fresh equation that tests the same step.
- **Prerequisite path.** Meera twice chooses to add 5 on `x + 5 = 12`. The tutor shows why moving left on the number line undoes adding 5, then gives her a smaller subtraction task.
