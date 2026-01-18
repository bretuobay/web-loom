# Web Loom Documentation - Paper Folder

This folder contains architectural documentation and white papers for the Web Loom project.

## Contents

### Individual Documentation Files

- **executive-summary.md** - High-level overview of Web Loom's purpose and value proposition
- **architecture-overview.md** - System architecture diagrams using Mermaid
- **mvvm-pattern.md** - MVVM pattern implementation details
- **framework-adapters.md** - How framework adapters work across React, Vue, Angular, Lit, and Vanilla JS
- **plugin-system.md** - Plugin architecture and lifecycle management
- **state-management.md** - State management patterns and libraries
- **prompt.md** - Prompts and guidance for understanding the architecture
- **white-paper.md** - Comprehensive white paper (auto-generated)

## Combined Documentation

For LLM consumption or comprehensive reading, use the combine script:

### Quick Usage

```bash
# Generate combined documentation (outputs to paper/ folder)
./combine-docs.sh

# Generate for LLM consumption
./combine-docs.sh llm-context.md

# Custom output file
./combine-docs.sh my-docs.md
```

### Output Files

**Note:** All output files are created in the `paper/` directory.

- **llm-context.md** - All paper folder files combined (~1474 lines)
- **combined-documentation.md** - Paper files + main README (default output)

### Script Features

The `combine-docs.sh` script:

- Combines all markdown files in logical reading order
- Outputs to paper directory
- Adds clear section separators showing source file names
- Includes header with generation date and purpose
- Automatically includes the main project README
- Shows file count and total lines in output

## File Order in Combined Output

1. Executive Summary
2. Architecture Overview
3. MVVM Pattern
4. Framework Adapters
5. Plugin System
6. State Management
7. Prompt/Guidance
8. Main Project README (always included)

## Use Cases

### For LLMs (Claude, ChatGPT, etc.)

```bash
cd paper
./combine-docs.sh llm-context.md
# Upload llm-context.md to your LLM
```

This provides comprehensive context about:

- Project architecture and philosophy
- Implementation patterns
- Framework adapter strategies
- Plugin system design
- Main project README for complete overview

### For Documentation Review

```bash
cd paper
./combine-docs.sh combined-documentation.md
# Review combined-documentation.md for completeness
```

### For Team Onboarding

Share the combined documentation (in the paper/ folder) as a single file for new team members to understand the entire architecture.

## Maintaining Documentation

When adding new documentation:

1. Create a new `.md` file in this folder
2. Update the `FILES` array in `combine-docs.sh` to include it
3. Run the script to regenerate combined files

## Dependencies

- Bash shell
- Basic Unix utilities (cat, wc, date)
- No external dependencies required

## Notes

- Mermaid diagrams are preserved in the combined output
- All markdown formatting is maintained
- Source file markers are added as HTML comments for reference
- The script is idempotent - safe to run multiple times

## Quick Reference

```bash
# Generate for LLM (recommended)
cd paper
./combine-docs.sh llm-context.md

# Generate default documentation
cd paper
./combine-docs.sh

# Check output
wc -l llm-context.md
head -20 llm-context.md

# View output files
ls -lh *.md
```
