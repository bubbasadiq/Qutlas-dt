# Qutlas Infrastructure as Code
# AWS EKS cluster, RDS PostgreSQL, S3, and supporting services

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC and Networking
resource "aws_vpc" "qutlas" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "qutlas-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.qutlas.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "qutlas-public-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.qutlas.id
  cidr_block        = "10.0.${count.index + 101}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "qutlas-private-${count.index + 1}"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# Internet Gateway
resource "aws_internet_gateway" "qutlas" {
  vpc_id = aws_vpc.qutlas.id

  tags = {
    Name = "qutlas-igw"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.qutlas.id

  route {
    cidr_block      = "0.0.0.0/0"
    gateway_id      = aws_internet_gateway.qutlas.id
  }

  tags = {
    Name = "qutlas-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# EKS Cluster
resource "aws_eks_cluster" "qutlas" {
  name            = "qutlas-${var.environment}"
  version         = var.kubernetes_version
  role_arn        = aws_iam_role.eks_cluster.arn

  vpc_config {
    subnet_ids = concat(aws_subnet.public[*].id, aws_subnet.private[*].id)
  }

  tags = {
    Name = "qutlas-eks"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]
}

# EKS Node Group
resource "aws_eks_node_group" "qutlas" {
  cluster_name    = aws_eks_cluster.qutlas.name
  node_group_name = "qutlas-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = var.desired_capacity
    max_size     = var.max_capacity
    min_size     = var.min_capacity
  }

  instance_types = [var.node_instance_type]

  tags = {
    Name = "qutlas-node-group"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
  ]
}

# RDS PostgreSQL
resource "aws_db_subnet_group" "qutlas" {
  name       = "qutlas-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "qutlas-db-subnet-group"
  }
}

resource "aws_db_instance" "qutlas" {
  identifier     = "qutlas-${var.environment}"
  engine         = "postgres"
  engine_version = var.postgres_version
  instance_class = var.db_instance_class

  allocated_storage     = var.db_storage_gb
  storage_type          = "gp3"
  storage_encrypted     = true
  multi_az              = var.environment == "prod"

  db_name  = "qutlas"
  username = var.db_username
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.qutlas.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  skip_final_snapshot = var.environment != "prod"

  tags = {
    Name = "qutlas-rds"
  }
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_security_group" "rds" {
  name        = "qutlas-rds-sg"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.qutlas.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "eks_nodes" {
  name        = "qutlas-eks-nodes-sg"
  description = "Security group for EKS nodes"
  vpc_id      = aws_vpc.qutlas.id

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# S3 Bucket for Assets
resource "aws_s3_bucket" "assets" {
  bucket = "qutlas-assets-${var.environment}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "qutlas-assets"
  }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CloudFront Distribution for Assets
resource "aws_cloudfront_distribution" "assets" {
  enabled = true

  origin {
    domain_name = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id   = "S3"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.assets.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name = "qutlas-assets-cdn"
  }
}

resource "aws_cloudfront_origin_access_identity" "assets" {
  comment = "OAI for Qutlas S3 bucket"
}

# Data sources and variables
data "aws_caller_identity" "current" {}

# IAM Roles and Policies
resource "aws_iam_role" "eks_cluster" {
  name = "qutlas-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role" "eks_nodes" {
  name = "qutlas-eks-nodes-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_nodes.name
}

output "eks_cluster_endpoint" {
  value       = aws_eks_cluster.qutlas.endpoint
  description = "EKS cluster endpoint"
}

output "eks_cluster_name" {
  value       = aws_eks_cluster.qutlas.name
  description = "EKS cluster name"
}

output "rds_endpoint" {
  value       = aws_db_instance.qutlas.endpoint
  description = "RDS database endpoint"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.assets.id
  description = "S3 assets bucket"
}

output "cloudfront_domain" {
  value       = aws_cloudfront_distribution.assets.domain_name
  description = "CloudFront distribution domain"
}
