resource "aws_eks_cluster" "qutlas" {
  name            = "qutlas-${var.environment}"
  role_arn        = aws_iam_role.eks_cluster_role.arn
  version         = "1.29"

  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  depends_on = [aws_iam_role_policy_attachment.eks_cluster_policy]
}

resource "aws_eks_node_group" "qutlas_nodes" {
  cluster_name    = aws_eks_cluster.qutlas.name
  node_group_name = "qutlas-nodes-${var.environment}"
  node_role_arn   = aws_iam_role.eks_node_role.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = var.node_desired_capacity
    max_size     = var.node_max_capacity
    min_size     = var.node_min_capacity
  }

  instance_types = ["t3.large", "t3.xlarge"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
  ]
}

resource "aws_db_instance" "postgres" {
  identifier           = "qutlas-db-${var.environment}"
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.t3.medium"
  allocated_storage    = 100
  storage_encrypted    = true
  multi_az             = var.environment == "prod"
  db_name              = "qutlas"
  username             = "postgres"
  password             = random_password.db_password.result
  skip_final_snapshot  = var.environment != "prod"

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.private.name

  tags = {
    Name = "qutlas-postgres-${var.environment}"
  }
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "qutlas-redis-${var.environment}"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = var.environment == "prod" ? 3 : 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379

  security_group_ids = [aws_security_group.redis.id]
  subnet_group_name  = aws_elasticache_subnet_group.private.name
}

resource "aws_s3_bucket" "assets" {
  bucket = "qutlas-assets-${var.environment}-${data.aws_caller_identity.current.account_id}"
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

output "eks_cluster_endpoint" {
  value = aws_eks_cluster.qutlas.endpoint
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}
