---
title: User defined data type 
author: rainer
date: 2023-08-10 1:26:00 +0300
categories: [C, Basic C]
tags: [C, Basic C, IPC]
math: true
mermaid: true
render_with_liquid: false
image:
    path:
---

#  User defined data type 

Kiểu dữ liệu do người dùng định nghĩa (User Defined Data Type) là một tính năng trong ngôn ngữ lập trình cho phép người dùng tạo ra các kiểu dữ liệu mới dựa trên các kiểu dữ liệu đã có. 

Trong ngôn ngữ lập trình C, có một số cách để tạo kiểu dữ liệu do người dùng định nghĩa, bao gồm struct, union, và typedef. Dưới đây là chi tiết về mỗi loại:

## 1. Struct - Cấu trúc

Cấu trúc cho phép người dùng đóng gói nhiều biến có kiểu dữ liệu khác nhau lại với nhau. 

Struct trong ngôn ngữ lập trình C là một kiểu dữ liệu tổng hợp, cho phép lưu trữ nhiều biến khác nhau dưới một tên duy nhất. Các biến này có thể thuộc các kiểu dữ liệu khác nhau, như int, float, char, vv.

### Khai Báo và Khởi Tạo Struct

Để khai báo một struct, bạn sử dụng từ khóa struct theo sau là tên của struct và các trường (fields) bên trong nó.

```
struct SinhVien {
  char ten[50];
  int tuoi;
  float diem;
};
```

Sau khi khai báo, bạn có thể khởi tạo một biến kiểu struct như sau:

```
struct SinhVien sv1;
sv1.tuoi = 20;
strcpy(sv1.ten, "Nguyen Van A");
sv1.diem = 8.5;
```

### Truy Cập Các Trường

Bạn có thể truy cập các trường của struct thông qua toán tử dấu chấm `.` hoặc `->` đối với con trỏ:

```
struct SinhVien sv1;
sv1.tuoi = 20;
strcpy(sv1.ten, "Nguyen Van A");
sv1.diem = 8.5;
```

### Truyền Struct Đến Hàm

```
void inThongTin(struct SinhVien sv) {
  printf("Ten: %s\n", sv.ten);
  printf("Tuoi: %d\n", sv.tuoi);
  printf("Diem: %f\n", sv.diem);
}
```

### Struct Bên Trong Struct

Struct có thể chứa một struct khác như một trường:

```
struct DiaChi {
  char duong[50];
  char thanhPho[50];
};

struct SinhVien {
  char ten[50];
  int tuoi;
  float diem;
  struct DiaChi diaChi;
};
```

## 2. Union 

Union trong ngôn ngữ lập trình C cũng giống như struct về cách khai báo và sử dụng, nhưng có một sự khác biệt quan trọng. Trong khi mỗi trường trong struct có bộ nhớ riêng, tất cả các trường trong union chia sẻ cùng một vùng nhớ. Điều này có nghĩa là chỉ một trường trong union có thể chứa giá trị hợp lệ tại một thời điểm.

###  Khai Báo và Khởi Tạo Union

Để khai báo một union, bạn sử dụng từ khóa union theo sau là tên của union và các trường bên trong nó.

```
union DuLieu {
  int i;
  float f;
  char str[20];
};
```

Bạn có thể khởi tạo một biến kiểu union như sau:

```
union DuLieu duLieu;
duLieu.i = 10; // Chỉ trường 'i' chứa giá trị hợp lệ
```

### Sử Dụng Union

Vì tất cả các trường trong union chia sẻ cùng một vùng nhớ, nên bạn chỉ có thể sử dụng một trường tại một thời điểm. Nếu bạn gán giá trị cho một trường khác, giá trị của trường trước đó sẽ bị ghi đè.

```
duLieu.f = 20.5; // Giá trị của trường 'i' bị ghi đè, chỉ trường 'f' chứa giá trị hợp lệ
```

### Kích Thước của Union

Kích thước của một union bằng kích thước của trường lớn nhất trong union:

```
printf("Size of union: %zu\n", sizeof(duLieu)); // Kích thước sẽ bằng kích thước của trường lớn nhất
```

### Khi Nào Sử Dụng Union

Union thường được sử dụng trong các trường hợp cần tiết kiệm bộ nhớ và bạn biết rằng chỉ một trong các trường cần được sử dụng tại một thời điểm. Ví dụ, nó có thể được sử dụng để lưu trữ dữ liệu đầu vào từ người dùng, mà có thể là số nguyên, số thực, hoặc chuỗi.

### Kết Luận

Union trong C là một cách hiệu quả để quản lý bộ nhớ khi bạn cần lưu trữ một trong nhiều kiểu dữ liệu khác nhau tại cùng một vị trí trong bộ nhớ. Nó giúp tiết kiệm bộ nhớ bằng cách cho phép các trường khác nhau chia sẻ cùng một vùng nhớ, nhưng cũng đòi hỏi bạn phải cẩn thận khi sử dụng để tránh ghi đè dữ liệu không mong muốn.

## 3. Enum

Enum (viết tắt của Enumeration) trong ngôn ngữ lập trình C là một kiểu dữ liệu người dùng định nghĩa, cho phép bạn gán tên có ý nghĩa cho một tập hợp các hằng số số nguyên. Enum giúp làm cho chương trình dễ đọc và bảo trì hơn.

### Khai Báo và Sử Dụng Enum

Để khai báo một enum, bạn sử dụng từ khóa enum theo sau là tên của enum (nếu có) và danh sách các giá trị được liệt kê trong dấu ngoặc nhọn:

```
enum TrangThai {
  MOI,
  DANG_XU_LY,
  HOAN_THANH
};
```

Bạn có thể sử dụng enum này như một kiểu dữ liệu, và khởi tạo biến với một trong các giá trị đã định nghĩa:

```
enum TrangThai trangThai;
trangThai = DANG_XU_LY;
```

### Giá Trị Của Các Phần Tử Trong Enum

Mặc định, giá trị của phần tử đầu tiên trong enum là 0, và mỗi phần tử tiếp theo tăng lên 1. Bạn cũng có thể gán giá trị cụ thể cho các phần tử:

```
enum Mau {
  DO = 1,
  XANH = 5,
  VANG = 10
};
```

### Sử Dụng Enum Trong Switch

Enum thường được sử dụng trong câu lệnh switch, khi bạn muốn kiểm tra một biến với một tập hợp các giá trị cố định:

```
switch (trangThai) {
  case MOI:
    printf("Moi");
    break;
  case DANG_XU_LY:
    printf("Dang xu ly");
    break;
  case HOAN_THANH:
    printf("Hoan thanh");
    break;
}
```

### Kích Thước của Enum

Kích thước của một enum được tính bằng kích thước của kiểu int, vì các giá trị trong enum được biểu diễn bằng số nguyên:

```
printf("Size of enum: %zu\n", sizeof(enum TrangThai)); // Kích thước bằng sizeof(int)
```

### Kết luận

Enum trong C là một công cụ hữu ích để định nghĩa tập hợp các hằng số có ý nghĩa, giúp chương trình dễ đọc và dễ bảo trì hơn. Nó đặc biệt hữu ích trong việc đại diện cho tập hợp các trạng thái, tùy chọn, hoặc bất kỳ tập hợp giá trị cố định nào khác mà bạn muốn quản lý một cách rõ ràng và tổ chức.

## 4. Typedef

typedef trong ngôn ngữ lập trình C là một từ khóa được sử dụng để định nghĩa một bí danh (alias) cho một kiểu dữ liệu đã tồn tại. Nó giúp làm cho chương trình dễ đọc hơn và cho phép bạn thay đổi kiểu dữ liệu mà không cần sửa đổi nhiều dòng code.

###  Sử Dụng typedef với Các Kiểu Dữ Liệu Cơ Bản

Bạn có thể sử dụng typedef để định nghĩa bí danh cho các kiểu dữ liệu cơ bản:

```
typedef struct {
  char ten[50];
  int tuoi;
} SinhVien;

SinhVien sv1;
```

Không cần sử dụng từ khóa struct khi khai báo biến sv1.

### Sử Dụng typedef với Enum và Union

Tương tự như struct, bạn cũng có thể sử dụng typedef với enum và union:

```
typedef enum { DO, XANH, VANG } Mau;
typedef union { int i; float f; char str[20]; } DuLieu;
```

### Sử Dụng typedef với Con Trỏ

Bạn cũng có thể định nghĩa bí danh cho các kiểu con trỏ:

```
typedef int* ConTroSoNguyen;
ConTroSoNguyen ptr = &a;
```

### Kết Luận

typedef là một công cụ mạnh mẽ trong C, giúp tạo ra các bí danh cho các kiểu dữ liệu, làm cho chương trình dễ đọc và bảo trì hơn. Nó đặc biệt hữu ích khi làm việc với các kiểu dữ liệu phức tạp như struct, union, hoặc các kiểu con trỏ, giúp giảm thiểu sự phức tạp và tăng tính tái sử dụng của code.


