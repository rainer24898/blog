---
title: Syntax Jenkin File
author: rainer
date: 2023-07-28 1:26:00+0300
categories: [Linux, Linux Programming]
tags: [CI/CD]
math: true
mermaid: true
render_with_liquid: false
image:
    path: 
---

# Trình bày pipe line

Việc trình bày Pipeline code cũng có 2 cách từ đơn giản đến phức tạp như sau :

## Declarative Pipeline

Declarative Pipeline là một phần mở rộng của Jenkins Pipeline, một plugin của Jenkins, giúp tự động hóa quy trình triển khai phần mềm. Đây là một cấu trúc ngôn ngữ đơn giản để định nghĩa và quản lý các công việc trong quá trình tự động hóa (CI/CD).

VD:

```
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                // Lệnh để build ứng dụng
            }
        }
        stage('Test') {
            steps {
                // Lệnh để chạy test
            }
        }
        stage('Deploy') {
            steps {
                // Lệnh để triển khai ứng dụng
            }
        }
    }

    post {
        always {
            // Các bước thực hiện sau khi pipeline kết thúc
        }
    }
}
```

## Scripted Pipeline

Scripted Pipeline trong Jenkins là một phương pháp khác để xây dựng và quản lý các quy trình CI/CD (Continuous Integration/Continuous Deployment). Nó cung cấp một cách tiếp cận linh hoạt hơn so với Declarative Pipeline, sử dụng ngôn ngữ lập trình Groovy để xác định logic và quy trình công việc.

```
node {
    stage('Build') {
        // Lệnh để build ứng dụng
    }
    stage('Test') {
        // Lệnh để chạy test
    }
    stage('Deploy') {
        // Lệnh để triển khai ứng dụng
    }
}
```

So Sánh với Declarative Pipeline:

- Cú Pháp: Declarative Pipeline sử dụng cú pháp khai báo, trong khi Scripted Pipeline sử dụng cú pháp lập trình.
- Độ Linh Hoạt: Scripted Pipeline cung cấp độ linh hoạt cao hơn, nhưng cũng phức tạp hơn và yêu cầu hiểu biết lập trình.
- Thích Hợp: Declarative Pipeline thường được ưa chuộng cho các quy trình đơn giản và dễ quản lý, trong khi Scripted Pipeline phù hợp với những tình huống cần tùy chỉnh cao và logic phức tạp.
Tóm lại, Scripted Pipeline trong Jenkins là một công cụ mạnh mẽ cho phép tạo các quy trình CI/CD phức tạp và tùy chỉnh cao, nhưng đòi hỏi người dùng phải có kỹ năng lập trình và hiểu biết về ngôn ngữ Groovy.

## Lợi ích Jenkins Pipeline mang lại

Jenkins Pipeline mang lại nhiều lợi ích quan trọng trong quá trình tự động hóa và quản lý các quy trình phát triển phần mềm (CI/CD). Dưới đây là một số lợi ích chính:

### 1. Tự Động Hóa Quy Trình CI/CD
- **Tự động hóa toàn diện**: Jenkins Pipeline tự động hóa từ việc lấy mã nguồn, build, test, đến triển khai ứng dụng, giúp quy trình phát triển nhanh chóng và hiệu quả.
- **Giảm thiểu lỗi do con người**: Tự động hóa giảm thiểu lỗi do sự can thiệp của con người, đảm bảo quy trình được thực hiện nhất quán.

### 2. Quản Lý Quy Trình Linh Hoạt
- **Hỗ trợ cả Scripted và Declarative Pipelines**: Jenkins cung cấp hai cách tiếp cận (Scripted và Declarative), cho phép người dùng chọn lựa tùy theo nhu cầu và kỹ năng.
- **Tùy chỉnh cao**: Người dùng có thể tùy chỉnh pipeline để đáp ứng yêu cầu cụ thể của dự án hoặc tổ chức.

### 3. Tích Hợp Đa Dạng
- **Tích hợp với nhiều công cụ và dịch vụ**: Jenkins có khả năng tích hợp với nhiều công cụ như Git, Maven, Docker, và các dịch vụ như Slack, JIRA, giúp tạo ra một hệ thống tự động hóa mạnh mẽ.
- **Plugin phong phú**: Thư viện plugin đa dạng của Jenkins mở rộng khả năng của pipeline, từ việc tối ưu hóa quy trình đến việc tích hợp công nghệ mới.

### 4. Dễ Dàng Theo Dõi và Quản Lý
- **Giao diện người dùng trực quan**: Jenkins cung cấp giao diện trực quan để theo dõi tiến trình của pipeline, giúp dễ dàng phát hiện và xử lý sự cố.
- **Quản lý lịch sử build**: Lưu trữ lịch sử của các build giúp phân tích và so sánh các phiên bản.

### 5. Khả Năng Mở Rộng và Phân Phối
- **Hỗ trợ xây dựng pipeline phân tán**: Jenkins Pipeline hỗ trợ xây dựng và chạy pipeline trên nhiều máy chủ và môi trường.
- **Mở rộng quy mô dễ dàng**: Khi nhu cầu phát triển, Jenkins Pipeline có thể mở rộng để xử lý công việc với quy mô lớn hơn.

### 6. Cải Thiện Hiệu Suất và Tối Ưu Hóa Quy Trình
- **Rút ngắn chu kỳ phát triển**: Việc tự động hóa giúp rút ngắn thời gian từ khi bắt đầu phát triển đến khi triển khai ứng dụng.
- **Tối ưu hóa quy trình**: Phân tích và cải thiện liên tục quy trình làm việc dựa trên dữ liệu thu được từ các build.

Tóm lại, Jenkins Pipeline mang lại một giải pháp mạnh mẽ và linh hoạt cho quản lý và tự động hóa quy trình CI/CD, giúp các tổ chức phần mềm tăng cường hiệu suất, giảm thiểu rủi ro và đẩy
 nhanh quy trình phát triển sản phẩm.

