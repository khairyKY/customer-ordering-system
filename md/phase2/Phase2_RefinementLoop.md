# Phase 2 – The Refinement Loop (QA Audit Log)

## Overview

This document audits vague, non-measurable adjectives found in early requirement drafts and refines them into precise, enforceable technical metrics. Each entry follows the **Vague → Ambiguity → Measurable** refinement pipeline.

---

## QA Audit Table

| Vague Adjective        | Technical Ambiguity                                        | Measurable Technical Metric *(A-Tier)*                                                                                          |
|------------------------|------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| **"Fast Processing"**  | Subjective to user perception and network jitter.          | **Latency Target:** API response time (TTFB) must be `< 200ms` for **95% of requests**.                                        |
| **"Secure Transactions"** | Doesn't specify encryption depth or protocol.           | **Crypto Standard:** All data-in-transit must use `TLS 1.3` with `AES-256-GCM`. PII must be redacted in all logs.              |
| **"Reliable Gateway"** | No definition of uptime or failure-handling strategy.      | **Availability:** `99.9%` uptime SLA. Implement a **Circuit Breaker** with **3 retries** (exponential backoff) before failing.  |

---

## Refinement Breakdown

### 1. "Fast Processing" → Latency Target

| Attribute        | Detail                                      |
|------------------|---------------------------------------------|
| Original Term    | *"Fast Processing"*                         |
| Ambiguity        | Subjective; varies by user device and network conditions |
| Metric           | Time to First Byte (TTFB)                   |
| Target           | `< 200ms`                                   |
| Percentile       | 95th percentile of all requests             |
| Enforcement      | APM tooling (e.g., Datadog, New Relic)      |

---

### 2. "Secure Transactions" → Crypto Standard

| Attribute        | Detail                                      |
|------------------|---------------------------------------------|
| Original Term    | *"Secure Transactions"*                     |
| Ambiguity        | No specified protocol version or cipher     |
| Transport Layer  | `TLS 1.3` mandatory (TLS 1.2 deprecated)    |
| Cipher Suite     | `AES-256-GCM`                               |
| PII Handling     | All Personally Identifiable Information must be redacted from logs |
| Compliance Ref.  | PCI-DSS, aligned with PAY-01 (Secure Credential Input) |

---

### 3. "Reliable Gateway" → Availability SLA

| Attribute        | Detail                                            |
|------------------|---------------------------------------------------|
| Original Term    | *"Reliable Gateway"*                              |
| Ambiguity        | No uptime target or degradation strategy defined  |
| Uptime SLA       | `99.9%` (allows ~8.7 hours downtime/year)         |
| Failure Strategy | Circuit Breaker pattern                           |
| Retry Policy     | **3 retries** with **exponential backoff**        |
| Final Fallback   | Hard fail with user-facing error after 3rd retry  |

---

## Refinement Summary

| Vague Term             | Replaced By             | Key Value                        |
|------------------------|-------------------------|----------------------------------|
| "Fast Processing"      | Latency Target (TTFB)   | `< 200ms` @ P95                  |
| "Secure Transactions"  | Crypto Standard         | `TLS 1.3` + `AES-256-GCM`       |
| "Reliable Gateway"     | Availability SLA        | `99.9%` + Circuit Breaker (×3)   |

---

*Document scope: Payment Slice — Phase 2 QA Audit & Requirements Refinement*
