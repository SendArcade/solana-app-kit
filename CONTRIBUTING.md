```md
# Contributing to Solana Social Starter

We love your input! We want to make contributing to **Solana Social Starter** as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

> **Important**: **We are currently only accepting _module_ contributions**. See [Acceptable Contributions](#acceptable-contributions) below for details.

---

## Table of Contents

- [Development Process](#development-process)
- [Acceptable Contributions](#acceptable-contributions)
- [Project Structure and Module Organization](#project-structure-and-module-organization)
- [Code Style Guidelines](#code-style-guidelines)
  - [1. TypeScript](#1-typescript)
  - [2. React Components](#2-react-components)
  - [3. File Organization](#3-file-organization)
  - [4. Documentation](#4-documentation)
  - [5. Testing](#5-testing)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [License](#license)

---

## Development Process

We use GitHub to:
- **Host code**
- **Track issues** and feature requests
- **Accept pull requests** from the community

### Steps to Contribute
1. **Fork** the repository and create your feature branch from `main`.
2. **Add** your module code (see [Acceptable Contributions](#acceptable-contributions) and [Project Structure and Module Organization](#project-structure-and-module-organization)).
3. **Add tests** if you've added or changed functionality that needs verification.
4. **Lint your code** and ensure the test suite passes.
5. **Document** any new APIs, components, or files.
6. **Open a Pull Request** for review.

We strive to keep a high bar for code quality and reusability, especially given that **Solana Social Starter** aims to be a plug-and-play library for React Native and web3 integrations. 

---

## Acceptable Contributions

> **Currently, we are only accepting _module_ contributions**. A **module** is a self-contained feature set that follows our structure guidelines. Specifically, your contribution should be:

- Placed in **`screens/common/<module_folder>`** if it involves new user-facing flows or sample screens.
- Placed in **`src/components/<module_name>`** for reusable UI components.
- Placed in **`src/services/<module_name>`** for your module’s business logic or API calls.
- Placed in **`src/utils/<module_name>`** for any utility/helper functions the module requires.
- If the server side is needed:
  - **Controllers** go in `server/src/controllers`.
  - **Routes** go in `server/src/routes`.
  - **Business logic** (non-UI, purely server code) goes in `server/src/service`.
  - **Utils** go in `server/src/utils`.
- If Redux state is needed, update or add new slices in **`src/state/<feature>`**.

We do **not** accept random changes scattered around. All new contributions must be coherent, self-contained modules that align with the library’s goal: **“A React Native open source library for web3 integrations that is easily customizable and modular.”**

---

## Project Structure and Module Organization

**Key Folders**:
```
- android/            # React Native Android config
- ios/                # React Native iOS config
- server/             # Express.js server for optional APIs
  |- src/controllers/ # Server controllers
  |- src/routes/      # Express route definitions
  |- src/service/     # Business logic for server
  |- src/utils/       # Server-side utilities
- src/
  |- components/      # Reusable UI components
  |- services/        # Client-side business logic or API calls
  |- utils/           # Client-side utilities
  |- state/           # Redux slices & store config
  |- screens/         # Sample screens & flows
- docs/               # Documentation
- ...
```

### Creating a New Module
1. **Inside `screens/common/`** create a folder named after your module if you need to add example flows (e.g. `screens/common/myNewModule`).
2. **Inside `src/components/`** create a folder with the same name (e.g. `src/components/myNewModule`), containing your UI components.
3. **Inside `src/services/`** create `myNewModule` for any service or business logic if needed.
4. **Inside `src/utils/`** create `myNewModule` for any utility functions used by your module.
5. **If you need server routes** or business logic, place them respectively in `server/src/routes/myNewModule`, `server/src/controllers/myNewModuleController.ts`, etc.
6. **Write any Redux slice** in `src/state/<feature>` if the module needs custom Redux state.

Following this structure keeps the code base organized and the module self-contained.

---

## Code Style Guidelines

### 1. TypeScript
- Use **TypeScript** for all new files.
- **Type definitions**: define interfaces for component props, strongly type your functions, avoid `any` where possible.
- Use **meaningful names** for interfaces, types, and classes.
- Document your types with inline comments or TSDoc (JSDoc in `.ts`).

```typescript
// Good
interface Props {
  name: string;
  age?: number;
}

// Bad
const Component = (props: any) => {
  // ...
};
```

### 2. React Components
- Use **functional components** with hooks.
- Components must be **reusable, customizable, and modular** (plug-and-play).
- Always create a **separate styles file** in the same folder. Never inline or place styles in the main component file. For example:
  - `MyComponent.tsx` and `MyComponent.style.ts`
- Provide **style overrides** to the user. For example, allow passing `style` or `containerStyle` or `styleOverrides` to customize your component's styles.

```typescript
// Good
const MyButton: React.FC<MyButtonProps> = ({ onPress, label, styleOverrides }) => {
  const mergedStyles = { ...defaultStyles, ...styleOverrides };
  return (
    <TouchableOpacity onPress={onPress} style={mergedStyles.button}>
      <Text>{label}</Text>
    </TouchableOpacity>
  );
};

// Bad
// - Styles are inline
// - No user overrides
function MyButton(props) {
  return <TouchableOpacity style={{ padding: 10, backgroundColor: 'blue' }} />;
}
```

### 3. File Organization
- **One component per file** named in PascalCase.
- **Styles** in a separate file named `ComponentName.style.ts`.
- **Types** in `ComponentName.types.ts` if needed.
- **Ensure** each module is in its own folder with a consistent structure.

```bash
src/components/MyModule
 ├─ MyModuleMain.tsx
 ├─ MyModuleMain.style.ts
 └─ MyModuleSubComponent/
     ├─ MyModuleSubComponent.tsx
     ├─ MyModuleSubComponent.style.ts
     └─ MyModuleSubComponent.types.ts
```

### 4. Documentation
- Use **JSDoc** or TSDoc for each component, function, and major interface.
- Include **usage examples**.
- Explain **props** and **return** types.
- Provide **implementation notes** or **edge-case warnings**.

```typescript
/**
 * A reusable button component that supports custom styling
 * @component
 * @example
 * ```tsx
 * <MyButton onPress={handlePress} label="Click Me" styleOverrides={myStyles} />
 * ```
 */
```

### 5. Testing
- Write **unit tests** for all new functionality.
- Use **React Testing Library** (preferred) or similar for component tests.
- **Mock external dependencies** to keep tests focused.
- Test for **edge cases** and error states.

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import MyButton from './MyButton';

describe('MyButton', () => {
  it('should call onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<MyButton onPress={onPressMock} label="Tap" />);
    fireEvent.press(getByText('Tap'));
    expect(onPressMock).toHaveBeenCalled();
  });
});
```

---

## Pull Request Process
1. **Fork** the repo and create a branch from `main`.
2. **Implement** your module according to [Acceptable Contributions](#acceptable-contributions) and [Project Structure](#project-structure-and-module-organization).
3. **Add tests** if your changes introduce or modify behavior.
4. **Update** any relevant docs or README sections.
5. **Open a PR** describing your changes, referencing any issues it addresses.
6. **Wait** for at least one review from a maintainer. We’ll either request changes or merge.

---

## Issue Reporting

### Bug Reports
When filing a bug report, please detail:
1. **Version** of the library you’re using
2. **Steps** to reproduce the bug
3. **Expected** vs. **actual** results
4. Any **error messages** or logs

### Feature Requests
We welcome feature requests! Please detail:
1. A **clear description** of the feature
2. **Use cases** and benefits for developers
3. Potential **implementation** approach

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

If you have any questions or need clarification, feel free to open an issue or reach out to the maintainers. We appreciate every effort to improve **Solana Social Starter** and look forward to building a more robust community library together!
```
