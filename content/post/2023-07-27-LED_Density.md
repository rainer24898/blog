---
title: LED density
author: rainer
date: 2023-07-27 1:26:00 +0300
categories: [Hardware, LED]
tags: [Hardware, LED]
math: true
mermaid: true
render_with_liquid: false
image:
    path: /assets/img/post/LedDensity/title.jpeg
---
# 1. LED density là gì ?

Mật độ LED (LED density) là thuật ngữ được sử dụng để chỉ số lượng đèn LED trên một đơn vị chiều dài cố định. Thông thường, nó được đo bằng số lượng LED trên mỗi mét (hoặc foot) của một dải LED. 

Không có bất kỳ quy định cụ thể nào về sắp xếp mật độ LED. Mật độ LED được quyết định dựa trên yêu cầu của bài toán đặt ra. Nó phụ thuộc vào nhiều yếu tố: độ ánh sáng cần thiết, kích thước phần cứng, chi phí sản xuất, khả năng tản nhiệt, nhiệt độ hoạt động.

Trên một bóng đèn LED hình tròn, mật độ của chip LED (số lượng chip LED trên một đơn vị diện tích) có thể thay đổi tùy theo mục đích sử dụng và thiết kế của bóng đèn. Dưới đây là một số yếu tố cần xem xét:

### Xét trường hợp 2 đèn đều sử dụng cùng 1 loại chip LED:

- Độ sáng: Bóng đèn với mật độ chip LED cao sẽ cung cấp độ sáng cao hơn so với mật độ thấp, miễn là tất cả các chip LED đều được cung cấp đủ công suất.
- Phân bố ánh sáng: Mật độ chip LED cao có thể tạo ra ánh sáng phân bố đều hơn, giúp loại bỏ "vết" hoặc "đốm" ánh sáng.
- Nhiệt độ và tuổi thọ: Mật độ chip LED cao sẽ sinh ra nhiều nhiệt hơn và có thể làm giảm tuổi thọ của chip LED nếu không được làm mát đúng cách.
- Năng lượng tiêu thụ: Bóng đèn với mật độ chip LED cao sẽ tiêu thụ nhiều năng lượng hơn.

### Xét trường hợp 2 đèn đều sử dụng cùng 2 loại chip LED khác nhau (tổng công suất không đổi):

>Nếu có 2 bóng đèn sử dụng 2 loại chip led khác nhau:
>- Đèn 1: Sử dụng chip công suất cao hơn, mật độ LED thưa hơn
>- Đèn 2: Sử dụng chip công suất thấp hơn, mật độ LED cao hơn

<table>
    <tbody>
        <tr>
            <th></th>
            <th>Đèn 1</th>
            <th>Đèn 2</th>
        </tr>
        <tr>
            <td>Độ sáng và phân bố ánh sáng</td>
            <td>Đèn có thể tạo ra ánh sáng phân bố kém hơn (cần kết hợp chặt chẽ với thân vỏ để giao thoa ánh sáng tốt)</td>
            <td>Đèn có thể tạo ra ánh sáng phân bố đều hơn, giúp tránh hiện tượng "đốm" ánh sáng</td>
        </tr>
            <tr>
            <td>Kích thước mạch</td>
            <td>Kích thước mạch nhỏ hơn dễ dàng sắp xếp linh kiện</td>
            <td>Kích thước mạch lớn hơn khó khăn sắp xếp linh kiện, đi dây</td>
        </tr>
            <tr>
            <td>Tản nhiệt</td>
            <td>Khả năng tản nhiệt kém hơn</td>
            <td>Khả năng tản nhiệt tốt hơn</td>
        </tr>
    </tbody>
</table>

# 2. Ví dụ về khả năng tản nhiệt

Cho 2 loại chip LED với thông số như sau:

LED1:

> Tên: Sam Sung LM301B
> 
> Công suất: P= 0.3 W
> 
> Điện trở nhiệt: Rth = 7.5 ℃/W
>
> Tj là nhiệt độ tại Junction tối đa: Tj_max = 125 ℃

LED2:

> Tên: MP-3030-210H-30-80
> 
> Công suất: P= 0.9 W
> 
> Điện trở nhiệt: Rth = 11 ℃/W
>
> Tj là nhiệt độ tại Junction tối đa: Tj_max = 125 ℃

Với Tj_max là nhiệt độ tối đa của Junction (điểm nối) mà chip LED có thể chịu đựng

Công thức tính Tj:

$T_j = T_a + (P_d * R_{th})$

Trong đó:

- $T_a$ : là nhiệt độ mỗi trường (℃)
- $P_d$ : là công suất tiêu thụ bởi chip LED (watt)
- $ R_{th}$ : là điện trở nhiệt từ Junction tới môi trường xung quanh (℃/W)

Giả sử nhiệt độ xung quanh 2 đèn đều là 40 ℃:

>LED 1:

$T_j = T_a + (P_d * R_{th}) = 40 + (0.3 * 7.5 ) = 42,25 ℃$

Như vậy nhiệt độ Junction tại  mỗi một chip LED 1  trong trường hợp này sẽ tăng 2,25℃, sau đó sẽ tản nhiệt ra bên ngoài.

>LED 2:

$T_j = T_a + (P_d * R_{th}) = 40 + (0.9 * 11 ) = 49,9 ℃$

Như vậy nhiệt độ Junction tại  mỗi một chip LED 1  trong trường hợp này sẽ tăng 9,9℃, sau đó sẽ tản nhiệt ra bên ngoài.

>Tổng quát: Xét trường hợp 2 đèn đều sử dụng cùng 2 loại chip LED khác nhau nhưng tổng công suất tiêu thụ không thay đổi:

- Sử dụng chip LED công suất thấp nhưng mật độ cao giúp dễ dàng trong việc tản nhiệt cho LED hơn, độ giao thoa ánh sáng sẽ tốt hơn. Nhưng sẽ khó khăn trong việc đi dây, sẽ làm tăng kích thước của mạch.
- Sử dụng chip LED công suất cao nhưng mật độ thấp giúp thu gọn kích thước mạch, dễ dàng hơn trong việc gia công sau này. Nhưng sẽ gây khó khăn trong việc tính toán tản nhiệt ( cần phải phối hợp thêm nhiều yếu tố như: layout, chất liệu PCB, chất liệu cơ khí) và giao thoa ánh sáng cần phối hợp chặt chẽ với phần cơ khí.

<style>
     th {
            text-align: center;
        }
</style>
