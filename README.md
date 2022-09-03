<p align="center">
  <img src="https://raw.githubusercontent.com/micrajs/.github/latest/assets/micra-logo.png" />
</p>

<p align="center">
  <a href="https://github.com/micrajs/.github/blob/latest/SUPPORT.md">Support</a> •
  <a href="https://github.com/micrajs/.github/blob/latest/CONTRIBUTING.md">Contributing</a> •
  <a href="https://github.com/micrajs/.github/blob/latest/CODE_OF_CONDUCT.md">Code of Conduct</a>
</p>

<p align="center">
  <img alt="version" src="https://img.shields.io/npm/v/@micra/pipe?color=%23F3626C&logo=npm" />
  <img alt="issues" src="https://img.shields.io/github/issues-search/micrajs/community?color=%23F3626C&label=Issues&logo=github&query=is%3Aopen%20label%3A%22Project%3A%20pipe%22" />
  <img alt="prs" src="https://img.shields.io/github/issues-pr/micrajs/pipe?color=%23F3626C&label=Pull%20requests&logo=github" />
</p>

<h1 align="center">@micra/pipe</h1>

## About

Generic middleware pipe.

## Installation

```bash
npm i @micra/pipe
yarn add @micra/pipe
pnpm i @micra/pipe
```

## Usage

This package exposes two functions: `pipe` and `pipeSync`. These functions create a connect-like middleware pipe based on the type of the last argument. Every argument before the last one is considered a middleware and will receive a `next` function as the last argument. The `next` function will call the next middleware in the pipe. The last argument is the handler function which will be called when all the middleware have been executed.

### pipe

#### Basic usage

```ts
import {pipe} from '@micra/pipe';

const middleware = pipe(
  async (_, next) => (await next()) * 2,
  async (_, next) => (await next()) + 1,
  async (value: number): Promise<number> => value - 1,
);

await middleware(1); // 2
```

#### Before middleware

You can create middleware that will be executed before the handler by writing logic before calling `next`.

```ts
import {pipe} from '@micra/pipe';

const middleware = pipe(
  async function Middleware(_, next) {
    console.log('before'); // this will be executed before the Handler
    return await next(); // 1
  },
  async function Handler() {
    return 1;
  },
);

await middleware(1); // 1
```

This can useful when you want to either validate the input or extend the input with additional data:

```ts
import {pipe} from '@micra/pipe';
import {getPostsFromUser} from './getPostsFromUser';
import {getSessionFromRequest} from './getSessionFromRequest';

const middleware = pipe(
  // Resolve the session from the request
  async function GetSession(context, next) {
    context.session = await getSessionFromRequest(context.request);
    return await next(null, context);
  },
  // Verify that the user is logged in
  async function isAuthenticated(context, next) {
    if (context.session != null) {
      return await next();
    }
    throw new Error('Not authenticated');
  },
  // Get the posts from the user
  async function Handler(context) {
    return await getPostsFromUser(context.session.userId);
  },
);
```

#### After middleware

You can create middleware that will be executed after the handler by writing logic after calling `next`.

```ts
import {pipe} from '@micra/pipe';

const middleware = pipe(
  async function Middleware(_, next) {
    const value = await next(); // 1
    console.log('after'); // this will be executed after the Handler
    return value;
  },
  async function Handler() {
    return 1;
  },
);

await middleware(1); // 1
```

This can useful when you want to either validate the output or extend the output with additional data:

```ts
import {pipe} from '@micra/pipe';
import {Document} from './Document';
import {getPosts} from './getPosts';
import {getViewFromResponse} from './getViewFromResponse';
import {isHtml} from './isHtml';
import {render} from './render';
import {vite} from './vite';
import {wantsJson} from './wantsJson';
import {json, html, view} from './responses';

const middleware = pipe(
  // Run any Vite transformations on the resulting HTML
  async function TransformHTML(context, next) {
    const response = await next();

    return isHtml(response)
      ? html(
          await vite.transformIndexHtml(context.request.url, response),
          response,
        )
      : response;
  },
  // If the request wants JSON, return de posts props, otherwise return the full HTML
  async function MountDocumentOrProps(context, next) {
    const response = await next();
    const {Component, props} = getViewFromResponse(response);

    return wantsJson(context.request)
      ? json(props)
      : html(render(Document, null, render(Component, props));
  },
  // Get all the posts and the post component
  async function GetPosts(context) {
    const props = await getPosts();
    return view(Post, props);
  },
);
```

#### Error handling

You can stop the execution of the pipe by either throwing and error or by passing an error as the first argument to the `next` function:

```ts
import {pipe} from '@micra/pipe';

const throwError = pipe(
  async function Middleware(_, next) {
    throw new Error("Something wrong isn't right");
  },
  async function Handler() {
    // this will never be executed
  },
);

const passErrorToNextFunction = pipe(
  async function Middleware(_, next) {
    return await next(new Error("Something wrong isn't right"));
  },
  async function Handler() {
    // this will never be executed
  },
);
```

### pipeSync

All the same rules apply to `pipeSync` as to `pipe`, except that the middleware and handler functions are handled synchronously.

## Contributors

- [Olavo Amorim Santos](https://github.com/olavoasantos)
