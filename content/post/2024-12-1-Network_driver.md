---
title: Create Virtual Network Driver in Linux
author: rainer
date: 2024-12-1 1:26:00 +0300
categories: [Linux, Beagle Bone Black, Linux Driver]
tags: [Beagle Bone Black, Usb Ethernet, Linux]
math: true
mermaid: true
render_with_liquid: false
image: 
    # path: /assets/img/post/UsbEthernet/usbheader.jpg
---


---

### **I. Mục tiêu dự án**

- Tạo một driver mạng ảo trên Linux để mô phỏng thiết bị mạng hoặc thực hiện các chức năng đặc biệt như phân tích gói tin.
- Hiểu sâu hơn về cơ chế hoạt động của ngăn xếp mạng trong kernel Linux.
- Ứng dụng trong việc mô phỏng môi trường mạng, thử nghiệm các tính năng mạng hoặc nghiên cứu bảo mật.

---

### **II. Các bước thực hiện**

#### **1. Chuẩn bị môi trường phát triển**

- **Cài đặt hệ điều hành Linux**: Ubuntu, CentOS hoặc bất kỳ bản phân phối nào bạn quen thuộc.
- **Cài đặt các công cụ cần thiết**:
  - Trình biên dịch GCC.
  - Kernel headers phù hợp với phiên bản kernel đang sử dụng.
  - Các công cụ hỗ trợ: `make`, `git`, `net-tools`, `iproute2`.
- **Thiết lập môi trường kiểm thử**:
  - Sử dụng máy ảo hoặc container để dễ dàng khôi phục khi gặp sự cố.
  - Cài đặt Wireshark hoặc tcpdump để phân tích gói tin.

#### **2. Khởi tạo net_device ảo**

- **Tạo module kernel cơ bản**:
  - Tạo file nguồn cho module (ví dụ: `vnet.c`).
  - Bao gồm các header cần thiết:
    ```c
        #include <linux/module.h>
        #include <linux/kernel.h>
        #include <linux/netdevice.h>
        #include <linux/etherdevice.h>
        #include <linux/init.h>
        #include <linux/skbuff.h>
        #include <linux/ip.h>
        #include <linux/tcp.h>
        #include <linux/udp.h>
        #include <linux/inet.h>
        #include <linux/random.h>
        #include <linux/ktime.h>
        #include <linux/delay.h>

        #include <linux/workqueue.h>
    ```
- **Khai báo trước các hàm thao tác**:
    ```c
        static int vnet_open(struct net_device *dev);
        static int vnet_stop(struct net_device *dev);
        static netdev_tx_t vnet_start_xmit(struct sk_buff *skb, struct net_device *dev);
        static void vnet_rx(struct net_device *dev, int len, const unsigned char *data);
        static void vnet_setup(struct net_device *dev);
        static struct workqueue_struct *vnet_wq;
    ```
- **Sử dụng `alloc_netdev` để tạo net_device**:
  - Khai báo hàm khởi tạo:
    ```c
        static void vnet_setup(struct net_device *dev)
        {
            ether_setup(dev);
            dev->netdev_ops = &vnet_netdev_ops;
            dev->flags |= IFF_NOARP;
            dev->features |= NETIF_F_HW_CSUM;
        }
    ```
  - Tạo net_device:
    ```c
    struct net_device *vnet_dev;
    vnet_dev = alloc_netdev(0, "vnet%d", NET_NAME_UNKNOWN, vnet_setup);
    ```
- **Đặt tên cho interface**:
  - Sử dụng `%d` để tự động đánh số (vnet0, vnet1,...).

#### **3. Triển khai các hàm callback**

- **Hàm thiết lập thiết bị (`vnet_setup`)**:
  - Cấu hình các thông số mặc định cho thiết bị:
    ```c
        static void vnet_setup(struct net_device *dev)
        {
            ether_setup(dev);
            dev->netdev_ops = &vnet_netdev_ops;
            dev->flags |= IFF_NOARP;
            dev->features |= NETIF_F_HW_CSUM;
        }
    ```
- **Triển khai `netdev_ops`**:
  - Khai báo cấu trúc `net_device_ops`:
    ```c
        static const struct net_device_ops vnet_netdev_ops = {
            .ndo_open = vnet_open,
            .ndo_stop = vnet_stop,
            .ndo_start_xmit = vnet_start_xmit,
            // Có thể thêm các thao tác khác tại đây
        };
    ```
- **Hàm mở thiết bị (`vnet_open`)**:
  - Kích hoạt queue truyền tải:
    ```c
        static int vnet_open(struct net_device *dev)
        {
            printk(KERN_INFO "vnet: Thiết bị được mở\n");
            netif_start_queue(dev); // Bắt đầu hàng đợi truyền tải
            return 0;
        }
            ```
- **Hàm dừng thiết bị (`vnet_stop`)**:
  - Dừng queue truyền tải:
    ```c
        static int vnet_stop(struct net_device *dev)
        {
            printk(KERN_INFO "vnet: Thiết bị được đóng\n");
            netif_stop_queue(dev); // Dừng hàng đợi truyền tải
            return 0;
        }
    ```
- **Hàm truyền gói tin (`vnet_start_xmit`)**:
  - Xử lý gói tin gửi đi:
    ```c
    static netdev_tx_t vnet_start_xmit(struct sk_buff *skb, struct net_device *dev) {
        // Ghi log hoặc sửa đổi gói tin nếu cần
        printk(KERN_INFO "vnet: Sending packet\n");
        // Giả lập việc truyền gói tin thành công
        dev_kfree_skb(skb);
        return NETDEV_TX_OK;
    }
    ```

- **Hàm xử lý gói tin trong workqueue (`vnet_tx_work`)**:
  - xử lý gói tin trong workqueue:
    ```c
        static void vnet_tx_work(struct work_struct *work)
        {
            struct vnet_packet *pkt = container_of(work, struct vnet_packet, work);
            struct sk_buff *skb = pkt->skb;
            struct net_device *dev = pkt->dev;
            struct ethhdr *eth;
            struct iphdr *ip_header;
            u32 rand;
            ktime_t start_time, end_time;
            s64 processing_time_ns;

            /* Mô phỏng độ trễ mạng */
            msleep(100);

            /* Mô phỏng mất gói tin */
            rand = prandom_u32() % 100;
            if (rand < 10)
            { // 10% xác suất bỏ gói tin
                printk(KERN_INFO "vnet: Bỏ gói tin\n");
                dev_kfree_skb(skb);
                dev->stats.tx_dropped++;
                kfree(pkt);
                return;
            }

            start_time = ktime_get();

            /* Ghi thông tin gói tin */
            eth = eth_hdr(skb);
            if (!eth)
            {
                printk(KERN_WARNING "vnet: Không thể lấy header Ethernet\n");
                dev_kfree_skb(skb);
                dev->stats.tx_errors++;
                kfree(pkt);
                return;
            }

            if (eth->h_proto == htons(ETH_P_IP))
            {
                ip_header = ip_hdr(skb);
                if (ip_header)
                {
                    printk(KERN_INFO "vnet: Truyền gói tin từ %pI4 đến %pI4\n",
                        &ip_header->saddr, &ip_header->daddr);

                    /* Sửa đổi địa chỉ IP nguồn */
                    ip_header->saddr = in_aton("192.168.1.200");
                    /* Tính lại checksum IP */
                    ip_header->check = 0;
                    ip_header->check = ip_fast_csum((unsigned char *)ip_header, ip_header->ihl);
                }
            }

            /* Cập nhật thống kê */
            dev->stats.tx_packets++;
            dev->stats.tx_bytes += skb->len;

            /* Giả lập việc truyền gói tin bằng cách giải phóng skb */
            dev_kfree_skb(skb);

            end_time = ktime_get();
            processing_time_ns = ktime_to_ns(ktime_sub(end_time, start_time));
            printk(KERN_INFO "vnet: Gói tin được xử lý trong %lld ns\n", processing_time_ns);

            /* Giải phóng cấu trúc gói tin */
            kfree(pkt);
        }
    ```


- **Hàm nhận gói tin**:
  - Tạo một chức năng riêng để nhận gói tin và đẩy vào ngăn xếp mạng:
    ```c
        static void vnet_rx(struct net_device *dev, int len, const unsigned char *data)
        {
            struct sk_buff *skb;
            unsigned char *skb_data;

            /* Cấp phát sk_buff */
            skb = netdev_alloc_skb(dev, len + 2);
            if (!skb)
            {
                printk(KERN_ERR "vnet: Không thể cấp phát sk_buff\n");
                dev->stats.rx_dropped++;
                return;
            }

            skb_reserve(skb, 2);          // Canh chỉnh dữ liệu trên biên 16 byte
            skb_data = skb_put(skb, len); // Tăng độ dài dữ liệu
            memcpy(skb_data, data, len);  // Sao chép dữ liệu vào sk_buff

            /* Thiết lập thông tin gói tin */
            skb->dev = dev;
            skb->protocol = eth_type_trans(skb, dev);
            skb->ip_summed = CHECKSUM_UNNECESSARY; // Không cần tính checksum

            /* Đẩy gói tin vào ngăn xếp mạng */
            netif_rx(skb);

            /* Cập nhật thống kê */
            dev->stats.rx_packets++;
            dev->stats.rx_bytes += len;

            printk(KERN_INFO "vnet: Nhận gói tin có độ dài %d\n", len);
        }
    ```

#### **4. Đăng ký và kích hoạt thiết bị**

- **Đăng ký với kernel**:
  - Trong hàm khởi tạo module:
    ```c
        static int __init vnet_init(void)
        {
            int result;

            /* Cấp phát thiết bị mạng */
            vnet_dev = alloc_netdev(0, "vnet%d", NET_NAME_UNKNOWN, vnet_setup);
            if (!vnet_dev)
            {
                printk(KERN_ERR "vnet: Không thể cấp phát net_device\n");
                return -ENOMEM;
            }

            /* Tạo workqueue */
            vnet_wq = create_singlethread_workqueue("vnet_wq");
            if (!vnet_wq)
            {
                printk(KERN_ERR "vnet: Không thể tạo workqueue\n");
                free_netdev(vnet_dev);
                return -ENOMEM;
            }

            /* Đăng ký thiết bị mạng */
            result = register_netdev(vnet_dev);
            if (result < 0)
            {
                printk(KERN_ERR "vnet: Không thể đăng ký net_device\n");
                destroy_workqueue(vnet_wq);
                free_netdev(vnet_dev);
                return result;
            }

            printk(KERN_INFO "vnet: Module được tải\n");
            return 0;
        }
    ```
- **Gỡ đăng ký khi module được loại bỏ**:
  ```c
        static void __exit vnet_exit(void)
        {
            unregister_netdev(vnet_dev);
            destroy_workqueue(vnet_wq);
            free_netdev(vnet_dev);
            printk(KERN_INFO "vnet: Module được gỡ bỏ\n");
        }
  ```

- **Các macro module**:
  ```c
        module_init(vnet_init);
        module_exit(vnet_exit);

        MODULE_LICENSE("GPL");
        MODULE_AUTHOR("rainer");
        MODULE_DESCRIPTION("Ví dụ Driver Mạng Ảo Đơn Giản");
  ```

- **Make file**:
    ```
        obj-m += vnet.o

        all:
            make -C /lib/modules/$(shell uname -r)/build M=$(PWD) modules

        clean:
            make -C /lib/modules/$(shell uname -r)/build M=$(PWD) clean
    ```

- **Kiểm tra thiết bị**:
  - Biên dịch và chèn module:
    ```bash
        make
        sudo insmod vnet.ko
    ```
  - Kích hoạt interface:
    ```bash
        sudo ifconfig vnet0 up
    ```
  - Kiểm tra trạng thái:
    ```bash
        ifconfig vnet0
    ```



#### **5. Thực hiện chức năng đặc biệt**

- **Mô phỏng độ trễ mạng**:
  - Thêm `msleep()` trong hàm `vnet_start_xmit` để tạo độ trễ.
    Lưu ý:
    Không sử dụng hàm gây ngủ trong ngữ cảnh không thể ngủ: Các hàm như msleep, ssleep, schedule không được phép sử dụng trong các hàm như ndo_start_xmit. Nếu cần mô phỏng độ trễ hãy sử dụng hàng đợi công việc (workqueue). Lưu ý quan trọng
    không được sử dụng hàm gây ngủ trong ngữ cảnh không thể ngủ:Các hàm như msleep, ssleep, schedule không được phép gọi trong ngữ cảnh ngắt hoặc ngữ cảnh không thể ngủ. Sử dụng workqueue để chuyển công việc sang ngữ cảnh có thể ngủ. Sử dụng GFP_ATOMIC khi cấp phát bộ nhớ trong ngữ cảnh không thể ngủ:

Trong vnet_start_xmit, sử dụng kmalloc với GFP_ATOMIC vì không thể chờ đợi bộ nhớ được giải phóng.
Đảm bảo đồng bộ hóa và an toàn bộ nhớ:

Khi sử dụng workqueue hoặc các cơ chế đồng thời khác, cần chú ý đến việc đồng bộ hóa dữ liệu.
- **Mô phỏng mất gói tin**:
  - Sử dụng hàm ngẫu nhiên `prandom_u32()` để quyết định bỏ qua gói tin.
- **Phân tích gói tin**:
  - Trích xuất header của gói tin và ghi log thông tin:
    ```c
    struct ethhdr *eth = (struct ethhdr *)skb_mac_header(skb);
    printk(KERN_INFO "vnet: Packet from %pM to %pM\n", eth->h_source, eth->h_dest);
    ```
- **Thực hiện các phép đo**:
  - Cập nhật các thống kê trong `dev->stats` như `tx_packets`, `rx_packets`, `tx_bytes`, `rx_bytes`.

#### **6. Kiểm thử và debug**

- **Gửi gói tin qua interface ảo**:
  - Sử dụng `ping` hoặc `netcat` để kiểm tra truyền thông.
- **Sử dụng Wireshark hoặc tcpdump**:
  - Bắt và phân tích gói tin trên `vnet0`.
- **Kiểm tra log hệ thống**:
  - Sử dụng `dmesg` hoặc `tail -f /var/log/kern.log` để xem thông báo từ kernel.
- **Debugging**:
  - Sử dụng `printk()` để ghi log trong code.
  - Sử dụng `gdb` với kernel module nếu cần.

#### **7. Tối ưu hóa và hoàn thiện**

- **Xử lý các trường hợp lỗi**:
  - Kiểm tra và xử lý các giá trị trả về của hàm.
- **Tối ưu hiệu năng**:
  - Giảm thiểu việc sử dụng hàm gây chặn như `msleep()` nếu không cần thiết.
- **Viết tài liệu**:
  - Ghi chú về cách cài đặt, cấu hình và sử dụng driver.
  - Giải thích các phần code quan trọng.

#### **8. Triển khai và bảo trì**

- **Tạo Makefile**:
  - Để tự động hóa quá trình biên dịch.
- **Đóng gói module**:
  - Cung cấp hướng dẫn cài đặt và sử dụng cho người khác.
- **Bảo trì và cập nhật**:
  - Theo dõi các cập nhật của kernel để duy trì tính tương thích.
  - Cải tiến chức năng dựa trên phản hồi và nhu cầu mới.

---

### **III. Lưu ý**

- **An toàn khi lập trình kernel**:
  - Luôn kiểm tra code cẩn thận để tránh gây ra kernel panic.
  - Nên thử nghiệm trên máy ảo hoặc môi trường không quan trọng.
- **Quyền hạn**:
  - Cần quyền `root` để chèn và gỡ bỏ module kernel.
- **Tuân thủ giấy phép**:
  - Nếu dự định chia sẻ hoặc phân phối driver, đảm bảo tuân thủ các giấy phép liên quan (GPL).

---

### **IV. Tài liệu tham khảo**

- **Sách**:
  - *Linux Device Drivers, Third Edition* - Jonathan Corbet, Alessandro Rubini, Greg Kroah-Hartman.
- **Trang web**:
  - [The Linux Kernel Module Programming Guide](https://www.tldp.org/LDP/lkmpg/2.6/html/index.html)
  - [Kernel Newbies](https://kernelnewbies.org/)

---