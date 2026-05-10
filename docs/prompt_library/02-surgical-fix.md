# The Surgical Fix Prompt
**Use Case:** For making targeted updates without rewriting the whole architecture.
**Prompt:**
Act as a Developer. We are on branch `[branch-name]`. Read `.ai/CONTEXT.md` for architecture rules. 
YOUR DIRECTIVE:
1. Open `[file-path]`.
2. [Describe exact fix needed, e.g., 'Add a checkout button that clears cart state'].
3. Do NOT touch unrelated files or backend APIs. 
4. Save the file and log the addition in `.ai/CONTEXT.md`.
