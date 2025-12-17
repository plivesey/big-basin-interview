# Manual Playwright Testing

Guide for using Playwright MCP tools to manually test web features. Use this when you want to interactively test or debug a feature yourself rather than spawning the QA agent.

## When to Use This

- **Quick exploratory testing** - You want to manually poke around
- **Debugging specific issues** - You know what to look for
- **Learning the UI** - Understanding how a feature works
- **One-off tests** - Not creating a full test report

**For comprehensive testing with reports**, use the QA testing agent instead.

## Available Playwright Tools

### Navigation & Setup

**Navigate to URL**:
```
mcp__playwright__browser_navigate(url)
```
Example: Navigate to http://localhost:5173

**Go Back**:
```
mcp__playwright__browser_navigate_back()
```

**Resize Browser**:
```
mcp__playwright__browser_resize(width, height)
```
Example: Test mobile view with width=375, height=667

### Inspecting the Page

**Get Page Structure** (Most Important!):
```
mcp__playwright__browser_snapshot()
```
This returns an accessibility tree showing all interactive elements. Use this first to see what's on the page.

**Take Screenshot**:
```
mcp__playwright__browser_take_screenshot(filename?, element?, ref?, fullPage?, type?)
```
- `filename`: Optional, defaults to page-{timestamp}.png
- `element` + `ref`: Capture specific element
- `fullPage`: Set to true for full scrollable page
- `type`: "png" or "jpeg"

**Check Console**:
```
mcp__playwright__browser_console_messages(level?)
```
- `level`: "error", "warning", "info", or "debug"
- Each level includes more severe levels

**Inspect Network**:
```
mcp__playwright__browser_network_requests(includeStatic?)
```
- `includeStatic`: Set to true to include images, fonts, scripts

### Interacting with Elements

**Click Element**:
```
mcp__playwright__browser_click(element, ref, button?, doubleClick?, modifiers?)
```
- `element`: Human-readable description (e.g., "Submit button")
- `ref`: Exact reference from snapshot
- `button`: "left", "right", or "middle"
- `doubleClick`: Set to true for double-click
- `modifiers`: ["Alt"], ["Control"], ["Shift"], etc.

**Type Text**:
```
mcp__playwright__browser_type(element, ref, text, slowly?, submit?)
```
- `element`: Human-readable description
- `ref`: Exact reference from snapshot
- `text`: Text to type
- `slowly`: Set to true to type one character at a time
- `submit`: Set to true to press Enter after typing

**Fill Form** (Multiple Fields):
```
mcp__playwright__browser_fill_form(fields)
```
Example:
```json
{
  "fields": [
    {
      "name": "Email input",
      "type": "textbox",
      "ref": "textbox-email",
      "value": "user@example.com"
    },
    {
      "name": "Password input",
      "type": "textbox",
      "ref": "textbox-password",
      "value": "password123"
    },
    {
      "name": "Remember me checkbox",
      "type": "checkbox",
      "ref": "checkbox-remember",
      "value": "true"
    }
  ]
}
```

**Select Dropdown Option**:
```
mcp__playwright__browser_select_option(element, ref, values)
```
- `values`: Array of option values to select

**Hover Over Element**:
```
mcp__playwright__browser_hover(element, ref)
```

**Press Key**:
```
mcp__playwright__browser_press_key(key)
```
Examples: "Enter", "Escape", "ArrowDown", "Tab", "a", "A"

### Waiting & Timing

**Wait for Condition**:
```
mcp__playwright__browser_wait_for(text?, textGone?, time?)
```
- `text`: Wait for text to appear
- `textGone`: Wait for text to disappear
- `time`: Wait for X seconds

### Advanced

**Run JavaScript**:
```
mcp__playwright__browser_evaluate(function, element?, ref?)
```
Example: Check element properties, modify DOM, etc.

**Handle Dialog**:
```
mcp__playwright__browser_handle_dialog(accept, promptText?)
```
For alert(), confirm(), prompt() dialogs

**Upload Files**:
```
mcp__playwright__browser_file_upload(paths?)
```
Provide array of absolute file paths

**Manage Tabs**:
```
mcp__playwright__browser_tabs(action, index?)
```
- `action`: "list", "new", "close", "select"
- `index`: Tab number for close/select

## Testing Workflow

### 1. Start Your Session

```
Navigate: mcp__playwright__browser_navigate("http://localhost:5173")
Take initial screenshot: mcp__playwright__browser_take_screenshot("start.png")
```

### 2. Understand the Page

```
Get page structure: mcp__playwright__browser_snapshot()
```
This shows all interactive elements with their refs. You need the `ref` values for interactions.

### 3. Check for Issues

```
Console: mcp__playwright__browser_console_messages("error")
Network: mcp__playwright__browser_network_requests()
```

### 4. Interact with Elements

Always get a snapshot first to see available elements and their refs:

```
Snapshot → Find element ref → Click/Type/etc using that ref
```

Example:
```
1. browser_snapshot() → See button with ref="button-submit"
2. browser_click("Submit button", "button-submit")
3. browser_snapshot() → Verify result
```

### 5. Document Findings

Take screenshots of interesting states, errors, or bugs:
```
browser_take_screenshot("bug-login-error.png")
```

## Common Testing Patterns

### Test a Form Submission

```
1. browser_navigate(url)
2. browser_snapshot() → Get field refs
3. browser_type("Email field", "input-email", "test@example.com")
4. browser_type("Password field", "input-password", "password123")
5. browser_click("Submit button", "button-submit")
6. browser_wait_for("Success message")
7. browser_snapshot() → Verify result
8. browser_take_screenshot("success.png")
```

### Test Navigation Flow

```
1. browser_navigate(url)
2. browser_snapshot()
3. browser_click("Nav link", "link-about")
4. browser_wait_for("About page heading")
5. browser_snapshot()
6. browser_navigate_back()
7. browser_snapshot() → Verify we're back
```

### Test Error Handling

```
1. browser_navigate(url)
2. browser_snapshot()
3. browser_click("Submit", "button-submit") → Submit without filling fields
4. browser_snapshot() → See error messages
5. browser_console_messages("error") → Check for JS errors
6. browser_take_screenshot("validation-errors.png")
```

### Test Responsive Behavior

```
1. browser_navigate(url)
2. browser_take_screenshot("desktop.png")
3. browser_resize(375, 667) → iPhone size
4. browser_take_screenshot("mobile.png")
5. browser_snapshot() → Check mobile layout
```

## Tips & Best Practices

1. **Always snapshot first** - You need refs to interact with elements

2. **Use descriptive element names** - "Submit button" not "button"

3. **Take screenshots liberally** - Visual documentation is valuable

4. **Check console after interactions** - Catch JavaScript errors

5. **Wait for dynamic content** - Use browser_wait_for for loading states

6. **Test one thing at a time** - Easier to identify issues

7. **Verify after actions** - Don't assume it worked, check with snapshot

8. **Full page screenshots for context** - Use `fullPage: true`

9. **Name screenshots clearly** - "bug-login-timeout.png" not "screenshot1.png"

10. **Check network for API issues** - Failed requests often cause bugs

## Example Testing Session

```
User: "Test if the login form works"

1. Navigate to app:
   browser_navigate("http://localhost:3000")

2. See what's on page:
   browser_snapshot()

3. Take starting screenshot:
   browser_take_screenshot("login-start.png")

4. Fill login form (using refs from snapshot):
   browser_type("Email input", "input-email", "user@test.com")
   browser_type("Password input", "input-password", "testpass123")

5. Submit:
   browser_click("Login button", "button-login")

6. Wait for result:
   browser_wait_for("Dashboard") or browser_wait_for("Login successful")

7. Check what happened:
   browser_snapshot()
   browser_console_messages()
   browser_take_screenshot("login-result.png")

8. Report findings:
   "Login form works correctly. User is redirected to dashboard after
   successful login. No console errors. Screenshots saved."
```

## Troubleshooting

**Element not found?**
- Run browser_snapshot() to get current refs
- Refs may change after navigation/interactions

**Click not working?**
- Check if element is visible/enabled
- Try browser_hover() first to ensure element is in viewport
- Wait for dynamic content with browser_wait_for()

**Need to scroll?**
- Playwright auto-scrolls to elements before clicking
- Or use browser_evaluate() to scroll manually

**Timing issues?**
- Use browser_wait_for() to wait for content
- Use `slowly: true` when typing to trigger input handlers

## Related

For comprehensive automated testing with full reports, use the **QA testing agent**:
```
Task: qa-tester
Prompt: "Test the [feature name] feature thoroughly and provide a detailed report"
```

The QA agent will systematically test features and generate structured test reports with screenshots.
