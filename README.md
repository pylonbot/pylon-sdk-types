# Pylon.bot

> **You write it. We run it.**
> Build and deploy Discord bots in minutes using our simple online studio.
> Forget about renting or maintaining servers. Use our simple JavaScript SDK to build your bots and we'll do the heavy lifting.

See our complete type documentation at https://pylon.bot/docs/reference

See our getting started guides and other examples at https://pylon.bot/docs

Get started today at https://pylon.bot

## Usage

These typings are published on npm. To get external intellisense and linting for Pylon, you're able to install and reference the types. Assuming that you've already run `npm init`, run:

```console
$ npm i --save-dev @pylonbot/runtime @pylonbot/runtime-discord
```

This will install the required type definitions. To tell TS that you want to use them, put the following triple-slash comments at the start of your `main.ts` file:

```ts
/// <reference types="@pylonbot/runtime" />
/// <reference types="@pylonbot/runtime-discord" />
```
