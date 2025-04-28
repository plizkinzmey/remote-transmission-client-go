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
- **Important:** When mocking external libraries or internal interfaces, ensure your mock interfaces and method implementations **exactly** match the method signatures of the library version specified in your `go.mod` or the interface definition.
  - **Verify All Types:** Тщательно проверяйте **все** типы в сигнатурах методов, включая стандартные (`int` vs `int64`), указатели (`*string`), **пользовательские типы** (например, `cunits.Bits` vs `int64`), и **типы возвращаемых значений** (включая ошибки). Неправильный тип в моке приведет к ошибкам компиляции или неверному поведению теста.
  - **Источник Правды:** Обращайтесь к исходному коду или документации используемой версии библиотеки или к определению интерфейса в вашем коде для получения точных сигнатур.
  - **Пример (testify/mock):**
    ```go
    // Interface
    type DataFetcher interface {
        Fetch(id string) (*domain.Data, error)
    }

    // Mock
    type MockDataFetcher struct {
        mock.Mock
    }

    // Ensure the mock method signature EXACTLY matches the interface
    func (m *MockDataFetcher) Fetch(id string) (*domain.Data, error) {
        args := m.Called(id)
        // Correctly handle potential nil pointer for the first return value
        var data *domain.Data
        if args.Get(0) != nil {
            data = args.Get(0).(*domain.Data)
        }
        // Correctly handle the error return value
        return data, args.Error(1)
    }

    // Usage in test
    mockFetcher := new(MockDataFetcher)
    expectedData := &domain.Data{Value: "test"}
    // Ensure the types passed to Return() match the return types of the interface method
    mockFetcher.On("Fetch", "test-id").Return(expectedData, nil) // Correct: (*domain.Data, error)

    // ❌ Incorrect: mockFetcher.On("Fetch", "test-id").Return("test", nil) // Wrong type for first arg
    // ❌ Incorrect: mockFetcher.On("Fetch", "test-id").Return(nil, "some error") // Wrong type for second arg
    ```

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

## 14. Dependency Management for Testing

- **Verify Dependency Versions:** Before adding or updating a dependency in `go.mod` or using `go get <module>@<version>`, confirm that the specified version tag (e.g., `v2.1.0`) actually exists in the module's repository. Do not assume or guess versions.
- **Synchronize Dependencies:** After adding new imports (especially from external libraries needed for mocks or tests) or modifying `go.mod`, **always** run `go mod tidy` and ensure it completes without errors. This updates `go.mod` and `go.sum` and downloads necessary modules.
- **Resolve Module Errors First:** Errors like `unknown revision`, `missing metadata`, or `missing go.sum entry` during `go mod tidy`, `go get`, or compilation indicate problems with dependency resolution. Fix these module-related issues *before* debugging compilation errors like `undefined: <Type>`. Compilation often fails simply because the required packages could not be loaded.
- **Interface Signature Accuracy:** When creating interfaces to abstract external dependencies (see Point 6 & 7), meticulously copy the exact method signatures from the library version you are using. Mismatched signatures (включая типы аргументов и возвращаемых значений) will prevent your code (and mocks) from implementing the interface correctly.

## 15. Aligning Mock Data and Expected Results

- **Trace Data Flow:** При написании тестов с моками, четко проследите, как **тестируемый код** обрабатывает данные, возвращаемые моком.
- **Calculate Expected Results:** Ожидаемые результаты (`expected`) в ваших утверждениях (`assert.Equal`, `if actual != expected`) должны быть вычислены **точно так же**, как их вычисляет тестируемый код на основе предоставленных моком данных (`mockInput`).
  - **Учитывайте Преобразования:** Обращайте внимание на любые преобразования типов (например, биты в байты, `int64` в `cunits.Bits`), расчеты, форматирование строк (`fmt.Sprintf` с определенными глаголами) и маппинг полей, которые выполняет ваш код.
  - **Пример:** Если ваш код получает `cunits.Bits(1024 * 8)` от мока, делит на 8 для получения байт (1024), а затем форматирует с `fmt.Sprintf("%.1f KB", bytes / 1024.0)`, то ваш `expected` результат должен быть строкой `"1.0 KB"`, полученной точно таким же образом из исходного значения в битах, заданного в моке.
- **Согласованность:** Несоответствие между логикой вычисления `expected` и логикой тестируемого кода — частая причина ложноотрицательных тестов. Тщательно проверяйте единицы измерения и преобразования.

## 16. Патчинг стандартных функций в тестах

В Go нельзя напрямую заменить (monkey patch) стандартные функции типа `os.ReadFile` или `runtime.Caller`. Используйте эти подходы для тестирования кода, зависящего от таких функций:

- **Оберните вызовы в своем коде:** Создайте переменную-функцию в пакете и используйте её вместо прямого вызова:
  ```go
  // В основном коде
  var osReadFileFunc = os.ReadFile  // По умолчанию использует стандартную функцию
  
  func MyFunc() {
      data, err := osReadFileFunc("config.json")  // Используем переменную вместо прямого вызова
      // ...
  }
  
  // В тесте
  func TestMyFunc(t *testing.T) {
      origFunc := osReadFileFunc
      defer func() { osReadFileFunc = origFunc }()  // Восстанавливаем после теста
      
      osReadFileFunc = func(name string) ([]byte, error) {
          return []byte(`{"mocked":"data"}`), nil
      }
      
      // Теперь MyFunc будет использовать мок-функцию
      // ...
  }
  ```

- **Создайте тестовую обертку:** Если изменение основного кода нежелательно, создайте тестовую обертку, использующую локальные переменные-функции:
  ```go
  // В тестовом файле
  var testOsReadFile = os.ReadFile
  
  func setupMocks(t *testing.T) *mockFileSystem {
      mockFS := new(mockFileSystem)
      origReadFile := testOsReadFile
      
      testOsReadFile = func(name string) ([]byte, error) {
          return mockFS.ReadFile(name)
      }
      
      t.Cleanup(func() {
          testOsReadFile = origReadFile
      })
      
      return mockFS
  }
  
  // Тестовая версия оригинальной функции, используемой в коде
  func testLoadConfigFile(path string) error {
      data, err := testOsReadFile(path)  // Используем переменную вместо прямого вызова
      // ...
  }
  
  func TestLoadConfig(t *testing.T) {
      mockFS := setupMocks(t)
      mockFS.On("ReadFile", "config.json").Return([]byte(`{"mocked":"data"}`), nil)
      
      // Используем тестовую обертку вместо реальной функции
      err := testLoadConfigFile("config.json")
      // ...
  }
  ```

- **Используйте готовые библиотеки для патчинга:** Для сложных случаев рассмотрите специализированные библиотеки:
  - [github.com/undefinedlabs/go-mpatch](https://github.com/undefinedlabs/go-mpatch)
  - [github.com/bouk/monkey](https://github.com/bouk/monkey)

  **Предупреждение:** Библиотеки monkey patching используют небезопасные приемы и могут вызвать проблемы на некоторых архитектурах или версиях Go.

- **Предпочитайте внедрение зависимостей:** Лучшее решение — переработка кода для использования интерфейсов и внедрения зависимостей, что делает код более тестируемым изначально.

---

## 17. Testing Error Handling

- **Check for Specific Errors:** When testing functions that are expected to return specific, predefined errors (like `ErrConfigNotInited`), use `errors.Is()` for comparison instead of checking the error message string. This makes tests more robust against changes in error messages.
  ```go
  // service.go
  var ErrResourceNotFound = errors.New("resource not found")
  func GetResource(id string) error {
      if id == "unknown" {
          return ErrResourceNotFound
      }
      // ...
      return nil
  }

  // service_test.go
  func TestGetResource_NotFound(t *testing.T) {
      err := GetResource("unknown")
      assert.Error(t, err) // Check that an error occurred
      assert.True(t, errors.Is(err, ErrResourceNotFound), "Expected ErrResourceNotFound") // Verify it's the specific error

      // ❌ Avoid: assert.Equal(t, "resource not found", err.Error())
  }
  ```
- **Check for Wrapped Errors:** If your code wraps errors to add context, use `errors.Is()` to check if a specific error exists anywhere in the error chain. Use `errors.As()` if you need to access the underlying error of a specific type.
  ```go
  // service.go
  var ErrUpstreamUnavailable = errors.New("upstream service unavailable")
  type NetworkError struct { Code int }
  func (e *NetworkError) Error() string { return fmt.Sprintf("network error: %d", e.Code) }

  func DoSomething() error {
      err := callUpstream() // Returns *NetworkError{Code: 503}
      if err != nil {
          // Wrap the original error
          return fmt.Errorf("failed during DoSomething: %w", ErrUpstreamUnavailable)
      }
      return nil
  }

  // service_test.go
  func TestDoSomething_UpstreamError(t *testing.T) {
      // Assume callUpstream is mocked to return ErrUpstreamUnavailable
      err := DoSomething()
      assert.Error(t, err)
      // Check if ErrUpstreamUnavailable is in the chain
      assert.True(t, errors.Is(err, ErrUpstreamUnavailable), "Expected wrapped ErrUpstreamUnavailable")

      // If you needed to check the NetworkError code (assuming it was wrapped instead)
      // var netErr *NetworkError
      // assert.True(t, errors.As(err, &netErr), "Expected wrapped NetworkError")
      // assert.Equal(t, 503, netErr.Code)
  }
  ```
- **Test Error Message Content (Sparingly):** Only test the exact error message string (`err.Error()`) if the specific message format is part of the function's contract (e.g., for user-facing errors). Prefer `errors.Is` for internal error checking.

Adopting these best practices will keep your Go test suite clean, maintainable, and effective!
