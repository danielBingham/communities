locals {
  tags = {
    Application = "${var.application}"
    Environment = "${var.environment}"
    Service = "${var.service}"
    Layer = "storage"
  }
}


resource "aws_s3_bucket" "this" {
  bucket = "${var.application}-${var.environment}-${var.service}"

  tags = merge(
    local.tags,
    {
      Name = "${var.application}-${var.environment}-${var.service}-bucket"
      Resource = "s3.aws_s3_bucket.this"
    }
  )
}

resource "aws_s3_bucket_cors_configuration" "this" {
  bucket = aws_s3_bucket.this.bucket

  cors_rule {

    allowed_headers = ["*"]
    allowed_methods = ["HEAD", "GET"]
    //allowed_origins = ["https://localhost:3000", "https://localhost", "capacitor://localhost"]
    allowed_origins = ["*"] 
    expose_headers = []
  }
}
