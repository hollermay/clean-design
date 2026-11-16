# Clean score: 50 / 100

Target: `before`

| Check | Found | Points lost |
|---|---|---|
| tells | 7 | 42 |
| contrast | 0 | 0 |
| a11y | 1 | 3 |
| spacing | 0 | 0 |
| fonts | 0 | 0 |
| placeholders | 0 | 0 |
| responsive | 1 | 5 |

Scoring: 100 minus (AI tells x6, cap 60) (contrast x5, cap 20) (accessibility x3, cap 15) (off-scale spacing x1, cap 10) (extra font families x5, cap 10) (placeholders x4, cap 12) (responsive x5, cap 10). Copy swaps are advisory and not scored.

## tells
- purple/pink gradient: 1 hit(s), e.g. ../cdtest/before/index.html:5  <section class="bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 text-center py-32 px-6">
- stock marketing words: 5 hit(s), e.g. ../cdtest/before/index.html:6  <h1 class="text-6xl font-bold">Supercharge your workflow with TaskFlow ✨</h1>
- emoji in the page: 2 hit(s), e.g. ../cdtest/before/index.html:14  <div class="card rounded-2xl p-8 bg-white/10 backdrop-blur-lg"><div class="text-4xl">🧠</div><h3 class="text-xl font-semibold mt-4">AI Power
- sparkle/rocket decoration: 3 hit(s), e.g. ../cdtest/before/index.html:6  <h1 class="text-6xl font-bold">Supercharge your workflow with TaskFlow ✨</h1>
- glassmorphism (blur backdrop): 3 hit(s), e.g. ../cdtest/before/index.html:13  <div class="card rounded-2xl p-8 bg-white/10 backdrop-blur-lg"><div class="text-4xl">🚀</div><h3 class="text-xl font-semibold mt-4">Lightnin
- fake stats or logos: 1 hit(s), e.g. ../cdtest/before/index.html:9  <p class="mt-4 text-sm">Trusted by 10,000+ happy users</p>
- row of identical cards: 1 hit(s), e.g. 3 identical "card rounded-2xl p-8 bg-white/10 backdrop-blur-lg" at ../cdtest/before/index.html:13, ../cdtest/before/index.html:14, ../cdtest/before/index.html:15

## a11y
- ../cdtest/before/index.html  heading jumps from h1 to h3

## responsive
- ../cdtest/before/index.html  no <meta name="viewport"> (the page will not scale on phones)

## copy swaps (advisory)
- ../cdtest/before/index.html:6  "Supercharge"  ->  say the job: what gets faster, by how much, for whom
- ../cdtest/before/index.html:7  "seamless"  ->  name the two things it connects
- ../cdtest/before/index.html:7  "Revolutionize"  ->  delete
- ../cdtest/before/index.html:7  "cutting-edge"  ->  delete, or give the spec
- ../cdtest/before/index.html:8  "Get Started"  ->  the real first step: "Paste your repo URL"
- ../cdtest/before/index.html:9  "Trusted by"  ->  a real number with its source, or delete
- ../cdtest/before/index.html:13  "seamless"  ->  name the two things it connects
- ../cdtest/before/index.html:13  "Lightning Fast"  ->  give the real time: "loads in 0.8 s"

A high score means the known mechanical problems are gone. It does not measure taste, hierarchy or photo quality: run the fresh-eyes audit for that.
