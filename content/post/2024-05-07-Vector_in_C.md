---
title: Vector in C
author: rainer
date: 2024-09-11 1:26:00 +0300
categories: [C, Data structures and Algorithms]
tags: [C, Data structures and Algorithms]
math: true
mermaid: true
render_with_liquid: false
image:
    path: 
---


Lớp vector trong C không có sẵn giống như trong C++ (vì C không hỗ trợ lập trình hướng đối tượng và các lớp như trong C++). Tuy nhiên, bạn có thể tự xây dựng một cấu trúc dữ liệu kiểu **vector** trong C bằng cách sử dụng mảng động và các thao tác quản lý bộ nhớ.

Dưới đây là một ví dụ về việc tạo một lớp vector đơn giản trong C để quản lý các số nguyên:

### Bước 1: Xây dựng cấu trúc `Vector` để chứa dữ liệu và kích thước.
```c
#include <stdio.h>
#include <stdlib.h>

// Cấu trúc cho Vector
typedef struct {
    int *data;      // Mảng động lưu dữ liệu
    size_t size;    // Số phần tử hiện tại
    size_t capacity; // Kích thước bộ nhớ đã cấp phát
} Vector;
```

### Bước 2: Khởi tạo vector
```c
void initVector(Vector *v) {
    v->size = 0;
    v->capacity = 1;  // Bắt đầu với dung lượng nhỏ
    v->data = (int *)malloc(v->capacity * sizeof(int));
    if (v->data == NULL) {
        printf("Không thể cấp phát bộ nhớ\n");
        exit(EXIT_FAILURE);
    }
}
```

### Bước 3: Hàm để thêm phần tử vào vector
Khi kích thước vượt quá dung lượng, cần phải mở rộng vector.
```c
void pushBack(Vector *v, int value) {
    if (v->size == v->capacity) {
        v->capacity *= 2;
        v->data = (int *)realloc(v->data, v->capacity * sizeof(int));
        if (v->data == NULL) {
            printf("Không thể cấp phát thêm bộ nhớ\n");
            exit(EXIT_FAILURE);
        }
    }
    v->data[v->size++] = value;
}
```

### Bước 4: Truy cập phần tử theo chỉ số
```c
int get(Vector *v, size_t index) {
    if (index >= v->size) {
        printf("Chỉ số ngoài phạm vi\n");
        exit(EXIT_FAILURE);
    }
    return v->data[index];
}
```

### Bước 5: Giải phóng bộ nhớ
```c
void freeVector(Vector *v) {
    free(v->data);
    v->data = NULL;
    v->size = 0;
    v->capacity = 0;
}
```

### Bước 6: Sử dụng vector
```c
int main() {
    Vector v;
    initVector(&v);

    // Thêm một vài phần tử vào vector
    pushBack(&v, 10);
    pushBack(&v, 20);
    pushBack(&v, 30);

    // In các phần tử trong vector
    for (size_t i = 0; i < v.size; i++) {
        printf("%d ", get(&v, i));
    }
    printf("\n");

    // Giải phóng bộ nhớ
    freeVector(&v);

    return 0;
}
```

### Giải thích ngắn:
- `initVector` khởi tạo vector với dung lượng ban đầu là 1 và cấp phát bộ nhớ.
- `pushBack` thêm phần tử mới vào cuối vector, và tự động mở rộng khi cần.
- `get` dùng để truy cập các phần tử trong vector.
- `freeVector` giải phóng bộ nhớ đã cấp phát khi vector không còn được sử dụng.
- `scanfVector` Hàm này cho phép người dùng nhập vào số lượng phần tử họ muốn thêm và các giá trị tương ứng. Nó sử dụng pushBack để thêm từng phần tử vào vector.
```c
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int *data;      // Mảng động lưu dữ liệu
    size_t size;    // Số phần tử hiện tại
    size_t capacity; // Kích thước bộ nhớ đã cấp phát
} Vector;

void initVector(Vector *v) {
    v->size = 0;
    v->capacity = 1;  // Bắt đầu với dung lượng nhỏ
    v->data = (int *)malloc(v->capacity * sizeof(int));
    if (v->data == NULL) {
        printf("Không thể cấp phát bộ nhớ\n");
        exit(EXIT_FAILURE);
    }
}

void pushBack(Vector *v, int value) {
    if (v->size == v->capacity) {
        v->capacity *= 2;
        v->data = (int *)realloc(v->data, v->capacity * sizeof(int));
        if (v->data == NULL) {
            printf("Không thể cấp phát thêm bộ nhớ\n");
            exit(EXIT_FAILURE);
        }
    }
    v->data[v->size++] = value;
}

int get(Vector *v, size_t index) {
    if (index >= v->size) {
        printf("Chỉ số ngoài phạm vi\n");
        exit(EXIT_FAILURE);
    }
    return v->data[index];
}

void scanfVector(Vector *v) {
    size_t n;
    int value;

    printf("Nhập số lượng phần tử cần thêm vào vector: ");
    scanf("%zu", &n); // Nhập số lượng phần tử

    for (size_t i = 0; i < n; i++) {
        printf("Nhập phần tử thứ %zu: ", i + 1);
        scanf("%d", &value); // Nhập giá trị cho phần tử
        pushBack(v, value);  // Thêm phần tử vào vector
    }
}

void freeVector(Vector *v) {
    free(v->data);
    v->data = NULL;
    v->size = 0;
    v->capacity = 0;
}

int main() {
    Vector v;
    initVector(&v);

    scanfVector(&v);

    printf("Các phần tử trong vector: ");
    for (size_t i = 0; i < v.size; i++) {
        printf("%d ", get(&v, i));
    }
    printf("\n");

    freeVector(&v);

    return 0;
}

```