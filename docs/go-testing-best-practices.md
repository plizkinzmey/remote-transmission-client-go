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

## 4. Subtests and Test Organization
- Use `t.Run` to group related test cases within a single `Test` function. This is ideal for:
    - **Table-Driven Tests:** Iterating over a slice of test inputs and expected outputs.
    - **Scenario Grouping:** Testing different scenarios (e.g., success, specific errors, edge cases) of the *same function* under test. This keeps tests for one function logically contained.
- **Organize by Function:** Aim to have one primary `Test` function (e.g., `TestAddTorrent`) for each public function in your code file. Use subtests (`t.Run`) within that primary function to cover all its different behaviors and potential outcomes.
- Example:
  ```go
  func TestLogin(t *testing.T) {
      // Setup common to all login scenarios (if any)

      t.Run("ValidCredentials", func(t *testing.T) {
          // Test logic for successful login
      })

      t.Run("InvalidPassword", func(t *testing.T) {
          // Test logic for login with wrong password
      })

      t.Run("UserNotFound", func(t *testing.T) {
          // Test logic for non-existent user
      })

      // Teardown common to all login scenarios (if any)
  }
  ```

## 5. Isolation
- Tests must not depend on shared mutable state.
- Use setup and teardown logic inside each test or subtest (`t.Run`) if needed. `t.Cleanup` is useful for teardown.

## 6. Dependency Injection
- Prefer passing dependencies via interfaces.
- Makes mocking easier and tests more reliable.

## 7. Use of Mocks
- Manually implement mocks when possible for simplicity.
- For complex cases, use libraries like `golang/mock` or `testify/mock`.
- **Important:** When mocking external libraries, ensure your mock interfaces **exactly** match the method signatures of the library version specified in your `go.mod`.
  - **Verify All Types:** Тщательно проверяйте **все** типы в сигнатурах методов, включая стандартные (`int` vs `int64`), указатели (`*string`) и **пользовательские типы** (например, `cunits.Bits` vs `int64`). Неправильный тип в моке приведет к ошибкам компиляции или неверному поведению теста.
  - **Источник Правды:** Обращайтесь к исходному коду или документации используемой версии библиотеки для получения точных сигнатур.

## 8. Test Coverage
- Regularly run `go test -cover ./...` to track untested code.
- **Cover All Branches:** Aim to write test cases (often using subtests) that execute *every* branch (`if`/`else`, `switch` cases, error handling paths) within the functions you are testing.
- Aim for meaningful coverage, not 100% for the sake of it, but ensure critical paths and error handling are tested.

## 9. Fast and Focused Tests
- Keep unit tests fast and focused on a single unit of code.
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
- Fail tests early and loudly using `t.Fatal` or `t.Fatalf` when a condition prevents further meaningful testing within that scope. Use `t.Error` or `t.Errorf` to report failures but allow the test function (or other subtests) to continue.
- Provide actionable messages to speed up debugging.

## 13. Documentation
- Comment complex test cases.
- Explain "why" the test exists if it's not obvious.

---

## 14. Dependency Management for Testing (New Section)

- **Verify Dependency Versions:** Before adding or updating a dependency in `go.mod` or using `go get <module>@<version>`, confirm that the specified version tag (e.g., `v2.1.0`) actually exists in the module's repository. Do not assume or guess versions.
- **Synchronize Dependencies:** After adding new imports (especially from external libraries needed for mocks or tests) or modifying `go.mod`, **always** run `go mod tidy` and ensure it completes without errors. This updates `go.mod` and `go.sum` and downloads necessary modules.
- **Resolve Module Errors First:** Errors like `unknown revision`, `missing metadata`, or `missing go.sum entry` during `go mod tidy`, `go get`, or compilation indicate problems with dependency resolution. Fix these module-related issues *before* debugging compilation errors like `undefined: <Type>`. Compilation often fails simply because the required packages could not be loaded.
- **Interface Signature Accuracy:** When creating interfaces to abstract external dependencies (see Point 6 & 7), meticulously copy the exact method signatures from the library version you are using. Mismatched signatures (включая типы аргументов и возвращаемых значений) will prevent your code (and mocks) from implementing the interface correctly.

## 15. Aligning Mock Data and Expected Results (New Section)

- **Trace Data Flow:** При написании тестов с моками, четко проследите, как **тестируемый код** обрабатывает данные, возвращаемые моком.
- **Calculate Expected Results:** Ожидаемые результаты (`expected`) в ваших утверждениях (`assert.Equal`, `if actual != expected`) должны быть вычислены **точно так же**, как их вычисляет тестируемый код на основе предоставленных моком данных (`mockInput`).
  - **Учитывайте Преобразования:** Обращайте внимание на любые преобразования типов (например, биты в байты), расчеты, форматирование строк (`fmt.Sprintf` с определенными глаголами) и маппинг полей, которые выполняет ваш код.
  - **Пример:** Если ваш код получает `cunits.Bits` от мока, делит на 8 для получения байт, а затем форматирует с `%.1f`, то ваш `expected` результат должен быть строкой, полученной точно таким же образом из исходного значения в битах, заданного в моке.
- **Согласованность:** Несоответствие между логикой вычисления `expected` и логикой тестируемого кода — частая причина ложноотрицательных тестов.

Adopting these best practices will keep your Go test suite clean, maintainable, and effective!
