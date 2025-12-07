# Qutlas Deployment Guide

## Prerequisites

- AWS Account with appropriate permissions
- Terraform >= 1.0
- kubectl >= 1.29
- Docker
- Helm >= 3.0

## Local Development Setup

\`\`\`bash
# Clone repo
git clone <repo>
cd qutlas

# Install dependencies
./scripts/setup.sh

# Start dev services
npm run dev:backend &
npm run dev:frontend &
npm run dev:wasm:watch &

# Start hub agent (optional)
npm run dev:hub-agent &
\`\`\`

## AWS Deployment

### 1. Initialize Infrastructure

\`\`\`bash
cd infra/terraform

# Configure AWS credentials
export AWS_PROFILE=default
export AWS_REGION=us-east-1

# Create environment
terraform init
terraform plan -var-file="environments/prod.tfvars"
terraform apply -var-file="environments/prod.tfvars"
\`\`\`

### 2. Setup Database

\`\`\`bash
# Get RDS endpoint
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)

# Run migrations
psql -h $RDS_ENDPOINT -U postgres -d qutlas < backend/migrations/001_init_catalog.sql
psql -h $RDS_ENDPOINT -U postgres -d qutlas < backend/migrations/002_sample_data.sql
\`\`\`

### 3. Deploy Services

\`\`\`bash
cd ../..

# Build and push Docker images
./scripts/build-and-push.sh prod

# Deploy via Helm
helm upgrade --install qutlas-backend ./infra/helm/qutlas-backend \
  --namespace qutlas --create-namespace \
  --values infra/helm/values-prod.yaml

helm upgrade --install qutlas-frontend ./infra/helm/qutlas-frontend \
  --namespace qutlas \
  --values infra/helm/values-prod.yaml
\`\`\`

### 4. Verify Deployment

\`\`\`bash
# Check pod status
kubectl get pods -n qutlas

# View logs
kubectl logs -n qutlas deployment/qutlas-backend

# Run health check
kubectl exec -n qutlas $(kubectl get pod -n qutlas -l app=qutlas-backend -o jsonpath='{.items[0].metadata.name}') -- curl localhost:3001/health
\`\`\`

## Hub Registration

### Prerequisites

- Docker installed on hub premises
- Internet connectivity
- Machine specifications documented

### Deployment Steps

\`\`\`bash
# Pull hub agent image
docker pull $ECR_REGISTRY/qutlas-hub-agent:latest

# Configure hub credentials
export HUB_ID="hub-$(date +%s)"
export GRPC_URL="backend-api.qutlas.com:50051"

# Run hub agent
docker run -d \
  --name qutlas-hub-agent \
  -e HUB_ID=$HUB_ID \
  -e GRPC_URL=$GRPC_URL \
  --restart unless-stopped \
  $ECR_REGISTRY/qutlas-hub-agent:latest
\`\`\`

## Monitoring & Alerts

### Setup CloudWatch Dashboards

\`\`\`bash
./scripts/setup-monitoring.sh
\`\`\`

### View Metrics

- Dashboard: https://console.aws.amazon.com/cloudwatch/
- EKS Cluster Health: Check ECS monitoring for node status
- Database: RDS Enhanced Monitoring
- API: CloudWatch Logs + X-Ray tracing

## Scaling

### Horizontal Pod Autoscaling

HPA is configured in `infra/helm/qutlas-backend/templates/hpa.yaml`. Scales 2–10 replicas based on CPU (70%) and memory (80%).

### Database Scaling

For production: upgrade RDS to `db.r6i.xlarge` or enable read replicas for read-heavy workloads.

## Troubleshooting

### Pod Crashes

\`\`\`bash
kubectl describe pod <pod-name> -n qutlas
kubectl logs <pod-name> -n qutlas --previous
\`\`\`

### Database Connection Issues

\`\`\`bash
# Test connectivity
psql -h $RDS_ENDPOINT -U postgres -d qutlas -c "SELECT version();"
\`\`\`

### gRPC Communication Issues

Verify hub agent can reach backend:

\`\`\`bash
grpcurl -plaintext backend-api.qutlas.com:50051 list
\`\`\`

## Rollback

\`\`\`bash
helm rollback qutlas-backend 1 -n qutlas
kubectl rollout undo deployment/qutlas-backend -n qutlas
\`\`\`

## Cost Estimation (Monthly)

- EKS: ~$150 (3 t3.large nodes)
- RDS: ~$100 (db.t3.medium)
- ElastiCache: ~$30
- S3: ~$20 (100 GB)
- Data Transfer: ~$10–50
- **Total: ~$300–400/month**
