---
title: Callback mechanism in net_device
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

# Cơ chế callback trong cấu trúc `struct net_device`
Cơ chế callback trong cấu trúc `struct net_device` của Linux kernel được thiết kế để cung cấp một cách trừu tượng hóa các thao tác trên thiết bị mạng. Trong đó, trường `struct net_device_ops *netdev_ops` là một con trỏ trỏ đến bảng các hàm callback. Những callback này được triển khai bởi driver của thiết bị để định nghĩa hành vi của các thao tác cụ thể (như khởi tạo, truyền nhận dữ liệu, hoặc tắt thiết bị).

### Vai trò của `net_device_ops`

`net_device_ops` là một phần của `struct net_device` và chứa các con trỏ hàm mà kernel sẽ gọi để thực hiện các hành động liên quan đến thiết bị mạng. Cơ chế này cho phép kernel tương tác với thiết bị một cách nhất quán mà không cần biết chi tiết nội bộ của từng thiết bị.

### Các bước hoạt động

1. **Định nghĩa các hàm callback trong driver**: Driver của thiết bị cần định nghĩa các hàm tương ứng với các thao tác mạng như mở, đóng, gửi gói tin, v.v.
2. **Gán các hàm vào bảng `net_device_ops`**: Trong quá trình khởi tạo thiết bị, driver sẽ khởi tạo một cấu trúc `net_device_ops` và gán các con trỏ hàm vào các trường tương ứng.
3. **Gán bảng `net_device_ops` cho `struct net_device`**: Khi driver đăng ký thiết bị với kernel, cấu trúc `net_device` được liên kết với bảng `net_device_ops`.
4. **Kernel gọi các hàm callback**: Khi có thao tác cần thực hiện, kernel sẽ gọi các hàm được định nghĩa trong `net_device_ops`.

### Một số callback phổ biến trong `struct net_device_ops`

Dưới đây là các trường callback chính trong `struct net_device_ops` và chức năng của chúng:

| Callback | Mô tả |
| --- | --- |
| `ndo_open` | Hàm được gọi khi mở thiết bị mạng (`ifconfig up`). |
| `ndo_stop` | Hàm được gọi khi đóng thiết bị mạng (`ifconfig down`). |
| `ndo_start_xmit` | Hàm để gửi gói tin từ kernel xuống driver. |
| `ndo_change_mtu` | Thay đổi kích thước MTU của thiết bị. |
| `ndo_set_mac_address` | Cập nhật địa chỉ MAC của thiết bị. |
| `ndo_validate_addr` | Xác thực địa chỉ MAC của thiết bị. |
| `ndo_set_rx_mode` | Cấu hình chế độ nhận gói tin (ví dụ: promiscuous hoặc multicast). |
| `ndo_do_ioctl` | Thực thi các yêu cầu IOCTL đặc biệt. |
| `ndo_tx_timeout` | Xử lý timeout khi truyền gói tin. |

Có thể tham khảo thêm tại: [**net_device_ops Struct Reference**](https://rainer24898.github.io/posts/Socket_Buffer_Allocation/)

### Ví dụ cấu hình `net_device_ops` trong driver

Dưới đây là một ví dụ về cách một driver có thể cấu hình `net_device_ops`:

```c
static int my_ndo_open(struct net_device *dev) {
    printk(KERN_INFO "Device %s opened\\n", dev->name);
    netif_start_queue(dev); // Bắt đầu xử lý hàng đợi truyền dữ liệu
    return 0;
}

static int my_ndo_stop(struct net_device *dev) {
    printk(KERN_INFO "Device %s stopped\\n", dev->name);
    netif_stop_queue(dev); // Dừng hàng đợi truyền dữ liệu
    return 0;
}

static netdev_tx_t my_ndo_start_xmit(struct sk_buff *skb, struct net_device *dev) {
    printk(KERN_INFO "Transmitting packet from device %s\\n", dev->name);
    dev_kfree_skb(skb); // Giải phóng gói tin (thường là sau khi truyền xong)
    return NETDEV_TX_OK;
}

static struct net_device_ops my_netdev_ops = {
    .ndo_open = my_ndo_open,
    .ndo_stop = my_ndo_stop,
    .ndo_start_xmit = my_ndo_start_xmit,
};

static void setup_my_device(struct net_device *dev) {
    dev->netdev_ops = &my_netdev_ops; // Gán các callback cho thiết bị
}

```

### Lợi ích của cơ chế callback

1. **Trừu tượng hóa**: Kernel chỉ cần biết các hàm callback để thao tác với thiết bị mà không cần quan tâm đến chi tiết bên trong driver.
2. **Tái sử dụng mã nguồn**: Các thao tác chung được kernel xử lý, chỉ cần driver cung cấp các hàm cụ thể.
3. **Khả năng mở rộng**: Dễ dàng thêm các thao tác mới bằng cách mở rộng `struct net_device_ops`.

Cơ chế này làm cho việc viết driver thiết bị mạng trở nên linh hoạt và dễ bảo trì hơn.

### Yếu tố quyết định thứ tự gọi callback:

Thứ tự các callback trong `struct net_device_ops` **không phụ thuộc vào thứ tự định nghĩa trong bảng `net_device_ops`** (tức là không phải cứ `ndo_open` được khai báo trước thì sẽ được kernel gọi trước). Kernel gọi các hàm callback này dựa trên **bối cảnh và hành động cụ thể** xảy ra trong hệ thống mạng, không phải theo thứ tự từ trên xuống dưới trong mã nguồn.

1. **Ngữ cảnh hệ thống**:
    - Các hàm callback được gọi bởi kernel khi xảy ra một sự kiện hoặc khi cần thực hiện một thao tác nhất định.
    - Ví dụ:
        - Khi thiết bị được bật (`ifconfig up`), kernel gọi hàm `ndo_open`.
        - Khi thiết bị được tắt (`ifconfig down`), kernel gọi hàm `ndo_stop`.
        - Khi có gói tin cần truyền, kernel gọi hàm `ndo_start_xmit`.
2. **Tương tác từ người dùng hoặc hệ thống**:
    - Nếu người dùng hoặc dịch vụ gửi yêu cầu qua công cụ quản lý mạng (`ip`, `ifconfig`, hoặc `ethtool`), kernel sẽ gọi các callback liên quan. Ví dụ:
        - Thay đổi địa chỉ MAC → `ndo_set_mac_address`.
        - Thay đổi MTU → `ndo_change_mtu`.
3. **Luồng xử lý nội bộ kernel**:
    - Trong kernel, các hàm liên quan đến network stack (như `dev_open`, `dev_stop`, hoặc `netif_rx`) quyết định callback nào sẽ được gọi.
    - Các callback chỉ được gọi tại thời điểm cần thiết và theo trình tự logic của kernel, không dựa vào thứ tự định nghĩa trong mã nguồn.
4. **Trạng thái của thiết bị**:
    - Một số callback chỉ được gọi nếu thiết bị ở trạng thái nhất định. Ví dụ:
        - `ndo_start_xmit` chỉ được gọi khi thiết bị đang hoạt động (trạng thái UP).
        - `ndo_open` chỉ được gọi nếu thiết bị chưa mở.

### Minh họa luồng gọi callback

Khi người dùng bật thiết bị mạng (`ifconfig up`):

1. Kernel gọi hàm `dev_open` trong network stack.
2. `dev_open` sẽ kiểm tra thiết bị và gọi hàm `ndo_open` từ `net_device_ops`.

Khi thiết bị truyền gói tin:

1. Kernel nhận gói tin từ tầng trên của network stack.
2. Gói tin được chuyển xuống tầng driver qua hàm `ndo_start_xmit`.

Khi tắt thiết bị (`ifconfig down`):

1. Kernel gọi hàm `dev_close`.
2. `dev_close` sẽ gọi `ndo_stop` từ `net_device_ops`.

### Tóm lại

- Thứ tự các callback không phải từ trên xuống dưới trong bảng `net_device_ops`. Kernel sẽ gọi các callback phù hợp với **bối cảnh cụ thể**, **ngữ cảnh sự kiện**, và **trạng thái hiện tại** của thiết bị.
- Bạn có thể kiểm tra các luồng gọi thực tế bằng cách theo dõi mã nguồn Linux kernel, ví dụ trong file `net/core/dev.c`.
