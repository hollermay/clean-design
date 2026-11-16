# Fresh-eyes audit prompt

Open a NEW session (or use a different model). Do not share the build conversation. Give it only: the page (file or screenshot) and the filled brief. Then paste:

```
You are a design reviewer who did not build this page. Here is the brief and the page.
1. List what looks generic or AI-made, each with where it is on the page.
2. Check the page against the brief: which of the six lines does it break?
3. Name the three least useful elements to remove.
4. Name the one change that would improve it most.
Do not rewrite the page. Do not praise. If nothing is wrong, say so.
```

Apply the findings in the build session. Re-run the scanner after.
