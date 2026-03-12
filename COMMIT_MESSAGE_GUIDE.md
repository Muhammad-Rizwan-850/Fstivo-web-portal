# Commit Message Guide

This project follows a structured commit message convention to ensure clear and consistent commit history.

## Format

Commit messages should follow one of these formats:

### Format 1: Bracket Style
```
[TYPE] description
```

### Format 2: Conventional Commits
```
type(scope): description
```

## Types

- `feat` - A new feature
- `fix` - A bug fix
- `docs` - Documentation only changes
- `style` - Changes that don't affect code meaning (white-space, formatting, etc.)
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `perf` - Performance improvement
- `test` - Adding or updating tests
- `build` - Changes to build system or dependencies
- `ci` - CI/CD changes
- `chore` - Other changes that don't modify src or test files
- `revert` - Revert a previous commit

## Scopes (Optional)

Scopes provide context about the area of the codebase affected:

- `auth` - Authentication and authorization
- `events` - Event management
- `dashboard` - Dashboard components
- `api` - API routes
- `ui` - UI components
- `database` - Database schema and migrations
- `payments` - Payment processing
- `notifications` - Notification system
- `docs` - Documentation
- `tests` - Test files
- `infra` - Infrastructure and deployment

## Examples

### Good Commit Messages

```
[feat] add user authentication with email verification
[fix] resolve payment processing bug for JazzCash
[feat] add volunteer activity tracking dashboard
[fix] handle edge case in event registration
[docs] update API documentation for v2 endpoints
[refactor] optimize database queries for events list
[feat(events)] add waitlist functionality
[fix(auth)] resolve session timeout issue
[style(ui] format components using prettier
[test(api)] add integration tests for payment webhooks
```

### Bad Commit Messages

```
fixed stuff
update
wip
done
fix bug
add feature
```

## Best Practices

1. **Use the imperative mood** - "add" not "added" or "adds"
2. **Keep it short** - Limit the first line to 72 characters or less
3. **Capitalize the subject line**
4. **Do not end with a period**
5. **Use the body to explain what and why** (not how)
6. **Reference issues** - Use `#issue_number` for related issues
7. **Break large changes** - Split into multiple logical commits
8. **Follow the pattern** - Consistent format makes git history readable

## Commit Message Body (Optional)

For more complex changes, add a body to explain the context:

```
[feat] add multi-language support

- Add English and Urdu translations
- Implement language switcher in navigation
- Store user language preference in database
- Update all static text to use translation keys

Closes #123
```

## Breaking Changes

If your commit introduces a breaking change, add `BREAKING CHANGE:` to the body:

```
[feat] redesign event registration flow

BREAKING CHANGE: Event registration API now requires additional fields:
- phone number (required)
- dietary preferences (optional)
- t-shirt size (optional)

Existing integrations will need to update their registration forms.
```

## Enforcing Commit Messages

This project uses Husky git hooks to enforce commit message format. The commit-msg hook will validate your commit message before allowing the commit.

If you need to bypass the hook (not recommended), use:
```bash
git commit --no-verify -m "your message"
```

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)
