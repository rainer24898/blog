---
title: Tự động hóa việc triển khai và quản lý cơ sở hạ tầng điện toán đám mây  AWS CloudFormation.
author: rainer
date: 2023-07-21 1:26:00 +0300
categories: [Cloud, AWS Cloud]
tags: [AWS Cloud]
math: true
mermaid: true
render_with_liquid: false
---

# Tự động hóa việc triển khai và quản lý cơ sở hạ tầng điện toán đám mây  AWS CloudFormation.
## 1. Cloud formation là gì ?
AWS CloudFormation là một dịch vụ của Amazon Web Services (AWS) được sử dụng để tự động hóa việc triển khai và quản lý cơ sở hạ tầng điện toán đám mây. Nó cho phép bạn xác định cấu trúc và tài nguyên của một ứng dụng trong tệp cấu trúc mã (template) được viết bằng ngôn ngữ JSON hoặc YAML. Sau đó, CloudFormation sẽ triển khai và quản lý cơ sở hạ tầng tương ứng dựa trên template đó.

CloudFormation giúp đơn giản hóa quá trình triển khai và quản lý cơ sở hạ tầng điện toán đám mây, giúp tiết kiệm thời gian và giảm thiểu sai sót. Bằng cách xác định các tài nguyên và phụ thuộc giữa chúng trong template, bạn có thể triển khai và cấu hình tự động các tài nguyên như máy chủ ảo, mạng, cơ sở dữ liệu, dịch vụ và nhiều hơn nữa.
Một lợi ích khác của CloudFormation là khả năng quản lý và cập nhật cơ sở hạ tầng điện toán đám mây theo cách đồng nhất và nhất quán. Bằng cách chỉnh sửa template và triển khai lại, bạn có thể thực hiện các thay đổi cho cơ sở hạ tầng hiện có hoặc mở rộng nó một cách dễ dàng.

Tóm lại, AWS CloudFormation là một dịch vụ quan trọng trong việc tự động hóa việc triển khai và quản lý cơ sở hạ tầng điện toán đám mây trên AWS.

## 2. Các bước để xây dựng một template AWS CloudFormation.
Dưới đây là các bước tạo một template AWS CloudFormation cơ bản trong việc xây dựng một proxy server, các bước xây dựng một template có thể thêm hoặc bớt tuỳ thuộc vào mục đích của bạn:
- Tạo Amazon EC2 Instance cơ bản
- Cho phép các cổng SSH, HTTPS, HTTP và các port khác mà bạn mong muốn.
- Thiết lập key-pair và các Output cần thiết cho instance
- Thiết lập các chương trình sẽ chạy sau khi khởi động máy
### 2.1. Tạo Amazon EC2 Instance cơ bản.
Đầu tiên chúng ta sẽ tạo một EC2 instance cơ bản với CloudFormation bằng ngôn ngữ `yaml`.

```
AWSTemplateFormatVersion: 2010-09-09
Description: Build a webapp stack with CloudFormation

Resources:
  WebAppInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-002843b0a9e09324a
      InstanceType: t2.micro
```

Trong đó :
- `ImageId`: là mã hệ điều hành mà bạn muốn cài cho instance ( lưu ý cùng 1 loại hệ điều hành nhưng mỗi khi vực sẽ có mã `ImageId` riêng)
- `InstanceType`: Cấu hình phần cứng của instance mà bạn muốn sửa dụng.
### 2.2.  Cho phép các cổng SSH, HTTPS, HTTP hoặc các cổng khác.
Thêm và security group các cổng: port 22 cho SSH, port 80 và 443 cho HTTP và HTTPS, port 2498 cho proxyserver ( có thể thay đổi theo port mà proxyserver thiết lập).

```
AWSTemplateFormatVersion: 2010-09-09
Description: Build a webapp stack with CloudFormation

Resources:
  WebAppInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-002843b0a9e09324a
      InstanceType: t2.micro
      SecurityGroupIds:
        - !Ref WebAppSecurityGroup
  WebAppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Join ["-", [webapp-security-group, dev]]
      GroupDescription: "Allow HTTP/HTTPS and SSH inbound and outbound traffic"
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 2498
          ToPort: 2498
          CidrIp: 0.0.0.0/0
```

### 2.3. Thiết lập key-pair và các Output cần thiết cho instance.
Key-pair được sử dụng để đảm bảo tính bảo mật trong việc đăng nhập vào các tài nguyên như máy ảo EC2 (Elastic Compute Cloud) hoặc các dịch vụ khác trong AWS.Bằng cách sử dụng key-pair, bạn có thể kết nối và quản lý từ xa các tài nguyên trên AWS, như máy ảo EC2, bằng cách sử dụng giao thức SSH (Secure Shell). Bạn sẽ cung cấp khóa riêng để xác thực và truy cập an toàn vào các máy chủ từ xa. Bạn có thể tạo sẵn 1 key-pair và thêm nó vào Cloud Formation hoặc để Cloud Formation tự tạo 1 key-pair khi khởi tạo.

```
AWSTemplateFormatVersion: 2010-09-09
Description: Build a webapp stack with CloudFormation

Resources:
  WebAppInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-002843b0a9e09324a
      InstanceType: t2.micro
      SecurityGroupIds:
        - !Ref WebAppSecurityGroup
      KeyName: !Ref WebAppKeyPair     # <-- Thay thế key-pair đã có tại đây.

  WebAppKeyPair:
    Type: AWS::EC2::KeyPair
    Properties:
      KeyName: Raiii                  # <-- Tên key-pair
  WebAppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Join ["-", [webapp-security-group, dev]]
      GroupDescription: "Allow HTTP/HTTPS and SSH inbound and outbound traffic"
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 2498
          ToPort: 2498
          CidrIp: 0.0.0.0/0

# Thiết lập các thông số hiển thị sau khi khởi tạo thành công
Outputs:                              
  InstancePublicIp:
    Description: The Public IP of the EC2 instance
    Value: !GetAtt WebAppInstance.PublicIp      # <-- Lấy ra PublicIp

```

### 2.4. Thiết lập các chương trình sẽ chạy sau khi khởi động instance.
Khi tới bước này chúng ta đã khởi tạo thành công 1 instance bằng Cloud Formation.

Tiếp theo chúng ta sẽ thêm các hoạt động mà sau khi instance khởi tạo thành công sẽ thực hiện. Cụ thể là cài proxy server lên instance sau khi nó được khởi tạo.

>Tóm tắt các bước cài proxy server:
> - Tải và cài đặt gói dữ liệu Squid proxy
> - Thêm user và pass cho proxy server
> - Sửa lại file config.
> - Khởi động lại service.

```
AWSTemplateFormatVersion: 2010-09-09
Description: Build a webapp stack with CloudFormation

Resources:
  WebAppInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-002843b0a9e09324a
      InstanceType: t2.micro
      SecurityGroupIds:
        - !Ref WebAppSecurityGroup
      KeyName: !Ref WebAppKeyPair     # <-- Thay thế key-pair đã có tại đây.
########### Cài đặt Squid proxy ###########
      UserData:
        Fn::Base64: !Sub |

#  Mở bash trên máy chủ và chạy các lệnh bên dưới

          #!/bin/bash                  
            sudo apt update -y
            sudo apt upgrade -y
            sudo apt install -y apache2-utils squid
            wget https://raw.githubusercontent.com/serverok/squid-proxy-installer/master/squid3-install.sh
            sudo bash squid3-install.sh
            sudo mv /etc/squid/squid.conf /etc/squid/squid.conf.original
            sudo touch /etc/squid/squid.conf
            echo "112233" | sudo htpasswd -c -i /etc/squid/passwd tklighting
            cat <<EOF | sudo tee -a /etc/squid/squid.conf
            http_port 2498
            cache deny all
            hierarchy_stoplist cgi-bin ?
            access_log none
            cache_store_log none
            cache_log /dev/null
            refresh_pattern ^ftp: 1440 20% 10080
            refresh_pattern ^gopher: 1440 0% 1440
            refresh_pattern -i (/cgi-bin/|\?) 0 0% 0
            refresh_pattern . 0 20% 4320
            acl localhost src 127.0.0.1/32 ::1
            acl to_localhost dst 127.0.0.0/8 0.0.0.0/32 ::1
            acl SSL_ports port 1-65535
            acl Safe_ports port 1-65535
            acl CONNECT method CONNECT
            acl siteblacklist dstdomain "/etc/squid/blacklist.acl"
            http_access allow manager localhost
            http_access deny manager
            http_access deny !Safe_ports
            http_access deny CONNECT !SSL_ports
            http_access deny siteblacklist
            auth_param basic program /usr/lib/squid3/basic_ncsa_auth /etc/squid/passwd
            auth_param basic children 5
            auth_param basic realm Squid proxy-caching web server
            auth_param basic credentialsttl 2 hours
            acl password proxy_auth REQUIRED
            http_access allow localhost
            http_access allow password
            http_access deny all
            forwarded_for off
            request_header_access Allow allow all
            request_header_access Authorization allow all
            request_header_access WWW-Authenticate allow all
            request_header_access Proxy-Authorization allow all
            request_header_access Proxy-Authenticate allow all
            request_header_access Cache-Control allow all
            request_header_access Content-Encoding allow all
            request_header_access Content-Length allow all
            request_header_access Content-Type allow all
            request_header_access Date allow all
            request_header_access Expires allow all
            request_header_access Host allow all
            request_header_access If-Modified-Since allow all
            request_header_access Last-Modified allow all
            request_header_access Location allow all
            request_header_access Pragma allow all
            request_header_access Accept allow all
            request_header_access Accept-Charset allow all
            request_header_access Accept-Encoding allow all
            request_header_access Accept-Language allow all
            request_header_access Content-Language allow all
            request_header_access Mime-Version allow all
            request_header_access Retry-After allow all
            request_header_access Title allow all
            request_header_access Connection allow all
            request_header_access Proxy-Connection allow all
            request_header_access User-Agent allow all
            request_header_access Cookie allow all
            request_header_access All deny all
          EOF
            sudo service squid restart
###########################################################
  WebAppKeyPair:
    Type: AWS::EC2::KeyPair
    Properties:
      KeyName: Raiii                  # <-- Tên key-pair
  WebAppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Join ["-", [webapp-security-group, dev]]
      GroupDescription: "Allow HTTP/HTTPS and SSH inbound and outbound traffic"
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 2498
          ToPort: 2498
          CidrIp: 0.0.0.0/0

# Thiết lập các thông số hiển thị sau khi khởi tạo thành công
Outputs:                              
  InstancePublicIp:
    Description: The Public IP of the EC2 instance
    Value: !GetAtt WebAppInstance.PublicIp      # <-- Lấy ra PublicIp

```

Nếu bạn muốn thay đổi port của proxy sever, sửa giá trị của lệnh `http_port 2498` theo giá trị bạn muốn trong khoảng `1000 - 65535`.

![](/assets/img/post/CloudFormation/1.png)

Lưu ý khi bạn thay đổi giá trị của port thì bạn cần phải mở cổng tương ứng  tại `WebAppSecurityGroup`. Ví dụ khi bạn đổi port thành `http_port 8888` :


```
- IpProtocol: tcp
  FromPort: 8888
  ToPort: 8888
  CidrIp: 0.0.0.0/0
```

## 3. Cài đặt môi trường AWSCLI.
AWSCLI là viết tắt của "AWS Command Line Interface". Đây là một công cụ dòng lệnh được cung cấp bởi Amazon Web Services (AWS) để tương tác và quản lý các dịch vụ của AWS từ dòng lệnh trên máy tính của bạn.

AWSCLI cho phép bạn thực hiện các tác vụ như tạo và quản lý tài nguyên (ví dụ: máy ảo EC2, máy chủ Lambda, cơ sở dữ liệu RDS), cấu hình và kiểm soát dịch vụ (ví dụ: tạo và quản lý nhóm bảo mật, cài đặt cấu hình tường lửa), và truy vấn dữ liệu và log (ví dụ: truy vấn dữ liệu từ S3, xem và tìm kiếm log từ CloudWatch).

Bằng cách sử dụng AWSCLI, bạn có thể tự động hóa các tác vụ, xây dựng các quy trình làm việc tự động, và tích hợp với các công cụ khác trong quá trình phát triển và triển khai ứng dụng trên AWS.

AWSCLI có thể được cài đặt và sử dụng trên nhiều hệ điều hành, bao gồm Windows, macOS và các bản phân phối Linux. Bạn có thể tìm hiểu thêm về cách cài đặt và sử dụng AWSCLI từ tài liệu chính thức của AWSCLI hoặc từ hướng dẫn và tài liệu tham khảo khác của AWS.

Để tải và cài đặt AWSCLI theo hệ điều hành đang sử dụng cần truy cập vào: [AWSCLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

Trước khi cấu hình môi trường AWSCLI bạn cần lấy `access_key` và `secret_key`.
> Các bước lấy access_key và secret_key:
> 
> 1. Truy cập vào trang chủ AWS https://aws.amazon.com/vi/ . Đăng nhập và chuyển sang đúng vùng mà bạn muốn tạo instance.
> 1. Tại góc trên cùng bên phải nhấn chọn vào phần `Security credentials`
> 1. Tại phấn access keys chọn `Create access key` và làm theo hướng dẫn. Sau khi xong bạn sẽ nhận được access_key và secret_key.

Tiếp theo mở `cmd` và nhập lệnh:

```
aws configure
```

Sau đó nhập lần lượt:
- AWS Access Key ID: Nhập access_key
- AWS Secret Access Key: Nhập secret_key
- Default region name: Tại phần này nhập mã vùng mà bạn muốn khởi tạo instance VD: Khởi tạo máy chủ tại singapore với mã vùng `ap-southeast-1`
- Default output format: Điền `text` để các out được xuất ra dưới dạng text.

Chạy CloudFormation trên AWSCLI:

Mở `cmd` và trỏ đến thư mục chứa file `.yaml`.

```
cd C:\Users\Admin\Desktop\TOAN\YAML
```

Chạy lệnh để tạo stack trên cloudformation:

```
aws cloudformation create-stack --stack-name test --template-body file://ec2.yaml
```

Thay thế `test` bằng tên stack mà bạn muốn tạo.

Để xoá stack đã tạo:

```
aws cloudformation delete-stack --stack-name test
```
Thay thế `test` bằng tên stack mà bạn muốn xoá.

## 4. Tạo file thực thi `CreateStack`.

Tạo file `Run_Create_EC2.c`. Mở và chép code:

```
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>

int main()
{
    // Mở file log
    FILE *logFile = fopen("log.txt", "w");
    if (logFile == NULL)
    {
        perror("Error opening log file");
        return 1;
    }
    // Lấy đường dẫn thư mục hiện tại
    char current_dir[1024];
    if (getcwd(current_dir, sizeof(current_dir)) == NULL)
    {
        fprintf(logFile, "getcwd() error\n");
        fclose(logFile);
        return 1;
    }
    // Chuyển con trỏ sang thư viện hiện tại
    if (chdir(current_dir) != 0)
    {
        fprintf(logFile, "chdir() error\n");
        fclose(logFile);
        return 1;
    }
    // Chạy lệnh khởi tạo Stack
    char *command = "aws cloudformation create-stack --stack-name test --template-body file://ec2.yaml";
    if (system(command) == -1)
    {
        fprintf(logFile, "Error creating stack\n");
        fclose(logFile);
        return 1;
    }
    // Hiển thị các thông số của Stack sau khi khởi tạo thành công
    if (system("aws cloudformation wait stack-create-complete --stack-name test") == -1)
    {
        fprintf(logFile, "Error waiting for stack creation to complete\n");
        fclose(logFile);
        return 1;
    }
    // Mở file dữ liệu StackStatus
    char status[] = "aws cloudformation describe-stacks --stack-name test --query \"Stacks[].{\\\"Status\\\":StackStatus}\" --output text";
    FILE *fp = popen(status, "r");
    if (fp == NULL)
    {
        fprintf(logFile, "Error opening pipe\n");
        fclose(logFile);
        return 1;
    }
    // Lấy giá trị của StackStatus
    char stack_status[1024] = {0};
    if (fgets(stack_status, sizeof(stack_status), fp) == NULL)
    {
        fprintf(logFile, "Error reading pipe\n");
        pclose(fp);
        fclose(logFile);
        return 1;
    }
    // Đóng file
    pclose(fp);
    // Ghi log trạng thái
    stack_status[strcspn(stack_status, "\n")] = 0;
    if (strcmp(stack_status, "CREATE_COMPLETE") != 0)
    {
        fprintf(logFile, "Stack creation failed with status: %s\n", stack_status);
        fclose(logFile);
        return 1;
    }
    else
    {
        fprintf(logFile, "Stack creation with status: %s\n", stack_status);
    }
    char info[] = "aws cloudformation describe-stacks --stack-name test --output json";
    if (system(info) == -1)
    {
        fprintf(logFile, "Error information stacks\n");
        fclose(logFile);
        return 1;
    }
    // In ra địa chỉ Public IP
    char output[] = "aws cloudformation describe-stacks --stack-name test --query \"Stacks[0].Outputs[?OutputKey=='InstancePublicIp'].OutputValue | [0]\"";
    if (system(output) == -1)
    {
        fprintf(logFile, "Error describing stacks\n");
        fclose(logFile);
        return 1;
    }

    fclose(logFile);
    while (1)
    {
    }

    return 0;
}
```

Mở `cmd` tại thư mục này và chạy lệnh

```
gcc Run_Create_EC2.c -o Create_EC2
```

Chạy file `Create_EC2` để tạo stack.

## 5. Tạo file thực thi `DeleteStack`.

Tạo file `Run_Del_EC2.c`. Mở và chép code:

```
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main()
{
    // Lấy đường dẫn thư mục hiện tại

    char current_dir[1024];
    if (getcwd(current_dir, sizeof(current_dir)) == NULL)
    {
        perror("getcwd() error");
        return 1;
    }

    char *command = "aws cloudformation delete-stack --stack-name test";
    // Chuyển con trỏ sang thư viện hiện tại

    if (chdir(current_dir) != 0)
    {
        perror("chdir() error");
        return 1;
    }

    int result = system(command);
    if (result == -1)
    {
        perror("system() error");
        return 1;
    }

    while (1)
    {
        // Chạy lệnh xoá stack tên test
        char status[] = "aws cloudformation describe-stacks --stack-name test --query \"Stacks[].{\\\"Status\\\":StackStatus}\" --output text";
        FILE *fp = popen(status, "r");
        if (fp == NULL)
        {
            perror("popen() error");

            return 1;
        }

        char stack_status[1024] = {0};
        if (fgets(stack_status, sizeof(stack_status), fp) == NULL)

        {
            perror("fgets() error");
            return 1;
        }
        // check trạng thái của stack
        stack_status[strcspn(stack_status, "\n")] = 0;
        if (strcmp(stack_status, "DELETE_IN_PROGRESS") == 0)
        {
            printf("Delete Stack progress...\n");
        }
        else if (strcmp(stack_status, "DELETE_COMPLETE") == 0)
        {
            printf("Delete Stack compelete...\n");
        }
        pclose(fp);
        sleep(1);
    }

    return 0;
}
```

Mở `cmd` tại thư mục này và chạy lệnh

```
gcc Run_Del_EC2.c -o Delete_EC2
```

Chạy file `Delete_EC2` để xoá stack.