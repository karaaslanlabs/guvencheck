# GüvenCheck

GüvenCheck is a Türkiye-first digital risk decision-support product from [Karaaslan Labs](https://github.com/karaaslanlabs).

It helps people inspect suspicious digital content — including messages, links/web pages, screenshots, and images — and turns the analysis into a simple decision flow:

**risk → why → what to do next**

GüvenCheck is designed to support safer decisions, not to provide an absolute guarantee that content is safe or malicious.

## Current status

The product is in active validation and closed-test development across web and mobile.

Current work includes decision-support, feedback/telemetry, privacy-aware analysis reuse, economic safety controls, and web/mobile parity. Production, distribution, monetization, and broader product changes remain separately gated.

## Repository structure

```text
apps/
  web/       Next.js web app, API routes, telemetry, admin/evidence tooling
  mobile/    Expo / React Native mobile app with share-intent flows
```

Implementation-specific documentation:

- [Web app](apps/web/README.md)
- [Historical product notes](apps/web/PRODUCT.md)
- [Mobile app](apps/mobile/README.md)
- [Mobile architecture](apps/mobile/MOBILE_ARCHITECTURE.md)

## Core workflow

1. The user submits suspicious digital content.
2. GüvenCheck evaluates relevant risk signals.
3. The result explains the risk in plain language.
4. The user receives concrete next-step guidance.

## Technology

### Web

- Next.js
- React
- TypeScript
- Server-side analysis API
- Product telemetry and admin/evidence tooling

### Mobile

- Expo
- React Native
- Expo Router
- Android/iOS share-target flows
- Shared GüvenCheck analysis backend

## Security boundary

OpenAI/API provider credentials are not shipped in the mobile client.

The mobile app sends analysis requests to the GüvenCheck backend. Shared payloads and images are handled as part of the analysis flow rather than embedding provider credentials in the client.

## Development

### Web

```bash
cd apps/web
npm install
npm run dev
```

Useful checks:

```bash
npm run typecheck
npm test
npm run build
```

### Mobile

```bash
cd apps/mobile
npm install
npm run doctor
npm run typecheck
```

Native share-target behavior requires a development build; it is not fully testable in Expo Go.

## Source availability

This repository is publicly visible. No open-source license is currently declared in the repository.

## Karaaslan Labs

Karaaslan Labs builds useful, trustworthy, and scalable digital products, using AI and automation as leverage rather than as a fixed product category.

- Website: https://karaaslanlabs.com
- GitHub: https://github.com/karaaslanlabs
- Contact: contact@karaaslanlabs.com
