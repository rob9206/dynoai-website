# Contributing to DynoAI Landing Page

First off, thank you for considering contributing to DynoAI! It's people like you that help make DynoAI better.

## Code of Conduct

This project and everyone participating in it is governed by the [DynoAI Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to info@dynoai.com.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, please include as many details as possible using our bug report template.

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce (be specific!)
- What you expected would happen
- What actually happens
- Screenshots if applicable
- Notes (possibly including why you think this might be happening)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- A clear and descriptive title
- A detailed description of the proposed enhancement
- Examples of how the enhancement would be used
- Why this enhancement would be useful

### Pull Requests

1. Fork the repo and create your branch from `main`
2. Make your changes
3. Test your changes locally
4. Ensure your code follows the existing style
5. Create a pull request using our PR template

## Development Setup

### Prerequisites

- A modern web browser
- A code editor (VS Code recommended)
- Git

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/dynoai-landing.git
   cd dynoai-landing
   ```

2. Open `index.html` in your browser to view the site locally

3. Make changes to HTML/CSS files and refresh to see updates

### Project Structure

```
├── index.html          # Main landing page
├── styles.css          # Main stylesheet
├── article-styles.css  # Article page styles
├── README.md           # Project documentation
└── .github/            # GitHub templates and workflows
```

## Style Guidelines

### HTML

- Use semantic HTML5 elements
- Maintain proper indentation (2 spaces)
- Include appropriate ARIA attributes for accessibility
- Keep markup clean and readable

### CSS

- Use CSS custom properties for colors and common values
- Follow mobile-first responsive design
- Use meaningful class names (BEM-style encouraged)
- Group related properties together
- Comment complex or non-obvious code

### Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests when relevant

**Examples:**
```
Add responsive navigation menu
Fix hero section alignment on mobile
Update color scheme for better contrast
```

## Testing

Before submitting a pull request:

1. Test in multiple browsers (Chrome, Firefox, Safari, Edge)
2. Test responsive design at various breakpoints
3. Validate HTML using [W3C Validator](https://validator.w3.org/)
4. Check accessibility using browser dev tools or [WAVE](https://wave.webaim.org/)

## Questions?

Feel free to reach out at info@dynoai.com if you have any questions about contributing.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
