---
title: Socket Buffer Allocation 
author: rainer
date: 2024-12-3 1:26:00 +0300
categories: [Linux, Networking, Linux Driver]
tags: [Networking, Linux Driver, Linux]
math: true
mermaid: true
render_with_liquid: false
image: 
    # path: /assets/img/post/UsbEthernet/usbheader.jpg
---


### **Socket Buffer Allocation**

**Phân bổ bộ đệm socket (`sk_buff`)** trong Linux là một quy trình quan trọng khi làm việc với thiết bị mạng (NIC). Nó liên quan đến việc cấp phát bộ nhớ, định dạng vùng đệm, và sắp xếp dữ liệu để gói tin có thể được gửi hoặc nhận hiệu quả.

---

### **1. Quy trình phân bổ bộ đệm socket (`sk_buff`)**

![image.png](/assets/img/post/socket_buffer_allocation/1.png)

Quy trình này bao gồm 3 bước chính:

1. **Cấp phát toàn bộ bộ nhớ** bằng cách sử dụng hàm `netdev_alloc_skb()`:
    - Hàm này cấp phát một vùng đệm đủ lớn để chứa gói tin cùng với header Ethernet.
    - Cấu trúc trả về một con trỏ đến đối tượng `struct sk_buff`.
    
    ```c
    struct sk_buff *netdev_alloc_skb(struct net_device *dev, unsigned int length);
    
    ```
    
    - **Tham số:**
        - `dev`: Thiết bị mạng liên quan.
        - `length`: Kích thước bộ đệm cần cấp phát.
    - **Kết quả trả về:**
        - Con trỏ `sk_buff` hoặc `NULL` nếu không cấp phát được.
2. **Sắp xếp và căn chỉnh không gian header** với `skb_reserve()`:
    - Hàm này đảm bảo không gian bộ đệm đủ để chèn các header (MAC, IP, TCP/UDP).
    - Nó di chuyển con trỏ dữ liệu (`data`) đến vị trí phù hợp.
    
    ```c
    void skb_reserve(struct sk_buff *skb, int len);
    
    ```
    
    - **Tham số:**
        - `skb`: Con trỏ đến `sk_buff`.
        - `len`: Số byte cần chừa ra cho header.
3. **Mở rộng không gian chứa dữ liệu** bằng `skb_put()`:
    - Sau khi căn chỉnh không gian header, hàm `skb_put()` được sử dụng để mở rộng vùng dữ liệu thực tế (payload).
    - Hàm này cập nhật con trỏ `tail` để chỉ ra vị trí kết thúc dữ liệu.
    
    ```c
    unsigned char *skb_put(struct sk_buff *skb, unsigned int len);
    
    ```
    
    - **Tham số:**
        - `skb`: Con trỏ đến `sk_buff`.
        - `len`: Số byte dữ liệu sẽ thêm vào vùng đệm.

---

### **2. Mô tả chi tiết từng giai đoạn**

Dựa trên hình ảnh minh họa:

1. **Giai đoạn 1: Khởi tạo với `netdev_alloc_skb()`**
    - Bộ nhớ được cấp phát đủ lớn để chứa toàn bộ gói tin (bao gồm dữ liệu và header).
    - Các con trỏ quan trọng được thiết lập:
        - `head`: Điểm bắt đầu của vùng bộ đệm.
        - `data`: Trỏ đến vị trí đầu tiên của dữ liệu.
        - `tail`: Cũng trỏ đến `data` ở giai đoạn này.
        - `end`: Điểm kết thúc của vùng bộ đệm.
2. **Giai đoạn 2: Căn chỉnh với `skb_reserve()`**
    - Một phần vùng bộ đệm được chừa ra cho header (head room).
    - Con trỏ `data` được di chuyển lên một khoảng `header_len` byte để dành chỗ cho header.
    - Con trỏ `tail` được di chuyển theo tương tự.
3. **Giai đoạn 3: Mở rộng với `skb_put()`**
    - Vùng dữ liệu thực tế (payload) được thêm vào.
    - Con trỏ `tail` được cập nhật để chỉ tới vị trí kết thúc của dữ liệu vừa thêm.

### **Ethernet Header Alignment**

Trong Linux Networking, khi làm việc với socket buffer (`sk_buff`) và Ethernet header, các vấn đề liên quan đến căn chỉnh bộ nhớ và hiệu suất CPU là rất quan trọng. Việc này đòi hỏi phải xử lý đặc biệt khi cấu hình bộ đệm để đảm bảo rằng header Ethernet được căn chỉnh đúng cách, tránh gây ra lỗi hiệu suất khi CPU xử lý. Chi tiết về alignment tham khảo thêm tại: [Alignment](https://rainer24898.github.io/posts/Alignment/)

---

### **Căn chỉnh Header Ethernet (Ethernet Header Alignment)**

### **Lý do cần căn chỉnh**

- Ethernet header có kích thước **14 bytes**. Vì CPU thường yêu cầu dữ liệu được căn chỉnh theo biên độ (alignment) để truy cập nhanh hơn, các gói tin cần phải được đặt ở vị trí sao cho dữ liệu trong header không bị lệch khi CPU xử lý.
- Để đạt được điều này, nhân Linux định nghĩa macro **`NET_IP_ALIGN`** trong file `include/linux/skbuff.h`:
    
    ```c
    #define NET_IP_ALIGN 2
    
    ```
    
    - `NET_IP_ALIGN` thường được đặt là **2** byte, giúp header Ethernet được căn chỉnh ở vị trí thích hợp trong bộ đệm.

### **Quy trình căn chỉnh header với `skb_reserve()`**

- Hàm `skb_reserve()` được sử dụng để di chuyển con trỏ dữ liệu (`data`) đến vị trí căn chỉnh phù hợp. Nó giảm đi không gian "Tail Room" để tạo ra khoảng trống "Head Room" cho header.

---

### **Quy trình đầy đủ khi phân bổ và căn chỉnh Socket Buffer**

### **1. Cấp phát bộ nhớ với `netdev_alloc_skb()`**

- Sử dụng `netdev_alloc_skb()` để cấp phát một vùng đệm socket đủ lớn cho gói tin, bao gồm cả dữ liệu và header.
- Hàm này cấp phát toàn bộ bộ nhớ cần thiết để lưu header Ethernet và dữ liệu payload.
    
    ```c
    struct sk_buff *skb = netdev_alloc_skb(dev, packet_len + NET_IP_ALIGN);
    if (!skb) {
        printk(KERN_ERR "Failed to allocate sk_buff\\n");
        return -ENOMEM;
    }
    
    ```
    

### **2. Căn chỉnh bộ đệm với `skb_reserve()`**

- Sử dụng `skb_reserve()` để căn chỉnh bộ đệm sao cho phần header Ethernet nằm ở vị trí phù hợp:
    
    ```c
    skb_reserve(skb, NET_IP_ALIGN);
    
    ```
    
    - `NET_IP_ALIGN` (thường là 2) đảm bảo rằng header Ethernet bắt đầu ở một địa chỉ được căn chỉnh đúng (thường là bội số của 4 hoặc 8 byte).

### **3. Thêm dữ liệu vào vùng đệm với `skb_put()`**

- Sau khi căn chỉnh, thêm dữ liệu thực tế (payload) vào bộ đệm với `skb_put()`:
    
    ```c
    unsigned char *data = skb_put(skb, packet_len);
    memcpy(data, user_data, packet_len);
    
    ```
    
    - Hàm này mở rộng vùng dữ liệu được sử dụng trong `sk_buff` và trả về con trỏ đến byte đầu tiên của dữ liệu.

### **4. Chuyển bộ đệm lên tầng mạng với `netif_rx_ni()`**

- Sau khi cấu hình hoàn chỉnh, `sk_buff` được chuyển lên tầng mạng của kernel với hàm `netif_rx_ni()`:
    
    ```c
    netif_rx_ni(skb);
    
    ```
    
    - Hàm này đẩy gói tin vào hàng đợi nhận của kernel để xử lý bởi các giao thức mạng (IP, TCP/UDP).

---

### **Mô tả chi tiết các bước**

Dựa trên thông tin được cung cấp:

### **1. Giai đoạn cấp phát (Buffer Allocation)**

- Hàm `netdev_alloc_skb()` cấp phát một vùng đệm lớn, bao gồm:
    - **Head Room**: Phần dành cho header Ethernet và các header khác.
    - **Tail Room**: Phần dữ liệu còn lại trong gói tin.

### **2. Giai đoạn căn chỉnh (Header Alignment)**

- `skb_reserve()` di chuyển con trỏ `data` lên **NET_IP_ALIGN** bytes, chừa ra không gian cho header Ethernet.

### **3. Giai đoạn mở rộng dữ liệu (Payload Expansion)**

- `skb_put()` được sử dụng để mở rộng vùng dữ liệu thực tế (`data`), cập nhật con trỏ `tail` để chỉ tới vị trí kết thúc của dữ liệu payload.

### **4. Giai đoạn gửi lên tầng mạng (Network Processing)**

- Gói tin được chuyển tới kernel networking stack thông qua `netif_rx_ni()` để xử lý thêm (ví dụ: phân tích header, xử lý giao thức).

---

### **Ví dụ chi tiết**

```c
#include <linux/skbuff.h>
#include <linux/netdevice.h>
#include <linux/etherdevice.h>

void receive_packet(struct net_device *dev, unsigned char *user_data, int packet_len) {
    struct sk_buff *skb;

    // 1. Cấp phát bộ đệm socket với kích thước đủ lớn
    skb = netdev_alloc_skb(dev, packet_len + NET_IP_ALIGN);
    if (!skb) {
        printk(KERN_ERR "Failed to allocate sk_buff\\n");
        return;
    }

    // 2. Căn chỉnh bộ đệm cho header Ethernet
    skb_reserve(skb, NET_IP_ALIGN);

    // 3. Thêm dữ liệu vào vùng đệm
    unsigned char *data = skb_put(skb, packet_len);
    memcpy(data, user_data, packet_len);

    // 4. Thiết lập gói tin và gửi lên tầng mạng
    skb->protocol = eth_type_trans(skb, dev);  // Thiết lập giao thức (Ethernet, IP)
    skb->dev = dev;
    netif_rx_ni(skb);  // Chuyển gói tin lên kernel
}

```

---

### **Tổng kết**

1. **Các hàm quan trọng trong phân bổ và căn chỉnh `sk_buff`:**
    - `netdev_alloc_skb()`: Cấp phát bộ đệm.
    - `skb_reserve()`: Căn chỉnh không gian header.
    - `skb_put()`: Thêm dữ liệu payload.
    - `netif_rx_ni()`: Gửi gói tin lên kernel networking stack.
2. **Mục tiêu chính:**
    - Đảm bảo header Ethernet được căn chỉnh đúng cách để CPU truy cập hiệu quả.
    - Quản lý bộ đệm linh hoạt, hỗ trợ tốt cho các giao thức mạng.

Nếu bạn cần giải thích thêm hoặc mở rộng về các bước trên, hãy cho tôi biết!

---

### **Tổng kết**

Phân bổ bộ đệm socket trong Linux là một quy trình quan trọng, yêu cầu sử dụng các hàm:

- `netdev_alloc_skb()`: Cấp phát vùng đệm.
- `skb_reserve()`: Căn chỉnh không gian header.
- `skb_put()`: Thêm dữ liệu thực tế.

Cách quản lý linh hoạt này cho phép xử lý gói tin hiệu quả, tối ưu hóa tài nguyên bộ nhớ, và hỗ trợ tốt cho nhiều giao thức mạng phức tạp.


