# RemindU

**Developer setup guide**

![Bun](https://img.shields.io/badge/runtime-Bun-black?logo=bun&logoColor=white)
![Expo](https://img.shields.io/badge/framework-Expo-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-61DAFB?logo=react&logoColor=black)

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Running the App](#running-the-app)
- [Managing Packages](#managing-packages)
- [Claude Code Setup](#claude-code-setup)
- [Command Reference](#command-reference)

---

## Prerequisites

This project uses **Bun** as its package manager and script runner instead of npm.

| Tool    | Purpose                          | Install                                                        |
| ------- | -------------------------------- | -------------------------------------------------------------- |
| **Bun** | Package manager, faster installs | [bun.com/docs/installation](https://bun.com/docs/installation) |

> [!NOTE]
> Bun replaces `npm install` / `package-lock.json` with `bun install` / `bun.lock`. Do not use npm or yarn in this repo, as mixed lockfiles cause dependency drift.

> [!IMPORTANT]
> Expo's CLI and Metro bundler still run on Node.js under the hood. Keep a current Node.js LTS installed alongside Bun.

---

## Getting Started

**1. Install Bun** for your operating system using the link above.

**2. Install dependencies.** This creates the `node_modules` folder and a `bun.lock` file.

```shell
bun install
```

---

## Running the App

Start the Expo development server:

```shell
bun expo start
```

Once the server is running, open the app on a device or emulator from the terminal prompt:

| Key | Action                                      |
| --- | ------------------------------------------- |
| `r` | Reload the app                              |
| `j` | Open the debugger                           |

---

## Managing Packages

Always use Bun to add or remove dependencies.

```shell
# Add a package
bun add <package-name>

# Add a dev dependency
bun add -d <package-name>

# Remove a package
bun remove <package-name>
```

---

## Claude Code Setup

If you use **Claude Code** for development, install the Expo plugin. It gives Claude access to Expo's official documentation.

```shell
claude plugin install expo@claude-plugins-official
```

---

## Command Reference

| Task                                | Command                                              |
| ----------------------------------- | ---------------------------------------------------- |
| Install dependencies                | `bun install`                                        |
| Start Expo dev server               | `bun expo start`                                     |
| Add a package                       | `bun add <package-name>`                             |
| Add a dev dependency                | `bun add -d <package-name>`                          |
| Remove a package                    | `bun remove <package-name>`                          |
| Install Expo plugin for Claude Code | `claude plugin install expo@claude-plugins-official` |
