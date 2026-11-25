<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## MongoDB and environment requirements

The backend validates `MONGODB_URI`, `JWT_SECRET` (at least 32 characters),
`ADMIN_API_KEY`, and `STAFF_API_KEY` on startup. `PORT` defaults to `3000`.
Configure `MONGODB_URI` to connect to a replica set (including a single-node
replica set for local development); product/order writes use transactions.

## Active API behavior

All routes use the `/api` prefix. `main.ts` enables CORS for
`http://localhost:5173`, Helmet, and a global validation pipe that rejects
unknown DTO fields. The global roles guard accepts JWT bearer tokens and
legacy admin/staff API keys. Authentication returns top-level user fields and
`token`/`accessToken`; `GET /api/auth/me` returns the user directly.

Current route summary:

- `GET /api/branches` is public and returns active branches as an array, with
  their Mongo ObjectIds and optional `latitude`/`longitude`. Admins may request
  inactive branches with `?includeInactive=true`; branch managers receive only
  their assigned branch. `GET /api/branches/:id` remains staff-only. Admin
  creates with `POST /api/branches` and updates/deactivates with
  `PATCH /api/branches/:id` (`isActive`); create/update may include numeric
  `latitude` (-90 to 90) and `longitude` (-180 to 180).
- `GET /api/categories` is public and returns a raw array.
- `GET /api/products` and `GET /api/products/:id` are public but require a
  valid Mongo `branchId`. Product lists return `{ data, meta: { page, limit,
  total, totalPages } }`. Catalog fields are `name`, `sku`, `description`,
  `price`, and `categoryId`; branch stock is returned as `stock`. Sorting uses
  `newest`, `oldest`, `name_asc`, `name_desc`, `price_asc`, `price_desc`,
  `stock_asc`, and `stock_desc`.
- Admin creates products with `name`, `sku`, `price`, `categoryId`, `branchId`,
  and `stock`. Product updates/deletes and detail reads also require
  `branchId` as a query parameter. `PATCH /api/products/:id/stock` takes
  `{ "delta": <non-zero integer> }` and a `branchId` query parameter; it
  adjusts, rather than replaces, stock.
- `POST /api/orders` (customer only) accepts `{ branchId, items:
  [{ productId, quantity }] }`; the server computes prices and total. It does
  not accept or persist shipping-address or payment-method fields. Order lists
  return `{ data, meta }`. Status values are `pending`, `paid`, `shipped`,
  `delivered`, and `cancelled`; status updates require `{ branchId, status }`.
- Reviews use `GET /api/products/:id/reviews`, `POST
  /api/products/:id/reviews`, and `DELETE /api/reviews/:id`; list responses
  return `{ data, meta }`.
- Reports are available as separate endpoints:
  `/api/reports/overview`, `/low-stock`, `/top-selling`, `/daily-sales`,
  `/sales-by-category`, and `/recent-orders`. The overview includes
  `totalOrders`, `totalRevenue`, and `ordersByStatus`; other reports return
  endpoint-specific data rather than a single dashboard envelope.

Public users can discover active branches and select one before browsing
products. GPS-based nearest-branch selection uses optional branch coordinates;
branches without coordinates remain manually selectable. Public product reads
still require the selected branch's Mongo ObjectId.

Before deploying against existing data, build the project and run the backfill
once with `MONGODB_URI` set:

```powershell
npm run build
npm run migration:backfill-default-branch
```

The repeatable backfill creates the `main` / `Main Branch` branch, copies
existing product stock into its inventory records, assigns existing orders to
it, and then removes the old product-level stock field. Back up the database
first; do not start the application against legacy data before completing it.

### Known backend limitations

1. Checkout currently does not store shipping or payment details.
2. Reports are split across endpoint-specific responses; there is no
   branch-sales summary endpoint.
3. Product display assets and discount/branch-price fields are not part of the
   current product API model.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

To add it to this project, run this and approve the code it prints at [observe.nestjs.com/link](https://observe.nestjs.com/link) - signing up for free if you have no account:

```bash
$ npx @nestjs/observe link
```

It installs `@nestjs/observe`, wires it into `AppModule` and `main.ts`, and writes the app key and secret into `.env`, which every `nest start` script (`start`, `start:dev`, `start:debug`) then loads. In production, set `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment instead.

Or do it by hand:

```bash
$ npm install @nestjs/observe
```

Then follow the [setup guide](https://docs.nestjs.com/observability/sdk) - it takes a single import and an app key.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Store assistant

`POST /api/assistant/chat` (public, 30 requests per minute) answers shopper
questions in Arabic or English. Product facts, stock, categories and branches are
read from MongoDB; the endpoint works without any language model.

An Ollama server is optional and only used for free-form questions about one
product. Configure it with `OLLAMA_BASE_URL` (default `http://127.0.0.1:11434`)
and `OLLAMA_MODEL` (default `gemma3:1b`).

Run the frontend with `VITE_USE_MOCK=false` so the storefront and the assistant
show the same catalog.
