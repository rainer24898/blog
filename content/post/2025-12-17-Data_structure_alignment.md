---
title: Data Structure Alignment
author: rainer
date: "2025-07-22T01:26:00+03:00"
categories: [Linux]
tags: [Linux]
math: true
mermaid: true
render_with_liquid: false
image: /blog/assets/img/post/Data_structure_alignment/https___dev-to-uploads.s3.amazonaws.com_uploads_articles_cqxa5bsgv49rr3gfrztv.webp

---


# Data Structure Alignment trong C: từ padding, aligned access đến `__attribute__((packed))`

Khi học C ở mức cơ bản, nhiều người thường nghĩ rằng `struct` chỉ đơn giản là tập hợp các field được đặt nối tiếp nhau trong bộ nhớ. Nhưng khi đi sâu hơn vào lập trình hệ thống, embedded, driver, network stack hoặc tối ưu hiệu năng, ta sẽ gặp ngay một chủ đề rất quan trọng: **data structure alignment**.

Đây là thứ đứng sau hàng loạt hiện tượng quen thuộc như:

* `sizeof(struct)` lớn hơn tổng kích thước các field
* cùng một dữ liệu nhưng chạy ổn trên x86, port sang ARM lại crash
* dùng `packed` thì tiết kiệm bộ nhớ hơn nhưng code có thể chậm hơn hoặc lỗi khó debug
* truy cập struct trong mảng lớn có thể ảnh hưởng đến cache và hiệu năng tổng thể

Bài viết này đi từ gốc đến ngọn:

* alignment là gì
* padding là gì
* compiler bố trí `struct` ra sao trong bộ nhớ
* aligned access và misaligned access khác nhau thế nào
* vì sao `__attribute__((packed))` vừa hữu ích vừa nguy hiểm
* cách viết code C an toàn trên cả môi trường desktop lẫn embedded

---

## 1. Alignment là gì?

**Alignment** là quy tắc căn chỉnh dữ liệu trên các biên địa chỉ phù hợp với kiểu dữ liệu và kiến trúc CPU.

Nói ngắn gọn:

* dữ liệu 1 byte có thể đặt ở đâu cũng được
* dữ liệu 2 byte thường nên bắt đầu ở địa chỉ chia hết cho 2
* dữ liệu 4 byte thường nên bắt đầu ở địa chỉ chia hết cho 4
* dữ liệu 8 byte thường nên bắt đầu ở địa chỉ chia hết cho 8

Ví dụ:

* `0x1000` là địa chỉ align tốt cho `int` 4 byte vì `0x1000 % 4 == 0`
* `0x1008` là địa chỉ align tốt cho `long long` 8 byte vì `0x1008 % 8 == 0`

### Vì sao CPU quan tâm đến alignment?

Vì phần cứng thường được thiết kế để đọc dữ liệu hiệu quả nhất khi dữ liệu nằm đúng biên tự nhiên của nó.

Nếu dữ liệu bị lệch biên:

* CPU có thể phải đọc nhiều lần
* bộ xử lý phải ghép dữ liệu từ nhiều phần
* pipeline có thể kém hiệu quả hơn
* trên một số kiến trúc, truy cập đó có thể bị cấm hoàn toàn

---

## 2. Padding là gì?

**Padding** là các byte đệm mà compiler tự chèn thêm giữa các field hoặc ở cuối `struct` để đảm bảo alignment.

Padding không chứa dữ liệu logic của chương trình, nhưng lại rất quan trọng đối với:

* hiệu năng
* tính đúng đắn khi truy cập bộ nhớ
* khả năng tạo mảng `struct` mà mỗi phần tử vẫn align đúng

Ví dụ đơn giản:

```c
struct A {
    char c;
    int  x;
};
```

Tổng kích thước field thật sự là:

* `char`: 1 byte
* `int`: 4 byte
* tổng: 5 byte

Nhưng `sizeof(struct A)` thường không phải 5, mà là **8 byte**.

Lý do là compiler chèn thêm 3 byte padding sau `c` để `x` bắt đầu ở offset chia hết cho 4.

---

## 3. Quy tắc alignment chung của `struct`

Thông thường, compiler áp dụng hai nguyên tắc chính.

### 3.1. Mỗi field phải nằm đúng alignment của chính nó

Ví dụ:

* `char` align 1
* `short` align 2
* `int` align 4
* `long long` align 8

Nếu một field không thể bắt đầu ngay tại offset hiện tại, compiler sẽ chèn padding trước field đó.

### 3.2. Cả `struct` cũng có alignment riêng

Alignment của một `struct` thường bằng **alignment lớn nhất của các field bên trong**.
Với struct này:

struct A {
    char c;      // 1 byte
    double x;    // 8 byte, không phải 4 byte
    short s;     // 2 byte
};

#### Bước 1: field `c`

```
offset0:c   (1byte)
```

đã dùng 1 byte.

---

#### Bước 2: field `x`

`double` cần alignment 8, nên nó phải bắt đầu ở offset chia hết cho 8.

Hiện tại đang ở offset 1, nên compiler phải chèn **7 byte padding** từ offset 1 đến 7.

```
offset 0: c
offset 1: padding
offset 2: padding
offset 3: padding
offset 4: padding
offset 5: padding
offset 6: padding
offset 7: padding
offset 8..15: x
```

---

#### Bước 3: field `s`

Sau `x`, ta đang ở offset 16.

`short` cần alignment 2, mà 16 chia hết cho 2, nên đặt luôn được:

```
offset 16..17: s
```

---

#### Bước 4: tail padding cuối struct

Lúc này struct đang dùng tới **18 byte**.

Nhưng alignment của cả struct là **8**, nên `sizeof(struct A)` thường phải là **bội số của 8**.

Bội số của 8 gần nhất lớn hơn hoặc bằng 18 là **24**.

=> compiler thêm **6 byte tail padding** ở cuối.
```
struct A
+--------+--------+--------+--------+--------+--------+--------+--------+
| c      |  pad   |  pad   |  pad   |  pad   |  pad   |  pad   |  pad   |
+--------+--------+--------+--------+--------+--------+--------+--------+
|                      x (double, 8 bytes)                              |
+--------+--------+--------+--------+--------+--------+--------+--------+
|   s    |   s    |  pad   |  pad   |  pad   |  pad   |  pad   |  pad   |
+--------+--------+--------+--------+--------+--------+--------+--------+

offset:
0        1        2        3        4        5        6        7
8        9       10       11       12       13       14       15
16       17      18       19       20       21       22       23
```
Điều này kéo theo một hệ quả quan trọng:

* `sizeof(struct)` thường được làm tròn để chia hết cho alignment của `struct`

Mục đích là để khi tạo mảng:

```c
struct A arr[10];
```

thì `arr[1]`, `arr[2]`, ... vẫn bắt đầu đúng alignment như `arr[0]`.

---

## 4. Ví dụ đầy đủ với memory layout

Xét struct sau:

```c
struct Example {
    char  c;   // 1 byte
    int   x;   // 4 byte
    short s;   // 2 byte
    char  d;   // 1 byte
};
```

Giả sử trên hệ thống này:

* `char` align 1
* `short` align 2
* `int` align 4
* alignment của `struct Example` là 4

### 4.1. Phân tích từng bước

* `c` đặt ở offset `0`
* `x` cần align 4, nên compiler phải chèn 3 byte padding ở offset `1..3`
* `x` đặt ở offset `4..7`
* `s` đặt ở offset `8..9`
* `d` đặt ở offset `10`
* cuối struct còn 1 byte padding ở offset `11` để tổng kích thước chia hết cho 4

### 4.2. Sơ đồ ASCII memory layout

```text
struct Example
size = 12 bytes, alignment = 4

Byte offset:
+------+------+------+------+------+------+------+------+------+------+------+------+
|  0   |  1   |  2   |  3   |  4   |  5   |  6   |  7   |  8   |  9   | 10   | 11   |
+------+------+------+------+------+------+------+------+------+------+------+------+
|  c   | pad  | pad  | pad  |      x (4 bytes)          |   s  |   s  |  d   | pad  |
+------+------+------+------+------+------+------+------+------+------+------+------+
```

### 4.3. Nhìn theo block logic

```text
Offset 0      : c
Offset 1..3   : padding
Offset 4..7   : x
Offset 8..9   : s
Offset 10     : d
Offset 11     : padding
```

### 4.4. Tại sao phải có padding cuối?

Vì nếu không có padding cuối, kích thước struct sẽ là 11 byte.

Khi tạo mảng:

```c
struct Example arr[2];
```

thì `arr[1]` sẽ bắt đầu ở offset 11, không chia hết cho 4, kéo theo field `x` của phần tử tiếp theo có thể bị lệch alignment.

---

## 5. Kiểm tra layout thực tế bằng C

Đây là cách kiểm tra rất thực dụng khi debug code hệ thống:

```c
#include <stdio.h>
#include <stddef.h>

struct Example {
    char  c;
    int   x;
    short s;
    char  d;
};

int main(void) {
    printf("sizeof(struct Example) = %zu", sizeof(struct Example));
    printf("offsetof(c) = %zu", offsetof(struct Example, c));
    printf("offsetof(x) = %zu", offsetof(struct Example, x));
    printf("offsetof(s) = %zu", offsetof(struct Example, s));
    printf("offsetof(d) = %zu", offsetof(struct Example, d));
    return 0;
}
```

`sizeof()` cho biết kích thước cuối cùng.

`offsetof()` cho biết offset thật của từng field sau khi compiler đã chèn padding.

Đây là bộ công cụ cực kỳ hữu ích khi:

* debug binary protocol
* kiểm tra struct map với hardware register
* phân tích vì sao `sizeof()` không như mong đợi
* kiểm tra tính tương thích giữa các compiler

---

## 6. Aligned access là gì?

Một địa chỉ `a` được gọi là **`n`-byte aligned** nếu:

```c
a % n == 0
```

Ví dụ:

* `0x0400 = 1024`
* 1024 chia hết cho 4, 8, 16

Nên `0x0400` vừa là:

* 4-byte aligned
* 8-byte aligned
* 16-byte aligned

### 6.1. Aligned access

Là truy cập dữ liệu `n` byte tại địa chỉ cũng chia hết cho `n`.

Ví dụ:

* đọc `int` 4 byte tại `0x1000`
* đọc `uint64_t` 8 byte tại `0x2000`

Đây là trường hợp CPU thích nhất.

### 6.2. Misaligned access

Là truy cập dữ liệu `n` byte tại địa chỉ **không chia hết cho `n`**.

Ví dụ:

* đọc `int` 4 byte tại `0x1001`
* đọc `uint64_t` 8 byte tại `0x1004`

Đây là truy cập lệch biên.

---

## 7. Điều gì xảy ra khi truy cập misaligned?

Tùy kiến trúc CPU mà hậu quả khác nhau.

### 7.1. Trên x86/x64

x86 và x64 thường **cho phép** unaligned access trong nhiều trường hợp.

Điều đó có nghĩa là code như sau có thể vẫn chạy:

```c
char buf[8];
int *p = (int *)(buf + 1);
int x = *p;
```

Nhưng việc “chạy được” không có nghĩa là “nên làm”.

Hậu quả có thể là:

* chậm hơn aligned access
* CPU phải thực hiện thêm thao tác ở tầng vi kiến trúc
* nếu dữ liệu băng qua cache line hoặc page boundary, chi phí còn cao hơn
* với SIMD/vector instruction, alignment có thể nhạy hơn nữa

### 7.2. Trên ARM, MIPS, SPARC và nhiều kiến trúc embedded

Tùy phiên bản CPU và cấu hình hệ thống, misaligned access có thể:

* bị trap
* phát sinh exception
* gây `bus error`
* làm chương trình crash ngay khi dereference

Đây là lý do rất nhiều lỗi kiểu này chỉ xuất hiện khi port từ PC sang board nhúng.

### 7.3. Kết luận thực tế

* **x86/x64**: thường “chịu được”, nhưng không tối ưu và không portable
* **ARM/embedded**: có thể crash hoặc có hành vi phụ thuộc phần cứng

Vì thế, trong code C hệ thống, nguyên tắc tốt là:

> Đừng viết code dựa vào giả định rằng CPU sẽ cứu bạn khi truy cập lệch alignment.

---

## 8. So sánh x86 và ARM theo góc nhìn thực chiến

Đây là phần rất quan trọng với người làm embedded C, driver, network stack hoặc firmware.

### 8.1. x86/x64

Đặc điểm:

* khá linh hoạt với unaligned access
* nhiều trường hợp CPU tự xử lý được
* code sai alignment vẫn có thể “chạy ngon” trong thời gian dài

Rủi ro:

* tạo cảm giác giả an toàn
* dễ khiến lập trình viên chủ quan
* khi port sang ARM thì lỗi bùng lên hàng loạt

### 8.2. ARM

Đặc điểm:

* nhiều dòng ARM nhạy hơn với alignment
* một số loại truy cập lệch biên có thể không được phần cứng chấp nhận
* kết quả phụ thuộc vào core, mode, compiler, OS trap handling

Rủi ro:

* crash không ổn định
* chỉ lỗi ở vài board nhất định
* cùng source code nhưng firmware build khác compiler flag có thể biểu hiện khác nhau

### 8.3. Bài học thực tế

Nếu bạn viết code kiểu:

* cast `uint8_t *` sang `uint32_t *`
* truy cập field trong `packed struct` trực tiếp
* map raw network buffer thành `struct *` rồi dereference ngay

thì có thể:

* trên PC: test pass
* trên target embedded: lỗi ngắt quãng, bus error, data abort, hard fault

---

## 9. `__attribute__((packed))` là gì?

Khi dùng:

```c
struct __attribute__((packed)) PackedExample {
    char  c;
    int   x;
    short s;
};
```

compiler sẽ cố gắng bỏ padding nội bộ.

### 9.1. Layout có thể xuất hiện

```text
struct PackedExample
size = 7 bytes, alignment thường bị hạ xuống 1 hoặc rất nhỏ tùy compiler/ABI

Byte offset:
+------+------+------+------+------+------+------+
|  0   |  1   |  2   |  3   |  4   |  5   |  6   |
+------+------+------+------+------+------+------+
|  c   |      x (4 bytes)       |   s   |   s   |
+------+------+------+------+------+------+------+
```

Hay nhìn rõ hơn:

```text
Offset 0      : c
Offset 1..4   : x
Offset 5..6   : s
```

Vấn đề nằm ở chỗ:

* `x` là `int` 4 byte
* nhưng lại bắt đầu ở offset `1`
* offset `1` không chia hết cho `4`

Tức là `x` bị **misaligned**.

---

## 10. Vì sao `packed` vừa hữu ích vừa nguy hiểm?

### 10.1. Mặt lợi

`packed` rất hữu ích khi bạn cần layout byte-level chính xác, ví dụ:

* header protocol mạng
* packet parser
* file format nhị phân cố định
* dữ liệu lưu EEPROM/flash có format xác định sẵn
* giao tiếp với firmware hoặc hardware format định trước

### 10.2. Mặt hại

Nếu truy cập trực tiếp field trong struct packed, bạn có thể gặp:

* misaligned access
* hiệu năng kém hơn
* lỗi runtime trên kiến trúc nhạy alignment

### 10.3. Hiểu sai phổ biến

Nhiều người nghĩ:

> `packed` chỉ đơn giản là làm struct nhỏ hơn.

Thực ra đúng hơn phải nói:

> `packed` đổi bộ nhớ lấy rủi ro truy cập.

---

## 11. Ví dụ embedded C thực tế: lỗi chỉ xuất hiện trên ARM

Giả sử bạn parse một header nhận từ UART hoặc Ethernet:

```c
#include <stdint.h>

struct __attribute__((packed)) MsgHeader {
    uint8_t  type;
    uint32_t length;
    uint16_t crc;
};

void handle_msg(const uint8_t *buf) {
    const struct MsgHeader *hdr = (const struct MsgHeader *)buf;

    if (hdr->length > 1024) {
        return;
    }
}
```

Nhìn qua thì rất gọn. Nhưng có một vấn đề lớn:

* `buf` có thể bắt đầu ở địa chỉ bất kỳ
* field `length` nằm sau `type`, tức rất dễ ở offset lệch 1 byte
* câu lệnh `hdr->length` có thể tạo misaligned access

### Điều gì có thể xảy ra?

* trên PC x86: thường vẫn chạy được
* trên board ARM cũ hoặc một số SoC embedded: có thể crash ngay khi đọc `hdr->length`

### Đây là kiểu bug rất khó chịu vì:

* test ở máy dev không lỗi
* code review nhìn qua thấy “đúng kiểu dữ liệu”
* crash chỉ xảy ra ngoài target thật

---

## 12. Cách viết an toàn hơn với dữ liệu packed

### 12.1. Dùng `memcpy()` ra biến local align đúng

Đây là cách an toàn, đơn giản và portable nhất.

```c
#include <stdint.h>
#include <string.h>

struct __attribute__((packed)) MsgHeader {
    uint8_t  type;
    uint32_t length;
    uint16_t crc;
};

void handle_msg(const uint8_t *buf) {
    const struct MsgHeader *hdr = (const struct MsgHeader *)buf;
    uint32_t length;

    memcpy(&length, &hdr->length, sizeof(length));

    if (length > 1024) {
        return;
    }
}
```

### Vì sao `memcpy()` an toàn hơn?

Vì:

* địa chỉ nguồn có thể lệch alignment, nhưng `memcpy()` xử lý theo byte
* biến local `length` thường được compiler đặt đúng alignment trên stack
* từ đó CPU chỉ thao tác trực tiếp trên biến local aligned

### 12.2. Unpack thủ công từ buffer byte

Nếu dữ liệu đến từ network hoặc file, nhiều hệ thống chọn cách đọc từng byte rồi ghép lại:

```c
#include <stdint.h>

static uint32_t read_u32_le(const uint8_t *p) {
    return ((uint32_t)p[0]) |
           ((uint32_t)p[1] << 8) |
           ((uint32_t)p[2] << 16) |
           ((uint32_t)p[3] << 24);
}
```

Cách này:

* tránh hoàn toàn misaligned access
* đồng thời kiểm soát luôn endianness
* rất phù hợp trong parser protocol

### 12.3. Parse sang struct nội bộ align đúng

Đây là cách làm sạch và dễ bảo trì hơn trong hệ thống lớn:

* dữ liệu raw chỉ dùng ở lớp parser
* parse sang một struct nội bộ bình thường
* toàn bộ business logic phía sau chỉ làm việc với struct đã align đúng

---

## 13. Sắp xếp field để giảm padding

Không phải lúc nào cũng cần `packed`. Nhiều trường hợp chỉ cần đổi thứ tự field là đủ.

Xét hai struct sau:

```c
struct BadOrder {
    char  a;
    int   b;
    char  c;
    short d;
};

struct GoodOrder {
    int   b;
    short d;
    char  a;
    char  c;
};
```

### 13.1. Phân tích `BadOrder`

```text
struct BadOrder

Byte offset:
+------+------+------+------+------+------+------+------+------+------+------+------+------+
|  0   |  1   |  2   |  3   |  4   |  5   |  6   |  7   |  8   |  9   | 10   | 11   |
+------+------+------+------+------+------+------+------+------+------+------+------+------+
|  a   | pad  | pad  | pad  |      b (4 bytes)       |  c   | pad  |  d   |  d   |
+------+------+------+------+------+------+------+------+------+------+------+------+------+
```

Giải thích:

* `a` ở offset 0
* `b` cần align 4, nên phải chèn 3 byte padding
* `c` ở offset 8
* `d` cần align 2, nên lại phải chèn thêm 1 byte padding ở offset 9
* tổng kích thước thường là 12 byte

### 13.2. Phân tích `GoodOrder`

```text
struct GoodOrder

Byte offset:
+------+------+------+------+------+------+------+------++
|  0   |  1   |  2   |  3   |  4   |  5   |  6   |  7   |
+------+------+------+------+------+------+------+------++
|      b (4 bytes)       |  d   |  d   |  a   |  c   |
+------+------+------+------+------+------+------+------++
```

Giải thích:

* `b` ở offset 0..3
* `d` ở offset 4..5
* `a` ở offset 6
* `c` ở offset 7
* tổng kích thước thường chỉ còn 8 byte

### 13.3. Kết luận từ ví dụ này

Chỉ bằng cách đổi thứ tự field, ta có thể giảm kích thước struct từ 12 xuống 8 byte.

Nếu struct nằm trong một mảng lớn gồm hàng trăm nghìn phần tử, chênh lệch này rất đáng kể.

---

## 14. Ví dụ C để tự đo layout

```c
#include <stdio.h>
#include <stddef.h>

struct BadOrder {
    char  a;
    int   b;
    char  c;
    short d;
};

struct GoodOrder {
    int   b;
    short d;
    char  a;
    char  c;
};

int main(void) {
    printf("BadOrder size = %zu
", sizeof(struct BadOrder));
    printf("GoodOrder size = %zu
", sizeof(struct GoodOrder));

    printf("BadOrder offsets: a=%zu b=%zu c=%zu d=%zu
",
           offsetof(struct BadOrder, a),
           offsetof(struct BadOrder, b),
           offsetof(struct BadOrder, c),
           offsetof(struct BadOrder, d));

    printf("GoodOrder offsets: b=%zu d=%zu a=%zu c=%zu
",
           offsetof(struct GoodOrder, b),
           offsetof(struct GoodOrder, d),
           offsetof(struct GoodOrder, a),
           offsetof(struct GoodOrder, c));

    return 0;
}
```

Bạn nên chạy đoạn này trên:

* GCC/Clang x86_64
* cross compiler cho ARM
* các mức tối ưu khác nhau nếu đang debug ABI

để thấy rõ layout thật sự mà toolchain của dự án đang dùng.

---

## 15. `#pragma pack` và `packed`: dùng khi nào?

Ngoài `__attribute__((packed))`, nhiều compiler còn hỗ trợ `#pragma pack`.

Ví dụ:

```c
#pragma pack(push, 1)
struct Header {
    char  c;
    int   x;
    short s;
};
#pragma pack(pop)
```

Về bản chất, mục tiêu vẫn là giảm hoặc ép alignment xuống mức nhỏ hơn.

### Nên dùng khi:

* cần khớp layout nhị phân với giao thức ngoài
* phải ánh xạ chính xác file/buffer theo spec cố định
* đang làm parser ở lớp rất gần dữ liệu raw

### Không nên dùng khi:

* struct chỉ là dữ liệu nội bộ để xử lý logic
* đang cố tiết kiệm vài byte mà phải đánh đổi tính portable
* field sẽ bị truy cập thường xuyên trong code nóng về hiệu năng

---

## 16. Một lỗi rất phổ biến khác: cast con trỏ byte sang con trỏ kiểu lớn

Ví dụ sau cực kỳ hay gặp:

```c
#include <stdint.h>

uint32_t read32_bad(const uint8_t *buf) {
    return *(const uint32_t *)(buf + 1);
}
```

Tại sao nguy hiểm?

* `buf + 1` có thể không align 4
* dereference trực tiếp `uint32_t *` có thể gây misaligned access
* code này phụ thuộc nặng vào kiến trúc CPU

### Cách an toàn hơn

```c
#include <stdint.h>
#include <string.h>

uint32_t read32_safe(const uint8_t *buf) {
    uint32_t value;
    memcpy(&value, buf + 1, sizeof(value));
    return value;
}
```

Hoặc nếu đang parse protocol, hãy đọc theo từng byte và xử lý cả endianness một cách tường minh.

---

## 17. Alignment và endianness là hai chuyện khác nhau

Đây là chỗ rất nhiều người mới học dễ nhầm.

* **Alignment**: dữ liệu nằm ở địa chỉ nào
* **Endianness**: thứ tự các byte bên trong dữ liệu nhiều byte

Ví dụ một số 32-bit có thể:

* nằm đúng alignment nhưng sai endianness
* nằm đúng endianness nhưng lại sai alignment
* hoặc sai cả hai

Khi parse dữ liệu từ network/file/hardware, bạn thường phải xử lý **đồng thời cả alignment lẫn endianness**.

---

## 18. Góc nhìn hiệu năng: vì sao alignment còn liên quan đến cache?

Alignment không chỉ là vấn đề “có crash hay không”, mà còn liên quan đến hiệu năng bộ nhớ.

Nếu struct có layout xấu:

* kích thước lớn hơn cần thiết do padding dư thừa
* ít phần tử hơn nằm vừa trong một cache line
* quét mảng struct sẽ tốn cache hơn
* bandwidth bộ nhớ và locality kém hơn

Ví dụ:

* một struct 8 byte sẽ chứa được 8 phần tử trong cache line 64 byte
* một struct 12 byte thì chỉ nhét được 5 phần tử trọn vẹn, phần còn lại bị dở dang

Nên việc reorder field hợp lý không chỉ tiết kiệm RAM mà còn cải thiện khả năng tận dụng cache.

---

## 19. Những nguyên tắc rất thực dụng khi viết C hệ thống/embedded

### Nên làm

* dùng `sizeof()` và `offsetof()` để xác minh layout thật
* sắp xếp field từ lớn đến nhỏ nếu muốn giảm padding
* tách lớp dữ liệu raw và lớp dữ liệu xử lý nội bộ
* dùng `memcpy()` khi truy cập field có nguy cơ misaligned
* tự parse byte khi làm protocol/file format
* nhớ xử lý cả endianness bên cạnh alignment

### Không nên làm

* cast `uint8_t *` sang `uint32_t *` rồi dereference trực tiếp
* truy cập trực tiếp field trong `packed struct` trên code portable
* giả định x86 chạy được thì ARM cũng sẽ chạy được
* phụ thuộc vào layout struct giữa nhiều compiler/ABI mà không kiểm chứng
* dùng `packed` tràn lan cho dữ liệu nội bộ chỉ vì muốn giảm `sizeof`

---

## 20. Một chiến lược thiết kế tốt cho dự án lớn

Trong các codebase lớn, cách tổ chức thường bền hơn là:

### Lớp 1: raw format

* dùng `uint8_t *`
* hoặc `packed struct`
* chỉ tồn tại ở module parser/serializer

### Lớp 2: internal representation

* dùng struct bình thường, align đúng
* được reorder field hợp lý
* thuận tiện cho xử lý logic, tối ưu cache và hiệu năng

### Lớp 3: output format

* serialize ngược lại thành byte stream hoặc packet chuẩn

Cách này giúp bạn:

* an toàn hơn trên nhiều kiến trúc
* dễ kiểm soát endianness
* giảm lỗi alignment khó debug
* tách rõ “layout bên ngoài” và “layout xử lý nội bộ”

---

## 21. Kết luận

Alignment không phải là một chi tiết phụ của compiler, mà là một phần rất thực tế của lập trình C mức thấp.

Hiểu alignment giúp bạn lý giải được:

* vì sao `sizeof(struct)` lớn hơn mong đợi
* vì sao compiler chèn padding
* vì sao `packed` có thể gây lỗi runtime
* vì sao code chạy trên x86 nhưng hỏng trên ARM
* vì sao reorder field có thể tiết kiệm bộ nhớ và cải thiện cache efficiency

Nếu cần ghi nhớ ngắn gọn, hãy nhớ 5 ý sau:

1. **Alignment** là yêu cầu đặt dữ liệu đúng biên địa chỉ phù hợp.
2. **Padding** là byte đệm compiler chèn thêm để giữ alignment.
3. **Misaligned access** có thể chậm, thậm chí crash trên một số CPU.
4. **`packed`** rất hữu ích cho format nhị phân cố định, nhưng nguy hiểm nếu truy cập trực tiếp field.
5. **Cách an toàn nhất** là parse/serialize rõ ràng, hoặc dùng `memcpy()` sang biến local align đúng trước khi xử lý.

---

## 22. Tóm tắt cực ngắn để nhớ nhanh

* **Alignment**: đặt dữ liệu đúng biên
* **Padding**: byte đệm để giữ alignment
* **Aligned access**: truy cập đúng biên → nhanh, an toàn hơn
* **Misaligned access**: truy cập lệch biên → chậm hoặc crash
* **`packed`**: giảm padding nhưng tăng rủi ro misaligned access
* **Best practice**: `memcpy()`, unpack/serialize, reorder field hợp lý

---

## 23. Phụ lục: một đoạn demo tổng hợp

```c
#include <stdio.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

struct Example {
    char  c;
    int   x;
    short s;
    char  d;
};

struct BadOrder {
    char  a;
    int   b;
    char  c;
    short d;
};

struct GoodOrder {
    int   b;
    short d;
    char  a;
    char  c;
};

struct __attribute__((packed)) PackedHeader {
    uint8_t  type;
    uint32_t length;
    uint16_t crc;
};

static uint32_t get_length_safe(const struct PackedHeader *h) {
    uint32_t value;
    memcpy(&value, &h->length, sizeof(value));
    return value;
}

int main(void) {
    printf("=== Example ===
");
    printf("size = %zu
", sizeof(struct Example));
    printf("offset c = %zu
", offsetof(struct Example, c));
    printf("offset x = %zu
", offsetof(struct Example, x));
    printf("offset s = %zu
", offsetof(struct Example, s));
    printf("offset d = %zu
", offsetof(struct Example, d));

    printf("
=== Reorder ===
");
    printf("BadOrder  size = %zu
", sizeof(struct BadOrder));
    printf("GoodOrder size = %zu
", sizeof(struct GoodOrder));

    printf("
=== Packed ===
");
    printf("PackedHeader size = %zu
", sizeof(struct PackedHeader));
    printf("offset type   = %zu
", offsetof(struct PackedHeader, type));
    printf("offset length = %zu
", offsetof(struct PackedHeader, length));
    printf("offset crc    = %zu
", offsetof(struct PackedHeader, crc));

    return 0;
}
```

Đây là một đoạn rất phù hợp để tự chạy và quan sát trực tiếp layout do compiler tạo ra trên môi trường của bạn.
