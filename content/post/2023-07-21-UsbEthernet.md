---
title: Usb Ethernet for Beagle Bone Black
author: rainer
date: 2023-07-22 1:26:00 +0300
categories: [Linux, Beagle Bone Black, Usb Ethernet]
tags: [Beagle Bone Black, Usb Ethernet, Linux]
math: true
mermaid: true
render_with_liquid: false
image: 
    path: /assets/img/post/UsbEthernet/usbheader.jpg
---

# 1. Usb Ethernet là gì ?

USB Ethernet là một loại thiết bị mạng cho phép bạn kết nối máy tính của mình với mạng Ethernet thông qua cổng USB.

Trên Linux USB Ethernet được sử dụng thông qua một tính năng của kernel Linux đó là `USB Ethernet Gadget`. Nó cho phép thiết bị hoạt động như một thiết bị mạng qua cổng USB. Điều này thường được sử dụng trong lĩnh vực phát triển nhúng, cho phép các thiết bị như Raspberry Pi hoặc BeagleBone Black kết nối với mạng thông qua cổng USB thay vì cổng Ethernet thông thường.

Để sử dụng được `USB Ethernet Gadget` ta có thể sử dụng modules có sẵn trên kernel Linux đó là `g_ether` hoặc `u_ether`. Trong đó `g_ether` là một module trong kernel Linux, và là một phần của hệ thống USB Gadget. Nó cung cấp chức năng "Ethernet over USB", cho phép thiết bị Linux kết nối mạng qua cổng USB. Nó sử dụng RNDIS (hoặc một giao thức tương đương khác như CDC Ethernet) để thực hiện việc này. Khi g_ether được tải vào kernel, nó cung cấp một giao diện mạng Ethernet ảo trên thiết bị Linux. Khi thiết bị được kết nối với một máy tính Windows (hoặc bất kỳ hệ điều hành nào hỗ trợ RNDIS) qua cổng USB, máy tính sẽ nhận biết nó như một thiết bị mạng Ethernet.

Cách để nhận biết xem thiết bị của bạn có hỗ trợ `RNDIS` hay `CDC Ethernet` không đó là đọc thanh ghi usb trong file Reference Manual của thiết bị phần cứng đó. Mình sẽ lấy ví dụ về board Beagle Bone Black:

Từ file Reference Manual các bạn tìm tới USB Registers --> USB0_CTRL Registers --> USB0CTRL Register.

![](/assets/img/post/UsbEthernet/RNDIS.png)

Tại đây các bạn có thể tìm thấy thông tin về thanh ghi RNDIS.

# 2. Set up g_ether trên Beagle Bone Black.

Đầu tiên để cài được g_ether trên Beagle Bone Black các bạn cần biết một chút về `device tree`, `build kernel` và `network interface configuration`.

## 2.1. Set up g_ether trên device tree.

Từ thư mục lưu các source build kernel các bạn mở file `am33xx.dtsi` tại thư mục `dts`.

```
code kernelbuildscripts/KERNEL/arch/arm/boot/dts/am33xx.dtsi 
```

Tại đây các bạn tạo một node `g_ether` bên trong node usb0:

```
g_ether: g_ether {
	compatible = "linux,usb-gadget";
	g-ether,idVendor = <0x1d6b>; 
	g-ether,idProduct = <0x0104>; 
	g-ether,iManufacturer = "Linux";
	g-ether,iProduct = "5.4.242-bone66";
	g-ether,host_addr = "00:dc:c8:f7:75:05";
	g-ether,dev_addr = "00:dd:dc:eb:6d:f1";
	status = "okay";
}
```

Với đoạn bên trên ta khai báo 1 node g_ether với các thông số:
- compatible = "linux,usb-gadget";: Đây là một chuỗi tương thích chuẩn trong Device Tree, chỉ ra rằng node này tương thích với mô-đun "usb-gadget" của Linux.
- g-ether,idVendor = <0x1d6b>;: Định nghĩa ID nhà sản xuất USB. 0x1d6b là ID của Linux USB Project.
- g-ether,idProduct = <0x0104>;: Định nghĩa ID sản phẩm USB. 0x0104 là ID của một sản phẩm cụ thể trong Linux USB Project.
- g-ether,iManufacturer = "Linux";: Định nghĩa tên nhà sản xuất mà thiết bị sẽ báo cáo khi được hỏi.
- g-ether,iProduct = "5.4.242-bone66";: Định nghĩa tên sản phẩm mà thiết bị sẽ báo cáo khi được hỏi.
- g-ether,host_addr = "00:dc:c8:f7:75:05";: Định nghĩa địa chỉ MAC mà thiết bị sẽ sử dụng khi hoạt động như một máy chủ mạng.
- g-ether,dev_addr = "00:dd:dc:eb:6d:f1";: Định nghĩa địa chỉ MAC mà thiết bị sẽ sử dụng khi hoạt động như một thiết bị mạng.
- status = "okay";: Điều này báo hiệu rằng node này được kích hoạt và sẽ được sử dụng bởi kernel.

## 2.2.  Rebuild kernel.

Từ thư mục lưu các source build kernel các bạn mở file `rebuild.sh`.

```
cd kernelbuildscripts
./tools/rebuild.sh
```

Tại giao diện `Kernel Configuration` các bạn chọn: Device Drivers  ---> USB support  ---> USB Gadget Support  ---> 

Tại đây các bạn bật ( ấn y ) các lựa chọn như đã khoanh dưới đây.

![](/assets/img/post/UsbEthernet/rebuild.png)

- USB Gadget Target Fabric là một thành phần của hệ thống USB Gadget trong Linux, được thiết kế để hỗ trợ việc tạo ra các "target" USB, tức các thiết bị USB ảo, trên một máy chủ Linux. `g_ether` là một module của kernel Linux cung cấp chức năng Ethernet over USB. Khi được tải vào kernel, `g_ether` tạo ra một "target" USB với chức năng Ethernet over USB.
- USB Gadget precomposed configurations là một tính năng trong hệ thống USB Gadget của Linux cho phép bạn tạo ra và lưu trữ các cấu hình USB Gadget sẵn có. Mỗi cấu hình này bao gồm một hoặc nhiều chức năng USB cụ thể, như Ethernet over USB, mass storage, serial port, và những chức năng khác. `g_ether` là một module của kernel Linux cung cấp chức năng Ethernet over USB. Khi `g_ether` được tải vào kernel, nó tạo ra một cấu hình USB Gadget sẵn có với chức năng Ethernet over USB. Cấu hình này sau đó có thể được sử dụng bởi hệ thống USB Gadget để tạo ra một "target" USB với chức năng Ethernet over USB.

Sau đó lưu lại và thoát để  rebuild lại kernel. 

## 2.3. Network interface configuration.

Sau khi rebuild kernel xong các bạn build kernel sang thẻ SD. Tại bước cấu hình mạng các bạn thêm các bước sau:

Cấu hình file interfaces


```
sudo vim /media/rootfs/etc/network/interfaces
```

Paste đoạn code sau đây vào file:

```
#/etc/network/interfaces
auto lo
iface lo inet loopback

auto eth0
iface eth0 inet dhcp

auto usb0
iface usb0 inet static
    address 192.168.7.2
    netmask 255.255.255.0
    gateway 192.168.7.1

```

Cấu hình file usb0


```
/etc/network/if-up.d/usb0
```

```
#!/bin/sh

if [ "$IFACE" = usb0 ]; then
    ifconfig $IFACE 192.168.7.2 netmask 255.255.255.0 up
    route add default gw 192.168.7.1 $IFACE
    echo "nameserver 8.8.8.8" > /etc/resolv.conf
fi
```

Lưu và tiếp tục build kernel vào thẻ SD. Sau khi build xong và khởi động board các bạn kiểm tra bằng cách:

```
ifconfig
```

Nếu kết quả như sau thì bạn đã thành công: 

```
usb0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.7.2  netmask 255.255.255.0  broadcast 192.168.7.255

```

# 3. Set up RNDIS trên máy tính Window.

Tải file RNDIS từ trang: https://www.driverscape.com/download/usb-ethernet-rndis-gadget

Giải nén và `install` file RNDIS. Sau khi cài xong và cắm board vào các bạn sẽ nhận được 1 cổng ethernet ảo trên windows

![](/assets/img/post/UsbEthernet/RNDISEthernet.png)

Tại giao diện mạng bạn đang sử dụng ( Wifi hoặc Ethernet) --> properties --> sharing --> chọn `Allow others network user to connect though this computer` --> chọn cổng ethernet ảo đã cài.

![](/assets/img/post/UsbEthernet/Sharing.png)

Tại cổng ethernet ảo đã cài các bạn set cấu hình ipv4 cho nó như sau:

```
192.168.7.1
255.255.255.0
```

Lưu lại và kiểm tra kết quả.

>Chúc các bạn thành công <i class="fa-solid fa-face-smile-wink"></i> <i class="fa-solid fa-face-smile-wink"></i> <i class="fa-solid fa-face-smile-wink"></i>

