# AI Team Synchronization & Onboarding
**Use Case:** For Members B, C, and D to get the code and initialize their local AI CLI.

### Step 1: Get the Code (Run in your standard terminal)
Before starting your AI, you must pull the latest architecture to your machine.
```bash
# 1. Clone the repository
git clone https://github.com/khairyKY/customer-ordering-system.git

# 2. Enter the project folder
cd customer-ordering-system

# 3. Ensure you are on the main branch
git checkout main
git pull origin main
```

### Step 2: Initialize Your AI (Run in your AI CLI)
Once the code is on your machine, open your AI CLI inside the `customer-ordering-system` folder and paste this exact prompt:

```text
Act as an expert Systems Architect. I am a team member working on the CSE323 Customer Ordering System. 

YOUR DIRECTIVE:
1. READ THE BRAIN: Read `.ai/CONTEXT.md` to understand the vertical slicing architecture and the baseline code Member A has already built.
2. READ THE ROADMAP: Read `docs/architecture_v2/09-team-feature-ownership.md` to understand the team's domain boundaries.
3. READ THE RUBRIC: Read `docs/curriculum/EJUST_CURRICULUM_SUMMARY.md` to ensure all code complies with university grading constraints.

Once you have ingested these files, output:
1. A brief summary acknowledging our architecture and tech stack constraints.
2. Ask me which feature I own (Payment, Tickets, or Auth) so we can begin Phase 1 (Requirements & Edge Cases).
```
