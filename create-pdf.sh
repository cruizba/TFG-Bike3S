pandoc memory.md \
-V geometry:margin=1in \
--bibliography bibliography.bib \
--csl ieee.csl \
--toc \
--include-in-header titlesec.tex \
--number-sections \
-o memory.pdf \