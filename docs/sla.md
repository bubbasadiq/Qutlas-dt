# Service Level Agreement (SLA)

## Platform Availability

### Uptime Targets

| Tier     | Availability Target | Monthly Downtime Allowance |
|----------|---------------------|---------------------------|
| Standard | 99.0%               | 43.2 minutes              |
| Premium  | 99.9%               | 4.32 minutes              |
| Enterprise| 99.95%              | 2.16 minutes              |

### Measurement
- Measured from Qutlas API endpoints
- Excludes scheduled maintenance (4 hours/month)
- Excludes customer-caused outages

### Remedies for Missed SLA

If Qutlas fails to meet SLA targets:
- **99-99.9%**: 5% monthly service credit
- **98-99%**: 10% monthly service credit
- **95-98%**: 25% monthly service credit
- **<95%**: 100% monthly service credit + 30-day review

Service credits issued as account credits.

## Job Processing SLA

### Dispatch Latency
- Job routed to hub within **300ms** (p50)
- 99% of jobs routed within **2 seconds** (p99)

### Toolpath Generation
- Standard parts: <2 seconds (p50)
- Complex parts: <20 seconds (p95)

### Hub Response Time
- Hub must accept/reject job within **10 minutes**
- If no response, job automatically re-routed

## Data Retention & Privacy

- Customer projects retained for **90 days** after completion
- Enterprise customers may extend to **2 years** (custom agreement)
- Automatic deletion after retention period expires
- Backups retained for **30 days** for recovery purposes

## Liability

Qutlas's total liability under this agreement is limited to:
- **Standard Tier**: Customer's monthly subscription fee
- **Premium Tier**: 3x monthly subscription fee
- **Enterprise**: Amount specified in custom agreement

Qutlas is not liable for:
- Indirect or consequential damages
- Lost profits, revenue, or data
- Third-party claims

---

*Effective: January 1, 2025*
*Next Review: December 31, 2025*
