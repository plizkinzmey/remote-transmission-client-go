# Best Practices for Organizing Automated Tests in Go

---

## 1. File and Package Structure
- Place tests alongside the code under test.
- Test files must end with `_test.go`.
- Keep package names consistent between code and tests to avoid unnecessary visibility issues.

## 2. Test Function Naming
- Every test function must start with `Test`.
- Use descriptive names: `TestFunctionName_Scenario`.
- Example:
  ```go
  func TestCreateUser_ValidInput(t *testing.T)
  ```

## 3. Assertions
- Use clear `if` statements for comparison.
- For better readability and failure reporting, consider using libraries like `testify`.
- Always provide helpful messages in `t.Errorf` or `t.Fatalf`.

## 4. Subtests
- Use `t.Run` for table-driven tests and logically grouped scenarios.
- Example:
  ```go
  func TestLogin(t *testing.T) {
      tests := []struct { name string; input string; wantErr bool }{...}
      for _, tt := range tests {
          t.Run(tt.name, func(t *testing.T) {
              // Test logic here
          })
      }
  }
  ```

## 5. Isolation
- Tests must not depend on shared mutable state.
- Use setup and teardown logic inside each test if needed.

## 6. Dependency Injection
- Prefer passing dependencies via interfaces.
- Makes mocking easier and tests more reliable.

## 7. Use of Mocks
- Manually implement mocks when possible.
- For complex cases, use libraries like `golang/mock` or `testify/mock`.
- **Important:** When mocking external libraries, ensure your mock interfaces **exactly** match the method signatures of the library version specified in your `go.mod`. Check library documentation or source code for correct signatures (including types like `cunits.Bits` vs `int64`).

## 8. Test Coverage
- Regularly run `go test -cover ./...` to track untested code.
- Aim for meaningful coverage, not 100% for the sake of it.

## 9. Fast and Focused Tests
- Keep unit tests fast and focused.
- Heavy operations (database, external API) belong to integration tests.

## 10. Continuous Integration
- Integrate tests into your CI/CD pipeline.
- Always run tests on every push and pull request.
- Ensure your CI environment correctly downloads dependencies (`go mod download`).

## 11. Helpful Utilities & Module Hygiene
- Use tools like:
  - `go test -v ./...` for verbose output across all packages.
  - **Coverage Reporting:**
    - `go test -coverprofile=coverage.out ./...` : Run tests for all packages, calculate coverage, and save the profile to `coverage.out`. Replace `./...` with a specific package path (e.g., `./internal/mypackage/...`) to test only that package.
    - `go tool cover -func=coverage.out` : Read the coverage profile and display the coverage percentage for each function in the tested packages.
    - `go tool cover -html=coverage.out` : Generate an HTML report from the coverage profile and open it in a browser for a visual representation of covered/uncovered lines.
  - `gotests` to generate boilerplate test cases.
  - **`go mod tidy`**: Run this **frequently**, especially after adding/removing imports or changing `go.mod`, to synchronize dependencies and remove unused ones. Resolve any errors reported by this command *before* proceeding.
  - **`go get <module>@<version>` or `go get <module>@latest`**: Use to explicitly add or update dependencies. Verify that the specified `<version>` exists.
  - **`go list -m -versions <module>`**: Check available versions for a module.

## 12. Clear Failures
- Fail tests early and loudly.
- Provide actionable messages to speed up debugging.

## 13. Documentation
- Comment complex test cases.
- Explain "why" the test exists if it's not obvious.

---

## 14. Dependency Management for Testing (New Section)

- **Verify Dependency Versions:** Before adding or updating a dependency in `go.mod` or using `go get <module>@<version>`, confirm that the specified version tag (e.g., `v2.1.0`) actually exists in the module's repository. Do not assume or guess versions.
- **Synchronize Dependencies:** After adding new imports (especially from external libraries needed for mocks or tests) or modifying `go.mod`, **always** run `go mod tidy` and ensure it completes without errors. This updates `go.mod` and `go.sum` and downloads necessary modules.
- **Resolve Module Errors First:** Errors like `unknown revision`, `missing metadata`, or `missing go.sum entry` during `go mod tidy`, `go get`, or compilation indicate problems with dependency resolution. Fix these module-related issues *before* debugging compilation errors like `undefined: <Type>`. Compilation often fails simply because the required packages could not be loaded.
- **Interface Signature Accuracy:** When creating interfaces to abstract external dependencies (see Point 6 & 7), meticulously copy the exact method signatures from the library version you are using. Mismatched signatures will prevent your code (and mocks) from implementing the interface correctly.

Adopting these best practices will keep your Go test suite clean, maintainable, and effective!
