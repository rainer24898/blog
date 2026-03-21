---
title: Set up Squid proxy server
author: rainer
date: 2023-07-22 1:26:00 +0300
categories: [Cloud, Proxy]
tags: [Proxy Cloud]
math: true
mermaid: true
render_with_liquid: false
---
# Set up Squid proxy server

### 1. Thiết bị cần thiết:
- Máy chủ VPS đã cài hệ điều hành ubuntu

### 2. Cài đặt proxy server trên ubuntu:
Step 1: Chuyển sang quyền root

    sudo su

Step 2: Cập nhập một số gói tin cần thiết

    sudo apt update
    sudo apt upgrade
Step 3: Tải tập tin cài đặt của Squidproxy server

    wget https://raw.githubusercontent.com/serverok/squid-proxy-installer/master/squid3-install.sh
Kiểm tra tập tin:

    ls -la 



![](/assets/img/post/Squidproxy/1.png) {: .left}

Step 4: Chạy file script đã tải

    sudo bash squid3-install.sh
Step 5: Thêm xác thực cho proxy

    sudo squid-add-user
Nhập tài khoản và mật khẩu

![](/assets/img/post/Squidproxy/2.png) {: .left}

Step 6: Kiểm tra cổng mạng của proxy trên server

    apt install net-tools
    netstat -lntp         
Port mặc định của proxy trên server là 3128

Step 7: Đổi port của proxy

    vim /etc/squid/squid.conf    
Bấm phím `INS` trên bàn phím để vào chế độ chỉnh sửa. Sửa http_ port thành port monng muốn. Sau đó ấn `Ctrl+C` trên bàn phím để thoát chế độ chỉnh sửa.
Tiếp tục ấn `:wq` để lưu và thoát trình soạn thảo. 



![](/assets/img/post/Squidproxy/3.png) {: .left}

Step 8: Khởi động lại Service và kiểm tra xem đã đổi port chưa

    systemctl restart squid
    netstat -lntp
### 3. Tắt tường lửa cho port trên VPS
Step 1: Vào `Set up fire wall rules` trên trình quản lý VPS

Step 2: Ấn ` Create fire wall rules`


Step 3: Cấu hình mọi thứ như hình sau:

![](/assets/img/post/Squidproxy/4.png) {: .left}

Step 4: Ấn create để tạo cấu hình firewall.


>NOTE:
>- Khi kiểm tra proxy nên tự kiểm tra trên máy tính của mình hạn chế kiểm tra proxy này trên các web kiểm tra. Vì proxy tạo ra trên VPS có độ tin cậy cao hơn các proxy mua trên thị trường, khi kiểm tra trên các trang web khác dễ bị người khác lấy được thông tin proxy và sử dụng
>- Khi tạo proxy trên VPS phải chú ý VPS đã đặt static IP cho public IP của VPS không? Nếu chưa đặt thì sau mỗi lần VPS khởi động lại sẽ thay đổi public IP dẫn đến cấu hình của proxy cũng thay đổi ( thay đổi IP theo public IP của VPS, các thông số port, user, password vẫn giữ nguyên).

### Video Player

https://www.youtube.com/watch?v=pLERrVIuc3w&ab_channel=To%E1%BA%A3nQu%E1%BB%91c

Press play to see the video.


